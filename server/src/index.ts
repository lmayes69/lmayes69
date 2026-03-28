import express from 'express';
import cors from 'cors';
import session from 'express-session';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

import kidsRouter from './routes/kids';
import choresRouter from './routes/chores';
import rewardsRouter from './routes/rewards';
import shoppingRouter from './routes/shopping';
import mealsRouter from './routes/meals';
import calendarRouter from './routes/calendar';
import authRouter from './routes/auth';
import settingsRouter from './routes/settings';
import { initDb } from './database';

const app = express();
const PORT = process.env.PORT || 3001;

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(cors({
  origin: [clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'family-calendar-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
}));

// Routes
app.use('/api/kids', kidsRouter);
app.use('/api/chores', choresRouter);
app.use('/api/rewards', rewardsRouter);
app.use('/api/shopping', shoppingRouter);
app.use('/api/meals', mealsRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/auth', authRouter);
app.use('/api/settings', settingsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const clientDistPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDistPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

async function start() {
  await initDb();
  app.listen(PORT, () => {
    console.log(`Family Calendar Server running on port ${PORT}`);
  });
}

start().catch(console.error);

export default app;
