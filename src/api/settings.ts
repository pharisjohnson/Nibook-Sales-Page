import express, { Request, Response } from 'express';
import { settingsTable, insertSettingsSchema } from '../lib/db/src/schema/settings';
import { z } from 'zod/v4';
import { authMiddleware } from './middleware/auth';

const router = express.Router();

// Apply authentication middleware to all settings routes
router.use(authMiddleware);

// GET /api/settings
router.get('/settings', async (req: Request, res: Response) => {
  try {
    // Use authenticated user ID from middleware
    const result = await settingsTable.select().where('userId', req.user.id).first();
    res.json(result || {});
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT /api/settings
router.put('/settings', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const validated = insertSettingsSchema.parse(body);

    // Update settings with authenticated user ID
    const updated = await settingsTable
      .update({ ...validated, userId: req.user.id })
      .where('userId', req.user.id)
      .first();

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save settings', details: err.message });
  }
});

module.exports = router;