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

export const SEED_TASKS: Task[] = [];
export const SEED_CHECKLIST: DailyChecklistItem[] = [];
export const SEED_SESSIONS: StudySession[] = [];

export const StorageService = {
  async initStorage(): Promise<void> {
    try {
      const hasSeeded = await AsyncStorage.getItem(STORAGE_KEYS.HAS_SEEDED);
      if (!hasSeeded) {
        await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify([]));
        await AsyncStorage.setItem(STORAGE_KEYS.ROADMAPS, JSON.stringify(INITIAL_ROADMAPS));
        await AsyncStorage.setItem(STORAGE_KEYS.CHECKLIST_PREFIX + getTodayString(), JSON.stringify([]));
        await AsyncStorage.setItem(STORAGE_KEYS.STUDY_SESSIONS, JSON.stringify([]));
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
      return [];
    } catch (e) {
      console.error('getTasks error:', e);
      return [];
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
      return [];
    } catch (e) {
      console.error('getStudySessions error:', e);
      return [];
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
