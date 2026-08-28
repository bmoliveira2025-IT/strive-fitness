import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { GradientButton } from '../ui/GradientButton';

interface EmptyStateProps {
    icon?: keyof typeof Ionicons.glyphMap;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon = 'barbell-outline',
    title,
    description,
    actionLabel,
    onAction,
    style
}) => {
    const { theme } = useTheme();

    return (
        <View style={[styles.container, style]}>
            <View
                style={[
                    styles.iconCircle,
                    {
                        backgroundColor: theme.colors.backgroundSecondary,
                        borderColor: theme.colors.cardBorder,
                    }
                ]}
            >
                <Ionicons name={icon} size={36} color={theme.colors.primary} />
            </View>

            <Text style={[styles.title, { color: theme.colors.text }]}>
                {title}
            </Text>

            <Text style={[styles.description, { color: theme.colors.textMuted }]}>
                {description}
            </Text>

            {actionLabel && onAction && (
                <View style={styles.actionWrapper}>
                    <GradientButton
                        variant="primary"
                        onPress={onAction}
                        gradientStyle={{ paddingVertical: 12, paddingHorizontal: 24 }}
                    >
                        <Text style={styles.btnText}>
                            {actionLabel}
                        </Text>
                    </GradientButton>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 28,
        paddingVertical: 40,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        marginBottom: 18,
    },
    title: {
        fontFamily: 'Sora_700Bold',
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: -0.3,
    },
    description: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        lineHeight: 21,
        textAlign: 'center',
        maxWidth: 320,
    },
    actionWrapper: {
        marginTop: 20,
    },
    btnText: {
        fontFamily: 'Sora_600SemiBold',
        fontSize: 14,
        color: '#FFFFFF',
    },
});
