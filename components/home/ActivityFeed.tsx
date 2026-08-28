import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { FontFamily, Radius } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useWorkoutHistory } from '../../context/WorkoutHistoryContext';
import { WorkoutRecordCard } from '../dashboard/WorkoutRecordCard';

const PAGE_BATCH = 3;

export function ActivityFeed() {
    const { theme } = useTheme();
    const router = useRouter();
    const { history } = useWorkoutHistory();
    const [visibleCount, setVisibleCount] = useState(PAGE_BATCH);

    const validHistory = history.filter(item => item.exercises && item.exercises.length > 0);
    const feedItems = validHistory.slice(0, visibleCount);
    const hasMore = visibleCount < validHistory.length;

    const handleLoadMore = () => {
        setVisibleCount(prev => Math.min(prev + PAGE_BATCH, validHistory.length));
    };

    if (validHistory.length === 0) {
        return (
            <Animated.View
                entering={FadeInDown.duration(600).springify()}
                style={{
                    marginHorizontal: 16,
                    marginBottom: 24,
                    padding: 20,
                    borderRadius: Radius.lg,
                    backgroundColor: theme.mode === 'dark' ? '#13171D' : '#FFFFFF',
                    borderWidth: 1,
                    borderColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.06)',
                    alignItems: 'center',
                }}
            >
                <View style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: theme.mode === 'dark' ? 'rgba(183, 245, 42, 0.12)' : 'rgba(77, 124, 15, 0.1)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10,
                }}>
                    <Ionicons name="barbell-outline" size={22} color={theme.colors.primary} />
                </View>
                <Text style={{
                    color: theme.colors.text,
                    fontSize: 15,
                    fontFamily: FontFamily.display,
                    fontWeight: '700',
                    marginBottom: 4,
                }}>
                    Seu Histórico de Atividades
                </Text>
                <Text style={{
                    color: theme.colors.textMuted,
                    fontSize: 12,
                    textAlign: 'center',
                    lineHeight: 16,
                    fontFamily: FontFamily.sans,
                    marginBottom: 14,
                }}>
                    Conclua seu primeiro treino para acompanhar métricas de volume, tempo e recordes aqui.
                </Text>
                <TouchableOpacity
                    onPress={() => router.push('/workout')}
                    activeOpacity={0.85}
                    style={{
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: Radius.full,
                        backgroundColor: theme.colors.primary,
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}
                >
                    <Ionicons name="play" size={14} color={theme.colors.onPrimary} style={{ marginRight: 6 }} />
                    <Text style={{ color: theme.colors.onPrimary, fontSize: 12, fontFamily: FontFamily.sansBold }}>
                        Explorar Treinos
                    </Text>
                </TouchableOpacity>
            </Animated.View>
        );
    }

    return (
        <View style={{ marginBottom: 24 }}>
            {/* Header */}
            <Animated.View
                entering={FadeInRight.duration(600).springify()}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 16,
                    marginBottom: 12,
                }}
            >
                <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={{
                        color: theme.colors.text,
                        fontSize: 18,
                        fontFamily: FontFamily.display,
                        fontWeight: '800',
                        letterSpacing: -0.3,
                    }}>
                        Atividades Recentes
                    </Text>
                    <Text style={{
                        color: theme.colors.textMuted,
                        fontSize: 11,
                        fontFamily: FontFamily.sansMedium,
                        marginTop: 1,
                    }}>
                        {validHistory.length} {validHistory.length === 1 ? 'treino concluído' : 'treinos concluídos'}
                    </Text>
                </View>

                <TouchableOpacity
                    onPress={() => router.push('/activities')}
                    activeOpacity={0.7}
                    style={{
                        backgroundColor: theme.colors.backgroundTertiary,
                        borderColor: theme.colors.border,
                        borderWidth: 1,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: Radius.md,
                    }}
                >
                    <Text style={{
                        color: theme.colors.text,
                        fontSize: 11,
                        fontFamily: FontFamily.sansSemiBold,
                    }}>
                        Ver Todas
                    </Text>
                </TouchableOpacity>
            </Animated.View>

            {/* List */}
            <View>
                {feedItems.map((item, index) => (
                    <WorkoutRecordCard key={item.id} item={item} index={index} />
                ))}
            </View>

            {/* Progressive Load Button */}
            {hasMore ? (
                <TouchableOpacity
                    onPress={handleLoadMore}
                    activeOpacity={0.8}
                    style={{
                        marginHorizontal: 16,
                        marginTop: 4,
                        paddingVertical: 12,
                        borderRadius: Radius.md,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: theme.colors.backgroundTertiary,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        flexDirection: 'row',
                    }}
                >
                    <Ionicons name="chevron-down" size={16} color={theme.colors.primary} style={{ marginRight: 6 }} />
                    <Text style={{
                        color: theme.colors.text,
                        fontSize: 12,
                        fontFamily: FontFamily.sansBold,
                    }}>
                        Carregar Mais ({feedItems.length} de {validHistory.length})
                    </Text>
                </TouchableOpacity>
            ) : validHistory.length > PAGE_BATCH ? (
                <TouchableOpacity
                    onPress={() => router.push('/activities')}
                    activeOpacity={0.8}
                    style={{
                        marginHorizontal: 16,
                        marginTop: 4,
                        paddingVertical: 10,
                        alignItems: 'center',
                    }}
                >
                    <Text style={{
                        color: theme.colors.textMuted,
                        fontSize: 11,
                        fontFamily: FontFamily.sansSemiBold,
                    }}>
                        Todas as atividades carregadas • Acessar histórico completo
                    </Text>
                </TouchableOpacity>
            ) : null}
        </View>
    );
}
