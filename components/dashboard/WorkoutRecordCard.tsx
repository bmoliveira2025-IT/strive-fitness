import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import React, { memo, useCallback, useMemo } from 'react';
import { Alert, Share, Text, TouchableOpacity, View } from 'react-native';
import { FontFamily, Radius } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { WorkoutHistoryRecord, useWorkoutHistory } from '../../context/WorkoutHistoryContext';

interface WorkoutRecordCardProps {
    item: WorkoutHistoryRecord;
    index?: number;
}

export const WorkoutRecordCard = memo(function WorkoutRecordCard({ item }: WorkoutRecordCardProps) {
    const { theme } = useTheme();
    const { deleteHistoryRecord } = useWorkoutHistory();

    const handleShare = useCallback(async () => {
        try {
            const exerciseNames = item.exercises?.map(e => e.name).join(', ') || '';
            const durationMin = Math.floor(item.duration / 60);
            const durationText = durationMin > 0 ? `${durationMin} min` : '< 1 min';
            await Share.share({
                message: `💪 ${item.workoutName}\n\n${exerciseNames}\n\n⏱️ ${durationText} | 🏋️ ${item.totalVolume > 0 ? `${(item.totalVolume / 1000).toFixed(1)}t` : `${item.totalSeries || 0} séries`}\n\n#Strive`,
            });
        } catch (error) {
            console.log('Share error:', error);
        }
    }, [item]);

    const handleDelete = useCallback(() => {
        Alert.alert(
            'Excluir do Histórico',
            `Deseja remover o registro "${item.workoutName}" das suas atividades?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: () => deleteHistoryRecord(item.id),
                },
            ]
        );
    }, [item, deleteHistoryRecord]);

    const { dateFormatted, durationText } = useMemo(() => {
        const date = new Date(item.date);
        const day = date.getDate();
        const month = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
        const durationMin = Math.floor(item.duration / 60);
        return {
            dateFormatted: `${day} de ${month}`,
            durationText: durationMin > 0 ? `${durationMin} min` : '< 1 min',
        };
    }, [item.date, item.duration]);

    const fallbackImageUrl = item.exercises?.[0]?.image_url;
    const hasMedia = item.media && item.media.length > 0;
    const exerciseCount = item.exercises?.length || 0;
    const seriesCount = item.totalSeries || item.exercises?.reduce((acc, e) => acc + (e.sets?.length || 0), 0) || 0;

    return (
        <View
            style={{
                backgroundColor: theme.mode === 'dark' ? '#14171F' : theme.colors.card,
                borderRadius: Radius.lg,
                marginBottom: 10,
                marginHorizontal: 16,
                padding: 12,
                borderColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.07)' : theme.colors.border,
                borderWidth: 1,
            }}
        >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {/* Thumbnail / Ícone compacto */}
                <View
                    style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        overflow: 'hidden',
                        backgroundColor: theme.mode === 'dark' ? '#1E2330' : theme.colors.backgroundTertiary,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    {hasMedia && item.media ? (
                        <Image
                            source={{ uri: item.media[0] }}
                            style={{ width: '100%', height: '100%' }}
                            contentFit="cover"
                            cachePolicy="memory-disk"
                        />
                    ) : fallbackImageUrl ? (
                        <Image
                            source={{ uri: fallbackImageUrl }}
                            style={{ width: '85%', height: '85%' }}
                            contentFit="contain"
                            cachePolicy="memory-disk"
                        />
                    ) : (
                        <Ionicons name="barbell" size={20} color={theme.colors.primary} />
                    )}
                </View>

                {/* Informações Principais */}
                <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                        numberOfLines={1}
                        style={{
                            color: theme.colors.text,
                            fontSize: 14,
                            fontFamily: FontFamily.display,
                            fontWeight: '700',
                            marginBottom: 2,
                        }}
                    >
                        {item.workoutName || 'Treino Concluído'}
                    </Text>

                    <Text
                        style={{
                            color: theme.colors.textMuted,
                            fontSize: 11,
                            fontFamily: FontFamily.sansMedium,
                        }}
                    >
                        {dateFormatted} • {durationText}
                        {seriesCount > 0 ? ` • ${seriesCount} séries` : ''}
                    </Text>

                    {/* Resumo de Exercícios ou Volume */}
                    {item.totalVolume > 0 ? (
                        <Text
                            style={{
                                color: theme.colors.primary,
                                fontSize: 10,
                                fontFamily: FontFamily.sansBold,
                                marginTop: 2,
                            }}
                        >
                            {(item.totalVolume / 1000).toFixed(1)}T de volume total
                        </Text>
                    ) : exerciseCount > 0 ? (
                        <Text
                            numberOfLines={1}
                            style={{
                                color: theme.colors.textSecondary,
                                fontSize: 10,
                                fontFamily: FontFamily.sans,
                                marginTop: 2,
                            }}
                        >
                            {item.exercises.slice(0, 2).map(e => e.name).join(', ')}
                            {exerciseCount > 2 ? ` +${exerciseCount - 2}` : ''}
                        </Text>
                    ) : null}
                </View>

                {/* Ações Rápidas (Share e Delete) */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <TouchableOpacity
                        onPress={handleShare}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                        }}
                    >
                        <Ionicons name="share-social-outline" size={15} color={theme.colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleDelete}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.08)',
                        }}
                    >
                        <Ionicons name="trash-outline" size={15} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
});
