import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { Colors } from '@/constants/colors';
import { ScreenContainer } from '@/components/ScreenContainer';
import { AppHeader } from '@/components/AppHeader';
import { ProgressCard } from '@/components/ProgressCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SectionHeader } from '@/components/SectionHeader';
import { TaskCard } from '@/components/TaskCard';
import { EmptyState } from '@/components/EmptyState';
import { TaskModal } from '@/components/TaskModal';
import { SettingsModal } from '@/components/SettingsModal';
import { AuthModal } from '@/components/AuthModal';
import { TopicDetailModal } from '@/components/TopicDetailModal';
import { RoadmapTopic } from '@/types';

export default function HomeScreen() {
  const router = useRouter();
  const {
    tasks,
    checklist,
    roadmaps,
    stats,
    settings,
    user,
    isAuthenticated,
    isOnline,
    addTask,
    deleteTask,
    duplicateTask,
    toggleChecklistItem,
    toggleTopicCompleted,
    refreshData,
  } = useApp();

  const isDark = settings.theme !== 'light';
  const theme = isDark ? Colors.dark : Colors.light;

  // Modals
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<{
    topic: RoadmapTopic;
    langId: string;
    langName: string;
    langColor: string;
  } | null>(null);

  // Today's greeting & date
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const formattedDate = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // Today's tasks
  const todayTasks = useMemo(() => {
    return tasks.filter((t) => t.date === todayStr);
  }, [tasks, todayStr]);

  // Upcoming reminders (pending tasks with reminder or deadline)
  const upcomingReminders = useMemo(() => {
    return tasks
      .filter((t) => !t.completed && (t.reminder?.enabled || t.deadline))
      .slice(0, 3);
  }, [tasks]);

  // Featured / Active learning roadmap
  let continueLearningItem: {
    roadmap: (typeof roadmaps)[0];
    topic: (typeof roadmaps)[0]['topics'][0];
    completedCount: number;
    totalCount: number;
    percentage: number;
  } | null = null;

  for (const r of roadmaps) {
    const nextUncompleted = r.topics.find((t) => !t.completed);
    if (nextUncompleted) {
      const completedCount = r.topics.filter((t) => t.completed).length;
      const pct = Math.round((completedCount / r.topics.length) * 100);
      continueLearningItem = {
        roadmap: r,
        topic: nextUncompleted,
        completedCount,
        totalCount: r.topics.length,
        percentage: pct,
      };
      break;
    }
  }

  return (
    <>
      <AppHeader
        title="CodeTrack"
        subtitle={`${formattedDate} • ${greeting}, ${user?.fullName || user?.username || settings.userName}`}
        rightElement={
          <View style={styles.headerRightGroup}>
            <Pressable
              style={[
                styles.headerBadge,
                {
                  backgroundColor: isAuthenticated ? '#10B98120' : theme.surfaceElevated,
                  borderColor: isAuthenticated ? '#10B98160' : theme.border,
                },
              ]}
              onPress={() => setAuthModalVisible(true)}
            >
              <Ionicons
                name={isAuthenticated ? 'cloud-done' : 'cloud-outline'}
                size={14}
                color={isAuthenticated ? '#10B981' : theme.primary}
              />
              <Text
                style={[
                  styles.headerBadgeText,
                  { color: isAuthenticated ? '#10B981' : theme.textSecondary },
                ]}
              >
                {isAuthenticated ? (user?.username || 'Synced') : isOnline ? 'Connect' : 'Offline'}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.headerIconBtn, { backgroundColor: theme.surfaceElevated }]}
              onPress={() => setSettingsModalVisible(true)}
            >
              <Ionicons name="settings-outline" size={18} color={theme.textSecondary} />
            </Pressable>
          </View>
        }
      />

      <ScreenContainer onRefresh={refreshData}>
        {/* Daily Completion Summary Card */}
        <ProgressCard
          title="Daily Goals & Productivity"
          completionRate={stats.todayCompletionRate}
          completedCount={stats.todayCompletedTasks}
          totalCount={stats.todayTotalTasks}
          streakDays={stats.currentStreak}
          subtitle={`${stats.todayCompletedTasks} of ${stats.todayTotalTasks} tasks completed today`}
        />

        {/* Quick Action Buttons */}
        <View style={styles.quickActionsRow}>
          <PrimaryButton
            title="New Task"
            icon="add"
            onPress={() => setTaskModalVisible(true)}
            style={{ flex: 1 }}
          />
          <PrimaryButton
            title="Start Focus"
            icon="timer-outline"
            variant="secondary"
            onPress={() => router.push('/timer')}
            style={{ flex: 1 }}
          />
        </View>

        {/* Metric Counters Grid */}
        <View style={styles.metricsGrid}>
          <View
            style={[
              styles.metricCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View style={styles.metricIconRow}>
              <View style={[styles.metricDot, { backgroundColor: theme.success }]} />
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                Completed
              </Text>
            </View>
            <Text style={[styles.metricValue, { color: theme.text }]}>
              {stats.todayCompletedTasks}
            </Text>
            <Text style={[styles.metricSub, { color: theme.textMuted }]}>
              Tasks finished
            </Text>
          </View>

          <View
            style={[
              styles.metricCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View style={styles.metricIconRow}>
              <View style={[styles.metricDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                Pending
              </Text>
            </View>
            <Text style={[styles.metricValue, { color: theme.text }]}>
              {stats.todayPendingTasks}
            </Text>
            <Text style={[styles.metricSub, { color: theme.textMuted }]}>
              Remaining today
            </Text>
          </View>

          <View
            style={[
              styles.metricCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View style={styles.metricIconRow}>
              <View style={[styles.metricDot, { backgroundColor: theme.primary }]} />
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                Study Time
              </Text>
            </View>
            <Text style={[styles.metricValue, { color: theme.text }]}>
              {stats.todayStudyMinutes}m
            </Text>
            <Text style={[styles.metricSub, { color: theme.textMuted }]}>
              Focus session log
            </Text>
          </View>

          <View
            style={[
              styles.metricCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View style={styles.metricIconRow}>
              <View style={[styles.metricDot, { backgroundColor: '#A855F7' }]} />
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                Topics Done
              </Text>
            </View>
            <Text style={[styles.metricValue, { color: theme.text }]}>
              {stats.totalTopicsCompleted}
            </Text>
            <Text style={[styles.metricSub, { color: theme.textMuted }]}>
              Roadmap modules
            </Text>
          </View>
        </View>

        {/* Continue Learning Featured Card */}
        <SectionHeader
          title="Continue Learning"
          actionText="All Roadmaps"
          actionIcon="arrow-forward"
          onAction={() => router.push('/learn')}
        />
        {continueLearningItem ? (
          <Pressable
            style={[
              styles.continueCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
            onPress={() =>
              setSelectedTopic({
                topic: continueLearningItem.topic,
                langId: continueLearningItem.roadmap.id,
                langName: continueLearningItem.roadmap.name,
                langColor: continueLearningItem.roadmap.color,
              })
            }
          >
            <View style={styles.continueHeader}>
              <View style={styles.continueLeft}>
                <View
                  style={[
                    styles.langIconBadge,
                    { backgroundColor: continueLearningItem.roadmap.color + '20' },
                  ]}
                >
                  <Ionicons
                    name={continueLearningItem.roadmap.icon as any}
                    size={20}
                    color={continueLearningItem.roadmap.color}
                  />
                </View>
                <View>
                  <Text style={[styles.continueLang, { color: theme.text }]}>
                    {continueLearningItem.roadmap.name} Roadmap
                  </Text>
                  <Text style={[styles.continueStage, { color: theme.textSecondary }]}>
                    Next: {continueLearningItem.topic.level} Stage
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.pctBadge,
                  { backgroundColor: continueLearningItem.roadmap.color + '20' },
                ]}
              >
                <Text
                  style={[
                    styles.pctText,
                    { color: continueLearningItem.roadmap.color },
                  ]}
                >
                  {continueLearningItem.percentage}%
                </Text>
              </View>
            </View>

            <View style={styles.topicInfoBox}>
              <Text style={[styles.topicTitle, { color: theme.text }]}>
                {continueLearningItem.topic.title}
              </Text>
              <Text
                style={[styles.topicDesc, { color: theme.textSecondary }]}
                numberOfLines={2}
              >
                {continueLearningItem.topic.description}
              </Text>
            </View>

            <View style={styles.continueFooter}>
              <Text style={[styles.objectivesCount, { color: theme.textMuted }]}>
                {continueLearningItem.topic.objectives.length} Learning Objectives
              </Text>
              <View style={styles.resumeAction}>
                <Text style={[styles.resumeText, { color: theme.primary }]}>
                  Resume Lesson
                </Text>
                <Ionicons name="chevron-forward" size={14} color={theme.primary} />
              </View>
            </View>
          </Pressable>
        ) : (
          <EmptyState
            icon="trophy-outline"
            title="All Roadmaps Complete!"
            description="Congratulations! You have completed all syllabus topics."
            actionTitle="Browse Roadmaps"
            onAction={() => router.push('/learn')}
          />
        )}

        {/* Upcoming Reminders Section */}
        <SectionHeader
          title="Upcoming Reminders"
          count={upcomingReminders.length}
          actionText="View Tasks"
          onAction={() => router.push('/tasks')}
        />
        {upcomingReminders.length > 0 ? (
          <View style={styles.remindersList}>
            {upcomingReminders.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                showDate={true}
                onDelete={() => deleteTask(t.id)}
                onDuplicate={() => duplicateTask(t.id)}
              />
            ))}
          </View>
        ) : (
          <View
            style={[
              styles.noRemindersBox,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Ionicons name="notifications-outline" size={24} color={theme.textMuted} />
            <Text style={[styles.noRemindersText, { color: theme.textSecondary }]}>
              No pending reminders for today. You&apos;re completely up to date!
            </Text>
          </View>
        )}

        {/* Today's Tasks Section */}
        <SectionHeader
          title="Today's Task Checklist"
          count={todayTasks.length}
          actionText="See All"
          onAction={() => router.push('/tasks')}
        />
        {todayTasks.length > 0 ? (
          <View style={styles.tasksList}>
            {todayTasks.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                onDelete={() => deleteTask(t.id)}
                onDuplicate={() => duplicateTask(t.id)}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            icon="checkmark-circle-outline"
            title="No tasks scheduled for today"
            description="Add your coding goals, bug fixes, or study plans to get started."
            actionTitle="+ Add First Task"
            onAction={() => setTaskModalVisible(true)}
          />
        )}

        {/* Daily Habits / Checklist Preview */}
        {checklist.length > 0 && (
          <>
            <SectionHeader
              title="Daily Coding Habits"
              count={checklist.filter((c) => c.completed).length}
              actionText="Manage"
              onAction={() => router.push('/tasks')}
            />
            <View
              style={[
                styles.habitsCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              {checklist.slice(0, 4).map((item) => (
                <Pressable
                  key={item.id}
                  style={[styles.habitRow, { borderBottomColor: theme.borderSubtle }]}
                  onPress={() => toggleChecklistItem(item.id)}
                >
                  <View
                    style={[
                      styles.habitCheck,
                      {
                        backgroundColor: item.completed ? theme.primary : 'transparent',
                        borderColor: item.completed ? theme.primary : theme.textSecondary,
                      },
                    ]}
                  >
                    {item.completed && <Ionicons name="checkmark" size={12} color="#0F172A" />}
                  </View>
                  <Text
                    style={[
                      styles.habitTitle,
                      {
                        color: item.completed ? theme.textMuted : theme.text,
                        textDecorationLine: item.completed ? 'line-through' : 'none',
                      },
                    ]}
                  >
                    {item.title}
                  </Text>
                  <View
                    style={[
                      styles.habitCategoryPill,
                      { backgroundColor: theme.surfaceElevated },
                    ]}
                  >
                    <Text style={[styles.habitCategoryText, { color: theme.textSecondary }]}>
                      {item.category}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </>
        )}
      </ScreenContainer>

      {/* Task Creation Modal */}
      <TaskModal
        visible={taskModalVisible}
        onClose={() => setTaskModalVisible(false)}
        onSave={async (taskData) => {
          await addTask(taskData);
          setTaskModalVisible(false);
        }}
      />

      {/* Settings & Profile Modal */}
      <SettingsModal
        visible={settingsModalVisible}
        isDark={isDark}
        onClose={() => setSettingsModalVisible(false)}
      />

      {/* Cloud Authentication Modal */}
      <AuthModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
      />

      {/* Topic Detail Modal */}
      <TopicDetailModal
        visible={!!selectedTopic}
        topic={selectedTopic?.topic}
        languageName={selectedTopic?.langName}
        languageColor={selectedTopic?.langColor}
        isDark={isDark}
        onClose={() => setSelectedTopic(null)}
        onToggleCompleted={async () => {
          if (selectedTopic) {
            await toggleTopicCompleted(selectedTopic.langId, selectedTopic.topic.id);
            setSelectedTopic(null);
          }
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  headerIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: '46%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },
  metricIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  metricSub: {
    fontSize: 11,
    fontWeight: '500',
  },
  continueCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  continueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  continueLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  langIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueLang: {
    fontSize: 15,
    fontWeight: '700',
  },
  continueStage: {
    fontSize: 12,
    fontWeight: '500',
  },
  pctBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pctText: {
    fontSize: 12,
    fontWeight: '800',
  },
  topicInfoBox: {
    gap: 4,
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  topicDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  continueFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#334155',
  },
  objectivesCount: {
    fontSize: 11,
    fontWeight: '500',
  },
  resumeAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  resumeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  remindersList: {
    gap: 10,
  },
  noRemindersBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  noRemindersText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  tasksList: {
    gap: 10,
  },
  habitsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  habitCheck: {
    width: 18,
    height: 18,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  habitCategoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  habitCategoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
