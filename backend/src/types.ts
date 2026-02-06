// Shared types for backend

export interface User {
  id: string;
  name: string;
  password: string;
  chatUsername: string;
  role: 'admin' | 'editor' | 'planner';
}

export interface Slot {
  id: string;
  imageUrl: string;
  comments: Comment[];
  abTiming?: {
    enabled: boolean;
    offsetMinutes?: number;
  };
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
}

export interface Meeting {
  id: string;
  agenda: string;
  notes: string;
  actionItems: string[];
  chat: Comment[];
}
