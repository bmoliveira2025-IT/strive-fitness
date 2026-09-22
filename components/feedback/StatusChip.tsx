import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
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

    const getColors = () => {
        switch (type) {
            case 'completed':
                return {
                    bg: theme.colors.successMuted,
                    border: theme.colors.success + '35',
                    text: theme.colors.success,
                    icon: icon || 'checkmark-circle' as const,
                };
            case 'active':
                return {
                    bg: theme.colors.accentMuted,
                    border: theme.colors.primary + '35',
                    text: theme.colors.primary,
                    icon: icon || 'play' as const,
                };
            case 'pending':
                return {
                    bg: theme.colors.warningMuted,
                    border: theme.colors.warning + '35',
                    text: theme.colors.warning,
                    icon: icon || 'time-outline' as const,
                };
            case 'rest':
                return {
                    bg: theme.colors.infoMuted,
                    border: theme.colors.info + '35',
                    text: theme.colors.info,
                    icon: icon || 'bed-outline' as const,
                };
            case 'pr':
                return {
                    bg: theme.colors.warningMuted,
                    border: theme.colors.warning + '35',
                    text: theme.colors.warning,
                    icon: icon || 'trophy' as const,
                };
            case 'trend_up':
                return {
                    bg: theme.colors.successMuted,
                    border: theme.colors.success + '35',
                    text: theme.colors.success,
                    icon: icon || 'trending-up' as const,
                };
            case 'trend_stable':
                return {
                    bg: theme.colors.backgroundSecondary,
                    border: theme.colors.textMuted + '35',
                    text: theme.colors.textMuted,
                    icon: icon || 'arrow-forward' as const,
                };
            case 'trend_down':
                return {
                    bg: theme.colors.errorMuted,
                    border: theme.colors.error + '35',
                    text: theme.colors.error,
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
        fontFamily: "Inter_600SemiBold",
        letterSpacing: -0.2,
    },
});
