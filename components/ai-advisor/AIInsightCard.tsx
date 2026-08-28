import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';

interface AIInsightCardProps {
    type: 'pr' | 'alert' | 'tip';
    title: string;
    description: string;
    icon: string;
    color: string;
    index: number;
    badge?: string;
}

export function AIInsightCard({ type, title, description, icon, color, index, badge }: AIInsightCardProps) {
    const { theme } = useTheme();

    return (
        <Animated.View
            entering={FadeInRight.delay(400 + index * 100).duration(600)}
            style={{
                backgroundColor: theme.colors.card,
                borderRadius: 20,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: theme.colors.cardBorder,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: theme.mode === 'light' ? 0.03 : 0.1,
                shadowRadius: 10,
                elevation: 2
            }}
        >
            <View style={{ backgroundColor: color + '15', width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={icon as any} size={22} color={color} />
            </View>
            <View className="flex-1">
                <View className="flex-row items-center justify-between">
                    <Text style={{ color: theme.colors.text }} className="font-black text-[14px] uppercase italic tracking-tighter mb-0.5">{title}</Text>
                    {badge && (
                        <View style={{ backgroundColor: color + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 1, borderColor: color + '40' }}>
                            <Text style={{ color, fontSize: 10, fontWeight: '900' }}>{badge}</Text>
                        </View>
                    )}
                </View>
                <Text style={{ color: theme.colors.textSecondary }} className="text-[11px] leading-4 font-semibold">
                    {description}
                </Text>
            </View>
            {type === 'pr' && (
                <View style={{ backgroundColor: theme.colors.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                    <Text style={{ color: '#000', fontSize: 10, fontWeight: '900' }}>NEW PR</Text>
                </View>
            )}
        </Animated.View>
    );
}
