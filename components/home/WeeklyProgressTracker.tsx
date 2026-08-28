import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Circle, Svg } from "react-native-svg";
import { useTheme } from "../../context/ThemeContext";
import { FontFamily, Radius } from "../../constants/theme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// --- DONUT RING FOR MAIN CARD ---
const RING_SIZE = 96;
const STROKE = 10;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function ProgressDonut({
  progress,
  color,
  trackColor,
  percentage,
}: {
  progress: number;
  color: string;
  trackColor: string;
  percentage: number;
}) {
  const { theme } = useTheme();
  const anim = useSharedValue(0);

  useEffect(() => {
    anim.value = withTiming(Math.min(Math.max(progress, 0), 1), {
      duration: 800,
    });
  }, [anim, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - anim.value),
  }));

  const cx = RING_SIZE / 2;
  const cy = RING_SIZE / 2;

  return (
    <View
      style={{
        width: RING_SIZE,
        height: RING_SIZE,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg
        width={RING_SIZE}
        height={RING_SIZE}
        viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
      >
        {/* Track */}
        <Circle
          cx={cx}
          cy={cy}
          r={RADIUS}
          stroke={trackColor}
          strokeWidth={STROKE}
          fill="none"
        />
        {/* Progress */}
        <AnimatedCircle
          cx={cx}
          cy={cy}
          r={RADIUS}
          stroke={color}
          strokeWidth={STROKE}
          fill="none"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation="-90"
          origin={`${cx}, ${cy}`}
        />
      </Svg>
      <View
        style={{
          position: "absolute",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            color: theme.colors.text,
            fontSize: 20,
            fontFamily: FontFamily.display,
            fontVariant: ["tabular-nums"],
          }}
        >
          {percentage}%
        </Text>
      </View>
    </View>
  );
}

// --- SMALL METRIC CARD ---
function MetricCard({
  title,
  value,
  icon,
  iconColor,
  subtext,
}: {
  title: string;
  value: string;
  icon: any;
  iconColor: string;
  subtext: string;
}) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.card,
        borderRadius: Radius.md,
        padding: 12,
        borderWidth: 1,
        borderColor: theme.colors.cardBorder,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          marginBottom: 6,
        }}
      >
        <Ionicons name={icon} size={13} color={iconColor} />
        <Text
          style={{
            color: theme.colors.textMuted,
            fontSize: 10,
            fontFamily: FontFamily.caption,
            letterSpacing: 0.5,
          }}
        >
          {title}
        </Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 2 }}>
        <Text
          style={{
            color: theme.colors.text,
            fontSize: 18,
            fontFamily: FontFamily.display,
            letterSpacing: -0.3,
            fontVariant: ["tabular-nums"],
          }}
        >
          {value}
        </Text>
        {subtext ? (
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontSize: 11,
              fontFamily: FontFamily.sansMedium,
            }}
          >
            {subtext}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

interface Props {
  streak: number;
  weekCount: number;
  weekVolume: string;
}

export function WeeklyProgressTracker({
  streak,
  weekCount,
  weekVolume,
}: Props) {
  const { theme } = useTheme();
  const router = useRouter();

  const progressValue = weekCount / 7;
  const percentage = Math.round(Math.min(progressValue, 1) * 100);

  const trackColor = theme.mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(15, 23, 42, 0.08)";

  return (
    <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
      {/* Main Progress Card */}
      <View
        style={{
          backgroundColor: theme.colors.card,
          borderRadius: Radius.lg,
          borderWidth: 1,
          borderColor: theme.colors.cardBorder,
          padding: 18,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <View style={{ flex: 1, paddingRight: 16 }}>
          <Text
            style={{
              color: theme.colors.text,
              fontSize: 18,
              fontFamily: FontFamily.display,
              letterSpacing: -0.3,
              marginBottom: 2,
            }}
          >
            Meta Semanal
          </Text>
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontSize: 13,
              fontFamily: FontFamily.sans,
              marginBottom: 16,
            }}
          >
            {weekCount} de 7 treinos concluídos
          </Text>

          <TouchableOpacity
            onPress={() => router.push("/activities")}
            activeOpacity={0.75}
            style={{
              backgroundColor: theme.colors.backgroundTertiary,
              borderColor: theme.colors.border,
              borderWidth: 1,
              borderRadius: Radius.sm,
              paddingVertical: 8,
              paddingHorizontal: 14,
              alignSelf: "flex-start",
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Text
              style={{
                color: theme.colors.text,
                fontSize: 11,
                fontFamily: FontFamily.sansSemiBold,
              }}
            >
              Ver atividades
            </Text>
            <Ionicons name="chevron-forward" size={12} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        <ProgressDonut
          progress={progressValue}
          color={theme.colors.primary}
          trackColor={trackColor}
          percentage={percentage}
        />
      </View>

      {/* Metrics Row */}
      <View style={{ flexDirection: "row", gap: 10 }}>
        <MetricCard
          title="Streak"
          value={streak.toString()}
          subtext="dias"
          icon="flame"
          iconColor="#F59E0B"
        />
        <MetricCard
          title="Volume"
          value={weekVolume.replace("kg", "").trim()}
          subtext="kg"
          icon="barbell-outline"
          iconColor={theme.colors.primary}
        />
        <MetricCard
          title="Treinos"
          value={weekCount.toString()}
          subtext="/7"
          icon="fitness-outline"
          iconColor={theme.mode === "light" ? "#0284C7" : "#38BDF8"}
        />
      </View>
    </View>
  );
}
