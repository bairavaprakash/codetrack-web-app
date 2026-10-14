import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { Colors } from '@/constants/colors';
import { ScreenContainer } from '@/components/ScreenContainer';
import { AppHeader } from '@/components/AppHeader';
import { TaskCard } from '@/components/TaskCard';
import { EmptyState } from '@/components/EmptyState';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TaskModal } from '@/components/TaskModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { Task } from '@/types';

export default function CalendarScreen() {
  const {
    tasks,
    settings,
    addTask,
    updateTask,
    deleteTask,
    duplicateTask,
    refreshData,
  } = useApp();

  const isDark = settings.theme !== 'light';
  const theme = isDark ? Colors.dark : Colors.light;

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  const [weekOffset, setWeekOffset] = useState<number>(0);

  // Modals
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [showOverdue, setShowOverdue] = useState(true);

  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // Compute 7 days of the currently selected week (Monday start)
  const weekDays = useMemo(() => {
    const curr = new Date();
    const first = curr.getDate() - curr.getDay() + 1 + weekOffset * 7;
    const days = [];

    for (let i = 0; i < 7; i++) {
      const nextDate = new Date(curr.getFullYear(), curr.getMonth(), first + i);
      const y = nextDate.getFullYear();
      const m = String(nextDate.getMonth() + 1).padStart(2, '0');
      const d = String(nextDate.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      const dayName = nextDate.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = nextDate.getDate();

      const taskCount = tasks.filter((t) => t.date === dateStr).length;
      const hasCompleted = tasks.some((t) => t.date === dateStr && t.completed);
      const hasPending = tasks.some((t) => t.date === dateStr && !t.completed);

      days.push({
        dateStr,
        dayName,
        dayNum,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
        taskCount,
        hasCompleted,
        hasPending,
      });
    }

    return days;
  }, [weekOffset, tasks, todayStr, selectedDate]);

  // Tasks for the selected date
  const selectedDateTasks = useMemo(() => {
    return tasks.filter((t) => t.date === selectedDate);
  }, [tasks, selectedDate]);

  // Overdue tasks across all past dates
  const overdueTasks = useMemo(() => {
    return tasks.filter((t) => !t.completed && t.date < todayStr);
  }, [tasks, todayStr]);

  const selectedDateLabel = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }, [selectedDate]);

  const jumpToToday = () => {
    setWeekOffset(0);
    setSelectedDate(todayStr);
  };

  return (
    <>
      <AppHeader
        title="Calendar & Planner"
        subtitle={`${selectedDateTasks.length} tasks scheduled for selected date`}
        rightElement={
          <Pressable
            style={[styles.todayJumpBtn, { backgroundColor: theme.surfaceElevated }]}
            onPress={jumpToToday}
          >
            <Ionicons name="today" size={14} color={theme.primary} />
            <Text style={[styles.todayJumpText, { color: theme.primary }]}>Today</Text>
          </Pressable>
        }
      />

      <ScreenContainer onRefresh={refreshData}>
        {/* Overdue Tasks Alert Accordion (if any exist) */}
        {overdueTasks.length > 0 && (
          <View
            style={[
              styles.overdueBanner,
              { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' },
            ]}
          >
            <Pressable
              style={styles.overdueHeaderRow}
              onPress={() => setShowOverdue(!showOverdue)}
            >
              <View style={styles.overdueLeft}>
                <Ionicons name="warning" size={18} color="#EF4444" />
                <Text style={styles.overdueTitle}>
                  {overdueTasks.length} Overdue {overdueTasks.length === 1 ? 'Task' : 'Tasks'}
                </Text>
              </View>
              <Ionicons
                name={showOverdue ? 'chevron-up' : 'chevron-down'}
                size={16}
                color="#EF4444"
              />
            </Pressable>

            {showOverdue && (
              <View style={styles.overdueList}>
                {overdueTasks.slice(0, 3).map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    showDate={true}
                    onEdit={() => {
                      setEditingTask(t);
                      setTaskModalVisible(true);
                    }}
                    onDuplicate={() => duplicateTask(t.id)}
                    onDelete={() => setDeleteTaskId(t.id)}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Week Switcher Navigation Row */}
        <View
          style={[
            styles.weekNavCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.weekNavControls}>
            <Pressable
              style={[styles.weekNavBtn, { backgroundColor: theme.surfaceElevated }]}
              onPress={() => setWeekOffset((w) => w - 1)}
            >
              <Ionicons name="chevron-back" size={16} color={theme.text} />
            </Pressable>

            <Text style={[styles.weekNavLabel, { color: theme.text }]}>
              {weekOffset === 0
                ? 'Current Week'
                : weekOffset === 1
                ? 'Next Week'
                : weekOffset === -1
                ? 'Last Week'
                : `Week offset: ${weekOffset > 0 ? `+${weekOffset}` : weekOffset}`}
            </Text>

            <Pressable
              style={[styles.weekNavBtn, { backgroundColor: theme.surfaceElevated }]}
              onPress={() => setWeekOffset((w) => w + 1)}
            >
              <Ionicons name="chevron-forward" size={16} color={theme.text} />
            </Pressable>
          </View>

          {/* 7-Day Interactive Day Strip */}
          <View style={styles.daysStrip}>
            {weekDays.map((day) => {
              const isSelected = day.isSelected;
              return (
                <Pressable
                  key={day.dateStr}
                  style={[
                    styles.dayPill,
                    {
                      backgroundColor: isSelected
                        ? theme.primary
                        : day.isToday
                        ? theme.primary + '18'
                        : theme.surfaceElevated,
                      borderColor: isSelected
                        ? theme.primary
                        : day.isToday
                        ? theme.primary + '50'
                        : theme.border,
                    },
                  ]}
                  onPress={() => setSelectedDate(day.dateStr)}
                >
                  <Text
                    style={[
                      styles.dayName,
                      { color: isSelected ? '#0F172A' : theme.textSecondary },
                    ]}
                  >
                    {day.dayName}
                  </Text>
                  <Text
                    style={[
                      styles.dayNum,
                      { color: isSelected ? '#0F172A' : theme.text },
                    ]}
                  >
                    {day.dayNum}
                  </Text>

                  {/* Task activity indicator dot */}
                  <View style={styles.dotContainer}>
                    {day.taskCount > 0 && (
                      <View
                        style={[
                          styles.taskIndicatorDot,
                          {
                            backgroundColor: isSelected
                              ? '#0F172A'
                              : day.hasPending
                              ? '#F59E0B'
                              : theme.success,
                          },
                        ]}
                      />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Selected Date Header & Quick Add */}
        <View style={styles.selectedDateHeader}>
          <View>
            <Text style={[styles.selectedDateTitle, { color: theme.text }]}>
              {selectedDateLabel}
            </Text>
            <Text style={[styles.selectedDateSub, { color: theme.textSecondary }]}>
              {selectedDateTasks.length} {selectedDateTasks.length === 1 ? 'task' : 'tasks'} scheduled
            </Text>
          </View>

          <PrimaryButton
            title="+ Add Task"
            size="sm"
            onPress={() => {
              setEditingTask(null);
              setTaskModalVisible(true);
            }}
          />
        </View>

        {/* Tasks Scheduled for Selected Date */}
        {selectedDateTasks.length > 0 ? (
          <View style={styles.tasksList}>
            {selectedDateTasks.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                showDate={false}
                onEdit={() => {
                  setEditingTask(t);
                  setTaskModalVisible(true);
                }}
                onDuplicate={() => duplicateTask(t.id)}
                onDelete={() => setDeleteTaskId(t.id)}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            icon="calendar-outline"
            title="No tasks on this date"
            description={`You haven't scheduled any coding practice or learning tasks for ${selectedDateLabel}.`}
            actionTitle="+ Schedule a Task"
            onAction={() => {
              setEditingTask(null);
              setTaskModalVisible(true);
            }}
          />
        )}
      </ScreenContainer>

      {/* Task Creation / Edit Modal */}
      <TaskModal
        visible={taskModalVisible}
        initialDate={selectedDate}
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
            await addTask({
              ...taskData,
              date: taskData.date || selectedDate,
            });
          }
          setTaskModalVisible(false);
          setEditingTask(null);
        }}
      />

      {/* Confirm Deletion Modal */}
      <ConfirmModal
        visible={!!deleteTaskId}
        title="Delete Task?"
        message="Are you sure you want to permanently delete this task?"
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
  todayJumpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  todayJumpText: {
    fontSize: 12,
    fontWeight: '700',
  },
  overdueBanner: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  overdueHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overdueLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  overdueTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EF4444',
  },
  overdueList: {
    gap: 8,
    marginTop: 4,
  },
  weekNavCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  weekNavControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weekNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekNavLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  daysStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  dayPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 3,
  },
  dayName: {
    fontSize: 11,
    fontWeight: '600',
  },
  dayNum: {
    fontSize: 16,
    fontWeight: '800',
  },
  dotContainer: {
    height: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskIndicatorDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  selectedDateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  selectedDateTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  selectedDateSub: {
    fontSize: 12,
    marginTop: 2,
  },
  tasksList: {
    gap: 10,
  },
});
