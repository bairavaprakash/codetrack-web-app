import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RoadmapTopic } from '@/types';
import { Colors } from '@/constants/colors';

interface TopicDetailModalProps {
  visible: boolean;
  topic?: RoadmapTopic | null;
  languageName?: string;
  languageColor?: string;
  isDark?: boolean;
  onClose: () => void;
  onToggleCompleted: () => void;
}

export const TopicDetailModal: React.FC<TopicDetailModalProps> = ({
  visible,
  topic,
  languageName,
  languageColor = '#38BDF8',
  isDark = true,
  onClose,
  onToggleCompleted,
}) => {
  if (!topic) return null;

  const theme = isDark ? Colors.dark : Colors.light;

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner':
        return '#34D399';
      case 'Intermediate':
        return '#FBBF24';
      case 'Advanced':
        return '#F87171';
      default:
        return '#38BDF8';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.container, { backgroundColor: theme.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <View style={styles.headerLeft}>
              <View style={styles.tagRow}>
                <View
                  style={[
                    styles.langBadge,
                    { backgroundColor: languageColor + '20', borderColor: languageColor },
                  ]}>
                  <Text style={[styles.langText, { color: languageColor }]}>
                    {languageName || 'Roadmap'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.levelBadge,
                    {
                      backgroundColor: getLevelColor(topic.level) + '20',
                      borderColor: getLevelColor(topic.level),
                    },
                  ]}>
                  <Text style={[styles.levelText, { color: getLevelColor(topic.level) }]}>
                    {topic.level}
                  </Text>
                </View>
              </View>
              <Text style={[styles.title, { color: theme.text }]}>{topic.title}</Text>
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
            {/* Description */}
            <View style={[styles.sectionCard, { backgroundColor: theme.surfaceElevated }]}>
              <Text style={[styles.sectionTitle, { color: theme.primary }]}>Overview</Text>
              <Text style={[styles.descText, { color: theme.textSecondary }]}>
                {topic.description}
              </Text>
            </View>

            {/* Learning Objectives */}
            <View style={[styles.sectionCard, { backgroundColor: theme.surfaceElevated }]}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="flag-outline" size={18} color={theme.primary} />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Learning Objectives</Text>
              </View>
              {topic.objectives.map((obj, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <Ionicons name="checkmark-circle" size={16} color={theme.success} />
                  <Text style={[styles.itemText, { color: theme.text }]}>{obj}</Text>
                </View>
              ))}
            </View>

            {/* Practice Exercises */}
            <View style={[styles.sectionCard, { backgroundColor: theme.surfaceElevated }]}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="code-slash" size={18} color={languageColor} />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Practice Exercises</Text>
              </View>
              {topic.exercises.map((ex, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <View style={[styles.numberBadge, { backgroundColor: languageColor + '20' }]}>
                    <Text style={[styles.numberText, { color: languageColor }]}>{idx + 1}</Text>
                  </View>
                  <Text style={[styles.itemText, { color: theme.text }]}>{ex}</Text>
                </View>
              ))}
            </View>

            {/* Mini Projects */}
            {topic.miniProjects && topic.miniProjects.length > 0 && (
              <View style={[styles.sectionCard, { backgroundColor: theme.surfaceElevated }]}>
                <View style={styles.sectionHeaderRow}>
                  <Ionicons name="rocket-outline" size={18} color="#FBBF24" />
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Mini-Projects</Text>
                </View>
                {topic.miniProjects.map((mp, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <Ionicons name="sparkles" size={16} color="#FBBF24" />
                    <Text style={[styles.itemText, { color: theme.text }]}>{mp}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Revision Tasks */}
            {topic.revisionTasks && topic.revisionTasks.length > 0 && (
              <View style={[styles.sectionCard, { backgroundColor: theme.surfaceElevated }]}>
                <View style={styles.sectionHeaderRow}>
                  <Ionicons name="repeat-outline" size={18} color="#A78BFA" />
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Revision Tasks</Text>
                </View>
                {topic.revisionTasks.map((rt, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <Ionicons name="help-circle-outline" size={16} color="#A78BFA" />
                    <Text style={[styles.itemText, { color: theme.text }]}>{rt}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Footer Action */}
          <View style={[styles.footer, { borderTopColor: theme.border }]}>
            <Pressable
              style={[
                styles.actionBtn,
                {
                  backgroundColor: topic.completed ? '#34D39925' : theme.primary,
                  borderColor: topic.completed ? '#34D399' : theme.primary,
                },
              ]}
              onPress={() => {
                onToggleCompleted();
              }}>
              <Ionicons
                name={topic.completed ? 'checkmark-circle' : 'checkmark-done-outline'}
                size={20}
                color={topic.completed ? '#34D399' : '#FFFFFF'}
              />
              <Text
                style={[
                  styles.actionBtnText,
                  { color: topic.completed ? '#34D399' : '#FFFFFF' },
                ]}>
                {topic.completed ? 'Completed (Tap to Reopen)' : 'Mark Topic as Completed'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
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
    maxHeight: '88%',
    minHeight: '55%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 12,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  langBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  langText: {
    fontSize: 11,
    fontWeight: '700',
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  levelText: {
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
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
  sectionCard: {
    padding: 16,
    borderRadius: 16,
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  descText: {
    fontSize: 13,
    lineHeight: 20,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 2,
  },
  numberBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  numberText: {
    fontSize: 11,
    fontWeight: '700',
  },
  itemText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  actionBtn: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
