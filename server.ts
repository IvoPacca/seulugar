import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Initialize Firebase Admin SDK from config
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  const adminApp = admin.initializeApp({
    projectId: firebaseConfig.projectId
  });
  const db = getFirestore(adminApp, firebaseConfig.firestoreDatabaseId);

  // Health and verification API
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Webhook Receiver API
  app.post('/api/webhook', async (req, res) => {
    const logId = 'WH-' + Math.floor(100000 + Math.random() * 900000);
    const receivedAt = new Date().toISOString();
    const method = req.method;
    const url = req.originalUrl || req.url;
    
    // Resolve client IP address safely
    let ip = req.ip || '127.0.0.1';
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      ip = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0].trim();
    }

    // Clean headers to be compatible with Firestore object keys (no dots/special characters in keys)
    const headersObj: Record<string, string> = {};
    Object.keys(req.headers).forEach((key) => {
      const val = req.headers[key];
      if (val !== undefined) {
        const cleanKey = key.replace(/[^a-zA-Z0-9_\-]/g, '_');
        headersObj[cleanKey] = Array.isArray(val) ? val.join(', ') : val;
      }
    });

    const queryObj: Record<string, string> = {};
    Object.keys(req.query).forEach((key) => {
      const val = req.query[key];
      if (val !== undefined) {
        const cleanKey = key.replace(/[^a-zA-Z0-9_\-]/g, '_');
        queryObj[cleanKey] = Array.isArray(val) ? val.join(', ') : String(val);
      }
    });

    const body = req.body || {};

    let status: 'logged' | 'processed' | 'error' = 'logged';
    let statusMessage = 'Evento de Webhook recebido e registado com sucesso.';

    // Deep scan payload for any SL-XXXXXX format pattern to trigger auto-reconciliation
    let targetOrderId: string | null = null;
    
    const scanForOrderId = (obj: any): string | null => {
      if (!obj || typeof obj !== 'object') return null;
      
      // Look for standard keys that typically specify order references
      const markers = ['orderId', 'order_id', 'id', 'reference', 'ref_code', 'pedido', 'orderReference', 'transaction'];
      for (const marker of markers) {
        const val = obj[marker];
        if (typeof val === 'string' && val.toUpperCase().startsWith('SL-')) {
          return val.toUpperCase();
        }
      }
      
      // Recursive scanning
      for (const key of Object.keys(obj)) {
        if (typeof obj[key] === 'object') {
          const found = scanForOrderId(obj[key]);
          if (found) return found;
        }
      }
      return null;
    };

    try {
      targetOrderId = scanForOrderId(body) || scanForOrderId(req.query);
      
      if (targetOrderId) {
        const orderRef = db.collection('orders').doc(targetOrderId);
        const orderSnap = await orderRef.get();
        if (orderSnap.exists) {
          // Update order status to approved in Firestore database
          await orderRef.update({ status: 'approved' });
          status = 'processed';
          statusMessage = `Encomenda ${targetOrderId} aprovada automaticamente via conciliação de Webhook.`;
        } else {
          statusMessage = `Encontrado identificador ${targetOrderId}, mas a encomenda correspondente não foi localizada.`;
        }
      }
    } catch (err: any) {
      console.error('Failed to reconcile order:', err);
      status = 'error';
      statusMessage = `Erro na conciliação da encomenda: ${err.message || String(err)}`;
    }

    // Prepare audit record for Firestore
    const logDoc = {
      id: logId,
      receivedAt,
      method,
      url,
      headers: headersObj,
      body: typeof body === 'object' ? body : { raw: String(body) },
      query: queryObj,
      ip: String(ip),
      status,
      statusMessage
    };

    try {
      await db.collection('webhook_logs').doc(logId).set(logDoc);
    } catch (dbErr) {
      console.error('Failed to save webhook log in firestore:', dbErr);
    }

    res.status(200).json({
      status: 'ok',
      message: statusMessage,
      received_id: logId
    });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running in ${process.env.NODE_ENV === 'production' ? 'production' : 'development'} mode on port ${PORT}`);
  });
}

startServer();
