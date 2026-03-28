import { Router, Request, Response } from 'express';
import { getDb } from '../database';
import axios from 'axios';

const router = Router();

// GET /api/shopping
router.get('/', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { source } = req.query;
    let query = 'SELECT * FROM shopping_items';
    const params: any[] = [];

    if (source) {
      query += ' WHERE list_source = ?';
      params.push(source);
    }

    query += ' ORDER BY category, completed, name';
    const items = db.prepare(query).all(...params);
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch shopping items' });
  }
});

// POST /api/shopping
router.post('/', (req: Request, res: Response) => {
  try {
    const { name, quantity, category, notes, list_source } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO shopping_items (name, quantity, category, notes, list_source)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, quantity || '1', category || 'General', notes || null, list_source || 'manual');

    const item = db.prepare('SELECT * FROM shopping_items WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create shopping item' });
  }
});

// PUT /api/shopping/:id
router.put('/:id', (req: Request, res: Response) => {
  try {
    const { name, quantity, category, completed, notes } = req.body;
    const db = getDb();
    const existing = db.prepare('SELECT * FROM shopping_items WHERE id = ?').get(req.params.id) as any;
    if (!existing) return res.status(404).json({ error: 'Shopping item not found' });

    db.prepare(`
      UPDATE shopping_items SET name = ?, quantity = ?, category = ?, completed = ?, notes = ?
      WHERE id = ?
    `).run(
      name ?? existing.name,
      quantity ?? existing.quantity,
      category ?? existing.category,
      completed !== undefined ? (completed ? 1 : 0) : existing.completed,
      notes ?? existing.notes,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM shopping_items WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update shopping item' });
  }
});

// DELETE /api/shopping/:id
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM shopping_items WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Shopping item not found' });
    db.prepare('DELETE FROM shopping_items WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete shopping item' });
  }
});

// DELETE /api/shopping/completed/clear
router.delete('/completed/clear', (req: Request, res: Response) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM shopping_items WHERE completed = 1').run();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to clear completed items' });
  }
});

// GET /api/shopping/sync/microsoft-todo
router.get('/sync/microsoft-todo', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const settings = db.prepare('SELECT * FROM calendar_settings WHERE id = 1').get() as any;

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
        const existingItem = db.prepare(
          'SELECT * FROM shopping_items WHERE external_id = ? AND list_source = ?'
        ).get(task.id, 'microsoft_todo') as any;

        if (!existingItem) {
          db.prepare(`
            INSERT INTO shopping_items (name, completed, list_source, external_id, category)
            VALUES (?, ?, 'microsoft_todo', ?, 'General')
          `).run(
            task.title,
            task.status === 'completed' ? 1 : 0,
            task.id
          );
        } else {
          db.prepare(`
            UPDATE shopping_items SET name = ?, completed = ? WHERE id = ?
          `).run(task.title, task.status === 'completed' ? 1 : 0, existingItem.id);
        }
        allItems.push(task);
      }
    }

    const updatedItems = db.prepare(
      "SELECT * FROM shopping_items WHERE list_source = 'microsoft_todo' ORDER BY name"
    ).all();

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
    const db = getDb();
    const settings = db.prepare('SELECT * FROM calendar_settings WHERE id = 1').get() as any;

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

    const result = db.prepare(`
      INSERT INTO shopping_items (name, category, list_source, external_id)
      VALUES (?, ?, 'microsoft_todo', ?)
    `).run(name, category || 'General', task.id);

    const item = db.prepare('SELECT * FROM shopping_items WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(item);
  } catch (err: any) {
    console.error('Microsoft To Do push error:', err?.response?.data || err.message);
    res.status(500).json({ error: 'Failed to push to Microsoft To Do' });
  }
});

// GET /api/shopping/sync/google-keep
router.get('/sync/google-keep', async (req: Request, res: Response) => {
  // Note: Google Keep has no official public API
  // This is a placeholder that explains the limitation
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
