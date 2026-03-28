import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '../../family-calendar.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeSchema();
    seedData();
  }
  return db;
}

function initializeSchema() {
  const database = db;

  database.exec(`
    CREATE TABLE IF NOT EXISTS kids (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      age INTEGER,
      avatar TEXT DEFAULT 'default',
      color TEXT DEFAULT '#4F46E5',
      points INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      points_value INTEGER DEFAULT 10,
      frequency TEXT DEFAULT 'daily',
      assigned_kid_id INTEGER REFERENCES kids(id),
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chore_completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chore_id INTEGER NOT NULL REFERENCES chores(id),
      kid_id INTEGER NOT NULL REFERENCES kids(id),
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      points_earned INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      points_cost INTEGER NOT NULL,
      image_emoji TEXT DEFAULT '🎁',
      quantity INTEGER DEFAULT -1,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reward_redemptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reward_id INTEGER NOT NULL REFERENCES rewards(id),
      kid_id INTEGER NOT NULL REFERENCES kids(id),
      redeemed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      points_spent INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS shopping_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      quantity TEXT DEFAULT '1',
      category TEXT DEFAULT 'General',
      completed INTEGER DEFAULT 0,
      list_source TEXT DEFAULT 'manual',
      external_id TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS meal_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_date TEXT NOT NULL,
      meal_type TEXT NOT NULL,
      recipe_name TEXT NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS calendar_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      google_calendar_id TEXT,
      google_access_token TEXT,
      google_refresh_token TEXT,
      microsoft_access_token TEXT,
      microsoft_refresh_token TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      family_name TEXT DEFAULT 'Our Family',
      timezone TEXT DEFAULT 'America/New_York',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function seedData() {
  const database = db;

  const existingKids = database.prepare('SELECT COUNT(*) as count FROM kids').get() as { count: number };
  if (existingKids.count > 0) return;

  // Seed kids
  const insertKid = database.prepare(`
    INSERT INTO kids (name, age, avatar, color, points) VALUES (?, ?, ?, ?, ?)
  `);
  const kid1 = insertKid.run('Emma', 10, '👧', '#EC4899', 125);
  const kid2 = insertKid.run('Jake', 8, '👦', '#4F46E5', 80);

  // Seed chores
  const insertChore = database.prepare(`
    INSERT INTO chores (name, description, points_value, frequency, assigned_kid_id) VALUES (?, ?, ?, ?, ?)
  `);
  insertChore.run('Make Your Bed', 'Make your bed every morning before school', 10, 'daily', kid1.lastInsertRowid);
  insertChore.run('Do Homework', 'Complete all homework before dinner', 20, 'daily', kid1.lastInsertRowid);
  insertChore.run('Clean Your Room', 'Tidy up and vacuum your room', 30, 'weekly', kid2.lastInsertRowid);
  insertChore.run('Take Out Trash', 'Empty all trash cans and take to curb', 25, 'weekly', kid2.lastInsertRowid);
  insertChore.run('Feed the Dog', 'Feed Buddy breakfast and dinner', 15, 'daily', null);

  // Seed some chore completions
  const insertCompletion = database.prepare(`
    INSERT INTO chore_completions (chore_id, kid_id, points_earned, completed_at) VALUES (?, ?, ?, ?)
  `);
  insertCompletion.run(1, kid1.lastInsertRowid, 10, new Date(Date.now() - 86400000).toISOString());
  insertCompletion.run(2, kid1.lastInsertRowid, 20, new Date(Date.now() - 86400000).toISOString());
  insertCompletion.run(3, kid2.lastInsertRowid, 30, new Date(Date.now() - 172800000).toISOString());

  // Seed rewards
  const insertReward = database.prepare(`
    INSERT INTO rewards (name, description, points_cost, image_emoji, quantity) VALUES (?, ?, ?, ?, ?)
  `);
  insertReward.run('Ice Cream Cone', 'Pick any flavor at your favorite ice cream shop!', 50, '🍦', -1);
  insertReward.run('Movie Night Pick', 'You choose the family movie night film!', 75, '🎬', -1);
  insertReward.run('30 Min Extra Screen Time', 'Extra 30 minutes of games or TV', 40, '📱', -1);
  insertReward.run('Pizza Night Choice', 'Choose the pizza toppings for family pizza night', 60, '🍕', -1);
  insertReward.run('Stay Up 30 Min Late', 'Stay up an extra 30 minutes past bedtime', 80, '⭐', -1);

  // Seed shopping items
  const insertShopping = database.prepare(`
    INSERT INTO shopping_items (name, quantity, category, completed) VALUES (?, ?, ?, ?)
  `);
  insertShopping.run('Milk', '1 gallon', 'Dairy', 0);
  insertShopping.run('Eggs', '2 dozen', 'Dairy', 0);
  insertShopping.run('Apples', '6', 'Produce', 0);
  insertShopping.run('Chicken Breast', '2 lbs', 'Meat', 0);
  insertShopping.run('Pasta', '3 boxes', 'Pantry', 1);
  insertShopping.run('Bread', '1 loaf', 'Bakery', 0);
  insertShopping.run('Orange Juice', '1 carton', 'Beverages', 0);

  // Seed meal plans (current week)
  const insertMeal = database.prepare(`
    INSERT INTO meal_plans (plan_date, meal_type, recipe_name, notes) VALUES (?, ?, ?, ?)
  `);

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
    const mealDate = new Date(startOfWeek);
    mealDate.setDate(startOfWeek.getDate() + meal.offset);
    insertMeal.run(mealDate.toISOString().split('T')[0], meal.type, meal.name, meal.notes);
  }

  // Seed app settings
  database.prepare('INSERT INTO app_settings (family_name, timezone) VALUES (?, ?)').run('The Smith Family', 'America/New_York');
}

export default getDb;
