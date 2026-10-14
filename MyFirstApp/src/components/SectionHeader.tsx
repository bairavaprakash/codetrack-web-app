import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { Colors } from '@/constants/colors';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  count?: number;
  actionText?: string;
  onAction?: () => void;
  actionIcon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  count,
  actionText,
  onAction,
  actionIcon,
  style,
}) => {
  const { settings } = useApp();
  const isDark = settings.theme !== 'light';
  const theme = isDark ? Colors.dark : Colors.light;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.titleColumn}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          {count !== undefined && (
            <View
              style={[
                styles.countPill,
                { backgroundColor: theme.primary + '15', borderColor: theme.primary + '30' },
              ]}
            >
              <Text style={[styles.countText, { color: theme.primary }]}>{count}</Text>
            </View>
          )}
        </View>
        {subtitle && (
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
        )}
      </View>

      {actionText && onAction && (
        <Pressable
          style={styles.actionBtn}
          onPress={onAction}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {actionIcon && (
            <Ionicons
              name={actionIcon}
              size={14}
              color={theme.primary}
              style={{ marginRight: 4 }}
            />
          )}
          <Text style={[styles.actionText, { color: theme.primary }]}>
            {actionText}
          </Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  titleColumn: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
  },
  countPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
