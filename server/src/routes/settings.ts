import { Router, Request, Response } from 'express';
import { getDb } from '../database';

const router = Router();

// GET /api/settings
router.get('/', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const settings = db.prepare('SELECT * FROM app_settings WHERE id = 1').get();
    if (!settings) {
      return res.json({ id: 1, family_name: 'Our Family', timezone: 'America/New_York' });
    }
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// PUT /api/settings
router.put('/', (req: Request, res: Response) => {
  try {
    const { family_name, timezone } = req.body;
    const db = getDb();
    const existing = db.prepare('SELECT * FROM app_settings WHERE id = 1').get() as any;

    if (existing) {
      db.prepare(`
        UPDATE app_settings SET family_name = ?, timezone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1
      `).run(family_name ?? existing.family_name, timezone ?? existing.timezone);
    } else {
      db.prepare('INSERT INTO app_settings (family_name, timezone) VALUES (?, ?)').run(
        family_name || 'Our Family',
        timezone || 'America/New_York'
      );
    }

    const updated = db.prepare('SELECT * FROM app_settings WHERE id = 1').get();
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// POST /api/settings (alias for initial create)
router.post('/', (req: Request, res: Response) => {
  try {
    const { family_name, timezone } = req.body;
    const db = getDb();
    const existing = db.prepare('SELECT * FROM app_settings WHERE id = 1').get() as any;

    if (existing) {
      db.prepare(`
        UPDATE app_settings SET family_name = ?, timezone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1
      `).run(family_name ?? existing.family_name, timezone ?? existing.timezone);
    } else {
      db.prepare('INSERT INTO app_settings (family_name, timezone) VALUES (?, ?)').run(
        family_name || 'Our Family',
        timezone || 'America/New_York'
      );
    }

    const result = db.prepare('SELECT * FROM app_settings WHERE id = 1').get();
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

export default router;
