import { Ionicons } from "@expo/vector-icons";
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

  const { title, subtitle, actionText, icon, chipType, chipLabel } = useMemo(() => {
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
      };
    }
    if (hasTrainedToday) {
      return {
        title: "Treino Concluído",
        subtitle: "Excelente consistência! Mantenha a recuperação ativa.",
        actionText: "Ver Progresso",
        icon: "checkmark-circle" as const,
        chipType: "completed" as const,
        chipLabel: "Concluído",
      };
    }
    const hour = new Date().getHours();
    if (hour < 12) {
      return {
        title: "Disposição Matinal",
        subtitle: "Comece o dia com alta performance e foco.",
        actionText: "Iniciar Treino",
        icon: "fitness-outline" as const,
        chipType: "pending" as const,
        chipLabel: "Treino de Hoje",
      };
    }
    if (hour < 18) {
      return {
        title: "Foco Total",
        subtitle: "Hora de superar suas marcas e manter o ritmo.",
        actionText: "Iniciar Treino",
        icon: "barbell-outline" as const,
        chipType: "pending" as const,
        chipLabel: "Treino de Hoje",
      };
    }
    return {
      title: "Treino Noturno",
      subtitle: "Feche o dia com energia e dedicação.",
      actionText: "Iniciar Treino",
      icon: "moon-outline" as const,
      chipType: "pending" as const,
      chipLabel: "Treino de Hoje",
    };
  }, [hasTrainedToday, isWorkoutActive, activeExercises]);

  const handleAction = () => {
    if (isWorkoutActive) {
      router.navigate("/(tabs)/workout");
      return;
    }

    const today = new Date().toDateString();
    const trained = history.some(
      (h) => new Date(h.date).toDateString() === today,
    );

    if (trained) {
      router.navigate("/(tabs)/progress");
    } else {
      if (savedWorkouts.length > 0) {
        router.navigate("/(tabs)/workout");
      } else {
        router.navigate("/(tabs)/explore");
      }
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
            borderColor: theme.colors.cardBorder,
            backgroundColor: theme.colors.card,
            padding: 20,
            overflow: "hidden",
          }}
        >
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
                  gap: 4,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: Radius.sm,
                  backgroundColor: theme.colors.backgroundTertiary,
                }}
              >
                <Ionicons name="pulse" size={13} color={theme.colors.textSecondary} />
                <Text style={{ color: theme.colors.textSecondary, fontSize: 11, fontFamily: FontFamily.sansMedium }}>
                  Check-in
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Main Title & Subtitle */}
          <Text
            style={{
              color: theme.colors.text,
              fontSize: 22,
              fontFamily: FontFamily.display,
              letterSpacing: -0.3,
              marginBottom: 4,
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontSize: 13,
              fontFamily: FontFamily.sans,
              lineHeight: 18,
              marginBottom: 18,
            }}
          >
            {subtitle}
          </Text>

          {/* Action Row */}
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <TouchableOpacity
              onPress={handleAction}
              activeOpacity={0.85}
              style={{
                flex: 1,
                height: 46,
                borderRadius: Radius.md,
                backgroundColor: theme.colors.primary,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 8,
              }}
            >
              <Text
                style={{
                  color: theme.colors.onPrimary,
                  fontSize: 14,
                  fontFamily: FontFamily.sansSemiBold,
                }}
              >
                {actionText}
              </Text>
              <Ionicons
                name="arrow-forward"
                size={16}
                color={theme.colors.onPrimary}
              />
            </TouchableOpacity>

            {savedWorkouts.length > 0 && !hasTrainedToday && (
              <TouchableOpacity
                onPress={() => router.push("/explore")}
                activeOpacity={0.75}
                style={{
                  height: 46,
                  paddingHorizontal: 16,
                  borderRadius: Radius.md,
                  backgroundColor: theme.colors.backgroundTertiary,
                  borderColor: theme.colors.border,
                  borderWidth: 1,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="compass-outline" size={18} color={theme.colors.text} />
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
