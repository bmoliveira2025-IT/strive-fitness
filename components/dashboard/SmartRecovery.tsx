import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { ImageBackground, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useMuscleTracker } from '../../context/MuscleTrackerContext';
import { useTheme } from '../../context/ThemeContext';

export function SmartRecovery() {
    const { theme } = useTheme();
    const { muscleStats } = useMuscleTracker();

    // Determine content based on muscle status
    const recoveryTip = useMemo(() => {
        if (!muscleStats) return null;

        const fatigued = Object.values(muscleStats)
            .sort((a, b) => a.recoveryPercentage - b.recoveryPercentage)[0];

        if (!fatigued || !fatigued.lastTrained || fatigued.setsThisWeek === 0) {
            return null;
        }

        let mobilityTip = "Alongamento geral de corpo inteiro.";
        let nutritionTip = "Foque em proteínas magras para reconstrução muscular.";

        const lowerBody = ['Quadríceps', 'Isquiotibiais', 'Glúteos', 'Panturrilhas'];
        const upperPush = ['Peito', 'Ombros', 'Tríceps'];
        const upperPull = ['Costas', 'Bíceps', 'Trapézio'];

        if (lowerBody.includes(fatigued.name)) {
            mobilityTip = "Use o rolo de espuma (foam roller) nas pernas por 5 min.";
            nutritionTip = "Pernas exigem muito! Aumente carboidratos complexos hoje.";
        } else if (upperPush.includes(fatigued.name)) {
            mobilityTip = "Alongamento de peitoral na porta e rotação de ombros.";
            nutritionTip = "Vitamina C ajuda a reduzir o estresse oxidativo dos ombros.";
        } else if (upperPull.includes(fatigued.name)) {
            mobilityTip = "Pendule-se na barra fixa por 30s para descomprimir a coluna.";
            nutritionTip = "Magnésio antes de dormir relaxará a musculatura das costas.";
        }

        return {
            title: `Recuperação: ${fatigued.name}`,
            mobility: mobilityTip,
            nutrition: nutritionTip,
            muscle: fatigued.name
        };

    }, [muscleStats]);

    if (!recoveryTip) {
        return null;
    }

    return (
        <View className="mb-6 px-6">
            <Animated.View
                entering={FadeInDown.duration(800).springify()}
                className="flex-row items-center justify-between mb-5"
            >
                <View style={{ flex: 1, marginRight: 8 }}>
                    <Text numberOfLines={1} style={{ color: theme.colors.text }} className="text-xl font-black italic uppercase tracking-tighter">Smart Recovery</Text>
                    <Text numberOfLines={1} style={{ color: theme.colors.textMuted }} className="text-[10px] font-bold uppercase tracking-widest mt-0.5">Otimização AI</Text>
                </View>
                <View
                    style={{ backgroundColor: theme.colors.backgroundTertiary, borderWidth: 1, borderColor: theme.colors.primary + '30' }}
                    className="px-3 py-1 rounded-xl"
                >
                    <Text style={{ color: theme.colors.primary, fontSize: 10, fontWeight: '900' }}>PREMIUM</Text>
                </View>
            </Animated.View>

            <Animated.View
                entering={FadeInDown.delay(200).duration(800).springify()}
                style={{
                    backgroundColor: '#000',
                    borderRadius: 32,
                    overflow: 'hidden',
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 12 },
                    shadowOpacity: 0.35,
                    shadowRadius: 24,
                    elevation: 8,
                }}
            >
                <ImageBackground
                    source={require('../../assets/recovery_bg.png')}
                    style={{ flex: 1 }}
                >
                    {/* Moody Deep Gradient Overlay - Increased top opacity for legibility */}
                    <LinearGradient
                        colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.98)']}
                        style={{ position: 'absolute', inset: 0 }}
                    />

                    <View
                        style={{
                            padding: 24,
                            backgroundColor: 'transparent'
                        }}
                    >
                        {/* Header Section - Glass Polish */}
                        <View className="flex-row items-center mb-5">
                            <View style={{ backgroundColor: theme.colors.error + '25', padding: 10, borderRadius: 14, marginRight: 15, borderWidth: 1, borderColor: theme.colors.error + '40' }}>
                                <Ionicons name="medical" size={22} color={theme.colors.error} />
                            </View>
                            <View>
                                <Text style={{ color: '#FFF', textShadowColor: 'rgba(0,0,0,0.9)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 }} className="font-black text-lg tracking-tight uppercase italic">
                                    FOCO: {recoveryTip.muscle.toUpperCase()}
                                </Text>
                                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>RECUPERAÇÃO INTELIGENTE</Text>
                            </View>
                        </View>

                        <Text style={{ color: 'rgba(255,255,255,0.95)', fontSize: 13, lineHeight: 20, marginBottom: 24, textShadowColor: 'rgba(0,0,0,0.9)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }}>
                            Seu último treino exigiu muito desta musculatura. Siga estas recomendações para otimizar sua hipertrofia.
                        </Text>

                        <View className="flex-row gap-5">
                            {/* Mobility Section - Darker Glass */}
                            <View className="flex-1 bg-black/40 border border-white/10 p-4 rounded-3xl">
                                <View className="flex-row items-center mb-3">
                                    <View style={{ backgroundColor: 'rgba(59, 130, 246, 0.25)', width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                                        <Ionicons name="body" size={16} color="#60A5FA" />
                                    </View>
                                    <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '900' }}>Mobilidade</Text>
                                </View>
                                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11, lineHeight: 18 }}>
                                    {recoveryTip.mobility}
                                </Text>
                            </View>

                            {/* Nutrition Section - Darker Glass */}
                            <View className="flex-1 bg-black/40 border border-white/10 p-4 rounded-3xl">
                                <View className="flex-row items-center mb-3">
                                    <View style={{ backgroundColor: theme.colors.primary + '25', width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                                        <Ionicons name="nutrition" size={16} color={theme.colors.primary} />
                                    </View>
                                    <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '900' }}>Nutrição</Text>
                                </View>
                                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11, lineHeight: 18 }}>
                                    {recoveryTip.nutrition}
                                </Text>
                            </View>
                        </View>
                    </View>
                </ImageBackground>
            </Animated.View>
        </View >
    );
}
