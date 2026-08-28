import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Pressable } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Ellipse, Path, G } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { MuscleId, MuscleStatus } from '../context/MuscleTrackerContext';

interface BodyHeatmapProps {
    statusMap: Record<MuscleId, MuscleStatus>;
    onMusclePress: (muscle: MuscleId) => void;
}

const STATUS_COLORS: Record<MuscleStatus, string> = {
    recovered: '#22C55E',    // Green
    accumulating: '#3B82F6', // Blue
    undertrained: '#EAB308', // Yellow
    overreaching: '#EF4444', // Red
};

// Heatmap "Glow" Component
const MuscleGlow = ({
    muscle,
    status,
    cx,
    cy,
    rx,
    ry,
    onPress
}: {
    muscle: MuscleId,
    status: MuscleStatus,
    cx: string | number,
    cy: string | number,
    rx: string | number,
    ry: string | number,
    onPress: (m: MuscleId) => void
}) => {
    const color = STATUS_COLORS[status] || '#f4f4f5';
    // Unique ID for gradient
    const gradId = `grad-${muscle}-${status}`;

    return (
        <G onPress={() => onPress(muscle)}>
            <Defs>
                <RadialGradient
                    id={gradId}
                    cx={cx}
                    cy={cy}
                    rx={rx}
                    ry={ry}
                    gradientUnits="userSpaceOnUse"
                >
                    <Stop offset="0" stopColor={color} stopOpacity="0.6" />
                    <Stop offset="0.7" stopColor={color} stopOpacity="0.2" />
                    <Stop offset="1" stopColor={color} stopOpacity="0" />
                </RadialGradient>
            </Defs>
            <Ellipse
                cx={cx}
                cy={cy}
                rx={rx}
                ry={ry}
                fill={`url(#${gradId})`}
            />
            {/* Invisible Hit/Touch Area for easier pressing */}
            <Ellipse
                cx={cx}
                cy={cy}
                rx={Number(rx) * 0.8}
                ry={Number(ry) * 0.8}
                fill="transparent"
                onPress={() => onPress(muscle)}
            />
        </G>
    );
};

export default function BodyHeatmap({ statusMap, onMusclePress }: BodyHeatmapProps) {
    const { theme } = useTheme();
    const [view, setView] = useState<'Front' | 'Back'>('Front');

    const getStatus = (id: MuscleId): MuscleStatus => statusMap[id] || 'undertrained';

    const imageSource = React.useMemo(() => {
        const isLight = theme.mode === 'light';
        if (view === 'Front') {
            return isLight
                ? require('../assets/anatomy_front_light.png')
                : require('../assets/anatomy_front_dark.png');
        } else {
            return isLight
                ? require('../assets/anatomy_back_light.png')
                : require('../assets/anatomy_back_dark.png');
        }
    }, [view, theme.mode]);

    const WIDTH = 300;
    const HEIGHT = 600;

    return (
        <View style={{ alignItems: 'center', height: 650 }}>
            {/* Toggle Switch */}
            <View style={{
                flexDirection: 'row',
                backgroundColor: theme.mode === 'light' ? '#E4E4E7' : '#27272A',
                borderRadius: 100,
                padding: 4,
                marginBottom: 24
            }}>
                <TouchableOpacity
                    onPress={() => setView('Front')}
                    style={{
                        paddingHorizontal: 16,
                        paddingVertical: 4,
                        borderRadius: 100,
                        backgroundColor: view === 'Front' ? (theme.mode === 'light' ? '#FFF' : '#3F3F46') : 'transparent',
                        shadowColor: view === 'Front' ? '#000' : 'transparent',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.1,
                        shadowRadius: 2,
                        elevation: view === 'Front' ? 2 : 0
                    }}
                >
                    <Text style={{ color: theme.colors.text, fontSize: 12, fontWeight: '700' }}>Frente</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setView('Back')}
                    style={{
                        paddingHorizontal: 16,
                        paddingVertical: 4,
                        borderRadius: 100,
                        backgroundColor: view === 'Back' ? (theme.mode === 'light' ? '#FFF' : '#3F3F46') : 'transparent',
                        shadowColor: view === 'Back' ? '#000' : 'transparent',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.1,
                        shadowRadius: 2,
                        elevation: view === 'Back' ? 2 : 0
                    }}
                >
                    <Text style={{ color: theme.colors.text, fontSize: 12, fontWeight: '700' }}>Costas</Text>
                </TouchableOpacity>
            </View>

            <View style={{ width: WIDTH, height: HEIGHT, position: 'relative', alignItems: 'center' }}>
                <Image
                    source={imageSource}
                    style={{ width: '100%', height: '100%', opacity: 1 }}
                    resizeMode="contain"
                />

                <View style={[StyleSheet.absoluteFill, { zIndex: 10 }]}>
                    <Svg height="100%" width="100%" viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
                        {view === 'Front' ? (
                            <>
                                {/* Coordinates Re-aligned to Standard Anatomy Reference (User provided Chart) */}
                                {/* Shifted UP by ~90-110px from V4 to match standard proportions */}

                                {/* Ombros (Deltoids) - Shoulder caps - Lowered significantly to sit ON the shoulder */}
                                <MuscleGlow muscle="Ombros" status={getStatus('Ombros')} cx="85" cy="180" rx="22" ry="28" onPress={onMusclePress} />
                                <MuscleGlow muscle="Ombros" status={getStatus('Ombros')} cx="215" cy="180" rx="22" ry="28" onPress={onMusclePress} />

                                {/* Peito (Chest) - Pectoralis Major */}
                                <MuscleGlow muscle="Peito" status={getStatus('Peito')} cx="150" cy="190" rx="55" ry="35" onPress={onMusclePress} />

                                {/* Bíceps - Mid Upper Arm */}
                                <MuscleGlow muscle="Bíceps" status={getStatus('Bíceps')} cx="75" cy="220" rx="18" ry="35" onPress={onMusclePress} />
                                <MuscleGlow muscle="Bíceps" status={getStatus('Bíceps')} cx="225" cy="220" rx="18" ry="35" onPress={onMusclePress} />

                                {/* Abdômen (Abs) - Rectus Abdominis (Navel area) */}
                                <MuscleGlow muscle="Abdômen" status={getStatus('Abdômen')} cx="150" cy="265" rx="35" ry="50" onPress={onMusclePress} />

                                {/* Quadríceps - Rectus Femoris (Mid Thigh) */}
                                <MuscleGlow muscle="Quadríceps" status={getStatus('Quadríceps')} cx="120" cy="390" rx="25" ry="70" onPress={onMusclePress} />
                                <MuscleGlow muscle="Quadríceps" status={getStatus('Quadríceps')} cx="180" cy="390" rx="25" ry="70" onPress={onMusclePress} />
                            </>
                        ) : (
                            <>
                                {/* Costas (Back) */}

                                {/* Traps / Upper Back */}
                                <MuscleGlow muscle="Costas" status={getStatus('Costas')} cx="150" cy="140" rx="70" ry="35" onPress={onMusclePress} />
                                {/* Lats - Mid Back */}
                                <MuscleGlow muscle="Costas" status={getStatus('Costas')} cx="150" cy="220" rx="55" ry="50" onPress={onMusclePress} />

                                {/* Tríceps - Posterior Arm */}
                                <MuscleGlow muscle="Tríceps" status={getStatus('Tríceps')} cx="65" cy="220" rx="18" ry="35" onPress={onMusclePress} />
                                <MuscleGlow muscle="Tríceps" status={getStatus('Tríceps')} cx="235" cy="220" rx="18" ry="35" onPress={onMusclePress} />

                                {/* Glúteos - Gluteus Maximus */}
                                <MuscleGlow muscle="Glúteos" status={getStatus('Glúteos')} cx="150" cy="340" rx="55" ry="40" onPress={onMusclePress} />

                                {/* Isquiotibiais - Hamstrings */}
                                <MuscleGlow muscle="Isquiotibiais" status={getStatus('Isquiotibiais')} cx="120" cy="420" rx="25" ry="60" onPress={onMusclePress} />
                                <MuscleGlow muscle="Isquiotibiais" status={getStatus('Isquiotibiais')} cx="180" cy="420" rx="25" ry="60" onPress={onMusclePress} />

                                {/* Panturrilhas - Calves */}
                                <MuscleGlow muscle="Panturrilhas" status={getStatus('Panturrilhas')} cx="120" cy="510" rx="20" ry="45" onPress={onMusclePress} />
                                <MuscleGlow muscle="Panturrilhas" status={getStatus('Panturrilhas')} cx="180" cy="510" rx="20" ry="45" onPress={onMusclePress} />
                            </>
                        )}
                    </Svg>
                </View>
            </View>

            {/* Legend */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16, marginTop: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 12, height: 12, borderRadius: 100, backgroundColor: '#EAB308', marginRight: 8 }} />
                    <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>Subtreinado</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 12, height: 12, borderRadius: 100, backgroundColor: '#22C55E', marginRight: 8 }} />
                    <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>Ideal</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 12, height: 12, borderRadius: 100, backgroundColor: '#3B82F6', marginRight: 8 }} />
                    <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>Recuperando</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 12, height: 12, borderRadius: 100, backgroundColor: '#EF4444', marginRight: 8 }} />
                    <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>Risco</Text>
                </View>
            </View>
        </View>
    );
}
