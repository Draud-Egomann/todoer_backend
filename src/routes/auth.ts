import express, { Router, Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router: Router = express.Router();
const authService = new AuthService();

// User registration
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = await authService.registerUser(username, email, password);

    res.status(201).json({
      user,
      message: 'User registered successfully'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    res.status(400).json({ error: message });
  }
});

// User login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const { user, token } = await authService.loginUser(username, password);

    res.json({
      user,
      token,
      message: 'Login successful'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    res.status(401).json({ error: message });
  }
});

// Get current user (requires auth)
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'User ID not found in token' });
    }

    const user = await authService.verifyUser(req.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get user';
    res.status(500).json({ error: message });
  }
});

// Generate API Key (requires auth)
router.post('/generate-key', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'User ID not found in token' });
    }

    const { name } = req.body;
    const { token, id } = await authService.generateApiKey(req.userId, name);

    res.json({
      id,
      token,
      message: 'API key generated successfully'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate API key';
    res.status(500).json({ error: message });
  }
});

export default router;
