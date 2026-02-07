// API helpers for frontend
import { Slot, Meeting, User, Comment, GlobalChatMessage } from './types';

const defaultApi = typeof window !== 'undefined' && window.location && window.location.hostname === 'localhost'
  ? 'http://localhost:4000/api'
  : '/api';
export const API_URL = ((typeof window !== 'undefined' && (window as any).__API_URL__) || import.meta.env.VITE_API_URL) ?? defaultApi;
// Fallback backend API (used if the site-served /api is the frontend HTML). Set to the known backend domain.
const FALLBACK_API = 'https://sublime-art-production-4fe1.up.railway.app/api';

async function fetchJson(path: string, opts?: RequestInit) {
  const target = path.startsWith('http') ? path : `${API_URL.replace(/\/+$/,'')}${path.startsWith('/') ? '' : '/'}${path}`;
  const res = await fetch(target, opts);
  try {
    return await parseJsonSafe(res);
  } catch (err) {
    // If the response looks like HTML (frontend served), retry once against known backend
    const msg = String((err as any)?.message || err || '');
    if (msg.includes('likely hit the frontend')) {
      const fallback = path.startsWith('http') ? path : `${FALLBACK_API.replace(/\/+$/,'')}${path.startsWith('/') ? '' : '/'}${path}`;
      const res2 = await fetch(fallback, opts);
      return await parseJsonSafe(res2);
    }
    throw err;
  }
}

async function parseJsonSafe(res: Response): Promise<any> {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return res.json();
  }
  const text = await res.text();
  const snippet = text.slice(0, 1024);
  if (text.trim().startsWith('<')) {
    throw new Error(`API request likely hit the frontend (HTML). URL: ${res.url} Status: ${res.status}. Response starts with HTML: ${snippet}\n\nHint: set VITE_API_URL to your backend or configure Vite proxy.`);
  }
  throw new Error(`Unexpected API response format. URL: ${res.url} Status: ${res.status}. Body start: ${snippet}`);
}

// Clear all users except default admin (admin only)
export async function clearUsers(): Promise<any> {
  return fetchJson('/clear-users', { method: 'POST' });
}

export async function removeMeeting(meetingId: string): Promise<void> {
  // Try to send admin role header if available
  const userStr = localStorage.getItem('user');
  let role = '';
  try {
    if (userStr) role = JSON.parse(userStr).role;
  } catch {}
  const headers = role === 'admin' ? { 'x-user-role': 'admin' } : {};
  await fetchJson(`/meetings/${meetingId}`, { method: 'DELETE', headers });
}


export async function login(name: string, password: string): Promise<User> {
  const data = await fetchJson('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, password })
  });
  return data as User;
}

export async function signup(name: string, password: string, chatUsername: string): Promise<User> {
  const data = await fetchJson('/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, password, chatUsername })
  });
  return data as User;
}

export async function getSlots(): Promise<Slot[]> {
  return fetchJson('/slots') as Promise<Slot[]>;
}

export async function addSlot(slot: Omit<Slot, 'id' | 'comments'>): Promise<Slot> {
  const data = await fetchJson('/slots', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(slot)
  });
  return data as Slot;
}

export async function updateSlot(slotId: string, updates: Partial<Omit<Slot, 'id' | 'comments'>>): Promise<Slot> {
  const data = await fetchJson(`/slots/${slotId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  return data as Slot;
}

export async function deleteSlot(slotId: string): Promise<void> {
  await fetchJson(`/slots/${slotId}`, { method: 'DELETE' });
}

export async function postSlotNow(slotId: string): Promise<any> {
  return fetchJson(`/slots/${slotId}/publish`, { method: 'POST' });
}

export async function addComment(slotId: string, userId: string, text: string): Promise<Comment> {
  return fetchJson(`/slots/${slotId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, text })
  }) as Promise<Comment>;
}

export async function getMeetings(): Promise<Meeting[]> {
  return fetchJson('/meetings') as Promise<Meeting[]>;
}

export async function addMeeting(meeting: Omit<Meeting, 'id' | 'chat'>): Promise<Meeting> {
  return fetchJson('/meetings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(meeting)
  }) as Promise<Meeting>;
}

export async function addMeetingChat(meetingId: string, userId: string, text: string): Promise<Comment> {
  return fetchJson(`/meetings/${meetingId}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, text })
  }) as Promise<Comment>;
}

export async function getGlobalChat(): Promise<GlobalChatMessage[]> {
  return fetchJson('/chat/global') as Promise<GlobalChatMessage[]>;
}

export async function addGlobalChat(user: string, text: string): Promise<GlobalChatMessage> {
  return fetchJson('/chat/global', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user, text })
  }) as Promise<GlobalChatMessage>;
}
