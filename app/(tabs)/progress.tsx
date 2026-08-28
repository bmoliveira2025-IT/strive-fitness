// Force refresh
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Share, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProgressExercisesView } from '../../components/ProgressExercisesView';
import { ProgressHistoryView } from '../../components/ProgressHistoryView';
import { ProgressMeasuresView } from '../../components/ProgressMeasuresView';
import { ProgressOverviewView } from '../../components/ProgressOverviewView';
import { ProgressPhotosView } from '../../components/ProgressPhotosView';
import { useTheme } from '../../context/ThemeContext';
import { useUserStore } from '../../store/useUserStore';
import { useWorkoutHistory } from '../../context/WorkoutHistoryContext';

const RANGE_LABELS = {
    'W': 'Semana',
    'M': 'Mês',
    'T': 'Total'
};

export default function ProgressScreen() {
    const { theme } = useTheme();
    const router = useRouter();
    const params = useLocalSearchParams();
    const { profile, updateProfile } = useUserStore();
    const { history } = useWorkoutHistory();
    const insets = useSafeAreaInsets();

    const [selectedTab, setSelectedTab] = useState<'overview' | 'exercises' | 'measures' | 'photos' | 'history'>('overview');
    const [showWeightModal, setShowWeightModal] = useState(false);
    const [showSectionMenu, setShowSectionMenu] = useState(false);
    const [newWeight, setNewWeight] = useState(profile?.weight?.toString() || '');

    // Overview State Hoisted
    const [selectedRange, setSelectedRange] = useState<'W' | 'M' | 'T'>('M');

    // Sync tab from params if present
    useEffect(() => {
        if (params.tab && ['overview', 'exercises', 'measures', 'photos', 'history'].includes(params.tab as string)) {
            setSelectedTab(params.tab as any);
        }
    }, [params.tab]);

    // Calculate Summary Stats based on range
    const summaryStats = useMemo(() => {
        const now = new Date();
        let start = new Date();

        if (selectedRange === 'W') {
            start.setDate(now.getDate() - 7);
        } else if (selectedRange === 'M') {
            start.setMonth(now.getMonth() - 1);
        } else {
            start = new Date(0); // All time
        }
        start.setHours(0, 0, 0, 0);

        const filtered = history.filter(h => new Date(h.date) >= start);
        const totalWorkouts = filtered.length;
        const totalDurationRaw = filtered.reduce((acc, curr) => acc + (curr.duration || 0), 0);
        const totalVolume = filtered.reduce((acc, curr) => acc + (curr.totalVolume || 0), 0);

        const formatDuration = (seconds: number) => {
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            return h > 0 ? `${h}h ${m}m` : `${m}m`;
        };

        // Average frequency
        let frequency = 0;
        if (selectedRange === 'M') {
            frequency = totalWorkouts / 4.3; // Approx weeks in month
        } else if (selectedRange === 'T' && history.length > 0) {
            const oldest = new Date(history[history.length - 1].date);
            const weeks = Math.max(1, (now.getTime() - oldest.getTime()) / (1000 * 60 * 60 * 24 * 7));
            frequency = totalWorkouts / weeks;
        } else {
            frequency = totalWorkouts; // Just the count if weekly
        }

        return {
            count: totalWorkouts,
            duration: formatDuration(totalDurationRaw),
            frequency: frequency.toFixed(1),
            volume: totalVolume,
            label: RANGE_LABELS[selectedRange]
        };
    }, [history, selectedRange]);

    // Consistency Calculations
    const consistency = useMemo(() => {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const activeDaysThisMonth = new Set(
            history
                .filter(h => new Date(h.date) >= startOfMonth)
                .map(h => new Date(h.date).toISOString().split('T')[0])
        ).size;

        return {
            currentMonthCount: activeDaysThisMonth,
            percentage: Math.round((activeDaysThisMonth / 30) * 100)
        }
    }, [history]);

    const handleUpdateWeight = async () => {
        const weightNum = parseFloat(newWeight);
        if (!isNaN(weightNum)) {
            await updateProfile({ weight: weightNum });
            setShowWeightModal(false);
        }
    };

    const handleShare = async () => {
        try {
            const message = `🚀 Meu Progresso no Strive\n\n` +
                `📅 ${summaryStats.label}: ${summaryStats.count} Treinos\n` +
                `⏱️ Tempo Total: ${summaryStats.duration}\n` +
                `🏋️ Volume: ${Math.round(summaryStats.volume).toLocaleString()}kg\n` +
                `🔥 Consistência: ${consistency.currentMonthCount} dias neste mês\n\n` +
                `#Strive #FitnessJourney #Evolucao`;

            await Share.share({
                message: message,
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const TABS = [
        { id: 'overview', label: 'Dashboard', icon: 'grid' },
        { id: 'exercises', label: 'Cargas', icon: 'barbell' },
        { id: 'history', label: 'Histórico', icon: 'time' },
        { id: 'measures', label: 'Medidas', icon: 'body' },
        { id: 'photos', label: 'Galeria', icon: 'images' },
    ];

    return (
        <View style={{ flex: 1, backgroundColor: 'transparent' }}>
            <StatusBar style={theme.mode === 'light' ? 'dark' : 'light'} />

            {/* Header */}
            <View
                style={{ backgroundColor: 'transparent', paddingTop: insets.top + 12, paddingBottom: 12 }}
            >
                <View className="flex-row items-center justify-between px-6 mb-2">
                    <View className="flex-row items-center flex-1 pr-4">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            activeOpacity={0.7}
                            style={{ backgroundColor: theme.colors.card, width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderColor: theme.colors.cardBorder, borderWidth: 1 }}
                        >
                            <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
                        </TouchableOpacity>
                        <View className="ml-4 flex-1">
                            <Text style={{ color: theme.colors.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.5 }} numberOfLines={1}>Progresso</Text>
                            <Text style={{ color: theme.colors.textSecondary, fontSize: 12, fontWeight: '600', marginTop: 1 }}>Acompanhe sua evolução</Text>
                        </View>
                    </View>

                    {selectedTab === 'overview' && (
                        <TouchableOpacity
                            onPress={handleShare}
                            activeOpacity={0.7}
                            style={{
                                backgroundColor: theme.colors.primary,
                                width: 44,
                                height: 44,
                                borderRadius: 16,
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderWidth: 1,
                                borderColor: theme.colors.primaryDark,
                            }}
                        >
                            <Ionicons name="share-social-outline" size={20} color={theme.colors.onPrimary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Content Area */}
            <View className="flex-1">
                {selectedTab === 'overview' ? (
                    <ProgressOverviewView
                        setShowWeightModal={setShowWeightModal}
                        selectedRange={selectedRange}
                        setSelectedRange={setSelectedRange}
                        summaryStats={summaryStats}
                        consistency={consistency}
                    />
                ) : selectedTab === 'exercises' ? (
                    <ProgressExercisesView />
                ) : selectedTab === 'measures' ? (
                    <ProgressMeasuresView />
                ) : selectedTab === 'history' ? (
                    <ProgressHistoryView />
                ) : selectedTab === 'photos' ? (
                    <ProgressPhotosView />
                ) : null}
            </View>

            {/* Collapsible floating section navigator — stays clear of the main tab bar */}
            <View style={{ position: 'absolute', right: 14, bottom: 124, alignItems: 'flex-end', zIndex: 80 }} pointerEvents="box-none">
                {showSectionMenu && (
                    <View style={{ gap: 9, alignItems: 'flex-end', marginBottom: 10 }}>
                        {[...TABS].reverse().map((tab, index) => {
                            const isActive = selectedTab === tab.id;
                            return (
                                <Animated.View key={tab.id} entering={FadeInDown.delay(index * 35).duration(220)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <View style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder, borderWidth: 1, borderRadius: 12, paddingHorizontal: 11, paddingVertical: 7, shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 8 }}>
                                        <Text style={{ color: isActive ? (theme.mode === 'light' ? theme.colors.primaryDark : theme.colors.primary) : theme.colors.text, fontSize: 11, fontWeight: '800' }}>{tab.label}</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => {
                                            setSelectedTab(tab.id as any);
                                            setShowSectionMenu(false);
                                        }}
                                        activeOpacity={0.78}
                                        style={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: 16,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: isActive ? theme.colors.primary : theme.colors.card,
                                            borderColor: isActive ? theme.colors.primaryDark : theme.colors.cardBorder,
                                            borderWidth: 1,
                                            shadowColor: '#000',
                                            shadowOffset: { width: 0, height: 6 },
                                            shadowOpacity: 0.2,
                                            shadowRadius: 10,
                                            elevation: 7,
                                        }}
                                    >
                                        <Ionicons name={(isActive ? tab.icon : `${tab.icon}-outline`) as any} size={21} color={isActive ? theme.colors.onPrimary : theme.colors.textSecondary} />
                                    </TouchableOpacity>
                                </Animated.View>
                            );
                        })}
                    </View>
                )}

                <TouchableOpacity
                    onPress={() => setShowSectionMenu(value => !value)}
                    activeOpacity={0.8}
                    accessibilityLabel={showSectionMenu ? 'Fechar menu de progresso' : 'Abrir menu de progresso'}
                    style={{
                        width: 54,
                        height: 54,
                        borderRadius: 18,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: theme.mode === 'light' ? '#1D251A' : theme.colors.primary,
                        borderColor: theme.mode === 'light' ? '#34402F' : theme.colors.primaryDark,
                        borderWidth: 1,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 8 },
                        shadowOpacity: 0.28,
                        shadowRadius: 12,
                        elevation: 10,
                    }}
                >
                    <Ionicons
                        name={showSectionMenu ? 'close' : (TABS.find(tab => tab.id === selectedTab)?.icon as any || 'grid')}
                        size={23}
                        color={theme.mode === 'light' ? theme.colors.primaryLight : theme.colors.onPrimary}
                    />
                </TouchableOpacity>
            </View>

            {/* Premium Weight Modal */}
            <Modal
                visible={showWeightModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowWeightModal(false)}
            >
                <View className="flex-1 bg-black/80 justify-center items-center px-6">
                    <Animated.View
                        entering={FadeInDown.springify()}
                        style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder, borderWidth: 1.5, borderRadius: 36, padding: 32, width: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.3, shadowRadius: 30 }}
                    >
                        <Text style={{ color: theme.colors.text, paddingRight: 8 }} className="text-2xl font-black italic uppercase tracking-tighter mb-6">Atualizar Peso</Text>

                        <View style={{ backgroundColor: theme.colors.backgroundTertiary, borderRadius: 28, padding: 24, borderWidth: 1, borderColor: theme.colors.cardBorder }} className="mb-8">
                            <Text style={{ color: theme.colors.textSecondary }} className="text-[10px] font-black uppercase tracking-widest mb-4">PESO ATUAL (KG)</Text>
                            <View className="flex-row items-center">
                                <View style={{ backgroundColor: theme.colors.primary + '20', width: 56, height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 20 }}>
                                    <Ionicons name="scale" size={28} color={theme.colors.primary} />
                                </View>
                                <View className="flex-1">
                                    <TextInput
                                        style={{
                                            color: theme.colors.text,
                                            fontSize: 32,
                                            fontWeight: '900',
                                        }}
                                        value={newWeight}
                                        onChangeText={setNewWeight}
                                        placeholder="00.0"
                                        keyboardType="numeric"
                                        placeholderTextColor={theme.colors.textMuted}
                                        autoFocus
                                    />
                                </View>
                                <Text style={{ color: theme.colors.textSecondary }} className="text-xl font-black italic uppercase">KG</Text>
                            </View>
                        </View>

                        <View className="flex-row gap-4">
                            <TouchableOpacity
                                onPress={() => setShowWeightModal(false)}
                                activeOpacity={0.7}
                                style={{
                                    backgroundColor: theme.colors.backgroundTertiary,
                                    borderColor: theme.colors.cardBorder,
                                    borderWidth: 1,
                                    borderRadius: 20
                                }}
                                className="flex-1 py-5 items-center"
                            >
                                <Text style={{ color: theme.colors.text }} className="font-black uppercase tracking-widest text-[12px]">Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleUpdateWeight}
                                activeOpacity={0.8}
                                style={{
                                    backgroundColor: theme.colors.primary,
                                    borderRadius: 20
                                }}
                                className="flex-1 py-5 items-center shadow-lg"
                            >
                                <Text className="text-black font-black uppercase tracking-widest text-[12px]">Salvar</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            </Modal>
        </View>
    );
}
