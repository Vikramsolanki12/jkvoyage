import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

interface StoredDocument {
  id: string;
  tripId?: string;
  ownerId?: string;
  fileName: string;
  fileType: 'pdf' | 'image' | 'other';
  mimeType: string;
  sizeBytes: number;
  dataBase64: string;
  createdAt: string;
}

// In-memory registry backed by local private file storage
const documentStore = new Map<string, StoredDocument>();
const STORAGE_DIR = path.resolve(process.cwd(), '.private_storage', 'documents');

try {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  } else {
    // Restore any existing docs
    const files = fs.readdirSync(STORAGE_DIR);
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const raw = fs.readFileSync(path.join(STORAGE_DIR, file), 'utf8');
          const doc: StoredDocument = JSON.parse(raw);
          documentStore.set(doc.id, doc);
        } catch {
          // ignore corrupted files
        }
      }
    }
  }
} catch (e) {
  console.warn('Document storage directory initialization:', e);
}

function saveToDisk(doc: StoredDocument) {
  try {
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }
    fs.writeFileSync(path.join(STORAGE_DIR, `${doc.id}.json`), JSON.stringify(doc), 'utf8');
  } catch (err) {
    console.warn('Failed to persist document to disk:', err);
  }
}

function removeFromDisk(id: string) {
  try {
    const filePath = path.join(STORAGE_DIR, `${id}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.warn('Failed to remove document from disk:', err);
  }
}

export async function handleDocumentApi(req: Request, res: Response): Promise<boolean> {
  const url = req.url || '';

  // 1. UPLOAD: POST /api/documents/upload
  if (req.method === 'POST' && url.startsWith('/api/documents/upload')) {
    try {
      const { fileName, fileType, fileData, tripId, ownerId } = req.body || {};

      if (!fileData || typeof fileData !== 'string') {
        res.status(400).json({ error: 'Missing or invalid fileData' });
        return true;
      }

      const id = 'cld_' + Date.now() + '_' + crypto.randomBytes(6).toString('hex');
      let mimeType = 'application/octet-stream';
      let cleanBase64 = fileData;

      // Extract MIME type if data URL
      const match = fileData.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        cleanBase64 = match[2];
      } else if (fileType === 'pdf' || fileName?.toLowerCase().endsWith('.pdf')) {
        mimeType = 'application/pdf';
      } else if (fileType === 'image') {
        mimeType = 'image/jpeg';
      }

      const buffer = Buffer.from(cleanBase64, 'base64');
      const sizeBytes = buffer.length;

      const doc: StoredDocument = {
        id,
        tripId: tripId || 'unassigned',
        ownerId: ownerId || 'anonymous',
        fileName: fileName || 'travel_document',
        fileType: fileType === 'pdf' || mimeType.includes('pdf') ? 'pdf' : (mimeType.startsWith('image/') ? 'image' : 'other'),
        mimeType,
        sizeBytes,
        dataBase64: fileData,
        createdAt: new Date().toISOString()
      };

      documentStore.set(id, doc);
      saveToDisk(doc);

      res.status(200).json({
        success: true,
        documentId: id,
        fileUrl: `/api/documents/view/${id}`,
        downloadUrl: `/api/documents/download/${id}`,
        fileName: doc.fileName,
        fileType: doc.fileType,
        sizeBytes: doc.sizeBytes,
        createdAt: doc.createdAt
      });
      return true;
    } catch (err: any) {
      console.error('Document upload error:', err);
      res.status(500).json({ error: 'Failed to upload document securely: ' + err.message });
      return true;
    }
  }

  // 2. VIEW: GET /api/documents/view/:id
  if (req.method === 'GET' && url.startsWith('/api/documents/view/')) {
    const id = url.split('/api/documents/view/')[1]?.split('?')[0];
    const doc = documentStore.get(id);

    if (!doc) {
      res.status(404).send('Document not found or access expired');
      return true;
    }

    // Set secure headers
    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.fileName)}"`);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    const match = doc.dataBase64.match(/^data:([^;]+);base64,(.+)$/);
    const base64Data = match ? match[2] : doc.dataBase64;
    const buffer = Buffer.from(base64Data, 'base64');
    res.send(buffer);
    return true;
  }

  // 3. DOWNLOAD: GET /api/documents/download/:id
  if (req.method === 'GET' && url.startsWith('/api/documents/download/')) {
    const id = url.split('/api/documents/download/')[1]?.split('?')[0];
    const doc = documentStore.get(id);

    if (!doc) {
      res.status(404).send('Document not found');
      return true;
    }

    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.fileName)}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');

    const match = doc.dataBase64.match(/^data:([^;]+);base64,(.+)$/);
    const base64Data = match ? match[2] : doc.dataBase64;
    const buffer = Buffer.from(base64Data, 'base64');
    res.send(buffer);
    return true;
  }

  // 4. DELETE: DELETE /api/documents/:id
  if (req.method === 'DELETE' && url.startsWith('/api/documents/')) {
    const id = url.split('/api/documents/')[1]?.split('?')[0];
    if (documentStore.has(id)) {
      documentStore.delete(id);
      removeFromDisk(id);
      res.status(200).json({ success: true });
      return true;
    }
    res.status(404).json({ error: 'Document not found' });
    return true;
  }

  return false;
}
