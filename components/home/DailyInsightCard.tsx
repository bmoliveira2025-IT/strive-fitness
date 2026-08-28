import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { FontFamily, Radius, Spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

const DAILY_INSIGHTS = [
    {
        tag: 'SOBRECARGA PROGRESSIVA',
        icon: 'trending-up',
        title: 'Como progredir sem estagnar',
        summary: 'Aumente 1 repetição ou 1kg a cada 1-2 semanas. A progressão consistente de tensão mecânica é o principal estímulo para hipertrofia.',
        category: 'Treino',
    },
    {
        tag: 'RECUPERAÇÃO',
        icon: 'moon',
        title: 'O poder do sono profundo',
        summary: 'É durante as fases profundas do sono que o corpo libera a maior quantidade de GH e sintetiza novas fibras musculares. Busque 7-8h de descanso.',
        category: 'Saúde',
    },
    {
        tag: 'NUTRIÇÃO & HIDRATAÇÃO',
        icon: 'water',
        title: 'Água e contração muscular',
        summary: 'Uma desidratação de apenas 2% já reduz sua força máxima em até 10%. Mantenha pelo menos 35-45ml de água por kg ao dia.',
        category: 'Nutrição',
    },
    {
        tag: 'MINDSET ATLÉTICO',
        icon: 'flash',
        title: 'Conexão Mente-Músculo',
        summary: 'Focar ativamente na contração máxima do músculo-alvo aumenta o recrutamento de unidades motoras em até 20%.',
        category: 'Técnica',
    },
];

export function DailyInsightCard() {
    const { theme } = useTheme();
    const [index, setIndex] = useState(() => Math.floor(Math.random() * DAILY_INSIGHTS.length));
    const insight = useMemo(() => DAILY_INSIGHTS[index % DAILY_INSIGHTS.length], [index]);

    const handleNextInsight = () => {
        setIndex(prev => (prev + 1) % DAILY_INSIGHTS.length);
    };

    return (
        <Animated.View
            entering={FadeInDown.duration(600).springify()}
            style={{
                marginHorizontal: 16,
                marginBottom: 20,
                borderRadius: Radius.lg,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.06)',
                backgroundColor: theme.mode === 'dark' ? '#13171D' : '#FFFFFF',
            }}
        >
            <LinearGradient
                colors={theme.mode === 'dark' ? ['rgba(183, 245, 42, 0.06)', 'transparent'] : ['rgba(77, 124, 15, 0.04)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 16 }}
            >
                {/* Header Tag */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            backgroundColor: theme.mode === 'dark' ? 'rgba(183, 245, 42, 0.15)' : 'rgba(77, 124, 15, 0.12)',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 8,
                        }}>
                            <Ionicons name={insight.icon as any} size={15} color={theme.colors.primary} />
                        </View>
                        <Text style={{
                            color: theme.colors.primary,
                            fontSize: 10,
                            fontFamily: FontFamily.sansBold,
                            letterSpacing: 1.2,
                            textTransform: 'uppercase',
                        }}>
                            {insight.tag}
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={handleNextInsight}
                        activeOpacity={0.7}
                        style={{
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: Radius.sm,
                            backgroundColor: theme.colors.backgroundTertiary,
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}
                    >
                        <Ionicons name="shuffle" size={12} color={theme.colors.textMuted} style={{ marginRight: 4 }} />
                        <Text style={{ color: theme.colors.textMuted, fontSize: 10, fontFamily: FontFamily.sansSemiBold }}>
                            Próxima
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Title */}
                <Text style={{
                    color: theme.colors.text,
                    fontSize: 16,
                    fontFamily: FontFamily.display,
                    fontWeight: '700',
                    marginBottom: 6,
                }}>
                    {insight.title}
                </Text>

                {/* Body Summary */}
                <Text style={{
                    color: theme.colors.textMuted,
                    fontSize: 13,
                    lineHeight: 18,
                    fontFamily: FontFamily.sans,
                }}>
                    {insight.summary}
                </Text>
            </LinearGradient>
        </Animated.View>
    );
}
