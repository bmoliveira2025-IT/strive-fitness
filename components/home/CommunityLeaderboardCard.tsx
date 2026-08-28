import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { FontFamily, Radius } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useWorkoutHistory } from '../../context/WorkoutHistoryContext';
import { useStreak } from '../../hooks/useStreak';
import {
    gamificationService,
    LeaderboardAthlete,
    PointsBreakdown,
} from '../../services/gamificationService';
import { useUserStore } from '../../store/useUserStore';

export function CommunityLeaderboardCard() {
    const { theme } = useTheme();
    const router = useRouter();
    const { userName, profile } = useUserStore();
    const { session } = useAuth();
    const { history } = useWorkoutHistory();
    const streak = useStreak(history);

    const [fullLeaderboard, setFullLeaderboard] = useState<LeaderboardAthlete[]>([]);
    const [communityStats, setCommunityStats] = useState<{ posts: number; comments: number; likes: number }>({
        posts: 0,
        comments: 0,
        likes: 0,
    });
    const [loading, setLoading] = useState(false);

    const currentUserId = session?.user?.id || profile?.id || 'local-user';
    const weeklyTarget = profile?.onboardingData?.daysPerWeek || 3;

    // 1. Calculate user points based on real workouts, streak, achievements & forum activity
    const pointsBreakdown: PointsBreakdown = useMemo(() => {
        return gamificationService.calculatePoints(
            history,
            streak || 0,
            weeklyTarget,
            communityStats
        );
    }, [history, streak, weeklyTarget, communityStats]);

    // 2. Fetch and sync leaderboard
    useEffect(() => {
        let isMounted = true;

        const syncAndFetch = async () => {
            setLoading(true);
            try {
                // Fetch local community stats
                const commStats = await gamificationService.getCommunityActivityStats();
                if (isMounted) setCommunityStats(commStats);

                // Sync current user points to Supabase if session exists
                if (session?.user) {
                    const currentName = userName || session.user.user_metadata?.full_name || 'Atleta Strive';
                    const avatar = profile?.photoUri || session.user.user_metadata?.avatar_url || null;

                    await gamificationService.syncUserToSupabase(
                        session.user.id,
                        currentName,
                        avatar,
                        pointsBreakdown.totalPoints,
                        streak || 0,
                        pointsBreakdown.achievementsCount
                    );
                }

                // Fetch global unified leaderboard
                const board = await gamificationService.fetchGlobalLeaderboard(currentUserId);
                if (isMounted) {
                    setFullLeaderboard(board);
                }
            } catch (err) {
                console.warn('Leaderboard sync error:', err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        syncAndFetch();

        return () => {
            isMounted = false;
        };
    }, [session?.user?.id, userName, profile?.photoUri, pointsBreakdown.totalPoints, streak, pointsBreakdown.achievementsCount, currentUserId]);

    // 3. Find current user's position in global leaderboard
    const currentUserAthlete = useMemo<LeaderboardAthlete>(() => {
        const found = fullLeaderboard.find((u) => u.isCurrentUser || u.id === currentUserId);
        if (found) return found;

        // If not found yet in global list, create user's live entry
        return {
            id: currentUserId,
            rank: fullLeaderboard.length + 1,
            name: userName ? `${userName} (Você)` : 'Você',
            avatarUrl: profile?.photoUri,
            avatarText: (userName ? userName.charAt(0) : 'V').toUpperCase(),
            points: pointsBreakdown.totalPoints,
            streak: streak || 0,
            achievementsCount: pointsBreakdown.achievementsCount,
            isCurrentUser: true,
        };
    }, [fullLeaderboard, currentUserId, userName, profile?.photoUri, pointsBreakdown.totalPoints, streak, pointsBreakdown.achievementsCount]);

    // 4. Construct the 4-Row Display: Always Top 1, Top 2, Top 3 + 4th Row for User's Position
    const displayList = useMemo<LeaderboardAthlete[]>(() => {
        if (fullLeaderboard.length === 0) return [];

        const top1 = fullLeaderboard[0];
        const top2 = fullLeaderboard[1];
        const top3 = fullLeaderboard[2];
        const top4 = fullLeaderboard[3];

        const isUserInTop3 = currentUserAthlete.rank <= 3;

        if (isUserInTop3) {
            // User is in the top 3! Show top 3 (with user highlighted) and 4th place
            return [top1, top2, top3, top4].filter(Boolean);
        }

        // User is 4th or below: Show Top 1, 2, 3, followed by User's exact position as #4
        return [
            top1,
            top2,
            top3,
            {
                ...currentUserAthlete,
                name: userName ? `${userName} (Você)` : 'Você',
                avatarUrl: profile?.photoUri,
                isCurrentUser: true,
            },
        ].filter(Boolean);
    }, [fullLeaderboard, currentUserAthlete, userName, profile?.photoUri]);

    // Points needed to reach top 3
    const pointsToTop3 = useMemo(() => {
        if (fullLeaderboard.length < 3) return 0;
        const thirdPlacePoints = fullLeaderboard[2]?.points || 0;
        return Math.max(0, thirdPlacePoints - currentUserAthlete.points + 10);
    }, [fullLeaderboard, currentUserAthlete.points]);

    return (
        <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="trophy" size={16} color="#EAB308" />
                    <Text
                        style={{
                            color: theme.colors.textSecondary,
                            fontSize: 12,
                            fontFamily: FontFamily.caption,
                            letterSpacing: 0.8,
                            textTransform: 'uppercase',
                        }}
                    >
                        Ranking da Comunidade
                    </Text>
                </View>
                <View
                    style={{
                        backgroundColor: 'rgba(234, 179, 8, 0.15)',
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: Radius.sm,
                        borderWidth: 1,
                        borderColor: 'rgba(234, 179, 8, 0.3)',
                    }}
                >
                    <Text style={{ color: '#EAB308', fontSize: 10, fontFamily: FontFamily.sansBold }}>
                        LIGA OFICIAL
                    </Text>
                </View>
            </View>

            {/* Leaderboard Card */}
            <View
                style={{
                    borderRadius: Radius.lg,
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                    backgroundColor: theme.mode === 'dark' ? '#12141A' : '#FFFFFF',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: theme.mode === 'dark' ? 0.25 : 0.05,
                    shadowRadius: 10,
                    elevation: 3,
                }}
            >
                <LinearGradient
                    colors={
                        theme.mode === 'dark'
                            ? ['rgba(24, 28, 38, 0.7)', 'rgba(14, 16, 22, 0.95)']
                            : ['rgba(245, 247, 250, 0.8)', 'rgba(255, 255, 255, 0.95)']
                    }
                    style={{ padding: 16 }}
                >
                    {/* Top 3 + User Rank Rows */}
                    <View style={{ gap: 8 }}>
                        {displayList.map((user, index) => {
                            const isFirst = user.rank === 1;
                            const isSecond = user.rank === 2;
                            const isThird = user.rank === 3;
                            const isUserRow = user.isCurrentUser || user.id === currentUserId;

                            const rankColor = isFirst ? '#EAB308' : isSecond ? '#94A3B8' : isThird ? '#D97706' : theme.colors.primary;
                            const medalIcon = isFirst ? '🥇' : isSecond ? '🥈' : isThird ? '🥉' : null;

                            return (
                                <View
                                    key={`${user.id}-${user.rank}-${index}`}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingVertical: 9,
                                        paddingHorizontal: 12,
                                        borderRadius: Radius.md,
                                        backgroundColor: isUserRow
                                            ? theme.colors.primary + '16'
                                            : (theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : '#F8FAFC'),
                                        borderWidth: 1,
                                        borderColor: isUserRow ? theme.colors.primary : 'transparent',
                                    }}
                                >
                                    {/* Rank badge */}
                                    <View
                                        style={{
                                            width: 28,
                                            height: 28,
                                            borderRadius: 14,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginRight: 10,
                                            backgroundColor: user.rank <= 3 ? rankColor + '20' : theme.colors.primary + '15',
                                        }}
                                    >
                                        {medalIcon ? (
                                            <Text style={{ fontSize: 14 }}>{medalIcon}</Text>
                                        ) : (
                                            <Text
                                                style={{
                                                    color: isUserRow ? theme.colors.primary : theme.colors.textMuted,
                                                    fontSize: 12,
                                                    fontFamily: FontFamily.sansBold,
                                                }}
                                            >
                                                #{user.rank}
                                            </Text>
                                        )}
                                    </View>

                                    {/* Avatar */}
                                    <View
                                        style={{
                                            width: 34,
                                            height: 34,
                                            borderRadius: 17,
                                            backgroundColor: isUserRow ? theme.colors.primary : theme.colors.backgroundTertiary,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginRight: 10,
                                            overflow: 'hidden',
                                        }}
                                    >
                                        {user.avatarUrl ? (
                                            <Image
                                                source={{ uri: user.avatarUrl }}
                                                style={{ width: '100%', height: '100%' }}
                                                contentFit="cover"
                                            />
                                        ) : (
                                            <Text
                                                style={{
                                                    color: isUserRow ? '#000000' : theme.colors.text,
                                                    fontSize: 13,
                                                    fontFamily: FontFamily.sansBold,
                                                }}
                                            >
                                                {user.avatarText || user.name.charAt(0).toUpperCase()}
                                            </Text>
                                        )}
                                    </View>

                                    {/* Name & Tag */}
                                    <View style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                            <Text
                                                numberOfLines={1}
                                                ellipsizeMode="tail"
                                                style={{
                                                    color: isUserRow ? theme.colors.primary : theme.colors.text,
                                                    fontSize: 13,
                                                    fontFamily: isUserRow ? FontFamily.sansBold : FontFamily.sansMedium,
                                                    flexShrink: 1,
                                                }}
                                            >
                                                {user.name}
                                            </Text>
                                            {isUserRow && (
                                                <View
                                                    style={{
                                                        backgroundColor: theme.colors.primary,
                                                        paddingHorizontal: 6,
                                                        paddingVertical: 1.5,
                                                        borderRadius: 4,
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    <Text style={{ color: '#000000', fontSize: 9, fontFamily: FontFamily.sansBold }}>
                                                        VOCÊ
                                                    </Text>
                                                </View>
                                            )}
                                        </View>

                                        <Text
                                            numberOfLines={1}
                                            style={{
                                                color: theme.colors.textMuted,
                                                fontSize: 10,
                                                fontFamily: FontFamily.sans,
                                            }}
                                        >
                                            {user.streak > 0 ? `Sequência de ${user.streak} dias` : 'Atleta ativo'}
                                        </Text>
                                    </View>

                                    {/* Points and Streak */}
                                    <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
                                        <Text
                                            style={{
                                                color: isUserRow ? theme.colors.primary : theme.colors.text,
                                                fontSize: 13,
                                                fontFamily: FontFamily.displaySemiBold,
                                            }}
                                        >
                                            {user.points.toLocaleString()} pts
                                        </Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                                            <Ionicons name="flame" size={11} color="#F59E0B" />
                                            <Text style={{ color: theme.colors.textMuted, fontSize: 10, fontFamily: FontFamily.sans }}>
                                                {user.streak}d
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </View>

                    {/* Motivational Progress Hint for User */}
                    <View
                        style={{
                            marginTop: 12,
                            padding: 10,
                            borderRadius: Radius.md,
                            backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : '#F1F5F9',
                            borderWidth: 1,
                            borderColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#E2E8F0',
                            gap: 6,
                        }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Ionicons name="flash" size={14} color={theme.colors.primary} style={{ flexShrink: 0 }} />
                            <Text
                                numberOfLines={1}
                                ellipsizeMode="tail"
                                style={{
                                    color: theme.colors.text,
                                    fontSize: 11,
                                    fontFamily: FontFamily.sansBold,
                                    flex: 1,
                                }}
                            >
                                {currentUserAthlete.rank <= 3
                                    ? `🎉 Você está no Pódio (#${currentUserAthlete.rank})!`
                                    : `Posição #${currentUserAthlete.rank} • Faltam ${pointsToTop3.toLocaleString()} pts para o Top 3`}
                            </Text>
                        </View>

                        {/* Point earning incentives */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 4, marginTop: 4 }}>
                            <TouchableOpacity
                                onPress={() => router.push('/(tabs)/workout' as any)}
                                style={{
                                    flex: 1,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 3,
                                    backgroundColor: theme.mode === 'dark' ? '#181C26' : '#FFFFFF',
                                    paddingVertical: 5,
                                    borderRadius: 6,
                                }}
                            >
                                <Ionicons name="barbell" size={11} color={theme.colors.primary} />
                                <Text style={{ color: theme.colors.textSecondary, fontSize: 9, fontFamily: FontFamily.sansBold }}>
                                    +120 Treino
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => router.push('/achievements')}
                                style={{
                                    flex: 1,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 3,
                                    backgroundColor: theme.mode === 'dark' ? '#181C26' : '#FFFFFF',
                                    paddingVertical: 5,
                                    borderRadius: 6,
                                }}
                            >
                                <Ionicons name="medal" size={11} color="#EAB308" />
                                <Text style={{ color: theme.colors.textSecondary, fontSize: 9, fontFamily: FontFamily.sansBold }}>
                                    +350 Medalha
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => router.push('/community')}
                                style={{
                                    flex: 1,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 3,
                                    backgroundColor: theme.mode === 'dark' ? '#181C26' : '#FFFFFF',
                                    paddingVertical: 5,
                                    borderRadius: 6,
                                }}
                            >
                                <Ionicons name="chatbubble" size={11} color="#3B82F6" />
                                <Text style={{ color: theme.colors.textSecondary, fontSize: 9, fontFamily: FontFamily.sansBold }}>
                                    +80 Fórum
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Bottom CTA */}
                    <View
                        style={{
                            marginTop: 12,
                            paddingTop: 10,
                            borderTopWidth: 1,
                            borderTopColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 10,
                        }}
                    >
                        <Text
                            numberOfLines={1}
                            style={{
                                flex: 1,
                                color: theme.colors.textMuted,
                                fontSize: 11,
                                fontFamily: FontFamily.sans,
                            }}
                        >
                            Ranking oficial em tempo real
                        </Text>
                        <TouchableOpacity
                            onPress={() => router.push('/community')}
                            activeOpacity={0.7}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 4,
                                flexShrink: 0,
                                paddingVertical: 2,
                            }}
                        >
                            <Text style={{ color: theme.colors.primary, fontSize: 12, fontFamily: FontFamily.sansSemiBold }}>
                                Ir para o Fórum
                            </Text>
                            <Ionicons name="chevron-forward" size={14} color={theme.colors.primary} />
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            </View>
        </View>
    );
}
