import { Router, Request, Response } from 'express';
import { pool } from '../database';

const router = Router();

// GET /api/settings
router.get('/', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query('SELECT * FROM app_settings WHERE id = 1');
    if (rows.length === 0) {
      return res.json({ id: 1, family_name: 'Our Family', timezone: 'America/New_York' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// PUT /api/settings
router.put('/', async (req: Request, res: Response) => {
  try {
    const { family_name, timezone } = req.body;
    const { rows: existingRows } = await pool.query('SELECT * FROM app_settings WHERE id = 1');
    const existing = existingRows[0];

    let result;
    if (existing) {
      const { rows } = await pool.query(`
        UPDATE app_settings SET family_name = $1, timezone = $2, updated_at = NOW() WHERE id = 1
        RETURNING *
      `, [family_name ?? existing.family_name, timezone ?? existing.timezone]);
      result = rows[0];
    } else {
      const { rows } = await pool.query(
        'INSERT INTO app_settings (family_name, timezone) VALUES ($1, $2) RETURNING *',
        [family_name || 'Our Family', timezone || 'America/New_York']
      );
      result = rows[0];
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// POST /api/settings (alias for initial create)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { family_name, timezone } = req.body;
    const { rows: existingRows } = await pool.query('SELECT * FROM app_settings WHERE id = 1');
    const existing = existingRows[0];

    let result;
    if (existing) {
      const { rows } = await pool.query(`
        UPDATE app_settings SET family_name = $1, timezone = $2, updated_at = NOW() WHERE id = 1
        RETURNING *
      `, [family_name ?? existing.family_name, timezone ?? existing.timezone]);
      result = rows[0];
    } else {
      const { rows } = await pool.query(
        'INSERT INTO app_settings (family_name, timezone) VALUES ($1, $2) RETURNING *',
        [family_name || 'Our Family', timezone || 'America/New_York']
      );
      result = rows[0];
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

export default router;
