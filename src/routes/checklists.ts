import express, { Router, Request, Response } from 'express';
import { ChecklistService } from '../services/ChecklistService';

const router: Router = express.Router();
const checklistService = new ChecklistService();

// Get checklist items for a todo
router.get('/todo/:todoId', async (req: Request, res: Response) => {
  try {
    const items = await checklistService.getChecklistItems(req.params.todoId);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch checklist items', details: error instanceof Error ? error.message : error });
  }
});

// Get checklist stats for a todo
router.get('/todo/:todoId/stats', async (req: Request, res: Response) => {
  try {
    const stats = await checklistService.getChecklistStats(req.params.todoId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch checklist stats', details: error instanceof Error ? error.message : error });
  }
});

// Get checklist item by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const item = await checklistService.getChecklistItem(req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Checklist item not found' });
    } else {
      res.json(item);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch checklist item', details: error instanceof Error ? error.message : error });
  }
});

// Create checklist item
router.post('/', async (req: Request, res: Response) => {
  try {
    const { todoId, text } = req.body;
    if (!todoId || !text) {
      res.status(400).json({ error: 'Todo ID and text are required' });
      return;
    }

    const item = await checklistService.createChecklistItem(todoId, text);
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create checklist item', details: error instanceof Error ? error.message : error });
  }
});

// Update checklist item
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { text, completed } = req.body;
    if (text === undefined || completed === undefined) {
      res.status(400).json({ error: 'Text and completed status are required' });
      return;
    }

    const item = await checklistService.updateChecklistItem(req.params.id, text, completed);
    if (!item) {
      res.status(404).json({ error: 'Checklist item not found' });
    } else {
      res.json(item);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update checklist item', details: error instanceof Error ? error.message : error });
  }
});

// Toggle checklist item completion
router.patch('/:id/toggle', async (req: Request, res: Response) => {
  try {
    const item = await checklistService.toggleChecklistItem(req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Checklist item not found' });
    } else {
      res.json(item);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle checklist item', details: error instanceof Error ? error.message : error });
  }
});

// Delete checklist item
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await checklistService.deleteChecklistItem(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Checklist item not found' });
    } else {
      res.status(204).send();
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete checklist item', details: error instanceof Error ? error.message : error });
  }
});

export default router;
