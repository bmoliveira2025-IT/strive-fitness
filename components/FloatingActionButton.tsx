import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { DockableActionButton } from './DockableActionButton';

interface FloatingActionButtonProps {
    onPress: () => void;
    icon?: keyof typeof Ionicons.glyphMap;
    label?: string;
}

/** Backward-compatible floating action using the shared movable side-dock pattern. */
export function FloatingActionButton({ onPress, icon = 'add', label = 'Nova ação' }: FloatingActionButtonProps) {
    return <DockableActionButton onPress={onPress} icon={icon} label={label}
        bottom={16} />;
}
