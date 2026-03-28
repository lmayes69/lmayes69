import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS kids (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      age INTEGER,
      avatar TEXT DEFAULT 'default',
      color TEXT DEFAULT '#4F46E5',
      points INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS chores (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      points_value INTEGER DEFAULT 10,
      frequency TEXT DEFAULT 'daily',
      assigned_kid_id INTEGER REFERENCES kids(id),
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS chore_completions (
      id SERIAL PRIMARY KEY,
      chore_id INTEGER NOT NULL REFERENCES chores(id),
      kid_id INTEGER NOT NULL REFERENCES kids(id),
      completed_at TIMESTAMPTZ DEFAULT NOW(),
      points_earned INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS rewards (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      points_cost INTEGER NOT NULL,
      image_emoji TEXT DEFAULT '🎁',
      quantity INTEGER DEFAULT -1,
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS reward_redemptions (
      id SERIAL PRIMARY KEY,
      reward_id INTEGER NOT NULL REFERENCES rewards(id),
      kid_id INTEGER NOT NULL REFERENCES kids(id),
      redeemed_at TIMESTAMPTZ DEFAULT NOW(),
      points_spent INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS shopping_items (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      quantity TEXT DEFAULT '1',
      category TEXT DEFAULT 'General',
      completed BOOLEAN DEFAULT false,
      list_source TEXT DEFAULT 'manual',
      external_id TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS meal_plans (
      id SERIAL PRIMARY KEY,
      plan_date TEXT NOT NULL,
      meal_type TEXT NOT NULL,
      recipe_name TEXT NOT NULL,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS calendar_settings (
      id SERIAL PRIMARY KEY,
      google_calendar_id TEXT,
      google_access_token TEXT,
      google_refresh_token TEXT,
      microsoft_access_token TEXT,
      microsoft_refresh_token TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS app_settings (
      id SERIAL PRIMARY KEY,
      family_name TEXT DEFAULT 'Our Family',
      timezone TEXT DEFAULT 'America/New_York',
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  await seedData();
}

async function seedData() {
  const { rows } = await pool.query('SELECT COUNT(*) as count FROM kids');
  if (parseInt(rows[0].count) > 0) return;

  const kid1 = await pool.query(
    'INSERT INTO kids (name, age, avatar, color, points) VALUES ($1,$2,$3,$4,$5) RETURNING id',
    ['Emma', 10, '👧', '#EC4899', 125]
  );
  const kid2 = await pool.query(
    'INSERT INTO kids (name, age, avatar, color, points) VALUES ($1,$2,$3,$4,$5) RETURNING id',
    ['Jake', 8, '👦', '#4F46E5', 80]
  );
  const kid1Id = kid1.rows[0].id;
  const kid2Id = kid2.rows[0].id;

  await pool.query('INSERT INTO chores (name, description, points_value, frequency, assigned_kid_id) VALUES ($1,$2,$3,$4,$5)', ['Make Your Bed', 'Make your bed every morning before school', 10, 'daily', kid1Id]);
  await pool.query('INSERT INTO chores (name, description, points_value, frequency, assigned_kid_id) VALUES ($1,$2,$3,$4,$5)', ['Do Homework', 'Complete all homework before dinner', 20, 'daily', kid1Id]);
  await pool.query('INSERT INTO chores (name, description, points_value, frequency, assigned_kid_id) VALUES ($1,$2,$3,$4,$5)', ['Clean Your Room', 'Tidy up and vacuum your room', 30, 'weekly', kid2Id]);
  await pool.query('INSERT INTO chores (name, description, points_value, frequency, assigned_kid_id) VALUES ($1,$2,$3,$4,$5)', ['Take Out Trash', 'Empty all trash cans and take to curb', 25, 'weekly', kid2Id]);
  await pool.query('INSERT INTO chores (name, description, points_value, frequency, assigned_kid_id) VALUES ($1,$2,$3,$4,$5)', ['Feed the Dog', 'Feed Buddy breakfast and dinner', 15, 'daily', null]);

  await pool.query('INSERT INTO rewards (name, description, points_cost, image_emoji) VALUES ($1,$2,$3,$4)', ['Ice Cream Cone', 'Pick any flavor at your favorite ice cream shop!', 50, '🍦']);
  await pool.query('INSERT INTO rewards (name, description, points_cost, image_emoji) VALUES ($1,$2,$3,$4)', ['Movie Night Pick', 'You choose the family movie night film!', 75, '🎬']);
  await pool.query('INSERT INTO rewards (name, description, points_cost, image_emoji) VALUES ($1,$2,$3,$4)', ['30 Min Extra Screen Time', 'Extra 30 minutes of games or TV', 40, '📱']);
  await pool.query('INSERT INTO rewards (name, description, points_cost, image_emoji) VALUES ($1,$2,$3,$4)', ['Pizza Night Choice', 'Choose the pizza toppings for family pizza night', 60, '🍕']);
  await pool.query('INSERT INTO rewards (name, description, points_cost, image_emoji) VALUES ($1,$2,$3,$4)', ['Stay Up 30 Min Late', 'Stay up an extra 30 minutes past bedtime', 80, '⭐']);

  await pool.query("INSERT INTO shopping_items (name, quantity, category) VALUES ($1,$2,$3)", ['Milk', '1 gallon', 'Dairy']);
  await pool.query("INSERT INTO shopping_items (name, quantity, category) VALUES ($1,$2,$3)", ['Eggs', '2 dozen', 'Dairy']);
  await pool.query("INSERT INTO shopping_items (name, quantity, category) VALUES ($1,$2,$3)", ['Apples', '6', 'Produce']);
  await pool.query("INSERT INTO shopping_items (name, quantity, category) VALUES ($1,$2,$3)", ['Chicken Breast', '2 lbs', 'Meat']);
  await pool.query("INSERT INTO shopping_items (name, quantity, category, completed) VALUES ($1,$2,$3,$4)", ['Pasta', '3 boxes', 'Pantry', true]);
  await pool.query("INSERT INTO shopping_items (name, quantity, category) VALUES ($1,$2,$3)", ['Bread', '1 loaf', 'Bakery']);
  await pool.query("INSERT INTO shopping_items (name, quantity, category) VALUES ($1,$2,$3)", ['Orange Juice', '1 carton', 'Beverages']);

  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const meals = [
    { offset: 0, type: 'breakfast', name: 'Pancakes & Bacon', notes: 'Use blueberries' },
    { offset: 0, type: 'lunch', name: 'Grilled Cheese', notes: '' },
    { offset: 0, type: 'dinner', name: 'Spaghetti Bolognese', notes: 'Emma likes extra sauce' },
    { offset: 1, type: 'breakfast', name: 'Oatmeal', notes: 'With honey and berries' },
    { offset: 1, type: 'dinner', name: 'Chicken Tacos', notes: '' },
    { offset: 2, type: 'breakfast', name: 'Scrambled Eggs', notes: '' },
    { offset: 2, type: 'lunch', name: 'PB&J Sandwiches', notes: '' },
    { offset: 2, type: 'dinner', name: 'Pizza Night', notes: 'Order from Tonys' },
    { offset: 3, type: 'breakfast', name: 'Cereal', notes: '' },
    { offset: 3, type: 'dinner', name: 'Salmon with Veggies', notes: '' },
    { offset: 4, type: 'breakfast', name: 'French Toast', notes: '' },
    { offset: 4, type: 'dinner', name: 'Burgers on the Grill', notes: '' },
    { offset: 5, type: 'breakfast', name: 'Waffles', notes: 'With strawberries and whipped cream' },
    { offset: 5, type: 'lunch', name: 'Leftovers', notes: '' },
    { offset: 5, type: 'dinner', name: 'Steak Night', notes: '' },
    { offset: 6, type: 'breakfast', name: 'Bagels & Cream Cheese', notes: '' },
    { offset: 6, type: 'dinner', name: 'Roast Chicken', notes: 'Slow cooker - start at noon' },
  ];
  for (const meal of meals) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + meal.offset);
    await pool.query('INSERT INTO meal_plans (plan_date, meal_type, recipe_name, notes) VALUES ($1,$2,$3,$4)',
      [d.toISOString().split('T')[0], meal.type, meal.name, meal.notes]);
  }

  await pool.query("INSERT INTO app_settings (family_name, timezone) VALUES ($1,$2)", ['The Smith Family', 'America/New_York']);
}

export default pool;
export { pool };
