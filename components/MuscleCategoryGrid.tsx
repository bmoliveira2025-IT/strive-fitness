import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '../context/ThemeContext';

import { MUSCLE_GROUPS_LIST } from '../constants/muscleImages';

const MUSCLE_GROUPS = MUSCLE_GROUPS_LIST;

interface MuscleCategoryGridProps {
    onSelect: (id: string, name: string) => void;
}

export function MuscleCategoryGrid({ onSelect }: MuscleCategoryGridProps) {
    const { theme } = useTheme();
    return (
        <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
            <Text style={{ color: theme.colors.text, fontSize: 19, fontWeight: '700', marginBottom: 4 }}>Biblioteca de exercícios</Text>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginBottom: 18 }}>Explore por grupo muscular ou use a busca acima.</Text>
            <View className="flex-row flex-wrap justify-between">
                {MUSCLE_GROUPS.map((group) => (
                    <TouchableOpacity
                        key={group.id}
                        onPress={() => onSelect(group.id, group.name)}
                        activeOpacity={0.7}
                        className="w-[31%] mb-3 items-center"
                    >
                        <View style={{ width: '100%', aspectRatio: 1, borderRadius: 18, backgroundColor: theme.colors.backgroundTertiary, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            <Image source={group.image} contentFit="contain" cachePolicy="memory-disk" style={{ width: '92%', height: '92%' }} accessibilityLabel={`Anatomia: ${group.name}`} />
                        </View>
                        <Text style={{ color: theme.colors.text }} className="text-xs font-bold mt-2 text-center" numberOfLines={2}>
                            {group.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
            <View className="h-32" />
        </ScrollView>
    );
}
