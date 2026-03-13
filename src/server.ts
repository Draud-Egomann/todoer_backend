import express, { Express } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { initDatabase, initializeSchema } from './database';
import { authMiddleware } from './middleware/auth';
import authRoutes from './routes/auth';
import todoRoutes from './routes/todos';
import tagRoutes from './routes/tags';
import completionRoutes from './routes/completions';
import checklistRoutes from './routes/checklists';
import statusRoutes from './routes/status';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;
const app: Express = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check endpoint (public, no auth required)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Authentication routes (public)
app.use('/api/auth', authRoutes);

// Protected API routes (require authentication)
app.use('/api/todos', authMiddleware, todoRoutes);
app.use('/api/tags', authMiddleware, tagRoutes);
app.use('/api/completions', authMiddleware, completionRoutes);
app.use('/api/checklists', authMiddleware, checklistRoutes);
app.use('/api/status', authMiddleware, statusRoutes);

// Initialize and start server
const startServer = async () => {
  try {
    await initDatabase();
    await initializeSchema();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 API Documentation available at http://localhost:${PORT}/docs (when available)`);
      console.log(`🔐 Auth endpoints:`);
      console.log(`   POST /api/auth/register - Register a new user`);
      console.log(`   POST /api/auth/login - Login and get token`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
