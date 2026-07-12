export interface SearchResult {
  book_id: string;
  book_title: string;
  filtered_title: string;
  book_pic: string;
  chapter_count: number;
}

export interface Episode {
  episode: number;
  chapter_id: string;
}

export interface VideoData {
  video_url: string;
  serial_number: number;
  duration: number;
}

export interface VideoResponse {
  video_url: string;
  episode: number;
  duration: number;
  next_episode: Episode | null;
}

export interface ChapterInfo {
  chapter_id: string;
  chapter_name: string;
  like_count: number;
  publish_at: string;
  create_time: string;
}

export interface BookInfoFull {
  book_title: string;
  filtered_title: string;
  book_pic: string;
  special_desc: string;
  chapter_count: number;
  book_id: string | null;
  chapter_base: ChapterInfo[];
}

export interface BookshelfData {
  bookshelf_name: string;
  books: BookInfoFull[];
}
