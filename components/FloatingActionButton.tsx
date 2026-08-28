import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FloatingActionButtonProps {
    onPress: () => void;
    icon?: keyof typeof Ionicons.glyphMap;
    label?: string;
}

export function FloatingActionButton({ onPress, icon = 'add', label }: FloatingActionButtonProps) {
    const insets = useSafeAreaInsets();

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            className="absolute right-6 bg-primary rounded-full items-center justify-center border border-white/10"
            style={{
                bottom: (Platform.OS === 'android' ? Math.max(insets.bottom, 48) + 60 : Math.max(insets.bottom, 14) + 60) + 16,
                minWidth: 56,
                height: 56,
                paddingHorizontal: label ? 20 : 0,
            }}
        >
            <View className="flex-row items-center">
                <Ionicons name={icon} size={24} color="#0D0F12" />
                {label && (
                    <Text className="text-black font-bold text-sm ml-2">{label}</Text>
                )}
            </View>
        </TouchableOpacity>
    );
}
