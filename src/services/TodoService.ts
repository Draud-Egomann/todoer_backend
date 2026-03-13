import { getDatabase } from '../database';
import { v4 as uuidv4 } from 'uuid';

export interface Todo {
  id: string;
  title: string;
  notes?: string;
  date: string;
  time?: string;
  repeat_type: string;
  repeat_days?: number[];
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

export class TodoService {
  async getAllTodos(): Promise<Todo[]> {
    const db = getDatabase();
    const todos = await db.all<Todo>(
      'SELECT * FROM todos ORDER BY date ASC, time ASC'
    );

    // Fetch tags for each todo
    for (const todo of todos) {
      todo.tags = await this.getTodoTags(todo.id);
      if (todo.repeat_days && typeof todo.repeat_days === 'string') {
        todo.repeat_days = JSON.parse(todo.repeat_days);
      }
    }

    return todos;
  }

  async getTodoById(id: string): Promise<Todo | undefined> {
    const db = getDatabase();
    const todo = await db.get<Todo>('SELECT * FROM todos WHERE id = ?', [id]);

    if (todo) {
      todo.tags = await this.getTodoTags(todo.id);
      if (todo.repeat_days && typeof todo.repeat_days === 'string') {
        todo.repeat_days = JSON.parse(todo.repeat_days);
      }
    }

    return todo;
  }

  async getTodosByDate(date: string): Promise<Todo[]> {
    const db = getDatabase();
    const todos = await db.all<Todo>(
      'SELECT * FROM todos WHERE date = ? ORDER BY time ASC',
      [date]
    );

    for (const todo of todos) {
      todo.tags = await this.getTodoTags(todo.id);
      if (todo.repeat_days && typeof todo.repeat_days === 'string') {
        todo.repeat_days = JSON.parse(todo.repeat_days);
      }
    }

    return todos;
  }

  async createTodo(
    title: string,
    notes: string | undefined,
    date: string,
    time: string | undefined,
    repeatType: string,
    repeatDays: number[],
    tagIds: string[] = []
  ): Promise<Todo> {
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();
    const repeatDaysJson = JSON.stringify(repeatDays);

    await db.run(
      `INSERT INTO todos (id, title, notes, date, time, repeat_type, repeat_days, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, title, notes, date, time, repeatType, repeatDaysJson, now, now]
    );

    // Add tags
    for (const tagId of tagIds) {
      await db.run(
        'INSERT INTO todo_tags (todo_id, tag_id) VALUES (?, ?)',
        [id, tagId]
      );
    }

    return this.getTodoById(id) as Promise<Todo>;
  }

  async updateTodo(
    id: string,
    title: string,
    notes: string | undefined,
    date: string,
    time: string | undefined,
    repeatType: string,
    repeatDays: number[],
    tagIds: string[] = []
  ): Promise<Todo | undefined> {
    const db = getDatabase();
    const now = new Date().toISOString();
    const repeatDaysJson = JSON.stringify(repeatDays);

    await db.run(
      `UPDATE todos SET title = ?, notes = ?, date = ?, time = ?, repeat_type = ?, repeat_days = ?, updated_at = ?
       WHERE id = ?`,
      [title, notes, date, time, repeatType, repeatDaysJson, now, id]
    );

    // Update tags
    await db.run('DELETE FROM todo_tags WHERE todo_id = ?', [id]);
    for (const tagId of tagIds) {
      await db.run(
        'INSERT INTO todo_tags (todo_id, tag_id) VALUES (?, ?)',
        [id, tagId]
      );
    }

    return this.getTodoById(id);
  }

  async deleteTodo(id: string): Promise<boolean> {
    const db = getDatabase();
    const result = await db.run('DELETE FROM todos WHERE id = ?', [id]);
    return (result as any).changes > 0;
  }

  async getTodoTags(todoId: string): Promise<string[]> {
    const db = getDatabase();
    const rows = await db.all<{ tag_id: string }>(
      'SELECT tag_id FROM todo_tags WHERE todo_id = ?',
      [todoId]
    );
    return rows.map(row => row.tag_id);
  }

  async getTodosForDateRange(startDate: string, endDate: string): Promise<Todo[]> {
    const db = getDatabase();
    const todos = await db.all<Todo>(
      'SELECT * FROM todos WHERE date BETWEEN ? AND ? ORDER BY date ASC, time ASC',
      [startDate, endDate]
    );

    for (const todo of todos) {
      todo.tags = await this.getTodoTags(todo.id);
      if (todo.repeat_days && typeof todo.repeat_days === 'string') {
        todo.repeat_days = JSON.parse(todo.repeat_days);
      }
    }

    return todos;
  }
}
