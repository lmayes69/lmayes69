import { Router, Request, Response } from 'express';
import { pool } from '../database';

const router = Router();

// GET /api/rewards/redemptions/history  (must be before /:id)
router.get('/redemptions/history', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT rr.*, r.name as reward_name, r.image_emoji, k.name as kid_name, k.avatar
      FROM reward_redemptions rr
      JOIN rewards r ON rr.reward_id = r.id
      JOIN kids k ON rr.kid_id = k.id
      ORDER BY rr.redeemed_at DESC
      LIMIT 50
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch redemption history' });
  }
});

// GET /api/rewards
router.get('/', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT r.*,
        (SELECT COUNT(*) FROM reward_redemptions rr WHERE rr.reward_id = r.id) as total_redeemed
      FROM rewards r
      WHERE r.active = true
      ORDER BY r.points_cost
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch rewards' });
  }
});

// POST /api/rewards
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, points_cost, image_emoji, quantity } = req.body;
    if (!name || !points_cost) return res.status(400).json({ error: 'Name and points_cost are required' });
    const { rows } = await pool.query(`
      INSERT INTO rewards (name, description, points_cost, image_emoji, quantity)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [name, description || null, points_cost, image_emoji || '🎁', quantity ?? -1]);

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create reward' });
  }
});

// GET /api/rewards/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query('SELECT * FROM rewards WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Reward not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch reward' });
  }
});

// PUT /api/rewards/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, description, points_cost, image_emoji, quantity, active } = req.body;
    const { rows: existingRows } = await pool.query('SELECT * FROM rewards WHERE id = $1', [req.params.id]);
    if (existingRows.length === 0) return res.status(404).json({ error: 'Reward not found' });
    const existing = existingRows[0];

    const { rows } = await pool.query(`
      UPDATE rewards SET name = $1, description = $2, points_cost = $3, image_emoji = $4,
        quantity = $5, active = $6
      WHERE id = $7
      RETURNING *
    `, [
      name ?? existing.name,
      description ?? existing.description,
      points_cost ?? existing.points_cost,
      image_emoji ?? existing.image_emoji,
      quantity ?? existing.quantity,
      active !== undefined ? active : existing.active,
      req.params.id
    ]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update reward' });
  }
});

// DELETE /api/rewards/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { rows: existingRows } = await pool.query('SELECT * FROM rewards WHERE id = $1', [req.params.id]);
    if (existingRows.length === 0) return res.status(404).json({ error: 'Reward not found' });
    await pool.query('UPDATE rewards SET active = false WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete reward' });
  }
});

// POST /api/rewards/:id/redeem
router.post('/:id/redeem', async (req: Request, res: Response) => {
  try {
    const { kid_id } = req.body;
    if (!kid_id) return res.status(400).json({ error: 'kid_id is required' });

    const { rows: rewardRows } = await pool.query('SELECT * FROM rewards WHERE id = $1 AND active = true', [req.params.id]);
    if (rewardRows.length === 0) return res.status(404).json({ error: 'Reward not found' });
    const reward = rewardRows[0];

    const { rows: kidRows } = await pool.query('SELECT * FROM kids WHERE id = $1', [kid_id]);
    if (kidRows.length === 0) return res.status(404).json({ error: 'Kid not found' });
    const kid = kidRows[0];

    if (kid.points < reward.points_cost) {
      return res.status(400).json({ error: 'Not enough points' });
    }

    // Check quantity
    if (reward.quantity > 0) {
      const { rows: redeemedRows } = await pool.query(
        'SELECT COUNT(*) as count FROM reward_redemptions WHERE reward_id = $1',
        [req.params.id]
      );
      if (parseInt(redeemedRows[0].count) >= reward.quantity) {
        return res.status(400).json({ error: 'Reward is out of stock' });
      }
    }

    // Record redemption
    const { rows: redemptionRows } = await pool.query(`
      INSERT INTO reward_redemptions (reward_id, kid_id, points_spent)
      VALUES ($1, $2, $3)
      RETURNING id
    `, [req.params.id, kid_id, reward.points_cost]);

    // Deduct points from kid
    await pool.query('UPDATE kids SET points = points - $1 WHERE id = $2', [reward.points_cost, kid_id]);

    const { rows: updatedKidRows } = await pool.query('SELECT * FROM kids WHERE id = $1', [kid_id]);
    res.json({
      success: true,
      points_spent: reward.points_cost,
      redemption_id: redemptionRows[0].id,
      kid: updatedKidRows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to redeem reward' });
  }
});

export default router;
