import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface ProfileHeaderProps {
    userName?: string;
    onEditPress: () => void;
}

export function ProfileHeader({ userName = "Atleta", onEditPress }: ProfileHeaderProps) {
    const { theme } = useTheme();

    return (
        <View className="px-5 pt-14 pb-6">
            <View style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder, borderRadius: 20 }}
                className="p-6 border"
            >
                <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center">
                        <View style={{ backgroundColor: theme.colors.backgroundTertiary, borderColor: theme.colors.border }}
                            className="w-16 h-16 rounded-full items-center justify-center mr-4 border-2"
                        >
                            <Ionicons name="person" size={32} color={theme.colors.primary} />
                        </View>
                        <View>
                            <Text style={{ color: theme.colors.text }} className="text-2xl font-bold">{userName}</Text>
                            <Text style={{ color: theme.colors.textSecondary }} className="text-sm mt-1">Seu Perfil</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={onEditPress}
                        style={{ backgroundColor: theme.colors.backgroundTertiary, borderColor: theme.colors.border }}
                        className="p-3 rounded-full border"
                    >
                        <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}
