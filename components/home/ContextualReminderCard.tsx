import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { FontFamily, Radius, Spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useUserStore } from '../../store/useUserStore';

interface ContextualReminderCardProps {
    streak: number;
    weekCount: number;
}

export function ContextualReminderCard({ streak, weekCount }: ContextualReminderCardProps) {
    const { theme } = useTheme();
    const router = useRouter();
    const { profile } = useUserStore();
    const [isDismissed, setIsDismissed] = useState(false);

    // Compute dynamic contextual reminder based on current user context
    const reminder = useMemo(() => {
        const targetDays = 4; // default target per week

        if (streak > 0 && streak % 5 === 4) {
            return {
                icon: 'flame',
                iconColor: '#F59E0B',
                tag: 'RECORDE DE STREAK',
                title: `Falta 1 dia para bater ${streak + 1} dias seguidos!`,
                subtitle: 'Mantenha o foco hoje para estender sua maior sequência de disciplina.',
                actionText: 'Treinar Agora',
                action: () => router.push('/workout'),
            };
        }

        if (weekCount < targetDays) {
            const remaining = targetDays - weekCount;
            return {
                icon: 'trophy',
                iconColor: theme.colors.primary,
                tag: 'META SEMANAL',
                title: `Faltam ${remaining} ${remaining === 1 ? 'treino' : 'treinos'} para bater sua meta semanal!`,
                subtitle: `Você já completou ${weekCount} de ${targetDays} treinos. Cada repetição conta.`,
                actionText: 'Iniciar Treino',
                action: () => router.push('/workout'),
            };
        }

        if (weekCount >= targetDays) {
            return {
                icon: 'checkmark-circle',
                iconColor: '#10B981',
                tag: 'META ATINGIDA',
                title: 'Parabéns! Meta da semana concluída 🎉',
                subtitle: 'Continue acumulando volume ou aproveite para focar em recuperação e cardio.',
                actionText: 'Ver Progresso',
                action: () => router.push('/progress'),
            };
        }

        return {
            icon: 'barbell',
            iconColor: theme.colors.primary,
            tag: 'LEMBRETE DO COACH',
            title: 'Hora de acelerar os resultados!',
            subtitle: 'Treinar com regularidade é o segredo da consistência muscular.',
            actionText: 'Bora Treinar',
            action: () => router.push('/workout'),
        };
    }, [streak, weekCount, theme.colors.primary, router]);

    if (isDismissed) return null;

    return (
        <Animated.View
            entering={FadeInDown.duration(400)}
            exiting={FadeOutUp.duration(300)}
            style={{
                marginHorizontal: 20,
                marginBottom: 18,
                borderRadius: Radius.lg,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                backgroundColor: theme.mode === 'dark' ? '#13171D' : '#FFFFFF',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: theme.mode === 'dark' ? 0.3 : 0.05,
                shadowRadius: 10,
                elevation: 3,
            }}
        >
            <LinearGradient
                colors={
                    theme.mode === 'dark'
                        ? ['rgba(255, 255, 255, 0.03)', 'rgba(0, 0, 0, 0.2)']
                        : ['rgba(240, 245, 255, 0.6)', 'rgba(255, 255, 255, 0.9)']
                }
                style={{ padding: 16 }}
            >
                {/* Header tag + Dismiss */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View
                            style={{
                                width: 26,
                                height: 26,
                                borderRadius: 13,
                                backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Ionicons name={reminder.icon as any} size={14} color={reminder.iconColor} />
                        </View>
                        <Text
                            style={{
                                color: reminder.iconColor,
                                fontSize: 10,
                                fontFamily: FontFamily.sansBold,
                                letterSpacing: 0.8,
                                textTransform: 'uppercase',
                            }}
                        >
                            {reminder.tag}
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={() => setIsDismissed(true)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        style={{ opacity: 0.6 }}
                    >
                        <Ionicons name="close" size={16} color={theme.colors.textMuted} />
                    </TouchableOpacity>
                </View>

                {/* Content */}
                <Text
                    style={{
                        color: theme.colors.text,
                        fontSize: 15,
                        fontFamily: FontFamily.displaySemiBold,
                        letterSpacing: -0.2,
                        marginBottom: 4,
                    }}
                >
                    {reminder.title}
                </Text>

                <Text
                    style={{
                        color: theme.colors.textSecondary,
                        fontSize: 12,
                        fontFamily: FontFamily.sans,
                        lineHeight: 18,
                        marginBottom: 14,
                    }}
                >
                    {reminder.subtitle}
                </Text>

                {/* Action button */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={reminder.action}
                    style={{
                        backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                        borderColor: theme.colors.border,
                        borderWidth: 1,
                        borderRadius: Radius.md,
                        paddingVertical: 9,
                        paddingHorizontal: 14,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <Text
                        style={{
                            color: theme.colors.text,
                            fontSize: 12,
                            fontFamily: FontFamily.sansSemiBold,
                        }}
                    >
                        {reminder.actionText}
                    </Text>
                    <Ionicons name="arrow-forward" size={14} color={theme.colors.primary} />
                </TouchableOpacity>
            </LinearGradient>
        </Animated.View>
    );
}
