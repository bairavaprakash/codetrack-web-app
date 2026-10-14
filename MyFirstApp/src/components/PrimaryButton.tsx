import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { Colors } from '@/constants/colors';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  rightIcon,
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const { settings } = useApp();
  const isDark = settings.theme !== 'light';
  const theme = isDark ? Colors.dark : Colors.light;

  const getBackgroundColor = () => {
    if (variant === 'primary') return theme.primary;
    if (variant === 'secondary') return theme.surfaceElevated;
    if (variant === 'danger') return theme.danger;
    return 'transparent'; // outline
  };

  const getBorderColor = () => {
    if (variant === 'outline') return theme.border;
    if (variant === 'danger') return theme.danger;
    return 'transparent';
  };

  const getTextColor = () => {
    if (variant === 'primary') return '#0F172A';
    if (variant === 'danger') return '#FFFFFF';
    if (variant === 'secondary') return theme.text;
    return theme.text;
  };

  const getPadding = () => {
    if (size === 'sm') return { paddingVertical: 8, paddingHorizontal: 12 };
    if (size === 'lg') return { paddingVertical: 16, paddingHorizontal: 24 };
    return { paddingVertical: 12, paddingHorizontal: 16 };
  };

  const getFontSize = () => {
    if (size === 'sm') return 13;
    if (size === 'lg') return 16;
    return 14;
  };

  const textColor = getTextColor();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        getPadding(),
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outline' ? 1.5 : 0,
          opacity: disabled || loading ? 0.6 : pressed ? 0.85 : 1,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon}
              size={getFontSize() + 2}
              color={textColor}
              style={{ marginRight: 6 }}
            />
          )}
          <Text
            style={[
              styles.text,
              { color: textColor, fontSize: getFontSize() },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {rightIcon && (
            <Ionicons
              name={rightIcon}
              size={getFontSize() + 2}
              color={textColor}
              style={{ marginLeft: 6 }}
            />
          )}
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  text: {
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
