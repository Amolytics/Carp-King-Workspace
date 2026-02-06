import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import router from './routes';

import uploadRouter from './upload';
import path from 'path';
import facebookRouter from './facebook';
import { setIo } from './realtime';

const app = express();
const PORT = process.env.PORT || 4000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});
setIo(io);

type PresenceUser = { id: string; name: string; role?: string };
const presenceBySocket = new Map<string, PresenceUser>();

function broadcastPresence() {
  const users = Array.from(presenceBySocket.values());
  io.emit('presence:update', users);
}

// Online users and typing indicator tracking
const typingUsers = new Set<string>();

io.on('connection', socket => {
  socket.on('presence:join', (user: PresenceUser) => {
    if (!user || !user.id || !user.name) return;
    presenceBySocket.set(socket.id, user);
    broadcastPresence();
    // Notify new user of current typing users
    socket.emit('global:typing:update', Array.from(typingUsers));
  });

  socket.on('presence:leave', () => {
    presenceBySocket.delete(socket.id);
    broadcastPresence();
  });

  socket.on('global:typing', (payload: { user: string; isTyping: boolean }) => {
    if (!payload || !payload.user) return;
    if (payload.isTyping) {
      typingUsers.add(payload.user);
    } else {
      typingUsers.delete(payload.user);
    }
    io.emit('global:typing:update', Array.from(typingUsers));
  });

  socket.on('meeting:end', (payload: { meetingId: string }) => {
    if (!payload?.meetingId) return;
    io.emit('meeting:end', payload);
  });

  socket.on('disconnect', () => {
    const user = presenceBySocket.get(socket.id);
    if (user) {
      typingUsers.delete(user.name);
    }
    presenceBySocket.delete(socket.id);
    broadcastPresence();
    io.emit('global:typing:update', Array.from(typingUsers));
  });
});

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Carp King Backend API');
});

app.use('/api', router);

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Image upload endpoint
app.use('/api/upload', uploadRouter);

// Facebook API stub
app.use('/api/facebook', facebookRouter);

server.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
