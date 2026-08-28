import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface AchievementBadgeProps {
    level?: number;
    icon: string;
    type?: 'gold' | 'silver' | 'bronze' | 'platinum' | 'diamond';
    size?: number;
    locked?: boolean;
}

const TIER_COLORS = {
    bronze: { accent: '#B76E3C', soft: '#F6E2D3' },
    silver: { accent: '#64748B', soft: '#E2E8F0' },
    gold: { accent: '#B88712', soft: '#FEF3C7' },
    platinum: { accent: '#475569', soft: '#E0F2FE' },
    diamond: { accent: '#0284C7', soft: '#CFFAFE' },
};

export const AchievementBadge = memo(function AchievementBadge({
    level,
    icon,
    type = 'gold',
    size = 88,
    locked = false,
}: AchievementBadgeProps) {
    const { theme } = useTheme();
    const colors = TIER_COLORS[type];
    const accent = locked ? theme.colors.textMuted : colors.accent;
    const background = locked ? theme.colors.backgroundTertiary : colors.soft;

    return (
        <View style={{ width: size, alignItems: 'center' }}>
            <View style={{
                width: size,
                height: size,
                borderRadius: size * 0.3,
                backgroundColor: background,
                borderWidth: 2,
                borderColor: locked ? theme.colors.cardBorder : accent + '70',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: locked ? 0.65 : 1,
            }}>
                <Ionicons name={(locked ? 'lock-closed' : icon) as any} size={size * 0.4} color={accent} />
                {!locked && (
                    <View style={{ position: 'absolute', top: 8, right: 8, width: 9, height: 9, borderRadius: 5, backgroundColor: accent }} />
                )}
            </View>
            {level !== undefined && (
                <View style={{ backgroundColor: accent, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: -10 }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '800' }}>NÍVEL {level}</Text>
                </View>
            )}
        </View>
    );
});
