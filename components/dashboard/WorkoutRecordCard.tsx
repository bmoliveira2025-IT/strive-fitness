import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { memo, useCallback, useMemo } from 'react';
import { Share, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { WorkoutHistoryRecord } from '../../context/WorkoutHistoryContext';

interface WorkoutRecordCardProps {
    item: WorkoutHistoryRecord;
    index?: number;
}

export const WorkoutRecordCard = memo(function WorkoutRecordCard({ item }: WorkoutRecordCardProps) {
    const { theme } = useTheme();

    const handleShare = useCallback(async () => {
        try {
            const exerciseNames = item.exercises?.map(e => e.name).join(', ') || '';
            await Share.share({
                message: `💪 ${item.workoutName}\n\n${exerciseNames}\n\n⏱️ ${Math.floor(item.duration / 60)}min | 🏋️ ${item.totalVolume > 0 ? `${(item.totalVolume / 1000).toFixed(1)}t` : '---'}\n\n#Strive`,
            });
        } catch (error) {
            console.log('Share error:', error);
        }
    }, [item]);

    const { day, month } = useMemo(() => {
        const date = new Date(item.date);
        return {
            day: date.getDate(),
            month: date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase(),
        };
    }, [item.date]);

    const hasMedia = item.media && item.media.length > 0;
    const fallbackImageUrl = item.exercises?.[0]?.image_url;

    // Unified Elite Primary Accent
    const accentColor = theme.colors.primary;

    return (
        <View
            style={{
                backgroundColor: theme.colors.backgroundSecondary,
                borderRadius: 32,
                marginBottom: 20,
                marginHorizontal: 24,
                overflow: 'hidden',
                borderColor: theme.colors.border,
                borderWidth: 1,
            }}
        >
            <TouchableOpacity
                activeOpacity={0.9}
                className="p-5"
            >
                <View className="flex-row items-center justify-between mb-5">
                    <View className="flex-row items-center">
                        <View
                            style={{ backgroundColor: theme.colors.backgroundTertiary, width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor: theme.colors.border }}
                        >
                            <Ionicons name="barbell" size={20} color={accentColor} />
                        </View>
                        <View>
                            <Text style={{ color: theme.colors.text }} className="font-black italic text-base uppercase tracking-tighter leading-none">
                                {item.workoutName}
                            </Text>
                            <Text style={{ color: theme.colors.textMuted }} className="text-[10px] font-black uppercase tracking-widest mt-1.5 opacity-60">
                                {day} {month} • {Math.floor(item.duration / 60)} MIN
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={handleShare}
                        className="w-10 h-10 rounded-2xl items-center justify-center bg-zinc-500/10 border border-zinc-500/10"
                    >
                        <Ionicons name="share-social" size={18} color={theme.colors.text} />
                    </TouchableOpacity>
                </View>

                <View className="flex-row">
                    {/* Media Section - Elite Polish */}
                    <View style={{ width: 110, height: 110, borderRadius: 24, overflow: 'hidden', backgroundColor: theme.colors.backgroundTertiary, borderWidth: 1, borderColor: theme.colors.border }}>
                        {hasMedia && item.media ? (
                            <Image source={{ uri: item.media[0] }} style={{ width: '100%', height: '100%' }} contentFit="cover" cachePolicy="memory-disk" />
                        ) : fallbackImageUrl ? (
                            <View className="p-2 w-full h-full items-center justify-center">
                                <Image
                                    source={{ uri: fallbackImageUrl }}
                                    style={{ width: '85%', height: '85%', opacity: 0.9 }}
                                    contentFit="contain"
                                    cachePolicy="memory-disk"
                                />
                            </View>
                        ) : (
                            <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                                <MaterialCommunityIcons name="arm-flex" size={36} color={theme.colors.textMuted} style={{ opacity: 0.2 }} />
                            </View>
                        )}

                        {item.totalVolume > 0 && (
                            <View
                                style={{ position: 'absolute', top: 8, left: 8, backgroundColor: theme.colors.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}
                            >
                                <Text style={{ color: '#000', fontSize: 8, fontWeight: '900' }}>{(item.totalVolume / 1000).toFixed(1)}T</Text>
                            </View>
                        )}
                    </View>

                    {/* Exercise Focus Section */}
                    <View className="flex-1 ml-5 justify-center">
                        <Text style={{ color: theme.colors.textMuted }} className="text-[9px] font-black uppercase tracking-[2px] mb-3 opacity-60">
                            FOCO DA SESSÃO
                        </Text>
                        <View className="flex-row flex-wrap gap-2">
                            {item.exercises?.slice(0, 3).map((ex, i) => (
                                <View
                                    key={i}
                                    style={{
                                        backgroundColor: theme.colors.backgroundTertiary,
                                        paddingHorizontal: 12,
                                        paddingVertical: 6,
                                        borderRadius: 12,
                                        borderWidth: 1,
                                        borderColor: theme.colors.border
                                    }}
                                >
                                    <Text style={{ color: theme.colors.text, fontSize: 9, fontWeight: '900' }} className="uppercase tracking-wide">{ex.name}</Text>
                                </View>
                            ))}
                        </View>

                        <View className="flex-row items-center mt-5 gap-4">
                            <View className="flex-row items-center">
                                <Ionicons name="flash" size={14} color={accentColor} />
                                <Text style={{ color: theme.colors.text, fontSize: 10, fontWeight: '900', marginLeft: 6 }}>
                                    {item.postWorkoutSurvey?.intensity || 'MODERADO'}
                                </Text>
                            </View>
                            <View style={{ width: 1, height: 12, backgroundColor: theme.colors.border }} />
                            <View className="flex-row items-center">
                                <Ionicons name="heart" size={14} color={theme.colors.error} />
                                <Text style={{ color: theme.colors.text, fontSize: 10, fontWeight: '900', marginLeft: 6 }}>
                                    {item.postWorkoutSurvey?.feeling || 'FENOMENAL'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </View>
    );
});
