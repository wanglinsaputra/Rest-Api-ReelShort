import axios from 'axios';
import {
  SearchResult,
  Episode,
  VideoData,
  ChapterInfo,
  BookInfoFull,
  BookshelfData,
} from './types';

interface RawChapter {
  chapter_id: string;
  chapter_name: string;
  like_count: number;
  publish_at: string;
  create_time: string;
}

interface RawBook {
  book_title: string;
  book_pic: string;
  special_desc: string;
  chapter_count: number;
  chapter_base: RawChapter[];
}

interface HallInfoResponse {
  pageProps: {
    fallback: {
      '/api/video/hall/info': {
        bookShelfList: {
          bookshelf_name: string;
          books: RawBook[];
        }[];
      };
    };
  };
}

class ReelShortAPI {
  private headers: Record<string, string>;
  private baseUrl: string | null = null;
  private buildId: string | null = null;

  constructor() {
    this.headers = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
      Referer: 'https://www.reelshort.com/',
      Origin: 'https://www.reelshort.com',
    };
  }

  async init(): Promise<void> {
    await this.updateBuildId();
  }

  private async updateBuildId(): Promise<void> {
    try {
      const homeUrl = 'https://www.reelshort.com/id';
      console.log(`Fetching build ID from ${homeUrl}`);
      const res = await axios.get(homeUrl, {
        headers: this.headers,
        timeout: 10000,
      });

      const match = res.data.match(/"buildId":"([^"]+)"/);
      if (match) {
        this.buildId = match[1];
        this.baseUrl = `https://www.reelshort.com/_next/data/${this.buildId}/id`;
        console.log(`Build ID: ${this.buildId}`);
      } else {
        const altMatch = res.data.match(/\/id\/_next\/data\/([^/]+)\//);
      if (altMatch) {
          this.buildId = altMatch[1];
          this.baseUrl = `https://www.reelshort.com/_next/data/${this.buildId}/id`;
        } else {
          throw new Error('Build ID not found');
        }
      }
    } catch (e) {
      console.error('Error getting build ID:', e);
      this.buildId = 'acf624d';
      this.baseUrl = `https://www.reelshort.com/_next/data/${this.buildId}/id`;
    }
  }

  private async makeRequest(url: string): Promise<any> {
    try {
      const res = await axios.get(url, {
        headers: this.headers,
        timeout: 15000,
      });

      if (typeof res.data === 'string' && res.data.includes('<!DOCTYPE html')) {
        console.warn('HTML received, build ID may be expired');
        await this.updateBuildId();
        const retryRes = await axios.get(url, {
          headers: this.headers,
          timeout: 15000,
        });
        return retryRes.data;
      }

      return res.data;
    } catch (e) {
      console.error('Request error:', e);
      throw e;
    }
  }

  async search(keywords: string): Promise<SearchResult[]> {
    const encoded = keywords.replace(/ /g, '+');
    const url = `${this.baseUrl}/search.json?keywords=${encoded}`;

    try {
      const data = await this.makeRequest(url);
      const books = data?.pageProps?.books ?? [];
      return books.map((book: any) => ({
        book_id: book._id,
        book_title: book.book_title,
        filtered_title: this.filterTitle(book.book_title ?? ''),
        book_pic: book.book_pic,
        chapter_count: book.chapter_count ?? 0,
      }));
    } catch (e) {
      console.error('Search error:', e);
      return [];
    }
  }

  async getEpisodes(
    bookId: string,
    filteredTitle: string
  ): Promise<Episode[]> {
    const url = `${this.baseUrl}/movie/${filteredTitle}-${bookId}.json?slug=${filteredTitle}-${bookId}`;

    try {
      const data = await this.makeRequest(url);
      const episodes = data?.pageProps?.data?.online_base ?? [];
      return episodes.map((ep: any) => ({
        episode: ep.serial_number,
        chapter_id: ep.chapter_id,
      }));
    } catch (e) {
      console.error('Get episodes error:', e);
      return [];
    }
  }

  async getVideoUrl(
    episodeNum: number,
    filteredTitle: string,
    bookId: string,
    chapterId: string
  ): Promise<VideoData | null> {
    const url = `${this.baseUrl}/episodes/episode-${episodeNum}-${filteredTitle}-${bookId}-${chapterId}.json?play_time=1&slug=episode-${episodeNum}-${filteredTitle}-${bookId}-${chapterId}`;

    try {
      const data = await this.makeRequest(url);
      const ep = data?.pageProps?.data ?? {};
      return {
        video_url: ep.video_url ?? '',
        serial_number: ep.serial_number ?? 0,
        duration: ep.duration ?? 0,
      };
    } catch (e) {
      console.error('Get video error:', e);
      return null;
    }
  }

  private async getRawBookshelves(): Promise<any[] | null> {
    const url = `${this.baseUrl}.json`;
    try {
      const data: HallInfoResponse = await this.makeRequest(url);
      return (
        data?.pageProps?.fallback?.['/api/video/hall/info']?.bookShelfList ??
        null
      );
    } catch (e) {
      console.error('Fetch bookshelves error:', e);
      return null;
    }
  }

  private async getBookIdFromSearch(
    filteredTitle: string
  ): Promise<string | null> {
    try {
      const results = await this.search(filteredTitle);
      for (const r of results) {
        if (r.filtered_title === filteredTitle) return r.book_id;
      }
      for (const r of results) {
        if (this.filterTitle(r.book_title) === filteredTitle) return r.book_id;
      }
      return null;
    } catch (e) {
      console.error('Get book_id error:', e);
      return null;
    }
  }

  private async parseShelfData(shelf: any): Promise<BookshelfData> {
    const shelfName = shelf.bookshelf_name;
    const books: RawBook[] = shelf.books ?? [];

    const bookInfos: BookInfoFull[] = [];
    for (const book of books) {
      const filteredTitle = this.filterTitle(book.book_title ?? '');
      const bookId = await this.getBookIdFromSearch(filteredTitle);

      bookInfos.push({
        book_title: book.book_title,
        filtered_title: filteredTitle,
        book_pic: book.book_pic,
        special_desc: (book as any).special_desc ?? '',
        chapter_count: book.chapter_count ?? 0,
        book_id: bookId,
        chapter_base: (book.chapter_base ?? []).map(
          (ch: RawChapter) => ({
            chapter_id: ch.chapter_id,
            chapter_name: ch.chapter_name,
            like_count: ch.like_count ?? 0,
            publish_at: ch.publish_at ?? '',
            create_time: ch.create_time ?? '',
          })
        ),
      });
    }

    return {
      bookshelf_name: shelfName,
      books: bookInfos,
    };
  }

  private enrichWithBookIds(shelf: BookshelfData): BookshelfData {
    return shelf;
  }

  
  async getDramaDub(): Promise<{ data: BookshelfData | null; error: string | null }> {
    const list = await this.getRawBookshelves();
    if (!list) return { data: null, error: 'Failed to fetch bookshelf data' };

    const shelf = list.find((s) => s.bookshelf_name === 'Drama dengan Dub🎧');
    if (!shelf) {
      const avail = list.map((s) => s.bookshelf_name);
      return { data: null, error: `'Drama dengan dub' not found. Available: ${avail.join(', ')}` };
    }

    return { data: await this.parseShelfData(shelf), error: null };
  }

  async getNewRelease(): Promise<{ data: BookshelfData | null; error: string | null }> {
    const list = await this.getRawBookshelves();
    if (!list) return { data: null, error: 'Failed to fetch bookshelf data' };

    const shelf = list.find((s) => s.bookshelf_name === 'Rilis Baru💥');
    if (!shelf) {
      const avail = list.map((s) => s.bookshelf_name);
      return { data: null, error: `'Rilis Baru' not found. Available: ${avail.join(', ')}` };
    }

    return { data: await this.parseShelfData(shelf), error: null };
  }

  async getRecommended(): Promise<{ data: BookshelfData | null; error: string | null }> {
    const list = await this.getRawBookshelves();
    if (!list) return { data: null, error: 'Failed to fetch bookshelf data' };

    const shelf = list.find((s) => s.bookshelf_name === 'Lebih Direkomendasikan 🔍');
    if (!shelf) {
      const avail = list.map((s) => s.bookshelf_name);
      return { data: null, error: `'Lebih Direkomendasikan' not found. Available: ${avail.join(', ')}` };
    }

    return { data: await this.parseShelfData(shelf), error: null };
  }

  filterTitle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/ /g, '-');
  }
}

export default ReelShortAPI;
