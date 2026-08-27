import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import { getDb } from './server/db';
import authRoutes from './server/routes/auth';
import hospitalRoutes from './server/routes/hospitals';
import patientRoutes from './server/routes/patient';
import doctorRoutes from './server/routes/doctor';
import caregiverRoutes from './server/routes/caregiver';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize SQLite database
  try {
    await getDb();
    console.log('CareFlow SQLite database initialized.');
  } catch (err) {
    console.error('Failed to initialize SQLite database:', err);
  }

  // Middlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/hospitals', hospitalRoutes);
  app.use('/api/patient', patientRoutes);
  app.use('/api/doctor', doctorRoutes);
  app.use('/api/caregiver', caregiverRoutes);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', app: 'CareFlow', timestamp: new Date().toISOString() });
  });

  // Vite middleware for development vs static for production
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
    console.log(`CareFlow Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Error starting server:', err);
});
