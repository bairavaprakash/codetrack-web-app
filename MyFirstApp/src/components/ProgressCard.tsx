import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { Colors } from '@/constants/colors';
import { ProgressBar } from '@/components/ProgressBar';

interface ProgressCardProps {
  title?: string;
  completionRate: number;
  completedCount: number;
  totalCount: number;
  streakDays?: number;
  subtitle?: string;
  style?: ViewStyle;
}

export const ProgressCard: React.FC<ProgressCardProps> = ({
  title = "Today's Task Progress",
  completionRate,
  completedCount,
  totalCount,
  streakDays,
  subtitle,
  style,
}) => {
  const { settings } = useApp();
  const isDark = settings.theme !== 'light';
  const theme = isDark ? Colors.dark : Colors.light;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
        style,
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {subtitle || `${completedCount} of ${totalCount} completed`}
          </Text>
        </View>

        {streakDays !== undefined && (
          <View style={[styles.streakBadge, { backgroundColor: '#F59E0B20', borderColor: '#F59E0B50' }]}>
            <Ionicons name="flame" size={16} color="#F59E0B" />
            <Text style={[styles.streakText, { color: '#F59E0B' }]}>
              {streakDays}d Streak
            </Text>
          </View>
        )}
      </View>

      <View style={styles.progressRow}>
        <View style={styles.barWrapper}>
          <ProgressBar
            progress={completionRate}
            height={10}
            color={completionRate === 100 ? theme.success : theme.primary}
          />
        </View>
        <Text style={[styles.percentage, { color: theme.primary }]}>
          {completionRate}%
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  barWrapper: {
    flex: 1,
  },
  percentage: {
    fontSize: 16,
    fontWeight: '800',
    minWidth: 44,
    textAlign: 'right',
  },
});
