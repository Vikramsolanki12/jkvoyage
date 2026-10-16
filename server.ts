import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { handleGeminiApi } from './src/server/geminiHandler.ts';
import { handleDocumentApi } from './src/server/documentHandler.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Enable JSON body parser with high ceiling for private document & photo uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Mount Private & Secure Cloud Document Upload API
  app.all('/api/documents/*', async (req, res) => {
    const handled = await handleDocumentApi(req, res);
    if (!handled && !res.headersSent) {
      res.status(404).json({ error: 'Document endpoint not found' });
    }
  });

  // Mount Gemini server API endpoints
  app.all('/api/gemini/*', async (req, res) => {
    const handled = await handleGeminiApi(req, res);
    if (!handled && !res.headersSent) {
      res.status(404).json({ error: 'Endpoint not found' });
    }
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
