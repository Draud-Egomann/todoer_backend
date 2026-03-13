import express, { Router, Request, Response } from 'express';
import { TodoService } from '../services/TodoService';
import { CompletionService } from '../services/CompletionService';

const router: Router = express.Router();
const todoService = new TodoService();
const completionService = new CompletionService();

// Get overall status - useful for Home Assistant
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    const queryDate = date ? new Date(date as string).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    const todos = await todoService.getTodosByDate(queryDate);
    const completions = await completionService.getCompletionsForDate(queryDate);

    const completionMap = new Map(completions.map(c => [c.todo_id, c.completed]));

    const stats = {
      date: queryDate,
      total_todos: todos.length,
      completed_todos: completions.filter(c => c.completed).length,
      pending_todos: todos.length - completions.filter(c => c.completed).length,
      completion_percentage: todos.length > 0 ? Math.round((completions.filter(c => c.completed).length / todos.length) * 100) : 0,
      todos: todos.map(todo => ({
        id: todo.id,
        title: todo.title,
        time: todo.time,
        completed: completionMap.get(todo.id) ?? false,
        tags: todo.tags
      }))
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch status summary', details: error instanceof Error ? error.message : error });
  }
});

// Get status for date range - useful for analytics
router.get('/range/:startDate/:endDate', async (req: Request, res: Response) => {
  try {
    const todos = await todoService.getTodosForDateRange(
      req.params.startDate,
      req.params.endDate
    );
    const completions = await completionService.getCompletionsForDateRange(
      req.params.startDate,
      req.params.endDate
    );

    const completedCount = completions.filter(c => c.completed).length;
    const totalCount = completions.length;

    res.json({
      date_range: {
        start: req.params.startDate,
        end: req.params.endDate
      },
      total_todos: todos.length,
      total_completions: totalCount,
      completed_completions: completedCount,
      completion_percentage: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
      daily_stats: await generateDailyStats(req.params.startDate, req.params.endDate)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch status range', details: error instanceof Error ? error.message : error });
  }
});

// Get status for today
router.get('/today', async (req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const todos = await todoService.getTodosByDate(today);
    const completions = await completionService.getCompletionsForDate(today);

    const completionMap = new Map(completions.map(c => [c.todo_id, c.completed]));

    const stats = {
      date: today,
      total_todos: todos.length,
      completed_todos: completions.filter(c => c.completed).length,
      pending_todos: todos.length - completions.filter(c => c.completed).length,
      completion_percentage: todos.length > 0 ? Math.round((completions.filter(c => c.completed).length / todos.length) * 100) : 0,
      todos: todos.map(todo => ({
        id: todo.id,
        title: todo.title,
        time: todo.time,
        completed: completionMap.get(todo.id) ?? false,
        tags: todo.tags || []
      }))
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch today\'s status', details: error instanceof Error ? error.message : error });
  }
});

// Get completion rate by tag
router.get('/by-tag', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate as string || new Date().toISOString().split('T')[0];
    const end = endDate as string || new Date().toISOString().split('T')[0];

    const todos = await todoService.getTodosForDateRange(start, end);
    const completions = await completionService.getCompletionsForDateRange(start, end);

    const completionMap = new Map(completions.map(c => [c.todo_id, c.completed]));

    // Group by tags
    const tagStats = new Map<string, { total: number; completed: number }>();

    todos.forEach(todo => {
      (todo.tags || []).forEach(tagId => {
        const current = tagStats.get(tagId) || { total: 0, completed: 0 };
        current.total += 1;
        if (completionMap.get(todo.id)) {
          current.completed += 1;
        }
        tagStats.set(tagId, current);
      });
    });

    const tagStatusArray = Array.from(tagStats.entries()).map(([tagId, stats]) => ({
      tag_id: tagId,
      total_todos: stats.total,
      completed_todos: stats.completed,
      completion_percentage: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
    }));

    res.json({
      date_range: { start, end },
      tags: tagStatusArray
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tag status', details: error instanceof Error ? error.message : error });
  }
});

// Helper function to generate daily stats
async function generateDailyStats(startDate: string, endDate: string): Promise<any[]> {
  const stats = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    const todos = await todoService.getTodosByDate(dateStr);
    const completions = await completionService.getCompletionsForDate(dateStr);

    stats.push({
      date: dateStr,
      total: todos.length,
      completed: completions.filter(c => c.completed).length,
      percentage: todos.length > 0 ? Math.round((completions.filter(c => c.completed).length / todos.length) * 100) : 0
    });

    current.setDate(current.getDate() + 1);
  }

  return stats;
}

export default router;
