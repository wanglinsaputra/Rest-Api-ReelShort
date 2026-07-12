import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import ReelShortAPI from './reelshort';
import createRouter from './routes';

async function createApp() {
  const client = new ReelShortAPI();
  await client.init();

  const app = express();

  app.use(cors());
  app.use(express.json());

  const swaggerSpec = {
    openapi: '3.0.0',
    info: {
      title: 'ReelShort API',
      version: '1.0',
      description: 'API untuk mengakses konten ReelShort - Platform Nonton Drama China',
    },
    servers: [{ url: '/api/v1' }],
    paths: {
      '/reelshort/search': {
        get: {
          tags: ['ReelShort'],
          summary: 'Cari drama',
          parameters: [{ name: 'keywords', in: 'query', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Daftar drama ditemukan' }, '400': { description: 'Keywords required' } },
        },
      },
      '/reelshort/episodes/{book_id}': {
        get: {
          tags: ['ReelShort'],
          summary: 'Daftar episode',
          parameters: [
            { name: 'book_id', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'filtered_title', in: 'query', required: true, schema: { type: 'string' } },
          ],
          responses: { '200': { description: 'Daftar episode' }, '400': { description: 'filtered_title required' } },
        },
      },
      '/reelshort/video/{book_id}/{episode_num}': {
        get: {
          tags: ['ReelShort'],
          summary: 'URL video',
          parameters: [
            { name: 'book_id', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'episode_num', in: 'path', required: true, schema: { type: 'integer' } },
            { name: 'filtered_title', in: 'query', required: true, schema: { type: 'string' } },
            { name: 'chapter_id', in: 'query', required: true, schema: { type: 'string' } },
          ],
          responses: { '200': { description: 'URL video' }, '400': { description: 'filtered_title and chapter_id required' } },
        },
      },
      '/reelshort/dramadub': {
        get: {
          tags: ['Bookshelf'],
          summary: 'Bookshelf "Drama dengan Dub" - FULL DATA',
          responses: { '200': { description: 'Data bookshelf' } },
        },
      },
      '/reelshort/newrelease': {
        get: {
          tags: ['Bookshelf'],
          summary: 'Bookshelf "Rilis Baru" - FULL DATA',
          responses: { '200': { description: 'Data bookshelf' } },
        },
      },
      '/reelshort/recommended': {
        get: {
          tags: ['Bookshelf'],
          summary: 'Bookshelf "Lebih Direkomendasikan" - FULL DATA',
          responses: { '200': { description: 'Data bookshelf' } },
        },
      },
    },
  };
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  const router = createRouter(client);
  app.use('/api/v1/reelshort', router);

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  return app;
}

let app: express.Express | null = null;

export default async function handler(req: any, res: any) {
  if (!app) {
    app = await createApp();
  }
  return app(req, res);
}

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
  createApp().then((app) => {
    app.listen(PORT, () => {
      console.log(`ReelShort API running on port ${PORT}`);
      console.log(`Swagger docs: http://localhost:${PORT}/docs`);
    });
  });
}
