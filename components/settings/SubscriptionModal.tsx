import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface SubscriptionModalProps {
    visible: boolean;
    onClose: () => void;
}

export function SubscriptionModal({ visible, onClose }: SubscriptionModalProps) {
    const { theme } = useTheme();

    const FeatureItem = ({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) => (
        <View className="flex-row items-center mb-4">
            <View className="w-8 h-8 rounded-full bg-blue-500/20 items-center justify-center mr-3">
                <Ionicons name={icon} size={18} color="#4F8FF7" />
            </View>
            <Text style={{ color: theme.colors.text }} className="text-base flex-1">{text}</Text>
        </View>
    );

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-end" style={{ backgroundColor: theme.colors.overlay }}>
                <View style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border, maxHeight: '90%' }} className="rounded-t-3xl p-6 border-t">
                    {/* Header */}
                    <View className="flex-row items-center justify-between mb-6">
                        <Text style={{ color: theme.colors.text }} className="text-xl font-bold">Sua Assinatura</Text>
                        <TouchableOpacity onPress={onClose} className="p-2">
                            <Ionicons name="close" size={24} color={theme.colors.textMuted} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Current Plan Card */}
                        <View className="rounded-2xl p-6 mb-8 overflow-hidden relative" style={{ backgroundColor: '#1E40AF' }}>
                            {/* Background Decor */}
                            <View className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500 rounded-full opacity-20" />
                            <View className="absolute -left-10 -bottom-10 w-40 h-40 bg-emerald-500 rounded-full opacity-20" />

                            <View className="flex-row justify-between items-start mb-4">
                                <View>
                                    <Text className="text-white font-bold text-2xl">Strive Premium</Text>
                                    <Text className="text-blue-200 text-sm">Plano Anual</Text>
                                </View>
                                <View className="bg-white/20 px-3 py-1 rounded-full">
                                    <Text className="text-white text-xs font-bold">ATIVO</Text>
                                </View>
                            </View>

                            <Text className="text-white/80 text-xs mb-4">Renova em 12 de Jan de 2027</Text>
                            <Text className="text-white font-bold text-lg">R$ 149,90<Text className="text-sm font-normal text-white/70">/ano</Text></Text>
                        </View>

                        {/* Features List */}
                        <Text style={{ color: theme.colors.text }} className="text-lg font-bold mb-4">Seus benefícios</Text>

                        <FeatureItem icon="infinite" text="Treinos ilimitados" />
                        <FeatureItem icon="barbell" text="Acesso a todos os exercícios" />
                        <FeatureItem icon="analytics" text="Estatísticas avançadas e gráficos" />
                        <FeatureItem icon="cloud-upload" text="Backup na nuvem e sincronização" />
                        <FeatureItem icon="sad-outline" text="Sem anúncios" />

                        <TouchableOpacity
                            className="mt-6 py-4 rounded-xl items-center border border-red-500/50"
                            style={{ backgroundColor: 'transparent' }}
                        >
                            <Text className="text-red-500 font-bold">Cancelar Assinatura</Text>
                        </TouchableOpacity>
                        <Text style={{ color: theme.colors.textMuted }} className="text-xs text-center mt-4 mb-8">
                            O cancelamento entrará em vigor ao final do período de cobrança atual.
                        </Text>

                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}
