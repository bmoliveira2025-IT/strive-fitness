import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { FontFamily, Radius } from '../../constants/theme';

export function QuickActions() {
    const router = useRouter();
    const { theme } = useTheme();

    const actions = [
        {
            icon: 'add-circle-outline' as const,
            label: 'Criar Ficha',
            description: 'Novo plano',
            onPress: () => router.push({ pathname: '/workout', params: { isCreatingPlan: 'true' } }),
        },
        {
            icon: 'book-outline' as const,
            label: 'Exercícios',
            description: 'Biblioteca',
            onPress: () => router.push({ pathname: '/explore', params: { tab: 'Exercícios', categoryId: '', categoryName: '' } }),
        },
        {
            icon: 'trending-up-outline' as const,
            label: 'Evolução',
            description: 'Métricas & PRs',
            onPress: () => router.push('/progress'),
        },
        {
            icon: 'sparkles-outline' as const,
            label: 'IA Coach',
            description: 'Gerar plano semanal',
            onPress: () => router.push({ pathname: '/workout', params: { tab: 'exercises', openAI: 'true' } }),
        },
    ];

    return (
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
            <Text
                style={{
                    color: theme.colors.textSecondary,
                    fontSize: 12,
                    fontFamily: FontFamily.caption,
                    letterSpacing: 0.8,
                    textTransform: 'uppercase',
                    marginBottom: 12,
                }}
            >
                Ações Rápidas
            </Text>

            {/* 2x2 Grid Layout with spacious horizontal cards */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {actions.map((action, index) => (
                    <TouchableOpacity
                        key={index}
                        activeOpacity={0.75}
                        onPress={action.onPress}
                        style={{
                            width: '48%',
                            flexGrow: 1,
                            backgroundColor: theme.colors.backgroundTertiary,
                            borderRadius: Radius.lg,
                            paddingVertical: 12,
                            paddingHorizontal: 12,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 10,
                        }}
                    >
                        <View
                            style={{
                                width: 38,
                                height: 38,
                                borderRadius: Radius.md,
                                backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Ionicons
                                name={action.icon}
                                size={20}
                                color={theme.colors.primary}
                            />
                        </View>

                        <View style={{ flex: 1 }}>
                            <Text
                                numberOfLines={1}
                                style={{
                                    color: theme.colors.text,
                                    fontSize: 13,
                                    fontFamily: FontFamily.displaySemiBold,
                                    letterSpacing: -0.2,
                                    marginBottom: 2,
                                }}
                            >
                                {action.label}
                            </Text>
                            <Text
                                numberOfLines={1}
                                style={{
                                    color: theme.colors.textMuted,
                                    fontSize: 11,
                                    fontFamily: FontFamily.sans,
                                }}
                            >
                                {action.description}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}
