import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { Colors } from '@/constants/colors';
import { ScreenContainer } from '@/components/ScreenContainer';
import { AppHeader } from '@/components/AppHeader';
import { ProgressBar } from '@/components/ProgressBar';
import { SectionHeader } from '@/components/SectionHeader';
import { EmptyState } from '@/components/EmptyState';
import { TopicDetailModal } from '@/components/TopicDetailModal';
import { RoadmapTopic, TopicLevel } from '@/types';

export default function LearnScreen() {
  const { roadmaps, settings, toggleTopicCompleted, stats, refreshData } = useApp();

  const isDark = settings.theme !== 'light';
  const theme = isDark ? Colors.dark : Colors.light;

  const [selectedLanguageId, setSelectedLanguageId] = useState<string>('python');
  const [selectedLevel, setSelectedLevel] = useState<TopicLevel | 'All'>('All');
  const [selectedTopic, setSelectedTopic] = useState<RoadmapTopic | null>(null);

  const activeRoadmap = useMemo(() => {
    return roadmaps.find((r) => r.id === selectedLanguageId) || roadmaps[0];
  }, [roadmaps, selectedLanguageId]);

  // Topics filtered by level
  const displayedTopics = useMemo(() => {
    if (!activeRoadmap) return [];
    return activeRoadmap.topics.filter(
      (t) => selectedLevel === 'All' || t.level === selectedLevel
    );
  }, [activeRoadmap, selectedLevel]);

  const completedCount = useMemo(() => {
    if (!activeRoadmap) return 0;
    return activeRoadmap.topics.filter((t) => t.completed).length;
  }, [activeRoadmap]);

  const progressPercent = useMemo(() => {
    if (!activeRoadmap || activeRoadmap.topics.length === 0) return 0;
    return Math.round((completedCount / activeRoadmap.topics.length) * 100);
  }, [activeRoadmap, completedCount]);

  // Next uncompleted topic for "Continue Next Lesson"
  const nextLesson = useMemo(() => {
    if (!activeRoadmap) return null;
    return activeRoadmap.topics.find((t) => !t.completed);
  }, [activeRoadmap]);

  const getLevelBadgeColor = (lvl: TopicLevel) => {
    switch (lvl) {
      case 'Beginner':
        return '#34D399';
      case 'Intermediate':
        return '#FBBF24';
      case 'Advanced':
        return '#F87171';
    }
  };

  return (
    <>
      <AppHeader
        title="Learning Roadmaps"
        subtitle={`12 curated curriculum paths • ${stats.totalTopicsCompleted} modules done`}
        rightElement={
          <View
            style={[
              styles.topicsCompletedBadge,
              { backgroundColor: theme.primary + '18', borderColor: theme.primary + '40' },
            ]}
          >
            <Ionicons name="school" size={14} color={theme.primary} />
            <Text style={[styles.topicsCompletedText, { color: theme.primary }]}>
              {stats.totalTopicsCompleted} Done
            </Text>
          </View>
        }
      />

      <ScreenContainer onRefresh={refreshData}>
        {/* Horizontal Language Tabs */}
        <View style={styles.langSelectorContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.langScroll}
          >
            {roadmaps.map((lang) => {
              const isSelected = selectedLanguageId === lang.id;
              const done = lang.topics.filter((t) => t.completed).length;
              const pct = Math.round((done / lang.topics.length) * 100);

              return (
                <Pressable
                  key={lang.id}
                  style={[
                    styles.langTab,
                    {
                      backgroundColor: isSelected ? lang.color + '20' : theme.surface,
                      borderColor: isSelected ? lang.color : theme.border,
                    },
                  ]}
                  onPress={() => setSelectedLanguageId(lang.id)}
                >
                  <Ionicons
                    name={lang.icon as any}
                    size={16}
                    color={isSelected ? lang.color : theme.textSecondary}
                  />
                  <Text
                    style={[
                      styles.langTabText,
                      {
                        color: isSelected ? lang.color : theme.textSecondary,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {lang.name}
                  </Text>
                  {pct > 0 && (
                    <View style={[styles.miniPercentTag, { backgroundColor: lang.color }]}>
                      <Text style={styles.miniPercentText}>{pct}%</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Active Roadmap Hero Card */}
        {activeRoadmap && (
          <View
            style={[
              styles.roadmapHeroCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View style={styles.heroTopRow}>
              <View
                style={[
                  styles.heroIconBadge,
                  { backgroundColor: activeRoadmap.color + '20' },
                ]}
              >
                <Ionicons
                  name={activeRoadmap.icon as any}
                  size={26}
                  color={activeRoadmap.color}
                />
              </View>
              <View style={styles.heroTitles}>
                <Text style={[styles.heroName, { color: theme.text }]}>
                  {activeRoadmap.name} Roadmap
                </Text>
                <Text style={[styles.heroDesc, { color: theme.textSecondary }]}>
                  {activeRoadmap.description}
                </Text>
              </View>
            </View>

            {/* Progress Section */}
            <View style={styles.heroProgressSection}>
              <View style={styles.progressLabelRow}>
                <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>
                  Roadmap Completion ({completedCount}/{activeRoadmap.topics.length} topics)
                </Text>
                <Text style={[styles.progressNumber, { color: activeRoadmap.color }]}>
                  {progressPercent}%
                </Text>
              </View>
              <ProgressBar
                progress={progressPercent}
                color={activeRoadmap.color}
                height={8}
              />
            </View>

            {/* Next Lesson Action Banner */}
            {nextLesson && (
              <Pressable
                style={[
                  styles.nextLessonBanner,
                  {
                    backgroundColor: theme.surfaceElevated,
                    borderColor: activeRoadmap.color + '40',
                  },
                ]}
                onPress={() => setSelectedTopic(nextLesson)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.nextLessonSub, { color: activeRoadmap.color }]}>
                    Continue Learning
                  </Text>
                  <Text style={[styles.nextLessonTitle, { color: theme.text }]} numberOfLines={1}>
                    {nextLesson.title}
                  </Text>
                </View>
                <Ionicons name="arrow-forward-circle" size={24} color={activeRoadmap.color} />
              </Pressable>
            )}

            {/* Level Filter Chips */}
            <View style={styles.levelFilterRow}>
              {(['All', 'Beginner', 'Intermediate', 'Advanced'] as const).map((lvl) => {
                const isSelected = selectedLevel === lvl;
                return (
                  <Pressable
                    key={lvl}
                    style={[
                      styles.lvlFilterChip,
                      {
                        backgroundColor: isSelected
                          ? activeRoadmap.color + '25'
                          : theme.surfaceElevated,
                        borderColor: isSelected ? activeRoadmap.color : theme.border,
                      },
                    ]}
                    onPress={() => setSelectedLevel(lvl)}
                  >
                    <Text
                      style={[
                        styles.lvlFilterText,
                        {
                          color: isSelected ? activeRoadmap.color : theme.textSecondary,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {lvl}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Modules & Milestones List */}
        <SectionHeader
          title="Modules & Syllabus Topics"
          count={displayedTopics.length}
        />

        {displayedTopics.length > 0 ? (
          <View style={styles.topicsGrid}>
            {displayedTopics.map((topic, index) => {
              const levelColor = getLevelBadgeColor(topic.level);

              return (
                <Pressable
                  key={topic.id}
                  style={[
                    styles.topicCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor: topic.completed ? '#34D39960' : theme.border,
                    },
                  ]}
                  onPress={() => setSelectedTopic(topic)}
                >
                  {/* Topic Card Header */}
                  <View style={styles.topicCardTop}>
                    <View style={styles.topicIndexBadge}>
                      <Text style={[styles.topicIndexText, { color: theme.textMuted }]}>
                        #{index + 1}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.levelTag,
                        { backgroundColor: levelColor + '20', borderColor: levelColor + '40' },
                      ]}
                    >
                      <Text style={[styles.levelTagText, { color: levelColor }]}>
                        {topic.level}
                      </Text>
                    </View>

                    <View style={{ flex: 1 }} />

                    {/* Checkbox button */}
                    <Pressable
                      style={styles.topicCheckBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        toggleTopicCompleted(activeRoadmap.id, topic.id);
                      }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons
                        name={topic.completed ? 'checkmark-circle' : 'ellipse-outline'}
                        size={22}
                        color={topic.completed ? theme.success : theme.textMuted}
                      />
                    </Pressable>
                  </View>

                  {/* Title & Description */}
                  <Text
                    style={[
                      styles.topicTitle,
                      {
                        color: theme.text,
                        textDecorationLine: topic.completed ? 'line-through' : 'none',
                      },
                    ]}
                  >
                    {topic.title}
                  </Text>

                  <Text
                    style={[styles.topicDesc, { color: theme.textSecondary }]}
                    numberOfLines={2}
                  >
                    {topic.description}
                  </Text>

                  {/* Mini-Badges: Objectives, Exercises, Mini-Projects */}
                  <View style={styles.topicBadgesRow}>
                    <View
                      style={[
                        styles.topicPill,
                        { backgroundColor: theme.surfaceElevated },
                      ]}
                    >
                      <Ionicons name="list-outline" size={11} color={theme.textMuted} />
                      <Text style={[styles.topicPillText, { color: theme.textSecondary }]}>
                        {topic.objectives.length} Objectives
                      </Text>
                    </View>

                    {topic.exercises?.length > 0 && (
                      <View
                        style={[
                          styles.topicPill,
                          { backgroundColor: theme.surfaceElevated },
                        ]}
                      >
                        <Ionicons name="code-slash" size={11} color={theme.primary} />
                        <Text style={[styles.topicPillText, { color: theme.primary }]}>
                          {topic.exercises.length} Exercises
                        </Text>
                      </View>
                    )}

                    {topic.miniProjects?.length > 0 && (
                      <View
                        style={[
                          styles.topicPill,
                          { backgroundColor: '#FBBF2420' },
                        ]}
                      >
                        <Ionicons name="sparkles" size={11} color="#FBBF24" />
                        <Text style={[styles.topicPillText, { color: '#FBBF24' }]}>
                          Mini Project
                        </Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <EmptyState
            icon="filter-outline"
            title="No topics match this filter"
            description={`No ${selectedLevel} topics found in the ${activeRoadmap?.name} roadmap.`}
            actionTitle="Show All Levels"
            onAction={() => setSelectedLevel('All')}
          />
        )}
      </ScreenContainer>

      {/* Topic Curriculum & Code Example Modal */}
      <TopicDetailModal
        visible={!!selectedTopic}
        topic={selectedTopic || undefined}
        languageName={activeRoadmap?.name}
        languageColor={activeRoadmap?.color}
        isDark={isDark}
        onClose={() => setSelectedTopic(null)}
        onToggleCompleted={async () => {
          if (selectedTopic && activeRoadmap) {
            await toggleTopicCompleted(activeRoadmap.id, selectedTopic.id);
            setSelectedTopic(null);
          }
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  topicsCompletedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  topicsCompletedText: {
    fontSize: 12,
    fontWeight: '700',
  },
  langSelectorContainer: {
    marginHorizontal: -20,
  },
  langScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  langTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  langTabText: {
    fontSize: 13,
  },
  miniPercentTag: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  miniPercentText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0F172A',
  },
  roadmapHeroCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroIconBadge: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitles: {
    flex: 1,
    gap: 2,
  },
  heroName: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  heroDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  heroProgressSection: {
    gap: 6,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressNumber: {
    fontSize: 14,
    fontWeight: '800',
  },
  nextLessonBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  nextLessonSub: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nextLessonTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  levelFilterRow: {
    flexDirection: 'row',
    gap: 6,
  },
  lvlFilterChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  lvlFilterText: {
    fontSize: 11,
  },
  topicsGrid: {
    gap: 10,
  },
  topicCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  topicCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topicIndexBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  topicIndexText: {
    fontSize: 11,
    fontWeight: '700',
  },
  levelTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  levelTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  topicCheckBtn: {
    padding: 2,
  },
  topicTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  topicDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  topicBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  topicPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  topicPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
