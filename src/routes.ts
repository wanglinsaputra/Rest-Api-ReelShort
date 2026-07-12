import { Router, Request, Response } from 'express';
import ReelShortAPI from './reelshort';

export default function createRouter(client: ReelShortAPI): Router {
  const router = Router();

  
  router.get('/search', async (req: Request, res: Response) => {
    try {
      const keywords = String(req.query.keywords ?? '');
      if (!keywords) {
        return res.status(400).json({ error: 'Keywords required' });
      }
      const results = await client.search(keywords);
      return res.json({ results });
    } catch (e: any) {
      return res.status(500).json({ error: 'Search failed', details: e.message });
    }
  });

  
  router.get('/episodes/:book_id', async (req: Request, res: Response) => {
    try {
      const book_id = String(req.params.book_id ?? '');
      const filteredTitle = String(req.query.filtered_title ?? '');
      if (!filteredTitle) {
        return res.status(400).json({ error: 'filtered_title required' });
      }
      const episodes = await client.getEpisodes(book_id, filteredTitle);
      return res.json({ episodes });
    } catch (e: any) {
      return res.status(500).json({ error: 'Failed to get episodes', details: e.message });
    }
  });

  
  router.get('/video/:book_id/:episode_num', async (req: Request, res: Response) => {
    try {
      const book_id = String(req.params.book_id ?? '');
      const episode_num = String(req.params.episode_num ?? '');
      const filteredTitle = String(req.query.filtered_title ?? '');
      const chapterId = String(req.query.chapter_id ?? '');

      if (!filteredTitle || !chapterId) {
        return res.status(400).json({ error: 'filtered_title and chapter_id required' });
      }

      const videoData = await client.getVideoUrl(
        parseInt(episode_num, 10),
        filteredTitle,
        book_id,
        chapterId
      );

      if (!videoData || !videoData.video_url) {
        return res.status(404).json({ error: 'Video not found' });
      }

      const episodes = await client.getEpisodes(book_id, filteredTitle);
      let nextEpisode: { episode: number; chapter_id: string } | null = null;

      const idx = episodes.findIndex((e) => e.episode === parseInt(episode_num, 10));
      if (idx !== -1 && idx + 1 < episodes.length) {
        nextEpisode = {
          episode: episodes[idx + 1].episode,
          chapter_id: episodes[idx + 1].chapter_id,
        };
      }

      return res.json({
        video_url: videoData.video_url,
        episode: videoData.serial_number,
        duration: videoData.duration,
        next_episode: nextEpisode,
      });
    } catch (e: any) {
      return res.status(500).json({ error: 'Failed to get video', details: e.message });
    }
  });

  

  
  router.get('/dramadub', async (_req: Request, res: Response) => {
    try {
      const { data, error } = await client.getDramaDub();
      if (error) {
        const status = error.includes('Failed to fetch') ? 500 : 404;
        return res.status(status).json({ error });
      }
      return res.json(data);
    } catch (e: any) {
      return res.status(500).json({ error: 'Server error', details: e.message });
    }
  });

  
  router.get('/newrelease', async (_req: Request, res: Response) => {
    try {
      const { data, error } = await client.getNewRelease();
      if (error) {
        const status = error.includes('Failed to fetch') ? 500 : 404;
        return res.status(status).json({ error });
      }
      return res.json(data);
    } catch (e: any) {
      return res.status(500).json({ error: 'Server error', details: e.message });
    }
  });

  
  router.get('/recommended', async (_req: Request, res: Response) => {
    try {
      const { data, error } = await client.getRecommended();
      if (error) {
        const status = error.includes('Failed to fetch') ? 500 : 404;
        return res.status(status).json({ error });
      }
      return res.json(data);
    } catch (e: any) {
      return res.status(500).json({ error: 'Server error', details: e.message });
    }
  });

  return router;
}
