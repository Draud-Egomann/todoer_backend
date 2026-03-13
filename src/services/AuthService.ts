import { getDatabase } from '../database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  username: string;
  email: string;
  created_at: string;
}

export class AuthService {
  private jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
  private jwtExpiry = process.env.JWT_EXPIRY || '7d';

  async registerUser(username: string, email: string, password: string): Promise<User> {
    const database = getDatabase();

    // Check if user already exists
    const existingUser = await database.get(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUser) {
      throw new Error('User with this username or email already exists');
    }

    const userId = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);

    await database.run(
      'INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)',
      [userId, username, email, passwordHash]
    );

    return { id: userId, username, email, created_at: new Date().toISOString() };
  }

  async loginUser(username: string, password: string): Promise<{ user: User; token: string }> {
    const database = getDatabase();

    const user = await database.get<any>(
      'SELECT id, username, email, password_hash, created_at FROM users WHERE username = ?',
      [username]
    );

    if (!user) {
      throw new Error('Invalid username or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid username or password');
    }

    const token = jwt.sign(
      { userId: user.id },
      this.jwtSecret,
      { expiresIn: this.jwtExpiry }
    );

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        created_at: user.created_at
      },
      token
    };
  }

  async generateApiKey(userId: string, keyName?: string): Promise<{ token: string; id: string }> {
    const database = getDatabase();

    const keyId = uuidv4();
    const token = jwt.sign(
      { userId, type: 'api_key' },
      this.jwtSecret,
      { expiresIn: this.jwtExpiry }
    );

    await database.run(
      'INSERT INTO api_keys (id, user_id, token, name) VALUES (?, ?, ?, ?)',
      [keyId, userId, token, keyName || `API Key ${new Date().toLocaleDateString()}`]
    );

    return { token, id: keyId };
  }

  async verifyUser(userId: string): Promise<User | null> {
    const database = getDatabase();

    const user = await database.get<any>(
      'SELECT id, username, email, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      created_at: user.created_at
    };
  }
}
