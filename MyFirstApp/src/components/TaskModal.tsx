import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  Switch,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task, TaskCategory, TaskPriority, Subtask } from '@/types';
import { Colors, CategoryColors, PriorityColors, LanguageColors } from '@/constants/colors';

interface TaskModalProps {
  visible: boolean;
  task?: Task | null;
  initialTask?: Task | null;
  initialDate?: string;
  isDark?: boolean;
  onClose: () => void;
  onSave: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>, editId?: string) => Promise<void>;
}

const CATEGORIES: TaskCategory[] = [
  'Learning',
  'Coding Practice',
  'Project',
  'Revision',
  'Personal',
];

const PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High', 'Urgent'];

const LANGUAGES = [
  'Python',
  'JavaScript',
  'TypeScript',
  'React',
  'React Native',
  'FastAPI',
  'SQL',
  'Java',
  'C++',
  'Data Structures and Algorithms',
];

function getTodayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

interface TaskModalContentProps {
  task?: Task | null;
  initialDate?: string;
  theme: typeof Colors.dark;
  onClose: () => void;
  onSave: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>, editId?: string) => Promise<void>;
}

const TaskModalContent: React.FC<TaskModalContentProps> = ({
  task,
  initialDate,
  theme,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [category, setCategory] = useState<TaskCategory>(task?.category || 'Coding Practice');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || 'Medium');
  const [language, setLanguage] = useState<string>(task?.language || 'Python');
  const [date, setDate] = useState(task?.date || initialDate || getTodayString());
  const [startTime, setStartTime] = useState(task?.startTime || '10:00');
  const [deadline, setDeadline] = useState(task?.deadline || '12:00');
  const [subtasks, setSubtasks] = useState<Subtask[]>(task?.subtasks || []);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(task?.reminder?.enabled ?? false);
  const [reminderTime, setReminderTime] = useState(task?.reminder?.triggerTime ?? '09:45');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddSubtask = () => {
    if (!subtaskInput.trim()) return;
    const newSt: Subtask = {
      id: `st-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: subtaskInput.trim(),
      completed: false,
    };
    setSubtasks([...subtasks, newSt]);
    setSubtaskInput('');
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter((st) => st.id !== id));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return; // Prevent double tap
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const taskPayload = {
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        priority,
        language: language || undefined,
        date: date || getTodayString(),
        startTime: startTime.trim() || undefined,
        deadline: deadline.trim() || undefined,
        completed: task?.completed ?? false,
        completedAt: task?.completedAt,
        subtasks,
        reminder: {
          id: task?.reminder?.id || `rem-${Date.now()}`,
          enabled: reminderEnabled,
          triggerTime: reminderTime,
          notificationId: task?.reminder?.notificationId,
        },
      };

      await onSave(taskPayload, task?.id);
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Failed to save task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.backdrop}>
      <View style={[styles.container, { backgroundColor: theme.surface }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <View>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              {task ? 'Edit Task' : 'New Coding Task'}
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              Plan your coding session and learning milestones
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: theme.surfaceElevated }]}>
            <Ionicons name="close" size={20} color={theme.textSecondary} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color="#F87171" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Task Title */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Task Title *</Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.surfaceElevated,
                  color: theme.text,
                  borderColor: error ? '#F87171' : theme.border,
                },
              ]}
              placeholder="e.g. Build Redux toolkit slice for User auth"
              placeholderTextColor={theme.textMuted}
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                if (error) setError('');
              }}
            />
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Description</Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: theme.surfaceElevated,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              placeholder="Key goals, notes, or documentation links..."
              placeholderTextColor={theme.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Category Selector */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Category</Text>
            <View style={styles.pillRow}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                const catColor = CategoryColors[cat] || { text: theme.primary, bg: '#38BDF820' };
                return (
                  <Pressable
                    key={cat}
                    style={[
                      styles.pill,
                      {
                        backgroundColor: isSelected ? catColor.bg : theme.surfaceElevated,
                        borderColor: isSelected ? catColor.text : theme.border,
                      },
                    ]}
                    onPress={() => setCategory(cat)}>
                    <Text
                      style={[
                        styles.pillText,
                        {
                          color: isSelected ? catColor.text : theme.textSecondary,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}>
                      {cat}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Priority Selector */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Priority</Text>
            <View style={styles.pillRow}>
              {PRIORITIES.map((p) => {
                const isSelected = priority === p;
                const priColor = PriorityColors[p];
                return (
                  <Pressable
                    key={p}
                    style={[
                      styles.pill,
                      {
                        backgroundColor: isSelected ? priColor.bg : theme.surfaceElevated,
                        borderColor: isSelected ? priColor.badge : theme.border,
                      },
                    ]}
                    onPress={() => setPriority(p)}>
                    <View
                      style={[
                        styles.priDot,
                        {
                          backgroundColor: isSelected ? priColor.badge : theme.textMuted,
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.pillText,
                        {
                          color: isSelected ? priColor.text : theme.textSecondary,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}>
                      {p}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Language / Roadmap tag */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>
              Programming Language / Stack
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.langScroll}>
              {LANGUAGES.map((lang) => {
                const isSelected = language === lang;
                const lColor = LanguageColors[lang] || theme.primary;
                return (
                  <Pressable
                    key={lang}
                    style={[
                      styles.langPill,
                      {
                        backgroundColor: isSelected ? lColor + '25' : theme.surfaceElevated,
                        borderColor: isSelected ? lColor : theme.border,
                      },
                    ]}
                    onPress={() => setLanguage(lang)}>
                    <Text
                      style={[
                        styles.langText,
                        {
                          color: isSelected ? lColor : theme.textSecondary,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}>
                      {lang}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Date & Time Row */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1.2 }]}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Date (YYYY-MM-DD)</Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.surfaceElevated,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.textMuted}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Start Time</Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.surfaceElevated,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                value={startTime}
                onChangeText={setStartTime}
                placeholder="HH:mm"
                placeholderTextColor={theme.textMuted}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Deadline</Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.surfaceElevated,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                value={deadline}
                onChangeText={setDeadline}
                placeholder="HH:mm"
                placeholderTextColor={theme.textMuted}
              />
            </View>
          </View>

          {/* Subtasks Section */}
          <View style={styles.inputGroup}>
            <View style={styles.subtaskHeader}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>
                Subtasks & Checklist ({subtasks.filter((s) => s.completed).length}/{subtasks.length})
              </Text>
            </View>

            <View style={styles.subtaskAddRow}>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    flex: 1,
                    backgroundColor: theme.surfaceElevated,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="Add a step or subtask..."
                placeholderTextColor={theme.textMuted}
                value={subtaskInput}
                onChangeText={setSubtaskInput}
                onSubmitEditing={handleAddSubtask}
              />
              <Pressable
                style={[styles.subtaskAddBtn, { backgroundColor: theme.primary }]}
                onPress={handleAddSubtask}>
                <Ionicons name="add" size={20} color="#FFFFFF" />
              </Pressable>
            </View>

            {subtasks.map((st) => (
              <View
                key={st.id}
                style={[styles.subtaskItem, { backgroundColor: theme.surfaceSubtle }]}>
                <Pressable
                  style={styles.subtaskCheck}
                  onPress={() => {
                    setSubtasks(
                      subtasks.map((s) =>
                        s.id === st.id ? { ...s, completed: !s.completed } : s
                      )
                    );
                  }}>
                  <Ionicons
                    name={st.completed ? 'checkmark-circle' : 'ellipse-outline'}
                    size={20}
                    color={st.completed ? theme.success : theme.textMuted}
                  />
                  <Text
                    style={[
                      styles.subtaskTitle,
                      {
                        color: st.completed ? theme.textMuted : theme.text,
                        textDecorationLine: st.completed ? 'line-through' : 'none',
                      },
                    ]}>
                    {st.title}
                  </Text>
                </Pressable>
                <Pressable onPress={() => handleRemoveSubtask(st.id)}>
                  <Ionicons name="trash-outline" size={16} color={theme.danger} />
                </Pressable>
              </View>
            ))}
          </View>

          {/* Reminder Section */}
          <View
            style={[
              styles.reminderCard,
              { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
            ]}>
            <View style={styles.reminderRow}>
              <View style={styles.reminderInfo}>
                <Ionicons
                  name="notifications-outline"
                  size={20}
                  color={reminderEnabled ? theme.primary : theme.textMuted}
                />
                <View style={{ marginLeft: 10 }}>
                  <Text style={[styles.reminderTitle, { color: theme.text }]}>
                    Push Notification Reminder
                  </Text>
                  <Text style={[styles.reminderSub, { color: theme.textSecondary }]}>
                    Get notified before start time or deadline
                  </Text>
                </View>
              </View>
              <Switch
                value={reminderEnabled}
                onValueChange={setReminderEnabled}
                trackColor={{ false: theme.border, true: theme.primary + '80' }}
                thumbColor={reminderEnabled ? theme.primary : '#FFFFFF'}
              />
            </View>

            {reminderEnabled && (
              <View style={styles.reminderTimeRow}>
                <Text style={[styles.reminderTimeLabel, { color: theme.textSecondary }]}>
                  Notify at (HH:mm):
                </Text>
                <TextInput
                  style={[
                    styles.reminderTimeInput,
                    {
                      backgroundColor: theme.surface,
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                  value={reminderTime}
                  onChangeText={setReminderTime}
                  placeholder="09:45"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
            )}
          </View>
        </ScrollView>

        {/* Footer Actions */}
        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          <Pressable
            style={[styles.cancelBtn, { borderColor: theme.border }]}
            onPress={onClose}>
            <Text style={[styles.cancelBtnText, { color: theme.textSecondary }]}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[
              styles.saveBtn,
              { backgroundColor: theme.primary, opacity: isSubmitting ? 0.7 : 1 },
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}>
            <Text style={styles.saveBtnText}>
              {isSubmitting ? 'Saving...' : task ? 'Save Changes' : 'Create Task'}
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export const TaskModal: React.FC<TaskModalProps> = ({
  visible,
  task,
  initialTask,
  initialDate,
  isDark = true,
  onClose,
  onSave,
}) => {
  if (!visible) return null;
  const theme = isDark ? Colors.dark : Colors.light;
  const activeTask = task ?? initialTask;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TaskModalContent
        key={activeTask ? activeTask.id : `${initialDate || 'new'}-${visible}`}
        task={activeTask}
        initialDate={initialDate}
        theme={theme}
        onClose={onClose}
        onSave={onSave}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    minHeight: '60%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8717120',
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  errorText: {
    color: '#F87171',
    fontSize: 13,
    fontWeight: '600',
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  textInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  textArea: {
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  priDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  pillText: {
    fontSize: 13,
  },
  langScroll: {
    flexDirection: 'row',
  },
  langPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  langText: {
    fontSize: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  subtaskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subtaskAddRow: {
    flexDirection: 'row',
    gap: 8,
  },
  subtaskAddBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  subtaskCheck: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  subtaskTitle: {
    fontSize: 14,
    flex: 1,
  },
  reminderCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  reminderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reminderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reminderTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  reminderSub: {
    fontSize: 11,
    marginTop: 2,
  },
  reminderTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#30363D40',
  },
  reminderTimeLabel: {
    fontSize: 13,
  },
  reminderTimeInput: {
    width: 90,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
