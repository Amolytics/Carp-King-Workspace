import { Router } from 'express';
import fs from 'fs';
import { emit } from './realtime';
import { withDb, saveDb, queryOne, queryRows, DATA_FILE } from './sqlite';
import { User, Slot, Meeting, Comment } from './types';

const router = Router();

const defaultAdmin: User = {
  id: 'admin-craig',
  name: 'craig needham',
  password: 'craigamo77',
  chatUsername: 'AMO',
  role: 'admin',
};
type GlobalChatMessage = { id: string; user: string; text: string; createdAt: string };

const schemaReady = withDb(db => {
  db.run(
    'CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, password TEXT NOT NULL, chatUsername TEXT NOT NULL, role TEXT NOT NULL)'
  );
  db.run('CREATE TABLE IF NOT EXISTS slots (id TEXT PRIMARY KEY, data TEXT NOT NULL)');
  db.run('CREATE TABLE IF NOT EXISTS meetings (id TEXT PRIMARY KEY, data TEXT NOT NULL)');
  db.run(
    'CREATE TABLE IF NOT EXISTS global_chat (id TEXT PRIMARY KEY, user TEXT NOT NULL, text TEXT NOT NULL, createdAt TEXT NOT NULL)'
  );

  const adminExists = queryOne<{ id: string }>(db, 'SELECT id FROM users WHERE id = ?', [defaultAdmin.id]);
  if (!adminExists) {
    db.run(
      'INSERT INTO users (id, name, password, chatUsername, role) VALUES (?, ?, ?, ?, ?)'
      ,
      [defaultAdmin.id, defaultAdmin.name, defaultAdmin.password, defaultAdmin.chatUsername, defaultAdmin.role]
    );
    saveDb(db);
  }
});

// Admin endpoint to clear all users except default admin
router.post('/clear-users', async (req, res) => {
  await schemaReady;
  await withDb(db => {
    db.run('DELETE FROM users');
    db.run(
      'INSERT INTO users (id, name, password, chatUsername, role) VALUES (?, ?, ?, ?, ?)',
      [defaultAdmin.id, defaultAdmin.name, defaultAdmin.password, defaultAdmin.chatUsername, defaultAdmin.role]
    );
    saveDb(db);
  });
  res.json({ message: 'User list cleared, only default admin remains.' });
});

function requireBackupToken(req: { header: (name: string) => string | undefined }, res: { status: (code: number) => { json: (body: unknown) => void } }) {
  const token = process.env.ADMIN_BACKUP_TOKEN;
  if (!token) {
    res.status(500).json({ error: 'ADMIN_BACKUP_TOKEN is not set.' });
    return false;
  }
  const headerToken = req.header('x-admin-token');
  if (headerToken !== token) {
    res.status(403).json({ error: 'Forbidden' });
    return false;
  }
  return true;
}

function backupFilename() {
  const now = new Date();
  const pad = (value: number) => value.toString().padStart(2, '0');
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `carp-king-backup-${stamp}.sqlite`;
}

// Download a backup of the SQLite database
router.get('/admin/backup', (req, res) => {
  if (!requireBackupToken(req, res)) return;
  if (!fs.existsSync(DATA_FILE)) {
    return res.status(404).json({ error: 'No database file found.' });
  }
  res.download(DATA_FILE, backupFilename());
});

// User sign up
router.post('/signup', async (req, res) => {
  await schemaReady;
  const { name, password, chatUsername } = req.body as {
    name?: string;
    password?: string;
    chatUsername?: string;
  };
  if (!name || !password || !chatUsername) {
    return res.status(400).json({ error: 'Name, password, and chat username are required.' });
  }

  await withDb(db => {
    const existing = queryOne<{ id: string }>(db, 'SELECT id FROM users WHERE name = ?', [name]);
    if (existing) {
      throw new Error('User already exists');
    }

    const role: User['role'] = name.trim().toLowerCase() === 'craig needham' ? 'admin' : 'editor';
    const user: User = { id: Date.now().toString(), name, password, chatUsername, role };
    db.run(
      'INSERT INTO users (id, name, password, chatUsername, role) VALUES (?, ?, ?, ?, ?)',
      [user.id, user.name, user.password, user.chatUsername, user.role]
    );
    saveDb(db);
    res.json({ id: user.id, name: user.name, chatUsername: user.chatUsername, role: user.role });
  }).catch(err => {
    if (err instanceof Error && err.message === 'User already exists') {
      return res.status(409).json({ error: 'User already exists.' });
    }
    return res.status(500).json({ error: 'Signup failed.' });
  });
});

// User login
router.post('/login', async (req, res) => {
  await schemaReady;
  const { name, password } = req.body as { name?: string; password?: string };
  if (!name || !password) {
    return res.status(400).json({ error: 'Name and password are required.' });
  }
  await withDb(db => {
    const user = queryOne<User>(
      db,
      'SELECT id, name, password, chatUsername, role FROM users WHERE name = ? AND password = ?',
      [name, password]
    );
    if (!user) {
      return res.status(401).json({ error: 'Invalid name or password.' });
    }
    res.json({ id: user.id, name: user.name, chatUsername: user.chatUsername, role: user.role });
  });
});

// List all users
router.get('/users', async (req, res) => {
  await schemaReady;
  await withDb(db => {
    const safeUsers = queryRows<User>(db, 'SELECT id, name, chatUsername, role FROM users');
    res.json(safeUsers);
  });
});

// Update user role
router.post('/users/:userId/role', async (req, res) => {
  await schemaReady;
  const { userId } = req.params;
  const { role } = req.body as { role?: User['role'] };
  if (!role || !['admin', 'editor', 'planner'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  await withDb(db => {
    const user = queryOne<User>(db, 'SELECT id, name, chatUsername, role FROM users WHERE id = ?', [userId]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    db.run('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
    saveDb(db);
    res.json({ id: user.id, name: user.name, chatUsername: user.chatUsername, role });
  });
});

// Get all slots
router.get('/slots', async (req, res) => {
  await schemaReady;
  await withDb(db => {
    const rows = queryRows<{ data: string }>(db, 'SELECT data FROM slots');
    const slotData = rows.map(row => JSON.parse(row.data) as Slot);
    res.json(slotData);
  });
});

// Add slot (image upload logic to be added)
router.post('/slots', async (req, res) => {
  await schemaReady;
  await withDb(db => {
    const slot: Slot = { ...req.body, id: Date.now().toString(), comments: [] };
    db.run('INSERT INTO slots (id, data) VALUES (?, ?)', [slot.id, JSON.stringify(slot)]);
    saveDb(db);
    res.json(slot);
  });
});

// Add comment to slot
router.post('/slots/:slotId/comments', async (req, res) => {
  await schemaReady;
  const { slotId } = req.params;
  const { userId, text } = req.body as { userId?: string; text?: string };
  await withDb(db => {
    const row = queryOne<{ data: string }>(db, 'SELECT data FROM slots WHERE id = ?', [slotId]);
    if (!row) return res.status(404).send('Slot not found');
    const slot = JSON.parse(row.data) as Slot;
    const comment: Comment = { id: Date.now().toString(), userId: userId ?? '', text: text ?? '', createdAt: new Date().toISOString() };
    slot.comments.push(comment);
    db.run('UPDATE slots SET data = ? WHERE id = ?', [JSON.stringify(slot), slotId]);
    saveDb(db);
    emit('slot:comment', { slotId, comment });
    res.json(comment);
  });
});

// Get all meetings
router.get('/meetings', async (req, res) => {
  await schemaReady;
  await withDb(db => {
    const rows = queryRows<{ data: string }>(db, 'SELECT data FROM meetings');
    const meetingData = rows.map(row => JSON.parse(row.data) as Meeting);
    res.json(meetingData);
  });
});

// Add meeting
router.post('/meetings', async (req, res) => {
  await schemaReady;
  await withDb(db => {
    const meeting: Meeting = { ...req.body, id: Date.now().toString(), chat: [] };
    db.run('INSERT INTO meetings (id, data) VALUES (?, ?)', [meeting.id, JSON.stringify(meeting)]);
    saveDb(db);
    res.json(meeting);
  });
});

// Remove meeting
router.delete('/meetings/:meetingId', async (req, res) => {
  await schemaReady;
  const { meetingId } = req.params;
  // Simple admin check: require ?admin=1 or x-admin header, or check session if implemented
  const userRole = req.header('x-user-role') || req.query.role;
  if (userRole !== 'admin') {
    return res.status(403).json({ error: 'Only admin can remove meetings.' });
  }
  await withDb(db => {
    const existing = queryOne<{ id: string }>(db, 'SELECT id FROM meetings WHERE id = ?', [meetingId]);
    if (!existing) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    db.run('DELETE FROM meetings WHERE id = ?', [meetingId]);
    saveDb(db);
    res.json({ ok: true });
  });
});

// Add chat message to meeting
router.post('/meetings/:meetingId/chat', async (req, res) => {
  await schemaReady;
  const { meetingId } = req.params;
  const { userId, text } = req.body as { userId?: string; text?: string };
  await withDb(db => {
    const row = queryOne<{ data: string }>(db, 'SELECT data FROM meetings WHERE id = ?', [meetingId]);
    if (!row) return res.status(404).send('Meeting not found');
    const meeting = JSON.parse(row.data) as Meeting;
    const comment: Comment = { id: Date.now().toString(), userId: userId ?? '', text: text ?? '', createdAt: new Date().toISOString() };
    meeting.chat.push(comment);
    db.run('UPDATE meetings SET data = ? WHERE id = ?', [JSON.stringify(meeting), meetingId]);
    saveDb(db);
    emit('meeting:chat', { meetingId, comment });
    res.json(comment);
  });
});

// Global chat history
router.get('/chat/global', async (req, res) => {
  await schemaReady;
  await withDb(db => {
    const rows = queryRows<GlobalChatMessage>(db, 'SELECT id, user, text, createdAt FROM global_chat ORDER BY createdAt ASC');
    res.json(rows);
  });
});

// Global chat message
router.post('/chat/global', async (req, res) => {
  await schemaReady;
  const { user, text } = req.body as { user?: string; text?: string };
  if (!user || !text) {
    return res.status(400).json({ error: 'User and text are required.' });
  }
  await withDb(db => {
    const message: GlobalChatMessage = {
      id: Date.now().toString(),
      user,
      text,
      createdAt: new Date().toISOString(),
    };
    db.run('INSERT INTO global_chat (id, user, text, createdAt) VALUES (?, ?, ?, ?)', [message.id, message.user, message.text, message.createdAt]);
    saveDb(db);
    emit('global:message', message);
    res.json(message);
  });
});

export default router;
