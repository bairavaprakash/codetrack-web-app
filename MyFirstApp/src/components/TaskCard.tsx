import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task } from '@/types';
import { useApp } from '@/context/AppContext';
import { Colors, CategoryColors, PriorityColors, LanguageColors } from '@/constants/colors';

interface TaskCardProps {
  task: Task;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  showDate?: boolean;
  style?: ViewStyle;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onPress,
  onEdit,
  onDelete,
  onDuplicate,
  showDate = false,
  style,
}) => {
  const { settings, toggleTaskCompleted, toggleSubtask } = useApp();
  const isDark = settings.theme !== 'light';
  const theme = isDark ? Colors.dark : Colors.light;

  const [expanded, setExpanded] = useState(false);

  const catStyle = CategoryColors[task.category] || CategoryColors.Learning;
  const priStyle = PriorityColors[task.priority] || PriorityColors.Medium;
  const langColor = task.language ? LanguageColors[task.language] || theme.primary : undefined;

  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = task.subtasks.length;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: task.completed ? theme.borderSubtle : theme.border,
          opacity: task.completed ? 0.75 : 1,
        },
        style,
      ]}
    >
      {/* Top Meta Row: Badges & Actions */}
      <View style={styles.topRow}>
        <View style={styles.badgeGroup}>
          {/* Category */}
          <View
            style={[
              styles.badge,
              { backgroundColor: catStyle.bg, borderColor: catStyle.border },
            ]}
          >
            <Text style={[styles.badgeText, { color: catStyle.text }]}>
              {task.category}
            </Text>
          </View>

          {/* Priority */}
          <View
            style={[
              styles.badge,
              { backgroundColor: priStyle.bg, borderColor: priStyle.badge + '40' },
            ]}
          >
            <View style={[styles.dot, { backgroundColor: priStyle.badge }]} />
            <Text style={[styles.badgeText, { color: priStyle.text }]}>
              {task.priority}
            </Text>
          </View>

          {/* Language tag */}
          {task.language && langColor && (
            <View
              style={[
                styles.badge,
                { backgroundColor: langColor + '20', borderColor: langColor + '40' },
              ]}
            >
              <Text style={[styles.badgeText, { color: langColor }]}>
                {task.language}
              </Text>
            </View>
          )}
        </View>

        {/* Action Menu Buttons */}
        <View style={styles.actionsRow}>
          {onDuplicate && (
            <Pressable
              style={[styles.actionIconBtn, { backgroundColor: theme.surfaceElevated }]}
              onPress={onDuplicate}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <Ionicons name="copy-outline" size={14} color={theme.textSecondary} />
            </Pressable>
          )}
          {onEdit && (
            <Pressable
              style={[styles.actionIconBtn, { backgroundColor: theme.surfaceElevated }]}
              onPress={onEdit}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <Ionicons name="pencil-outline" size={14} color={theme.textSecondary} />
            </Pressable>
          )}
          {onDelete && (
            <Pressable
              style={[styles.actionIconBtn, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}
              onPress={onDelete}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <Ionicons name="trash-outline" size={14} color="#EF4444" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Main Content Row: Checkbox + Title + Description */}
      <View style={styles.contentRow}>
        <Pressable
          style={[
            styles.checkbox,
            {
              backgroundColor: task.completed ? theme.primary : 'transparent',
              borderColor: task.completed ? theme.primary : theme.textSecondary,
            },
          ]}
          onPress={() => toggleTaskCompleted(task.id)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          {task.completed && <Ionicons name="checkmark" size={14} color="#0F172A" />}
        </Pressable>

        <Pressable style={styles.textBody} onPress={onPress || onEdit}>
          <Text
            style={[
              styles.title,
              {
                color: theme.text,
                textDecorationLine: task.completed ? 'line-through' : 'none',
              },
            ]}
            numberOfLines={2}
          >
            {task.title}
          </Text>

          {task.description ? (
            <Text
              style={[styles.description, { color: theme.textSecondary }]}
              numberOfLines={expanded ? undefined : 2}
            >
              {task.description}
            </Text>
          ) : null}
        </Pressable>
      </View>

      {/* Subtasks Summary / Toggle */}
      {totalSubtasks > 0 && (
        <View style={styles.subtasksSection}>
          <Pressable
            style={[styles.subtaskToggleBtn, { backgroundColor: theme.surfaceElevated }]}
            onPress={() => setExpanded(!expanded)}
          >
            <View style={styles.subtaskProgressRow}>
              <Ionicons
                name={completedSubtasks === totalSubtasks ? 'checkmark-circle' : 'list'}
                size={14}
                color={completedSubtasks === totalSubtasks ? theme.success : theme.primary}
              />
              <Text style={[styles.subtaskToggleText, { color: theme.textSecondary }]}>
                {completedSubtasks}/{totalSubtasks} Subtasks
              </Text>
            </View>
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={theme.textMuted}
            />
          </Pressable>

          {/* Collapsible Subtask Items */}
          {expanded && (
            <View style={[styles.subtaskList, { borderColor: theme.borderSubtle }]}>
              {task.subtasks.map((st) => (
                <Pressable
                  key={st.id}
                  style={styles.subtaskItem}
                  onPress={() => toggleSubtask(task.id, st.id)}
                >
                  <View
                    style={[
                      styles.subtaskCheck,
                      {
                        backgroundColor: st.completed ? theme.primary : 'transparent',
                        borderColor: st.completed ? theme.primary : theme.textMuted,
                      },
                    ]}
                  >
                    {st.completed && <Ionicons name="checkmark" size={10} color="#0F172A" />}
                  </View>
                  <Text
                    style={[
                      styles.subtaskTitle,
                      {
                        color: st.completed ? theme.textMuted : theme.text,
                        textDecorationLine: st.completed ? 'line-through' : 'none',
                      },
                    ]}
                  >
                    {st.title}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Bottom Footer: Deadline, Reminders, Date */}
      <View style={[styles.footer, { borderTopColor: theme.borderSubtle }]}>
        <View style={styles.footerLeft}>
          {showDate && (
            <View style={styles.footerPill}>
              <Ionicons name="calendar-outline" size={12} color={theme.textSecondary} />
              <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                {task.date}
              </Text>
            </View>
          )}

          {task.deadline && (
            <View style={styles.footerPill}>
              <Ionicons name="time-outline" size={12} color={theme.textSecondary} />
              <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                Due {task.deadline}
              </Text>
            </View>
          )}

          {task.reminder?.enabled && (
            <View
              style={[
                styles.footerPill,
                { backgroundColor: 'rgba(245, 158, 11, 0.15)', paddingHorizontal: 6, borderRadius: 6 },
              ]}
            >
              <Ionicons name="notifications" size={11} color="#F59E0B" />
              <Text style={[styles.footerText, { color: '#F59E0B', fontWeight: '600' }]}>
                {task.reminder.triggerTime || 'Alert'}
              </Text>
            </View>
          )}
        </View>

        {task.completed && (
          <View style={styles.doneBadge}>
            <Ionicons name="checkmark-done" size={13} color={theme.success} />
            <Text style={[styles.doneText, { color: theme.success }]}>Done</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    flex: 1,
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 6,
  },
  actionIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  textBody: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  subtasksSection: {
    marginTop: 2,
  },
  subtaskToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  subtaskProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subtaskToggleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  subtaskList: {
    marginTop: 8,
    paddingLeft: 8,
    borderLeftWidth: 2,
    gap: 8,
  },
  subtaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  subtaskCheck: {
    width: 16,
    height: 16,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtaskTitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 10,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  footerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '500',
  },
  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  doneText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
