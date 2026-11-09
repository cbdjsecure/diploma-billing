import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from './server/database.js';
import { seedRatesAndSettings } from './server/seed-rates.js';

import centresRouter from './server/routes/centres.js';
import ratesRouter from './server/routes/rates.js';
import billsRouter from './server/routes/bills.js';
import settingsRouter from './server/routes/settings.js';
import exportRouter from './server/routes/export.js';
import authRouter from './server/routes/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize DB seed on start
seedRatesAndSettings();

// API Routes
app.use('/api/centres', centresRouter);
app.use('/api/rates', ratesRouter);
app.use('/api/bills', billsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/export', exportRouter);
app.use('/api/auth', authRouter);

// Serve static build in production
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Serve uploaded payment screenshots
const uploadsPath = path.join(__dirname, 'data', 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('API Server is running on port ' + PORT + '. Frontend Vite dev server is on port 5173.');
    }
  });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

