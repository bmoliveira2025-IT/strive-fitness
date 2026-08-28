import React, { memo } from 'react';
import { StyleSheet, Text, View, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { FontFamily } from '../../constants/theme';

export interface MetricDisplayProps {
  value: string | number;
  unit?: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg' | 'display';
  accent?: boolean;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value?: string;
    isPositive?: boolean;
  };
  icon?: keyof typeof Ionicons.glyphMap;
  align?: 'left' | 'center' | 'right';
  style?: ViewStyle;
}

export const MetricDisplay = memo(function MetricDisplay({
  value,
  unit,
  label,
  size = 'md',
  accent = false,
  trend,
  icon,
  align = 'left',
  style,
}: MetricDisplayProps) {
  const { theme } = useTheme();

  const alignmentStyle = {
    alignItems: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
  } as const;

  const fontSizes = {
    sm: { value: 16, unit: 11, label: 10 },
    md: { value: 22, unit: 12, label: 11 },
    lg: { value: 28, unit: 14, label: 12 },
    display: { value: 36, unit: 16, label: 12 },
  }[size];

  const valueColor = accent
    ? theme.colors.primary
    : theme.colors.text;

  return (
    <View style={[styles.container, alignmentStyle, style]}>
      {/* Optional Label / Header */}
      {label && (
        <View style={styles.labelRow}>
          {icon && (
            <Ionicons
              name={icon}
              size={fontSizes.label + 2}
              color={theme.colors.textMuted}
              style={styles.labelIcon}
            />
          )}
          <Text
            style={[
              styles.label,
              { color: theme.colors.textMuted, fontSize: fontSizes.label },
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
        </View>
      )}

      {/* Main Metric Value + Unit Row */}
      <View style={styles.valueRow}>
        <Text
          style={[
            styles.value,
            {
              color: valueColor,
              fontSize: fontSizes.value,
              fontFamily: FontFamily.display,
            },
          ]}
        >
          {value}
        </Text>

        {unit && (
          <Text
            style={[
              styles.unit,
              {
                color: theme.colors.textSecondary,
                fontSize: fontSizes.unit,
                fontFamily: FontFamily.sansMedium,
              },
            ]}
          >
            {unit}
          </Text>
        )}
      </View>

      {/* Optional Trend Indicator */}
      {trend && (
        <View style={styles.trendRow}>
          <Ionicons
            name={
              trend.direction === 'up'
                ? 'arrow-up'
                : trend.direction === 'down'
                ? 'arrow-down'
                : 'remove'
            }
            size={11}
            color={
              trend.isPositive !== undefined
                ? trend.isPositive
                  ? theme.colors.success
                  : theme.colors.error
                : theme.colors.textMuted
            }
          />
          {trend.value && (
            <Text
              style={[
                styles.trendText,
                {
                  color:
                    trend.isPositive !== undefined
                      ? trend.isPositive
                        ? theme.colors.success
                        : theme.colors.error
                      : theme.colors.textMuted,
                },
              ]}
            >
              {trend.value}
            </Text>
          )}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  labelIcon: {
    marginRight: 4,
  },
  label: {
    fontFamily: FontFamily.sansSemiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  unit: {
    marginLeft: 4,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 2,
  },
  trendText: {
    fontSize: 10,
    fontFamily: FontFamily.sansSemiBold,
  },
});
