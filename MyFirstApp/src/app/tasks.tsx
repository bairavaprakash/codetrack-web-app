import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { Colors } from '@/constants/colors';
import { ScreenContainer } from '@/components/ScreenContainer';
import { AppHeader } from '@/components/AppHeader';
import { TaskCard } from '@/components/TaskCard';
import { SectionHeader } from '@/components/SectionHeader';
import { EmptyState } from '@/components/EmptyState';
import { ProgressBar } from '@/components/ProgressBar';
import { TaskModal } from '@/components/TaskModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { NotificationService } from '@/services/notifications';
import { Task } from '@/types';

type ScreenSegment = 'tasks' | 'checklist' | 'reminders';
type StatusFilter = 'all' | 'pending' | 'completed' | 'overdue';
type SortOption = 'deadline' | 'priority' | 'date';

export default function TasksScreen() {
  const {
    tasks,
    checklist,
    settings,
    addTask,
    updateTask,
    deleteTask,
    duplicateTask,
    toggleChecklistItem,
    addChecklistItem,
    deleteChecklistItem,
    refreshData,
  } = useApp();

  const isDark = settings.theme !== 'light';
  const theme = isDark ? Colors.dark : Colors.light;

  // Segment: tasks vs checklist vs reminders
  const [activeSegment, setActiveSegment] = useState<ScreenSegment>('tasks');

  // Search & Filters for Tasks
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('deadline');

  // Modals
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);

  // Quick Habit Input
  const [newChecklistText, setNewChecklistText] = useState('');
  const [newChecklistCategory, setNewChecklistCategory] = useState<
    'Learning' | 'Coding' | 'Revision' | 'Project' | 'Custom'
  >('Coding');

  // Permission test state
  const [notifTestSuccess, setNotifTestSuccess] = useState(false);

  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q)) ||
          (t.language && t.language.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (statusFilter === 'pending') {
      result = result.filter((t) => !t.completed);
    } else if (statusFilter === 'completed') {
      result = result.filter((t) => t.completed);
    } else if (statusFilter === 'overdue') {
      result = result.filter((t) => !t.completed && t.date < todayStr);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'deadline') {
        const timeA = a.deadline || a.startTime || '23:59';
        const timeB = b.deadline || b.startTime || '23:59';
        return timeA.localeCompare(timeB);
      }
      if (sortBy === 'priority') {
        const priorityOrder: Record<string, number> = { Urgent: 0, High: 1, Medium: 2, Low: 3 };
        return (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2);
      }
      return b.date.localeCompare(a.date);
    });

    return result;
  }, [tasks, searchQuery, statusFilter, sortBy, todayStr]);

  // Tasks with reminders
  const reminderTasks = useMemo(() => {
    return tasks.filter((t) => t.reminder && (t.reminder.triggerTime || t.deadline));
  }, [tasks]);

  const toggleReminderControl = async (task: Task) => {
    if (!task.reminder) return;
    const nextEnabled = !task.reminder.enabled;
    const updatedReminder = { ...task.reminder, enabled: nextEnabled };

    if (nextEnabled) {
      const notifId = await NotificationService.scheduleTaskReminder({
        ...task,
        reminder: updatedReminder,
      });
      if (notifId) {
        updatedReminder.notificationId = notifId;
      }
    } else if (task.reminder.notificationId) {
      await NotificationService.cancelReminder(task.reminder.notificationId);
      updatedReminder.notificationId = undefined;
    }

    await updateTask({
      ...task,
      reminder: updatedReminder,
    });
  };

  const handleTestNotification = async () => {
    const success = await NotificationService.scheduleStudyReminder(
      0.05,
      'CodeTrack: Notification permissions are active!'
    );
    if (success) {
      setNotifTestSuccess(true);
      setTimeout(() => setNotifTestSuccess(false), 4000);
      Alert.alert('Notification Sent', 'A test reminder has been scheduled.');
    }
  };

  const handleAddHabit = async () => {
    if (!newChecklistText.trim()) return;
    await addChecklistItem(newChecklistText.trim(), newChecklistCategory);
    setNewChecklistText('');
  };

  const completedHabits = checklist.filter((c) => c.completed).length;
  const habitsRate = checklist.length > 0 ? Math.round((completedHabits / checklist.length) * 100) : 0;

  return (
    <>
      <AppHeader
        title="Tasks & Schedule"
        subtitle={`${tasks.length} total tasks • ${reminderTasks.length} active reminders`}
        rightElement={
          <Pressable
            style={[styles.headerAddBtn, { backgroundColor: theme.primary }]}
            onPress={() => {
              setEditingTask(null);
              setTaskModalVisible(true);
            }}
          >
            <Ionicons name="add" size={20} color="#0F172A" />
            <Text style={styles.headerAddText}>New</Text>
          </Pressable>
        }
      />

      <ScreenContainer onRefresh={refreshData}>
        {/* Top 3-Way Segmented Tabs */}
        <View
          style={[
            styles.segmentBar,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Pressable
            style={[
              styles.segmentBtn,
              activeSegment === 'tasks' && { backgroundColor: theme.primary },
            ]}
            onPress={() => setActiveSegment('tasks')}
          >
            <Ionicons
              name="checkbox-outline"
              size={15}
              color={activeSegment === 'tasks' ? '#0F172A' : theme.textSecondary}
            />
            <Text
              style={[
                styles.segmentText,
                { color: activeSegment === 'tasks' ? '#0F172A' : theme.textSecondary },
              ]}
            >
              Tasks ({tasks.length})
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.segmentBtn,
              activeSegment === 'checklist' && { backgroundColor: theme.primary },
            ]}
            onPress={() => setActiveSegment('checklist')}
          >
            <Ionicons
              name="list"
              size={15}
              color={activeSegment === 'checklist' ? '#0F172A' : theme.textSecondary}
            />
            <Text
              style={[
                styles.segmentText,
                { color: activeSegment === 'checklist' ? '#0F172A' : theme.textSecondary },
              ]}
            >
              Habits ({checklist.length})
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.segmentBtn,
              activeSegment === 'reminders' && { backgroundColor: theme.primary },
            ]}
            onPress={() => setActiveSegment('reminders')}
          >
            <Ionicons
              name="notifications-outline"
              size={15}
              color={activeSegment === 'reminders' ? '#0F172A' : theme.textSecondary}
            />
            <Text
              style={[
                styles.segmentText,
                { color: activeSegment === 'reminders' ? '#0F172A' : theme.textSecondary },
              ]}
            >
              Reminders ({reminderTasks.length})
            </Text>
          </Pressable>
        </View>

        {/* ================= 1. TASKS TAB ================= */}
        {activeSegment === 'tasks' && (
          <>
            {/* Search Input Bar */}
            <View
              style={[
                styles.searchBox,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Ionicons name="search" size={18} color={theme.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search tasks by title, language or notes..."
                placeholderTextColor={theme.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                clearButtonMode="while-editing"
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={theme.textMuted} />
                </Pressable>
              )}
            </View>

            {/* Filter Chips Bar */}
            <View style={styles.filterBar}>
              {(['all', 'pending', 'completed', 'overdue'] as const).map((st) => {
                const active = statusFilter === st;
                return (
                  <Pressable
                    key={st}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: active ? theme.primary + '20' : theme.surface,
                        borderColor: active ? theme.primary : theme.border,
                      },
                    ]}
                    onPress={() => setStatusFilter(st)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        {
                          color: active ? theme.primary : theme.textSecondary,
                          fontWeight: active ? '700' : '500',
                        },
                      ]}
                    >
                      {st.charAt(0).toUpperCase() + st.slice(1)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Sort & Count Row */}
            <View style={styles.sortRow}>
              <Text style={[styles.resultCount, { color: theme.textSecondary }]}>
                {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'} found
              </Text>
              <View style={styles.sortGroup}>
                <Text style={[styles.sortLabel, { color: theme.textMuted }]}>Sort by:</Text>
                {(['deadline', 'priority', 'date'] as const).map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => setSortBy(s)}
                    style={[
                      styles.sortBtn,
                      sortBy === s && {
                        backgroundColor: theme.surfaceElevated,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.sortBtnText,
                        {
                          color: sortBy === s ? theme.primary : theme.textSecondary,
                          fontWeight: sortBy === s ? '700' : '500',
                        },
                      ]}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Tasks List */}
            {filteredTasks.length > 0 ? (
              <View style={styles.taskListContainer}>
                {filteredTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    showDate={true}
                    onEdit={() => {
                      setEditingTask(task);
                      setTaskModalVisible(true);
                    }}
                    onDuplicate={() => duplicateTask(task.id)}
                    onDelete={() => setDeleteTaskId(task.id)}
                  />
                ))}
              </View>
            ) : (
              <EmptyState
                icon="search-outline"
                title="No tasks match your criteria"
                description={
                  searchQuery
                    ? `No tasks found matching "${searchQuery}". Try a different keyword.`
                    : 'You currently have no tasks in this category.'
                }
                actionTitle="+ Add New Task"
                onAction={() => {
                  setEditingTask(null);
                  setTaskModalVisible(true);
                }}
              />
            )}
          </>
        )}

        {/* ================= 2. HABITS & CHECKLIST TAB ================= */}
        {activeSegment === 'checklist' && (
          <>
            {/* Habits Progress Card */}
            <View
              style={[
                styles.habitsSummaryCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View style={styles.habitsSummaryHeader}>
                <View>
                  <Text style={[styles.habitsTitle, { color: theme.text }]}>
                    Daily Habit Consistency
                  </Text>
                  <Text style={[styles.habitsSubtitle, { color: theme.textSecondary }]}>
                    {completedHabits} of {checklist.length} habits done today
                  </Text>
                </View>
                <Text style={[styles.habitsPct, { color: theme.primary }]}>
                  {habitsRate}%
                </Text>
              </View>
              <ProgressBar progress={habitsRate} height={8} />
            </View>

            {/* Add Habit Input Box */}
            <View
              style={[
                styles.addHabitCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.addHabitHeading, { color: theme.text }]}>
                Add Daily Coding Habit
              </Text>
              <View style={styles.habitInputRow}>
                <TextInput
                  style={[
                    styles.habitTextInput,
                    {
                      backgroundColor: theme.surfaceElevated,
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                  placeholder="e.g. Solve 1 DSA problem, review PRs..."
                  placeholderTextColor={theme.textMuted}
                  value={newChecklistText}
                  onChangeText={setNewChecklistText}
                />
                <Pressable
                  style={[styles.addHabitBtn, { backgroundColor: theme.primary }]}
                  onPress={handleAddHabit}
                >
                  <Ionicons name="arrow-up" size={18} color="#0F172A" />
                </Pressable>
              </View>

              {/* Category selector */}
              <View style={styles.categorySelectRow}>
                {(['Coding', 'Learning', 'Revision', 'Project', 'Custom'] as const).map(
                  (cat) => (
                    <Pressable
                      key={cat}
                      style={[
                        styles.catOption,
                        {
                          backgroundColor:
                            newChecklistCategory === cat
                              ? theme.primary + '20'
                              : theme.surfaceElevated,
                          borderColor:
                            newChecklistCategory === cat ? theme.primary : theme.border,
                        },
                      ]}
                      onPress={() => setNewChecklistCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.catOptionText,
                          {
                            color:
                              newChecklistCategory === cat
                                ? theme.primary
                                : theme.textSecondary,
                          },
                        ]}
                      >
                        {cat}
                      </Text>
                    </Pressable>
                  )
                )}
              </View>
            </View>

            {/* Habit Items List */}
            <SectionHeader title="Your Daily Habits" count={checklist.length} />
            {checklist.length > 0 ? (
              <View style={styles.habitList}>
                {checklist.map((item) => (
                  <View
                    key={item.id}
                    style={[
                      styles.habitCardItem,
                      { backgroundColor: theme.surface, borderColor: theme.border },
                    ]}
                  >
                    <Pressable
                      style={styles.habitItemLeft}
                      onPress={() => toggleChecklistItem(item.id)}
                    >
                      <View
                        style={[
                          styles.habitCheckbox,
                          {
                            backgroundColor: item.completed ? theme.primary : 'transparent',
                            borderColor: item.completed ? theme.primary : theme.textSecondary,
                          },
                        ]}
                      >
                        {item.completed && (
                          <Ionicons name="checkmark" size={14} color="#0F172A" />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.habitItemText,
                          {
                            color: item.completed ? theme.textMuted : theme.text,
                            textDecorationLine: item.completed ? 'line-through' : 'none',
                          },
                        ]}
                      >
                        {item.title}
                      </Text>
                    </Pressable>

                    <View style={styles.habitItemRight}>
                      <View
                        style={[
                          styles.habitItemBadge,
                          { backgroundColor: theme.surfaceElevated },
                        ]}
                      >
                        <Text
                          style={[styles.habitItemBadgeText, { color: theme.textSecondary }]}
                        >
                          {item.category}
                        </Text>
                      </View>
                      <Pressable
                        style={styles.habitDeleteBtn}
                        onPress={() => deleteChecklistItem(item.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState
                icon="list-outline"
                title="No habits added yet"
                description="Create daily habits to track your coding practice, revision, and study milestones."
              />
            )}
          </>
        )}

        {/* ================= 3. REMINDERS TAB ================= */}
        {activeSegment === 'reminders' && (
          <>
            {/* Notification Permissions & Status Banner */}
            <View
              style={[
                styles.permBanner,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View style={styles.permBannerLeft}>
                <View
                  style={[
                    styles.permIconBadge,
                    { backgroundColor: 'rgba(56, 189, 248, 0.15)' },
                  ]}
                >
                  <Ionicons name="notifications" size={22} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.permHeading, { color: theme.text }]}>
                    Local Push Reminders
                  </Text>
                  <Text style={[styles.permSub, { color: theme.textSecondary }]}>
                    Notifications fire for deadlines & scheduled study hours.
                  </Text>
                </View>
              </View>

              <Pressable
                style={[
                  styles.testNotifBtn,
                  {
                    backgroundColor: notifTestSuccess
                      ? 'rgba(16, 185, 129, 0.2)'
                      : theme.surfaceElevated,
                    borderColor: notifTestSuccess ? theme.success : theme.border,
                  },
                ]}
                onPress={handleTestNotification}
              >
                <Ionicons
                  name={notifTestSuccess ? 'checkmark-circle' : 'paper-plane-outline'}
                  size={14}
                  color={notifTestSuccess ? theme.success : theme.primary}
                />
                <Text
                  style={[
                    styles.testNotifText,
                    { color: notifTestSuccess ? theme.success : theme.primary },
                  ]}
                >
                  {notifTestSuccess ? 'Sent!' : 'Test Alert'}
                </Text>
              </Pressable>
            </View>

            {/* Reminders List */}
            <SectionHeader
              title="Scheduled Reminders"
              count={reminderTasks.length}
              actionText="+ New Reminder"
              onAction={() => {
                setEditingTask(null);
                setTaskModalVisible(true);
              }}
            />

            {reminderTasks.length > 0 ? (
              <View style={styles.remindersListGroup}>
                {reminderTasks.map((t) => {
                  const isEnabled = t.reminder?.enabled ?? false;
                  const alertTime = t.reminder?.triggerTime || t.deadline || '09:00';

                  return (
                    <View
                      key={t.id}
                      style={[
                        styles.reminderCard,
                        {
                          backgroundColor: theme.surface,
                          borderColor: isEnabled ? theme.border : theme.borderSubtle,
                          opacity: isEnabled ? 1 : 0.6,
                        },
                      ]}
                    >
                      <View style={styles.reminderCardLeft}>
                        <View
                          style={[
                            styles.reminderTimeCircle,
                            {
                              backgroundColor: isEnabled
                                ? 'rgba(245, 158, 11, 0.15)'
                                : theme.surfaceElevated,
                            },
                          ]}
                        >
                          <Ionicons
                            name="time"
                            size={18}
                            color={isEnabled ? '#F59E0B' : theme.textMuted}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.reminderTitle,
                              {
                                color: theme.text,
                                textDecorationLine: t.completed ? 'line-through' : 'none',
                              },
                            ]}
                          >
                            {t.title}
                          </Text>
                          <View style={styles.reminderSubRow}>
                            <Text style={[styles.reminderTimeText, { color: '#F59E0B' }]}>
                              Alert at {alertTime}
                            </Text>
                            <Text style={[styles.reminderDateText, { color: theme.textMuted }]}>
                              • {t.date}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Enable / Disable Switch */}
                      <View style={styles.reminderControls}>
                        <Switch
                          value={isEnabled}
                          onValueChange={() => toggleReminderControl(t)}
                          trackColor={{ false: '#334155', true: theme.primary }}
                          thumbColor={isEnabled ? '#0F172A' : '#94A3B8'}
                        />
                        <Pressable
                          style={[styles.reminderEditBtn, { backgroundColor: theme.surfaceElevated }]}
                          onPress={() => {
                            setEditingTask(t);
                            setTaskModalVisible(true);
                          }}
                        >
                          <Ionicons name="pencil" size={13} color={theme.textSecondary} />
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <EmptyState
                icon="notifications-off-outline"
                title="No reminders scheduled"
                description="Set notification alerts when creating tasks to keep your coding study habits on track."
                actionTitle="+ Schedule a Reminder"
                onAction={() => {
                  setEditingTask(null);
                  setTaskModalVisible(true);
                }}
              />
            )}
          </>
        )}
      </ScreenContainer>

      {/* Task Creation / Edit Modal */}
      <TaskModal
        visible={taskModalVisible}
        initialTask={editingTask || undefined}
        onClose={() => {
          setTaskModalVisible(false);
          setEditingTask(null);
        }}
        onSave={async (taskData) => {
          if (editingTask) {
            await updateTask({
              ...editingTask,
              ...taskData,
            });
          } else {
            await addTask(taskData);
          }
          setTaskModalVisible(false);
          setEditingTask(null);
        }}
      />

      {/* Confirm Deletion Modal */}
      <ConfirmModal
        visible={!!deleteTaskId}
        title="Delete Task?"
        message="Are you sure you want to permanently delete this task? This action cannot be undone."
        confirmText="Delete"
        isDestructive={true}
        isDark={isDark}
        onConfirm={async () => {
          if (deleteTaskId) {
            await deleteTask(deleteTaskId);
            setDeleteTaskId(null);
          }
        }}
        onCancel={() => setDeleteTaskId(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 4,
  },
  headerAddText: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 13,
  },
  segmentBar: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  filterBar: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  resultCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  sortGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sortLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  sortBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sortBtnText: {
    fontSize: 11,
  },
  taskListContainer: {
    gap: 12,
  },
  habitsSummaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  habitsSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  habitsTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  habitsSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  habitsPct: {
    fontSize: 20,
    fontWeight: '800',
  },
  addHabitCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  addHabitHeading: {
    fontSize: 14,
    fontWeight: '700',
  },
  habitInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  habitTextInput: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  addHabitBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categorySelectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  catOption: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  catOptionText: {
    fontSize: 11,
    fontWeight: '600',
  },
  habitList: {
    gap: 8,
  },
  habitCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  habitItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  habitCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitItemText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  habitItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  habitItemBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  habitItemBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  habitDeleteBtn: {
    padding: 4,
  },
  permBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  permBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  permIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permHeading: {
    fontSize: 14,
    fontWeight: '700',
  },
  permSub: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  testNotifBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  testNotifText: {
    fontSize: 11,
    fontWeight: '700',
  },
  remindersListGroup: {
    gap: 10,
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  reminderCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  reminderTimeCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  reminderSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  reminderTimeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  reminderDateText: {
    fontSize: 11,
    marginLeft: 4,
  },
  reminderControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reminderEditBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
