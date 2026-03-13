import { getDatabase } from '../database';
import { v4 as uuidv4 } from 'uuid';

export interface ChecklistItem {
  id: string;
  todo_id: string;
  text: string;
  completed: boolean;
  created_at?: string;
  updated_at?: string;
}

export class ChecklistService {
  async getChecklistItems(todoId: string): Promise<ChecklistItem[]> {
    const db = getDatabase();
    return db.all<ChecklistItem>(
      'SELECT * FROM checklist_items WHERE todo_id = ? ORDER BY created_at ASC',
      [todoId]
    );
  }

  async getChecklistItem(id: string): Promise<ChecklistItem | undefined> {
    const db = getDatabase();
    return db.get<ChecklistItem>(
      'SELECT * FROM checklist_items WHERE id = ?',
      [id]
    );
  }

  async createChecklistItem(todoId: string, text: string): Promise<ChecklistItem> {
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO checklist_items (id, todo_id, text, completed, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, todoId, text, 0, now, now]
    );

    return this.getChecklistItem(id) as Promise<ChecklistItem>;
  }

  async updateChecklistItem(id: string, text: string, completed: boolean): Promise<ChecklistItem | undefined> {
    const db = getDatabase();
    const now = new Date().toISOString();

    await db.run(
      'UPDATE checklist_items SET text = ?, completed = ?, updated_at = ? WHERE id = ?',
      [text, completed ? 1 : 0, now, id]
    );

    return this.getChecklistItem(id);
  }

  async toggleChecklistItem(id: string): Promise<ChecklistItem | undefined> {
    const db = getDatabase();
    const item = await this.getChecklistItem(id);

    if (!item) return undefined;

    return this.updateChecklistItem(id, item.text, !item.completed);
  }

  async deleteChecklistItem(id: string): Promise<boolean> {
    const db = getDatabase();
    const result = await db.run(
      'DELETE FROM checklist_items WHERE id = ?',
      [id]
    );
    return (result as any).changes > 0;
  }

  async deleteChecklistItemsByTodoId(todoId: string): Promise<boolean> {
    const db = getDatabase();
    const result = await db.run(
      'DELETE FROM checklist_items WHERE todo_id = ?',
      [todoId]
    );
    return (result as any).changes > 0;
  }

  async getChecklistStats(todoId: string): Promise<{ total: number; completed: number; percentage: number }> {
    const db = getDatabase();
    const items = await this.getChecklistItems(todoId);
    const completedCount = items.filter(item => item.completed).length;
    const total = items.length;
    const percentage = total > 0 ? (completedCount / total) * 100 : 0;

    return {
      total,
      completed: completedCount,
      percentage: Math.round(percentage)
    };
  }
}
