import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ModernLoading } from '../components/ui/ModernLoading';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';

export default function AsymmetryHistoryScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const { data, error } = await supabase
                .from('asymmetry_analyses')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching history:', error);
            } else if (data) {
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
        } catch (error) {
            console.error('Failed to load history', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1" style={{ backgroundColor: 'transparent' }}>
            <View style={{ paddingTop: insets.top }} className="flex-row items-center justify-between px-4 pb-4 border-b border-zinc-800 bg-zinc-900">
                <TouchableOpacity onPress={() => router.back()} className="p-2 rounded-full bg-zinc-800">
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text className="text-white font-bold text-lg">Histórico de Análises</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ModernLoading size={40} color={theme.colors.primary} />
                </View>
            ) : (
                <FlashList
                    data={history}
                    keyExtractor={(item) => String(item.id)}
                    contentContainerStyle={{ padding: 20, flexGrow: 1 }}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={(
                        <View className="items-center justify-center mt-20">
                            <Ionicons name="documents-outline" size={64} color="#52525b" />
                            <Text className="text-zinc-500 text-center mt-4">Nenhuma análise registrada.</Text>
                        </View>
                    )}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => setSelectedAnalysis(item)}
                            activeOpacity={0.7}
                            className="mb-4 bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800"
                        >
                            <View className="flex-row p-4 items-center">
                                <View className="h-16 w-16 bg-zinc-800 rounded-lg mr-4 overflow-hidden">
                                    {item.photoUri ? (
                                        <Image source={{ uri: item.photoUri }} className="w-full h-full" contentFit="cover" cachePolicy="memory-disk" recyclingKey={String(item.id)} />
                                    ) : (
                                        <View className="flex-1 items-center justify-center">
                                            <Ionicons name="image-outline" size={20} color="#52525b" />
                                        </View>
                                    )}
                                </View>
                                <View className="flex-1">
                                    <Text className="text-white font-bold text-lg">{item.asymmetryIndex}% Assimetria</Text>
                                    <Text style={{ color: item.color }} className="text-xs font-bold uppercase">{item.classification}</Text>
                                    <Text className="text-zinc-500 text-xs mt-1">{new Date(item.timestamp).toLocaleDateString('pt-BR')} • {item.bodyPart}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#52525b" />
                            </View>
                        </TouchableOpacity>
                    )}
                />
            )}

            {/* Analysis Detail Modal */}
            <Modal
                visible={!!selectedAnalysis}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setSelectedAnalysis(null)}
            >
                <View className="flex-1 bg-zinc-900">
                    <View className="flex-row items-center justify-between px-4 py-4 border-b border-zinc-800 bg-zinc-900">
                        <Text className="text-white font-bold text-lg">Detalhes da Análise</Text>
                        <TouchableOpacity onPress={() => setSelectedAnalysis(null)} className="p-2 rounded-full bg-zinc-800">
                            <Ionicons name="close" size={24} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    {selectedAnalysis && (
                        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 50 }}>
                            {/* Image Section */}
                            <View className="h-64 bg-black rounded-2xl mb-6 overflow-hidden border border-zinc-800">
                                {selectedAnalysis.photoUri ? (
                                    <Image source={{ uri: selectedAnalysis.photoUri }} className="w-full h-full" contentFit="contain" cachePolicy="memory-disk" />
                                ) : (
                                    <View className="flex-1 items-center justify-center">
                                        <Ionicons name="image-outline" size={48} color="#52525b" />
                                    </View>
                                )}
                            </View>

                            {/* Score Section */}
                            <View className="items-center mb-6">
                                <Text className="text-white font-bold text-4xl">{selectedAnalysis.asymmetryIndex}%</Text>
                                <Text className="text-zinc-500 text-xs uppercase tracking-widest mb-2 font-bold">Índice de Assimetria</Text>

                                <View className="items-center mb-2">
                                    <Text className="text-white font-bold text-2xl">{selectedAnalysis.classification}</Text>
                                    <View className="flex-row items-center mt-2 bg-zinc-800 px-3 py-1 rounded-full border border-zinc-700">
                                        <Ionicons name={selectedAnalysis.bodyPart.includes('Superior') ? "body" : "walk"} size={12} color="#AAA" style={{ marginRight: 6 }} />
                                        <Text className="text-white/70 text-xs uppercase tracking-widest font-bold">
                                            {selectedAnalysis.bodyPart}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Details Grid */}
                            {selectedAnalysis.details && (
                                <View className="flex-row gap-4 mb-6">
                                    <View className="flex-1 bg-zinc-800 p-4 rounded-xl border border-zinc-700">
                                        <Text className="text-zinc-500 text-[10px] font-bold uppercase mb-2">Volume Esquerdo</Text>
                                        <Text className="text-white font-bold text-xl">{selectedAnalysis.details.leftSide || '-'}px</Text>
                                    </View>
                                    <View className="flex-1 bg-zinc-800 p-4 rounded-xl border border-zinc-700">
                                        <Text className="text-zinc-500 text-[10px] font-bold uppercase mb-2">Volume Direito</Text>
                                        <Text className="text-white font-bold text-xl">{selectedAnalysis.details.rightSide || '-'}px</Text>
                                    </View>
                                </View>
                            )}

                            {/* Recommendations */}
                            {selectedAnalysis.recommendations && selectedAnalysis.recommendations.length > 0 && (
                                <View className="bg-zinc-800 p-5 rounded-2xl border border-zinc-700 mb-6">
                                    <Text className="text-zinc-400 text-xs font-bold uppercase mb-3">Recomendações</Text>
                                    {selectedAnalysis.recommendations.map((rec: string, index: number) => (
                                        <View key={index} className="flex-row items-start mb-2">
                                            <View className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 mr-2" />
                                            <Text className="text-white/80 text-sm flex-1">{rec}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            <Text className="text-zinc-600 text-center text-xs">
                                Análise realizada em {new Date(selectedAnalysis.timestamp).toLocaleString('pt-BR')}
                            </Text>
                        </ScrollView>
                    )}
                </View>
            </Modal>

            <StatusBar style="light" />
        </View>
    );
}
