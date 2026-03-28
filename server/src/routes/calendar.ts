import { Router, Request, Response } from 'express';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { getDb } from '../database';

const router = Router();

function getGoogleClient(): OAuth2Client {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

// GET /api/calendar/events
router.get('/events', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const settings = db.prepare('SELECT * FROM calendar_settings WHERE id = 1').get() as any;

    if (!settings?.google_access_token) {
      // Return sample events if not connected
      const today = new Date();
      const sampleEvents = [
        {
          id: 'sample-1',
          summary: 'Family Dinner',
          start: { dateTime: new Date(today.setHours(18, 30)).toISOString() },
          end: { dateTime: new Date(today.setHours(20, 0)).toISOString() },
          colorId: '5',
          description: 'Sample event - Connect Google Calendar in Settings',
          isSample: true,
        },
        {
          id: 'sample-2',
          summary: 'Soccer Practice',
          start: { dateTime: new Date(new Date().setHours(15, 0)).toISOString() },
          end: { dateTime: new Date(new Date().setHours(16, 30)).toISOString() },
          colorId: '2',
          description: 'Jake\'s soccer practice',
          isSample: true,
        },
        {
          id: 'sample-3',
          summary: 'Piano Lesson',
          start: { dateTime: new Date(new Date(Date.now() + 86400000).setHours(16, 0)).toISOString() },
          end: { dateTime: new Date(new Date(Date.now() + 86400000).setHours(17, 0)).toISOString() },
          colorId: '6',
          description: 'Emma\'s piano lesson',
          isSample: true,
        },
        {
          id: 'sample-4',
          summary: 'Dentist Appointment',
          start: { dateTime: new Date(new Date(Date.now() + 2 * 86400000).setHours(10, 0)).toISOString() },
          end: { dateTime: new Date(new Date(Date.now() + 2 * 86400000).setHours(11, 0)).toISOString() },
          colorId: '11',
          description: 'Annual checkup',
          isSample: true,
        },
        {
          id: 'sample-5',
          summary: 'Family Movie Night',
          start: { date: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0] },
          end: { date: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0] },
          colorId: '3',
          description: 'Everyone picks a movie',
          isSample: true,
        },
      ];
      return res.json({ events: sampleEvents, connected: false, message: 'Showing sample events. Connect Google Calendar in Settings for real events.' });
    }

    const auth = getGoogleClient();
    auth.setCredentials({
      access_token: settings.google_access_token,
      refresh_token: settings.google_refresh_token,
    });

    // Auto-refresh token if expired
    auth.on('tokens', (tokens) => {
      if (tokens.access_token) {
        db.prepare('UPDATE calendar_settings SET google_access_token = ? WHERE id = 1')
          .run(tokens.access_token);
      }
    });

    const calendar = google.calendar({ version: 'v3', auth });

    const { timeMin, timeMax, calendarId } = req.query;
    const now = new Date();
    const startTime = timeMin ? new Date(timeMin as string).toISOString() : new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endTime = timeMax ? new Date(timeMax as string).toISOString() : new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString();

    const response = await calendar.events.list({
      calendarId: (calendarId as string) || settings.google_calendar_id || 'primary',
      timeMin: startTime,
      timeMax: endTime,
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 250,
    });

    res.json({ events: response.data.items || [], connected: true });
  } catch (err: any) {
    console.error('Calendar events error:', err?.message);
    if (err?.code === 401 || err?.status === 401) {
      return res.status(401).json({ error: 'Google Calendar token expired. Please reconnect in Settings.' });
    }
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
});

// GET /api/calendar/calendars - list available calendars
router.get('/calendars', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const settings = db.prepare('SELECT * FROM calendar_settings WHERE id = 1').get() as any;

    if (!settings?.google_access_token) {
      return res.status(401).json({ error: 'Google Calendar not connected' });
    }

    const auth = getGoogleClient();
    auth.setCredentials({
      access_token: settings.google_access_token,
      refresh_token: settings.google_refresh_token,
    });

    const calendar = google.calendar({ version: 'v3', auth });
    const response = await calendar.calendarList.list();

    res.json(response.data.items || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch calendars' });
  }
});

// POST /api/calendar/settings
router.post('/settings', (req: Request, res: Response) => {
  try {
    const { google_calendar_id } = req.body;
    const db = getDb();
    const existing = db.prepare('SELECT * FROM calendar_settings WHERE id = 1').get();

    if (existing) {
      db.prepare('UPDATE calendar_settings SET google_calendar_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1')
        .run(google_calendar_id);
    } else {
      db.prepare('INSERT INTO calendar_settings (google_calendar_id) VALUES (?)').run(google_calendar_id);
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update calendar settings' });
  }
});

// POST /api/calendar/events - Create new event
router.post('/events', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const settings = db.prepare('SELECT * FROM calendar_settings WHERE id = 1').get() as any;

    if (!settings?.google_access_token) {
      return res.status(401).json({ error: 'Google Calendar not connected' });
    }

    const auth = getGoogleClient();
    auth.setCredentials({
      access_token: settings.google_access_token,
      refresh_token: settings.google_refresh_token,
    });

    const calendar = google.calendar({ version: 'v3', auth });
    const { summary, description, start, end, colorId } = req.body;

    const response = await calendar.events.insert({
      calendarId: settings.google_calendar_id || 'primary',
      requestBody: { summary, description, start, end, colorId },
    });

    res.status(201).json(response.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create calendar event' });
  }
});

export default router;
