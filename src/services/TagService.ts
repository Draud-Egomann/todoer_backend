import { getDatabase } from '../database';
import { v4 as uuidv4 } from 'uuid';

export interface Tag {
  id: string;
  name: string;
  color: string;
  created_at?: string;
  updated_at?: string;
}

export class TagService {
  async getAllTags(): Promise<Tag[]> {
    const db = getDatabase();
    return db.all<Tag>('SELECT * FROM tags ORDER BY name ASC');
  }

  async getTagById(id: string): Promise<Tag | undefined> {
    const db = getDatabase();
    return db.get<Tag>('SELECT * FROM tags WHERE id = ?', [id]);
  }

  async createTag(name: string, color: string): Promise<Tag> {
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    await db.run(
      'INSERT INTO tags (id, name, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [id, name, color, now, now]
    );

    return { id, name, color, created_at: now, updated_at: now };
  }

  async updateTag(id: string, name: string, color: string): Promise<Tag | undefined> {
    const db = getDatabase();
    const now = new Date().toISOString();

    await db.run(
      'UPDATE tags SET name = ?, color = ?, updated_at = ? WHERE id = ?',
      [name, color, now, id]
    );

    return this.getTagById(id);
  }

  async deleteTag(id: string): Promise<boolean> {
    const db = getDatabase();
    const result = await db.run('DELETE FROM tags WHERE id = ?', [id]);
    return (result as any).changes > 0;
  }
}
