import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExerciseDetailContent } from '../../components/ExerciseDetailContent';
import { useTheme } from '../../context/ThemeContext';
import { useWorkoutStore } from '../../store/useWorkoutStore';
// @ts-ignore
import exercises from '../../assets/exercises.json';

export default function ExerciseDetailScreen() {
    const { id, source, workoutId } = useLocalSearchParams();
    const router = useRouter();
    const { isWorkoutActive } = useWorkoutStore();
    const exerciseId = id?.toString() || '';
    const exercise = exercises.find((e: any) => e.id.toString() === exerciseId);

    const handleGoBack = () => {
        const sourceVal = Array.isArray(source) ? source[0] : source;
        console.log('[ExerciseDetail] Back pressed. Source:', sourceVal, 'CanGoBack:', router.canGoBack());

        // Exception: For preview, we MUST ensure we return with the modal open,
        // so we force navigation with params instead of generic back()
        if (sourceVal === 'preview') {
            const wId = Array.isArray(workoutId) ? workoutId[0] : workoutId;
            if (wId) {
                // Return to gym workout screen and trigger preview modal
                router.navigate({ pathname: '/workout', params: { loadWorkoutId: wId, preview: 'true' } });
                return;
            }
        }

        // Fix: Prioritize navigation history stack for other cases
        if (router.canGoBack()) {
            router.back();
            return;
        }

        // Fallback: Reconstruct path based on source if history is lost
        if (sourceVal === 'library') {
            router.replace({ pathname: '/workout', params: { tab: 'library' } });
        } else if (sourceVal === 'explore') {
            // Return to explore screen
            router.navigate('/explore');
        } else if (sourceVal === 'workout') {
            // Explicit return to workout screen (planning or active)
            router.navigate('/workout');
        } else if (sourceVal === 'home') {
            // Return to home dashboard
            router.replace('/');
        } else if (isWorkoutActive) {
            // Default to workout if active and we don't know where we came from
            router.navigate('/workout');
        } else {
            // Absolute last resort
            router.replace('/');
        }
    };

    const { theme } = useTheme();
    const insets = useSafeAreaInsets();

    if (!exercise) {
        return (
            <View className="flex-1 items-center justify-center bg-background">
                <Text style={{ color: theme.colors.text }}>Exercício não encontrado.</Text>
            </View>
        );
    }

    return (
        <View style={{ backgroundColor: 'transparent', paddingTop: Math.max(insets.top, 20) }} className="flex-1">
            <StatusBar style={theme.mode === 'light' ? 'dark' : 'light'} translucent />

            <Stack.Screen options={{ headerShown: false }} />

            <View className="flex-1 relative">
                {/* Premium Back Button - Positioned relative to the safe-padded container */}
                <TouchableOpacity
                    onPress={handleGoBack}
                    className="absolute left-6 z-50 p-2.5 rounded-full border shadow-2xl"
                    style={{
                        top: 0, // Absolute top of the safe-padded container
                        backgroundColor: theme.colors.card,
                        borderColor: theme.colors.border,
                    }}
                >
                    <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
                </TouchableOpacity>

                <ExerciseDetailContent exerciseId={exerciseId} />
            </View>
        </View>
    );
}
