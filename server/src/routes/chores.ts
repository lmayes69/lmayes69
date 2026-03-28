import { Router, Request, Response } from 'express';
import { pool } from '../database';

const router = Router();

// GET /api/chores
router.get('/', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.*, k.name as kid_name, k.avatar as kid_avatar, k.color as kid_color,
        (SELECT COUNT(*) FROM chore_completions cc
         WHERE cc.chore_id = c.id AND cc.completed_at::date = CURRENT_DATE) as completed_today
      FROM chores c
      LEFT JOIN kids k ON c.assigned_kid_id = k.id
      WHERE c.active = true
      ORDER BY c.name
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch chores' });
  }
});

// POST /api/chores
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, points_value, frequency, assigned_kid_id } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const insertResult = await pool.query(`
      INSERT INTO chores (name, description, points_value, frequency, assigned_kid_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [name, description || null, points_value || 10, frequency || 'daily', assigned_kid_id || null]);

    const { rows } = await pool.query(`
      SELECT c.*, k.name as kid_name, k.avatar as kid_avatar, k.color as kid_color
      FROM chores c LEFT JOIN kids k ON c.assigned_kid_id = k.id
      WHERE c.id = $1
    `, [insertResult.rows[0].id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create chore' });
  }
});

// GET /api/chores/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.*, k.name as kid_name, k.avatar as kid_avatar, k.color as kid_color
      FROM chores c LEFT JOIN kids k ON c.assigned_kid_id = k.id
      WHERE c.id = $1
    `, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Chore not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch chore' });
  }
});

// PUT /api/chores/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, description, points_value, frequency, assigned_kid_id, active } = req.body;
    const { rows: existingRows } = await pool.query('SELECT * FROM chores WHERE id = $1', [req.params.id]);
    if (existingRows.length === 0) return res.status(404).json({ error: 'Chore not found' });
    const existing = existingRows[0];

    await pool.query(`
      UPDATE chores SET name = $1, description = $2, points_value = $3, frequency = $4,
        assigned_kid_id = $5, active = $6
      WHERE id = $7
    `, [
      name ?? existing.name,
      description ?? existing.description,
      points_value ?? existing.points_value,
      frequency ?? existing.frequency,
      assigned_kid_id !== undefined ? assigned_kid_id : existing.assigned_kid_id,
      active !== undefined ? active : existing.active,
      req.params.id
    ]);

    const { rows } = await pool.query(`
      SELECT c.*, k.name as kid_name, k.avatar as kid_avatar, k.color as kid_color
      FROM chores c LEFT JOIN kids k ON c.assigned_kid_id = k.id
      WHERE c.id = $1
    `, [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update chore' });
  }
});

// DELETE /api/chores/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { rows: existingRows } = await pool.query('SELECT * FROM chores WHERE id = $1', [req.params.id]);
    if (existingRows.length === 0) return res.status(404).json({ error: 'Chore not found' });
    await pool.query('UPDATE chores SET active = false WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete chore' });
  }
});

// POST /api/chores/:id/complete
router.post('/:id/complete', async (req: Request, res: Response) => {
  try {
    const { kid_id } = req.body;
    if (!kid_id) return res.status(400).json({ error: 'kid_id is required' });

    const { rows: choreRows } = await pool.query('SELECT * FROM chores WHERE id = $1 AND active = true', [req.params.id]);
    if (choreRows.length === 0) return res.status(404).json({ error: 'Chore not found' });
    const chore = choreRows[0];

    const { rows: kidRows } = await pool.query('SELECT * FROM kids WHERE id = $1', [kid_id]);
    if (kidRows.length === 0) return res.status(404).json({ error: 'Kid not found' });

    // Check if already completed today (for daily chores)
    if (chore.frequency === 'daily') {
      const { rows: alreadyDone } = await pool.query(`
        SELECT id FROM chore_completions
        WHERE chore_id = $1 AND kid_id = $2 AND completed_at::date = CURRENT_DATE
      `, [req.params.id, kid_id]);
      if (alreadyDone.length > 0) {
        return res.status(409).json({ error: 'Chore already completed today' });
      }
    }

    const pointsEarned = chore.points_value;

    // Record completion
    const { rows: completionRows } = await pool.query(`
      INSERT INTO chore_completions (chore_id, kid_id, points_earned)
      VALUES ($1, $2, $3)
      RETURNING id
    `, [req.params.id, kid_id, pointsEarned]);

    // Award points to kid
    await pool.query('UPDATE kids SET points = points + $1 WHERE id = $2', [pointsEarned, kid_id]);

    const { rows: updatedKidRows } = await pool.query('SELECT * FROM kids WHERE id = $1', [kid_id]);
    res.json({
      success: true,
      points_earned: pointsEarned,
      completion_id: completionRows[0].id,
      kid: updatedKidRows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to complete chore' });
  }
});

export default router;
