import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AchievementBadge } from '../../components/profile/AchievementBadge';
import { EditProfileModal } from '../../components/profile/EditProfileModal';
import { ProfileHeaderNew } from '../../components/profile/ProfileHeaderNew';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useUserStore } from '../../store/useUserStore';
import { useWorkoutHistory } from '../../context/WorkoutHistoryContext';
import { supabase } from '../../lib/supabase';
import { buildAchievements, getGoalMotivation } from '../../utils/achievements';


// ── 2×2 Shortcut Card ────────────────────────────────────────────────────────
const ShortcutCard = memo(function ShortcutCard({ icon, title, subtitle, onPress, color }: {
    icon: string; title: string; subtitle: string;
    onPress: () => void; color: string;
}) {
    const { theme } = useTheme();
    return (
        <View style={{ flex: 1 }}>
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.85}
                style={{
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.cardBorder,
                    borderWidth: 1,
                    borderRadius: 22,
                    padding: 18,
                    height: 148,
                    justifyContent: 'space-between',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: theme.mode === 'light' ? 0.05 : 0.2,
                    shadowRadius: 8,
                    elevation: 1,
                }}
            >
                <View style={{ backgroundColor: color + '18', width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={icon as any} size={22} color={color} />
                </View>
                <View style={{ minHeight: 52 }}>
                    <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '800', lineHeight: 18, minHeight: 36 }} numberOfLines={2}>{title}</Text>
                    <Text style={{ color: theme.colors.textSecondary, fontSize: 11, fontWeight: '600', lineHeight: 15 }} numberOfLines={1}>{subtitle}</Text>
                </View>
            </TouchableOpacity>
        </View>
    );
});

// ── Physical data cell ────────────────────────────────────────────────────────
const DataCell = memo(function DataCell({ icon, label, value, sub, color }: {
    icon: string; label: string; value: string; sub?: string; color: string;
}) {
    const { theme } = useTheme();
    return (
        <View style={{
            flex: 1,
            backgroundColor: theme.colors.card,
            borderRadius: 18,
            padding: 14,
            borderWidth: 1,
            borderColor: theme.colors.cardBorder,
            alignItems: 'center',
        }}>
            <View style={{ backgroundColor: color + '18', width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                <Ionicons name={icon as any} size={18} color={color} />
            </View>
            <Text style={{ color: theme.colors.text, fontSize: 15, fontWeight: '900', textAlign: 'center' }}>{value}</Text>
            <Text style={{ color: sub ? color : theme.colors.textSecondary, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', textAlign: 'center', marginTop: 2 }}>
                {sub || label}
            </Text>
        </View>
    );
});

// ─────────────────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const { profile, updateProfile } = useUserStore();
    const { history } = useWorkoutHistory();
    const { userName, setUserName } = useUserStore();
    const { session } = useAuth();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams();

    const [showEditModal, setShowEditModal] = useState(false);

    const achievements = useMemo(
        () => buildAchievements(history, profile?.onboardingData?.daysPerWeek ?? 3),
        [history, profile?.onboardingData?.daysPerWeek]
    );
    const unlockedAchievements = useMemo(() => achievements.filter(item => item.unlocked), [achievements]);
    const galleryAchievements = useMemo(
        () => [...unlockedAchievements, ...achievements.filter(item => !item.unlocked)].slice(0, 6),
        [achievements, unlockedAchievements]
    );
    const goalMotivation = useMemo(
        () => getGoalMotivation(history, profile?.onboardingData?.daysPerWeek ?? 3),
        [history, profile?.onboardingData?.daysPerWeek]
    );

    useEffect(() => {
        if (params.action === 'edit') {
            setShowEditModal(true);
            router.setParams({ action: undefined });
        }
    }, [params.action, router]);

    // ── Computed values ───────────────────────────────────────────────────────

    const bmi = useMemo(() => {
        if (!profile?.weight || !profile?.height) return null;
        return profile.weight / Math.pow(profile.height / 100, 2);
    }, [profile?.weight, profile?.height]);

    const bmiColor = useMemo(() => {
        if (bmi == null) return theme.colors.textSecondary;
        if (bmi < 18.5) return '#4F8FF7';
        if (bmi < 25) return '#22C55E';
        if (bmi < 30) return '#F59E0B';
        return '#EF4444';
    }, [bmi, theme]);

    const bmiLabel = useMemo(() => {
        if (bmi == null) return undefined;
        if (bmi < 18.5) return 'Abaixo';
        if (bmi < 25) return 'Normal';
        if (bmi < 30) return 'Sobrepeso';
        return 'Obeso';
    }, [bmi]);

    const getObjectiveLabel = useCallback((obj?: string) => {
        switch (obj) {
            case 'hipertrofia': return 'Hipertrofia';
            case 'força': return 'Força';
            case 'cutting': return 'Cutting';
            default: return 'Geral';
        }
    }, []);

    const handleHistoryPress = useCallback(() => router.push({ pathname: '/progress', params: { tab: 'exercises' } }), [router]);
    const handleStatsPress = useCallback(() => router.push({ pathname: '/progress', params: { tab: 'overview' } }), [router]);
    const handleMeasuresPress = useCallback(() => router.push({ pathname: '/progress', params: { tab: 'measures' } }), [router]);
    const handleAsymmetryPress = useCallback(() => router.push('/asymmetry-analysis'), [router]);

    const handleLogout = async () => {
        Alert.alert(
            'Sair',
            'Deseja realmente sair da sua conta?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Sair',
                    style: 'destructive',
                    onPress: async () => {
                        const { error } = await supabase.auth.signOut();
                        if (error) Alert.alert('Erro', error.message);
                    },
                },
            ]
        );
    };

    const handleSaveProfile = async (
        name?: string,
        weight?: number,
        height?: number,
        objective?: 'hipertrofia' | 'força' | 'cutting',
        bio?: string,
        photoUri?: string
    ) => {
        if (name) await setUserName(name);
        await updateProfile({ weight, height, objective, bio, photoUri });
    };

    const handleEditPress = useCallback(() => setShowEditModal(true), []);
    const handleSettingsPress = useCallback(() => router.push('/settings'), [router]);

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <View style={{ flex: 1, backgroundColor: 'transparent' }}>
            <StatusBar style={theme.mode === 'light' ? 'dark' : 'light'} />

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={true}
            >
                {/* ── Header ── */}
                <ProfileHeaderNew
                    userName={userName}
                    email={session?.user?.email}
                    photoUri={profile?.photoUri}
                    bio={profile?.bio}
                    weight={profile?.weight}
                    height={profile?.height}
                    onEditPress={handleEditPress}
                    onSettingsPress={handleSettingsPress}
                />

                {/* ── Dados Físicos ── */}
                <Animated.View entering={FadeInDown.delay(50).duration(400)} style={{ paddingHorizontal: 20, marginBottom: 28 }}>
                    <SectionHeader title="Dados Físicos" />
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <DataCell icon="resize-outline" label="Altura" value={profile?.height ? `${profile.height} cm` : '--'} color="#4F8FF7" />
                        <DataCell icon="barbell-outline" label="Peso" value={profile?.weight ? `${profile.weight} kg` : '--'} color="#22C55E" />
                        <DataCell
                            icon="fitness-outline"
                            label="IMC"
                            value={bmi ? bmi.toFixed(1) : '--'}
                            sub={bmiLabel}
                            color={bmiColor}
                        />
                        <DataCell icon="flag-outline" label="Objetivo" value={getObjectiveLabel(profile?.objective)} color="#A855F7" />
                    </View>
                </Animated.View>



                {/* ── Central de Atleta — 2×2 grid ── */}
                <Animated.View entering={FadeInDown.delay(100).duration(400)} style={{ paddingHorizontal: 20, marginBottom: 28 }}>
                    <SectionHeader title="Central de Atleta" />
                    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                        <ShortcutCard
                            icon="time-outline"
                            title="Histórico"
                            subtitle={`${history.length} sessão${history.length !== 1 ? 'ões' : ''}`}
                            onPress={handleHistoryPress}
                            color="#4F8FF7"
                        />
                        <ShortcutCard
                            icon="stats-chart-outline"
                            title="Estatísticas & PRs"
                            subtitle="Evolução pessoal"
                            onPress={handleStatsPress}
                            color="#A855F7"
                        />
                    </View>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <ShortcutCard
                            icon="body-outline"
                            title="Medidas"
                            subtitle="Composição corporal"
                            onPress={handleMeasuresPress}
                            color="#F59E0B"
                        />
                        <ShortcutCard
                            icon="scan-outline"
                            title="Diagnóstico"
                            subtitle="Análise de simetria"
                            onPress={handleAsymmetryPress}
                            color="#EF4444"
                        />
                    </View>
                </Animated.View>

                {/* ── Galeria de Medalhas ── */}
                <View style={{ marginBottom: 28 }}>
                    <View style={{ marginHorizontal: 20, marginBottom: 18, flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.primary + '14', borderColor: theme.colors.primary + '35', borderWidth: 1, borderRadius: 16, padding: 14 }}>
                        <Ionicons name={goalMotivation.icon as any} size={21} color={theme.colors.primaryDark} style={{ marginRight: 12 }} />
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '800' }}>{goalMotivation.title}</Text>
                            <Text style={{ color: theme.colors.textSecondary, fontSize: 11, lineHeight: 16, marginTop: 2 }}>{goalMotivation.message}</Text>
                        </View>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 }}>
                        <SectionHeader title="Galeria de Medalhas" subtitle={`${unlockedAchievements.length} de ${achievements.length} conquistadas`} noMargin />
                        <TouchableOpacity
                            onPress={() => router.push('/achievements')}
                            style={{ backgroundColor: theme.mode === 'light' ? theme.colors.primaryDark : theme.colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}
                        >
                            <Text style={{ color: theme.mode === 'light' ? '#FFFFFF' : theme.colors.onPrimary, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' }}>Ver Todas</Text>
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        horizontal
                        data={galleryAchievements}
                        keyExtractor={item => item.id}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingLeft: 20, paddingRight: 20, gap: 14 }}
                        initialNumToRender={5}
                        windowSize={3}
                        renderItem={({ item }) => (
                            <View style={{ width: 92, alignItems: 'center' }}>
                                <AchievementBadge icon={item.icon} type={item.tier} size={72} locked={!item.unlocked} />
                                <Text style={{ color: item.unlocked ? theme.colors.text : theme.colors.textMuted, fontSize: 10, fontWeight: '700', textAlign: 'center', marginTop: 8 }} numberOfLines={2}>
                                    {item.title}
                                </Text>
                            </View>
                        )}
                    />
                </View>

                {/* ── Logout ── */}
                <View style={{ paddingHorizontal: 20, marginBottom: 32 }}>
                    <TouchableOpacity
                        onPress={handleLogout}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 16,
                            borderRadius: 18,
                            backgroundColor: '#ef444410',
                            borderWidth: 1.5,
                            borderColor: '#ef444422',
                        }}
                    >
                        <Ionicons name="log-out-outline" size={20} color="#ef4444" style={{ marginRight: 8 }} />
                        <Text style={{ color: '#ef4444', fontWeight: '900', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                            Sair da Conta
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <EditProfileModal
                visible={showEditModal}
                currentName={userName}
                currentWeight={profile?.weight}
                currentHeight={profile?.height}
                currentObjective={profile?.objective}
                currentBio={profile?.bio}
                currentPhotoUri={profile?.photoUri}
                onSave={handleSaveProfile}
                onClose={() => setShowEditModal(false)}
            />
        </View>
    );
}

// ── Reusable section header ───────────────────────────────────────────────────
function SectionHeader({ title, subtitle, noMargin }: { title: string; subtitle?: string; noMargin?: boolean }) {
    const { theme } = useTheme();
    return (
        <View style={{ marginBottom: noMargin ? 0 : 14 }}>
            <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '900', letterSpacing: -0.4 }}>{title}</Text>
            {subtitle && (
                <Text style={{ color: theme.colors.textSecondary, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>
                    {subtitle}
                </Text>
            )}
        </View>
    );
}
