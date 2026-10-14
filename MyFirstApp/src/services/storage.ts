import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, RoadmapLanguage, DailyChecklistItem, StudySession, UserSettings } from '@/types';
import { INITIAL_ROADMAPS } from '@/data/roadmapsData';

const STORAGE_KEYS = {
  TASKS: '@codetrack_tasks_v1',
  ROADMAPS: '@codetrack_roadmaps_v1',
  CHECKLIST_PREFIX: '@codetrack_checklist_',
  STUDY_SESSIONS: '@codetrack_sessions_v1',
  SETTINGS: '@codetrack_settings_v1',
  HAS_SEEDED: '@codetrack_has_seeded_v1',
};

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  notificationsEnabled: true,
  userName: 'Developer',
  dailyStudyGoalMinutes: 90,
};

function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const SEED_TASKS: Task[] = [
  {
    id: 'seed-task-1',
    title: 'Implement Binary Search & 2 Pointers in Python',
    description: 'Solve 3 LeetCode problems covering two pointers and binary search on sorted arrays.',
    category: 'Coding Practice',
    priority: 'High',
    language: 'Python',
    date: getTodayString(),
    startTime: '10:00',
    deadline: '12:00',
    completed: true,
    completedAt: new Date(Date.now() - 3600000).toISOString(),
    subtasks: [
      { id: 'st-1', title: 'Two Sum II - Sorted array', completed: true },
      { id: 'st-2', title: 'Binary Search iterative implementation', completed: true },
      { id: 'st-3', title: 'Search in Rotated Sorted Array', completed: true },
    ],
    reminder: { id: 'rem-1', enabled: false, triggerTime: '09:45' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seed-task-2',
    title: 'Study TypeScript Discriminated Unions',
    description: 'Go through TypeScript roadmap module on pattern matching, narrowing, and exhaustive checking.',
    category: 'Learning',
    priority: 'Urgent',
    language: 'TypeScript',
    date: getTodayString(),
    startTime: '14:00',
    deadline: '16:00',
    completed: false,
    subtasks: [
      { id: 'st-4', title: 'Read TypeScript handbook on Narrowing', completed: true },
      { id: 'st-5', title: 'Refactor Redux reducer actions to discriminated unions', completed: false },
      { id: 'st-6', title: 'Implement assertNever exhaustive checker', completed: false },
    ],
    reminder: { id: 'rem-2', enabled: true, triggerTime: '13:50' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seed-task-3',
    title: 'Build CodeTrack Task Filter & Search UI',
    description: 'Create responsive filter tabs and animated search bar in React Native.',
    category: 'Project',
    priority: 'High',
    language: 'React Native',
    date: getTodayString(),
    startTime: '16:30',
    deadline: '18:30',
    completed: false,
    subtasks: [
      { id: 'st-7', title: 'Build Category and Priority pill selectors', completed: false },
      { id: 'st-8', title: 'Implement real-time fuzzy filter algorithm', completed: false },
    ],
    reminder: { id: 'rem-3', enabled: true, triggerTime: '16:20' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seed-task-4',
    title: 'Review SQL Window Functions (LAG / LEAD)',
    description: 'Revise window partition queries and calculate 7-day moving averages.',
    category: 'Revision',
    priority: 'Medium',
    language: 'SQL',
    date: getTodayString(),
    startTime: '20:00',
    deadline: '21:00',
    completed: false,
    subtasks: [
      { id: 'st-9', title: 'Write ROW_NUMBER() vs DENSE_RANK() examples', completed: false },
      { id: 'st-10', title: 'Run EXPLAIN query plans on PostgreSQL', completed: false },
    ],
    reminder: { id: 'rem-4', enabled: false, triggerTime: '19:45' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const SEED_CHECKLIST: DailyChecklistItem[] = [
  { id: 'cl-1', title: 'Solve 1 algorithmic problem on LeetCode', category: 'Coding', completed: true, date: getTodayString() },
  { id: 'cl-2', title: 'Read 1 technical article or roadmap topic', category: 'Learning', completed: true, date: getTodayString() },
  { id: 'cl-3', title: 'Commit code to GitHub repository', category: 'Project', completed: false, date: getTodayString() },
  { id: 'cl-4', title: 'Review flashcards on SQL / DB indexing', category: 'Revision', completed: false, date: getTodayString() },
  { id: 'cl-5', title: '30-minute deep focus Pomodoro session', category: 'Custom', completed: true, date: getTodayString() },
];

export const SEED_SESSIONS: StudySession[] = [
  { id: 'sess-1', language: 'Python', durationMinutes: 25, completedAt: new Date(Date.now() - 7200000).toISOString(), type: 'focus' },
  { id: 'sess-2', language: 'TypeScript', durationMinutes: 25, completedAt: new Date(Date.now() - 3600000).toISOString(), type: 'focus' },
  { id: 'sess-3', language: 'React Native', durationMinutes: 30, completedAt: new Date().toISOString(), type: 'focus' },
];

export const StorageService = {
  async initStorage(): Promise<void> {
    try {
      const hasSeeded = await AsyncStorage.getItem(STORAGE_KEYS.HAS_SEEDED);
      if (!hasSeeded) {
        await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(SEED_TASKS));
        await AsyncStorage.setItem(STORAGE_KEYS.ROADMAPS, JSON.stringify(INITIAL_ROADMAPS));
        await AsyncStorage.setItem(STORAGE_KEYS.CHECKLIST_PREFIX + getTodayString(), JSON.stringify(SEED_CHECKLIST));
        await AsyncStorage.setItem(STORAGE_KEYS.STUDY_SESSIONS, JSON.stringify(SEED_SESSIONS));
        await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
        await AsyncStorage.setItem(STORAGE_KEYS.HAS_SEEDED, 'true');
      }
    } catch (e) {
      console.warn('Storage init error:', e);
    }
  },

  async getTasks(): Promise<Task[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TASKS);
      if (data) {
        return JSON.parse(data);
      }
      return SEED_TASKS;
    } catch (e) {
      console.error('getTasks error:', e);
      return SEED_TASKS;
    }
  },

  async saveTasks(tasks: Task[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch (e) {
      console.error('saveTasks error:', e);
    }
  },

  async getRoadmaps(): Promise<RoadmapLanguage[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ROADMAPS);
      if (data) {
        return JSON.parse(data);
      }
      return INITIAL_ROADMAPS;
    } catch (e) {
      console.error('getRoadmaps error:', e);
      return INITIAL_ROADMAPS;
    }
  },

  async saveRoadmaps(roadmaps: RoadmapLanguage[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ROADMAPS, JSON.stringify(roadmaps));
    } catch (e) {
      console.error('saveRoadmaps error:', e);
    }
  },

  async getChecklist(date: string): Promise<DailyChecklistItem[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CHECKLIST_PREFIX + date);
      if (data) {
        return JSON.parse(data);
      }
      // If today and no checklist yet, return default template
      if (date === getTodayString()) {
        return SEED_CHECKLIST;
      }
      return [];
    } catch (e) {
      console.error('getChecklist error:', e);
      return [];
    }
  },

  async saveChecklist(date: string, items: DailyChecklistItem[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CHECKLIST_PREFIX + date, JSON.stringify(items));
    } catch (e) {
      console.error('saveChecklist error:', e);
    }
  },

  async getStudySessions(): Promise<StudySession[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.STUDY_SESSIONS);
      if (data) {
        return JSON.parse(data);
      }
      return SEED_SESSIONS;
    } catch (e) {
      console.error('getStudySessions error:', e);
      return SEED_SESSIONS;
    }
  },

  async saveStudySessions(sessions: StudySession[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.STUDY_SESSIONS, JSON.stringify(sessions));
    } catch (e) {
      console.error('saveStudySessions error:', e);
    }
  },

  async getSettings(): Promise<UserSettings> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (data) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      }
      return DEFAULT_SETTINGS;
    } catch (e) {
      console.error('getSettings error:', e);
      return DEFAULT_SETTINGS;
    }
  },

  async saveSettings(settings: UserSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('saveSettings error:', e);
    }
  },

  async resetAllData(): Promise<void> {
    try {
      await AsyncStorage.clear();
      await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(SEED_TASKS));
      await AsyncStorage.setItem(STORAGE_KEYS.ROADMAPS, JSON.stringify(INITIAL_ROADMAPS));
      await AsyncStorage.setItem(STORAGE_KEYS.CHECKLIST_PREFIX + getTodayString(), JSON.stringify(SEED_CHECKLIST));
      await AsyncStorage.setItem(STORAGE_KEYS.STUDY_SESSIONS, JSON.stringify(SEED_SESSIONS));
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      await AsyncStorage.setItem(STORAGE_KEYS.HAS_SEEDED, 'true');
    } catch (e) {
      console.error('resetAllData error:', e);
    }
  },
};
