import express, { Express } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { initDatabase, initializeSchema } from './database';
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

// Routes
app.use('/api/todos', todoRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/completions', completionRoutes);
app.use('/api/checklists', checklistRoutes);
app.use('/api/status', statusRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize and start server
const startServer = async () => {
  try {
    await initDatabase();
    await initializeSchema();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 API Documentation available at http://localhost:${PORT}/docs (when available)`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
