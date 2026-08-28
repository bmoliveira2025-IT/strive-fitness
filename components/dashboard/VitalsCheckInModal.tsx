import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useUserStore } from '../../store/useUserStore';

interface VitalsCheckInModalProps {
    visible: boolean;
    onClose: () => void;
}

export function VitalsCheckInModal({ visible, onClose }: VitalsCheckInModalProps) {
    const { theme } = useTheme();
    const { addWeeklyMonitoring, profile } = useUserStore();
    const insets = useSafeAreaInsets();

    const [sleep, setSleep] = useState(3);
    const [energy, setEnergy] = useState(3);
    const [stress, setStress] = useState(3);
    const [recovery, setRecovery] = useState(3);

    const handleSave = async () => {
        const currentWeight = profile?.weight || profile?.weightHistory?.[profile.weightHistory.length - 1]?.value || 0;

        await addWeeklyMonitoring({
            date: new Date().toISOString(),
            weight: currentWeight,
            sleepQuality: sleep,
            energyLevel: energy,
            stressLevel: stress,
            recoveryLevel: recovery
        });

        onClose();
    };

    const RatingSlider = ({
        label,
        value,
        onChange,
        icon,
        color
    }: {
        label: string;
        value: number;
        onChange: (v: number) => void;
        icon: string;
        color: string;
    }) => (
        <View className="mb-6">
            <View className="flex-row items-center mb-3">
                <View style={{ backgroundColor: color + '15' }} className="w-10 h-10 rounded-full items-center justify-center mr-3">
                    <Ionicons name={icon as any} size={20} color={color} />
                </View>
                <View className="flex-1">
                    <Text style={{ color: theme.colors.text }} className="text-base font-bold">
                        {label}
                    </Text>
                    <Text style={{ color: theme.colors.textMuted }} className="text-xs">
                        {value}/5
                    </Text>
                </View>
            </View>

            <View className="flex-row justify-between px-2">
                {[1, 2, 3, 4, 5].map((num) => (
                    <TouchableOpacity
                        key={num}
                        onPress={() => onChange(num)}
                        style={{
                            backgroundColor: value >= num ? color : theme.colors.backgroundTertiary,
                            borderColor: value >= num ? color : theme.colors.border,
                            width: 52,
                            height: 52
                        }}
                        className="rounded-2xl border-2 items-center justify-center"
                    >
                        <Text
                            style={{ color: value >= num ? '#FFF' : theme.colors.textMuted }}
                            className="text-lg font-black"
                        >
                            {num}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black/60 justify-end">
                <TouchableOpacity
                    className="flex-1"
                    activeOpacity={1}
                    onPress={onClose}
                />

                <Animated.View
                    entering={FadeInUp.duration(400)}
                    style={{
                        backgroundColor: theme.colors.background,
                        paddingBottom: Math.max(insets.bottom + 24, 40)
                    }}
                    className="rounded-t-3xl p-6"
                >
                    {/* Header */}
                    <View className="flex-row items-center justify-between mb-6">
                        <View>
                            <Text style={{ color: theme.colors.text }} className="text-2xl font-black">
                                Como você está?
                            </Text>
                            <Text style={{ color: theme.colors.textMuted }} className="text-sm mt-1">
                                Check-in rápido diário
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={onClose}
                            style={{ backgroundColor: theme.colors.backgroundTertiary }}
                            className="w-10 h-10 rounded-full items-center justify-center"
                        >
                            <Ionicons name="close" size={24} color={theme.colors.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Rating Sliders */}
                    <RatingSlider
                        label="Qualidade do Sono"
                        value={sleep}
                        onChange={setSleep}
                        icon="moon"
                        color="#8B5CF6"
                    />

                    <RatingSlider
                        label="Nível de Energia"
                        value={energy}
                        onChange={setEnergy}
                        icon="flash"
                        color="#F59E0B"
                    />

                    <RatingSlider
                        label="Recuperação Muscular"
                        value={recovery}
                        onChange={setRecovery}
                        icon="fitness"
                        color="#3B82F6"
                    />

                    <RatingSlider
                        label="Estresse/Tensão"
                        value={stress}
                        onChange={setStress}
                        icon="alert-circle"
                        color="#EF4444"
                    />

                    {/* Save Button */}
                    <TouchableOpacity
                        onPress={handleSave}
                        style={{
                            backgroundColor: theme.colors.primary,
                            boxShadow: '0px 4px 10px rgba(0,0,0,0.1)',
                            elevation: 4
                        }}
                        className="rounded-2xl py-4 items-center mt-2"
                    >
                        <Text className="text-black text-lg font-black uppercase tracking-wider">
                            Salvar Check-in
                        </Text>
                    </TouchableOpacity>

                    {/* Info Text */}
                    <Text style={{ color: theme.colors.textMuted }} className="text-xs text-center mt-4">
                        Esses dados ajudam o app a recomendar treinos mais adequados para você
                    </Text>
                </Animated.View>
            </View>
        </Modal>
    );
}
