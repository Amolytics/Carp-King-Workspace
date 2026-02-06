// Facebook API integration stub
// In a real app, use Facebook Graph API and store tokens securely
import express from 'express';
import { withDb, saveDb, queryOne } from './sqlite';

const router = express.Router();

type FacebookPage = { pageId: string; pageName: string; accessToken: string };
const schemaReady = withDb(db => {
  db.run(
    'CREATE TABLE IF NOT EXISTS fb_page (id INTEGER PRIMARY KEY, pageId TEXT NOT NULL, pageName TEXT NOT NULL, accessToken TEXT NOT NULL)'
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

// Post to Facebook Page (admin only)
router.post('/post', (req, res) => {
  // Accepts: { message, imageUrl }
  // Would call Facebook Graph API here
  res.json({ success: true, message: 'Posted to Facebook (stub)' });
});

export default router;
