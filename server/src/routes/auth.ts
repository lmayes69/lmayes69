import { Router, Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { pool } from '../database';
import axios from 'axios';

const router = Router();

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// GET /api/auth/google - Initiate Google OAuth
router.get('/google', (req: Request, res: Response) => {
  const authUrl = googleClient.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
      'profile',
      'email',
    ],
    prompt: 'consent',
  });
  res.redirect(authUrl);
});

// GET /api/auth/google/callback - Google OAuth callback
router.get('/google/callback', async (req: Request, res: Response) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/settings?error=no_code`);
    }

    const { tokens } = await googleClient.getToken(code as string);
    googleClient.setCredentials(tokens);

    const { rows: existingRows } = await pool.query('SELECT * FROM calendar_settings WHERE id = 1');
    const existing = existingRows[0];

    if (existing) {
      await pool.query(`
        UPDATE calendar_settings SET
          google_access_token = $1,
          google_refresh_token = $2,
          updated_at = NOW()
        WHERE id = 1
      `, [tokens.access_token, tokens.refresh_token || existing.google_refresh_token]);
    } else {
      await pool.query(`
        INSERT INTO calendar_settings (google_access_token, google_refresh_token)
        VALUES ($1, $2)
      `, [tokens.access_token, tokens.refresh_token]);
    }

    (req.session as any).googleTokens = tokens;
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/settings?connected=google`);
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/settings?error=google_auth_failed`);
  }
});

// GET /api/auth/microsoft - Initiate Microsoft OAuth
router.get('/microsoft', (req: Request, res: Response) => {
  const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const redirectUri = process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:3001/api/auth/microsoft/callback';

  const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?` +
    `client_id=${clientId}` +
    `&response_type=code` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent('Tasks.ReadWrite offline_access User.Read')}` +
    `&response_mode=query`;

  res.redirect(authUrl);
});

// GET /api/auth/microsoft/callback - Microsoft OAuth callback
router.get('/microsoft/callback', async (req: Request, res: Response) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/settings?error=no_code`);
    }

    const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';
    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

    const params = new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID || '',
      client_secret: process.env.MICROSOFT_CLIENT_SECRET || '',
      code: code as string,
      redirect_uri: process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:3001/api/auth/microsoft/callback',
      grant_type: 'authorization_code',
    });

    const tokenResponse = await axios.post(tokenUrl, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const { access_token, refresh_token } = tokenResponse.data;

    const { rows: existingRows } = await pool.query('SELECT * FROM calendar_settings WHERE id = 1');
    const existing = existingRows[0];

    if (existing) {
      await pool.query(`
        UPDATE calendar_settings SET
          microsoft_access_token = $1,
          microsoft_refresh_token = $2,
          updated_at = NOW()
        WHERE id = 1
      `, [access_token, refresh_token || existing.microsoft_refresh_token]);
    } else {
      await pool.query(`
        INSERT INTO calendar_settings (microsoft_access_token, microsoft_refresh_token)
        VALUES ($1, $2)
      `, [access_token, refresh_token]);
    }

    (req.session as any).microsoftTokens = { access_token, refresh_token };
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/settings?connected=microsoft`);
  } catch (err) {
    console.error('Microsoft OAuth callback error:', err);
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/settings?error=microsoft_auth_failed`);
  }
});

// GET /api/auth/status - Check connection status
router.get('/status', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query('SELECT * FROM calendar_settings WHERE id = 1');
    const settings = rows[0];

    res.json({
      google: {
        connected: !!(settings?.google_access_token),
      },
      microsoft: {
        connected: !!(settings?.microsoft_access_token),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get auth status' });
  }
});

// POST /api/auth/disconnect/google
router.post('/disconnect/google', async (req: Request, res: Response) => {
  try {
    await pool.query(`
      UPDATE calendar_settings SET
        google_access_token = NULL,
        google_refresh_token = NULL,
        google_calendar_id = NULL,
        updated_at = NOW()
      WHERE id = 1
    `);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to disconnect Google' });
  }
});

// POST /api/auth/disconnect/microsoft
router.post('/disconnect/microsoft', async (req: Request, res: Response) => {
  try {
    await pool.query(`
      UPDATE calendar_settings SET
        microsoft_access_token = NULL,
        microsoft_refresh_token = NULL,
        updated_at = NOW()
      WHERE id = 1
    `);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to disconnect Microsoft' });
  }
});

export default router;
