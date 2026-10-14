import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Task,
  RoadmapLanguage,
  DailyChecklistItem,
  StudySession,
  UserSettings,
  AppStats,
  User,
} from '@/types';
import { StorageService, DEFAULT_SETTINGS } from '@/services/storage';
import { NotificationService } from '@/services/notifications';
import { AuthService } from '@/services/auth';
import {
  authApi,
  tasksApi,
  roadmapsApi,
  sessionsApi,
  checklistApi,
  healthApi,
} from '@/services/api';

interface AppContextType {
  tasks: Task[];
  roadmaps: RoadmapLanguage[];
  checklist: DailyChecklistItem[];
  studySessions: StudySession[];
  settings: UserSettings;
  selectedDate: string;
  isLoading: boolean;
  stats: AppStats;
  user: User | null;
  isAuthenticated: boolean;
  isOnline: boolean;
  isSyncing: boolean;
  setSelectedDate: (date: string) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Task>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  duplicateTask: (taskId: string) => Promise<void>;
  toggleTaskCompleted: (taskId: string) => Promise<void>;
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  toggleTopicCompleted: (languageId: string, topicId: string) => Promise<void>;
  toggleChecklistItem: (itemId: string) => Promise<void>;
  addChecklistItem: (
    title: string,
    category?: 'Learning' | 'Coding' | 'Revision' | 'Project' | 'Custom'
  ) => Promise<void>;
  deleteChecklistItem: (itemId: string) => Promise<void>;
  addStudySession: (session: Omit<StudySession, 'id' | 'completedAt'>) => Promise<void>;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  resetAllData: () => Promise<void>;
  refreshData: () => Promise<void>;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string, fullName?: string) => Promise<void>;
  logout: () => Promise<void>;
  syncWithServer: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [roadmaps, setRoadmaps] = useState<RoadmapLanguage[]>([]);
  const [checklist, setChecklist] = useState<DailyChecklistItem[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Authentication & Sync state
  const [user, setUser] = useState<User | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const isAuthenticated = useMemo(() => !!user, [user]);

  // Load local data and check backend connectivity on boot
  const loadData = useCallback(async () => {
    try {
      await StorageService.initStorage();
      const [storedTasks, storedRoadmaps, storedChecklist, storedSessions, storedSettings, cachedUser] =
        await Promise.all([
          StorageService.getTasks(),
          StorageService.getRoadmaps(),
          StorageService.getChecklist(getTodayString()),
          StorageService.getStudySessions(),
          StorageService.getSettings(),
          AuthService.getUser(),
        ]);

      setTasks(storedTasks);
      setRoadmaps(storedRoadmaps);
      setChecklist(storedChecklist);
      setStudySessions(storedSessions);
      setSettings(storedSettings);
      if (cachedUser) {
        setUser(cachedUser);
      }

      // Check server connectivity
      const online = await healthApi.check();
      setIsOnline(online);

      // If online and authenticated, refresh profile from server
      if (online && cachedUser) {
        try {
          const profileData = await authApi.getMe();
          if (profileData?.user) {
            const mappedUser: User = {
              id: profileData.user.id,
              email: profileData.user.email,
              username: profileData.user.username,
              fullName: profileData.user.full_name,
              avatarUrl: profileData.user.avatar_url,
              streak: profileData.user.streak,
              totalFocusMinutes: profileData.user.total_focus_minutes,
            };
            setUser(mappedUser);
            await AuthService.saveUser(mappedUser);
          }
        } catch (authErr) {
          console.warn('Could not refresh user profile from server:', authErr);
        }
      }
    } catch (e) {
      console.error('Failed to load AppContext data:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        await StorageService.initStorage();
        const [storedTasks, storedRoadmaps, storedChecklist, storedSessions, storedSettings, cachedUser] =
          await Promise.all([
            StorageService.getTasks(),
            StorageService.getRoadmaps(),
            StorageService.getChecklist(getTodayString()),
            StorageService.getStudySessions(),
            StorageService.getSettings(),
            AuthService.getUser(),
          ]);

        if (isMounted) {
          setTasks(storedTasks);
          setRoadmaps(storedRoadmaps);
          setChecklist(storedChecklist);
          setStudySessions(storedSessions);
          setSettings(storedSettings);
          if (cachedUser) {
            setUser(cachedUser);
          }
        }

        const online = await healthApi.check();
        if (isMounted) {
          setIsOnline(online);
        }
      } catch (e) {
        console.error('Failed to load AppContext data:', e);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Authentication methods
  const login = async (usernameOrEmail: string, password: string): Promise<void> => {
    setIsSyncing(true);
    try {
      const res = await authApi.login({ username_or_email: usernameOrEmail, password });
      const mappedUser: User = {
        id: res.user.id,
        email: res.user.email,
        username: res.user.username,
        fullName: res.user.full_name,
        avatarUrl: res.user.avatar_url,
        streak: res.user.streak,
        totalFocusMinutes: res.user.total_focus_minutes,
      };

      await AuthService.saveTokens({
        accessToken: res.access_token,
        refreshToken: res.refresh_token,
      });
      await AuthService.saveUser(mappedUser);
      setUser(mappedUser);
      setIsOnline(true);

      // Sync offline data with server
      await syncWithServer();
    } finally {
      setIsSyncing(false);
    }
  };

  const register = async (
    email: string,
    username: string,
    password: string,
    fullName?: string
  ): Promise<void> => {
    setIsSyncing(true);
    try {
      const res = await authApi.register({ email, username, password, full_name: fullName });
      const mappedUser: User = {
        id: res.user.id,
        email: res.user.email,
        username: res.user.username,
        fullName: res.user.full_name,
        avatarUrl: res.user.avatar_url,
        streak: res.user.streak,
        totalFocusMinutes: res.user.total_focus_minutes,
      };

      await AuthService.saveTokens({
        accessToken: res.access_token,
        refreshToken: res.refresh_token,
      });
      await AuthService.saveUser(mappedUser);
      setUser(mappedUser);
      setIsOnline(true);
    } finally {
      setIsSyncing(false);
    }
  };

  const logout = async (): Promise<void> => {
    await AuthService.clearTokens();
    await AuthService.clearUser();
    setUser(null);
  };

  const syncWithServer = async (): Promise<void> => {
    if (!isAuthenticated) return;
    setIsSyncing(true);
    try {
      // 1. Fetch server tasks
      const serverTasks = await tasksApi.list();
      if (Array.isArray(serverTasks) && serverTasks.length > 0) {
        // Map backend tasks to frontend task shape
        const mappedServerTasks: Task[] = serverTasks.map((t: any) => ({
          id: `task-${t.id}`,
          title: t.title,
          description: t.description || undefined,
          category: (t.category ? t.category.charAt(0).toUpperCase() + t.category.slice(1) : 'Learning') as any,
          priority: (t.priority ? t.priority.charAt(0).toUpperCase() + t.priority.slice(1) : 'Medium') as any,
          language: undefined,
          date: t.due_date || getTodayString(),
          startTime: undefined,
          deadline: t.due_time || undefined,
          completed: t.status === 'completed',
          subtasks: (t.subtasks || []).map((st: any) => ({
            id: st.id,
            title: st.title,
            completed: Boolean(st.completed),
          })),
          createdAt: t.created_at,
          updatedAt: t.updated_at,
        }));

        // Merge with local tasks
        const localOnly = tasks.filter((lt) => !mappedServerTasks.some((st) => st.id === lt.id));
        const merged = [...mappedServerTasks, ...localOnly];
        setTasks(merged);
        await StorageService.saveTasks(merged);
      }
    } catch (err) {
      console.warn('Sync with server error (running in offline cache mode):', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Reactive statistics
  const stats = useMemo((): AppStats => {
    const today = getTodayString();
    const todayTasks = tasks.filter((t) => t.date === today);
    const todayTotal = todayTasks.length;
    const todayCompleted = todayTasks.filter((t) => t.completed).length;
    const todayPending = todayTotal - todayCompleted;
    const todayRate = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0;

    const todaySessions = studySessions.filter((s) => s.completedAt.startsWith(today));
    const studyMinutes = todaySessions.reduce((acc, curr) => acc + curr.durationMinutes, 0);

    let totalTopics = 0;
    roadmaps.forEach((r) => {
      totalTopics += r.topics.filter((top) => top.completed).length;
    });

    return {
      todayTotalTasks: todayTotal,
      todayCompletedTasks: todayCompleted,
      todayPendingTasks: todayPending,
      todayCompletionRate: todayRate,
      todayStudyMinutes: studyMinutes,
      currentStreak: user?.streak || (todayCompleted > 0 ? 3 : 2),
      longestStreak: 7,
      totalTopicsCompleted: totalTopics,
    };
  }, [tasks, studySessions, roadmaps, user]);

  // Task actions
  const addTask = async (
    taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Task> => {
    const now = new Date().toISOString();
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };

    if (newTask.reminder?.enabled && newTask.reminder.triggerTime) {
      const notifId = await NotificationService.scheduleTaskReminder(newTask);
      if (notifId && newTask.reminder) {
        newTask.reminder.notificationId = notifId;
      }
    }

    const updated = [newTask, ...tasks];
    setTasks(updated);
    await StorageService.saveTasks(updated);

    // Sync to backend if authenticated
    if (isAuthenticated && isOnline) {
      try {
        await tasksApi.create({
          title: newTask.title,
          description: newTask.description,
          category: newTask.category.toLowerCase(),
          priority: newTask.priority.toLowerCase(),
          status: newTask.completed ? 'completed' : 'pending',
          due_date: newTask.date,
          due_time: newTask.deadline,
          subtasks: newTask.subtasks.map((st) => ({ id: st.id, title: st.title, completed: st.completed })),
        });
      } catch (err) {
        console.warn('Backend task create queued locally for sync:', err);
      }
    }

    return newTask;
  };

  const updateTask = async (updatedTask: Task): Promise<void> => {
    const updated = tasks.map((t) =>
      t.id === updatedTask.id ? { ...updatedTask, updatedAt: new Date().toISOString() } : t
    );
    setTasks(updated);
    await StorageService.saveTasks(updated);

    // If ID is numeric server ID
    const numId = parseInt(updatedTask.id.replace('task-', ''), 10);
    if (!isNaN(numId) && isAuthenticated && isOnline) {
      try {
        await tasksApi.update(numId, {
          title: updatedTask.title,
          description: updatedTask.description,
          category: updatedTask.category.toLowerCase(),
          priority: updatedTask.priority.toLowerCase(),
          status: updatedTask.completed ? 'completed' : 'pending',
          due_date: updatedTask.date,
          due_time: updatedTask.deadline,
          subtasks: updatedTask.subtasks,
        });
      } catch (err) {
        console.warn('Backend task update queued locally:', err);
      }
    }
  };

  const deleteTask = async (taskId: string): Promise<void> => {
    const taskToDelete = tasks.find((t) => t.id === taskId);
    if (taskToDelete?.reminder?.notificationId) {
      await NotificationService.cancelReminder(taskToDelete.reminder.notificationId);
    }
    const updated = tasks.filter((t) => t.id !== taskId);
    setTasks(updated);
    await StorageService.saveTasks(updated);

    const numId = parseInt(taskId.replace('task-', ''), 10);
    if (!isNaN(numId) && isAuthenticated && isOnline) {
      try {
        await tasksApi.delete(numId);
      } catch (err) {
        console.warn('Backend task delete queued locally:', err);
      }
    }
  };

  const duplicateTask = async (taskId: string): Promise<void> => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;

    const dupSubtasks = target.subtasks.map((st) => ({
      ...st,
      id: `st-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      completed: false,
    }));

    await addTask({
      title: `${target.title} (Copy)`,
      description: target.description,
      category: target.category,
      priority: target.priority,
      language: target.language,
      date: target.date,
      startTime: target.startTime,
      deadline: target.deadline,
      completed: false,
      subtasks: dupSubtasks,
    });
  };

  const toggleTaskCompleted = async (taskId: string): Promise<void> => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        const nextState = !t.completed;
        return {
          ...t,
          completed: nextState,
          completedAt: nextState ? new Date().toISOString() : undefined,
          updatedAt: new Date().toISOString(),
        };
      }
      return t;
    });
    setTasks(updated);
    await StorageService.saveTasks(updated);

    const numId = parseInt(taskId.replace('task-', ''), 10);
    if (!isNaN(numId) && isAuthenticated && isOnline) {
      try {
        await tasksApi.toggle(numId);
      } catch (err) {
        console.warn('Backend toggle queued locally:', err);
      }
    }
  };

  const toggleSubtask = async (taskId: string, subtaskId: string): Promise<void> => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        const newSubtasks = t.subtasks.map((st) =>
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        );
        const allDone = newSubtasks.length > 0 && newSubtasks.every((st) => st.completed);
        return {
          ...t,
          subtasks: newSubtasks,
          completed: allDone ? true : t.completed,
          updatedAt: new Date().toISOString(),
        };
      }
      return t;
    });
    setTasks(updated);
    await StorageService.saveTasks(updated);

    const numId = parseInt(taskId.replace('task-', ''), 10);
    if (!isNaN(numId) && isAuthenticated && isOnline) {
      try {
        await tasksApi.toggleSubtask(numId, subtaskId);
      } catch (err) {
        console.warn('Backend toggle subtask queued locally:', err);
      }
    }
  };

  // Roadmap actions
  const toggleTopicCompleted = async (
    languageId: string,
    topicId: string
  ): Promise<void> => {
    let nextCompleted = false;
    const updated = roadmaps.map((lang) => {
      if (lang.id === languageId) {
        return {
          ...lang,
          topics: lang.topics.map((top) => {
            if (top.id === topicId) {
              nextCompleted = !top.completed;
              return {
                ...top,
                completed: nextCompleted,
                completedAt: nextCompleted ? new Date().toISOString() : undefined,
              };
            }
            return top;
          }),
        };
      }
      return lang;
    });
    setRoadmaps(updated);
    await StorageService.saveRoadmaps(updated);

    if (isAuthenticated && isOnline) {
      try {
        await roadmapsApi.toggleTopic(languageId, topicId, nextCompleted);
      } catch (err) {
        console.warn('Backend topic progress queued locally:', err);
      }
    }
  };

  // Checklist actions
  const toggleChecklistItem = async (itemId: string): Promise<void> => {
    const updated = checklist.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    setChecklist(updated);
    await StorageService.saveChecklist(getTodayString(), updated);
  };

  const addChecklistItem = async (
    title: string,
    category: 'Learning' | 'Coding' | 'Revision' | 'Project' | 'Custom' = 'Coding'
  ): Promise<void> => {
    const newItem: DailyChecklistItem = {
      id: `chk-${Date.now()}`,
      title,
      category,
      completed: false,
      date: getTodayString(),
    };
    const updated = [...checklist, newItem];
    setChecklist(updated);
    await StorageService.saveChecklist(getTodayString(), updated);

    if (isAuthenticated && isOnline) {
      try {
        await checklistApi.create({
          item_text: title,
          date: getTodayString(),
          category: category.toLowerCase(),
        });
      } catch (err) {
        console.warn('Backend checklist queued locally:', err);
      }
    }
  };

  const deleteChecklistItem = async (itemId: string): Promise<void> => {
    const updated = checklist.filter((item) => item.id !== itemId);
    setChecklist(updated);
    await StorageService.saveChecklist(getTodayString(), updated);
  };

  // Study Session actions
  const addStudySession = async (
    sessionData: Omit<StudySession, 'id' | 'completedAt'>
  ): Promise<void> => {
    const newSession: StudySession = {
      ...sessionData,
      id: `sess-${Date.now()}`,
      completedAt: new Date().toISOString(),
    };
    const updated = [newSession, ...studySessions];
    setStudySessions(updated);
    await StorageService.saveStudySessions(updated);

    if (isAuthenticated && isOnline) {
      try {
        await sessionsApi.record({
          duration_minutes: newSession.durationMinutes,
          session_mode: newSession.type,
          language_tag: newSession.language,
          task_id: newSession.taskId ? parseInt(newSession.taskId.replace('task-', ''), 10) : undefined,
        });
      } catch (err) {
        console.warn('Backend study session queued locally:', err);
      }
    }
  };

  // Settings action
  const updateSettings = async (newSettings: Partial<UserSettings>): Promise<void> => {
    const merged = { ...settings, ...newSettings };
    setSettings(merged);
    await StorageService.saveSettings(merged);
  };

  const resetAllData = async (): Promise<void> => {
    await StorageService.resetAllData();
    await loadData();
  };

  return (
    <AppContext.Provider
      value={{
        tasks,
        roadmaps,
        checklist,
        studySessions,
        settings,
        selectedDate,
        isLoading,
        stats,
        user,
        isAuthenticated,
        isOnline,
        isSyncing,
        setSelectedDate,
        addTask,
        updateTask,
        deleteTask,
        duplicateTask,
        toggleTaskCompleted,
        toggleSubtask,
        toggleTopicCompleted,
        toggleChecklistItem,
        addChecklistItem,
        deleteChecklistItem,
        addStudySession,
        updateSettings,
        resetAllData,
        refreshData: loadData,
        login,
        register,
        logout,
        syncWithServer,
      }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
