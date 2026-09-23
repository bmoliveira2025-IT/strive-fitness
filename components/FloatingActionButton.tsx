import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DockableActionButton } from './DockableActionButton';

interface FloatingActionButtonProps {
    onPress: () => void;
    icon?: keyof typeof Ionicons.glyphMap;
    label?: string;
}

/** Backward-compatible floating action using the shared movable side-dock pattern. */
export function FloatingActionButton({ onPress, icon = 'add', label = 'Nova ação' }: FloatingActionButtonProps) {
    const insets = useSafeAreaInsets();
    return <DockableActionButton onPress={onPress} icon={icon} label={label}
        bottom={(Platform.OS === 'android' ? Math.max(insets.bottom, 48) + 60 : Math.max(insets.bottom, 14) + 60) + 16} />;
}
