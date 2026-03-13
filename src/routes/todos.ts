import express, { Router, Request, Response } from 'express';
import { TodoService } from '../services/TodoService';

const router: Router = express.Router();
const todoService = new TodoService();

// Get all todos
router.get('/', async (req: Request, res: Response) => {
  try {
    const todos = await todoService.getAllTodos();
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch todos', details: error instanceof Error ? error.message : error });
  }
});

// Get todos by date range
router.get('/range/:startDate/:endDate', async (req: Request, res: Response) => {
  try {
    const todos = await todoService.getTodosForDateRange(
      req.params.startDate,
      req.params.endDate
    );
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch todos', details: error instanceof Error ? error.message : error });
  }
});

// Get todos by date
router.get('/by-date/:date', async (req: Request, res: Response) => {
  try {
    const todos = await todoService.getTodosByDate(req.params.date);
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch todos', details: error instanceof Error ? error.message : error });
  }
});

// Get todo by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const todo = await todoService.getTodoById(req.params.id);
    if (!todo) {
      res.status(404).json({ error: 'Todo not found' });
    } else {
      res.json(todo);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch todo', details: error instanceof Error ? error.message : error });
  }
});

// Create todo
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, notes, date, time, repeatType, repeatDays, tagIds } = req.body;
    if (!title || !date) {
      res.status(400).json({ error: 'Title and date are required' });
      return;
    }

    const todo = await todoService.createTodo(
      title,
      notes,
      date,
      time,
      repeatType || 'NONE',
      repeatDays || [],
      tagIds || []
    );
    res.status(201).json(todo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create todo', details: error instanceof Error ? error.message : error });
  }
});

// Update todo
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { title, notes, date, time, repeatType, repeatDays, tagIds } = req.body;
    if (!title || !date) {
      res.status(400).json({ error: 'Title and date are required' });
      return;
    }

    const todo = await todoService.updateTodo(
      req.params.id,
      title,
      notes,
      date,
      time,
      repeatType || 'NONE',
      repeatDays || [],
      tagIds || []
    );
    if (!todo) {
      res.status(404).json({ error: 'Todo not found' });
    } else {
      res.json(todo);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update todo', details: error instanceof Error ? error.message : error });
  }
});

// Delete todo
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await todoService.deleteTodo(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Todo not found' });
    } else {
      res.status(204).send();
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete todo', details: error instanceof Error ? error.message : error });
  }
});

export default router;
