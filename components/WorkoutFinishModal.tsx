import Palette from '../constants/palette.json';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from '../services/imagePicker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState } from 'react';
import { Alert, Image, Modal, Platform, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
        saveAsRoutine?: boolean;
        shareToStrava: boolean;
        shareToHealthConnect: boolean;
        media: string[];
        postWorkoutSurvey: PostWorkoutSurvey;
    }) => Promise<boolean>;
    defaultWorkoutName?: string;
    duration: number;
    isFreeWorkout?: boolean;
}

export function WorkoutFinishModal({
    visible,
    onClose,
    onSave,
    defaultWorkoutName = '',
    duration,
    isFreeWorkout = false,
}: WorkoutFinishModalProps) {
    const { theme } = useTheme();
    const { history } = useWorkoutHistory();
    const [workoutName, setWorkoutName] = useState(defaultWorkoutName);
    const [notes, setNotes] = useState('');
    const [date] = useState(new Date());
    const [updateRoutineValues, setUpdateRoutineValues] = useState(true);
    const [saveAsRoutine, setSaveAsRoutine] = useState(isFreeWorkout);
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

    const handlePickImage = async (source: 'camera' | 'library') => {
        try {
            if (Platform.OS !== 'web') {
                const permission = source === 'camera'
                    ? await ImagePicker.requestCameraPermissionsAsync()
                    : await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (!permission.granted) {
                    Alert.alert('Permissão necessária', 'Permita o acesso à câmera ou às fotos para registrar este treino.');
                    return;
                }
            }
            const options = {
                mediaTypes: ['images'] as ['images'],
                allowsEditing: false,
                quality: 0.8,
            };
            // Web library selection must stay in the original click gesture.
            const result = source === 'camera' && Platform.OS !== 'web'
                ? await ImagePicker.launchCameraAsync(options)
                : await ImagePicker.launchImageLibraryAsync(options);

            if (!result.canceled && result.assets[0]?.uri) {
                setMedia([result.assets[0].uri]);
            }
        } catch (error) {
            console.warn('Error selecting workout photo:', error);
            Alert.alert('Não foi possível abrir as fotos', 'Tente novamente ou confira as permissões do aplicativo.');
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
            saveAsRoutine,
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
                        colors={theme.mode === 'dark' ? [theme.colors.surfaceElevated, theme.colors.background] : [theme.colors.backgroundSecondary, theme.colors.onImage]}
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
                            <Text style={{ color: theme.colors.text }} className="text-xl font-bold">Finalizar Treino</Text>
                            <GradientButton
                                onPress={handleSave}
                                style={{
                                    borderRadius: 9999,
                                    shadowColor: Palette.ink,
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 8,
                                    elevation: 5
                                }}
                                gradientStyle={{
                                    paddingHorizontal: 20,
                                    paddingVertical: 8,
                                }}
                            >
                                <Text className="text-onPrimary font-bold text-sm uppercase">{isSaving ? 'Salvando…' : 'Salvar'}</Text>
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
                        <View style={{ shadowColor: '#FF5F6D', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 8 }}>
                            <LinearGradient
                                colors={['#FF5F6D', '#FFC371']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={{ borderRadius: 20, padding: 32, alignItems: 'center', justifyContent: 'center' }}
                            >
                                <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }} className="p-4 rounded-full mb-4">
                                    <Ionicons name="flame" size={48} color="white" />
                                </View>
                                <Text className="text-white text-base font-bold uppercase tracking-[4px] mb-1">
                                    VOCÊ CONCLUIU!
                                </Text>
                                <View className="flex-row items-end">
                                    <Text className="text-white text-7xl font-bold">{streakDays}</Text>
                                    <Text className="text-white text-2xl font-bold mb-2 ml-1">DIAS</Text>
                                </View>
                                <Text style={{ color: 'rgba(255, 255, 255, 0.8)' }} className="text-sm font-bold mt-1">de consistência e esforço.</Text>
                            </LinearGradient>
                        </View>
                    </Animated.View>

                    {/* Quick Stats Summary */}
                    <View className="flex-row gap-3 mb-8">
                        <View style={{ backgroundColor: theme.colors.card, borderRadius: 20 }} className="flex-1 p-4 items-center border border-zinc-500/10 shadow-sm">
                            <Ionicons name="time" size={20} color={theme.colors.primary} />
                            <Text style={{ color: theme.colors.text }} className="text-lg font-bold mt-1">{formatDuration(duration)}</Text>
                            <Text style={{ color: theme.colors.textMuted }} className="text-[10px] uppercase font-bold">Duração</Text>
                        </View>
                        <View style={{ backgroundColor: theme.colors.card, borderRadius: 20 }} className="flex-1 p-4 items-center border border-zinc-500/10 shadow-sm">
                            <Ionicons name="calendar" size={20} color={theme.colors.primary} />
                            <Text style={{ color: theme.colors.text }} className="text-lg font-bold mt-1">Hoje</Text>
                            <Text style={{ color: theme.colors.textMuted }} className="text-[10px] uppercase font-bold">Data</Text>
                        </View>
                    </View>

                    {/* Input Section: Name & Notes */}
                    <Animated.View entering={FadeInDown.delay(200)}>
                        <Text style={{ color: theme.colors.text }} className="text-xs font-bold uppercase tracking-widest mb-3 ml-1 opacity-50">Detalhes do Treino</Text>
                        <View style={{ backgroundColor: theme.colors.card, borderRadius: 20 }} className="p-4 border border-zinc-500/10 shadow-sm mb-8">
                            <TextInput
                                value={workoutName}
                                onChangeText={setWorkoutName}
                                placeholder="Nomeie seu esforço hoje..."
                                placeholderTextColor={theme.colors.textMuted}
                                style={{ color: theme.colors.text }}
                                className="text-lg font-bold mb-4 pb-4 border-b border-zinc-500/5"
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
                        <Text style={{ color: theme.colors.text }} className="text-xs font-bold uppercase tracking-widest mb-3 ml-1 opacity-50">Registrar Momento</Text>

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
                        ) : null}
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                            {Platform.OS !== 'web' && <TouchableOpacity onPress={() => handlePickImage('camera')} style={{ flex: 1, minHeight: 46, borderRadius: 14, backgroundColor: theme.colors.backgroundTertiary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 }}>
                                <Ionicons name="camera-outline" size={19} color={theme.colors.primary} /><Text style={{ color: theme.colors.text, fontSize: 12, fontWeight: '700' }}>Câmera</Text>
                            </TouchableOpacity>}
                            <TouchableOpacity onPress={() => handlePickImage('library')} style={{ flex: 1, minHeight: 46, borderRadius: 14, backgroundColor: theme.colors.backgroundTertiary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 }}>
                                <Ionicons name="images-outline" size={19} color={theme.colors.primary} /><Text style={{ color: theme.colors.text, fontSize: 12, fontWeight: '700' }}>{media.length ? 'Trocar foto' : 'Escolher foto'}</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>

                    {/* Survey Section */}
                    <Animated.View entering={FadeInDown.delay(300)} className="mb-8">
                        <Text style={{ color: theme.colors.text }} className="text-xs font-bold uppercase tracking-widest mb-3 ml-1 opacity-50">Auto-Avaliação</Text>
                        <View style={{ backgroundColor: theme.colors.card, borderRadius: 20 }} className="p-5 border border-zinc-500/10 shadow-sm">
                            {/* Intensity Selector */}
                            <Text style={{ color: theme.colors.textMuted }} className="text-[10px] font-bold uppercase mb-3">Intensidade Percetível</Text>
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
                                        <Text style={{ color: postWorkoutSurvey.intensity === opt ? 'black' : theme.colors.text }} className="capitalize font-bold text-xs">{opt}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Feeling Selector */}
                            <Text style={{ color: theme.colors.textMuted }} className="text-[10px] font-bold uppercase mb-3">Como se sente após o treino?</Text>
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
                                        <Text style={{ color: postWorkoutSurvey.feeling === opt ? 'black' : theme.colors.text }} className="capitalize text-[10px] font-bold mt-1">{opt}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </Animated.View>

                    {/* Toggles & Options */}
                    <Animated.View entering={FadeInDown.delay(400)} className="mb-12">
                        <Text style={{ color: theme.colors.text }} className="text-xs font-bold uppercase tracking-widest mb-3 ml-1 opacity-50">Opções & Sincronização</Text>
                        <View style={{ backgroundColor: theme.colors.card, borderRadius: 20 }} className="p-4 border border-zinc-500/10 shadow-sm overflow-hidden">
                            {isFreeWorkout ? (
                                <View className="flex-row items-center justify-between py-2 mb-2 border-b border-zinc-500/5">
                                    <View className="flex-row items-center flex-1 mr-3">
                                        <View style={{ backgroundColor: theme.colors.primary + '18' }} className="w-8 h-8 rounded-full items-center justify-center mr-3">
                                            <Ionicons name="bookmark" size={16} color={theme.colors.primary} />
                                        </View>
                                        <View className="flex-1">
                                            <Text style={{ color: theme.colors.text }} className="text-sm font-bold">Salvar em Meus Treinos</Text>
                                            <Text style={{ color: theme.colors.textMuted }} className="text-[11px]">Cria uma ficha para você refazer este treino</Text>
                                        </View>
                                    </View>
                                    <Switch
                                        value={saveAsRoutine}
                                        onValueChange={setSaveAsRoutine}
                                        trackColor={{ false: '#333', true: theme.colors.primary }}
                                    />
                                </View>
                            ) : (
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
                            )}
                            <View className="flex-row items-center justify-between py-2">
                                <View className="flex-row items-center">
                                    <View style={{ backgroundColor: 'rgba(249, 115, 22, 0.1)' }} className="w-8 h-8 rounded-full items-center justify-center mr-3">
                                        <Ionicons name="share-social" size={16} color={theme.colors.warning} />
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
