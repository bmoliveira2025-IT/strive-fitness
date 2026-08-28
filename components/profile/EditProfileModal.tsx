import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { TrainingObjective } from '../../context/UserProfileContext';
import { GradientButton } from '../ui/GradientButton';

interface EditProfileModalProps {
    visible: boolean;
    currentName?: string;
    currentWeight?: number;
    currentHeight?: number;
    currentObjective?: TrainingObjective;
    currentBio?: string;
    currentPhotoUri?: string;
    onSave: (name?: string, weight?: number, height?: number, objective?: TrainingObjective, bio?: string, photoUri?: string) => void;
    onClose: () => void;
}

const objectives: { value: TrainingObjective; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
    { value: 'hipertrofia', label: 'Hipertrofia', icon: 'fitness', color: '#4F8FF7' },
    { value: 'força', label: 'Força', icon: 'barbell', color: '#EF4444' },
    { value: 'cutting', label: 'Definição', icon: 'flame', color: '#22C55E' },
];

export function EditProfileModal({
    visible,
    currentName,
    currentWeight,
    currentHeight,
    currentObjective,
    currentBio,
    currentPhotoUri,
    onSave,
    onClose
}: EditProfileModalProps) {
    const [name, setName] = useState('');
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [bio, setBio] = useState('');
    const [activePhotoUri, setPhotoUri] = useState('');
    const [objective, setObjective] = useState<TrainingObjective | undefined>(currentObjective);
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();

    useEffect(() => {
        setName(currentName || '');
        setWeight(currentWeight ? currentWeight.toString() : '');
        setHeight(currentHeight ? currentHeight.toString() : '');
        setBio(currentBio || '');
        setPhotoUri(currentPhotoUri || '');
        setObjective(currentObjective);
    }, [currentName, currentWeight, currentHeight, currentBio, currentObjective, currentPhotoUri, visible]);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            setPhotoUri(result.assets[0].uri);
        }
    };

    const handleSave = () => {
        const weightNum = weight ? parseFloat(weight) : undefined;
        const heightNum = height ? parseFloat(height) : undefined;
        onSave(name, weightNum, heightNum, objective, bio, activePhotoUri || currentPhotoUri);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="none"
            presentationStyle="fullScreen"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1, backgroundColor: theme.colors.background }}
            >
                <View
                    style={{
                        backgroundColor: theme.colors.background,
                        flex: 1,
                        paddingTop: Math.max(insets.top, 16),
                    }}
                >
                    {/* Header */}
                    <View style={{ paddingHorizontal: 20, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: theme.colors.cardBorder }}>
                        <View>
                            <Text style={{ color: theme.colors.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.4 }}>Editar perfil</Text>
                            <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginTop: 2 }}>Atualize seus dados pessoais</Text>
                        </View>
                        <TouchableOpacity
                            onPress={onClose}
                            style={{ backgroundColor: theme.colors.backgroundTertiary }}
                            className="w-11 h-11 rounded-2xl items-center justify-center"
                        >
                            <Ionicons name="close" size={20} color={theme.colors.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={{ flex: 1 }}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        removeClippedSubviews
                        contentContainerStyle={{ padding: 20, paddingBottom: 28 }}
                    >
                        {/* Photo Picker */}
                        <View className="items-center mb-6">
                            <TouchableOpacity onPress={pickImage} className="relative">
                                <View
                                    style={{ borderColor: theme.colors.primary, borderRadius: 20, width: 88, height: 88 }}
                                    className="overflow-hidden border-2 p-1"
                                >
                                    <View className="w-full h-full rounded-2xl bg-zinc-800 overflow-hidden items-center justify-center">
                                        {activePhotoUri ? (
                                            <Image
                                                source={{ uri: activePhotoUri }}
                                                style={{ width: '100%', height: '100%' }}
                                                contentFit="cover"
                                                cachePolicy="memory-disk"
                                            />
                                        ) : (
                                            <Ionicons name="camera" size={32} color="#666" />
                                        )}
                                    </View>
                                </View>
                                <View style={{ backgroundColor: theme.colors.primary, borderColor: theme.colors.background }} className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full items-center justify-center border-4">
                                    <Ionicons name="pencil" size={16} color="black" />
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* Name Input */}
                        <View className="mb-6">
                            <Text style={{ color: theme.colors.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: 7 }}>Nome</Text>
                            <View style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder, minHeight: 52 }} className="rounded-2xl px-4 flex-row items-center border">
                                <Ionicons name="person-outline" size={18} color={theme.mode === 'light' ? theme.colors.primaryDark : theme.colors.primary} />
                                <TextInput
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="Seu nome"
                                    placeholderTextColor={theme.colors.textMuted}
                                    style={{ color: theme.colors.text }}
                                    className="flex-1 text-sm font-bold ml-3"
                                />
                            </View>
                        </View>

                        {/* Bio Input */}
                        <View className="mb-6">
                            <Text style={{ color: theme.colors.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: 7 }}>Biografia</Text>
                            <View style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder }} className="rounded-2xl p-4 flex-row items-start border">
                                <Ionicons name="information-circle-outline" size={18} color={theme.mode === 'light' ? theme.colors.primaryDark : theme.colors.primary} style={{ marginTop: 2 }} />
                                <TextInput
                                    value={bio}
                                    onChangeText={setBio}
                                    placeholder="Uma breve descrição sobre você..."
                                    placeholderTextColor={theme.colors.textMuted}
                                    style={{ color: theme.colors.text, minHeight: 64 }}
                                    className="flex-1 text-sm font-bold ml-3"
                                    multiline
                                    textAlignVertical="top"
                                    maxLength={150}
                                />
                            </View>
                            <Text style={{ color: theme.colors.textMuted, fontSize: 10, textAlign: 'right', marginTop: 5 }}>{bio.length}/150</Text>
                        </View>

                        {/* Stats Inputs Row */}
                        <View className="flex-row gap-4 mb-8">
                            <View className="flex-1">
                                <Text style={{ color: theme.colors.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: 7 }}>Peso (kg)</Text>
                                <View style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder, minHeight: 52 }} className="rounded-2xl px-4 flex-row items-center border">
                                    <TextInput
                                        value={weight}
                                        onChangeText={setWeight}
                                        placeholder="00"
                                        placeholderTextColor={theme.colors.textMuted}
                                        keyboardType="decimal-pad"
                                        style={{ color: theme.colors.text }}
                                        className="flex-1 text-sm font-black text-center"
                                    />
                                </View>
                            </View>
                            <View className="flex-1">
                                <Text style={{ color: theme.colors.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: 7 }}>Altura (cm)</Text>
                                <View style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder, minHeight: 52 }} className="rounded-2xl px-4 flex-row items-center border">
                                    <TextInput
                                        value={height}
                                        onChangeText={setHeight}
                                        placeholder="000"
                                        placeholderTextColor={theme.colors.textMuted}
                                        keyboardType="decimal-pad"
                                        style={{ color: theme.colors.text }}
                                        className="flex-1 text-sm font-black text-center"
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Objective Selector */}
                        <View className="mb-6">
                            <Text style={{ color: theme.colors.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: 10 }}>Objetivo do treino</Text>
                            <View className="flex-row gap-2">
                                {objectives.map((obj) => (
                                    <TouchableOpacity
                                        key={obj.value}
                                        onPress={() => setObjective(obj.value)}
                                        style={{
                                            backgroundColor: objective === obj.value ? theme.colors.primary + '20' : theme.colors.card,
                                            borderColor: objective === obj.value ? obj.color : theme.colors.cardBorder
                                        }}
                                        className="flex-1 rounded-2xl p-3 items-center border"
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons
                                            name={obj.icon}
                                            size={20}
                                            color={objective === obj.value ? obj.color : theme.colors.textMuted}
                                        />
                                        <Text style={{ color: objective === obj.value ? theme.colors.text : theme.colors.textSecondary }} className="text-[10px] font-bold mt-2 text-center">
                                            {obj.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </ScrollView>

                    {/* Action Buttons */}
                    <View
                        style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: Math.max(insets.bottom, 24) + 28, flexDirection: 'row', gap: 12, borderTopWidth: 1, borderTopColor: theme.colors.cardBorder, backgroundColor: theme.colors.card }}
                    >
                        <TouchableOpacity
                            onPress={onClose}
                            style={{ backgroundColor: theme.colors.backgroundTertiary, height: 56 }}
                            className="flex-1 rounded-2xl justify-center"
                        >
                            <Text style={{ color: theme.colors.text }} className="text-center font-bold text-sm">Cancelar</Text>
                        </TouchableOpacity>
                        <GradientButton
                            onPress={handleSave}
                            style={{
                                flex: 1,
                                height: 56,
                                borderRadius: 16,
                            }}
                            gradientStyle={{
                                height: '100%',
                            }}
                        >
                            <Text style={{ color: '#FFFFFF' }} className="text-center font-bold text-sm">Salvar alterações</Text>
                        </GradientButton>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}
