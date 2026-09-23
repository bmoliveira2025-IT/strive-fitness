import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useRef, useState } from 'react';
import { Animated, PanResponder, Platform, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

interface DockableActionButtonProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  bottom: number;
  right?: number;
  initiallyMinimized?: boolean;
}

/** Shared floating action: drag by the handle, or collapse to an edge tab. */
export function DockableActionButton({ label, icon, onPress, bottom, right = 20, initiallyMinimized = false }: DockableActionButtonProps) {
  const { theme } = useTheme();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [minimized, setMinimized] = useState(initiallyMinimized);
  const minimizedRef = useRef(initiallyMinimized);
  const offset = useRef(new Animated.ValueXY()).current;
  const start = useRef({ x: 0, y: 0 });
  const bounds = useRef({ width, height, bottom, right, top: insets.top });
  bounds.current = { width, height, bottom, right, top: insets.top };

  const clamp = (x: number, y: number, compact: boolean) => {
    const screen = bounds.current;
    const buttonWidth = compact ? 52 : Math.min(258, screen.width - 32);
    const buttonHeight = 52;
    return {
      x: compact ? 0 : Math.max(-(screen.width - buttonWidth - screen.right - 8), Math.min(x, screen.right - 8)),
      y: Math.max(-(screen.height - screen.bottom - buttonHeight - screen.top - 8), Math.min(y, screen.bottom - 8)),
    };
  };

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5,
    onMoveShouldSetPanResponderCapture: (_, gesture) => Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5,
    onPanResponderGrant: () => { offset.stopAnimation(value => { start.current = value; }); },
    onPanResponderMove: (_, gesture) => {
      const next = clamp(start.current.x + gesture.dx, start.current.y + gesture.dy, minimizedRef.current);
      offset.setValue(next);
    },
    onPanResponderRelease: () => {
      offset.stopAnimation(value => Animated.spring(offset, { toValue: clamp(value.x, value.y, minimizedRef.current), useNativeDriver: false, bounciness: 3 }).start());
    },
  })).current;

  const toggleMinimized = () => {
    const compact = !minimizedRef.current;
    minimizedRef.current = compact;
    setMinimized(compact);
    offset.stopAnimation(value => Animated.spring(offset, { toValue: clamp(0, value.y, compact), useNativeDriver: false, bounciness: 3 }).start());
  };

  return (
    <Animated.View {...panResponder.panHandlers} style={{ position: 'absolute', right, bottom, transform: offset.getTranslateTransform(), zIndex: 100, elevation: 12,
      borderRadius: 18, borderWidth: 1, borderColor: theme.colors.primary + '55', backgroundColor: theme.colors.card,
      shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
      ...(Platform.OS === 'web' ? { touchAction: 'none' as const } : {}) }}>
      {minimized ? (
        <TouchableOpacity onPress={toggleMinimized} accessibilityLabel={`Expandir ${label}`} style={{ width: 52, height: 52, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={icon} size={21} color={theme.colors.primary} />
          <Ionicons name="chevron-back" size={12} color={theme.colors.primary} />
        </TouchableOpacity>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', height: 52 }}>
          <View accessibilityLabel={`Arrastar ${label}`} style={{ width: 30, height: 52, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="reorder-three-outline" size={20} color={theme.colors.textMuted} />
          </View>
          <TouchableOpacity onPress={onPress} accessibilityLabel={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, height: 52 }}>
            <Ionicons name={icon} size={18} color={theme.colors.primary} />
            <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '700' }}>{label}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleMinimized} accessibilityLabel={`Minimizar ${label} na lateral`} style={{ width: 36, height: 52, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
}
