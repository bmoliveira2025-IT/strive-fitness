import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { MuscleData, MuscleId, useMuscleTracker } from '../context/MuscleTrackerContext';
import { useTheme } from '../context/ThemeContext';
import { GradientButton } from '../components/ui/GradientButton';

export default function MuscleTrackingScreen() {
    const { theme } = useTheme();
    const router = useRouter();
    const { muscleStats, loading } = useMuscleTracker();
    const [selectedMuscle, setSelectedMuscle] = useState<MuscleData | null>(null);
    const [showModal, setShowModal] = useState(false);

    const handleMusclePress = (id: MuscleId) => {
        const data = muscleStats[id];
        if (data) {
            setSelectedMuscle(data);
            setShowModal(true);
        }
    };

    // Calculate "Focus of the Day"
    const suggestions = useMemo(() => {
        return Object.values(muscleStats)
            .filter(m => m.status === 'undertrained')
            .sort((a, b) => a.score - b.score) // Lowest score first
            .slice(0, 2);
    }, [muscleStats]);

    if (loading) {
        return <View style={{ flex: 1, backgroundColor: 'transparent' }} className="justify-center items-center"><Text style={{ color: theme.colors.text }}>Carregando...</Text></View>;
    }

    return (
        <View style={{ flex: 1, backgroundColor: 'transparent' }}>
            <StatusBar style={theme.mode === 'light' ? 'dark' : 'light'} />

            {/* Premium Header */}
            <Animated.View
                entering={FadeInUp.duration(600)}
                style={{ backgroundColor: 'transparent', paddingTop: 60, paddingBottom: 12 }}
            >
                <View className="flex-row items-center justify-between px-6 mb-2">
                    <View className="flex-row items-center">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            activeOpacity={0.7}
                            style={{ backgroundColor: theme.colors.card, width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderColor: theme.colors.cardBorder, borderWidth: 1 }}
                        >
                            <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
                        </TouchableOpacity>
                        <View className="ml-4">
                            <Text style={{ color: theme.colors.text }} className="text-2xl font-black italic uppercase tracking-tighter">Músculos</Text>
                            <Text style={{ color: theme.colors.textMuted }} className="text-[10px] font-bold uppercase tracking-widest mt-0.5">ESTADO FISIOLÓGICO</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={() => { }}
                        activeOpacity={0.7}
                        style={{ backgroundColor: theme.colors.card, width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderColor: theme.colors.cardBorder, borderWidth: 1 }}
                    >
                        <Ionicons name="information-circle-outline" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                </View>
            </Animated.View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }}>

                {/* 🎯 Focus of the Day Cinematic */}
                <View className="px-6 mb-10 pt-4">
                    <Text style={{ color: theme.colors.text }} className="text-[10px] font-black uppercase tracking-[3px] mb-4 opacity-50 pl-1">FOCO RECOMENDADO</Text>
                    {suggestions.length > 0 ? (
                        <View className="gap-4">
                            {suggestions.map((muscle, idx) => (
                                <Animated.View
                                    key={muscle.id}
                                    entering={FadeInDown.delay(idx * 150 + 200).springify()}
                                >
                                    <TouchableOpacity
                                        onPress={() => handleMusclePress(muscle.id as MuscleId)}
                                        activeOpacity={0.8}
                                        style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder, borderWidth: 1.5 }}
                                        className="p-6 rounded-[32px] shadow-sm overflow-hidden"
                                    >
                                        <LinearGradient
                                            colors={['#EAB30815', 'transparent']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={{ position: 'absolute', inset: 0 }}
                                        />
                                        <View className="flex-row justify-between items-center mb-4">
                                            <View className="flex-row items-center">
                                                <View style={{ backgroundColor: '#EAB30820', width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 15 }}>
                                                    <Ionicons name="flash" size={18} color="#EAB308" />
                                                </View>
                                                <View>
                                                    <Text style={{ color: theme.colors.text }} className="font-black italic text-lg uppercase leading-5">{muscle.name}</Text>
                                                    <View className="flex-row items-center mt-0.5">
                                                        <View className="w-1.5 h-1.5 rounded-full bg-yellow-500 mr-2" />
                                                        <Text className="text-yellow-600 text-[9px] font-black uppercase tracking-widest">Subtreinado</Text>
                                                    </View>
                                                </View>
                                            </View>
                                            <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
                                        </View>
                                        <Text style={{ color: theme.colors.textMuted }} className="text-[11px] font-bold uppercase tracking-tight">
                                            Última sessão: {muscle.lastTrained ? new Date(muscle.lastTrained).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : 'Sem registros'}
                                        </Text>
                                    </TouchableOpacity>
                                </Animated.View>
                            ))}
                        </View>
                    ) : (
                        <View style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder, borderWidth: 1.5 }} className="p-8 rounded-[32px] items-center">
                            <Ionicons name="checkmark-circle" size={32} color="#22C55E" />
                            <Text style={{ color: theme.colors.text }} className="font-black italic uppercase tracking-tight text-center mt-3">Estado Ótimo</Text>
                            <Text style={{ color: theme.colors.textMuted }} className="text-[9px] font-bold uppercase tracking-widest mt-1">TUDO EQUILIBRADO NO MOMENTO</Text>
                        </View>
                    )}
                </View>

                {/* 📊 Detailed Stats List Premium */}
                <View className="px-6">
                    <Text style={{ color: theme.colors.text }} className="text-[10px] font-black uppercase tracking-[3px] mb-4 opacity-50 pl-1">STATUS GERAL</Text>
                    {Object.values(muscleStats).map((muscle, idx) => (
                        <Animated.View
                            key={muscle.id}
                            entering={FadeInDown.delay(idx * 50 + 400).springify()}
                        >
                            <TouchableOpacity
                                onPress={() => handleMusclePress(muscle.id as MuscleId)}
                                activeOpacity={0.8}
                                style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder, borderWidth: 1.5 }}
                                className="p-5 rounded-[28px] mb-4 flex-row justify-between items-center shadow-sm overflow-hidden"
                            >
                                <View className="flex-row items-center">
                                    <View className={`w-1 h-10 rounded-full mr-5 ${muscle.status === 'recovered' ? 'bg-green-500' :
                                        muscle.status === 'undertrained' ? 'bg-yellow-500' :
                                            muscle.status === 'overreaching' ? 'bg-red-500' : 'bg-blue-500'
                                        }`} />
                                    <View>
                                        <Text style={{ color: theme.colors.text }} className="font-black italic uppercase tracking-tight text-base mb-1">{muscle.name}</Text>
                                        <View className="flex-row items-center">
                                            <Ionicons name="layers-outline" size={10} color={theme.colors.textMuted} />
                                            <Text style={{ color: theme.colors.textMuted }} className="text-[9px] font-black uppercase tracking-widest ml-1">{muscle.setsThisWeek} séries por semana</Text>
                                        </View>
                                    </View>
                                </View>
                                <View className="items-end bg-black/5 dark:bg-white/5 px-4 py-2 rounded-2xl border border-black/5 dark:border-white/5">
                                    <Text style={{ color: theme.colors.text }} className="font-black italic text-xl tracking-tighter leading-6">{muscle.score}</Text>
                                    <Text style={{ color: theme.colors.textMuted }} className="text-[8px] font-bold uppercase tracking-widest">Score</Text>
                                </View>
                            </TouchableOpacity>
                        </Animated.View>
                    ))}
                </View>

            </ScrollView>

            {/* Muscle Detail Modal Premium */}
            <Modal
                visible={showModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowModal(false)}
            >
                <View className="flex-1 bg-black/80 justify-end">
                    <TouchableOpacity
                        style={{ flex: 1 }}
                        activeOpacity={1}
                        onPress={() => setShowModal(false)}
                    />
                    <Animated.View
                        entering={FadeInDown.springify()}
                        style={{ backgroundColor: theme.colors.card, borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 32, paddingBottom: 50 }}
                        className="shadow-2xl"
                    >
                        {selectedMuscle && (
                            <>
                                <View className="items-center mb-8">
                                    <View className="w-16 h-1.5 bg-zinc-500/20 rounded-full mb-8" />
                                    <Text style={{ color: theme.colors.text }} className="text-3xl font-black italic uppercase tracking-tighter mb-2">{selectedMuscle.name}</Text>
                                    <View
                                        style={{
                                            backgroundColor: selectedMuscle.status === 'recovered' ? '#22C55E15' :
                                                selectedMuscle.status === 'undertrained' ? '#EAB30815' :
                                                    selectedMuscle.status === 'overreaching' ? '#EF444415' : '#3B82F615',
                                            borderColor: selectedMuscle.status === 'recovered' ? '#22C55E30' :
                                                selectedMuscle.status === 'undertrained' ? '#EAB30830' :
                                                    selectedMuscle.status === 'overreaching' ? '#EF444430' : '#3B82F630',
                                            borderWidth: 1.5
                                        }}
                                        className="px-5 py-2 rounded-2xl"
                                    >
                                        <Text
                                            style={{
                                                color: selectedMuscle.status === 'recovered' ? '#22C55E' :
                                                    selectedMuscle.status === 'undertrained' ? '#EAB308' :
                                                        selectedMuscle.status === 'overreaching' ? '#EF4444' : '#3B82F6'
                                            }}
                                            className="font-black uppercase tracking-widest text-[10px] italic"
                                        >
                                            {selectedMuscle.status === 'recovered' ? 'Volume Ideal ✅' :
                                                selectedMuscle.status === 'undertrained' ? 'Subtreinado ⚠️' :
                                                    selectedMuscle.status === 'overreaching' ? 'Sobrecarga 🚨' : 'Em Recuperação 💤'}
                                        </Text>
                                    </View>
                                </View>

                                {/* Coach Recommendation Cinematic */}
                                <View
                                    style={{ backgroundColor: theme.colors.backgroundTertiary, borderColor: theme.colors.cardBorder, borderWidth: 1 }}
                                    className="p-6 rounded-[32px] mb-8 border-l-[6px] border-l-primary"
                                >
                                    <View className="flex-row items-center mb-2">
                                        <Ionicons name="sparkles" size={14} color={theme.colors.primary} />
                                        <Text style={{ color: theme.colors.primary }} className="text-[10px] font-black uppercase tracking-widest ml-2">Stricia AI Insights</Text>
                                    </View>
                                    <Text style={{ color: theme.colors.text }} className="text-[15px] font-bold leading-6 italic">“{selectedMuscle.recommendation}”</Text>
                                </View>

                                {/* Metrics Grid Premium */}
                                <View className="flex-row flex-wrap justify-between gap-y-4 mb-10">
                                    {[
                                        { label: 'Volume Semanal', val: selectedMuscle.setsThisWeek, target: `/ ${selectedMuscle.weeklyTarget}`, icon: 'stats-chart' },
                                        { label: 'Recuperação', val: `${selectedMuscle.recoveryPercentage}%`, icon: 'fitness' },
                                        { label: 'Último Treino', val: selectedMuscle.lastTrained ? new Date(selectedMuscle.lastTrained).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '--/--', icon: 'calendar' },
                                        { label: 'Elite Score', val: `${selectedMuscle.score}/100`, icon: 'trophy' }
                                    ].map((metric, i) => (
                                        <View
                                            key={i}
                                            style={{ backgroundColor: theme.colors.backgroundTertiary, borderColor: theme.colors.cardBorder, borderWidth: 1 }}
                                            className="w-[48%] p-5 rounded-[24px]"
                                        >
                                            <View className="flex-row items-center mb-2 opacity-50">
                                                <Ionicons name={metric.icon as any} size={10} color={theme.colors.textMuted} />
                                                <Text style={{ color: theme.colors.textMuted }} className="text-[8px] font-black uppercase ml-1.5">{metric.label}</Text>
                                            </View>
                                            <View className="flex-row items-baseline">
                                                <Text style={{ color: theme.colors.text }} className="text-xl font-black italic tracking-tighter">{metric.val}</Text>
                                                {metric.target && <Text style={{ color: theme.colors.textMuted }} className="text-[10px] ml-1 font-bold">{metric.target}</Text>}
                                            </View>
                                        </View>
                                    ))}
                                </View>

                                <GradientButton
                                    onPress={() => setShowModal(false)}
                                    activeOpacity={0.8}
                                    style={{
                                        borderRadius: 24,
                                        shadowColor: '#000',
                                        shadowOffset: { width: 0, height: 4 },
                                        shadowOpacity: 0.1,
                                        shadowRadius: 10,
                                        elevation: 4
                                    }}
                                    gradientStyle={{
                                        width: '100%',
                                        paddingVertical: 20,
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <Text className="text-white font-black uppercase tracking-widest text-[12px]">Confirmar Feedback</Text>
                                </GradientButton>
                            </>
                        )}
                    </Animated.View>
                </View>
            </Modal>
        </View>
    );
}
