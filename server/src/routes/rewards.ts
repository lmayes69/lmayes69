import { Router, Request, Response } from 'express';
import getDb from '../database';

const router = Router();

// GET /api/rewards
router.get('/', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const rewards = db.prepare(`
      SELECT r.*,
        (SELECT COUNT(*) FROM reward_redemptions rr WHERE rr.reward_id = r.id) as total_redeemed
      FROM rewards r
      WHERE r.active = 1
      ORDER BY r.points_cost
    `).all();
    res.json(rewards);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch rewards' });
  }
});

// POST /api/rewards
router.post('/', (req: Request, res: Response) => {
  try {
    const { name, description, points_cost, image_emoji, quantity } = req.body;
    if (!name || !points_cost) return res.status(400).json({ error: 'Name and points_cost are required' });
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO rewards (name, description, points_cost, image_emoji, quantity)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, description || null, points_cost, image_emoji || '🎁', quantity ?? -1);

    const reward = db.prepare('SELECT * FROM rewards WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(reward);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create reward' });
  }
});

// GET /api/rewards/:id
router.get('/:id', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const reward = db.prepare('SELECT * FROM rewards WHERE id = ?').get(req.params.id);
    if (!reward) return res.status(404).json({ error: 'Reward not found' });
    res.json(reward);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch reward' });
  }
});

// PUT /api/rewards/:id
router.put('/:id', (req: Request, res: Response) => {
  try {
    const { name, description, points_cost, image_emoji, quantity, active } = req.body;
    const db = getDb();
    const existing = db.prepare('SELECT * FROM rewards WHERE id = ?').get(req.params.id) as any;
    if (!existing) return res.status(404).json({ error: 'Reward not found' });

    db.prepare(`
      UPDATE rewards SET name = ?, description = ?, points_cost = ?, image_emoji = ?,
        quantity = ?, active = ?
      WHERE id = ?
    `).run(
      name ?? existing.name,
      description ?? existing.description,
      points_cost ?? existing.points_cost,
      image_emoji ?? existing.image_emoji,
      quantity ?? existing.quantity,
      active !== undefined ? active : existing.active,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM rewards WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update reward' });
  }
});

// DELETE /api/rewards/:id
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM rewards WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Reward not found' });
    db.prepare('UPDATE rewards SET active = 0 WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete reward' });
  }
});

// POST /api/rewards/:id/redeem
router.post('/:id/redeem', (req: Request, res: Response) => {
  try {
    const { kid_id } = req.body;
    if (!kid_id) return res.status(400).json({ error: 'kid_id is required' });

    const db = getDb();
    const reward = db.prepare('SELECT * FROM rewards WHERE id = ? AND active = 1').get(req.params.id) as any;
    if (!reward) return res.status(404).json({ error: 'Reward not found' });

    const kid = db.prepare('SELECT * FROM kids WHERE id = ?').get(kid_id) as any;
    if (!kid) return res.status(404).json({ error: 'Kid not found' });

    if (kid.points < reward.points_cost) {
      return res.status(400).json({ error: 'Not enough points' });
    }

    // Check quantity
    if (reward.quantity > 0) {
      const redeemed = db.prepare(
        'SELECT COUNT(*) as count FROM reward_redemptions WHERE reward_id = ?'
      ).get(req.params.id) as { count: number };
      if (redeemed.count >= reward.quantity) {
        return res.status(400).json({ error: 'Reward is out of stock' });
      }
    }

    // Record redemption
    const redemption = db.prepare(`
      INSERT INTO reward_redemptions (reward_id, kid_id, points_spent)
      VALUES (?, ?, ?)
    `).run(req.params.id, kid_id, reward.points_cost);

    // Deduct points from kid
    db.prepare('UPDATE kids SET points = points - ? WHERE id = ?').run(reward.points_cost, kid_id);

    const updatedKid = db.prepare('SELECT * FROM kids WHERE id = ?').get(kid_id);
    res.json({
      success: true,
      points_spent: reward.points_cost,
      redemption_id: redemption.lastInsertRowid,
      kid: updatedKid
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to redeem reward' });
  }
});

// GET /api/rewards/redemptions/history
router.get('/redemptions/history', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const history = db.prepare(`
      SELECT rr.*, r.name as reward_name, r.image_emoji, k.name as kid_name, k.avatar
      FROM reward_redemptions rr
      JOIN rewards r ON rr.reward_id = r.id
      JOIN kids k ON rr.kid_id = k.id
      ORDER BY rr.redeemed_at DESC
      LIMIT 50
    `).all();
    res.json(history);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch redemption history' });
  }
});

export default router;
