import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Alert, ImageBackground, Platform, Text, TouchableOpacity, View, GestureResponderEvent } from 'react-native';
import { SavedWorkout } from '../context/SavedWorkoutsContext';
import { useTheme } from '../context/ThemeContext';
import { getDailyFitnessImage } from '../utils/imageHelper';
import { FontFamily, Radius } from '../constants/theme';

interface WorkoutCardProps {
    workout: SavedWorkout;
    onPress: () => void;
    onDelete?: () => void;
    onToggleFavorite?: () => void;
    onEdit?: () => void;
    layout?: 'horizontal' | 'vertical';
    showFavoriteButton?: boolean;
    showDeleteButton?: boolean;
    imageIndex?: number;
    style?: any;
}

export function WorkoutCard({
    workout,
    onPress,
    onDelete,
    onToggleFavorite,
    onEdit,
    layout = 'horizontal',
    showFavoriteButton = true,
    showDeleteButton = true,
    imageIndex = 0,
    style
}: WorkoutCardProps) {
    const { theme } = useTheme();

    const confirmWorkoutDeletion = () => {
        const confirmDelete = () => {
            if (onDelete) onDelete();
        };

        if (Platform.OS === 'web') {
            if (window.confirm(`Excluir o treino "${workout.name}"?`)) {
                confirmDelete();
            }
        } else {
            Alert.alert(
                "Excluir Treino",
                `Tem certeza que deseja excluir "${workout.name}"?`,
                [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Excluir", style: "destructive", onPress: confirmDelete }
                ]
            );
        }
    };

    const handleOptions = (e: GestureResponderEvent) => {
        e.stopPropagation();
        const actions: any[] = [];
        if (onEdit) {
            actions.push({ text: 'Editar treino', onPress: onEdit });
        }
        if (onToggleFavorite) {
            actions.push({
                text: workout.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos',
                onPress: onToggleFavorite,
            });
        }
        if (onDelete) {
            actions.push({ text: 'Excluir treino', style: 'destructive', onPress: confirmWorkoutDeletion });
        }
        actions.push({ text: 'Cancelar', style: 'cancel' });
        Alert.alert(workout.name, 'Escolha uma opção', actions);
    };

    const bgImage = getDailyFitnessImage(imageIndex);

    if (layout === 'vertical') {
        return (
            <TouchableOpacity
                onPress={onPress}
                style={[{
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.cardBorder,
                    borderRadius: Radius.lg,
                    borderWidth: 1,
                    overflow: 'hidden',
                    flex: 1,
                    minWidth: '47%',
                    maxWidth: '49%',
                }, style]}
                activeOpacity={0.85}
            >
                <View style={{ height: 110, position: 'relative' }}>
                    <ImageBackground
                        source={{ uri: bgImage }}
                        style={{ width: '100%', height: '100%' }}
                    >
                        <LinearGradient
                            colors={['rgba(13,15,18,0.2)', 'rgba(13,15,18,0.85)']}
                            style={{ position: 'absolute', inset: 0 }}
                        />
                        
                        {/* Badges */}
                        <View style={{ position: 'absolute', top: 8, left: 8, right: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            {workout.isAIGenerated && (
                                <View style={{ backgroundColor: theme.colors.primary, borderRadius: Radius.sm, paddingHorizontal: 6, paddingVertical: 2 }}>
                                    <Text style={{ color: theme.colors.onPrimary, fontSize: 9, fontFamily: FontFamily.sansBold }}>AI</Text>
                                </View>
                            )}
                            {workout.isFavorite && (
                                <View style={{ marginLeft: 'auto' }}>
                                    <Ionicons name="heart" size={16} color="#EF4444" />
                                </View>
                            )}
                        </View>
                    </ImageBackground>
                </View>

                <View style={{ padding: 12 }}>
                    <Text style={{ color: theme.colors.text, fontSize: 14, fontFamily: FontFamily.displaySemiBold, marginBottom: 4 }} numberOfLines={1}>
                        {workout.name}
                    </Text>

                    {/* Category and Exercise Count */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                        <Text style={{ color: theme.colors.textSecondary, fontSize: 11, fontFamily: FontFamily.sansMedium }}>
                            {workout.category || 'Geral'}
                        </Text>
                        <View style={{ backgroundColor: theme.colors.backgroundTertiary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.sm }}>
                            <Text style={{ color: theme.colors.textSecondary, fontSize: 10, fontFamily: FontFamily.sansSemiBold }}>
                                {workout.exercises.length} ex
                            </Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    }

    // Horizontal Compact Card
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.85}
            style={{ marginBottom: 12 }}
        >
            <View
                style={{
                    borderRadius: Radius.lg,
                    overflow: 'hidden',
                    minHeight: 96,
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.cardBorder,
                    borderWidth: 1,
                    flexDirection: 'row',
                    padding: 10,
                }}
            >
                <View style={{ width: 84, minHeight: 76, borderRadius: Radius.md, overflow: 'hidden' }}>
                    <ImageBackground source={{ uri: bgImage }} style={{ flex: 1 }}>
                        <LinearGradient
                            colors={['rgba(13,15,18,0.1)', 'rgba(13,15,18,0.7)']}
                            style={{ position: 'absolute', inset: 0 }}
                        />
                        {workout.isAIGenerated && (
                            <View style={{ position: 'absolute', left: 6, bottom: 6, backgroundColor: theme.colors.primary, borderRadius: Radius.sm, paddingHorizontal: 6, paddingVertical: 2 }}>
                                <Text style={{ color: theme.colors.onPrimary, fontSize: 8, fontFamily: FontFamily.sansBold }}>AI</Text>
                            </View>
                        )}
                    </ImageBackground>
                </View>

                <View style={{ flex: 1, paddingLeft: 12, paddingVertical: 2, justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                            <Text style={{ color: theme.colors.text, fontSize: 15, fontFamily: FontFamily.displaySemiBold, letterSpacing: -0.2 }} numberOfLines={1}>
                                {workout.name}
                            </Text>
                            <Text style={{ color: theme.colors.textMuted, fontSize: 11, fontFamily: FontFamily.sans, marginTop: 2 }} numberOfLines={1}>
                                {workout.category || 'Rotina personalizada'}
                            </Text>
                        </View>
                        {(showFavoriteButton || showDeleteButton) && (onToggleFavorite || onDelete) && (
                            <TouchableOpacity onPress={handleOptions} accessibilityLabel={`Opções de ${workout.name}`} style={{ width: 32, height: 32, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.backgroundTertiary }}>
                                <Ionicons name="ellipsis-horizontal" size={16} color={theme.colors.textSecondary} />
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Ionicons name="barbell-outline" size={13} color={theme.colors.textMuted} />
                            <Text style={{ color: theme.colors.textSecondary, fontSize: 11, fontFamily: FontFamily.sansMedium }}>
                                {workout.exercises.length} exercícios
                            </Text>
                        </View>
                        {workout.isFavorite && <Ionicons name="heart" size={13} color="#EF4444" />}
                        <View style={{ marginLeft: 'auto', width: 26, height: 26, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.backgroundTertiary }}>
                            <Ionicons name="chevron-forward" size={14} color={theme.colors.textSecondary} />
                        </View>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}
