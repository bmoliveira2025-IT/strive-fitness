import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';

export type InsightType = 'streak' | 'pr' | 'goal' | 'recovery' | 'tip';

interface SmartInsightCardProps {
    type?: InsightType;
    title: string;
    description: string;
    badgeText?: string;
    actionLabel?: string;
    onPress?: () => void;
    onDismiss?: () => void;
    style?: ViewStyle;
}

export const SmartInsightCard: React.FC<SmartInsightCardProps> = ({
    type = 'streak',
    title,
    description,
    badgeText,
    actionLabel,
    onPress,
    onDismiss,
    style
}) => {
    const { theme } = useTheme();
    const isDark = theme.mode === 'dark';

    const getInsightConfig = () => {
        switch (type) {
            case 'pr':
                return {
                    icon: 'trophy' as const,
                    iconColor: theme.colors.warning,
                    accentBg: isDark ? '#2B230B' : '#FEFCE8',
                    border: isDark ? theme.colors.warning + '40' : '#FDE047',
                };
            case 'goal':
                return {
                    icon: 'flag' as const,
                    iconColor: theme.colors.info,
                    accentBg: isDark ? '#0F2442' : '#EFF6FF',
                    border: isDark ? theme.colors.info + '40' : '#BFDBFE',
                };
            case 'recovery':
                return {
                    icon: 'fitness' as const,
                    iconColor: theme.colors.success,
                    accentBg: isDark ? '#0C281E' : '#ECFDF5',
                    border: isDark ? theme.colors.success + '40' : '#A7F3D0',
                };
            case 'tip':
                return {
                    icon: 'bulb' as const,
                    iconColor: theme.colors.primary,
                    accentBg: isDark ? '#1F1B2E' : '#F5F3FF',
                    border: isDark ? theme.colors.primary + '40' : '#DDD6FE',
                };
            default: // streak
                return {
                    icon: 'flame' as const,
                    iconColor: theme.colors.warning,
                    accentBg: isDark ? '#2E190E' : '#FFF7ED',
                    border: isDark ? theme.colors.warning + '40' : '#FFEDD5',
                };
        }
    };

    const config = getInsightConfig();

    return (
        <TouchableOpacity
            activeOpacity={onPress ? 0.85 : 1}
            onPress={onPress}
            style={[
                styles.container,
                {
                    backgroundColor: config.accentBg,
                    borderColor: config.border,
                },
                style
            ]}
        >
            <View style={styles.headerRow}>
                <View style={styles.iconTitleRow}>
                    <Ionicons name={config.icon} size={18} color={config.iconColor} style={{ marginRight: 8 }} />
                    <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
                        {title}
                    </Text>
                </View>
                {badgeText ? (
                    <View style={[styles.badge, { backgroundColor: config.iconColor + '20', borderColor: config.iconColor + '40' }]}>
                        <Text style={[styles.badgeText, { color: config.iconColor }]}>
                            {badgeText}
                        </Text>
                    </View>
                ) : onDismiss ? (
                    <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="close" size={16} color={theme.colors.textMuted} />
                    </TouchableOpacity>
                ) : null}
            </View>

            <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
                {description}
            </Text>

            {actionLabel && (
                <View style={styles.actionRow}>
                    <Text style={[styles.actionLabel, { color: config.iconColor }]}>
                        {actionLabel}
                    </Text>
                    <Ionicons name="arrow-forward" size={14} color={config.iconColor} style={{ marginLeft: 4 }} />
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 18,
        borderWidth: 1,
        padding: 16,
        marginVertical: 6,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    iconTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    title: {
        fontFamily: "Inter_700Bold",
        fontSize: 14,
        letterSpacing: -0.2,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 999,
        borderWidth: 1,
    },
    badgeText: {
        fontFamily: "Inter_600SemiBold",
        fontSize: 11,
    },
    description: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
        lineHeight: 18.5,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    actionLabel: {
        fontFamily: "Inter_600SemiBold",
        fontSize: 12.5,
    },
});
