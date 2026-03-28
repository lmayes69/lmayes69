import { Router, Request, Response } from 'express';
import getDb from '../database';

const router = Router();

// GET /api/kids
router.get('/', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const kids = db.prepare(`
      SELECT k.*,
        (SELECT COUNT(*) FROM chore_completions cc WHERE cc.kid_id = k.id AND date(cc.completed_at) = date('now')) as completions_today,
        (SELECT COUNT(*) FROM reward_redemptions rr WHERE rr.kid_id = k.id) as total_redemptions
      FROM kids k
      ORDER BY k.name
    `).all();
    res.json(kids);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch kids' });
  }
});

// POST /api/kids
router.post('/', (req: Request, res: Response) => {
  try {
    const { name, age, avatar, color } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const db = getDb();
    const result = db.prepare(
      'INSERT INTO kids (name, age, avatar, color) VALUES (?, ?, ?, ?)'
    ).run(name, age || null, avatar || '👤', color || '#4F46E5');
    const kid = db.prepare('SELECT * FROM kids WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(kid);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create kid' });
  }
});

// GET /api/kids/:id
router.get('/:id', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const kid = db.prepare('SELECT * FROM kids WHERE id = ?').get(req.params.id);
    if (!kid) return res.status(404).json({ error: 'Kid not found' });

    const recentCompletions = db.prepare(`
      SELECT cc.*, c.name as chore_name, c.points_value
      FROM chore_completions cc
      JOIN chores c ON cc.chore_id = c.id
      WHERE cc.kid_id = ?
      ORDER BY cc.completed_at DESC
      LIMIT 20
    `).all(req.params.id);

    const recentRedemptions = db.prepare(`
      SELECT rr.*, r.name as reward_name, r.image_emoji
      FROM reward_redemptions rr
      JOIN rewards r ON rr.reward_id = r.id
      WHERE rr.kid_id = ?
      ORDER BY rr.redeemed_at DESC
      LIMIT 10
    `).all(req.params.id);

    res.json({ ...kid as object, recentCompletions, recentRedemptions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch kid' });
  }
});

// PUT /api/kids/:id
router.put('/:id', (req: Request, res: Response) => {
  try {
    const { name, age, avatar, color, points } = req.body;
    const db = getDb();
    const existing = db.prepare('SELECT * FROM kids WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Kid not found' });

    db.prepare(`
      UPDATE kids SET name = ?, age = ?, avatar = ?, color = ?, points = ?
      WHERE id = ?
    `).run(
      name ?? (existing as any).name,
      age ?? (existing as any).age,
      avatar ?? (existing as any).avatar,
      color ?? (existing as any).color,
      points ?? (existing as any).points,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM kids WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update kid' });
  }
});

// DELETE /api/kids/:id
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM kids WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Kid not found' });
    db.prepare('DELETE FROM kids WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete kid' });
  }
});

export default router;
