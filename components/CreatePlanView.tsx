import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Image, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { LibraryView } from './LibraryView';
import { GradientButton } from './ui/GradientButton';

interface Exercise {
    id: string;
    name: string;
    image_url?: string;
    video_url?: string;
    body_parts?: string[];
    equipment?: string[];
    targetSets?: string;
    targetReps?: string;
    targetWeight?: string;
}

interface CreatePlanViewProps {
    onClose: () => void;
    onSave: (name: string, exercises: Exercise[]) => void;
    initialName?: string;
    initialExercises?: Exercise[];
}

interface PlanExerciseItemProps {
    ex: Exercise;
    onRemove: (id: string) => void;
    onUpdate: (id: string, updates: Partial<Exercise>) => void;
}

const PlanExerciseItem = ({ ex, onRemove, onUpdate }: PlanExerciseItemProps) => {
    const { theme } = useTheme();
    const [isExpanded, setIsExpanded] = useState(false);

    // Default values if not set
    const sets = ex.targetSets || '3';
    const reps = ex.targetReps || '10';
    const weight = ex.targetWeight || '';

    return (
        <View
            style={{
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
                boxShadow: '0px 2px 4px rgba(0,0,0,0.05)'
            }}
            className="rounded-2xl border overflow-hidden"
        >
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setIsExpanded(!isExpanded)}
                className="flex-row items-center p-3"
            >
                <View className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden mr-4">
                    {ex.image_url ? (
                        <Image source={{ uri: ex.image_url }} className="w-full h-full" resizeMode="cover" />
                    ) : (
                        <View className="flex-1 items-center justify-center">
                            <Ionicons name="fitness" size={20} color={theme.colors.textMuted} />
                        </View>
                    )}
                </View>

                <View className="flex-1">
                    <Text style={{ color: theme.colors.text }} className="font-bold text-base" numberOfLines={1}>{ex.name}</Text>
                    <Text style={{ color: theme.colors.textMuted }} className="text-xs">
                        {sets} x {reps} {weight ? `@ ${weight}kg` : ''}
                    </Text>
                </View>

                <View className="flex-row items-center">
                    <TouchableOpacity
                        onPress={(e) => { e.stopPropagation(); onRemove(ex.id); }}
                        style={{ backgroundColor: '#EF444415' }}
                        className="p-2 rounded-lg mr-2"
                    >
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                    <Ionicons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={20}
                        color={theme.colors.textMuted}
                    />
                </View>
            </TouchableOpacity>

            {isExpanded && (
                <View className="px-4 pb-4 pt-1 flex-row gap-3">
                    <View className="flex-1">
                        <Text style={{ color: theme.colors.textMuted }} className="text-[10px] font-bold uppercase mb-1 ml-1">Séries</Text>
                        <TextInput
                            value={sets}
                            onChangeText={(v) => onUpdate(ex.id, { targetSets: v })}
                            keyboardType="numeric"
                            style={{ backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }}
                            className="p-3 rounded-xl border text-center font-bold"
                        />
                    </View>
                    <View className="flex-1">
                        <Text style={{ color: theme.colors.textMuted }} className="text-[10px] font-bold uppercase mb-1 ml-1">Reps</Text>
                        <TextInput
                            value={reps}
                            onChangeText={(v) => onUpdate(ex.id, { targetReps: v })}
                            keyboardType="numeric"
                            style={{ backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }}
                            className="p-3 rounded-xl border text-center font-bold"
                        />
                    </View>
                    <View className="flex-1">
                        <Text style={{ color: theme.colors.textMuted }} className="text-[10px] font-bold uppercase mb-1 ml-1">Peso (kg)</Text>
                        <TextInput
                            value={weight}
                            onChangeText={(v) => onUpdate(ex.id, { targetWeight: v })}
                            keyboardType="numeric"
                            placeholder="Opt"
                            placeholderTextColor={theme.colors.textMuted}
                            style={{ backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }}
                            className="p-3 rounded-xl border text-center font-bold"
                        />
                    </View>
                </View>
            )}
        </View>
    );
};

export function CreatePlanView({ onClose, onSave, initialName = '', initialExercises = [] }: CreatePlanViewProps) {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();

    const [planName, setPlanName] = useState(initialName);
    const [exercises, setExercises] = useState<Exercise[]>(initialExercises);
    const [showLibrary, setShowLibrary] = useState(false);

    const handleSave = () => {
        if (!planName.trim()) {
            Alert.alert('Nome Obrigatório', 'Por favor, dê um nome ao seu plano.');
            return;
        }
        if (exercises.length === 0) {
            Alert.alert('Adicione Exercícios', 'Seu plano precisa de pelo menos um exercício.');
            return;
        }
        onSave(planName.trim(), exercises);
    };

    const removeExercise = (id: string) => {
        setExercises(prev => prev.filter(e => e.id !== id));
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>

            {/* Header */}
            <View style={{ backgroundColor: theme.colors.background, paddingTop: Math.max(insets.top, 16) }} className="px-4 pb-4 border-b border-zinc-100 dark:border-zinc-800 flex-row items-center justify-between">
                <TouchableOpacity
                    onPress={onClose}
                    style={{ backgroundColor: theme.colors.card }}
                    className="w-10 h-10 rounded-full items-center justify-center"
                >
                    <Ionicons name="close" size={24} color={theme.colors.text} />
                </TouchableOpacity>

                <Text style={{ color: theme.colors.text }} className="text-lg font-bold">Criar Novo Plano</Text>

                <GradientButton
                    onPress={handleSave}
                    disabled={!planName.trim() || exercises.length === 0}
                    style={{
                        opacity: (!planName.trim() || exercises.length === 0) ? 0.5 : 1,
                        borderRadius: 9999,
                        boxShadow: (!planName.trim() || exercises.length === 0) ? 'none' : '0px 4px 10px rgba(0,0,0,0.1)',
                        elevation: 2
                    }}
                    gradientStyle={{
                        paddingHorizontal: 24,
                        paddingVertical: 8,
                    }}
                >
                    <Text className="text-white font-black uppercase text-[10px] tracking-widest">Salvar</Text>
                </GradientButton>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>

                {/* Plan Name Input */}
                <View className="mb-8">
                    <Text style={{ color: theme.colors.textMuted }} className="text-xs font-bold uppercase tracking-wider mb-2 ml-1">Nome do Plano</Text>
                    <TextInput
                        value={planName}
                        onChangeText={setPlanName}
                        placeholder="Ex: Superiores Força, Perna Hipertrofia..."
                        placeholderTextColor={theme.colors.textMuted}
                        style={{
                            backgroundColor: theme.colors.card,
                            color: theme.colors.text,
                            fontSize: 18,
                            borderColor: theme.colors.border,
                            boxShadow: '0px 4px 10px rgba(0,0,0,0.02)'
                        }}
                        className="rounded-2xl p-4 border font-semibold"
                    />
                </View>

                {/* Exercises Section */}
                <View>
                    <View className="flex-row items-center justify-between mb-4">
                        <Text style={{ color: theme.colors.textMuted }} className="text-xs font-bold uppercase tracking-wider ml-1">
                            Exercícios {exercises.length > 0 && `(${exercises.length})`}
                        </Text>
                        {exercises.length > 0 && (
                            <TouchableOpacity onPress={() => setShowLibrary(true)}>
                                <Text style={{ color: theme.colors.primary }} className="text-xs font-bold">+ Adicionar</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {exercises.length === 0 ? (
                        <TouchableOpacity
                            onPress={() => setShowLibrary(true)}
                            style={{
                                backgroundColor: theme.colors.card,
                                borderStyle: 'dashed',
                                borderColor: theme.colors.border,
                                borderRadius: 20
                            }}
                            className="p-8 items-center justify-center border-2"
                        >
                            <View style={{ backgroundColor: theme.colors.primary + '15' }} className="w-16 h-16 rounded-full items-center justify-center mb-4">
                                <Ionicons name="add" size={32} color={theme.colors.primary} />
                            </View>
                            <Text style={{ color: theme.colors.text }} className="font-bold text-lg mb-1 text-center">Adicionar Exercícios</Text>
                            <Text style={{ color: theme.colors.textMuted }} className="text-sm text-center">
                                Toque para abrir a biblioteca e selecionar os exercícios do seu treino.
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <View className="gap-3">
                            {exercises.map((ex) => (
                                <PlanExerciseItem
                                    key={ex.id}
                                    ex={ex}
                                    onRemove={removeExercise}
                                    onUpdate={(id, updates) => {
                                        setExercises(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
                                    }}
                                />
                            ))}

                            {/* Add More Button */}
                            <TouchableOpacity
                                onPress={() => setShowLibrary(true)}
                                activeOpacity={0.7}
                                style={{
                                    backgroundColor: theme.colors.card,
                                    borderColor: theme.colors.primary,
                                    borderWidth: 2, // slightly thicker for dashed visibility
                                    borderStyle: 'dashed'
                                }}
                                className="flex-row items-center justify-center p-4 rounded-2xl mt-4"
                            >
                                <Ionicons name="add" size={24} color={theme.colors.primary} />
                                <Text style={{ color: theme.colors.primary }} className="font-bold text-base ml-2">Adicionar Exercício</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

            </ScrollView>

            {/* Library Modal */}
            <Modal
                visible={showLibrary}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowLibrary(false)}
            >
                <View style={{ flex: 1, backgroundColor: theme.colors.background, paddingTop: Math.max(insets.top, 16) }}>
                    <View style={{ backgroundColor: theme.colors.background }} className="px-4 py-4 flex-row justify-between items-center border-b border-zinc-100 dark:border-zinc-800">
                        <Text style={{ color: theme.colors.text }} className="text-lg font-bold">Selecionar Exercícios</Text>
                        <TouchableOpacity onPress={() => setShowLibrary(false)}>
                            <Text style={{ color: theme.colors.primary }} className="font-bold">Concluir</Text>
                        </TouchableOpacity>
                    </View>
                    <LibraryView
                        allowMultiSelect={true}
                        onBatchSelect={(selected) => {
                            // Assuming LibraryView returns array of exercises
                            // We need to map or just add them.
                            // Since LibraryView manages selection internally, it returns all selected in batch.
                            // We should check duplicates.
                            setExercises(prev => {
                                const newExercises = [...prev];
                                selected.forEach((newEx: any) => {
                                    if (!newExercises.find(e => e.id === newEx.id.toString())) {
                                        newExercises.push({
                                            id: newEx.id.toString(),
                                            name: newEx.name,
                                            image_url: newEx.image_url,
                                            video_url: newEx.video_url,
                                            body_parts: newEx.body_parts,
                                            equipment: newEx.equipment
                                        });
                                    }
                                });
                                return newExercises;
                            });
                            setShowLibrary(false);
                        }}
                        onExerciseSelect={(exercise: any) => {
                            // Single select handler (toggle)
                            setExercises(prev => {
                                const exists = prev.find(e => e.id === exercise.id.toString());
                                if (exists) {
                                    return prev.filter(e => e.id !== exercise.id.toString());
                                }
                                return [...prev, {
                                    id: exercise.id.toString(),
                                    name: exercise.name,
                                    image_url: exercise.image_url,
                                    video_url: exercise.video_url,
                                    body_parts: exercise.body_parts,
                                    equipment: exercise.equipment
                                }];
                            });
                        }}
                    />
                </View>
            </Modal>
        </View>
    );
}
