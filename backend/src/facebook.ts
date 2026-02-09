// Facebook API integration stub
// In a real app, use Facebook Graph API and store tokens securely
import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
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
  db.run(
    'CREATE TABLE IF NOT EXISTS fb_analysis (id INTEGER PRIMARY KEY AUTOINCREMENT, ts INTEGER NOT NULL, data TEXT NOT NULL)'
  );
  db.run('CREATE TABLE IF NOT EXISTS fb_deletion (id INTEGER PRIMARY KEY AUTOINCREMENT, userId TEXT NOT NULL, confirmationCode TEXT NOT NULL, ts INTEGER NOT NULL)');
});

// Try to load page credentials from common JSON files and persist to DB
async function loadCredentialsFromFiles() {
  const candidates: string[] = [];
  if (process.env.FB_PAGE_JSON) candidates.push(process.env.FB_PAGE_JSON);
  candidates.push('/tmp/fb_page.json');
  candidates.push(path.resolve(process.cwd(), 'data', 'fb_page.json'));
  candidates.push(path.resolve(process.cwd(), 'config', 'fb_page.json'));
  candidates.push(path.resolve(process.cwd(), 'fb_page.json'));

  for (const p of candidates) {
    if (!p) continue;
    try {
      if (!fs.existsSync(p)) continue;
      const raw = fs.readFileSync(p, 'utf8');
      const parsed: any = JSON.parse(raw);
      const pageId = parsed.pageId || parsed.page_id || parsed.id || parsed.page?.pageId;
      const pageName = parsed.pageName || parsed.page_name || parsed.name || parsed.page?.pageName;
      const accessToken = parsed.accessToken || parsed.access_token || parsed.token || parsed.page?.accessToken;
      if (pageId && pageName && accessToken) {
        await withDb(db => {
          const existing: any = queryOne(db, 'SELECT pageId, pageName FROM fb_page WHERE id = 1');
          if (!existing) {
            db.run('DELETE FROM fb_page');
            db.run('INSERT INTO fb_page (id, pageId, pageName, accessToken) VALUES (1, ?, ?, ?)', [String(pageId), String(pageName), String(accessToken)]);
            saveDb(db);
            console.info('Loaded Facebook page credentials from', p);
          } else if (existing.pageId !== String(pageId) || existing.pageName !== String(pageName)) {
            db.run('UPDATE fb_page SET pageId = ?, pageName = ?, accessToken = ? WHERE id = 1', [String(pageId), String(pageName), String(accessToken)]);
            saveDb(db);
            console.info('Updated Facebook page credentials from', p);
          }
        });
        // stop after first valid file
        return;
      }
    } catch (err) {
      console.warn('Failed to load FB credentials from', p, (err as any)?.message || err);
    }
  }
}

// Ensure credentials are loaded on module import/startup
loadCredentialsFromFiles().catch(err => console.warn('loadCredentialsFromFiles error', err));

function base64UrlDecode(str: string) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64').toString('utf8');
}

function parseSignedRequest(signedRequest: string) {
  try {
    const [encodedSig, encodedPayload] = signedRequest.split('.');
    const sig = Buffer.from(encodedSig.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    const appSecret = process.env.FB_APP_SECRET || '';
    if (appSecret) {
      const expectedSig = crypto.createHmac('sha256', appSecret).update(encodedPayload).digest();
      if (!crypto.timingSafeEqual(expectedSig, sig)) {
        throw new Error('Invalid signature');
      }
    }
    return payload;
  } catch (err) {
    return null;
  }
}

function appsecretProof(accessToken: string) {
  const appSecret = process.env.FB_APP_SECRET || '';
  if (!appSecret || !accessToken) return '';
  try {
    return crypto.createHmac('sha256', appSecret).update(accessToken).digest('hex');
  } catch (e) {
    return '';
  }
}

// Status endpoint: reports whether page credentials exist and token appears valid
router.get('/status', async (req, res) => {
  await schemaReady;
  let details: any = null;
  await withDb(db => {
    details = queryOne(db, 'SELECT pageId, pageName, accessToken FROM fb_page WHERE id = 1');
  });
  if (!details) return res.json({ connected: false, message: 'No page configured' });
  try {
    const fbBase = 'https://graph.facebook.com/v17.0';
    const proof = appsecretProof(details.accessToken);
    let statusUrl = `${fbBase}/${encodeURIComponent(details.pageId)}?fields=id,name&access_token=${encodeURIComponent(details.accessToken)}`;
    if (proof) statusUrl += `&appsecret_proof=${encodeURIComponent(proof)}`;
    const resp = await fetch(statusUrl);
    const j = await resp.json().catch(() => null);
    if (!resp.ok) return res.json({ connected: false, details: j });
    return res.json({ connected: true, page: j });
  } catch (err) {
    return res.json({ connected: false, message: 'Validation failed', error: String(err) });
  }
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
    const proof = appsecretProof(accessToken);
    const meUrl = `https://graph.facebook.com/v17.0/me?access_token=${encodeURIComponent(accessToken)}${proof ? `&appsecret_proof=${encodeURIComponent(proof)}` : ''}`;
    const meResp = await fetch(meUrl);
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
    const proof = appsecretProof(accessToken);
    if (imageUrl) {
      const url = `${fbBase}/${encodeURIComponent(pageId)}/photos`;
      const body = new URLSearchParams();
      body.append('url', imageUrl);
      if (message) body.append('caption', message);
      body.append('access_token', accessToken);
      if (proof) body.append('appsecret_proof', proof);
      fbResp = await fetch(url, { method: 'POST', body });
    } else {
      const url = `${fbBase}/${encodeURIComponent(pageId)}/feed`;
      const body = new URLSearchParams();
      if (message) body.append('message', message);
      body.append('access_token', accessToken);
      if (proof) body.append('appsecret_proof', proof);
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

async function performDataDeletion(userId: string) {
  await withDb(db => {
    try {
      // Remove any fb_user entry matching this userId
      db.run('DELETE FROM fb_user WHERE userId = ?', [String(userId)]);
    } catch (e) {
      // ignore
    }
    try {
      // Remove any application user records that match (by id, name, or chatUsername)
      db.run('DELETE FROM users WHERE id = ? OR name = ? OR chatUsername = ?', [String(userId), String(userId), String(userId)]);
    } catch (e) {}
    try {
      // Remove global chat entries by this user identifier
      db.run('DELETE FROM global_chat WHERE user = ?', [String(userId)]);
    } catch (e) {}
    // record deletion event
    const confirmation = crypto.randomBytes(12).toString('hex');
    try {
      const ts = Math.floor(Date.now() / 1000);
      const stmt = db.prepare('INSERT INTO fb_deletion (userId, confirmationCode, ts) VALUES (?, ?, ?)');
      stmt.run([String(userId), confirmation, ts]);
      stmt.free && stmt.free();
      saveDb(db);
    } catch (e) {}
    return true;
  });
  return true;
}

// Deauthorize callback — Facebook calls this when a user removes the app
router.post('/deauthorize', async (req, res) => {
  try {
    const body = req.body || {};
    let userId: string | null = null;
    if (body.signed_request) {
      const parsed = parseSignedRequest(body.signed_request);
      if (parsed && parsed.user_id) userId = String(parsed.user_id);
    }
    if (!userId && body.user_id) userId = String(body.user_id);
    if (!userId) return res.status(400).json({ success: false, message: 'No user identifier provided' });
    await performDataDeletion(userId);
    // Respond 200 OK
    return res.json({ success: true });
  } catch (err) {
    console.error('deauthorize handler error', err);
    return res.status(500).json({ success: false, message: 'Internal error' });
  }
});

// Data Deletion Request handler — respond with JSON containing status URL and confirmation_code
router.post('/data_deletion', async (req, res) => {
  try {
    const body = req.body || {};
    let userId: string | null = null;
    if (body.signed_request) {
      const parsed = parseSignedRequest(body.signed_request);
      if (parsed && parsed.user_id) userId = String(parsed.user_id);
    }
    if (!userId && body.user_id) userId = String(body.user_id);
    if (!userId) return res.status(400).json({ success: false, message: 'No user identifier provided' });
    // perform deletion asynchronously
    await performDataDeletion(userId);
    // build status URL for Facebook to show to user (use this backend's host)
    const host = (req.get && req.get('host')) || 'sublime-art-production-4fe1.up.railway.app';
    const proto = (req.headers && (req.headers['x-forwarded-proto'] as string)) || req.protocol || 'https';
    const statusUrl = `${proto}://${host}/api/facebook/deletion-status/${encodeURIComponent(userId)}`;
    // fetch most recent confirmation code from DB
    let confirmation = '';
    await withDb(db => {
      const row = queryOne<{ confirmationCode: string }>(db, 'SELECT confirmationCode FROM fb_deletion WHERE userId = ? ORDER BY id DESC LIMIT 1', [userId]);
      if (row && row.confirmationCode) confirmation = row.confirmationCode;
    });
    if (!confirmation) confirmation = crypto.randomBytes(12).toString('hex');
    return res.json({ url: statusUrl, confirmation_code: confirmation });
  } catch (err) {
    console.error('data_deletion handler error', err);
    return res.status(500).json({ success: false, message: 'Internal error' });
  }
});

// Public status page used by Facebook after deletion request
router.get('/deletion-status/:userId', async (req, res) => {
  const { userId } = req.params;
  let row: any = null;
  await withDb(db => {
    row = queryOne(db, 'SELECT confirmationCode, ts FROM fb_deletion WHERE userId = ? ORDER BY id DESC LIMIT 1', [userId]);
  });
  if (!row) return res.status(404).json({ success: false, message: 'No deletion record found' });
  return res.json({ success: true, userId, confirmation_code: row.confirmationCode, ts: row.ts });
});

// Programmatic publish helper used by scheduler: returns the JSON result from FB or throws.
export async function publishPost(pageId: string, accessToken: string, message?: string, imageUrl?: string): Promise<any> {
  const fbBase = 'https://graph.facebook.com/v17.0';
  let fbResp: Response | null = null;
  const proof = appsecretProof(accessToken);
  if (imageUrl) {
    const url = `${fbBase}/${encodeURIComponent(pageId)}/photos`;
    const body = new URLSearchParams();
    body.append('url', imageUrl);
    if (message) body.append('caption', message);
    body.append('access_token', accessToken);
    body.append('published', 'true'); // Ensure photo post is public
    if (proof) body.append('appsecret_proof', proof);
    fbResp = await fetch(url, { method: 'POST', body });
  } else {
    const url = `${fbBase}/${encodeURIComponent(pageId)}/feed`;
    const body = new URLSearchParams();
    if (message) body.append('message', message);
    body.append('access_token', accessToken);
    body.append('published', 'true'); // Ensure feed post is public
    if (proof) body.append('appsecret_proof', proof);
    fbResp = await fetch(url, { method: 'POST', body });
  }
  if (!fbResp) throw new Error('Failed to call Facebook API');
  const fbJson = await fbResp.json().catch(() => null);
  if (!fbResp.ok) {
    const err = new Error('Facebook API error: ' + JSON.stringify(fbJson));
    (err as any).details = fbJson;
    throw err;
  }
  return fbJson;
}

export default router;

// Background: fetch analysis periodically and store last result
async function fetchPageAnalysis() {
  await schemaReady;
  let details: any = null;
  await withDb(db => {
    details = queryOne(db, 'SELECT pageId, accessToken FROM fb_page WHERE id = 1');
  });
  if (!details || !details.pageId || !details.accessToken) {
    throw new Error('Facebook page not configured');
  }
  const pageId = details.pageId;
  const token = details.accessToken;
  const fbBase = 'https://graph.facebook.com/v17.0';
  try {
    // Fetch basic page fields
    const proof = appsecretProof(token);
    const pageUrl = `${fbBase}/${encodeURIComponent(pageId)}?fields=name,about,fan_count,followers_count&access_token=${encodeURIComponent(token)}${proof ? `&appsecret_proof=${encodeURIComponent(proof)}` : ''}`;
    const pageResp = await fetch(pageUrl);
    const pageJson = await pageResp.json().catch(() => null);
    // Fetch recent posts (last 5)
    // Request summary counts for reactions and comments, shares, and include thumbnails/attachments
    const postsUrl = `${fbBase}/${encodeURIComponent(pageId)}/posts?limit=5&fields=message,created_time,full_picture,attachments{media,media_type,url,subattachments{media}},reactions.summary(true).limit(0),comments.summary(true).limit(0),shares&access_token=${encodeURIComponent(token)}${proof ? `&appsecret_proof=${encodeURIComponent(proof)}` : ''}`;
    const postsResp = await fetch(postsUrl);
    const postsJson = await postsResp.json().catch(() => null);
    const summary = { ts: Date.now(), page: pageJson, posts: postsJson };
    await withDb(db => {
      const stmt = db.prepare('INSERT INTO fb_analysis (ts, data) VALUES (?, ?)');
      stmt.run([Math.floor(Date.now() / 1000), JSON.stringify(summary)]);
      stmt.free && stmt.free();
      saveDb(db);
    });
    return summary;
  } catch (err) {
    console.error('fetchPageAnalysis error', err);
    throw err;
  }
}

// Expose analysis endpoints
router.get('/analysis/latest', async (req, res) => {
  await schemaReady;
  let row: any = null;
  await withDb(db => {
    row = queryOne(db, 'SELECT ts, data FROM fb_analysis ORDER BY id DESC LIMIT 1');
  });
  if (!row) return res.status(404).json({ success: false, message: 'No analysis available' });
  try {
    const data = JSON.parse(row.data);
    return res.json({ success: true, ts: row.ts, data });
  } catch (err) {
    return res.json({ success: true, ts: row.ts, data: row.data });
  }
});

// Return last N analysis entries (default 2)
router.get('/analysis/history', async (req, res) => {
  await schemaReady;
  const limit = Math.max(1, Math.min(50, Number(req.query.limit) || 2));
  let rows: any[] = [];
  await withDb(db => {
    const stmt = db.prepare('SELECT ts, data FROM fb_analysis ORDER BY id DESC LIMIT ?');
    stmt.bind([limit]);
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free && stmt.free();
  });
  // parse JSON data for each row
  const parsed = rows.map(r => {
    try {
      return { ts: r.ts, data: JSON.parse(r.data) };
    } catch (e) {
      return { ts: r.ts, data: r.data };
    }
  });
  res.json({ success: true, entries: parsed });
});

router.post('/analysis/refresh', async (req, res) => {
  try {
    const result = await fetchPageAnalysis();
    return res.json({ success: true, result });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || 'Failed to fetch analysis' });
  }
});

// Run immediately and then hourly
(async () => {
  try {
    await fetchPageAnalysis().catch(() => null);
  } catch (e) {
    // ignore
  }
  setInterval(() => {
    fetchPageAnalysis().catch(err => console.error('scheduled analysis failed', err));
  }, 1000 * 60 * 60);
})();
