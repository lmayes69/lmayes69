import { Router, Request, Response } from 'express';
import { getDb } from '../database';

const router = Router();

// GET /api/meals
router.get('/', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { start_date, end_date } = req.query;
    let query = 'SELECT * FROM meal_plans';
    const params: any[] = [];

    if (start_date && end_date) {
      query += ' WHERE plan_date >= ? AND plan_date <= ?';
      params.push(start_date, end_date);
    } else if (start_date) {
      query += ' WHERE plan_date >= ?';
      params.push(start_date);
    }

    query += ' ORDER BY plan_date, CASE meal_type WHEN \'breakfast\' THEN 1 WHEN \'lunch\' THEN 2 WHEN \'dinner\' THEN 3 ELSE 4 END';

    const meals = db.prepare(query).all(...params);
    res.json(meals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch meal plans' });
  }
});

// POST /api/meals
router.post('/', (req: Request, res: Response) => {
  try {
    const { plan_date, meal_type, recipe_name, notes } = req.body;
    if (!plan_date || !meal_type || !recipe_name) {
      return res.status(400).json({ error: 'plan_date, meal_type, and recipe_name are required' });
    }

    const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    if (!validMealTypes.includes(meal_type)) {
      return res.status(400).json({ error: 'meal_type must be one of: breakfast, lunch, dinner, snack' });
    }

    const db = getDb();
    const result = db.prepare(`
      INSERT INTO meal_plans (plan_date, meal_type, recipe_name, notes)
      VALUES (?, ?, ?, ?)
    `).run(plan_date, meal_type, recipe_name, notes || null);

    const meal = db.prepare('SELECT * FROM meal_plans WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(meal);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create meal plan' });
  }
});

// PUT /api/meals/:id
router.put('/:id', (req: Request, res: Response) => {
  try {
    const { plan_date, meal_type, recipe_name, notes } = req.body;
    const db = getDb();
    const existing = db.prepare('SELECT * FROM meal_plans WHERE id = ?').get(req.params.id) as any;
    if (!existing) return res.status(404).json({ error: 'Meal plan not found' });

    db.prepare(`
      UPDATE meal_plans SET plan_date = ?, meal_type = ?, recipe_name = ?, notes = ?
      WHERE id = ?
    `).run(
      plan_date ?? existing.plan_date,
      meal_type ?? existing.meal_type,
      recipe_name ?? existing.recipe_name,
      notes !== undefined ? notes : existing.notes,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM meal_plans WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update meal plan' });
  }
});

// DELETE /api/meals/:id
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM meal_plans WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Meal plan not found' });
    db.prepare('DELETE FROM meal_plans WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete meal plan' });
  }
});

// GET /api/meals/today - convenience endpoint
router.get('/today', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const today = new Date().toISOString().split('T')[0];
    const meals = db.prepare(`
      SELECT * FROM meal_plans WHERE plan_date = ?
      ORDER BY CASE meal_type WHEN 'breakfast' THEN 1 WHEN 'lunch' THEN 2 WHEN 'dinner' THEN 3 ELSE 4 END
    `).all(today);
    res.json(meals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch today\'s meals' });
  }
});

export default router;
