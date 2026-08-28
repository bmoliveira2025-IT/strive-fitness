import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, ListRenderItem, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WorkoutRecordCard } from '../components/dashboard/WorkoutRecordCard';
import { EmptyState } from '../components/feedback/EmptyState';
import { useTheme } from '../context/ThemeContext';
import { WorkoutHistoryRecord, useWorkoutHistory } from '../context/WorkoutHistoryContext';

const PAGE_SIZE = 6;

export default function ActivitiesScreen() {
    const { theme } = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { history } = useWorkoutHistory();
    const [displayLimit, setDisplayLimit] = useState(PAGE_SIZE);

    const workoutRecords = useMemo(
        () => history.filter(item => item.exercises && item.exercises.length > 0),
        [history]
    );

    const visibleRecords = useMemo(
        () => workoutRecords.slice(0, displayLimit),
        [workoutRecords, displayLimit]
    );

    const hasMore = displayLimit < workoutRecords.length;

    const handleLoadMore = useCallback(() => {
        if (displayLimit < workoutRecords.length) {
            setDisplayLimit(prev => Math.min(prev + PAGE_SIZE, workoutRecords.length));
        }
    }, [displayLimit, workoutRecords.length]);

    const renderWorkout: ListRenderItem<WorkoutHistoryRecord> = useCallback(
        ({ item, index }) => <WorkoutRecordCard item={item} index={index} />,
        []
    );

    const renderEmpty = useCallback(() => (
        <EmptyState
            icon="barbell-outline"
            title="Nenhuma atividade ainda"
            description="Complete seu primeiro treino para acompanhar seu histórico e estatísticas completas aqui."
            actionLabel="Iniciar Treino"
            onAction={() => router.push('/(tabs)/workout')}
            style={{ paddingVertical: 60 }}
        />
    ), [router]);

    const renderFooter = useCallback(() => {
        if (!hasMore) return null;
        return (
            <View style={{ paddingVertical: 16, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
        );
    }, [hasMore, theme.colors.primary]);

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <StatusBar style={theme.mode === 'light' ? 'dark' : 'light'} />

            {/* Header */}
            <Animated.View
                entering={FadeInUp.duration(400)}
                style={{
                    backgroundColor: theme.colors.background,
                    paddingTop: insets.top + 12,
                    paddingBottom: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.border
                }}
            >
                <View className="flex-row items-center justify-between px-6">
                    <View className="flex-row items-center">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            activeOpacity={0.7}
                            style={{
                                backgroundColor: theme.colors.card,
                                width: 42,
                                height: 42,
                                borderRadius: 14,
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderColor: theme.colors.cardBorder,
                                borderWidth: 1
                            }}
                        >
                            <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
                        </TouchableOpacity>
                        <View className="ml-4">
                            <Text style={{ color: theme.colors.text, fontFamily: 'Sora_800ExtraBold', fontSize: 20, letterSpacing: -0.4 }}>
                                ATIVIDADES
                            </Text>
                            <Text style={{ color: theme.colors.textMuted, fontFamily: 'Inter_500Medium', fontSize: 11 }}>
                                {workoutRecords.length} {workoutRecords.length === 1 ? 'treino registrado' : 'treinos registrados'}
                            </Text>
                        </View>
                    </View>
                </View>
            </Animated.View>

            {/* Progressive Paginated List */}
            <FlatList
                style={{ flex: 1 }}
                data={visibleRecords}
                renderItem={renderWorkout}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={renderEmpty}
                ListFooterComponent={renderFooter}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.4}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: insets.bottom + 40, paddingTop: 16 }}
                initialNumToRender={4}
                maxToRenderPerBatch={4}
                updateCellsBatchingPeriod={40}
                windowSize={4}
                removeClippedSubviews
            />
        </View>
    );
}
