import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from '../../services/imagePicker';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontFamily, Radius } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { useWorkoutHistory } from '../../context/WorkoutHistoryContext';
import {
    CommunityComment,
    CommunityPost,
    CommunityService,
} from '../../services/communityService';
import { useUserStore } from '../../store/useUserStore';

const GROUPS = [
    { id: 'todos', name: 'Todos os Grupos' },
    { id: 'geral', name: 'Feed Geral' },
    { id: 'desafio30', name: 'Desafio 30 Dias' },
    { id: 'hipertrofia', name: 'Foco Hipertrofia' },
    { id: 'mulheres', name: 'Mulheres no Treino' },
    { id: 'corrida', name: 'Corrida & Cardio' },
];

const INITIAL_FEED_POSTS: CommunityPost[] = [
    {
        id: 'post-seed-tamiris',
        userId: 'seed-tamiris',
        userName: 'Tamiris Abreu',
        userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=70',
        imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&auto=format&fit=crop&q=70',
        content: 'Treino de membros inferiores pago com sucesso! Foco na consistência e evolução diária 💪✨',
        category: 'Treinos',
        groupName: 'Mulheres no Treino',
        workoutTag: 'Inferiores Completo',
        workoutStats: { durationMinutes: 52, calories: 340, exercisesCount: 6, volumeKg: 3250 },
        likesCount: 14,
        dislikesCount: 0,
        commentsCount: 3,
        isLikedByMe: false,
        isDislikedByMe: false,
        isStarred: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    },
    {
        id: 'post-seed-breno',
        userId: 'seed-breno',
        userName: 'Breno Fagundes',
        userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=70',
        imageUrl: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&auto=format&fit=crop&q=70',
        content: 'Corrida matinal concluída! 8km no ritmo constante. A mente agradece antes do trabalho 🏃‍♂️🔥',
        category: 'Treinos',
        groupName: 'Corrida & Cardio',
        workoutTag: 'Corrida Matinal',
        workoutStats: { durationMinutes: 42, calories: 410, exercisesCount: 1 },
        likesCount: 22,
        dislikesCount: 0,
        commentsCount: 5,
        isLikedByMe: true,
        isDislikedByMe: false,
        isStarred: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
    },
    {
        id: 'post-seed-lucas',
        userId: 'seed-lucas',
        userName: 'Lucas Silva',
        userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=70',
        content: 'Peito e ombros finalizado! Nova carga máxima no supino reto atingida hoje (94kg). O plano dá resultado! 💪',
        category: 'Treinos',
        groupName: 'Foco Hipertrofia',
        workoutTag: 'Peito & Ombros',
        workoutStats: { durationMinutes: 65, calories: 480, exercisesCount: 7, volumeKg: 5800 },
        likesCount: 38,
        dislikesCount: 1,
        commentsCount: 8,
        isLikedByMe: false,
        isDislikedByMe: false,
        isStarred: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    },
];

export default function FeedScreen() {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { session } = useAuth();
    const { profile } = useUserStore();
    const { history } = useWorkoutHistory();
    const toast = useToast();

    const PAGE_BATCH = 4;
    const [visibleCount, setVisibleCount] = useState(PAGE_BATCH);
    const [posts, setPosts] = useState<CommunityPost[]>(INITIAL_FEED_POSTS);
    const [selectedGroup, setSelectedGroup] = useState<string>('todos');
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Create post state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newPostText, setNewPostText] = useState('');
    const [newPostImage, setNewPostImage] = useState<string | null>(null);
    const [newPostGroup, setNewPostGroup] = useState('Geral');
    const [isPublishing, setIsPublishing] = useState(false);

    // Comments Modal
    const [activeCommentsPost, setActiveCommentsPost] = useState<CommunityPost | null>(null);
    const [commentsList, setCommentsList] = useState<CommunityComment[]>([]);
    const [newCommentText, setNewCommentText] = useState('');
    const [isSendingComment, setIsSendingComment] = useState(false);

    const currentUserId = session?.user?.id || profile?.id || 'local-user';
    const currentUserName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'Atleta Strive';
    const currentUserAvatar = profile?.photoUri || session?.user?.user_metadata?.avatar_url;

    // Load posts from CommunityService and integrate user's local history
    const loadPosts = useCallback(async () => {
        try {
            const fetched = await CommunityService.getPosts();

            // Build posts from user's local workout history so their latest training is in the feed!
            const historyPosts: CommunityPost[] = (history || [])
                .filter((h) => h.exercises && h.exercises.length > 0)
                .map((h) => {
                    const durationMin = Math.max(1, Math.round((h.duration || 0) / 60));
                    const calories = Math.round(durationMin * 6.5);
                    return {
                        id: `my-workout-${h.id}`,
                        userId: currentUserId,
                        userName: currentUserName || 'Você',
                        userAvatar: currentUserAvatar,
                        userBadge: 'Meu Treino',
                        content: `Treino "${h.workoutName || 'Personalizado'}" concluído! ${h.exercises.length} exercícios, ${h.totalSeries || 0} séries e ${Math.round(h.totalVolume || 0)}kg de volume total acumulado. 💪🔥`,
                        category: 'Treinos' as const,
                        groupName: 'Treinos',
                        workoutTag: h.workoutName,
                        workoutStats: {
                            durationMinutes: durationMin,
                            calories,
                            exercisesCount: h.exercises.length,
                            volumeKg: Math.round(h.totalVolume || 0),
                        },
                        imageUrl: h.media && h.media.length > 0 ? h.media[0] : undefined,
                        likesCount: 3,
                        dislikesCount: 0,
                        commentsCount: 0,
                        isLikedByMe: false,
                        isDislikedByMe: false,
                        isStarred: false,
                        createdAt: h.date || new Date().toISOString(),
                    };
                });

            const combinedMap = new Map<string, CommunityPost>();

            // 1. Add remote posts
            if (fetched && fetched.length > 0) {
                fetched.forEach((p) => combinedMap.set(p.id, p));
            }

            // 2. Add local user workout posts (real workouts from Strive)
            historyPosts.forEach((p) => combinedMap.set(p.id, p));

            // 3. Fallback seeds
            INITIAL_FEED_POSTS.forEach((seed) => {
                if (!combinedMap.has(seed.id)) {
                    combinedMap.set(seed.id, seed);
                }
            });

            // Sort descending by date so the LATEST post is ALWAYS FIRST
            const sorted = Array.from(combinedMap.values()).sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            setPosts(sorted);
        } catch (e) {
            console.warn('Error loading feed:', e);
        }
    }, [history, currentUserId, currentUserName, currentUserAvatar]);

    useEffect(() => {
        loadPosts();
    }, [loadPosts]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await loadPosts();
        setIsRefreshing(false);
    };

    // Filtered by selected group
    const displayedPosts = useMemo(() => {
        return posts.filter((p) => {
            if (selectedGroup === 'todos') return true;
            const groupObj = GROUPS.find((g) => g.id === selectedGroup);
            if (!groupObj) return true;
            return p.groupName?.toLowerCase() === groupObj.name.toLowerCase() || p.category?.toLowerCase() === groupObj.name.toLowerCase();
        });
    }, [posts, selectedGroup]);

    const handleLoadMore = useCallback(() => {
        if (visibleCount < displayedPosts.length) {
            setVisibleCount((prev) => Math.min(prev + PAGE_BATCH, displayedPosts.length));
        }
    }, [visibleCount, displayedPosts.length]);

    const visiblePosts = useMemo(() => {
        return displayedPosts.slice(0, visibleCount);
    }, [displayedPosts, visibleCount]);

    // Image Picker
    const pickImage = async (useCamera = false) => {
        try {
            let result;
            if (useCamera) {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permissão necessária', 'Precisamos de acesso à câmera para você tirar fotos.');
                    return;
                }
                result = await ImagePicker.launchCameraAsync({
                    allowsEditing: true,
                    aspect: [4, 5],
                    quality: 0.8,
                });
            } else {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permissão necessária', 'Precisamos de acesso às suas fotos.');
                    return;
                }
                result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ['images'],
                    allowsEditing: true,
                    aspect: [4, 5],
                    quality: 0.8,
                });
            }

            if (!result.canceled && result.assets && result.assets[0].uri) {
                setNewPostImage(result.assets[0].uri);
            }
        } catch (err) {
            console.warn('Erro ao selecionar foto:', err);
        }
    };

    // Publish post
    const handlePublishPost = async () => {
        if (!newPostText.trim() && !newPostImage) {
            Alert.alert('Aviso', 'Adicione uma foto ou escreva um texto sobre o seu treino.');
            return;
        }

        setIsPublishing(true);
        try {
            const created = await CommunityService.createPost({
                userId: currentUserId,
                userName: currentUserName,
                userAvatar: currentUserAvatar,
                content: newPostText.trim(),
                category: 'Treinos',
                userBadge: 'Atleta Strive',
            });

            const enriched: CommunityPost = {
                ...created,
                imageUrl: newPostImage || undefined,
                groupName: newPostGroup,
                likesCount: 0,
                dislikesCount: 0,
                commentsCount: 0,
                isLikedByMe: false,
                isDislikedByMe: false,
                isStarred: false,
            };

            setPosts((prev) => [enriched, ...prev]);
            setIsCreateModalOpen(false);
            setNewPostText('');
            setNewPostImage(null);
            toast.success('Treino publicado com sucesso!');
        } catch (err) {
            Alert.alert('Erro', 'Não foi possível publicar. Tente novamente.');
        } finally {
            setIsPublishing(false);
        }
    };

    // Like Toggle
    const handleToggleLike = (post: CommunityPost) => {
        const wasLiked = !!post.isLikedByMe;
        const newLikes = Math.max(0, (post.likesCount || 0) + (wasLiked ? -1 : 1));
        const updated = posts.map((p) =>
            p.id === post.id
                ? {
                      ...p,
                      isLikedByMe: !wasLiked,
                      likesCount: newLikes,
                      // If liking, remove dislike
                      isDislikedByMe: false,
                      dislikesCount: wasLiked ? p.dislikesCount : Math.max(0, (p.dislikesCount || 0) - (p.isDislikedByMe ? 1 : 0)),
                  }
                : p
        );
        setPosts(updated);
        CommunityService.toggleLike(post.id, currentUserId, post.likesCount || 0, wasLiked).catch(() => {});
    };

    // Dislike Toggle
    const handleToggleDislike = (post: CommunityPost) => {
        const wasDisliked = !!post.isDislikedByMe;
        const newDislikes = Math.max(0, (post.dislikesCount || 0) + (wasDisliked ? -1 : 1));
        const updated = posts.map((p) =>
            p.id === post.id
                ? {
                      ...p,
                      isDislikedByMe: !wasDisliked,
                      dislikesCount: newDislikes,
                      // If disliking, remove like
                      isLikedByMe: false,
                      likesCount: wasDisliked ? p.likesCount : Math.max(0, (p.likesCount || 0) - (p.isLikedByMe ? 1 : 0)),
                  }
                : p
        );
        setPosts(updated);
    };

    // Star Toggle
    const handleToggleStar = (post: CommunityPost) => {
        const wasStarred = !!post.isStarred;
        setPosts((prev) =>
            prev.map((p) => (p.id === post.id ? { ...p, isStarred: !wasStarred } : p))
        );
        toast.info(wasStarred ? 'Removido dos favoritos' : 'Salvo nos favoritos!');
    };

    // Open Comments Modal
    const handleOpenComments = async (post: CommunityPost) => {
        setActiveCommentsPost(post);
        try {
            const comments = await CommunityService.getComments(post.id);
            setCommentsList(comments || []);
        } catch {
            setCommentsList([]);
        }
    };

    // Send Comment
    const handleSendComment = async () => {
        if (!newCommentText.trim() || !activeCommentsPost) return;
        setIsSendingComment(true);
        try {
            const newComment = await CommunityService.addComment({
                postId: activeCommentsPost.id,
                userId: currentUserId,
                userName: currentUserName,
                userAvatar: currentUserAvatar,
                content: newCommentText.trim(),
            });

            setCommentsList((prev) => [...prev, newComment]);
            setPosts((prev) =>
                prev.map((p) =>
                    p.id === activeCommentsPost.id
                        ? { ...p, commentsCount: (p.commentsCount || 0) + 1 }
                        : p
                )
            );
            setNewCommentText('');
        } catch {
            Alert.alert('Erro', 'Não foi possível enviar o comentário.');
        } finally {
            setIsSendingComment(false);
        }
    };

    const selectedGroupName = GROUPS.find((g) => g.id === selectedGroup)?.name || 'Feed de treinos';

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <StatusBar style={theme.mode === 'light' ? 'dark' : 'light'} />
            {/* ════════════════ TOP HEADER ════════════════ */}
            <View
                style={{
                    paddingTop: insets.top + 10,
                    paddingBottom: 14,
                    paddingHorizontal: 16,
                    backgroundColor: theme.colors.background,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : theme.colors.cardBorder,
                }}
            >
                {/* Center Dropdown Title: Feed de treinos ⌵ */}
                <TouchableOpacity
                    onPress={() => setIsGroupModalOpen(true)}
                    activeOpacity={0.8}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                >
                    <Text
                        style={{
                            color: theme.colors.text,
                            fontSize: 19,
                            fontFamily: FontFamily.display,
                            letterSpacing: -0.4,
                        }}
                    >
                        {selectedGroup === 'todos' ? 'Feed de treinos' : selectedGroupName}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color={theme.colors.primary} />
                </TouchableOpacity>

                {/* Right Action: + Button to create post */}
                <TouchableOpacity
                    onPress={() => setIsCreateModalOpen(true)}
                    activeOpacity={0.7}
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: 'rgba(56, 189, 248, 0.15)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: 'rgba(56, 189, 248, 0.3)',
                    }}
                >
                    <Ionicons name="add" size={24} color="#38BDF8" />
                </TouchableOpacity>
            </View>

            {/* ════════════════ POSTS LIST ════════════════ */}
            <FlatList
                data={visiblePosts}
                keyExtractor={(item) => item.id}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        tintColor="#38BDF8"
                    />
                }
                contentContainerStyle={{
                    paddingBottom: insets.bottom + 90,
                }}
                initialNumToRender={3}
                maxToRenderPerBatch={3}
                windowSize={5}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.4}
                ListFooterComponent={() => {
                    if (displayedPosts.length === 0) return null;
                    if (visibleCount < displayedPosts.length) {
                        return (
                            <TouchableOpacity
                                onPress={handleLoadMore}
                                activeOpacity={0.8}
                                style={{
                                    marginHorizontal: 16,
                                    marginVertical: 14,
                                    paddingVertical: 12,
                                    borderRadius: Radius.md,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                                    borderWidth: 1,
                                    borderColor: 'rgba(56, 189, 248, 0.25)',
                                    flexDirection: 'row',
                                    gap: 6,
                                }}
                            >
                                <Ionicons name="chevron-down" size={16} color="#38BDF8" />
                                <Text style={{ color: '#38BDF8', fontSize: 12, fontFamily: FontFamily.sansBold }}>
                                    Carregar mais publicações ({visiblePosts.length} de {displayedPosts.length})
                                </Text>
                            </TouchableOpacity>
                        );
                    }
                    return (
                        <View style={{ paddingVertical: 18, alignItems: 'center' }}>
                            <Text style={{ color: '#64748B', fontSize: 11, fontFamily: FontFamily.sansMedium }}>
                                Todas as publicações carregadas • Você está em dia!
                            </Text>
                        </View>
                    );
                }}
                renderItem={({ item }) => (
                    <View
                        style={{
                            backgroundColor: '#0B0F14',
                            borderBottomWidth: 1,
                            borderBottomColor: 'rgba(255, 255, 255, 0.08)',
                            marginBottom: 8,
                        }}
                    >
                        {/* Post Header: Avatar + Name + Time */}
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingHorizontal: 14,
                                paddingVertical: 12,
                                gap: 10,
                            }}
                        >
                            {item.userAvatar ? (
                                <Image
                                    source={{ uri: item.userAvatar }}
                                    style={{ width: 38, height: 38, borderRadius: 19 }}
                                    contentFit="cover"
                                    cachePolicy="memory-disk"
                                />
                            ) : (
                                <View
                                    style={{
                                        width: 38,
                                        height: 38,
                                        borderRadius: 19,
                                        backgroundColor: '#1E293B',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Ionicons name="person" size={18} color="#94A3B8" />
                                </View>
                            )}

                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Text
                                        style={{
                                            color: '#FFFFFF',
                                            fontSize: 15,
                                            fontFamily: FontFamily.sansBold,
                                        }}
                                    >
                                        {item.userName}
                                    </Text>
                                    {(item.groupName || item.userBadge) && (
                                        <View
                                            style={{
                                                backgroundColor: item.userBadge === 'Meu Treino' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.12)',
                                                borderColor: item.userBadge === 'Meu Treino' ? 'rgba(16, 185, 129, 0.3)' : 'transparent',
                                                borderWidth: item.userBadge === 'Meu Treino' ? 1 : 0,
                                                paddingHorizontal: 6,
                                                paddingVertical: 2,
                                                borderRadius: 4,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    color: item.userBadge === 'Meu Treino' ? '#10B981' : '#38BDF8',
                                                    fontSize: 10,
                                                    fontFamily: FontFamily.sansMedium,
                                                }}
                                            >
                                                {item.userBadge || item.groupName}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                                <Text
                                    style={{
                                        color: '#94A3B8',
                                        fontSize: 12,
                                        fontFamily: FontFamily.sans,
                                        marginTop: 1,
                                    }}
                                >
                                    {formatRelativeTimePt(item.createdAt)}
                                </Text>
                            </View>
                        </View>

                        {/* Workout Stats Pills */}
                        {item.workoutStats && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, marginBottom: 10 }}>
                                <View style={{ backgroundColor: 'rgba(56, 189, 248, 0.1)', borderColor: 'rgba(56, 189, 248, 0.25)', borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    <Ionicons name="time-outline" size={13} color="#38BDF8" />
                                    <Text style={{ color: '#38BDF8', fontSize: 11, fontFamily: FontFamily.sansBold }}>{item.workoutStats.durationMinutes} min</Text>
                                </View>
                                {item.workoutStats.volumeKg ? (
                                    <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.25)', borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                        <Ionicons name="barbell-outline" size={13} color="#10B981" />
                                        <Text style={{ color: '#10B981', fontSize: 11, fontFamily: FontFamily.sansBold }}>{item.workoutStats.volumeKg} kg</Text>
                                    </View>
                                ) : (
                                    <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.25)', borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                        <Ionicons name="barbell-outline" size={13} color="#10B981" />
                                        <Text style={{ color: '#10B981', fontSize: 11, fontFamily: FontFamily.sansBold }}>{item.workoutStats.exercisesCount} exerc.</Text>
                                    </View>
                                )}
                                <View style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.25)', borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    <Ionicons name="flame-outline" size={13} color="#F59E0B" />
                                    <Text style={{ color: '#F59E0B', fontSize: 11, fontFamily: FontFamily.sansBold }}>{item.workoutStats.calories} kcal</Text>
                                </View>
                            </View>
                        )}

                        {/* Caption Text */}
                        {item.content ? (
                            <View style={{ paddingHorizontal: 14, marginBottom: item.imageUrl ? 10 : 8 }}>
                                <Text
                                    style={{
                                        color: '#E2E8F0',
                                        fontSize: 14,
                                        lineHeight: 20,
                                        fontFamily: FontFamily.sans,
                                    }}
                                >
                                    {item.content}
                                </Text>
                            </View>
                        ) : null}

                        {/* Media Image: Responsive, Rounded, Memory-Disk Cached */}
                        {item.imageUrl && (
                            <View style={{ marginHorizontal: 14, marginBottom: 8, borderRadius: 14, overflow: 'hidden', height: 250, backgroundColor: '#000000' }}>
                                <Image
                                    source={{ uri: item.imageUrl }}
                                    style={{ width: '100%', height: '100%' }}
                                    contentFit="cover"
                                    cachePolicy="memory-disk"
                                    transition={200}
                                />
                            </View>
                        )}

                        {/* Action Bar: 👍 {likes}   👎 {dislikes}   💬 {comments}   ⭐ */}
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                paddingHorizontal: 16,
                                paddingVertical: 12,
                            }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
                                {/* Like (Thumbs up) */}
                                <TouchableOpacity
                                    onPress={() => handleToggleLike(item)}
                                    activeOpacity={0.7}
                                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                                >
                                    <Ionicons
                                        name={item.isLikedByMe ? 'thumbs-up' : 'thumbs-up-outline'}
                                        size={20}
                                        color={item.isLikedByMe ? '#38BDF8' : '#FFFFFF'}
                                    />
                                    <Text
                                        style={{
                                            color: item.isLikedByMe ? '#38BDF8' : '#FFFFFF',
                                            fontSize: 14,
                                            fontFamily: FontFamily.sansBold,
                                        }}
                                    >
                                        {item.likesCount || 0}
                                    </Text>
                                </TouchableOpacity>

                                {/* Dislike (Thumbs down) */}
                                <TouchableOpacity
                                    onPress={() => handleToggleDislike(item)}
                                    activeOpacity={0.7}
                                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                                >
                                    <Ionicons
                                        name={item.isDislikedByMe ? 'thumbs-down' : 'thumbs-down-outline'}
                                        size={20}
                                        color={item.isDislikedByMe ? '#EF4444' : '#FFFFFF'}
                                    />
                                    <Text
                                        style={{
                                            color: item.isDislikedByMe ? '#EF4444' : '#FFFFFF',
                                            fontSize: 14,
                                            fontFamily: FontFamily.sansBold,
                                        }}
                                    >
                                        {item.dislikesCount || 0}
                                    </Text>
                                </TouchableOpacity>

                                {/* Comments */}
                                <TouchableOpacity
                                    onPress={() => handleOpenComments(item)}
                                    activeOpacity={0.7}
                                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                                >
                                    <Ionicons name="chatbubble-outline" size={19} color="#FFFFFF" />
                                    <Text
                                        style={{
                                            color: '#FFFFFF',
                                            fontSize: 14,
                                            fontFamily: FontFamily.sansBold,
                                        }}
                                    >
                                        {item.commentsCount || 0}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Favorite / Star */}
                            <TouchableOpacity
                                onPress={() => handleToggleStar(item)}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name={item.isStarred ? 'star' : 'star-outline'}
                                    size={22}
                                    color={item.isStarred ? '#F59E0B' : '#FFFFFF'}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />

            {/* ════════════════ MODAL: SELEÇÃO DE GRUPO ════════════════ */}
            <Modal
                visible={isGroupModalOpen}
                transparent
                animationType="fade"
                onRequestClose={() => setIsGroupModalOpen(false)}
            >
                <TouchableOpacity
                    style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'flex-start', paddingTop: insets.top + 60 }}
                    activeOpacity={1}
                    onPress={() => setIsGroupModalOpen(false)}
                >
                    <View
                        style={{
                            marginHorizontal: 16,
                            backgroundColor: '#1E293B',
                            borderRadius: Radius.lg,
                            borderWidth: 1,
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                            overflow: 'hidden',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 8 },
                            shadowOpacity: 0.5,
                            shadowRadius: 16,
                            elevation: 10,
                        }}
                    >
                        <Text
                            style={{
                                color: '#94A3B8',
                                fontSize: 12,
                                fontFamily: FontFamily.sansSemiBold,
                                paddingHorizontal: 16,
                                paddingTop: 14,
                                paddingBottom: 8,
                                textTransform: 'uppercase',
                                letterSpacing: 0.5,
                            }}
                        >
                            Filtrar por Grupo
                        </Text>
                        {GROUPS.map((grp) => {
                            const isSelected = selectedGroup === grp.id;
                            return (
                                <TouchableOpacity
                                    key={grp.id}
                                    onPress={() => {
                                        setSelectedGroup(grp.id);
                                        setIsGroupModalOpen(false);
                                    }}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        paddingVertical: 14,
                                        paddingHorizontal: 16,
                                        backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                                        borderBottomWidth: 1,
                                        borderBottomColor: 'rgba(255, 255, 255, 0.06)',
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: isSelected ? '#38BDF8' : '#FFFFFF',
                                            fontSize: 15,
                                            fontFamily: isSelected ? FontFamily.sansBold : FontFamily.sansMedium,
                                        }}
                                    >
                                        {grp.name}
                                    </Text>
                                    {isSelected && <Ionicons name="checkmark" size={18} color="#38BDF8" />}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* ════════════════ MODAL: CRIAR PUBLICAÇÃO ════════════════ */}
            <Modal
                visible={isCreateModalOpen}
                animationType="slide"
                onRequestClose={() => setIsCreateModalOpen(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={{ flex: 1, backgroundColor: '#0B0F14' }}
                >
                    {/* Header */}
                    <View
                        style={{
                            paddingTop: insets.top + 10,
                            paddingBottom: 14,
                            paddingHorizontal: 16,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderBottomWidth: 1,
                            borderBottomColor: 'rgba(255, 255, 255, 0.08)',
                        }}
                    >
                        <TouchableOpacity onPress={() => setIsCreateModalOpen(false)} hitSlop={10}>
                            <Ionicons name="close" size={26} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={{ color: '#FFFFFF', fontSize: 17, fontFamily: FontFamily.sansBold }}>
                            Nova Publicação
                        </Text>
                        <TouchableOpacity
                            onPress={handlePublishPost}
                            disabled={isPublishing}
                            style={{
                                backgroundColor: '#38BDF8',
                                paddingHorizontal: 14,
                                paddingVertical: 6,
                                borderRadius: Radius.full,
                                opacity: isPublishing ? 0.6 : 1,
                            }}
                        >
                            {isPublishing ? (
                                <ActivityIndicator size="small" color="#000000" />
                            ) : (
                                <Text style={{ color: '#000000', fontSize: 13, fontFamily: FontFamily.sansBold }}>
                                    Publicar
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={{ flex: 1, padding: 16 }}>
                        {/* Group Selection for Post */}
                        <Text style={{ color: '#94A3B8', fontSize: 12, fontFamily: FontFamily.sansSemiBold, marginBottom: 8 }}>
                            POSTAR NO GRUPO:
                        </Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                            {GROUPS.filter((g) => g.id !== 'todos').map((grp) => {
                                const isSelected = newPostGroup === grp.name;
                                return (
                                    <TouchableOpacity
                                        key={grp.id}
                                        onPress={() => setNewPostGroup(grp.name)}
                                        style={{
                                            paddingHorizontal: 12,
                                            paddingVertical: 6,
                                            borderRadius: Radius.full,
                                            backgroundColor: isSelected ? '#38BDF8' : '#1E293B',
                                            marginRight: 8,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                color: isSelected ? '#000000' : '#E2E8F0',
                                                fontSize: 12,
                                                fontFamily: isSelected ? FontFamily.sansBold : FontFamily.sansMedium,
                                            }}
                                        >
                                            {grp.name}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        {/* Caption input */}
                        <TextInput
                            placeholder="Como foi o treino de hoje? Conte para a comunidade..."
                            placeholderTextColor="#64748B"
                            value={newPostText}
                            onChangeText={setNewPostText}
                            multiline
                            style={{
                                color: '#FFFFFF',
                                fontSize: 15,
                                fontFamily: FontFamily.sans,
                                minHeight: 100,
                                textAlignVertical: 'top',
                                marginBottom: 16,
                            }}
                        />

                        {/* Image Preview or Pick Buttons */}
                        {newPostImage ? (
                            <View style={{ position: 'relative', width: '100%', height: 320, borderRadius: Radius.md, overflow: 'hidden', marginBottom: 20 }}>
                                <Image source={{ uri: newPostImage }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                                <TouchableOpacity
                                    onPress={() => setNewPostImage(null)}
                                    style={{
                                        position: 'absolute',
                                        top: 10,
                                        right: 10,
                                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                        width: 32,
                                        height: 32,
                                        borderRadius: 16,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Ionicons name="trash" size={18} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
                                <TouchableOpacity
                                    onPress={() => pickImage(true)}
                                    style={{
                                        flex: 1,
                                        height: 110,
                                        borderRadius: Radius.md,
                                        borderWidth: 1,
                                        borderColor: 'rgba(255, 255, 255, 0.15)',
                                        borderStyle: 'dashed',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: '#111827',
                                        gap: 6,
                                    }}
                                >
                                    <Ionicons name="camera-outline" size={28} color="#38BDF8" />
                                    <Text style={{ color: '#E2E8F0', fontSize: 13, fontFamily: FontFamily.sansMedium }}>
                                        Tirar Foto
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => pickImage(false)}
                                    style={{
                                        flex: 1,
                                        height: 110,
                                        borderRadius: Radius.md,
                                        borderWidth: 1,
                                        borderColor: 'rgba(255, 255, 255, 0.15)',
                                        borderStyle: 'dashed',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: '#111827',
                                        gap: 6,
                                    }}
                                >
                                    <Ionicons name="images-outline" size={28} color="#38BDF8" />
                                    <Text style={{ color: '#E2E8F0', fontSize: 13, fontFamily: FontFamily.sansMedium }}>
                                        Da Galeria
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </ScrollView>
                </KeyboardAvoidingView>
            </Modal>

            {/* ════════════════ MODAL: COMENTÁRIOS ════════════════ */}
            <Modal
                visible={!!activeCommentsPost}
                animationType="slide"
                transparent
                onRequestClose={() => setActiveCommentsPost(null)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'flex-end' }}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        style={{
                            height: '75%',
                            backgroundColor: '#0F172A',
                            borderTopLeftRadius: 24,
                            borderTopRightRadius: 24,
                            borderWidth: 1,
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                        }}
                    >
                        {/* Header */}
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                paddingHorizontal: 16,
                                paddingVertical: 14,
                                borderBottomWidth: 1,
                                borderBottomColor: 'rgba(255, 255, 255, 0.08)',
                            }}
                        >
                            <Text style={{ color: '#FFFFFF', fontSize: 16, fontFamily: FontFamily.sansBold }}>
                                Comentários ({commentsList.length})
                            </Text>
                            <TouchableOpacity onPress={() => setActiveCommentsPost(null)}>
                                <Ionicons name="close" size={22} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>

                        {/* Comments list */}
                        <FlatList
                            data={commentsList}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={{ padding: 16 }}
                            renderItem={({ item }) => (
                                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                                    <View
                                        style={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: 16,
                                            backgroundColor: '#1E293B',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Ionicons name="person" size={16} color="#94A3B8" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ color: '#FFFFFF', fontSize: 13, fontFamily: FontFamily.sansBold }}>
                                            {item.userName}
                                        </Text>
                                        <Text style={{ color: '#CBD5E1', fontSize: 13, marginTop: 2, fontFamily: FontFamily.sans }}>
                                            {item.content}
                                        </Text>
                                    </View>
                                </View>
                            )}
                            ListEmptyComponent={
                                <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
                                    <Ionicons name="chatbubbles-outline" size={40} color="#64748B" />
                                    <Text style={{ color: '#94A3B8', fontSize: 14, marginTop: 8 }}>
                                        Seja o primeiro a comentar!
                                    </Text>
                                </View>
                            }
                        />

                        {/* Input bar */}
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingHorizontal: 14,
                                paddingVertical: 10,
                                paddingBottom: insets.bottom + 10,
                                borderTopWidth: 1,
                                borderTopColor: 'rgba(255, 255, 255, 0.08)',
                                backgroundColor: '#0B0F14',
                                gap: 10,
                            }}
                        >
                            <TextInput
                                placeholder="Adicionar um comentário..."
                                placeholderTextColor="#64748B"
                                value={newCommentText}
                                onChangeText={setNewCommentText}
                                style={{
                                    flex: 1,
                                    backgroundColor: '#1E293B',
                                    borderRadius: Radius.full,
                                    paddingHorizontal: 14,
                                    paddingVertical: 8,
                                    color: '#FFFFFF',
                                    fontSize: 14,
                                }}
                            />
                            <TouchableOpacity
                                onPress={handleSendComment}
                                disabled={!newCommentText.trim() || isSendingComment}
                                style={{
                                    width: 38,
                                    height: 38,
                                    borderRadius: 19,
                                    backgroundColor: newCommentText.trim() ? '#38BDF8' : '#334155',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Ionicons name="arrow-up" size={20} color="#000000" />
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </View>
    );
}

function formatRelativeTimePt(dateString: string): string {
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'Agora mesmo';
        if (diffMins < 60) return `${diffMins} min atrás`;
        if (diffHours < 24) return `${diffHours}h atrás`;
        if (diffDays === 1) return 'Ontem ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        return `${diffDays} dias atrás`;
    } catch {
        return 'Recentemente';
    }
}
