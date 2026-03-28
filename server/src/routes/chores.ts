import { Router, Request, Response } from 'express';
import getDb from '../database';

const router = Router();

// GET /api/chores
router.get('/', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const chores = db.prepare(`
      SELECT c.*, k.name as kid_name, k.avatar as kid_avatar, k.color as kid_color,
        (SELECT COUNT(*) FROM chore_completions cc
         WHERE cc.chore_id = c.id AND date(cc.completed_at) = date('now')) as completed_today
      FROM chores c
      LEFT JOIN kids k ON c.assigned_kid_id = k.id
      WHERE c.active = 1
      ORDER BY c.name
    `).all();
    res.json(chores);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch chores' });
  }
});

// POST /api/chores
router.post('/', (req: Request, res: Response) => {
  try {
    const { name, description, points_value, frequency, assigned_kid_id } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO chores (name, description, points_value, frequency, assigned_kid_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, description || null, points_value || 10, frequency || 'daily', assigned_kid_id || null);

    const chore = db.prepare(`
      SELECT c.*, k.name as kid_name, k.avatar as kid_avatar, k.color as kid_color
      FROM chores c LEFT JOIN kids k ON c.assigned_kid_id = k.id
      WHERE c.id = ?
    `).get(result.lastInsertRowid);
    res.status(201).json(chore);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create chore' });
  }
});

// GET /api/chores/:id
router.get('/:id', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const chore = db.prepare(`
      SELECT c.*, k.name as kid_name, k.avatar as kid_avatar, k.color as kid_color
      FROM chores c LEFT JOIN kids k ON c.assigned_kid_id = k.id
      WHERE c.id = ?
    `).get(req.params.id);
    if (!chore) return res.status(404).json({ error: 'Chore not found' });
    res.json(chore);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch chore' });
  }
});

// PUT /api/chores/:id
router.put('/:id', (req: Request, res: Response) => {
  try {
    const { name, description, points_value, frequency, assigned_kid_id, active } = req.body;
    const db = getDb();
    const existing = db.prepare('SELECT * FROM chores WHERE id = ?').get(req.params.id) as any;
    if (!existing) return res.status(404).json({ error: 'Chore not found' });

    db.prepare(`
      UPDATE chores SET name = ?, description = ?, points_value = ?, frequency = ?,
        assigned_kid_id = ?, active = ?
      WHERE id = ?
    `).run(
      name ?? existing.name,
      description ?? existing.description,
      points_value ?? existing.points_value,
      frequency ?? existing.frequency,
      assigned_kid_id !== undefined ? assigned_kid_id : existing.assigned_kid_id,
      active !== undefined ? active : existing.active,
      req.params.id
    );

    const updated = db.prepare(`
      SELECT c.*, k.name as kid_name, k.avatar as kid_avatar, k.color as kid_color
      FROM chores c LEFT JOIN kids k ON c.assigned_kid_id = k.id
      WHERE c.id = ?
    `).get(req.params.id);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update chore' });
  }
});

// DELETE /api/chores/:id
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM chores WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Chore not found' });
    db.prepare('UPDATE chores SET active = 0 WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete chore' });
  }
});

// POST /api/chores/:id/complete
router.post('/:id/complete', (req: Request, res: Response) => {
  try {
    const { kid_id } = req.body;
    if (!kid_id) return res.status(400).json({ error: 'kid_id is required' });

    const db = getDb();
    const chore = db.prepare('SELECT * FROM chores WHERE id = ? AND active = 1').get(req.params.id) as any;
    if (!chore) return res.status(404).json({ error: 'Chore not found' });

    const kid = db.prepare('SELECT * FROM kids WHERE id = ?').get(kid_id) as any;
    if (!kid) return res.status(404).json({ error: 'Kid not found' });

    // Check if already completed today (for daily chores)
    if (chore.frequency === 'daily') {
      const alreadyDone = db.prepare(`
        SELECT id FROM chore_completions
        WHERE chore_id = ? AND kid_id = ? AND date(completed_at) = date('now')
      `).get(req.params.id, kid_id);
      if (alreadyDone) {
        return res.status(409).json({ error: 'Chore already completed today' });
      }
    }

    const pointsEarned = chore.points_value;

    // Record completion
    const completion = db.prepare(`
      INSERT INTO chore_completions (chore_id, kid_id, points_earned)
      VALUES (?, ?, ?)
    `).run(req.params.id, kid_id, pointsEarned);

    // Award points to kid
    db.prepare('UPDATE kids SET points = points + ? WHERE id = ?').run(pointsEarned, kid_id);

    const updatedKid = db.prepare('SELECT * FROM kids WHERE id = ?').get(kid_id);
    res.json({
      success: true,
      points_earned: pointsEarned,
      completion_id: completion.lastInsertRowid,
      kid: updatedKid
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to complete chore' });
  }
});

export default router;
