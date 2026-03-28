import { Router, Request, Response } from 'express';
import { pool } from '../database';
import axios from 'axios';

const router = Router();

// DELETE /api/shopping/completed/clear  (must be before /:id)
router.delete('/completed/clear', async (req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM shopping_items WHERE completed = true');
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to clear completed items' });
  }
});

// GET /api/shopping
router.get('/', async (req: Request, res: Response) => {
  try {
    const { source } = req.query;
    let query = 'SELECT * FROM shopping_items';
    const params: any[] = [];

    if (source) {
      query += ' WHERE list_source = $1';
      params.push(source);
    }

    query += ' ORDER BY category, completed, name';
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch shopping items' });
  }
});

// POST /api/shopping
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, quantity, category, notes, list_source } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const { rows } = await pool.query(`
      INSERT INTO shopping_items (name, quantity, category, notes, list_source)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [name, quantity || '1', category || 'General', notes || null, list_source || 'manual']);

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create shopping item' });
  }
});

// PUT /api/shopping/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, quantity, category, completed, notes } = req.body;
    const { rows: existingRows } = await pool.query('SELECT * FROM shopping_items WHERE id = $1', [req.params.id]);
    if (existingRows.length === 0) return res.status(404).json({ error: 'Shopping item not found' });
    const existing = existingRows[0];

    const { rows } = await pool.query(`
      UPDATE shopping_items SET name = $1, quantity = $2, category = $3, completed = $4, notes = $5
      WHERE id = $6
      RETURNING *
    `, [
      name ?? existing.name,
      quantity ?? existing.quantity,
      category ?? existing.category,
      completed !== undefined ? completed : existing.completed,
      notes !== undefined ? notes : existing.notes,
      req.params.id,
    ]);

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update shopping item' });
  }
});

// DELETE /api/shopping/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { rows: existingRows } = await pool.query('SELECT * FROM shopping_items WHERE id = $1', [req.params.id]);
    if (existingRows.length === 0) return res.status(404).json({ error: 'Shopping item not found' });
    await pool.query('DELETE FROM shopping_items WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete shopping item' });
  }
});

// GET /api/shopping/sync/microsoft-todo
router.get('/sync/microsoft-todo', async (req: Request, res: Response) => {
  try {
    const { rows: settingsRows } = await pool.query('SELECT * FROM calendar_settings WHERE id = 1');
    const settings = settingsRows[0];

    if (!settings?.microsoft_access_token) {
      return res.status(401).json({ error: 'Microsoft account not connected. Please connect in Settings.' });
    }

    // Get todo lists from Microsoft Graph
    const listsResponse = await axios.get(
      'https://graph.microsoft.com/v1.0/me/todo/lists',
      {
        headers: { Authorization: `Bearer ${settings.microsoft_access_token}` },
      }
    );

    const lists = listsResponse.data.value;
    const allItems: any[] = [];

    // Find grocery/shopping list or use first list
    const shoppingList = lists.find((l: any) =>
      l.displayName.toLowerCase().includes('grocery') ||
      l.displayName.toLowerCase().includes('shopping') ||
      l.displayName.toLowerCase().includes('food')
    ) || lists[0];

    if (shoppingList) {
      const tasksResponse = await axios.get(
        `https://graph.microsoft.com/v1.0/me/todo/lists/${shoppingList.id}/tasks`,
        {
          headers: { Authorization: `Bearer ${settings.microsoft_access_token}` },
        }
      );

      const tasks = tasksResponse.data.value;

      for (const task of tasks) {
        const { rows: existingRows } = await pool.query(
          'SELECT * FROM shopping_items WHERE external_id = $1 AND list_source = $2',
          [task.id, 'microsoft_todo']
        );
        const existingItem = existingRows[0];

        if (!existingItem) {
          await pool.query(`
            INSERT INTO shopping_items (name, completed, list_source, external_id, category)
            VALUES ($1, $2, 'microsoft_todo', $3, 'General')
          `, [task.title, task.status === 'completed', task.id]);
        } else {
          await pool.query(
            'UPDATE shopping_items SET name = $1, completed = $2 WHERE id = $3',
            [task.title, task.status === 'completed', existingItem.id]
          );
        }
        allItems.push(task);
      }
    }

    const { rows: updatedItems } = await pool.query(
      "SELECT * FROM shopping_items WHERE list_source = 'microsoft_todo' ORDER BY name"
    );

    res.json({
      success: true,
      synced: allItems.length,
      items: updatedItems,
    });
  } catch (err: any) {
    console.error('Microsoft To Do sync error:', err?.response?.data || err.message);
    if (err?.response?.status === 401) {
      return res.status(401).json({ error: 'Microsoft token expired. Please reconnect in Settings.' });
    }
    res.status(500).json({ error: 'Failed to sync Microsoft To Do' });
  }
});

// POST /api/shopping/sync/microsoft-todo
router.post('/sync/microsoft-todo', async (req: Request, res: Response) => {
  try {
    const { rows: settingsRows } = await pool.query('SELECT * FROM calendar_settings WHERE id = 1');
    const settings = settingsRows[0];

    if (!settings?.microsoft_access_token) {
      return res.status(401).json({ error: 'Microsoft account not connected' });
    }

    const { name, category } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    // Get or create shopping list
    const listsResponse = await axios.get(
      'https://graph.microsoft.com/v1.0/me/todo/lists',
      { headers: { Authorization: `Bearer ${settings.microsoft_access_token}` } }
    );

    let shoppingList = listsResponse.data.value.find((l: any) =>
      l.displayName.toLowerCase().includes('grocery') ||
      l.displayName.toLowerCase().includes('shopping')
    );

    if (!shoppingList) {
      const createListResponse = await axios.post(
        'https://graph.microsoft.com/v1.0/me/todo/lists',
        { displayName: 'Grocery Shopping' },
        { headers: { Authorization: `Bearer ${settings.microsoft_access_token}` } }
      );
      shoppingList = createListResponse.data;
    }

    const taskResponse = await axios.post(
      `https://graph.microsoft.com/v1.0/me/todo/lists/${shoppingList.id}/tasks`,
      { title: `${name}${category ? ` [${category}]` : ''}` },
      { headers: { Authorization: `Bearer ${settings.microsoft_access_token}` } }
    );

    const task = taskResponse.data;

    const { rows } = await pool.query(`
      INSERT INTO shopping_items (name, category, list_source, external_id)
      VALUES ($1, $2, 'microsoft_todo', $3)
      RETURNING *
    `, [name, category || 'General', task.id]);

    res.status(201).json(rows[0]);
  } catch (err: any) {
    console.error('Microsoft To Do push error:', err?.response?.data || err.message);
    res.status(500).json({ error: 'Failed to push to Microsoft To Do' });
  }
});

// GET /api/shopping/sync/google-keep
router.get('/sync/google-keep', async (req: Request, res: Response) => {
  // Note: Google Keep has no official public API
  res.status(501).json({
    error: 'Google Keep does not have an official public API.',
    message: 'Google Keep integration is not available via official API. You can manually add items to your local list or use Microsoft To Do instead.',
    alternatives: [
      'Use the manual shopping list',
      'Connect Microsoft To Do for cloud sync',
      'Export from Google Keep and import manually',
    ],
  });
});

// POST /api/shopping/sync/google-keep
router.post('/sync/google-keep', async (req: Request, res: Response) => {
  res.status(501).json({
    error: 'Google Keep does not have an official public API.',
    message: 'Google Keep integration is not available. Please use the manual list or Microsoft To Do.',
  });
});

export default router;
