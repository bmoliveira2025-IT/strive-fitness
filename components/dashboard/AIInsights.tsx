import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { ImageBackground, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSavedWorkouts } from '../../context/SavedWorkoutsContext';
import { useTheme } from '../../context/ThemeContext';

export function AIInsights() {
    const router = useRouter();
    const { savedWorkouts } = useSavedWorkouts();
    const { theme } = useTheme();

    const totalWorkouts = savedWorkouts.length;

    const insights = [
        {
            icon: 'analytics',
            title: 'Análise de Treino',
            subtitle: totalWorkouts > 0
                ? `${totalWorkouts} treino${totalWorkouts > 1 ? 's' : ''} criado${totalWorkouts > 1 ? 's' : ''}`
                : 'Crie seu primeiro treino',
            color: '#6366F1',
        },
        {
            icon: 'flash',
            title: 'Sugestão IA',
            subtitle: totalWorkouts < 3
                ? 'Adicione mais treinos para análises'
                : 'Varie grupos musculares',
            color: '#F59E0B',
        },
    ];

    return (
        <View className="mb-6 px-6">
            <Animated.View
                entering={FadeInDown.duration(800).springify()}
                style={{
                    backgroundColor: '#000',
                    borderRadius: 30,
                    overflow: 'hidden',
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.3,
                    shadowRadius: 20,
                    elevation: 5,
                }}
            >
                <ImageBackground
                    source={require('../../assets/science_bg.png')}
                    style={{ flex: 1 }}
                >
                    {/* Moody Deep Gradient Overlay - 95% Opacity */}
                    <LinearGradient
                        colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.95)']}
                        style={{ position: 'absolute', inset: 0 }}
                    />

                    <View className="p-5">
                        <Text style={{ color: '#FFF', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }} className="text-sm font-black italic uppercase tracking-tighter mb-4">Inteligência Artificial</Text>

                        <View className="flex-row gap-3">
                            {insights.map((insight, index) => (
                                <TouchableOpacity
                                    key={index}
                                    activeOpacity={0.8}
                                    onPress={() => router.push('/workout')}
                                    className="flex-1 bg-white/5 rounded-2xl p-3 border border-white/10"
                                >
                                    <View className="flex-row items-center mb-2">
                                        <View
                                            className="w-8 h-8 rounded-lg items-center justify-center mr-2"
                                            style={{ backgroundColor: `${insight.color}20`, borderWidth: 1, borderColor: `${insight.color}40` }}
                                        >
                                            <Ionicons name={insight.icon as any} size={16} color={insight.color} />
                                        </View>
                                        <Text style={{ color: '#FFF', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }} className="text-[11px] font-black uppercase tracking-tighter flex-1" numberOfLines={1}>
                                            {insight.title}
                                        </Text>
                                    </View>
                                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: '700' }} numberOfLines={2}>
                                        {insight.subtitle}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </ImageBackground>
            </Animated.View>
        </View>
    );
}
