import { Router, Request, Response } from 'express';
import { pool } from '../database';

const router = Router();

// GET /api/meals/today  (must be before /:id)
router.get('/today', async (req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { rows } = await pool.query(`
      SELECT * FROM meal_plans WHERE plan_date = $1
      ORDER BY CASE meal_type WHEN 'breakfast' THEN 1 WHEN 'lunch' THEN 2 WHEN 'dinner' THEN 3 ELSE 4 END
    `, [today]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch today's meals" });
  }
});

// GET /api/meals
router.get('/', async (req: Request, res: Response) => {
  try {
    const { start_date, end_date } = req.query;
    let query = 'SELECT * FROM meal_plans';
    const params: any[] = [];

    if (start_date && end_date) {
      query += ' WHERE plan_date >= $1 AND plan_date <= $2';
      params.push(start_date, end_date);
    } else if (start_date) {
      query += ' WHERE plan_date >= $1';
      params.push(start_date);
    }

    query += " ORDER BY plan_date, CASE meal_type WHEN 'breakfast' THEN 1 WHEN 'lunch' THEN 2 WHEN 'dinner' THEN 3 ELSE 4 END";

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch meal plans' });
  }
});

// POST /api/meals
router.post('/', async (req: Request, res: Response) => {
  try {
    const { plan_date, meal_type, recipe_name, notes } = req.body;
    if (!plan_date || !meal_type || !recipe_name) {
      return res.status(400).json({ error: 'plan_date, meal_type, and recipe_name are required' });
    }

    const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    if (!validMealTypes.includes(meal_type)) {
      return res.status(400).json({ error: 'meal_type must be one of: breakfast, lunch, dinner, snack' });
    }

    const { rows } = await pool.query(`
      INSERT INTO meal_plans (plan_date, meal_type, recipe_name, notes)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [plan_date, meal_type, recipe_name, notes || null]);

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create meal plan' });
  }
});

// PUT /api/meals/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { plan_date, meal_type, recipe_name, notes } = req.body;
    const { rows: existingRows } = await pool.query('SELECT * FROM meal_plans WHERE id = $1', [req.params.id]);
    if (existingRows.length === 0) return res.status(404).json({ error: 'Meal plan not found' });
    const existing = existingRows[0];

    const { rows } = await pool.query(`
      UPDATE meal_plans SET plan_date = $1, meal_type = $2, recipe_name = $3, notes = $4
      WHERE id = $5
      RETURNING *
    `, [
      plan_date ?? existing.plan_date,
      meal_type ?? existing.meal_type,
      recipe_name ?? existing.recipe_name,
      notes !== undefined ? notes : existing.notes,
      req.params.id,
    ]);

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update meal plan' });
  }
});

// DELETE /api/meals/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { rows: existingRows } = await pool.query('SELECT * FROM meal_plans WHERE id = $1', [req.params.id]);
    if (existingRows.length === 0) return res.status(404).json({ error: 'Meal plan not found' });
    await pool.query('DELETE FROM meal_plans WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete meal plan' });
  }
});

export default router;
