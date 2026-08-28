import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { ImageBackground, Text, TouchableOpacity, View } from "react-native";
import { useSavedWorkouts } from "../../context/SavedWorkoutsContext";
import { useTheme } from "../../context/ThemeContext";
import { useWorkoutHistory } from "../../context/WorkoutHistoryContext";
import { getDailyFitnessImage } from "../../utils/imageHelper";
import { FontFamily, Radius } from "../../constants/theme";

export function NextWorkoutCard() {
  const { theme } = useTheme();
  const router = useRouter();
  const { history } = useWorkoutHistory();
  const { savedWorkouts } = useSavedWorkouts();

  const hasTrainedToday = useMemo(() => {
    const today = new Date().toDateString();
    return history.some((h) => new Date(h.date).toDateString() === today);
  }, [history]);

  // Pick best workout: favorited first, then most recently used, then first
  const nextWorkout = useMemo(() => {
    if (!savedWorkouts.length) return null;
    const favorite = savedWorkouts.find((w) => w.isFavorite);
    if (favorite) return favorite;

    const withLastDone = savedWorkouts.filter((w) => w.lastDone);
    if (withLastDone.length) {
      return withLastDone.sort(
        (a, b) =>
          new Date(b.lastDone!).getTime() - new Date(a.lastDone!).getTime(),
      )[0];
    }
    return savedWorkouts[0];
  }, [savedWorkouts]);

  // Don't show if already trained today or no saved workouts
  if (hasTrainedToday || !nextWorkout) return null;

  const exerciseCount = nextWorkout.exercises?.length ?? 0;
  const estimatedMinutes = Math.max(30, exerciseCount * 5 + 10);
  const bgImage = getDailyFitnessImage(0);

  return (
    <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() =>
          router.push({
            pathname: "/preview",
            params: { id: nextWorkout.id, type: "saved" },
          })
        }
        style={{
          borderRadius: Radius.lg,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: theme.colors.cardBorder,
          backgroundColor: theme.colors.card,
          height: 190,
        }}
      >
        <ImageBackground
          source={{ uri: bgImage }}
          style={{ flex: 1, justifyContent: "space-between" }}
        >
          <LinearGradient
            colors={["rgba(13,15,18,0.4)", "rgba(13,15,18,0.65)", "rgba(13,15,18,0.92)"]}
            style={{ position: "absolute", inset: 0 }}
          />

          <View style={{ padding: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{
              backgroundColor: "rgba(183, 245, 42, 0.18)",
              borderColor: "rgba(183, 245, 42, 0.3)",
              borderWidth: 1,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: Radius.full,
            }}>
              <Text style={{
                color: theme.colors.primary,
                fontSize: 10,
                fontFamily: FontFamily.caption,
                letterSpacing: 0.8,
                fontWeight: "700",
              }}>
                Próximo treino
              </Text>
            </View>
          </View>

          {/* Bottom Info */}
          <View style={{ padding: 16, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 20,
                  fontFamily: FontFamily.display,
                  letterSpacing: -0.3,
                  marginBottom: 6,
                }}
                numberOfLines={1}
              >
                {nextWorkout.name}
              </Text>

              <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Ionicons
                    name="barbell-outline"
                    size={14}
                    color={theme.colors.textSecondary}
                  />
                  <Text
                    style={{
                      color: theme.colors.textSecondary,
                      fontSize: 12,
                      fontFamily: FontFamily.sansMedium,
                    }}
                  >
                    {exerciseCount} exercícios
                  </Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Ionicons
                    name="time-outline"
                    size={14}
                    color={theme.colors.textSecondary}
                  />
                  <Text
                    style={{
                      color: theme.colors.textSecondary,
                      fontSize: 12,
                      fontFamily: FontFamily.sansMedium,
                    }}
                  >
                    ~{estimatedMinutes} min
                  </Text>
                </View>
              </View>
            </View>

            {/* CTA play button */}
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: theme.colors.primary,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: theme.colors.primary,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
                elevation: 3,
              }}
            >
              <Ionicons
                name="play"
                size={20}
                color={theme.colors.onPrimary}
                style={{ marginLeft: 2 }}
              />
            </View>
          </View>
        </ImageBackground>
      </TouchableOpacity>
    </View>
  );
}
