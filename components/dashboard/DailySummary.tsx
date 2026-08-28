import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { Circle, Svg } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { WorkoutHistoryRecord } from '../../context/WorkoutHistoryContext';

interface Props {
    history: WorkoutHistoryRecord[];
    userName?: string;
    showHeader?: boolean;
}

export function DailySummary({ history, userName = "Braulio", showHeader = true }: Props) {
    const { theme } = useTheme();

    // 1. Calculate Date & Greeting
    const { dateString, greeting } = useMemo(() => {
        const now = new Date();
        const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'short' };
        const formattedDate = now.toLocaleDateString('pt-BR', dateOptions);

        const hour = now.getHours();
        let greet = 'Bom dia';
        if (hour >= 12 && hour < 18) greet = 'Boa tarde';
        else if (hour >= 18) greet = 'Boa noite';

        return {
            dateString: formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1),
            greeting: `${greet}, ${userName}! Bora manter o foco hoje 💪`
        };
    }, [userName]);

    // 2. Get Today's Status
    const { status, type, duration, calories, exercises, isCompleted } = useMemo(() => {
        const todayStr = new Date().toDateString();
        const todaysWorkout = history.find(h => new Date(h.date).toDateString() === todayStr);

        if (todaysWorkout) {
            const mins = Math.floor(todaysWorkout.duration / 60);
            const cals = Math.floor(mins * 5.5); // Estimate

            return {
                status: 'Concluído',
                type: 'Musculação',
                duration: mins,
                calories: cals,
                exercises: todaysWorkout.exercises,
                isCompleted: true
            };
        }

        return {
            status: 'Pendente',
            type: 'Treino do Dia',
            duration: 0,
            calories: 0,
            exercises: [],
            isCompleted: false
        };
    }, [history]);

    // Circular Progress Helper
    const CircularProgress = ({ size = 80, strokeWidth = 8, progress = 0, color = theme.colors.primary, icon = "barbell" }) => {
        const radius = (size - strokeWidth) / 2;
        const circumference = radius * 2 * Math.PI;
        const offset = circumference - (progress * circumference);

        return (
            <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
                <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
                    {/* Background Circle */}
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={theme.colors.cardBorder}
                        strokeWidth={strokeWidth}
                        fill="transparent"
                    />
                    {/* Progress Circle */}
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeDasharray={[circumference]}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        fill="transparent"
                    />
                </Svg>
                <View className="absolute items-center justify-center">
                    <Ionicons name={icon as any} size={size * 0.4} color={theme.colors.text} />
                </View>
            </View>
        );
    };

    return (
        <View className="px-6 mb-8">
            {showHeader && (
                <View className="mb-6">
                    <Text style={{ color: theme.colors.textMuted }} className="text-xs uppercase font-bold tracking-widest mb-1">{dateString}</Text>
                    <Text style={{ color: theme.colors.text }} className="text-xl font-bold">{greeting}</Text>
                </View>
            )}

            <View
                style={{
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.cardBorder,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.05,
                    shadowRadius: 25, // Doubled for ultimate softness
                    elevation: 0,
                    borderWidth: 1,
                    borderRadius: 20,
                }}
                className="border p-5 flex-row items-center"
            >
                {/* Visual Progress */}
                <View className="mr-5">
                    <CircularProgress
                        progress={isCompleted ? 1 : 0}
                        color={isCompleted ? '#10B981' : theme.colors.primary}
                        icon={isCompleted ? "checkmark" : "flame"}
                    />
                </View>

                {/* Stats Text */}
                <View className="flex-1 justify-center">
                    <Text style={{ color: theme.colors.textMuted }} className="text-xs font-bold uppercase tracking-wider mb-1">
                        Meta Diária
                    </Text>
                    <Text style={{ color: theme.colors.text }} className="text-lg font-bold mb-2">
                        {isCompleted ? 'Objetivo Alcançado!' : '1 Treino Pendente'}
                    </Text>

                    {isCompleted ? (
                        <View className="flex-row">
                            <View className="mr-4">
                                <Text style={{ color: theme.colors.text }} className="font-bold text-sm">{duration} min</Text>
                                <Text style={{ color: theme.colors.textMuted }} className="text-[10px]">Tempo</Text>
                            </View>
                            <View>
                                <Text style={{ color: theme.colors.text }} className="font-bold text-sm">{calories} kcal</Text>
                                <Text style={{ color: theme.colors.textMuted }} className="text-[10px]">Calorias</Text>
                            </View>
                        </View>
                    ) : (
                        <View className="flex-row items-center">
                            <Ionicons name="time-outline" size={14} color={theme.colors.textMuted} />
                            <Text style={{ color: theme.colors.textMuted }} className="text-xs ml-1">
                                ~45 min estimados
                            </Text>
                        </View>
                    )}
                </View>

                {/* Arrow or Action Icon */}
                {!isCompleted && (
                    <View className="justify-center">
                        <View style={{ backgroundColor: theme.colors.primary }} className="w-8 h-8 rounded-full items-center justify-center shadow-sm">
                            <Ionicons name="play" size={16} color="white" style={{ marginLeft: 2 }} />
                        </View>
                    </View>
                )}
            </View>
        </View>
    );
}
