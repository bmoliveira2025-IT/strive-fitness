import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState } from 'react';
import { Image, Modal, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { PostWorkoutSurvey, useWorkoutHistory } from '../context/WorkoutHistoryContext';
import { GradientButton } from './ui/GradientButton';

interface WorkoutFinishModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (data: {
        workoutName: string;
        notes: string;
        date: Date;
        duration: number;
        updateRoutineValues: boolean;
        shareToStrava: boolean;
        shareToHealthConnect: boolean;
        media: string[];
        postWorkoutSurvey: PostWorkoutSurvey;
    }) => Promise<boolean>;
    defaultWorkoutName?: string;
    duration: number;
}

export function WorkoutFinishModal({
    visible,
    onClose,
    onSave,
    defaultWorkoutName = '',
    duration
}: WorkoutFinishModalProps) {
    const { theme } = useTheme();
    const { history } = useWorkoutHistory();
    const [workoutName, setWorkoutName] = useState(defaultWorkoutName);
    const [notes, setNotes] = useState('');
    const [date] = useState(new Date());
    const [updateRoutineValues, setUpdateRoutineValues] = useState(true);
    const [shareToStrava, setShareToStrava] = useState(false);
    const [shareToHealthConnect, setShareToHealthConnect] = useState(false);
    const [media, setMedia] = useState<string[]>([]);
    const [postWorkoutSurvey, setPostWorkoutSurvey] = useState<PostWorkoutSurvey>({
        intensity: 'moderado',
        completedAllSeries: true,
        discomfort: false,
        feeling: 'satisfeito'
    });
    const [isSaving, setIsSaving] = useState(false);

    // Calculate Streak (Daily)
    const streakDays = useMemo(() => {
        const activeDates = new Set(history.map(h => new Date(h.date).toDateString()));
        const today = new Date();
        activeDates.add(today.toDateString());

        const sortedtimestamps = Array.from(activeDates)
            .map(d => new Date(d).getTime())
            .sort((a, b) => b - a);

        let currentStreak = 0;
        let checkDate = new Date(today).setHours(0, 0, 0, 0);

        while (sortedtimestamps.includes(checkDate)) {
            currentStreak++;
            checkDate -= 86400000;
        }

        return currentStreak;
    }, [history, visible]);

    const handlePickImage = async () => {
        try {
            const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
            if (permissionResult.granted === false) {
                alert("É necessário permitir o acesso à câmera para registrar seu treino!");
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 5],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0].uri) {
                setMedia([result.assets[0].uri]);
            }
        } catch (error) {
            console.log("Error launching camera:", error);
        }
    };

    const handleSave = async () => {
        if (isSaving) return;
        setIsSaving(true);
        const saved = await onSave({
            workoutName,
            notes,
            date,
            duration,
            updateRoutineValues,
            shareToStrava,
            shareToHealthConnect,
            media,
            postWorkoutSurvey
        });
        setIsSaving(false);
        if (saved) onClose();
    };

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}min`;
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            onRequestClose={() => { if (!isSaving) onClose(); }}
        >
            <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
                {/* Header with Gradient Background */}
                <View className="relative overflow-hidden">
                    <LinearGradient
                        colors={theme.mode === 'dark' ? ['#1e293b', '#0f172a'] : ['#f1f5f9', '#ffffff']}
                        style={{ paddingTop: 48, paddingBottom: 24, paddingHorizontal: 20 }}
                    >
                        <View className="flex-row items-center justify-between">
                            <TouchableOpacity
                                onPress={() => { if (!isSaving) onClose(); }}
                                disabled={isSaving}
                                style={{ backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }}
                                className="w-10 h-10 items-center justify-center rounded-full"
                            >
                                <Ionicons name="close" size={24} color={theme.colors.text} />
                            </TouchableOpacity>
                            <Text style={{ color: theme.colors.text }} className="text-xl font-black">Finalizar Treino</Text>
                            <GradientButton
                                onPress={handleSave}
                                style={{
                                    borderRadius: 9999,
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.3,
                                    shadowRadius: 8,
                                    elevation: 5
                                }}
                                gradientStyle={{
                                    paddingHorizontal: 20,
                                    paddingVertical: 8,
                                }}
                            >
                                <Text className="text-white font-black text-sm uppercase">{isSaving ? 'Salvando…' : 'Salvar'}</Text>
                            </GradientButton>
                        </View>
                    </LinearGradient>
                </View>

                <ScrollView
                    className="flex-1 px-5 pt-4"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 40 }}
                >
                    {/* Streak Celebration Hero Card */}
                    <Animated.View
                        entering={ZoomIn.duration(600)}
                        className="mb-8 relative"
                    >
                        <View style={{ shadowColor: '#FF5F6D', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8 }}>
                            <LinearGradient
                                colors={['#FF5F6D', '#FFC371']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={{ borderRadius: 20, padding: 32, alignItems: 'center', justifyContent: 'center' }}
                            >
                                <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }} className="p-4 rounded-full mb-4">
                                    <Ionicons name="flame" size={48} color="white" />
                                </View>
                                <Text className="text-white text-base font-black uppercase tracking-[4px] mb-1">
                                    VOCÊ CONCLUIU!
                                </Text>
                                <View className="flex-row items-end">
                                    <Text className="text-white text-7xl font-black">{streakDays}</Text>
                                    <Text className="text-white text-2xl font-black mb-2 ml-1">DIAS</Text>
                                </View>
                                <Text style={{ color: 'rgba(255, 255, 255, 0.8)' }} className="text-sm font-bold mt-1">de consistência e esforço.</Text>
                            </LinearGradient>
                        </View>
                    </Animated.View>

                    {/* Quick Stats Summary */}
                    <View className="flex-row gap-3 mb-8">
                        <View style={{ backgroundColor: theme.colors.card, borderRadius: 20 }} className="flex-1 p-4 items-center border border-zinc-500/10 shadow-sm">
                            <Ionicons name="time" size={20} color={theme.colors.primary} />
                            <Text style={{ color: theme.colors.text }} className="text-lg font-black mt-1">{formatDuration(duration)}</Text>
                            <Text style={{ color: theme.colors.textMuted }} className="text-[10px] uppercase font-bold">Duração</Text>
                        </View>
                        <View style={{ backgroundColor: theme.colors.card, borderRadius: 20 }} className="flex-1 p-4 items-center border border-zinc-500/10 shadow-sm">
                            <Ionicons name="calendar" size={20} color="#8B5CF6" />
                            <Text style={{ color: theme.colors.text }} className="text-lg font-black mt-1">Hoje</Text>
                            <Text style={{ color: theme.colors.textMuted }} className="text-[10px] uppercase font-bold">Data</Text>
                        </View>
                    </View>

                    {/* Input Section: Name & Notes */}
                    <Animated.View entering={FadeInDown.delay(200)}>
                        <Text style={{ color: theme.colors.text }} className="text-xs font-black uppercase tracking-widest mb-3 ml-1 opacity-50">Detalhes do Treino</Text>
                        <View style={{ backgroundColor: theme.colors.card, borderRadius: 20 }} className="p-4 border border-zinc-500/10 shadow-sm mb-8">
                            <TextInput
                                value={workoutName}
                                onChangeText={setWorkoutName}
                                placeholder="Nomeie seu esforço hoje..."
                                placeholderTextColor={theme.colors.textMuted}
                                style={{ color: theme.colors.text }}
                                className="text-lg font-black mb-4 pb-4 border-b border-zinc-500/5"
                            />
                            <TextInput
                                value={notes}
                                onChangeText={setNotes}
                                placeholder="Como você se sente? O que foi marcante?"
                                placeholderTextColor={theme.colors.textMuted}
                                multiline
                                style={{ color: theme.colors.text, minHeight: 80, textAlignVertical: 'top' }}
                                className="text-sm font-medium leading-5"
                            />
                        </View>
                    </Animated.View>

                    {/* Media / Register Moment */}
                    <Animated.View entering={FadeInDown.delay(250)} className="mb-8">
                        <Text style={{ color: theme.colors.text }} className="text-xs font-black uppercase tracking-widest mb-3 ml-1 opacity-50">Registrar Momento</Text>

                        {media.length > 0 ? (
                            <View style={{ backgroundColor: theme.colors.card, borderRadius: 20 }} className="overflow-hidden shadow-sm border border-zinc-500/10">
                                <Image
                                    source={{ uri: media[0] }}
                                    style={{ width: '100%', height: 300 }}
                                    resizeMode="cover"
                                />
                                <TouchableOpacity
                                    onPress={() => setMedia([])}
                                    style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                                    className="absolute top-4 right-4 p-2 rounded-full"
                                >
                                    <Ionicons name="close" size={20} color="white" />
                                </TouchableOpacity>
                                <View className="absolute bottom-0 left-0 right-0 p-4 bg-black/40">
                                    <Text className="text-white font-bold text-center">Foto Registrada</Text>
                                </View>
                            </View>
                        ) : (
                            <TouchableOpacity
                                onPress={handlePickImage}
                                style={{ backgroundColor: theme.colors.card, borderRadius: 20 }}
                                className="p-6 border border-zinc-500/10 shadow-sm items-center justify-center border-dashed border-2"
                            >
                                <View style={{ borderRadius: 32, overflow: 'hidden', marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 }}>
                                    <LinearGradient
                                        colors={['#1E3A8A', '#0F172A']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={{ width: 64, height: 64, alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        <Ionicons name="camera" size={32} color="white" />
                                    </LinearGradient>
                                </View>
                                <Text style={{ color: theme.colors.text }} className="font-bold text-lg mb-1">Tirar Foto do Treino</Text>
                                <Text style={{ color: theme.colors.textMuted }} className="text-xs text-center px-8">
                                    Registre seu shape ou o equipamento usado para o feed.
                                </Text>
                            </TouchableOpacity>
                        )}
                    </Animated.View>

                    {/* Survey Section */}
                    <Animated.View entering={FadeInDown.delay(300)} className="mb-8">
                        <Text style={{ color: theme.colors.text }} className="text-xs font-black uppercase tracking-widest mb-3 ml-1 opacity-50">Auto-Avaliação</Text>
                        <View style={{ backgroundColor: theme.colors.card, borderRadius: 20 }} className="p-5 border border-zinc-500/10 shadow-sm">
                            {/* Intensity Selector */}
                            <Text style={{ color: theme.colors.textMuted }} className="text-[10px] font-black uppercase mb-3">Intensidade Percetível</Text>
                            <View className="flex-row gap-2 mb-6">
                                {(['leve', 'moderado', 'intenso'] as const).map((opt) => (
                                    <TouchableOpacity
                                        key={opt}
                                        onPress={() => setPostWorkoutSurvey(prev => ({ ...prev, intensity: opt }))}
                                        style={{
                                            backgroundColor: postWorkoutSurvey.intensity === opt ? theme.colors.primary : 'rgba(0,0,0,0.03)',
                                            borderColor: postWorkoutSurvey.intensity === opt ? theme.colors.primary : 'transparent'
                                        }}
                                        className="flex-1 py-3 rounded-2xl border items-center"
                                    >
                                        <Text style={{ color: postWorkoutSurvey.intensity === opt ? 'black' : theme.colors.text }} className="capitalize font-black text-xs">{opt}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Feeling Selector */}
                            <Text style={{ color: theme.colors.textMuted }} className="text-[10px] font-black uppercase mb-3">Como se sente após o treino?</Text>
                            <View className="flex-row gap-2">
                                {(['energizado', 'cansado', 'satisfeito'] as const).map((opt) => (
                                    <TouchableOpacity
                                        key={opt}
                                        onPress={() => setPostWorkoutSurvey(prev => ({ ...prev, feeling: opt }))}
                                        style={{
                                            backgroundColor: postWorkoutSurvey.feeling === opt ? theme.colors.primary : 'rgba(0,0,0,0.03)',
                                            borderColor: postWorkoutSurvey.feeling === opt ? theme.colors.primary : 'transparent'
                                        }}
                                        className="flex-1 py-4 rounded-2xl border items-center"
                                    >
                                        <Ionicons
                                            name={opt === 'energizado' ? 'flash' : opt === 'cansado' ? 'battery-dead' : 'happy'}
                                            size={20}
                                            color={postWorkoutSurvey.feeling === opt ? 'black' : theme.colors.textMuted}
                                        />
                                        <Text style={{ color: postWorkoutSurvey.feeling === opt ? 'black' : theme.colors.text }} className="capitalize text-[10px] font-black mt-1">{opt}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </Animated.View>

                    {/* Toggles & Options */}
                    <Animated.View entering={FadeInDown.delay(400)} className="mb-12">
                        <Text style={{ color: theme.colors.text }} className="text-xs font-black uppercase tracking-widest mb-3 ml-1 opacity-50">Opções & Sincronização</Text>
                        <View style={{ backgroundColor: theme.colors.card, borderRadius: 20 }} className="p-4 border border-zinc-500/10 shadow-sm overflow-hidden">
                            <View className="flex-row items-center justify-between py-2 mb-2 border-b border-zinc-500/5">
                                <View className="flex-row items-center">
                                    <View style={{ backgroundColor: theme.colors.primary + '15' }} className="w-8 h-8 rounded-full items-center justify-center mr-3">
                                        <Ionicons name="refresh" size={16} color={theme.colors.primary} />
                                    </View>
                                    <Text style={{ color: theme.colors.text }} className="text-sm font-bold">Atualizar rotina base</Text>
                                </View>
                                <Switch
                                    value={updateRoutineValues}
                                    onValueChange={setUpdateRoutineValues}
                                    trackColor={{ false: '#333', true: theme.colors.primary }}
                                />
                            </View>
                            <View className="flex-row items-center justify-between py-2">
                                <View className="flex-row items-center">
                                    <View style={{ backgroundColor: 'rgba(249, 115, 22, 0.1)' }} className="w-8 h-8 rounded-full items-center justify-center mr-3">
                                        <Ionicons name="share-social" size={16} color="#F97316" />
                                    </View>
                                    <Text style={{ color: theme.colors.text }} className="text-sm font-bold">Postar no Strava</Text>
                                </View>
                                <Switch
                                    value={shareToStrava}
                                    onValueChange={setShareToStrava}
                                    trackColor={{ false: '#333', true: '#FC4C02' }}
                                />
                            </View>
                        </View>
                    </Animated.View>
                </ScrollView>
            </View>
        </Modal>
    );
}
