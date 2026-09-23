import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSavedWorkouts } from "../../context/SavedWorkoutsContext";
import { useTheme } from "../../context/ThemeContext";
import { useUserStore } from "../../store/useUserStore";
import { useWorkoutHistory } from "../../context/WorkoutHistoryContext";
import { useWorkoutStore } from "../../store/useWorkoutStore";
import { StatusChip } from "../feedback/StatusChip";
import { VitalsCheckInModal } from "./VitalsCheckInModal";
import { FontFamily, Radius } from "../../constants/theme";
import { nextWorkoutInRoutine } from '../../lib/sessionFlow';

export function HeroCard() {
  const { theme } = useTheme();
  const router = useRouter();
  const { history } = useWorkoutHistory();
  const { savedWorkouts } = useSavedWorkouts();
  const { isWorkoutActive, activeExercises } = useWorkoutStore();
  const { profile } = useUserStore();
  const [showVitalsModal, setShowVitalsModal] = useState(false);

  // Check if vitals check-in is needed (once per day)
  const needsCheckIn = useMemo(() => {
    if (!profile?.weeklyMonitoring || profile.weeklyMonitoring.length === 0)
      return true;
    const lastEntry =
      profile.weeklyMonitoring[profile.weeklyMonitoring.length - 1];
    const lastDate = new Date(lastEntry.date).toDateString();
    const today = new Date().toDateString();
    return lastDate !== today;
  }, [profile]);

  const hasTrainedToday = useMemo(() => {
    const today = new Date().toDateString();
    return history.some((h) => new Date(h.date).toDateString() === today);
  }, [history]);

  // Pick best next workout
  const nextWorkout = useMemo(() => {
    return nextWorkoutInRoutine(savedWorkouts, history);
  }, [savedWorkouts, history]);

  const { title, subtitle, actionText, icon, chipType, chipLabel, exerciseList, estimatedMin } = useMemo(() => {
    if (isWorkoutActive) {
      const completedSets = activeExercises.reduce((acc, ex) => acc + (ex.sets?.filter((s: any) => s.completed).length || 0), 0);
      const totalSets = activeExercises.reduce((acc, ex) => acc + (ex.sets?.length || 0), 0);
      const pct = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
      return {
        title: "Treino em Andamento",
        subtitle: `${completedSets} de ${totalSets} séries concluídas (${pct}%). Toque para continuar.`,
        actionText: "Continuar Treino",
        icon: "play" as const,
        chipType: "active" as const,
        chipLabel: `${pct}% Concluído`,
        exerciseList: [],
        estimatedMin: 0,
      };
    }
    if (nextWorkout) {
      const count = nextWorkout.exercises?.length ?? 0;
      const min = Math.max(30, count * 5 + 10);
      const exNames = (nextWorkout.exercises || []).slice(0, 3).map((e: any) => e.name || e.exercise?.name).filter(Boolean);
      return {
        title: nextWorkout.name,
        subtitle: `${hasTrainedToday ? 'Treino de hoje concluído • ' : ''}${count} exercícios • ~${min} min${nextWorkout.routineName ? ` • ${nextWorkout.routineName}` : ''}`,
        actionText: hasTrainedToday ? 'Ver próximo treino' : 'Ver treino de hoje',
        icon: "play" as const,
        chipType: hasTrainedToday ? 'completed' as const : 'pending' as const,
        chipLabel: hasTrainedToday ? 'Hoje concluído' : nextWorkout.routineId ? 'Próximo da sequência' : 'Treino de hoje',
        exerciseList: exNames,
        estimatedMin: min,
      };
    }
    if (hasTrainedToday) {
      return {
        title: 'Treino de hoje concluído', subtitle: 'Veja sua evolução ou planeje a próxima sessão.',
        actionText: 'Ver progresso', icon: 'checkmark-circle' as const,
        chipType: 'completed' as const, chipLabel: 'Concluído hoje', exerciseList: [], estimatedMin: 0,
      };
    }
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Disposição Matinal" : hour < 18 ? "Foco Total" : "Treino Noturno";
    return {
      title: greeting,
      subtitle: "Comece sua sessão agora ou monte uma nova ficha de treino personalizada.",
      actionText: "Iniciar Treino Livre",
      icon: "barbell-outline" as const,
      chipType: "pending" as const,
      chipLabel: "Treino de Hoje",
      exerciseList: [],
      estimatedMin: 0,
    };
  }, [hasTrainedToday, isWorkoutActive, activeExercises, nextWorkout]);

  const handleAction = () => {
    if (isWorkoutActive) {
      router.navigate("/(tabs)/workout");
      return;
    }

    if (nextWorkout) {
      router.push({
        pathname: "/preview",
        params: { id: nextWorkout.id, type: "saved" },
      });
      return;
    }

    if (hasTrainedToday) { router.navigate('/(tabs)/progress'); return; }

    if (savedWorkouts.length > 0) {
      router.navigate("/(tabs)/workout");
    } else {
      router.navigate("/(tabs)/explore");
    }
  };

  return (
    <>
      <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
        <Animated.View
          entering={FadeInDown.duration(600)}
          style={{
            borderRadius: Radius.lg,
            borderWidth: 1,
            borderColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : theme.colors.cardBorder,
            backgroundColor: theme.colors.card,
            padding: 20,
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Subtle Ambient Background Gradient */}
          <LinearGradient
            colors={
              theme.mode === 'dark'
                ? ['rgba(56, 189, 248, 0.04)', 'rgba(0, 0, 0, 0)']
                : ['rgba(2, 132, 199, 0.03)', 'rgba(255, 255, 255, 0)']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: 'absolute', inset: 0 }}
          />

          {/* Top Badge & Check-in link */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <StatusChip
              type={chipType}
              label={chipLabel}
              size="sm"
            />

            {needsCheckIn && (
              <TouchableOpacity
                onPress={() => setShowVitalsModal(true)}
                activeOpacity={0.75}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: Radius.full,
                  backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.05)',
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                }}
              >
                <Ionicons name="pulse" size={13} color={theme.colors.primary} />
                <Text style={{ color: theme.colors.text, fontSize: 11, fontFamily: FontFamily.sansSemiBold }}>
                  Check-in Diário
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Main Title & Subtitle */}
          <Text
            numberOfLines={2}
            style={{
              color: theme.colors.text,
              fontSize: 22,
              fontFamily: FontFamily.display,
              letterSpacing: -0.4,
              marginBottom: 4,
            }}
          >
            {title}
          </Text>
          <Text
            numberOfLines={2}
            style={{
              color: theme.colors.textSecondary,
              fontSize: 13,
              fontFamily: FontFamily.sans,
              lineHeight: 18,
              marginBottom: exerciseList.length > 0 ? 12 : 18,
            }}
          >
            {subtitle}
          </Text>

          {/* Exercise Preview Chips (when next workout exists) */}
          {exerciseList.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {exerciseList.map((name: string, i: number) => (
                <View
                  key={i}
                  style={{
                    backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: Radius.sm,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                  }}
                >
                  <Text numberOfLines={1} style={{ color: theme.colors.textSecondary, fontSize: 11, fontFamily: FontFamily.sansMedium }}>
                    {name}
                  </Text>
                </View>
              ))}
              {(nextWorkout?.exercises?.length ?? 0) > 3 && (
                <View
                  style={{
                    backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                    paddingHorizontal: 7,
                    paddingVertical: 3,
                    borderRadius: Radius.sm,
                  }}
                >
                  <Text style={{ color: theme.colors.textMuted, fontSize: 11, fontFamily: FontFamily.sansSemiBold }}>
                    +{ (nextWorkout?.exercises?.length ?? 0) - 3} mais
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Active Workout Progress Bar */}
          {isWorkoutActive && (
            <View style={{ marginBottom: 16 }}>
              <View style={{ height: 6, backgroundColor: theme.colors.cardBorder, borderRadius: 3, overflow: 'hidden' }}>
                <View
                  style={{
                    width: `${Math.min(100, Math.round((activeExercises.reduce((acc, ex) => acc + (ex.sets?.filter((s: any) => s.completed).length || 0), 0) / Math.max(1, activeExercises.reduce((acc, ex) => acc + (ex.sets?.length || 0), 0))) * 100))}%`,
                    height: '100%',
                    backgroundColor: theme.colors.primary,
                    borderRadius: 3,
                  }}
                />
              </View>
            </View>
          )}

          {/* Action Row */}
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <TouchableOpacity
              onPress={handleAction}
              activeOpacity={0.85}
              style={{
                flex: 1,
                height: 48,
                borderRadius: Radius.md,
                backgroundColor: theme.colors.primary,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 8,
                shadowColor: theme.colors.primary,
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.25,
                shadowRadius: 6,
                elevation: 3,
              }}
            >
              <Ionicons
                name={icon}
                size={17}
                color={theme.colors.onPrimary}
              />
              <Text
                style={{
                  color: theme.colors.onPrimary,
                  fontSize: 14,
                  fontFamily: FontFamily.sansSemiBold,
                }}
              >
                {actionText}
              </Text>
            </TouchableOpacity>

            {!isWorkoutActive && (
              <TouchableOpacity
                onPress={() => router.push("/explore")}
                activeOpacity={0.75}
                style={{
                  height: 48,
                  width: 48,
                  borderRadius: Radius.md,
                  backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : theme.colors.backgroundTertiary,
                  borderColor: theme.colors.border,
                  borderWidth: 1,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="compass-outline" size={20} color={theme.colors.text} />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>

      {/* Vitals Check-In Modal */}
      <VitalsCheckInModal
        visible={showVitalsModal}
        onClose={() => setShowVitalsModal(false)}
      />
    </>
  );
}
