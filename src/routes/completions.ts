import express, { Router, Request, Response } from 'express';
import { CompletionService } from '../services/CompletionService';

const router: Router = express.Router();
const completionService = new CompletionService();

// Get completions for a todo
router.get('/todo/:todoId', async (req: Request, res: Response) => {
  try {
    const completions = await completionService.getCompletionsByTodoId(req.params.todoId);
    res.json(completions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch completions', details: error instanceof Error ? error.message : error });
  }
});

// Get completion for specific date
router.get('/todo/:todoId/date/:date', async (req: Request, res: Response) => {
  try {
    const completion = await completionService.getCompletion(req.params.todoId, req.params.date);
    if (!completion) {
      res.status(404).json({ error: 'Completion not found' });
    } else {
      res.json(completion);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch completion', details: error instanceof Error ? error.message : error });
  }
});

// Get completions for a date
router.get('/date/:date', async (req: Request, res: Response) => {
  try {
    const completions = await completionService.getCompletionsForDate(req.params.date);
    res.json(completions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch completions', details: error instanceof Error ? error.message : error });
  }
});

// Get completions for date range
router.get('/range/:startDate/:endDate', async (req: Request, res: Response) => {
  try {
    const completions = await completionService.getCompletionsForDateRange(
      req.params.startDate,
      req.params.endDate
    );
    res.json(completions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch completions', details: error instanceof Error ? error.message : error });
  }
});

// Get statistics
router.get('/stats/summary', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const stats = await completionService.getStatistics(
      startDate as string | undefined,
      endDate as string | undefined
    );
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch statistics', details: error instanceof Error ? error.message : error });
  }
});

// Set completion status
router.post('/todo/:todoId/date/:date', async (req: Request, res: Response) => {
  try {
    const { completed } = req.body;
    if (completed === undefined) {
      res.status(400).json({ error: 'Completed status is required' });
      return;
    }

    const completion = await completionService.setCompletion(
      req.params.todoId,
      req.params.date,
      completed
    );
    res.status(201).json(completion);
  } catch (error) {
    res.status(500).json({ error: 'Failed to set completion', details: error instanceof Error ? error.message : error });
  }
});

// Delete completion
router.delete('/todo/:todoId/date/:date', async (req: Request, res: Response) => {
  try {
    const deleted = await completionService.deleteCompletion(req.params.todoId, req.params.date);
    if (!deleted) {
      res.status(404).json({ error: 'Completion not found' });
    } else {
      res.status(204).send();
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete completion', details: error instanceof Error ? error.message : error });
  }
});

export default router;
