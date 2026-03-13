import express, { Router, Request, Response } from 'express';
import { TagService } from '../services/TagService';

const router: Router = express.Router();
const tagService = new TagService();

// Get all tags
router.get('/', async (req: Request, res: Response) => {
  try {
    const tags = await tagService.getAllTags();
    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tags', details: error instanceof Error ? error.message : error });
  }
});

// Get tag by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const tag = await tagService.getTagById(req.params.id);
    if (!tag) {
      res.status(404).json({ error: 'Tag not found' });
    } else {
      res.json(tag);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tag', details: error instanceof Error ? error.message : error });
  }
});

// Create tag
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, color } = req.body;
    if (!name || !color) {
      res.status(400).json({ error: 'Name and color are required' });
      return;
    }

    const tag = await tagService.createTag(name, color);
    res.status(201).json(tag);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create tag', details: error instanceof Error ? error.message : error });
  }
});

// Update tag
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, color } = req.body;
    if (!name || !color) {
      res.status(400).json({ error: 'Name and color are required' });
      return;
    }

    const tag = await tagService.updateTag(req.params.id, name, color);
    if (!tag) {
      res.status(404).json({ error: 'Tag not found' });
    } else {
      res.json(tag);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update tag', details: error instanceof Error ? error.message : error });
  }
});

// Delete tag
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await tagService.deleteTag(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Tag not found' });
    } else {
      res.status(204).send();
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete tag', details: error instanceof Error ? error.message : error });
  }
});

export default router;
