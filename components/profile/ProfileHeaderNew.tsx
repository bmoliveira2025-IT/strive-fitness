import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useWorkoutHistory } from '../../context/WorkoutHistoryContext';
import { FontFamily, Radius } from '../../constants/theme';

interface ProfileHeaderNewProps {
    userName: string;
    email?: string;
    photoUri?: string;
    bio?: string;
    weight?: number;
    height?: number;
    onEditPress: () => void;
    onSettingsPress?: () => void;
}

export function ProfileHeaderNew({ userName, email, photoUri, bio, weight, height, onEditPress, onSettingsPress }: ProfileHeaderNewProps) {
    const { theme } = useTheme();
    const { history } = useWorkoutHistory();
    const insets = useSafeAreaInsets();
    const profileAccent = theme.colors.primary;
    const actionTextColor = theme.colors.onPrimary;

    const level = Math.floor(history.length / 5) + 1;
    const progressToNextLevel = (history.length % 5) / 5;

    // Calculate total duration from history
    const totalMinutes = React.useMemo(() => {
        return history.reduce((acc, w) => acc + (w.duration || 0), 0);
    }, [history]);
    const totalHours = Math.floor(totalMinutes / 60);

    const stats = [
        { label: 'Treinos', value: history.length, icon: 'barbell-outline' as const, color: profileAccent },
        { label: 'Horas', value: totalHours || '--', icon: 'time-outline' as const, color: '#38BDF8' },
        { label: 'IMC', value: (weight && height) ? (weight / (Math.pow(height / 100, 2))).toFixed(1) : '--', icon: 'fitness-outline' as const, color: '#10B981' },
        { label: 'Nível', value: level, icon: 'flash-outline' as const, color: '#F59E0B' }
    ];

    return (
        <View style={{ marginBottom: 12, overflow: 'hidden' }}>
            <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 16 }}>
                {/* Top Action Bar */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <View style={{
                        backgroundColor: theme.mode === 'dark' ? 'rgba(183, 245, 42, 0.12)' : 'rgba(77, 124, 15, 0.1)',
                        paddingHorizontal: 12,
                        paddingVertical: 4,
                        borderRadius: Radius.sm,
                        borderWidth: 1,
                        borderColor: theme.mode === 'dark' ? 'rgba(183, 245, 42, 0.25)' : 'rgba(77, 124, 15, 0.2)',
                    }}>
                        <Text style={{
                            color: theme.colors.primary,
                            fontSize: 10,
                            fontFamily: FontFamily.caption,
                            letterSpacing: 0.6,
                            fontWeight: '700',
                        }}>
                            ATLETA STRIVE
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={onSettingsPress}
                        activeOpacity={0.75}
                        style={{
                            width: 38,
                            height: 38,
                            borderRadius: Radius.sm,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: theme.colors.card,
                            borderWidth: 1,
                            borderColor: theme.colors.cardBorder,
                        }}
                    >
                        <Ionicons name="settings-outline" size={18} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Profile Main Info */}
                <View style={{ alignItems: 'center', marginBottom: 20 }}>
                    <View style={{ marginBottom: 12, position: 'relative' }}>
                        <View
                            style={{
                                borderColor: theme.colors.border,
                                borderRadius: Radius.xl,
                                width: 88,
                                height: 88,
                                borderWidth: 2,
                                padding: 2,
                            }}
                        >
                            <View style={{ width: '100%', height: '100%', borderRadius: Radius.lg, overflow: 'hidden', backgroundColor: theme.colors.backgroundTertiary }}>
                                {photoUri ? (
                                    <Image source={{ uri: photoUri }} style={{ width: '100%', height: '100%' }} contentFit="cover" cachePolicy="memory-disk" />
                                ) : (
                                    <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                                        <Ionicons name="person" size={38} color={theme.colors.textMuted} />
                                    </View>
                                )}
                            </View>
                        </View>
                        <View style={{
                            backgroundColor: theme.colors.primary,
                            position: 'absolute',
                            bottom: -2,
                            right: -2,
                            width: 26,
                            height: 26,
                            borderRadius: Radius.sm,
                            borderWidth: 2,
                            borderColor: theme.colors.background,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <Text style={{ color: theme.colors.onPrimary, fontSize: 11, fontFamily: FontFamily.sansBold }}>{level}</Text>
                        </View>
                    </View>

                    <View style={{ alignItems: 'center' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                            <Text style={{ color: theme.colors.text, fontSize: 20, fontFamily: FontFamily.display, letterSpacing: -0.3 }}>{userName}</Text>
                        </View>
                        {email && (
                            <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontFamily: FontFamily.sans, marginBottom: 4 }}>
                                {email}
                            </Text>
                        )}
                        <Text style={{ color: theme.colors.textSecondary, fontSize: 12, fontFamily: FontFamily.sans, textAlign: 'center', lineHeight: 16, paddingHorizontal: 20, marginBottom: 12 }} numberOfLines={2}>
                            {bio || 'Consistência é a chave da evolução.'}
                        </Text>

                        {/* Experience Bar */}
                        <View style={{ width: '75%', marginBottom: 4 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, paddingHorizontal: 2 }}>
                                <Text style={{ color: theme.colors.textMuted, fontSize: 10, fontFamily: FontFamily.caption, letterSpacing: 0.5 }}>NÍVEL {level}</Text>
                                <Text style={{ color: theme.colors.textSecondary, fontSize: 10, fontFamily: FontFamily.sansMedium }}>{(progressToNextLevel * 100).toFixed(0)}% → Nível {level + 1}</Text>
                            </View>
                            <View style={{ backgroundColor: theme.colors.backgroundTertiary, height: 5, borderRadius: 2.5, overflow: 'hidden' }}>
                                <Animated.View
                                    style={{
                                        width: `${progressToNextLevel * 100}%`,
                                        backgroundColor: theme.colors.primary,
                                        height: '100%',
                                        borderRadius: 2.5,
                                    }}
                                />
                            </View>
                        </View>
                    </View>
                </View>

                {/* Stats Cards - 4 Cards */}
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                    {stats.map((stat, index) => (
                        <View
                            key={index}
                            style={{
                                flex: 1,
                                backgroundColor: theme.colors.card,
                                borderColor: theme.colors.cardBorder,
                                borderWidth: 1,
                                borderRadius: Radius.md,
                                paddingVertical: 12,
                                paddingHorizontal: 4,
                                alignItems: 'center',
                            }}
                        >
                            <View style={{ backgroundColor: stat.color + '15', width: 28, height: 28, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                                <Ionicons name={stat.icon} size={14} color={stat.color} />
                            </View>
                            <Text style={{ color: theme.colors.text, fontSize: 16, fontFamily: FontFamily.display, fontVariant: ['tabular-nums'] }}>{stat.value}</Text>
                            <Text style={{ color: theme.colors.textMuted, fontSize: 9, fontFamily: FontFamily.caption, letterSpacing: 0.5 }}>{stat.label}</Text>
                        </View>
                    ))}
                </View>

                {/* Action Button */}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity
                        onPress={onEditPress}
                        activeOpacity={0.8}
                        style={{
                            flex: 1,
                            backgroundColor: profileAccent,
                            paddingVertical: 12,
                            borderRadius: Radius.md,
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'row',
                            gap: 6,
                        }}
                    >
                        <Ionicons name="create-outline" size={15} color={actionTextColor} />
                        <Text style={{ color: actionTextColor, fontFamily: FontFamily.sansSemiBold, fontSize: 13 }}>Editar Perfil</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}
