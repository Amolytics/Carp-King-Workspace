// API helpers for frontend
import { Slot, Meeting, User, Comment, GlobalChatMessage } from './types';

export const API_URL = import.meta.env.VITE_API_URL ?? '/api';

// Clear all users except default admin (admin only)
export async function clearUsers(): Promise<any> {
  const res = await fetch(`${API_URL}/clear-users`, {
    method: 'POST',
  });
  return res.json();
}

export async function removeMeeting(meetingId: string): Promise<void> {
  const res = await fetch(`${API_URL}/meetings/${meetingId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to remove meeting');
}


export async function login(name: string, password: string): Promise<User> {
  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, password })
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Login failed');
  return res.json();
}

export async function signup(name: string, password: string, chatUsername: string): Promise<User> {
  const res = await fetch(`${API_URL}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, password, chatUsername })
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Signup failed');
  return res.json();
}

export async function getSlots(): Promise<Slot[]> {
  const res = await fetch(`${API_URL}/slots`);
  return res.json();
}

export async function addSlot(slot: Omit<Slot, 'id' | 'comments'>): Promise<Slot> {
  const res = await fetch(`${API_URL}/slots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(slot)
  });
  return res.json();
}

export async function addComment(slotId: string, userId: string, text: string): Promise<Comment> {
  const res = await fetch(`${API_URL}/slots/${slotId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, text })
  });
  return res.json();
}

export async function getMeetings(): Promise<Meeting[]> {
  const res = await fetch(`${API_URL}/meetings`);
  return res.json();
}

export async function addMeeting(meeting: Omit<Meeting, 'id' | 'chat'>): Promise<Meeting> {
  const res = await fetch(`${API_URL}/meetings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(meeting)
  });
  return res.json();
}

export async function addMeetingChat(meetingId: string, userId: string, text: string): Promise<Comment> {
  const res = await fetch(`${API_URL}/meetings/${meetingId}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, text })
  });
  return res.json();
}

export async function getGlobalChat(): Promise<GlobalChatMessage[]> {
  const res = await fetch(`${API_URL}/chat/global`);
  return res.json();
}

export async function addGlobalChat(user: string, text: string): Promise<GlobalChatMessage> {
  const res = await fetch(`${API_URL}/chat/global`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user, text })
  });
  return res.json();
}
