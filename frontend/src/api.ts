// API helpers for frontend
import { Slot, Meeting, User, Comment, GlobalChatMessage } from './types';

export const API_URL = import.meta.env.VITE_API_URL ?? '/api';

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
  const res = await fetch(`${API_URL}/clear-users`, {
    method: 'POST',
  });
  return parseJsonSafe(res);
}

export async function removeMeeting(meetingId: string): Promise<void> {
  // Try to send admin role header if available
  const userStr = localStorage.getItem('user');
  let role = '';
  try {
    if (userStr) role = JSON.parse(userStr).role;
  } catch {}
  const res = await fetch(`${API_URL}/meetings/${meetingId}`, {
    method: 'DELETE',
    headers: role === 'admin' ? { 'x-user-role': 'admin' } : {},
  });
  if (!res.ok) throw new Error('Failed to remove meeting');
}


export async function login(name: string, password: string): Promise<User> {
  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, password })
  });
  const data = await parseJsonSafe(res);
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data;
}

export async function signup(name: string, password: string, chatUsername: string): Promise<User> {
  const res = await fetch(`${API_URL}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, password, chatUsername })
  });
  const data = await parseJsonSafe(res);
  if (!res.ok) throw new Error(data.error || 'Signup failed');
  return data;
}

export async function getSlots(): Promise<Slot[]> {
  const res = await fetch(`${API_URL}/slots`);
  return parseJsonSafe(res);
}

export async function addSlot(slot: Omit<Slot, 'id' | 'comments'>): Promise<Slot> {
  const res = await fetch(`${API_URL}/slots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(slot)
  });
  return parseJsonSafe(res);
}

export async function addComment(slotId: string, userId: string, text: string): Promise<Comment> {
  const res = await fetch(`${API_URL}/slots/${slotId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, text })
  });
  return parseJsonSafe(res);
}

export async function getMeetings(): Promise<Meeting[]> {
  const res = await fetch(`${API_URL}/meetings`);
  return parseJsonSafe(res);
}

export async function addMeeting(meeting: Omit<Meeting, 'id' | 'chat'>): Promise<Meeting> {
  const res = await fetch(`${API_URL}/meetings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(meeting)
  });
  return parseJsonSafe(res);
}

export async function addMeetingChat(meetingId: string, userId: string, text: string): Promise<Comment> {
  const res = await fetch(`${API_URL}/meetings/${meetingId}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, text })
  });
  return parseJsonSafe(res);
}

export async function getGlobalChat(): Promise<GlobalChatMessage[]> {
  const res = await fetch(`${API_URL}/chat/global`);
  return parseJsonSafe(res);
}

export async function addGlobalChat(user: string, text: string): Promise<GlobalChatMessage> {
  const res = await fetch(`${API_URL}/chat/global`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user, text })
  });
  return parseJsonSafe(res);
}
