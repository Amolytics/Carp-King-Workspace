// Facebook API integration stub
// In a real app, use Facebook Graph API and store tokens securely
import express from 'express';
import { withDb, saveDb, queryOne } from './sqlite';

const router = express.Router();

type FacebookPage = { pageId: string; pageName: string; accessToken: string };
type FacebookUser = { userId: string; accessToken: string };
const schemaReady = withDb(db => {
  db.run(
    'CREATE TABLE IF NOT EXISTS fb_page (id INTEGER PRIMARY KEY, pageId TEXT NOT NULL, pageName TEXT NOT NULL, accessToken TEXT NOT NULL)'
  );
  db.run(
    'CREATE TABLE IF NOT EXISTS fb_user (id INTEGER PRIMARY KEY, userId TEXT NOT NULL, accessToken TEXT NOT NULL)'
  );
});

// Set Facebook Page credentials (admin only)
router.post('/set-page', async (req, res) => {
  await schemaReady;
  const { pageId, pageName, accessToken } = req.body as Partial<FacebookPage>;
  if (!pageId || !pageName || !accessToken) {
    return res.status(400).json({ success: false, message: 'All fields required.' });
  }
  await withDb(db => {
    db.run('DELETE FROM fb_page');
    db.run('INSERT INTO fb_page (id, pageId, pageName, accessToken) VALUES (1, ?, ?, ?)', [pageId, pageName, accessToken]);
    saveDb(db);
  });
  res.json({ success: true, message: 'Page credentials saved.' });
});

// Get Facebook Page credentials (admin only)
router.get('/get-page', async (req, res) => {
  await schemaReady;
  await withDb(db => {
    const details = queryOne<FacebookPage>(db, 'SELECT pageId, pageName, accessToken FROM fb_page WHERE id = 1');
    if (!details) {
      return res.status(404).json({ success: false, message: 'No page details set.' });
    }
    res.json({ success: true, details });
  });
});

// Remove Facebook Page credentials (admin only)
router.post('/remove-page', async (req, res) => {
  await schemaReady;
  await withDb(db => {
    db.run('DELETE FROM fb_page');
    saveDb(db);
  });
  res.json({ success: true, message: 'Page details removed.' });
});

// Set Facebook User long-lived token (admin only)
router.post('/set-user-token', async (req, res) => {
  await schemaReady;
  const { accessToken } = req.body as Partial<FacebookUser>;
  if (!accessToken) return res.status(400).json({ success: false, message: 'accessToken required' });
  try {
    const meResp = await fetch(`https://graph.facebook.com/v17.0/me?access_token=${encodeURIComponent(accessToken)}`);
    const meJson = await meResp.json().catch(() => null);
    if (!meResp.ok || !meJson || !meJson.id) {
      return res.status(400).json({ success: false, message: 'Invalid user access token', details: meJson });
    }
    const userId = String(meJson.id);
    await withDb(db => {
      db.run('DELETE FROM fb_user');
      db.run('INSERT INTO fb_user (id, userId, accessToken) VALUES (1, ?, ?)', [userId, accessToken]);
      saveDb(db);
    });
    return res.json({ success: true, message: 'User token saved.', userId });
  } catch (err) {
    console.error('set-user-token error:', err);
    return res.status(500).json({ success: false, message: 'Internal error' });
  }
});

// Get Facebook User token metadata (admin only) — does NOT return raw token
router.get('/get-user-token', async (req, res) => {
  await schemaReady;
  let details: any = null;
  await withDb(db => {
    details = queryOne<FacebookUser>(db, 'SELECT userId FROM fb_user WHERE id = 1');
  });
  if (!details) return res.status(404).json({ success: false, message: 'No user token set.' });
  return res.json({ success: true, userId: details.userId });
});

// Remove Facebook User token (admin only)
router.post('/remove-user-token', async (req, res) => {
  await schemaReady;
  await withDb(db => {
    db.run('DELETE FROM fb_user');
    saveDb(db);
  });
  res.json({ success: true, message: 'User token removed.' });
});

// Post to Facebook Page (admin only)
router.post('/post', async (req, res) => {
  // Accepts: { message, imageUrl }
  // Call Facebook Graph API using stored page credentials.
  try {
    await schemaReady;
    const { message, imageUrl } = req.body as { message?: string; imageUrl?: string };
    let details: any = null;
    await withDb(db => {
      details = queryOne<FacebookPage>(db, 'SELECT pageId, accessToken FROM fb_page WHERE id = 1');
    });
    if (!details || !details.pageId || !details.accessToken) {
      return res.status(404).json({ success: false, message: 'Facebook page not configured.' });
    }
    const pageId = details.pageId;
    const accessToken = details.accessToken;

    const fbBase = 'https://graph.facebook.com/v17.0';
    let fbResp: Response | null = null;
    if (imageUrl) {
      const url = `${fbBase}/${encodeURIComponent(pageId)}/photos`;
      const body = new URLSearchParams();
      body.append('url', imageUrl);
      if (message) body.append('caption', message);
      body.append('access_token', accessToken);
      fbResp = await fetch(url, { method: 'POST', body });
    } else {
      const url = `${fbBase}/${encodeURIComponent(pageId)}/feed`;
      const body = new URLSearchParams();
      if (message) body.append('message', message);
      body.append('access_token', accessToken);
      fbResp = await fetch(url, { method: 'POST', body });
    }
    if (!fbResp) throw new Error('Failed to call Facebook API');
    const fbJson = await fbResp.json().catch(() => null);
    if (!fbResp.ok) {
      return res.status(502).json({ success: false, message: 'Facebook API error', details: fbJson });
    }
    return res.json({ success: true, message: 'Posted to Facebook', details: fbJson });
  } catch (err) {
    console.error('facebook.post handler error:', err);
    return res.status(500).json({ success: false, message: (err as Error)?.message ?? 'Internal error' });
  }
});

export default router;
