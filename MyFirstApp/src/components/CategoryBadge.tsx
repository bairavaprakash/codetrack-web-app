import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CategoryColors, PriorityColors } from '@/constants/colors';

interface CategoryBadgeProps {
  category?: string;
  priority?: string;
  size?: 'small' | 'medium';
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  priority,
  size = 'small',
}) => {
  if (category) {
    const config = CategoryColors[category] || {
      bg: '#94A3B820',
      text: '#94A3B8',
      border: '#94A3B840',
    };
    return (
      <View
        style={[
          styles.badge,
          size === 'small' ? styles.smallBadge : styles.mediumBadge,
          { backgroundColor: config.bg, borderColor: config.border },
        ]}>
        <Text
          style={[
            styles.text,
            size === 'small' ? styles.smallText : styles.mediumText,
            { color: config.text },
          ]}>
          {category}
        </Text>
      </View>
    );
  }

  if (priority) {
    const config = PriorityColors[priority] || {
      bg: '#94A3B820',
      text: '#94A3B8',
      badge: '#64748B',
    };
    return (
      <View
        style={[
          styles.badge,
          size === 'small' ? styles.smallBadge : styles.mediumBadge,
          { backgroundColor: config.bg, borderColor: config.badge + '40' },
        ]}>
        <View style={[styles.priorityDot, { backgroundColor: config.badge }]} />
        <Text
          style={[
            styles.text,
            size === 'small' ? styles.smallText : styles.mediumText,
            { color: config.text },
          ]}>
          {priority}
        </Text>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  smallBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  mediumBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  text: {
    fontWeight: '600',
  },
  smallText: {
    fontSize: 11,
  },
  mediumText: {
    fontSize: 13,
  },
});
