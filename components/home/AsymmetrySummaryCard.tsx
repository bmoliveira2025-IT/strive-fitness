import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

export const AsymmetrySummaryCard = () => {
    const { theme } = useTheme();
    const router = useRouter();
    const [lastResult, setLastResult] = useState<any>(null);

    useFocusEffect(
        useCallback(() => {
            loadLastResult();
        }, [])
    );

    const loadLastResult = async () => {
        try {
            const { data, error } = await supabase
                .from('asymmetry_analyses')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (data) {
                setLastResult({
                    asymmetryIndex: data.asymmetry_index,
                    classification: data.classification,
                    timestamp: data.created_at,
                    color: data.meta?.color || '#22c55e'
                });
            }
        } catch (e) {
            console.error('Failed to load asymmetry data', e);
        }
    };

    if (!lastResult) {
        return (
            <TouchableOpacity
                onPress={() => router.push('/asymmetry-analysis')}
                activeOpacity={0.9}
                style={{
                    marginHorizontal: 24,
                    marginBottom: 24,
                    backgroundColor: theme.mode === 'dark' ? '#18181B' : '#FFFFFF',
                    borderRadius: 24,
                    padding: 20,
                    borderWidth: 1,
                    borderColor: theme.mode === 'dark' ? '#27272A' : '#E4E4E7',
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 12,
                    elevation: 4
                }}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(168, 85, 247, 0.1)' }}>
                        <Ionicons name="scan-outline" size={20} color="#A855F7" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: theme.colors.text, fontWeight: 'bold', fontSize: 16 }} numberOfLines={1}>Análise de Assimetria</Text>
                        <Text style={{ color: theme.colors.textMuted, fontSize: 12 }} numberOfLines={1}>Identifique desequilíbrios musculares</Text>
                    </View>
                    <View style={{ backgroundColor: '#A855F7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                        <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>NOVO</Text>
                    </View>
                </View>

                <View style={{ backgroundColor: theme.mode === 'dark' ? '#27272A' : '#F4F4F5', borderRadius: 16, padding: 16 }}>
                    <Text style={{ color: theme.colors.text, fontSize: 14, lineHeight: 20, marginBottom: 12 }}>
                        Use a IA para analisar sua postura e simetria muscular através de uma foto.
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', gap: -8 }}>
                            {[1, 2, 3].map((i) => (
                                <View key={i} style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: theme.colors.border, borderWidth: 2, borderColor: theme.colors.card }} />
                            ))}
                        </View>
                        <Text style={{ color: '#A855F7', fontWeight: 'bold', fontSize: 14 }}>Começar Agora</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            onPress={() => router.push('/asymmetry-analysis')}
            activeOpacity={0.9}
            style={{
                marginHorizontal: 24,
                marginBottom: 24,
                backgroundColor: theme.mode === 'dark' ? '#18181B' : '#FFFFFF',
                borderRadius: 24,
                padding: 20,
                borderWidth: 1,
                borderColor: theme.mode === 'dark' ? '#27272A' : '#E4E4E7',
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 4
            }}
        >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(168, 85, 247, 0.1)', marginRight: 12 }}>
                    <Ionicons name="body" size={20} color="#A855F7" />
                </View>
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <Text style={{ color: theme.colors.text, fontWeight: 'bold', fontSize: 16 }} numberOfLines={1}>Simetria Corporal</Text>
                    <Text style={{ color: theme.colors.textMuted, fontSize: 12 }} numberOfLines={1}>Última análise: {new Date(lastResult.timestamp).toLocaleDateString('pt-BR')}</Text>
                </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <View>
                    <Text style={{ color: theme.colors.textMuted, fontSize: 12, textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: 0.5, marginBottom: 4 }}>Índice</Text>
                    <Text style={{ color: theme.colors.text, fontSize: 24, fontWeight: '900' }}>{lastResult.asymmetryIndex}%</Text>
                </View>

                <View style={{ height: 30, width: 1, backgroundColor: theme.colors.border }} />

                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: theme.colors.textMuted, fontSize: 12, textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: 0.5, marginBottom: 4 }}>Status</Text>
                    <Text style={{ color: lastResult.color, fontSize: 18, fontWeight: 'bold' }}>{lastResult.classification}</Text>
                </View>
            </View>

            <View style={{ backgroundColor: theme.mode === 'dark' ? '#27272A' : '#F4F4F5', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '600' }}>Realizar nova análise</Text>
                <Ionicons name="camera-outline" size={16} color={theme.colors.text} style={{ marginLeft: 6 }} />
            </View>
        </TouchableOpacity>
    );
};
