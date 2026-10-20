import express from 'express';
import { handleGeminiApi } from '../src/server/geminiHandler.ts';
import { handleDocumentApi } from '../src/server/documentHandler.ts';

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Document storage & view endpoints
app.all('/api/documents/*', async (req, res) => {
  const handled = await handleDocumentApi(req as any, res as any);
  if (!handled && !res.headersSent) {
    res.status(404).json({ error: 'Document endpoint not found' });
  }
});

// Gemini AI endpoints
app.all('/api/gemini/*', async (req, res) => {
  const handled = await handleGeminiApi(req, res);
  if (!handled && !res.headersSent) {
    res.status(404).json({ error: 'Endpoint not found' });
  }
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'JKVoyage API', timestamp: new Date().toISOString() });
});

export default app;
