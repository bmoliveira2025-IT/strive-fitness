import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState } from 'react';
import { useWindowDimensions, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { LineChart } from 'react-native-chart-kit';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { Circle, Path, Svg } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { useWorkoutHistory } from '../context/WorkoutHistoryContext';

interface ExerciseStats {
    id: string;
    name: string;
    image_url?: string;
    latest1RM: number;
    history: number[];       // 1RM values oldest → newest
    historyDates: string[];  // ISO date strings, parallel to history
    change: number;
}

const SparkLine = ({ data, color, width = 100, height = 40 }: { data: number[], color: string, width?: number, height?: number }) => {
    if (data.length < 2) {
        return (
            <View style={{ width, height, justifyContent: 'center', alignItems: 'center', opacity: 0.15 }}>
                <View style={{ width: '60%', height: 2, backgroundColor: color, borderRadius: 2 }} />
            </View>
        );
    }

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const pad = 6;
    const activeH = height - pad * 2;

    const points = data.map((val, i) => ({
        x: (i / (data.length - 1)) * width,
        y: (activeH + pad) - ((val - min) / range) * activeH,
    }));

    const d = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
    const last = points[points.length - 1];

    return (
        <View style={{ width, height }}>
            <Svg width={width} height={height}>
                <Path d={d} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" strokeOpacity={0.15} />
                <Path d={d} fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                <Circle cx={last.x} cy={last.y} r="4" fill={color} stroke="white" strokeWidth="2" />
            </Svg>
        </View>
    );
};

function ExerciseDetailModal({ item, visible, onClose }: { item: ExerciseStats | null, visible: boolean, onClose: () => void }) {
    const { theme } = useTheme();
    const { width: screenWidth } = useWindowDimensions();

    if (!item) return null;

    const chartData = item.history.slice(-20); // last 20 data points
    const chartDates = item.historyDates.slice(-20);

    const step = Math.max(1, Math.floor(chartData.length / 5));
    const labels = chartData.map((_, i) => {
        if (i === 0 || i === chartData.length - 1 || i % step === 0) {
            const d = new Date(chartDates[i]);
            return `${d.getDate()}/${d.getMonth() + 1}`;
        }
        return '';
    });

    const maxRM = Math.max(...item.history);
    const firstRM = item.history[0] || 0;
    const totalImprovement = maxRM - firstRM;
    const sessions = item.history.length;

    const isPositive = item.change >= 0;
    const trendColor = item.change === 0 ? theme.colors.textMuted : (isPositive ? '#22C55E' : '#EF4444');

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
                <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />

                <View style={{
                    backgroundColor: theme.colors.background,
                    borderTopLeftRadius: 32,
                    borderTopRightRadius: 32,
                    paddingBottom: 40,
                    borderWidth: 1,
                    borderColor: theme.colors.cardBorder,
                }}>
                    {/* Handle */}
                    <View style={{ alignItems: 'center', paddingTop: 14, paddingBottom: 6 }}>
                        <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: theme.colors.border }} />
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Header */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 12, paddingBottom: 20 }}>
                            <View style={{
                                width: 52, height: 52, borderRadius: 16,
                                backgroundColor: theme.colors.backgroundTertiary,
                                overflow: 'hidden', marginRight: 14,
                                borderWidth: 1, borderColor: theme.colors.cardBorder,
                            }}>
                                {item.image_url ? (
                                    <Image source={{ uri: item.image_url }} style={{ width: '100%', height: '100%' }} contentFit="cover" cachePolicy="memory-disk" />
                                ) : (
                                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                        <Ionicons name="barbell" size={24} color={theme.colors.textMuted} />
                                    </View>
                                )}
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: theme.colors.textMuted, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5 }}>Progressão de Força</Text>
                                <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '900', letterSpacing: -0.4 }} numberOfLines={1}>{item.name}</Text>
                            </View>
                            <TouchableOpacity onPress={onClose} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: theme.colors.backgroundTertiary, alignItems: 'center', justifyContent: 'center' }}>
                                <Ionicons name="close" size={18} color={theme.colors.textMuted} />
                            </TouchableOpacity>
                        </View>

                        {/* Stats row */}
                        <View style={{ flexDirection: 'row', paddingHorizontal: 24, gap: 10, marginBottom: 24 }}>
                            {[
                                { label: '1RM Máx.', value: `${Math.round(maxRM)}kg`, color: theme.colors.primary },
                                { label: 'Evolução', value: totalImprovement > 0 ? `+${Math.round(totalImprovement)}kg` : `${Math.round(totalImprovement)}kg`, color: totalImprovement >= 0 ? '#22C55E' : '#EF4444' },
                                { label: 'Sessões', value: String(sessions), color: '#F59E0B' },
                            ].map((s, i) => (
                                <View key={i} style={{
                                    flex: 1, backgroundColor: theme.colors.card,
                                    borderRadius: 16, padding: 14,
                                    borderWidth: 1, borderColor: theme.colors.cardBorder,
                                    alignItems: 'center',
                                }}>
                                    <Text style={{ color: s.color, fontSize: 18, fontWeight: '900', letterSpacing: -0.5 }}>{s.value}</Text>
                                    <Text style={{ color: theme.colors.textMuted, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 3 }}>{s.label}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Chart */}
                        {chartData.length >= 2 ? (
                            <View style={{ paddingHorizontal: 24, marginBottom: 8 }}>
                                <View style={{
                                    backgroundColor: theme.colors.card,
                                    borderRadius: 20, padding: 16,
                                    borderWidth: 1, borderColor: theme.colors.cardBorder,
                                    overflow: 'hidden',
                                }}>
                                    <Text style={{ color: theme.colors.textMuted, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                                        Histórico de 1RM estimado
                                    </Text>
                                    <LineChart
                                        data={{ labels, datasets: [{ data: chartData.map(v => Math.round(v)), color: () => theme.colors.primary, strokeWidth: 3 }] }}
                                        width={screenWidth - 96}
                                        height={180}
                                        yAxisSuffix="kg"
                                        chartConfig={{
                                            backgroundColor: theme.colors.card,
                                            backgroundGradientFrom: theme.colors.card,
                                            backgroundGradientTo: theme.colors.card,
                                            decimalPlaces: 0,
                                            color: () => theme.colors.primary,
                                            labelColor: () => theme.colors.textSecondary,
                                            propsForDots: { r: '4', strokeWidth: '2', stroke: theme.colors.background },
                                            propsForLabels: { fontSize: 9 },
                                            fillShadowGradient: theme.colors.primary,
                                            fillShadowGradientOpacity: 0.15,
                                        }}
                                        bezier
                                        withInnerLines={false}
                                        withOuterLines={false}
                                        style={{ borderRadius: 12, marginLeft: -8 }}
                                    />
                                </View>
                            </View>
                        ) : (
                            <View style={{ paddingHorizontal: 24, marginBottom: 8 }}>
                                <View style={{ backgroundColor: theme.colors.card, borderRadius: 20, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.cardBorder }}>
                                    <Ionicons name="stats-chart" size={32} color={theme.colors.textMuted} />
                                    <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '700', marginTop: 10, textAlign: 'center' }}>
                                        Complete mais sessões para gerar o gráfico de progressão
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* Last change badge */}
                        {item.change !== 0 && (
                            <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
                                <View style={{
                                    backgroundColor: trendColor + '15',
                                    borderColor: trendColor + '30',
                                    borderWidth: 1,
                                    borderRadius: 14,
                                    padding: 14,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 10,
                                }}>
                                    <Ionicons name={isPositive ? 'trending-up' : 'trending-down'} size={18} color={trendColor} />
                                    <Text style={{ color: trendColor, fontSize: 13, fontWeight: '800' }}>
                                        {isPositive ? '+' : ''}{Math.round(item.change)}kg na última sessão
                                    </Text>
                                </View>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

export function ProgressExercisesView() {
    const { history } = useWorkoutHistory();
    const { theme } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedExercise, setSelectedExercise] = useState<ExerciseStats | null>(null);
    const [detailVisible, setDetailVisible] = useState(false);

    const exerciseStats = useMemo(() => {
        const statsMap = new Map<string, ExerciseStats>();
        const chronHistory = [...history].reverse();

        chronHistory.forEach(workout => {
            workout.exercises.forEach(ex => {
                let max1RM = 0;
                ex.sets.forEach(set => {
                    if (set.kg > 0 && set.reps > 0) {
                        const oneRM = set.kg * (1 + set.reps / 30);
                        if (oneRM > max1RM) max1RM = oneRM;
                    }
                });

                if (max1RM > 0) {
                    const key = ex.id || ex.name;
                    if (!statsMap.has(key)) {
                        statsMap.set(key, { id: key, name: ex.name, image_url: ex.image_url, latest1RM: 0, history: [], historyDates: [], change: 0 });
                    }
                    const entry = statsMap.get(key)!;
                    entry.history.push(max1RM);
                    entry.historyDates.push(workout.date);
                    entry.latest1RM = max1RM;
                    if (ex.image_url) entry.image_url = ex.image_url;
                }
            });
        });

        const list = Array.from(statsMap.values());
        list.forEach(item => {
            if (item.history.length >= 2) {
                item.change = item.history[item.history.length - 1] - item.history[item.history.length - 2];
            }
        });

        return list.reverse();
    }, [history]);

    const filteredList = useMemo(() => {
        if (!searchQuery.trim()) return exerciseStats;
        return exerciseStats.filter(ex => ex.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [exerciseStats, searchQuery]);

    const handlePress = (item: ExerciseStats) => {
        setSelectedExercise(item);
        setDetailVisible(true);
    };

    const renderItem = ({ item, index }: { item: ExerciseStats, index: number }) => {
        const isPositive = item.change >= 0;
        const isNeutral = item.change === 0;
        const trendColor = isNeutral ? theme.colors.textMuted : (isPositive ? '#22C55E' : '#EF4444');

        return (
            <Animated.View entering={FadeInDown.delay(index * 50).springify()} layout={Layout.springify()}>
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handlePress(item)}
                    style={{
                        backgroundColor: theme.colors.card,
                        borderColor: theme.colors.cardBorder,
                        borderWidth: 1.5,
                        marginBottom: 14,
                        marginHorizontal: 24,
                        borderRadius: 20,
                        padding: 18,
                        flexDirection: 'row',
                        alignItems: 'center',
                        overflow: 'hidden',
                    }}
                >
                    <LinearGradient
                        colors={[`${theme.colors.primary}05`, 'transparent']}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={{ position: 'absolute', inset: 0 }}
                    />

                    {/* Image */}
                    <View style={{
                        width: 54, height: 54, borderRadius: 16,
                        backgroundColor: theme.colors.backgroundTertiary,
                        borderWidth: 1, borderColor: theme.colors.cardBorder,
                        overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
                        marginRight: 14,
                    }}>
                        {item.image_url ? (
                            <Image source={{ uri: item.image_url }} style={{ width: '100%', height: '100%' }} contentFit="cover" cachePolicy="memory-disk" />
                        ) : (
                            <Ionicons name="barbell" size={22} color={theme.colors.textMuted} />
                        )}
                    </View>

                    {/* Info */}
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '900', letterSpacing: -0.3 }} numberOfLines={1}>{item.name}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 }}>
                            <Text style={{ color: theme.colors.text, fontSize: 20, fontWeight: '900', letterSpacing: -0.5 }}>
                                {Math.round(item.latest1RM)}
                            </Text>
                            <Text style={{ color: theme.colors.textMuted, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>kg 1RM</Text>
                            {!isNeutral && (
                                <View style={{ backgroundColor: trendColor + '20', borderColor: trendColor + '30', borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 }}>
                                    <Ionicons name={isPositive ? 'triangle' : 'triangle'} size={6} color={trendColor} style={{ transform: [{ rotate: isPositive ? '0deg' : '180deg' }] }} />
                                    <Text style={{ color: trendColor, fontSize: 9, fontWeight: '900', marginLeft: 3 }}>
                                        {Math.abs(Math.round(item.change))}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Sparkline + sessions */}
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                        <SparkLine
                            data={item.history}
                            color={isNeutral ? theme.colors.textMuted + '40' : theme.colors.primary}
                            width={68}
                            height={32}
                        />
                        <Text style={{ color: theme.colors.textMuted, fontSize: 9, fontWeight: '700' }}>
                            {item.history.length} sessões
                        </Text>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <View style={{ flex: 1 }}>
            {/* Search */}
            <Animated.View entering={FadeInDown.duration(600).delay(100)} style={{ paddingHorizontal: 24, paddingVertical: 18 }}>
                <View style={{
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.cardBorder,
                    borderWidth: 1.5,
                    borderRadius: 18,
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                }}>
                    <Ionicons name="search" size={17} color={theme.mode === 'light' ? theme.colors.primaryDark : theme.colors.primary} />
                    <TextInput
                        placeholder="Buscar exercício..."
                        placeholderTextColor={theme.colors.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        style={{ color: theme.colors.text, fontSize: 14, fontWeight: '700', flex: 1, marginLeft: 12 }}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={18} color={theme.colors.textMuted} />
                        </TouchableOpacity>
                    )}
                </View>
            </Animated.View>

            <FlashList
                data={filteredList}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={{ paddingBottom: 160 }}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <View style={{ paddingHorizontal: 24, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <View style={{ flex: 1, paddingRight: 12 }}>
                            <Text style={{ color: theme.colors.text, fontSize: 20, fontWeight: '900', letterSpacing: -0.5 }}>{searchQuery ? 'Resultados' : 'Cargas'}</Text>
                            <Text style={{ color: theme.colors.textMuted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 2 }}>Tracking de Força • Toque para detalhar</Text>
                        </View>
                        <View style={{ backgroundColor: theme.colors.primary + '15', borderColor: theme.colors.primary + '30', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
                            <Text style={{ color: theme.mode === 'light' ? theme.colors.primaryDark : theme.colors.primary, fontSize: 10, fontWeight: '900' }}>
                                {filteredList.length} EXERCÍCIOS
                            </Text>
                        </View>
                    </View>
                }
                ListEmptyComponent={
                    <View style={{ alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 }}>
                        <View style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder, borderWidth: 1.5, width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                            <Ionicons name="barbell" size={36} color={theme.colors.textMuted} />
                        </View>
                        <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '900', textAlign: 'center' }}>Sem registros</Text>
                        <Text style={{ color: theme.colors.textMuted, fontSize: 11, fontWeight: '600', textAlign: 'center', marginTop: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>Complete seu primeiro treino para ver o tracking de carga</Text>
                    </View>
                }
            />

            <ExerciseDetailModal
                item={selectedExercise}
                visible={detailVisible}
                onClose={() => setDetailVisible(false)}
            />
        </View>
    );
}
