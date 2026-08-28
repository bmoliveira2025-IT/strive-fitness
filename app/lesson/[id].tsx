import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COACHES } from "../../constants/coaches";
import { useTheme } from "../../context/ThemeContext";
import { GradientButton } from "../../components/ui/GradientButton";

export default function LessonScreen() {
  const { id, coachId } = useLocalSearchParams<{
    id: string;
    coachId: string;
  }>();
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [isPlaying, setIsPlaying] = useState(false);

  const coach = COACHES.find((c) => c.id === coachId);
  const lesson = coach?.lessons.find((l) => l.id === id);

  if (!coach || !lesson) {
    return (
      <View
        style={{ backgroundColor: "transparent" }}
        className="flex-1 justify-center items-center"
      >
        <Text style={{ color: theme.colors.text }}>Aula não encontrada</Text>
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: "transparent" }} className="flex-1">
      <StatusBar style="light" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Video Player Placeholder */}
      <View className="relative w-full aspect-video bg-black">
        <Image
          source={coach.image}
          className="w-full h-full opacity-60"
          blurRadius={isPlaying ? 0 : 5}
        />

        <LinearGradient
          colors={["rgba(0,0,0,0.5)", "transparent", "rgba(0,0,0,0.8)"]}
          className="absolute inset-0"
        />

        <TouchableOpacity
          onPress={() => router.back()}
          style={{ top: insets.top + 10 }}
          className="absolute left-5 w-10 h-10 rounded-full bg-black/40 items-center justify-center z-10"
        >
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>

        <View className="absolute inset-0 items-center justify-center">
          <TouchableOpacity
            onPress={() => setIsPlaying(!isPlaying)}
            className="w-20 h-20 rounded-full bg-primary/90 items-center justify-center shadow-xl"
          >
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={40}
              color="black"
            />
          </TouchableOpacity>
        </View>

        {/* Progress Bar Mock */}
        <View className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
          <View className="h-full bg-primary w-1/3" />
        </View>

        <View className="absolute bottom-4 left-6 right-6 flex-row justify-between items-center">
          <Text className="text-white text-[10px] font-bold">
            04:20 / {lesson.duration}
          </Text>
          <Ionicons name="expand" size={16} color="white" />
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-6">
          <View className="flex-row items-center mb-2">
            <View className="bg-primary/20 px-2 py-0.5 rounded-md mr-2">
              <Text className="text-primary text-[10px] font-bold uppercase">
                {lesson.level}
              </Text>
            </View>
            <Text
              style={{ color: theme.colors.textMuted }}
              className="text-xs font-medium"
            >
              {lesson.duration}
            </Text>
          </View>

          <Text
            style={{ color: theme.colors.text }}
            className="text-2xl font-black mb-4"
          >
            {lesson.title}
          </Text>

          {/* Coach Mini-Card */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.cardBorder,
              borderRadius: 20,
            }}
            className="flex-row items-center p-4 border mb-8"
          >
            <Image
              source={coach.image}
              className="w-12 h-12 rounded-2xl mr-4"
            />
            <View className="flex-1">
              <Text style={{ color: theme.colors.text }} className="font-bold">
                {coach.name}
              </Text>
              <Text
                style={{ color: theme.colors.textMuted }}
                className="text-xs"
              >
                {coach.role}
              </Text>
            </View>
            <View className="bg-primary px-4 py-2 rounded-xl">
              <Text className="text-black text-xs font-bold uppercase">
                Seguir
              </Text>
            </View>
          </TouchableOpacity>

          {/* Description */}
          <View className="mb-10">
            <Text
              style={{ color: theme.colors.text }}
              className="text-lg font-bold mb-3"
            >
              Sobre esta aula
            </Text>
            <Text
              style={{ color: theme.colors.textSecondary }}
              className="text-sm leading-6"
            >
              Nesta aula, o coach {coach.name} mergulha nos detalhes técnicos de{" "}
              {lesson.title.toLowerCase()}. Você aprenderá a otimizar sua
              execução, evitar erros comuns e maximizar seus resultados através
              da ciência do treinamento.
            </Text>
          </View>

          {/* Next Lessons */}
          <View className="mb-10">
            <Text
              style={{ color: theme.colors.text }}
              className="text-lg font-bold mb-4"
            >
              Próximas aulas de {coach.name.split(" ")[0]}
            </Text>
            {coach.lessons
              .filter((l) => l.id !== id)
              .map((other) => (
                <TouchableOpacity
                  key={other.id}
                  onPress={() =>
                    router.push({
                      pathname: "/lesson/[id]",
                      params: { id: other.id, coachId: coach.id },
                    })
                  }
                  style={{
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.cardBorder,
                  }}
                  className="flex-row items-center p-4 rounded-2xl border mb-3"
                >
                  <View className="w-12 h-12 rounded-xl bg-zinc-800 items-center justify-center mr-4">
                    <Ionicons
                      name="play"
                      size={20}
                      color={theme.colors.primary}
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      style={{ color: theme.colors.text }}
                      className="font-bold text-sm mb-1"
                    >
                      {other.title}
                    </Text>
                    <View className="flex-row items-center">
                      <Text
                        style={{ color: theme.colors.textMuted }}
                        className="text-[10px] font-medium"
                      >
                        {other.duration}
                      </Text>
                      <View className="w-1 h-1 rounded-full bg-zinc-400 mx-2" />
                      <Text
                        style={{ color: theme.colors.primary }}
                        className="text-[10px] font-bold uppercase"
                      >
                        {other.level}
                      </Text>
                    </View>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={theme.colors.textMuted}
                  />
                </TouchableOpacity>
              ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View
        style={{
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
        }}
        className="p-6 border-t"
      >
        <GradientButton
          style={{
            borderRadius: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 4
          }}
          gradientStyle={{
            width: '100%',
            height: 56,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Text className="text-white font-bold text-base">
            Baixar Aula (Offline)
          </Text>
        </GradientButton>
      </View>
    </View>
  );
}
