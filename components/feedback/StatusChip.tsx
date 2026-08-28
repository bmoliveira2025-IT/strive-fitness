import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

export type StatusType = 'completed' | 'active' | 'pending' | 'rest' | 'pr' | 'trend_up' | 'trend_stable' | 'trend_down' | 'neutral';

interface StatusChipProps {
    type?: StatusType;
    label: string;
    icon?: keyof typeof Ionicons.glyphMap;
    size?: 'sm' | 'md';
    style?: ViewStyle;
}

export const StatusChip: React.FC<StatusChipProps> = ({
    type = 'neutral',
    label,
    icon,
    size = 'md',
    style
}) => {
    const { theme } = useTheme();
    const isDark = theme.mode === 'dark';

    const getColors = () => {
        switch (type) {
            case 'completed':
                return {
                    bg: isDark ? '#0C281E' : '#ECFDF5',
                    border: isDark ? '#10B98150' : '#A7F3D0',
                    text: isDark ? '#34D399' : '#059669',
                    icon: icon || 'checkmark-circle' as const,
                };
            case 'active':
                return {
                    bg: isDark ? '#0F2442' : '#EFF6FF',
                    border: isDark ? '#3B82F650' : '#BFDBFE',
                    text: isDark ? '#60A5FA' : '#2563EB',
                    icon: icon || 'play' as const,
                };
            case 'pending':
                return {
                    bg: isDark ? '#2B1E0C' : '#FFFBEB',
                    border: isDark ? '#F59E0B50' : '#FDE68A',
                    text: isDark ? '#FBBF24' : '#D97706',
                    icon: icon || 'time-outline' as const,
                };
            case 'rest':
                return {
                    bg: isDark ? '#1F1B2E' : '#F5F3FF',
                    border: isDark ? '#8B5CF650' : '#DDD6FE',
                    text: isDark ? '#A78BFA' : '#7C3AED',
                    icon: icon || 'bed-outline' as const,
                };
            case 'pr':
                return {
                    bg: isDark ? '#261F0B' : '#FEFCE8',
                    border: isDark ? '#EAB30880' : '#FDE047',
                    text: isDark ? '#FACC15' : '#CA8A04',
                    icon: icon || 'trophy' as const,
                };
            case 'trend_up':
                return {
                    bg: isDark ? '#0C281E' : '#ECFDF5',
                    border: isDark ? '#10B98140' : '#A7F3D0',
                    text: isDark ? '#34D399' : '#059669',
                    icon: icon || 'trending-up' as const,
                };
            case 'trend_stable':
                return {
                    bg: isDark ? '#1E2430' : '#F1F5F9',
                    border: isDark ? '#64748B40' : '#CBD5E1',
                    text: isDark ? '#94A3B8' : '#64748B',
                    icon: icon || 'arrow-forward' as const,
                };
            case 'trend_down':
                return {
                    bg: isDark ? '#2C1214' : '#FEF2F2',
                    border: isDark ? '#EF444440' : '#FECACA',
                    text: isDark ? '#F87171' : '#DC2626',
                    icon: icon || 'trending-down' as const,
                };
            default:
                return {
                    bg: theme.colors.backgroundSecondary,
                    border: theme.colors.cardBorder,
                    text: theme.colors.textSecondary,
                    icon: icon || 'information-circle-outline' as const,
                };
        }
    };

    const config = getColors();
    const isSm = size === 'sm';

    return (
        <View
            style={[
                styles.chip,
                {
                    backgroundColor: config.bg,
                    borderColor: config.border,
                    paddingHorizontal: isSm ? 8 : 10,
                    paddingVertical: isSm ? 3 : 5,
                },
                style
            ]}
        >
            {config.icon ? (
                <Ionicons
                    name={config.icon as any}
                    size={isSm ? 11 : 13}
                    color={config.text}
                    style={{ marginRight: 4 }}
                />
            ) : null}
            <Text
                style={[
                    styles.label,
                    {
                        color: config.text,
                        fontSize: isSm ? 10.5 : 12,
                    }
                ]}
            >
                {label}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 999,
        borderWidth: 1,
        alignSelf: 'flex-start',
    },
    label: {
        fontFamily: 'Sora_600SemiBold',
        letterSpacing: -0.2,
    },
});
