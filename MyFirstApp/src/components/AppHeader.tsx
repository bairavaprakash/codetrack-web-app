import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle, Platform, StatusBar as RNStatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { Colors } from '@/constants/colors';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  onLeftPress?: () => void;
  rightElement?: React.ReactNode;
  style?: ViewStyle;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  leftIcon,
  onLeftPress,
  rightElement,
  style,
}) => {
  const { settings } = useApp();
  const isDark = settings.theme !== 'light';
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  // Status bar safe area handling for Android & iOS
  const topInset = Platform.OS === 'android'
    ? Math.max(RNStatusBar.currentHeight ?? 0, insets.top, 24)
    : Math.max(insets.top, 20);

  return (
    <View
      style={[
        styles.headerWrapper,
        {
          backgroundColor: theme.background,
          paddingTop: topInset + 6,
          borderBottomColor: theme.border,
        },
        style,
      ]}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.headerContent}>
        <View style={styles.leftContainer}>
          {leftIcon && (
            <Pressable
              style={[styles.iconBtn, { backgroundColor: theme.surfaceElevated }]}
              onPress={onLeftPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name={leftIcon} size={20} color={theme.text} />
            </Pressable>
          )}
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
              {title}
            </Text>
            {subtitle && (
              <Text
                style={[styles.subtitle, { color: theme.textSecondary }]}
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            )}
          </View>
        </View>

        {rightElement && <View style={styles.rightContainer}>{rightElement}</View>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerWrapper: {
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    minHeight: 52,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 3,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
