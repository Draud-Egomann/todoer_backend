import { getDatabase } from '../database';
import { v4 as uuidv4 } from 'uuid';

export interface TodoCompletion {
  id: string;
  todo_id: string;
  date: string;
  completed: boolean;
  completed_at?: string;
  created_at?: string;
}

export class CompletionService {
  async getCompletionsByTodoId(todoId: string): Promise<TodoCompletion[]> {
    const db = getDatabase();
    return db.all<TodoCompletion>(
      'SELECT * FROM todo_completions WHERE todo_id = ? ORDER BY date DESC',
      [todoId]
    );
  }

  async getCompletion(todoId: string, date: string): Promise<TodoCompletion | undefined> {
    const db = getDatabase();
    return db.get<TodoCompletion>(
      'SELECT * FROM todo_completions WHERE todo_id = ? AND date = ?',
      [todoId, date]
    );
  }

  async getCompletionsForDate(date: string): Promise<TodoCompletion[]> {
    const db = getDatabase();
    return db.all<TodoCompletion>(
      'SELECT * FROM todo_completions WHERE date = ?',
      [date]
    );
  }

  async getCompletionsForDateRange(startDate: string, endDate: string): Promise<TodoCompletion[]> {
    const db = getDatabase();
    return db.all<TodoCompletion>(
      'SELECT * FROM todo_completions WHERE date BETWEEN ? AND ? ORDER BY date DESC',
      [startDate, endDate]
    );
  }

  async setCompletion(todoId: string, date: string, completed: boolean): Promise<TodoCompletion> {
    const db = getDatabase();
    const existingCompletion = await this.getCompletion(todoId, date);

    if (existingCompletion) {
      const completedAt = completed ? new Date().toISOString() : null;
      await db.run(
        'UPDATE todo_completions SET completed = ?, completed_at = ? WHERE todo_id = ? AND date = ?',
        [completed ? 1 : 0, completedAt, todoId, date]
      );
      return this.getCompletion(todoId, date) as Promise<TodoCompletion>;
    } else {
      const id = uuidv4();
      const now = new Date().toISOString();
      const completedAt = completed ? now : null;

      await db.run(
        `INSERT INTO todo_completions (id, todo_id, date, completed, completed_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, todoId, date, completed ? 1 : 0, completedAt, now]
      );

      return this.getCompletion(todoId, date) as Promise<TodoCompletion>;
    }
  }

  async deleteCompletion(todoId: string, date: string): Promise<boolean> {
    const db = getDatabase();
    const result = await db.run(
      'DELETE FROM todo_completions WHERE todo_id = ? AND date = ?',
      [todoId, date]
    );
    return (result as any).changes > 0;
  }

  async getStatistics(startDate?: string, endDate?: string): Promise<any> {
    const db = getDatabase();
    let query = 'SELECT * FROM todo_completions WHERE completed = 1';
    const params: any[] = [];

    if (startDate && endDate) {
      query += ' AND date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    const completedTodos = await db.all(query, params);

    return {
      total_completed: completedTodos.length,
      date_range: { start: startDate, end: endDate }
    };
  }
}
