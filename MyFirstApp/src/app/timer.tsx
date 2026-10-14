import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { Colors, LanguageColors } from '@/constants/colors';
import { ScreenContainer } from '@/components/ScreenContainer';
import { AppHeader } from '@/components/AppHeader';
import { SectionHeader } from '@/components/SectionHeader';
import { PrimaryButton } from '@/components/PrimaryButton';
import { EmptyState } from '@/components/EmptyState';
import { ProgressBar } from '@/components/ProgressBar';
import { NotificationService } from '@/services/notifications';

type TimerMode = 'focus' | 'short_break' | 'long_break';
type MainTab = 'timer' | 'analytics';

const LANGUAGES_LIST = [
  'Python',
  'JavaScript',
  'TypeScript',
  'React Native',
  'React',
  'FastAPI',
  'SQL',
  'Java',
  'C++',
  'Data Structures and Algorithms',
];

export default function TimerAndAnalyticsScreen() {
  const systemScheme = useColorScheme();
  const {
    settings,
    tasks,
    studySessions,
    stats,
    addStudySession,
  } = useApp();

  const isDark = settings.theme === 'system' ? systemScheme === 'dark' : settings.theme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  const [activeMainTab, setActiveMainTab] = useState<MainTab>('timer');

  // Pomodoro timer state
  const [timerMode, setTimerMode] = useState<TimerMode>('focus');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('Python');
  const [cycleCount, setCycleCount] = useState<number>(1);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Duration in seconds
  const getDurationSeconds = useCallback((mode: TimerMode): number => {
    switch (mode) {
      case 'focus':
        return settings.focusDuration * 60;
      case 'short_break':
        return settings.shortBreakDuration * 60;
      case 'long_break':
        return settings.longBreakDuration * 60;
    }
  }, [settings.focusDuration, settings.shortBreakDuration, settings.longBreakDuration]);

  const [timeLeft, setTimeLeft] = useState<number>(() => settings.focusDuration * 60);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const switchMode = useCallback((mode: TimerMode) => {
    setIsRunning(false);
    setTimerMode(mode);
    setTimeLeft(getDurationSeconds(mode));
  }, [getDurationSeconds]);

  const handleSessionComplete = useCallback(async () => {
    setIsRunning(false);

    if (timerMode === 'focus') {
      // Record completed study session
      await addStudySession({
        language: selectedLanguage,
        durationMinutes: settings.focusDuration,
        type: 'focus',
      });

      // Send local push notification
      await NotificationService.scheduleStudyReminder(
        0.01,
        `Focus Session Complete: ${selectedLanguage}`
      );

      // Check if it's 4th cycle -> long break, else short break
      if (cycleCount % 4 === 0) {
        setTimerMode('long_break');
        setTimeLeft(settings.longBreakDuration * 60);
      } else {
        setTimerMode('short_break');
        setTimeLeft(settings.shortBreakDuration * 60);
      }
      setCycleCount((c) => c + 1);
    } else {
      // Break is complete -> transition back to focus
      await NotificationService.scheduleStudyReminder(0.01, 'Break Finished - Time to Code!');
      setTimerMode('focus');
      setTimeLeft(settings.focusDuration * 60);
    }
  }, [
    timerMode,
    selectedLanguage,
    settings.focusDuration,
    settings.shortBreakDuration,
    settings.longBreakDuration,
    cycleCount,
    addStudySession,
  ]);

  // Tick timer
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, handleSessionComplete]);

  const toggleStartPause = () => {
    setIsRunning((prev) => !prev);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(getDurationSeconds(timerMode));
  };

  const skipSession = () => {
    if (timerMode === 'focus') {
      switchMode('short_break');
    } else {
      switchMode('focus');
    }
  };

  // Formatting MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const currentTotalSeconds = getDurationSeconds(timerMode);
  const timerPercent = Math.min(
    100,
    Math.max(0, Math.round(((currentTotalSeconds - timeLeft) / currentTotalSeconds) * 100))
  );

  // ============================================
  // ANALYTICS COMPUTATIONS
  // ============================================
  // Weekly Productivity: Count of completed tasks for Mon - Sun of current week
  const curr = new Date();
  const first = curr.getDate() - curr.getDay() + 1; // Mon
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const weeklyProductivity = dayNames.map((dayName, idx) => {
    const d = new Date(curr.getFullYear(), curr.getMonth(), first + idx);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dateStr = `${y}-${m}-${String(d.getDate()).padStart(2, '0')}`;

    const completed = tasks.filter((t) => t.date === dateStr && t.completed).length;
    const total = tasks.filter((t) => t.date === dateStr).length;

    return {
      day: dayName,
      completed,
      total: Math.max(total, 1),
    };
  });

  const maxWeeklyTasks = Math.max(1, ...weeklyProductivity.map((w) => w.completed));

  // Study time by language
  const studyMap: Record<string, number> = {};
  studySessions.forEach((s) => {
    studyMap[s.language] = (studyMap[s.language] || 0) + s.durationMinutes;
  });

  const studyByLanguage = Object.entries(studyMap)
    .map(([lang, minutes]) => ({
      lang,
      minutes,
      color: LanguageColors[lang] || theme.primary,
    }))
    .sort((a, b) => b.minutes - a.minutes);

  const totalStudyMinutes = studySessions.reduce((acc, s) => acc + s.durationMinutes, 0);

  // Completed tasks history list
  const completedTasksHistory = tasks
    .filter((t) => t.completed)
    .sort((a, b) => (b.completedAt || b.date).localeCompare(a.completedAt || a.date))
    .slice(0, 8);

  return (
    <ScreenContainer scrollable={false}>
      {/* Screen Header */}
      <AppHeader
        title="Focus & Analytics"
        subtitle="Pomodoro study timer and verified productivity metrics"
        rightElement={
          <View style={[styles.streakBadge, { backgroundColor: '#F59E0B20', borderColor: '#F59E0B50' }]}>
            <Ionicons name="flame" size={14} color="#F59E0B" />
            <Text style={styles.streakBadgeText}>{stats.currentStreak}d Streak</Text>
          </View>
        }
      />

      {/* Main Tab Segmented Toggle */}
      <View style={[styles.tabSegmentContainer, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
        <Pressable
          style={[
            styles.tabSegment,
            activeMainTab === 'timer' && [styles.activeTab, { backgroundColor: theme.surface }],
          ]}
          onPress={() => setActiveMainTab('timer')}
        >
          <Ionicons
            name="stopwatch-outline"
            size={16}
            color={activeMainTab === 'timer' ? theme.primary : theme.textMuted}
          />
          <Text
            style={[
              styles.tabText,
              {
                color: activeMainTab === 'timer' ? theme.text : theme.textSecondary,
                fontWeight: activeMainTab === 'timer' ? '700' : '500',
              },
            ]}
          >
            Focus Timer
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.tabSegment,
            activeMainTab === 'analytics' && [styles.activeTab, { backgroundColor: theme.surface }],
          ]}
          onPress={() => setActiveMainTab('analytics')}
        >
          <Ionicons
            name="bar-chart-outline"
            size={16}
            color={activeMainTab === 'analytics' ? theme.primary : theme.textMuted}
          />
          <Text
            style={[
              styles.tabText,
              {
                color: activeMainTab === 'analytics' ? theme.text : theme.textSecondary,
                fontWeight: activeMainTab === 'analytics' ? '700' : '500',
              },
            ]}
          >
            Productivity Analytics
          </Text>
        </Pressable>
      </View>

      {activeMainTab === 'timer' ? (
        /* ================= POMODORO TIMER ================= */
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Mode Selector */}
          <View style={[styles.modeRow, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
            {(['focus', 'short_break', 'long_break'] as TimerMode[]).map((mode) => {
              const isSelected = timerMode === mode;
              const label =
                mode === 'focus'
                  ? `Focus (${settings.focusDuration}m)`
                  : mode === 'short_break'
                  ? `Short Break (${settings.shortBreakDuration}m)`
                  : `Long Break (${settings.longBreakDuration}m)`;

              return (
                <Pressable
                  key={mode}
                  style={[
                    styles.modeBtn,
                    isSelected && [styles.activeModeBtn, { backgroundColor: theme.surface }],
                  ]}
                  onPress={() => switchMode(mode)}
                >
                  <Text
                    style={[
                      styles.modeBtnText,
                      {
                        color: isSelected ? theme.primary : theme.textSecondary,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Large Countdown Display Card */}
          <View
            style={[
              styles.timerDisplayCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                shadowColor: '#000000',
              },
            ]}
          >
            {/* Cycle indicator */}
            <View
              style={[
                styles.cycleIndicatorBadge,
                {
                  backgroundColor:
                    timerMode === 'focus' ? theme.primary + '18' : theme.success + '18',
                  borderColor:
                    timerMode === 'focus' ? theme.primary + '40' : theme.success + '40',
                },
              ]}
            >
              <Ionicons
                name={timerMode === 'focus' ? 'code-slash' : 'cafe-outline'}
                size={14}
                color={timerMode === 'focus' ? theme.primary : theme.success}
              />
              <Text
                style={[
                  styles.cycleLabel,
                  { color: timerMode === 'focus' ? theme.primary : theme.success },
                ]}
              >
                {timerMode === 'focus'
                  ? `Session #${cycleCount} • ${selectedLanguage}`
                  : 'Rest & Recharge'}
              </Text>
            </View>

            {/* Huge Time Counter */}
            <Text
              style={[
                styles.timerCountdown,
                { color: timerMode === 'focus' ? theme.text : theme.success },
              ]}
            >
              {formatTime(timeLeft)}
            </Text>

            {/* Session Progress Bar */}
            <View style={styles.progressWrap}>
              <ProgressBar
                progress={timerPercent}
                color={timerMode === 'focus' ? theme.primary : theme.success}
                trackColor={theme.surfaceElevated}
                height={8}
              />
              <Text style={[styles.percentSub, { color: theme.textMuted }]}>
                {timerPercent}% of interval elapsed
              </Text>
            </View>

            {/* Control Buttons Row */}
            <View style={styles.controlsRow}>
              <Pressable
                style={[
                  styles.secControlBtn,
                  { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
                ]}
                onPress={resetTimer}
                accessibilityLabel="Reset timer"
              >
                <Ionicons name="refresh" size={20} color={theme.textSecondary} />
              </Pressable>

              <PrimaryButton
                title={isRunning ? 'Pause Session' : 'Start Focus'}
                icon={isRunning ? 'pause' : 'play'}
                variant={isRunning ? 'secondary' : 'primary'}
                size="lg"
                onPress={toggleStartPause}
                style={styles.mainActionBtn}
              />

              <Pressable
                style={[
                  styles.secControlBtn,
                  { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
                ]}
                onPress={skipSession}
                accessibilityLabel="Skip interval"
              >
                <Ionicons name="play-skip-forward" size={20} color={theme.textSecondary} />
              </Pressable>
            </View>
          </View>

          {/* Associate Session with Programming Language */}
          <View style={styles.sectionContainer}>
            <SectionHeader
              title="Track Session By Language"
              subtitle="Credits logged minutes directly to your language analytics"
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.langPillsRow}
            >
              {LANGUAGES_LIST.map((lang) => {
                const isSelected = selectedLanguage === lang;
                const lColor = LanguageColors[lang] || theme.primary;
                return (
                  <Pressable
                    key={lang}
                    style={[
                      styles.langPill,
                      {
                        backgroundColor: isSelected ? lColor + '20' : theme.surfaceElevated,
                        borderColor: isSelected ? lColor : theme.border,
                      },
                    ]}
                    onPress={() => setSelectedLanguage(lang)}
                  >
                    <View style={[styles.langDot, { backgroundColor: lColor }]} />
                    <Text
                      style={[
                        styles.langPillText,
                        {
                          color: isSelected ? lColor : theme.textSecondary,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {lang}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Today's Logged Sessions Summary */}
          <View style={styles.sectionContainer}>
            <SectionHeader
              title="Today's Logged Sessions"
              count={studySessions.length}
            />

            {studySessions.length > 0 ? (
              <View
                style={[
                  styles.todayLogCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                {studySessions.slice(0, 5).map((s, index) => (
                  <View
                    key={s.id}
                    style={[
                      styles.sessionItemRow,
                      index < Math.min(studySessions.length, 5) - 1 && {
                        borderBottomColor: theme.border,
                        borderBottomWidth: 1,
                      },
                    ]}
                  >
                    <View style={styles.sessionItemLeft}>
                      <View
                        style={[
                          styles.sessionDot,
                          { backgroundColor: LanguageColors[s.language] || theme.primary },
                        ]}
                      />
                      <View>
                        <Text style={[styles.sessionLang, { color: theme.text }]}>
                          {s.language}
                        </Text>
                        <Text style={[styles.sessionType, { color: theme.textMuted }]}>
                          {s.type === 'focus' ? 'Focus Interval' : 'Review Session'}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.sessionMin, { color: theme.primary }]}>
                      +{s.durationMinutes} min
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState
                icon="stopwatch-outline"
                title="No focus sessions today"
                description="Start a Pomodoro interval above to log study time towards your daily coding goals."
                style={{ paddingVertical: 24 }}
              />
            )}
          </View>
        </ScrollView>
      ) : (
        /* ================= PRODUCTIVITY ANALYTICS ================= */
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Key Metrics Overview Grid */}
          <View style={styles.metricsGrid}>
            <View
              style={[
                styles.metricCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View style={styles.metricHeaderRow}>
                <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                  Completion Rate
                </Text>
                <Ionicons name="pie-chart-outline" size={14} color={theme.primary} />
              </View>
              <Text style={[styles.metricValue, { color: theme.primary }]}>
                {stats.todayCompletionRate}%
              </Text>
              <Text style={[styles.metricSub, { color: theme.textMuted }]}>
                {stats.todayCompletedTasks}/{stats.todayTotalTasks} tasks today
              </Text>
            </View>

            <View
              style={[
                styles.metricCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View style={styles.metricHeaderRow}>
                <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                  Total Study Time
                </Text>
                <Ionicons name="time-outline" size={14} color={theme.accent} />
              </View>
              <Text style={[styles.metricValue, { color: theme.accent }]}>
                {totalStudyMinutes}m
              </Text>
              <Text style={[styles.metricSub, { color: theme.textMuted }]}>
                {studySessions.length} sessions logged
              </Text>
            </View>

            <View
              style={[
                styles.metricCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View style={styles.metricHeaderRow}>
                <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                  Study Streak
                </Text>
                <Ionicons name="flame" size={14} color="#F59E0B" />
              </View>
              <Text style={[styles.metricValue, { color: '#F59E0B' }]}>
                {stats.currentStreak} Days
              </Text>
              <Text style={[styles.metricSub, { color: theme.textMuted }]}>
                Longest: {stats.longestStreak} days
              </Text>
            </View>

            <View
              style={[
                styles.metricCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View style={styles.metricHeaderRow}>
                <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                  Roadmap Topics
                </Text>
                <Ionicons name="checkmark-done" size={14} color={theme.success} />
              </View>
              <Text style={[styles.metricValue, { color: theme.success }]}>
                {stats.totalTopicsCompleted} Done
              </Text>
              <Text style={[styles.metricSub, { color: theme.textMuted }]}>
                Across 12 roadmaps
              </Text>
            </View>
          </View>

          {/* Weekly Productivity Bar Chart Card */}
          <View
            style={[
              styles.chartCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View style={styles.chartHeader}>
              <View>
                <Text style={[styles.chartTitle, { color: theme.text }]}>
                  Weekly Task Completion
                </Text>
                <Text style={[styles.chartSub, { color: theme.textSecondary }]}>
                  Verified completed tasks by day of current week
                </Text>
              </View>
              <View
                style={[
                  styles.trendBadge,
                  { backgroundColor: theme.success + '15', borderColor: theme.success + '40' },
                ]}
              >
                <Ionicons name="trending-up" size={14} color={theme.success} />
                <Text style={[styles.trendBadgeText, { color: theme.success }]}>Active Week</Text>
              </View>
            </View>

            {/* Custom SVG-free Clean Bar Chart */}
            <View style={styles.barChartContainer}>
              {weeklyProductivity.map((item) => {
                const barHeightPercent = Math.min(
                  100,
                  Math.max(12, Math.round((item.completed / maxWeeklyTasks) * 100))
                );

                return (
                  <View key={item.day} style={styles.barColumn}>
                    <Text style={[styles.barValueText, { color: theme.textSecondary }]}>
                      {item.completed}
                    </Text>
                    <View style={[styles.barTrack, { backgroundColor: theme.surfaceElevated }]}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: `${item.completed > 0 ? barHeightPercent : 6}%`,
                            backgroundColor: item.completed > 0 ? theme.primary : theme.border,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.barDayLabel, { color: theme.textSecondary }]}>
                      {item.day}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Study Time by Programming Language */}
          <View
            style={[
              styles.chartCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View style={styles.chartHeader}>
              <View>
                <Text style={[styles.chartTitle, { color: theme.text }]}>
                  Study Time by Language
                </Text>
                <Text style={[styles.chartSub, { color: theme.textSecondary }]}>
                  Minutes logged in Pomodoro focus sessions
                </Text>
              </View>
              <Ionicons name="code-working-outline" size={18} color={theme.primary} />
            </View>

            <View style={styles.langBreakdownList}>
              {studyByLanguage.length === 0 ? (
                <EmptyState
                  icon="code-slash-outline"
                  title="No language data yet"
                  description="Complete a focus session linked to a language to see your breakdown."
                  style={{ paddingVertical: 18 }}
                />
              ) : (
                studyByLanguage.map((item) => {
                  const pct =
                    totalStudyMinutes > 0
                      ? Math.round((item.minutes / totalStudyMinutes) * 100)
                      : 0;
                  return (
                    <View key={item.lang} style={styles.langStatItem}>
                      <View style={styles.langStatRow}>
                        <View style={styles.langStatNameRow}>
                          <View style={[styles.colorSquare, { backgroundColor: item.color }]} />
                          <Text style={[styles.langStatName, { color: theme.text }]}>
                            {item.lang}
                          </Text>
                        </View>
                        <Text style={[styles.langStatMins, { color: theme.textSecondary }]}>
                          {item.minutes}m ({pct}%)
                        </Text>
                      </View>
                      <ProgressBar
                        progress={pct}
                        color={item.color}
                        trackColor={theme.surfaceElevated}
                        height={6}
                      />
                    </View>
                  );
                })
              )}
            </View>
          </View>

          {/* History of Completed Tasks */}
          <View
            style={[
              styles.chartCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View style={styles.chartHeader}>
              <View>
                <Text style={[styles.chartTitle, { color: theme.text }]}>
                  Recent Accomplishments
                </Text>
                <Text style={[styles.chartSub, { color: theme.textSecondary }]}>
                  Verified completed tasks timeline
                </Text>
              </View>
              <Ionicons name="ribbon-outline" size={18} color={theme.accent} />
            </View>

            <View style={styles.historyList}>
              {completedTasksHistory.length === 0 ? (
                <EmptyState
                  icon="checkbox-outline"
                  title="No completed tasks yet"
                  description="Check off tasks on your daily checklist to build your history."
                  style={{ paddingVertical: 18 }}
                />
              ) : (
                completedTasksHistory.map((t, idx) => (
                  <View
                    key={t.id}
                    style={[
                      styles.historyRow,
                      idx < completedTasksHistory.length - 1 && {
                        borderBottomColor: theme.border,
                        borderBottomWidth: 1,
                      },
                    ]}
                  >
                    <Ionicons name="checkmark-circle" size={18} color={theme.success} />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[styles.historyTitle, { color: theme.text }]}
                        numberOfLines={1}
                      >
                        {t.title}
                      </Text>
                      <Text style={[styles.historyDate, { color: theme.textMuted }]}>
                        {t.category} •{' '}
                        {t.completedAt
                          ? new Date(t.completedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : t.date}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        </ScrollView>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  streakBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F59E0B',
  },
  tabSegmentContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
  },
  tabSegment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
  },
  activeTab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  modeRow: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeModeBtn: {
    elevation: 1,
  },
  modeBtnText: {
    fontSize: 11,
  },
  timerDisplayCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  cycleIndicatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  cycleLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  timerCountdown: {
    fontSize: 60,
    fontWeight: '800',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
    marginVertical: 2,
  },
  progressWrap: {
    width: '100%',
    alignItems: 'center',
    gap: 6,
  },
  percentSub: {
    fontSize: 11,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginTop: 6,
    width: '100%',
  },
  mainActionBtn: {
    flex: 1,
    maxWidth: 220,
  },
  secControlBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionContainer: {
    gap: 8,
  },
  langPillsRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    gap: 8,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  langDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  langPillText: {
    fontSize: 12,
  },
  todayLogCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  sessionItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  sessionItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sessionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sessionLang: {
    fontSize: 13,
    fontWeight: '600',
  },
  sessionType: {
    fontSize: 11,
    marginTop: 1,
  },
  sessionMin: {
    fontSize: 13,
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    width: '48%',
    flexGrow: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },
  metricHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
  },
  metricSub: {
    fontSize: 11,
  },
  chartCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  chartSub: {
    fontSize: 12,
    marginTop: 2,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  trendBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingTop: 16,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barValueText: {
    fontSize: 11,
    fontWeight: '700',
  },
  barTrack: {
    width: 22,
    height: 90,
    borderRadius: 6,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: 6,
  },
  barDayLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  langBreakdownList: {
    gap: 12,
  },
  langStatItem: {
    gap: 6,
  },
  langStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  langStatNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorSquare: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  langStatName: {
    fontSize: 13,
    fontWeight: '600',
  },
  langStatMins: {
    fontSize: 12,
    fontWeight: '600',
  },
  historyList: {
    gap: 2,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  historyDate: {
    fontSize: 11,
    marginTop: 2,
  },
});
