export type TaskCategory =
  | 'Learning'
  | 'Coding Practice'
  | 'Project'
  | 'Revision'
  | 'Personal';

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskReminder {
  id: string;
  enabled: boolean;
  triggerTime: string; // ISO string or time string HH:mm
  notificationId?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  language?: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  deadline?: string; // HH:mm
  completed: boolean;
  completedAt?: string;
  subtasks: Subtask[];
  reminder?: TaskReminder;
  createdAt: string;
  updatedAt: string;
}

export type TopicLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface RoadmapTopic {
  id: string;
  title: string;
  level: TopicLevel;
  description: string;
  objectives: string[];
  exercises: string[];
  miniProjects: string[];
  revisionTasks: string[];
  completed: boolean;
  completedAt?: string;
}

export interface RoadmapLanguage {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  topics: RoadmapTopic[];
}

export interface DailyChecklistItem {
  id: string;
  title: string;
  category: 'Learning' | 'Coding' | 'Revision' | 'Project' | 'Custom';
  completed: boolean;
  date: string; // YYYY-MM-DD
  language?: string;
}

export interface StudySession {
  id: string;
  language: string;
  durationMinutes: number;
  completedAt: string; // ISO string
  type: 'focus' | 'short_break' | 'long_break';
  taskId?: string;
}

export interface UserSettings {
  theme: 'system' | 'dark' | 'light';
  focusDuration: number; // default 25
  shortBreakDuration: number; // default 5
  longBreakDuration: number; // default 15
  notificationsEnabled: boolean;
  userName: string;
  dailyStudyGoalMinutes: number; // default 60
}

export interface AppStats {
  todayTotalTasks: number;
  todayCompletedTasks: number;
  todayPendingTasks: number;
  todayCompletionRate: number;
  todayStudyMinutes: number;
  currentStreak: number;
  longestStreak: number;
  totalTopicsCompleted: number;
}

export interface User {
  id: number;
  email: string;
  username: string;
  fullName?: string;
  avatarUrl?: string;
  streak: number;
  totalFocusMinutes: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt?: string;
}
