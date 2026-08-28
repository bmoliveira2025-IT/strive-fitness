import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutHistoryRecord } from '../context/WorkoutHistoryContext';
import { supabase } from '../lib/supabase';
import { buildAchievements } from '../utils/achievements';

export interface LeaderboardAthlete {
    id: string;
    rank: number;
    name: string;
    avatarUrl?: string;
    avatarText: string;
    points: number;
    streak: number;
    achievementsCount?: number;
    isCurrentUser?: boolean;
}

export interface PointsBreakdown {
    basePoints: number;
    workoutPoints: number;
    streakPoints: number;
    achievementPoints: number;
    communityPoints: number;
    totalPoints: number;
    achievementsCount: number;
    workoutsCount: number;
}

// Baseline reference community athletes with realistic, fixed scores
// to guarantee a stable, non-shifting podium across all users and devices
export const GLOBAL_COMMUNITY_BASELINE: LeaderboardAthlete[] = [
    {
        id: 'persona-lucas-silva',
        rank: 1,
        name: 'Lucas Silva',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        avatarText: 'L',
        points: 2450,
        streak: 18,
        achievementsCount: 8,
    },
    {
        id: 'persona-camila-rocha',
        rank: 2,
        name: 'Camila Rocha',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
        avatarText: 'C',
        points: 1980,
        streak: 14,
        achievementsCount: 6,
    },
    {
        id: 'persona-rodrigo-lima',
        rank: 3,
        name: 'Rodrigo Lima',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
        avatarText: 'R',
        points: 1620,
        streak: 9,
        achievementsCount: 5,
    },
    {
        id: 'persona-beatriz-santos',
        rank: 4,
        name: 'Beatriz Santos',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
        avatarText: 'B',
        points: 1350,
        streak: 7,
        achievementsCount: 4,
    },
    {
        id: 'persona-felipe-costa',
        rank: 5,
        name: 'Felipe Costa',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
        avatarText: 'F',
        points: 1120,
        streak: 5,
        achievementsCount: 3,
    },
];

const LOCAL_POSTS_COUNT_KEY = '@strive_user_posts_count';
const LOCAL_COMMENTS_COUNT_KEY = '@strive_user_comments_count';
const LOCAL_LIKES_COUNT_KEY = '@strive_user_likes_count';

export const gamificationService = {
    // 1. Calculate points from real workouts, streaks, achievements & community participation
    calculatePoints(
        history: WorkoutHistoryRecord[] = [],
        streak: number = 0,
        weeklyTarget: number = 3,
        communityStats: { posts?: number; comments?: number; likes?: number } = {}
    ): PointsBreakdown {
        const workoutsCount = history.length;
        const totalVolumeKg = history.reduce((sum, item) => sum + (item.totalVolume || 0), 0);

        // Workout score: 120 pts per workout + 10 pts per 1,000 kg moved
        const volumeBonus = Math.floor(totalVolumeKg / 1000) * 10;
        const workoutPoints = workoutsCount * 120 + volumeBonus;

        // Streak score: 40 pts per consecutive day
        const streakPoints = Math.max(0, streak) * 40;

        // Achievements score: weighted tier points
        const achievements = buildAchievements(history, weeklyTarget);
        const unlockedAchievements = achievements.filter((a) => a.unlocked);

        let achievementPoints = 0;
        unlockedAchievements.forEach((a) => {
            if (a.tier === 'bronze') achievementPoints += 100;
            else if (a.tier === 'silver') achievementPoints += 200;
            else if (a.tier === 'gold') achievementPoints += 350;
            else if (a.tier === 'platinum') achievementPoints += 500;
            else if (a.tier === 'diamond') achievementPoints += 750;
            else achievementPoints += 150;
        });

        // Community score: +80 per post, +30 per comment, +10 per like
        const posts = communityStats.posts || 0;
        const comments = communityStats.comments || 0;
        const likes = communityStats.likes || 0;
        const communityPoints = posts * 80 + comments * 30 + likes * 10;

        // Base athlete score
        const basePoints = 250;

        const totalPoints = basePoints + workoutPoints + streakPoints + achievementPoints + communityPoints;

        return {
            basePoints,
            workoutPoints,
            streakPoints,
            achievementPoints,
            communityPoints,
            totalPoints,
            achievementsCount: unlockedAchievements.length,
            workoutsCount,
        };
    },

    // 2. Track community interactions locally
    async getCommunityActivityStats(): Promise<{ posts: number; comments: number; likes: number }> {
        try {
            const [posts, comments, likes] = await Promise.all([
                AsyncStorage.getItem(LOCAL_POSTS_COUNT_KEY),
                AsyncStorage.getItem(LOCAL_COMMENTS_COUNT_KEY),
                AsyncStorage.getItem(LOCAL_LIKES_COUNT_KEY),
            ]);
            return {
                posts: posts ? parseInt(posts, 10) || 0 : 0,
                comments: comments ? parseInt(comments, 10) || 0 : 0,
                likes: likes ? parseInt(likes, 10) || 0 : 0,
            };
        } catch {
            return { posts: 0, comments: 0, likes: 0 };
        }
    },

    async incrementCommunityPost(): Promise<void> {
        try {
            const current = (await this.getCommunityActivityStats()).posts;
            await AsyncStorage.setItem(LOCAL_POSTS_COUNT_KEY, (current + 1).toString());
        } catch {}
    },

    async incrementCommunityComment(): Promise<void> {
        try {
            const current = (await this.getCommunityActivityStats()).comments;
            await AsyncStorage.setItem(LOCAL_COMMENTS_COUNT_KEY, (current + 1).toString());
        } catch {}
    },

    async incrementCommunityLike(): Promise<void> {
        try {
            const current = (await this.getCommunityActivityStats()).likes;
            await AsyncStorage.setItem(LOCAL_LIKES_COUNT_KEY, (current + 1).toString());
        } catch {}
    },

    // 3. Sync User Profile with calculated points to Supabase
    async syncUserToSupabase(
        userId: string,
        name: string,
        avatarUrl?: string | null,
        points: number = 0,
        streak: number = 0,
        achievementsCount: number = 0
    ): Promise<void> {
        if (!userId) return;
        try {
            await supabase
                .from('profiles')
                .upsert(
                    {
                        id: userId,
                        full_name: name,
                        avatar_url: avatarUrl || null,
                        points,
                        streak,
                        achievements_count: achievementsCount,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: 'id' }
                );
        } catch (err) {
            console.warn('Supabase profile gamification sync note:', err);
        }
    },

    // 4. Fetch Global Leaderboard combining registered users & baseline athletes
    async fetchGlobalLeaderboard(currentUserId?: string): Promise<LeaderboardAthlete[]> {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, username, avatar_url, points, streak, achievements_count')
                .order('points', { ascending: false })
                .limit(30);

            const registeredUsers: LeaderboardAthlete[] = [];

            if (!error && Array.isArray(data)) {
                data.forEach((row: any) => {
                    const rowName = row.full_name || row.username || 'Atleta Strive';
                    registeredUsers.push({
                        id: row.id,
                        rank: 0,
                        name: rowName,
                        avatarUrl: row.avatar_url || undefined,
                        avatarText: rowName.charAt(0).toUpperCase(),
                        points: Number(row.points) || 0,
                        streak: Number(row.streak) || 0,
                        achievementsCount: Number(row.achievements_count) || 0,
                        isCurrentUser: row.id === currentUserId,
                    });
                });
            }

            // Combine registered users with baseline athletes to prevent empty or sparse ranks
            const allMap = new Map<string, LeaderboardAthlete>();

            // Add registered users first
            registeredUsers.forEach((u) => allMap.set(u.id, u));

            // Add baseline athletes if not conflicting
            GLOBAL_COMMUNITY_BASELINE.forEach((b) => {
                if (!allMap.has(b.id)) {
                    allMap.set(b.id, b);
                }
            });

            // Sort all by points descending
            const sortedList = Array.from(allMap.values()).sort((a, b) => b.points - a.points);

            // Assign ranks #1, #2, #3, ...
            return sortedList.map((item, index) => ({
                ...item,
                rank: index + 1,
                isCurrentUser: item.id === currentUserId,
            }));
        } catch (err) {
            console.warn('Error fetching global leaderboard:', err);
            // Fallback to stable baseline
            return GLOBAL_COMMUNITY_BASELINE.map((b, i) => ({ ...b, rank: i + 1 }));
        }
    },
};
