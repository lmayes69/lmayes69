import { Router, Request, Response } from 'express';
import { pool } from '../database';

const router = Router();

// GET /api/kids
router.get('/', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT k.*,
        (SELECT COUNT(*) FROM chore_completions cc WHERE cc.kid_id = k.id AND cc.completed_at::date = CURRENT_DATE) as completions_today,
        (SELECT COUNT(*) FROM reward_redemptions rr WHERE rr.kid_id = k.id) as total_redemptions
      FROM kids k
      ORDER BY k.name
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch kids' });
  }
});

// POST /api/kids
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, age, avatar, color } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const { rows } = await pool.query(
      'INSERT INTO kids (name, age, avatar, color) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, age || null, avatar || '👤', color || '#4F46E5']
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create kid' });
  }
});

// GET /api/kids/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { rows: kidRows } = await pool.query('SELECT * FROM kids WHERE id = $1', [req.params.id]);
    if (kidRows.length === 0) return res.status(404).json({ error: 'Kid not found' });
    const kid = kidRows[0];

    const { rows: recentCompletions } = await pool.query(`
      SELECT cc.*, c.name as chore_name, c.points_value
      FROM chore_completions cc
      JOIN chores c ON cc.chore_id = c.id
      WHERE cc.kid_id = $1
      ORDER BY cc.completed_at DESC
      LIMIT 20
    `, [req.params.id]);

    const { rows: recentRedemptions } = await pool.query(`
      SELECT rr.*, r.name as reward_name, r.image_emoji
      FROM reward_redemptions rr
      JOIN rewards r ON rr.reward_id = r.id
      WHERE rr.kid_id = $1
      ORDER BY rr.redeemed_at DESC
      LIMIT 10
    `, [req.params.id]);

    res.json({ ...kid, recentCompletions, recentRedemptions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch kid' });
  }
});

// PUT /api/kids/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, age, avatar, color, points } = req.body;
    const { rows: existingRows } = await pool.query('SELECT * FROM kids WHERE id = $1', [req.params.id]);
    if (existingRows.length === 0) return res.status(404).json({ error: 'Kid not found' });
    const existing = existingRows[0];

    const { rows } = await pool.query(`
      UPDATE kids SET name = $1, age = $2, avatar = $3, color = $4, points = $5
      WHERE id = $6
      RETURNING *
    `, [
      name ?? existing.name,
      age ?? existing.age,
      avatar ?? existing.avatar,
      color ?? existing.color,
      points ?? existing.points,
      req.params.id
    ]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update kid' });
  }
});

// DELETE /api/kids/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { rows: existingRows } = await pool.query('SELECT * FROM kids WHERE id = $1', [req.params.id]);
    if (existingRows.length === 0) return res.status(404).json({ error: 'Kid not found' });
    await pool.query('DELETE FROM kids WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete kid' });
  }
});

export default router;
