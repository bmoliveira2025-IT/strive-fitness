import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ModernLoading } from '../components/ui/ModernLoading';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';

export default function AsymmetryAnalysisScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const [permission, requestPermission] = useCameraPermissions();
    const [cameraRef, setCameraRef] = useState<CameraView | null>(null);
    const [photo, setPhoto] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<any>(null);
    const [vizMode, setVizMode] = useState<'skeleton' | 'heatmap'>('skeleton');
    const [history, setHistory] = useState<any[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [analysisMode, setAnalysisMode] = useState<'superior' | 'inferior'>('superior');

    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    useEffect(() => {
        if (!permission?.granted) {
            requestPermission();
        }
    }, [permission]);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        if (isLoadingHistory) return;

        setIsLoadingHistory(true);
        try {
            // Fetch from Supabase
            // The Supabase client handles the session automatically
            const { data, error } = await supabase
                .from('asymmetry_analyses')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                // If it's an abort error, we might not want to log it as a hard error
                if (error.message?.includes('AbortError')) {
                    console.warn('History fetch aborted');
                } else {
                    console.error('Error fetching history:', error);
                }
            } else if (data) {
                // Map Supabase snake_case to our camelCase
                const formattedHistory = data.map(item => ({
                    id: item.id,
                    photoUri: item.photo_url,
                    asymmetryIndex: item.asymmetry_index,
                    classification: item.classification,
                    bodyPart: item.body_part,
                    color: item.meta?.color || '#ccc',
                    timestamp: new Date(item.created_at).getTime(),
                    details: item.details,
                    recommendations: item.recommendations
                }));
                setHistory(formattedHistory);
            }
        } catch (e: any) {
            if (!e.message?.includes('AbortError')) {
                console.error('Failed to load history', e);
            }
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const takePicture = async () => {
        if (cameraRef) {
            try {
                const photo = await cameraRef.takePictureAsync({
                    quality: 0.8,
                    base64: true,
                });
                setPhoto(photo?.uri || null);
                if (photo?.uri) {
                    analyzePhoto(photo.uri);
                }
            } catch (error) {
                Alert.alert('Erro', 'Não foi possível capturar a foto.');
            }
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [3, 4],
            quality: 0.8,
        });

        if (!result.canceled) {
            setPhoto(result.assets[0].uri);
            analyzePhoto(result.assets[0].uri);
        }
    };

    const analyzePhoto = async (uri: string) => {
        setIsAnalyzing(true);

        // Simulating Pose Analysis (In real app, we would decode image here)
        // For MVP, we use our Service logic structure but with simulated keypoints
        setTimeout(async () => {

            // Randomly decide body part for demo purposes (since we can't decode image without native modules easily)
            // In real integration: const { bodyPart, keypoints } = await analyzePoseInImage(uri);
            // Use the user-selected mode for accurate "identification"
            const isUpper = analysisMode === 'superior';
            const bodyPart = isUpper ? 'Superior (Tronco/Braços)' : 'Inferior (Pernas)';

            // Mock Result based on Body Part
            const asymmetryValue = Math.floor(Math.random() * 20); // 0-20%
            let classification = 'Balanceado';
            let color = '#22c55e';
            let severity = 'low';

            if (asymmetryValue >= 10 && asymmetryValue < 15) {
                classification = 'Atenção';
                color = '#f97316';
                severity = 'medium';
            } else if (asymmetryValue >= 15) {
                classification = 'Risco de Lesão';
                color = '#ef4444';
                severity = 'high';
            }

            const mockResult = {
                id: Date.now().toString(),
                photoUri: uri, // Save Photo URI
                asymmetryIndex: asymmetryValue,
                classification: classification,
                color: color,
                severity: severity,
                bodyPart: bodyPart,
                postural: { shoulderTilt: Math.random() * 5 },
                details: isUpper ?
                    { leftSide: 340, rightSide: 340 - (asymmetryValue * 2) } :
                    { leftSide: 520, rightSide: 520 - (asymmetryValue * 3) },
                recommendations: asymmetryValue > 10 ? [
                    `Adicionar 2 séries unilaterais para o lado ${Math.random() > 0.5 ? 'Direito' : 'Esquerdo'}.`,
                    "Aumentar 10-20% o volume do lado mais fraco.",
                    "Priorizar início do treino pelo lado mais fraco."
                ] : ["Continue com o treino balanceado.", "Mantenha a boa execução."],
                timestamp: Date.now()
            };

            setAnalysisResult(mockResult);

            // Persist Result to Supabase
            try {
                // We don't strictly need the user object if RLS allows anon, but good practice to check session
                // The current setup in lib/supabase.ts uses AsyncStorage for auth persistence

                const { error } = await supabase
                    .from('asymmetry_analyses')
                    .insert({
                        asymmetry_index: mockResult.asymmetryIndex,
                        classification: mockResult.classification,
                        body_part: mockResult.bodyPart,
                        details: mockResult.details,
                        recommendations: mockResult.recommendations,
                        photo_url: uri, // In a real app, upload to Storage first
                        meta: {
                            severity: mockResult.severity,
                            color: mockResult.color,
                            shoulderTilt: mockResult.postural.shoulderTilt
                        }
                    });

                if (error) {
                    console.error('Supabase insert error:', error);
                } else {
                    // Reload History
                    loadHistory();
                }

            } catch (e) {
                console.error('Failed to save analysis', e);
            }

            setIsAnalyzing(false);
        }, 3000);
    };

    const reset = () => {
        setPhoto(null);
        setAnalysisResult(null);
    };

    const openHistoryItem = (item: any) => {
        setAnalysisResult(item);
        setPhoto(item.photoUri); // Restore photo background
        setShowHistory(false); // Close history list
    };

    return (
        <View className="flex-1" style={{ backgroundColor: 'transparent' }}>
            <View style={{ paddingTop: insets.top }} className="flex-row items-center justify-between px-4 pb-4 bg-transparent absolute top-0 z-50 w-full">
                <TouchableOpacity onPress={() => router.back()} className="p-2 rounded-full bg-black/30">
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text className="text-white font-bold text-lg">Análise de Assimetria</Text>
                <TouchableOpacity onPress={() => router.push('/asymmetry-history')} className="p-2 rounded-full bg-black/30">
                    <Ionicons name="time-outline" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            {/* History Comparison Modal */}
            <Modal visible={showHistory} animationType="slide" transparent={true} onRequestClose={() => setShowHistory(false)}>
                <View className="flex-1 bg-zinc-900 mt-20 rounded-t-[32px] overflow-hidden">
                    <View className="px-6 py-4 border-b border-zinc-800 flex-row justify-between items-center">
                        <Text className="text-white font-bold text-xl">Comparativo de Evolução</Text>
                        <TouchableOpacity onPress={() => setShowHistory(false)} className="p-2 bg-zinc-800 rounded-full">
                            <Ionicons name="close" size={20} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={{ padding: 20 }}>
                        {history.length === 0 ? (
                            <Text className="text-zinc-500 text-center mt-10">Nenhuma análise registrada.</Text>
                        ) : (
                            <View>
                                {/* Comparison Header */}
                                <View className="flex-row justify-between mb-6">
                                    <View className="flex-1 mr-2">
                                        <Text className="text-zinc-500 text-xs font-bold uppercase text-center mb-2">Atual</Text>
                                        <View className={`p-4 rounded-2xl bg-zinc-800 border-2 ${history[0]?.asymmetryIndex < 10 ? 'borderColor-green-500/50' : 'borderColor-orange-500/50'}`}>
                                            <View className="h-32 bg-black rounded-lg mb-3 overflow-hidden">
                                                {history[0]?.photoUri ? (
                                                    <Image source={{ uri: history[0].photoUri }} className="w-full h-full" resizeMode="cover" />
                                                ) : (
                                                    <View className="flex-1 items-center justify-center">
                                                        <Ionicons name="image-outline" size={24} color="#52525b" />
                                                    </View>
                                                )}
                                            </View>
                                            <Text className="text-white font-bold text-center text-2xl">{history[0]?.asymmetryIndex}%</Text>
                                            <Text style={{ color: history[0]?.color }} className="text-center font-bold text-xs uppercase mb-1">{history[0]?.classification}</Text>
                                            <Text className="text-zinc-500 text-[10px] text-center">{new Date(history[0]?.timestamp).toLocaleDateString('pt-BR')}</Text>
                                        </View>
                                    </View>

                                    {/* Divider / VS */}
                                    <View className="items-center justify-center">
                                        <View className="w-[1px] h-full bg-zinc-800 absolute" />
                                        <View className="bg-zinc-900 p-2 rounded-full border border-zinc-700 z-10">
                                            <Text className="text-zinc-500 text-xs font-bold">VS</Text>
                                        </View>
                                    </View>

                                    <View className="flex-1 ml-2">
                                        <Text className="text-zinc-500 text-xs font-bold uppercase text-center mb-2">Anterior</Text>
                                        {history.length > 1 ? (
                                            <TouchableOpacity onPress={() => openHistoryItem(history[1])} className="p-4 rounded-2xl bg-zinc-800/50 border border-zinc-700/50">
                                                <View className="h-32 bg-black rounded-lg mb-3 overflow-hidden opacity-50">
                                                    {history[1]?.photoUri ? (
                                                        <Image source={{ uri: history[1].photoUri }} className="w-full h-full" resizeMode="cover" />
                                                    ) : (
                                                        <View className="flex-1 items-center justify-center">
                                                            <Ionicons name="image-outline" size={24} color="#52525b" />
                                                        </View>
                                                    )}
                                                </View>
                                                <Text className="text-zinc-400 font-bold text-center text-2xl">{history[1]?.asymmetryIndex}%</Text>
                                                <Text className="text-zinc-500 text-center font-bold text-xs uppercase mb-1">{history[1]?.classification}</Text>
                                                <Text className="text-zinc-600 text-[10px] text-center">{new Date(history[1]?.timestamp).toLocaleDateString('pt-BR')}</Text>
                                            </TouchableOpacity>
                                        ) : (
                                            <View className="h-full justify-center items-center border-2 border-dashed border-zinc-800 rounded-2xl">
                                                <Text className="text-zinc-600 text-xs text-center px-2">Sem histórico anterior</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>

                                {/* Diff Analysis */}
                                {history.length > 1 && (
                                    <View className="bg-zinc-800 p-4 rounded-2xl border border-zinc-700">
                                        <Text className="text-zinc-400 text-xs font-bold uppercase mb-2">Evolução</Text>
                                        <View className="flex-row items-center gap-3">
                                            <View className={`rounded-full p-2 ${history[0].asymmetryIndex < history[1].asymmetryIndex ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                                <Ionicons
                                                    name={history[0].asymmetryIndex < history[1].asymmetryIndex ? "arrow-down" : "arrow-up"}
                                                    size={24}
                                                    color={history[0].asymmetryIndex < history[1].asymmetryIndex ? "#22c55e" : "#ef4444"}
                                                />
                                            </View>
                                            <View>
                                                <Text className="text-white font-bold text-lg">
                                                    {Math.abs(history[0].asymmetryIndex - history[1].asymmetryIndex).toFixed(1)}% {history[0].asymmetryIndex < history[1].asymmetryIndex ? 'Melhor' : 'Pior'}
                                                </Text>
                                                <Text className="text-zinc-500 text-xs">
                                                    Comparado à análise anterior
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                )}
                            </View>
                        )}
                    </ScrollView>
                </View>
            </Modal>

            {!photo ? (
                <CameraView
                    style={{ flex: 1 }}
                    facing="front"
                    ref={(ref) => setCameraRef(ref)}
                >
                    <View className="flex-1 justify-end pb-12 px-6">
                        {/* Guides */}
                        <View className="absolute inset-0 justify-center items-center pointer-events-none">
                            <View className="w-[80%] h-[70%] border-2 border-white/30 rounded-[40px] border-dashed" />
                            <View className="absolute w-full h-[1px] bg-red-500/50" />
                            <View className="absolute h-full w-[1px] bg-emerald-500/50" />
                            <Text className="text-white/70 absolute top-[10%] bg-black/40 px-3 py-1 rounded-full text-xs font-bold">
                                Alinhe o corpo com a grade
                            </Text>
                        </View>

                        <View className="flex-row justify-between items-center bg-black/40 p-6 rounded-3xl backdrop-blur-md">
                            <TouchableOpacity onPress={pickImage} className="p-3 bg-white/10 rounded-full">
                                <Ionicons name="images" size={24} color="#FFF" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={takePicture}
                                className="w-20 h-20 rounded-full border-4 border-white items-center justify-center bg-white/20"
                            >
                                <View className="w-16 h-16 rounded-full bg-white" />
                            </TouchableOpacity>

                            <View style={{ width: 48 }} />
                        </View>

                        {/* Mode Selector */}
                        <View className="absolute bottom-32 w-full items-center">
                            <View className="flex-row bg-black/50 rounded-full p-1 border border-white/10">
                                <TouchableOpacity
                                    onPress={() => setAnalysisMode('superior')}
                                    style={{
                                        backgroundColor: analysisMode === 'superior' ? theme.colors.primary : 'transparent',
                                        paddingHorizontal: 20,
                                        paddingVertical: 8,
                                        borderRadius: 20
                                    }}
                                >
                                    <Text style={{
                                        color: analysisMode === 'superior' ? '#000' : '#AAA',
                                        fontWeight: 'bold',
                                        fontSize: 12
                                    }}>SUPERIOR</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setAnalysisMode('inferior')}
                                    style={{
                                        backgroundColor: analysisMode === 'inferior' ? theme.colors.primary : 'transparent',
                                        paddingHorizontal: 20,
                                        paddingVertical: 8,
                                        borderRadius: 20
                                    }}
                                >
                                    <Text style={{
                                        color: analysisMode === 'inferior' ? '#000' : '#AAA',
                                        fontWeight: 'bold',
                                        fontSize: 12
                                    }}>INFERIOR</Text>
                                </TouchableOpacity>
                            </View>
                            <Text className="text-white/60 text-[10px] mt-2 font-medium bg-black/30 px-2 py-1 rounded-md">
                                {analysisMode === 'superior' ? 'Foco: Ombros, Peitoral e Braços' : 'Foco: Quadris, Joelhos e Tornozelos'}
                            </Text>
                        </View>
                    </View>
                </CameraView>
            ) : (
                <View className="flex-1">
                    <Image source={{ uri: photo }} className="flex-1" resizeMode="contain" />

                    {/* Analysis Overlay */}
                    {isAnalyzing && (
                        <View className="absolute inset-0 bg-black/60 justify-center items-center">
                            <ModernLoading size={40} color={theme.colors.primary} />
                            <Text className="text-white mt-4 font-bold animate-pulse">Analisando Biomecânica...</Text>
                            <Text className="text-white/70 text-xs mt-2">Identificando Landmarks (Ombros, Quadris, Membros)</Text>
                        </View>
                    )}

                    {/* Results Modal / Sheet */}
                    {analysisResult && (
                        <View className="absolute bottom-0 left-0 right-0 bg-zinc-900 rounded-t-[32px] shadow-2xl border-t border-zinc-800 h-[65%]" style={{ paddingBottom: insets.bottom + 20 }}>
                            <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
                                <View className="items-center mb-6">
                                    <Text className="text-white font-bold text-3xl">{analysisResult.asymmetryIndex}%</Text>
                                    <Text className="text-white/50 text-xs uppercase tracking-widest mb-2">Índice de Assimetria</Text>

                                    <View className="items-center mb-2">
                                        <Text className="text-white font-bold text-2xl">{analysisResult.classification}</Text>
                                        <View className="flex-row items-center mt-1 bg-zinc-800 px-3 py-1 rounded-full border border-zinc-700">
                                            <Ionicons name={analysisResult.bodyPart.includes('Superior') ? "body" : "walk"} size={12} color="#AAA" style={{ marginRight: 6 }} />
                                            <Text className="text-white/70 text-xs uppercase tracking-widest font-bold">
                                                {analysisResult.bodyPart}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <View className="flex-row gap-4 mb-6">
                                    <View className="flex-1 bg-zinc-800 p-4 rounded-xl border border-zinc-700">
                                        <Text className="text-zinc-500 text-[10px] font-bold uppercase mb-2">Volume Esquerdo</Text>
                                        <Text className="text-white font-bold text-xl">{analysisResult.details.leftSide}px</Text>
                                    </View>
                                    <View className="flex-1 bg-zinc-800 p-4 rounded-xl border border-zinc-700">
                                        <Text className="text-zinc-500 text-[10px] font-bold uppercase mb-2">Volume Direito</Text>
                                        <Text className="text-white font-bold text-xl">{analysisResult.details.rightSide}px</Text>
                                    </View>
                                </View>

                                <View className="bg-zinc-800 p-5 rounded-2xl border border-zinc-700 mb-6">
                                    <Text className="text-zinc-400 text-xs font-bold uppercase mb-3">Recomendações</Text>
                                    {analysisResult.recommendations.map((rec: string, index: number) => (
                                        <View key={index} className="flex-row items-start mb-2">
                                            <View className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 mr-2" />
                                            <Text className="text-white/80 text-sm flex-1">{rec}</Text>
                                        </View>
                                    ))}
                                </View>

                                <View className="flex-row gap-3">
                                    <TouchableOpacity
                                        onPress={reset}
                                        className="flex-1 bg-zinc-800 p-4 rounded-xl items-center border border-zinc-700"
                                    >
                                        <Text className="text-white font-bold">Nova Análise</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => router.push('/asymmetry-history')}
                                        className="flex-1 bg-emerald-600 p-4 rounded-xl items-center"
                                    >
                                        <Text className="text-white font-bold">Ver Análises</Text>
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        </View>
                    )}

                    <TouchableOpacity
                        onPress={reset}
                        className="absolute top-12 left-4 p-2 bg-black/40 rounded-full z-10"
                    >
                        <Ionicons name="close" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>
            )}

            <StatusBar style="light" />
        </View>
    );
}
