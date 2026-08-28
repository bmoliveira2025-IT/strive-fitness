import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { useUserStore } from '../../store/useUserStore';

export function VitalSignsSummary() {
    const { theme } = useTheme();
    const { profile } = useUserStore();

    const stats = useMemo(() => {
        if (!profile) return null;

        const latestWeight = profile.weight || (profile.weightHistory?.length ? profile.weightHistory[profile.weightHistory.length - 1].value : null);
        const prevWeight = profile.weightHistory && profile.weightHistory.length > 1 ? profile.weightHistory[profile.weightHistory.length - 2].value : null;

        let weightTrend = 0;
        if (latestWeight && prevWeight) {
            weightTrend = latestWeight - prevWeight;
        }

        const latestWeekly = profile.weeklyMonitoring && profile.weeklyMonitoring.length > 0
            ? profile.weeklyMonitoring[profile.weeklyMonitoring.length - 1]
            : null;

        return {
            weight: latestWeight,
            weightTrend,
            sleep: latestWeekly?.sleepQuality || 0,
            energy: latestWeekly?.energyLevel || 0,
            stress: latestWeekly?.stressLevel || 0,
            recovery: latestWeekly?.recoveryLevel || 0
        };
    }, [profile]);

    if (!stats) return null;

    const items = [
        { label: 'Peso', value: stats.weight ? `${stats.weight}kg` : '-', icon: 'scale-outline', color: '#10B981', trend: stats.weightTrend },
        { label: 'Sono', value: stats.sleep ? `${stats.sleep}/5` : '-', icon: 'moon-outline', color: '#8B5CF6' },
        { label: 'Energia', value: stats.energy ? `${stats.energy}/5` : '-', icon: 'flash-outline', color: '#F59E0B' },
        { label: 'Recuperação', value: stats.recovery ? `${stats.recovery}/5` : '-', icon: 'fitness-outline', color: '#3B82F6' },
    ];

    return (
        <View className="mb-12">
            <Animated.View
                entering={FadeInDown.duration(600).springify()}
                className="px-6 mb-6 flex-row items-center justify-between"
            >
                <View style={{ flex: 1, marginRight: 12 }}>
                    <Text numberOfLines={1} style={{ color: theme.colors.text }} className="text-xl font-black tracking-tighter uppercase italic">Sinais Vitais</Text>
                    <Text numberOfLines={1} style={{ color: theme.colors.textMuted }} className="text-[10px] font-bold uppercase tracking-widest mt-0.5">Biometria & Recuperação</Text>
                </View>
                <View style={{ backgroundColor: theme.colors.primary + '15', padding: 8, borderRadius: 12 }}>
                    <Ionicons name="pulse" size={18} color={theme.mode === 'light' ? theme.colors.primaryDark : theme.colors.primary} />
                </View>
            </Animated.View>

            <View
                style={{ paddingHorizontal: 16, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}
                className="overflow-visible"
            >
                {items.map((item, idx) => (
                    <Animated.View
                        key={idx}
                        entering={FadeInRight.delay(idx * 150).duration(800).springify()}
                        style={{
                            backgroundColor: theme.colors.card,
                            borderColor: theme.colors.cardBorder,
                            width: '48.5%',
                            height: 100,
                            shadowColor: theme.colors.shadow,
                            shadowOffset: { width: 0, height: 8 },
                            shadowOpacity: 1,
                            shadowRadius: 12,
                            elevation: 0,
                            borderRadius: 20,
                            borderWidth: 1,
                            padding: 16,
                            justifyContent: 'space-between',
                            overflow: 'hidden',
                            marginBottom: 12
                        }}
                    >
                        {/* Mesh-like Glow Background */}
                        <View style={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, borderRadius: 20, backgroundColor: item.color + '10' }} />

                        <View
                            style={{ backgroundColor: item.color + '15' }}
                            className="w-10 h-10 rounded-2xl items-center justify-center shadow-sm"
                        >
                            <Ionicons name={item.icon as any} size={20} color={item.color} />
                        </View>

                        <View>
                            <Text style={{ color: theme.colors.textMuted }} className="text-[9px] font-black uppercase tracking-wider mb-0.5">{item.label}</Text>
                            <View className="flex-row items-end">
                                <Text style={{ color: theme.colors.text }} className="text-xl font-black tracking-tighter">{item.value}</Text>
                                {item.trend !== undefined && item.trend !== 0 && (
                                    <View
                                        style={{ backgroundColor: (item.trend > 0 ? '#EF4444' : '#10B981') + '15' }}
                                        className="ml-2 px-1 rounded-md flex-row items-center mb-1"
                                    >
                                        <Ionicons
                                            name={item.trend > 0 ? 'arrow-up' : 'arrow-down'}
                                            size={8}
                                            color={item.trend > 0 ? '#EF4444' : '#10B981'}
                                        />
                                    </View>
                                )}
                            </View>
                        </View>
                    </Animated.View>
                ))}
            </View>
        </View>
    );
}
