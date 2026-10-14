import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProgressBarProps {
  progress: number; // 0 to 100
  color?: string;
  trackColor?: string;
  height?: number;
  showLabel?: boolean;
  label?: string;
  textColor?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color = '#38BDF8',
  trackColor = '#1F2937',
  height = 8,
  showLabel = false,
  label,
  textColor = '#94A3B8',
}) => {
  const clamped = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <View style={styles.container}>
      {(showLabel || label) && (
        <View style={styles.labelRow}>
          {label ? <Text style={[styles.label, { color: textColor }]}>{label}</Text> : <View />}
          <Text style={[styles.percent, { color }]}>{clamped}%</Text>
        </View>
      )}
      <View style={[styles.track, { height, backgroundColor: trackColor, borderRadius: height / 2 }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${clamped}%`,
              backgroundColor: color,
              borderRadius: height / 2,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 4,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
  percent: {
    fontSize: 12,
    fontWeight: '700',
  },
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
