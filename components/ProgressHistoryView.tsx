import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { memo, useMemo, useState } from 'react';
import { ScrollView, SectionList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { useUserStore } from '../store/useUserStore';
import { WorkoutHistoryRecord, useWorkoutHistory } from '../context/WorkoutHistoryContext';
import { AIPerformanceReport } from './ai-advisor/AIPerformanceReport';

type Segment = 'treinos' | 'monitoramento';

function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}min`;
}

function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Hoje';
    if (d.toDateString() === yesterday.toDateString()) return 'Ontem';

    return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
}

function formatVolume(kg: number): string {
    if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`;
    return `${Math.round(kg)}kg`;
}

const WorkoutSessionCard = memo(function WorkoutSessionCard({ record }: { record: WorkoutHistoryRecord }) {
    const { theme } = useTheme();
    const [expanded, setExpanded] = useState(false);

    const exNames = record.exercises.map(e => e.name);
    const preview = exNames.slice(0, 3).join(', ');
    const extra = exNames.length > 3 ? ` +${exNames.length - 3}` : '';

    return (
        <View>
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setExpanded(e => !e)}
                style={{
                    backgroundColor: theme.colors.card,
                    borderRadius: 20,
                    borderWidth: 1.5,
                    borderColor: theme.colors.cardBorder,
                    marginBottom: 12,
                    overflow: 'hidden',
                }}
            >
                {/* Main row */}
                <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center' }}>
                    {/* Date pill */}
                    <View style={{
                        backgroundColor: theme.colors.primary + '18',
                        borderRadius: 14, paddingHorizontal: 10, paddingVertical: 8,
                        alignItems: 'center', minWidth: 52, marginRight: 14,
                    }}>
                        <Text style={{ color: theme.mode === 'light' ? theme.colors.primaryDark : theme.colors.primary, fontSize: 11, fontWeight: '900' }}>
                            {new Date(record.date).getDate()}
                        </Text>
                        <Text style={{ color: theme.colors.textMuted, fontSize: 9, fontWeight: '700', textTransform: 'uppercase' }}>
                            {new Date(record.date).toLocaleDateString('pt-BR', { month: 'short' })}
                        </Text>
                    </View>

                    {/* Info */}
                    <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                            <Text style={{ color: theme.colors.textMuted, fontSize: 10, fontWeight: '700' }}>
                                {formatDate(record.date)}
                            </Text>
                            {record.postWorkoutSurvey && (
                                <View style={{
                                    backgroundColor: record.postWorkoutSurvey.intensity === 'intenso' ? '#EF444418' : record.postWorkoutSurvey.intensity === 'moderado' ? '#F59E0B18' : '#22C55E18',
                                    paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6,
                                }}>
                                    <Text style={{
                                        color: record.postWorkoutSurvey.intensity === 'intenso' ? '#EF4444' : record.postWorkoutSurvey.intensity === 'moderado' ? '#F59E0B' : '#22C55E',
                                        fontSize: 8, fontWeight: '900', textTransform: 'uppercase',
                                    }}>
                                        {record.postWorkoutSurvey.intensity}
                                    </Text>
                                </View>
                            )}
                        </View>
                        <Text style={{ color: theme.colors.text, fontSize: 15, fontWeight: '900', letterSpacing: -0.3, marginBottom: 4 }} numberOfLines={1}>
                            {record.workoutName}
                        </Text>
                        <Text style={{ color: theme.colors.textMuted, fontSize: 11, fontWeight: '600' }} numberOfLines={1}>
                            {preview}{extra}
                        </Text>
                    </View>

                    {/* Stats column */}
                    <View style={{ alignItems: 'flex-end', gap: 4, marginLeft: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Ionicons name="time-outline" size={11} color={theme.colors.textMuted} />
                            <Text style={{ color: theme.colors.text, fontSize: 12, fontWeight: '800' }}>{formatDuration(record.duration)}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Ionicons name="barbell-outline" size={11} color={theme.colors.textMuted} />
                            <Text style={{ color: theme.colors.text, fontSize: 12, fontWeight: '800' }}>{formatVolume(record.totalVolume)}</Text>
                        </View>
                        <Text style={{ color: theme.colors.textMuted, fontSize: 9, fontWeight: '600' }}>
                            {record.exercises.length} exerc.
                        </Text>
                    </View>

                    <Ionicons
                        name={expanded ? 'chevron-up' : 'chevron-down'}
                        size={14}
                        color={theme.colors.textMuted}
                        style={{ marginLeft: 8 }}
                    />
                </View>

                {/* Expanded: exercise list */}
                {expanded && (
                    <View style={{ paddingHorizontal: 16, paddingBottom: 14, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
                        <Text style={{ color: theme.colors.textMuted, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginTop: 12, marginBottom: 8 }}>
                            Exercícios realizados
                        </Text>
                        {record.exercises.map((ex, i) => {
                            const maxKg = Math.max(...ex.sets.map(s => s.kg), 0);
                            const totalSets = ex.sets.length;
                            return (
                                <View key={i} style={{
                                    flexDirection: 'row', alignItems: 'center',
                                    paddingVertical: 8,
                                    borderBottomWidth: i < record.exercises.length - 1 ? 1 : 0,
                                    borderBottomColor: theme.colors.border,
                                }}>
                                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.primary, marginRight: 10 }} />
                                    <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '700', flex: 1 }} numberOfLines={1}>{ex.name}</Text>
                                    <Text style={{ color: theme.colors.textMuted, fontSize: 11, fontWeight: '600' }}>
                                        {totalSets} séries{maxKg > 0 ? ` · ${maxKg}kg` : ''}
                                    </Text>
                                </View>
                            );
                        })}

                        {/* Post-workout survey summary */}
                        {record.postWorkoutSurvey && (
                            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                                <View style={{ backgroundColor: theme.colors.primary + '12', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                    <Ionicons
                                        name={record.postWorkoutSurvey.feeling === 'energizado' ? 'flash' : record.postWorkoutSurvey.feeling === 'satisfeito' ? 'happy' : 'battery-dead'}
                                        size={12}
                                        color={theme.colors.primary}
                                    />
                                    <Text style={{ color: theme.colors.text, fontSize: 10, fontWeight: '700' }}>{record.postWorkoutSurvey.feeling}</Text>
                                </View>
                                {record.postWorkoutSurvey.completedAllSeries && (
                                    <View style={{ backgroundColor: '#22C55E15', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                        <Ionicons name="checkmark-circle" size={12} color="#22C55E" />
                                        <Text style={{ color: '#22C55E', fontSize: 10, fontWeight: '700' }}>Concluído</Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
});

function WorkoutSessionsList() {
    const { theme } = useTheme();
    const { history } = useWorkoutHistory();
    const [search, setSearch] = useState('');

    const filtered = useMemo(() => {
        if (!search.trim()) return history;
        const q = search.toLowerCase();
        return history.filter(h =>
            h.workoutName.toLowerCase().includes(q) ||
            h.exercises.some(e => e.name.toLowerCase().includes(q))
        );
    }, [history, search]);

    // Group by month
    const sections = useMemo(() => {
        const map = new Map<string, WorkoutHistoryRecord[]>();
        filtered.forEach(r => {
            const d = new Date(r.date);
            const key = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(r);
        });
        return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
    }, [filtered]);

    const totalVolume = useMemo(() => history.reduce((a, h) => a + h.totalVolume, 0), [history]);
    const totalTime = useMemo(() => history.reduce((a, h) => a + h.duration, 0), [history]);

    const listHeader = (
        <View>
            {/* Summary strip */}
            <View style={{ flexDirection: 'row', paddingHorizontal: 24, gap: 10, marginBottom: 20 }}>
                {[
                    { label: 'Total', value: String(history.length), sub: 'treinos', color: theme.colors.primary },
                    { label: 'Volume', value: formatVolume(totalVolume), sub: 'total', color: '#10B981' },
                    { label: 'Tempo', value: formatDuration(totalTime), sub: 'total', color: '#F59E0B' },
                ].map((s, i) => (
                    <View key={i} style={{ flex: 1, backgroundColor: theme.colors.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: theme.colors.cardBorder, alignItems: 'center' }}>
                        <Text style={{ color: s.color, fontSize: 17, fontWeight: '900', letterSpacing: -0.5 }}>{s.value}</Text>
                        <Text style={{ color: theme.colors.textMuted, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>{s.sub}</Text>
                    </View>
                ))}
            </View>

            {/* Search */}
            <View style={{
                marginHorizontal: 24, marginBottom: 20,
                backgroundColor: theme.colors.card,
                borderRadius: 16, borderWidth: 1.5, borderColor: theme.colors.cardBorder,
                flexDirection: 'row', alignItems: 'center',
                paddingHorizontal: 14, paddingVertical: 12,
            }}>
                <Ionicons name="search" size={16} color={theme.colors.textMuted} />
                <TextInput
                    placeholder="Buscar treino ou exercício..."
                    placeholderTextColor={theme.colors.textMuted}
                    value={search}
                    onChangeText={setSearch}
                    style={{ flex: 1, marginLeft: 10, color: theme.colors.text, fontSize: 13, fontWeight: '600' }}
                />
                {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch('')}>
                        <Ionicons name="close-circle" size={16} color={theme.colors.textMuted} />
                    </TouchableOpacity>
                )}
            </View>

        </View>
    );

    return (
        <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
                <View style={{ paddingHorizontal: 24 }}>
                    <WorkoutSessionCard record={item} />
                </View>
            )}
            renderSectionHeader={({ section }) => (
                <View style={{ paddingHorizontal: 24, paddingTop: 4, backgroundColor: theme.colors.background }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '800', textTransform: 'capitalize' }}>
                            {section.title}
                        </Text>
                        <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.border, marginLeft: 12 }} />
                        <Text style={{ color: theme.colors.textMuted, fontSize: 10, fontWeight: '700', marginLeft: 8 }}>
                            {section.data.length} treinos
                        </Text>
                    </View>
                </View>
            )}
            ListHeaderComponent={listHeader}
            ListEmptyComponent={(
                <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 }}>
                    <Ionicons name="barbell-outline" size={44} color={theme.colors.textMuted} />
                    <Text style={{ color: theme.colors.textMuted, marginTop: 14, fontSize: 13, fontWeight: '700', textAlign: 'center' }}>
                        {search ? 'Nenhum treino encontrado' : 'Nenhum treino registrado ainda'}
                    </Text>
                </View>
            )}
            contentContainerStyle={{ paddingBottom: 150 }}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled={false}
            initialNumToRender={6}
            maxToRenderPerBatch={6}
            windowSize={7}
            removeClippedSubviews
            keyboardShouldPersistTaps="handled"
        />
    );
}

export function ProgressHistoryView() {
    const { theme } = useTheme();
    const { profile } = useUserStore();
    const [segment, setSegment] = useState<Segment>('treinos');

    const weeklyHistory = useMemo(
        () => [...(profile?.weeklyMonitoring || [])].reverse(),
        [profile?.weeklyMonitoring]
    );
    const periodicHistory = useMemo(
        () => [...(profile?.periodicAssessments || [])].reverse(),
        [profile?.periodicAssessments]
    );

    const formatShortDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
    };

    const TimelineItem = ({ isLast, children, index }: { isLast: boolean, children: React.ReactNode, index: number }) => (
        <Animated.View entering={FadeInDown.delay(index * 100).duration(700)} style={{ flexDirection: 'row' }}>
            <View style={{ alignItems: 'center', marginRight: 20 }}>
                <View style={{
                    backgroundColor: theme.colors.primary, borderColor: theme.colors.background,
                    borderWidth: 4, width: 16, height: 16, borderRadius: 8, zIndex: 10,
                    shadowColor: theme.colors.primary, shadowOpacity: 0.5, shadowRadius: 8, elevation: 5,
                }} />
                {!isLast && <View style={{ backgroundColor: theme.colors.cardBorder, width: 2, borderRadius: 1, flex: 1, marginTop: -2, opacity: 0.3 }} />}
            </View>
            <View style={{ flex: 1, paddingBottom: 28 }}>{children}</View>
        </Animated.View>
    );

    return (
        <View style={{ flex: 1 }}>

            {/* Segment control */}
            <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 }}>
                <View style={{
                    backgroundColor: theme.colors.card,
                    borderRadius: 18, borderWidth: 1.5, borderColor: theme.colors.cardBorder,
                    flexDirection: 'row', padding: 4,
                }}>
                    {([
                        { id: 'treinos', label: 'Sessões de Treino', icon: 'barbell' },
                        { id: 'monitoramento', label: 'Monitoramento', icon: 'pulse' },
                    ] as const).map(seg => {
                        const active = segment === seg.id;
                        return (
                            <TouchableOpacity
                                key={seg.id}
                                onPress={() => setSegment(seg.id)}
                                activeOpacity={0.8}
                                style={{
                                    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                                    paddingVertical: 10, borderRadius: 14, gap: 6,
                                    backgroundColor: active ? theme.colors.primary : 'transparent',
                                }}
                            >
                                <Ionicons name={seg.icon as any} size={14} color={active ? '#000' : theme.colors.textMuted} />
                                <Text style={{ color: active ? '#000' : theme.colors.textMuted, fontSize: 11, fontWeight: '800' }}>
                                    {seg.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {/* ── Sessões de Treino ── */}
            {segment === 'treinos' && <WorkoutSessionsList />}

            {/* ── Monitoramento ── */}
            {segment === 'monitoramento' && (
                <ScrollView
                    style={{ flex: 1 }}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 150 }}
                    removeClippedSubviews
                >
                    <AIPerformanceReport />

                    {/* Weekly Well-being */}
                    <View style={{ marginBottom: 40 }}>
                        <Animated.View entering={FadeInRight.duration(700)} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
                            <View style={{ backgroundColor: '#F59E0B15', width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                                <Ionicons name="calendar-clear" size={22} color="#F59E0B" />
                            </View>
                            <View>
                                <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '900', letterSpacing: -0.4 }}>Monitoramento</Text>
                                <Text style={{ color: theme.colors.textMuted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>Bem-estar semanal</Text>
                            </View>
                        </Animated.View>

                        {weeklyHistory.length > 0 ? (
                            weeklyHistory.map((item, idx) => (
                                <TimelineItem key={idx} isLast={idx === weeklyHistory.length - 1} index={idx}>
                                    <View style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder, borderWidth: 1.5, borderRadius: 24, padding: 20, overflow: 'hidden' }}>
                                        <LinearGradient colors={['#F59E0B08', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', inset: 0 }} />
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                            <Text style={{ color: theme.colors.text, fontSize: 17, fontWeight: '900', letterSpacing: -0.3 }}>{formatShortDate(item.date)}</Text>
                                            <View style={{ backgroundColor: theme.colors.backgroundTertiary, borderColor: theme.colors.cardBorder, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                                    <MaterialCommunityIcons name="scale-bathroom" size={13} color={theme.colors.textMuted} />
                                                    <Text style={{ color: theme.colors.text, fontWeight: '900', fontSize: 13 }}>{item.weight}kg</Text>
                                                </View>
                                            </View>
                                        </View>
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                            {[
                                                { label: 'Energia', val: item.energyLevel, color: '#F59E0B' },
                                                { label: 'Sono', val: item.sleepQuality, color: '#8B5CF6' },
                                                { label: 'Recup.', val: item.recoveryLevel, color: '#3B82F6' },
                                                { label: 'Estresse', val: item.stressLevel, color: '#EF4444' },
                                            ].map((stat, i) => (
                                                <View key={i} style={{ width: '47%', backgroundColor: theme.colors.backgroundTertiary, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: theme.colors.cardBorder }}>
                                                    <Text style={{ color: theme.colors.textMuted, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>{stat.label}</Text>
                                                    <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '900' }}>{stat.val}<Text style={{ fontSize: 11, color: theme.colors.textMuted, fontWeight: '600' }}>/5</Text></Text>
                                                    <View style={{ height: 3, backgroundColor: theme.colors.divider, borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
                                                        <View style={{ height: '100%', width: `${(stat.val / 5) * 100}%`, backgroundColor: stat.color, borderRadius: 2 }} />
                                                    </View>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                </TimelineItem>
                            ))
                        ) : (
                            <View style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder, borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 20, padding: 32, alignItems: 'center' }}>
                                <Ionicons name="clipboard-outline" size={40} color={theme.colors.textMuted} />
                                <Text style={{ color: theme.colors.textMuted, marginTop: 12, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 }}>Aguardando primeiro registro...</Text>
                            </View>
                        )}
                    </View>

                    {/* Periodic Assessments */}
                    <View style={{ marginBottom: 40 }}>
                        <Animated.View entering={FadeInRight.duration(700).delay(150)} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
                            <View style={{ backgroundColor: '#8B5CF615', width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                                <Ionicons name="analytics" size={22} color="#8B5CF6" />
                            </View>
                            <View>
                                <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '900', letterSpacing: -0.4 }}>Avaliações</Text>
                                <Text style={{ color: theme.colors.textMuted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>Evolução e métricas</Text>
                            </View>
                        </Animated.View>

                        {periodicHistory.length > 0 ? (
                            periodicHistory.map((item, idx) => (
                                <TimelineItem key={idx} isLast={idx === periodicHistory.length - 1} index={idx}>
                                    <View style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder, borderWidth: 1.5, borderRadius: 24, padding: 20, overflow: 'hidden' }}>
                                        <LinearGradient colors={['#8B5CF608', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', inset: 0 }} />
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                            <Text style={{ color: theme.colors.text, fontSize: 17, fontWeight: '900', letterSpacing: -0.3 }}>{formatShortDate(item.date)}</Text>
                                            <View style={{ backgroundColor: '#8B5CF618', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
                                                <Text style={{ color: '#8B5CF6', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' }}>{item.difficulty || 'Avaliação'}</Text>
                                            </View>
                                        </View>
                                        {item.measurements && (
                                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 14 }}>
                                                {Object.entries(item.measurements).slice(0, 6).map(([key, val]) => {
                                                    if (key === 'updatedAt' || typeof val !== 'number') return null;
                                                    return (
                                                        <View key={key} style={{ backgroundColor: theme.colors.backgroundTertiary, borderColor: theme.colors.cardBorder, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 }}>
                                                            <Text style={{ color: theme.colors.textMuted, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', marginRight: 5 }}>{key.slice(0, 3)}:</Text>
                                                            <Text style={{ color: theme.colors.text, fontSize: 12, fontWeight: '900' }}>{val}<Text style={{ fontSize: 8, color: theme.colors.textMuted }}>cm</Text></Text>
                                                        </View>
                                                    );
                                                })}
                                            </View>
                                        )}
                                        <View style={{ flexDirection: 'row', gap: 10 }}>
                                            <View style={{ flex: 1, backgroundColor: '#F59E0B12', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 }}>
                                                <Text style={{ color: theme.colors.textMuted, fontSize: 8, fontWeight: '700', textTransform: 'uppercase' }}>Satisfação</Text>
                                                <Text style={{ color: theme.colors.text, fontSize: 15, fontWeight: '900' }}>{item.satisfaction}/5</Text>
                                            </View>
                                            <View style={{ flex: 1, backgroundColor: '#EF444412', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 }}>
                                                <Text style={{ color: theme.colors.textMuted, fontSize: 8, fontWeight: '700', textTransform: 'uppercase' }}>Motivação</Text>
                                                <Text style={{ color: theme.colors.text, fontSize: 15, fontWeight: '900' }}>{item.motivation}/5</Text>
                                            </View>
                                        </View>
                                    </View>
                                </TimelineItem>
                            ))
                        ) : (
                            <View style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder, borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 20, padding: 32, alignItems: 'center' }}>
                                <Ionicons name="body-outline" size={40} color={theme.colors.textMuted} />
                                <Text style={{ color: theme.colors.textMuted, marginTop: 12, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 }}>Prepare sua primeira avaliação...</Text>
                            </View>
                        )}
                    </View>
                </ScrollView>
            )}
        </View>
    );
}
