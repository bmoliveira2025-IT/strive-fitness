import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
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
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontFamily, Radius } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import {
    CommunityComment,
    CommunityPost,
    CommunityService,
    FICTITIOUS_PERSONAS,
} from '../services/communityService';
import { gamificationService } from '../services/gamificationService';
import { useUserStore } from '../store/useUserStore';

const CATEGORIES = [
    { key: 'Todos', label: 'Todos' },
    { key: 'Treinos', label: '🔥 Treinos' },
    { key: 'Dicas & Séries', label: '💡 Dicas & Séries' },
    { key: 'Mobilidade', label: '🤸 Mobilidade' },
    { key: 'Motivação', label: '⚡ Motivação' },
    { key: 'Evolução', label: '🏆 Evolução' },
] as const;

const WORKOUT_PRESET_TAGS = [
    'Treino de Peito & Tríceps',
    'Treino de Costas & Bíceps',
    'Leg Day Completo',
    'Ombros & Trapézio',
    'Cardio & Corrida',
    'Mobilidade Matinal',
    'Super Série de Braço',
];

// Helper to format relative time in Portuguese
function formatRelativeTime(dateString: string): string {
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMinutes < 1) return 'Agora mesmo';
        if (diffMinutes < 60) return `Há ${diffMinutes} min`;
        if (diffHours < 24) {
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            return `Hoje às ${hours}:${minutes}`;
        }
        if (diffDays === 1) {
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            return `Ontem às ${hours}:${minutes}`;
        }
        return `Há ${diffDays} dias`;
    } catch {
        return 'Recentemente';
    }
}

export default function CommunityScreen() {
    const { theme } = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { session, isOfflineGuest } = useAuth();
    const { userName, profile } = useUserStore();
    const toast = useToast();

    const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);

    // Modal state for creating post
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [postContent, setPostContent] = useState('');
    const [postCategory, setPostCategory] = useState<CommunityPost['category']>('Treinos');
    const [selectedWorkoutTag, setSelectedWorkoutTag] = useState<string>('');
    const [customWorkoutTag, setCustomWorkoutTag] = useState('');
    const [isPublishing, setIsPublishing] = useState(false);

    // Modal state for comments
    const [activeCommentsPost, setActiveCommentsPost] = useState<CommunityPost | null>(null);
    const [commentsList, setCommentsList] = useState<CommunityComment[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [newCommentText, setNewCommentText] = useState('');
    const [isSendingComment, setIsSendingComment] = useState(false);

    // Fetch posts
    const loadPosts = useCallback(async (isRefresh = false) => {
        if (!isRefresh) setLoading(true);
        try {
            const data = await CommunityService.getPosts(
                selectedCategory === 'Todos' ? undefined : selectedCategory
            );
            setPosts(data);
        } catch (err) {
            console.warn('Error fetching community posts:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedCategory]);

    useEffect(() => {
        loadPosts();
    }, [loadPosts]);

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        loadPosts(true);
    }, [loadPosts]);

    // Handle like toggle
    const handleToggleLike = async (post: CommunityPost) => {
        const currentUserId = session?.user?.id || profile?.id || 'local-user';
        const previousLiked = post.isLikedByMe || false;
        const previousCount = post.likesCount;

        // Optimistic UI update
        const updated = posts.map((p) =>
            p.id === post.id
                ? {
                      ...p,
                      isLikedByMe: !previousLiked,
                      likesCount: Math.max(0, previousCount + (!previousLiked ? 1 : -1)),
                  }
                : p
        );
        setPosts(updated);

        try {
            await CommunityService.toggleLike(post.id, currentUserId, previousCount, previousLiked);
            if (!previousLiked) {
                gamificationService.incrementCommunityLike();
            }
        } catch {
            // Revert on error
            setPosts(posts);
        }
    };

    // Open Comments Modal
    const handleOpenComments = async (post: CommunityPost) => {
        setActiveCommentsPost(post);
        setLoadingComments(true);
        try {
            const comments = await CommunityService.getComments(post.id);
            setCommentsList(comments);
        } catch {
            setCommentsList([]);
        } finally {
            setLoadingComments(false);
        }
    };

    // Send Comment
    const handleSendComment = async () => {
        if (!newCommentText.trim() || !activeCommentsPost) return;

        const currentUserId = session?.user?.id || profile?.id || 'local-user';
        const currentUserName = userName || session?.user?.user_metadata?.full_name || 'Atleta Strive';
        const currentUserAvatar = profile?.photoUri || session?.user?.user_metadata?.avatar_url;

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
            setNewCommentText('');

            // Update comments count in list
            setPosts((prev) =>
                prev.map((p) =>
                    p.id === activeCommentsPost.id
                        ? { ...p, commentsCount: p.commentsCount + 1 }
                        : p
                )
            );

            gamificationService.incrementCommunityComment();
            toast.success('Comentário publicado! (+30 pts no ranking)');
        } catch (e) {
            Alert.alert('Erro', 'Não foi possível enviar o comentário.');
        } finally {
            setIsSendingComment(false);
        }
    };

    // Publish Post
    const handlePublishPost = async () => {
        if (!postContent.trim()) {
            Alert.alert('Atenção', 'Escreva algo para compartilhar com a comunidade!');
            return;
        }

        const currentUserId = session?.user?.id || profile?.id || 'local-user';
        const currentUserName = userName || session?.user?.user_metadata?.full_name || 'Atleta Strive';
        const currentUserAvatar = profile?.photoUri || session?.user?.user_metadata?.avatar_url;

        const finalWorkoutTag = customWorkoutTag.trim() || selectedWorkoutTag || undefined;

        setIsPublishing(true);
        try {
            const created = await CommunityService.createPost({
                userId: currentUserId,
                userName: currentUserName,
                userAvatar: currentUserAvatar,
                content: postContent.trim(),
                category: postCategory,
                workoutTag: finalWorkoutTag,
                userBadge: 'Membro da Comunidade',
            });

            setPosts((prev) => [created, ...prev]);
            setIsCreateModalOpen(false);
            setPostContent('');
            setSelectedWorkoutTag('');
            setCustomWorkoutTag('');
            gamificationService.incrementCommunityPost();
            toast.success('Publicação compartilhada com sucesso! (+80 pts no ranking)');
        } catch (e) {
            Alert.alert('Erro', 'Ocorreu um erro ao publicar seu post.');
        } finally {
            setIsPublishing(false);
        }
    };

    // Render Post Card
    const renderPostItem = ({ item, index }: { item: CommunityPost; index: number }) => {
        const isAuthorMe =
            (session?.user?.id && item.userId === session.user.id) ||
            (profile?.id && item.userId === profile.id);

        const categoryBadgeColor =
            item.category === 'Treinos'
                ? '#EF4444'
                : item.category === 'Dicas & Séries'
                ? '#F59E0B'
                : item.category === 'Mobilidade'
                ? '#10B981'
                : item.category === 'Motivação'
                ? '#8B5CF6'
                : item.category === 'Evolução'
                ? '#3B82F6'
                : theme.colors.primary;

        return (
            <Animated.View
                entering={FadeInUp.delay(index * 60).duration(350)}
                style={{
                    backgroundColor: theme.mode === 'dark' ? '#12151C' : '#FFFFFF',
                    borderRadius: Radius.lg,
                    borderWidth: 1,
                    borderColor:
                        theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                    marginHorizontal: 16,
                    marginBottom: 16,
                    overflow: 'hidden',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: theme.mode === 'dark' ? 0.3 : 0.05,
                    shadowRadius: 10,
                    elevation: 3,
                }}
            >
                <LinearGradient
                    colors={
                        theme.mode === 'dark'
                            ? ['rgba(25, 29, 40, 0.7)', 'rgba(16, 18, 26, 0.95)']
                            : ['rgba(250, 250, 252, 0.9)', 'rgba(255, 255, 255, 0.98)']
                    }
                    style={{ padding: 16 }}
                >
                    {/* Author Header */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            {/* Avatar */}
                            <View
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 22,
                                    backgroundColor: theme.colors.backgroundTertiary,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                    marginRight: 12,
                                    borderWidth: 1.5,
                                    borderColor: categoryBadgeColor + '40',
                                }}
                            >
                                {item.userAvatar ? (
                                    <Image
                                        source={{ uri: item.userAvatar }}
                                        style={{ width: '100%', height: '100%' }}
                                        contentFit="cover"
                                        transition={200}
                                    />
                                ) : (
                                    <Text
                                        style={{
                                            color: theme.colors.text,
                                            fontFamily: FontFamily.display,
                                            fontWeight: '800',
                                            fontSize: 16,
                                        }}
                                    >
                                        {(item.userName || 'A').charAt(0).toUpperCase()}
                                    </Text>
                                )}
                            </View>

                            {/* Name & Badge */}
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Text
                                        numberOfLines={1}
                                        style={{
                                            color: theme.colors.text,
                                            fontSize: 15,
                                            fontFamily: FontFamily.sansBold,
                                        }}
                                    >
                                        {item.userName}
                                        {isAuthorMe ? ' (Você)' : ''}
                                    </Text>
                                    {item.isFictitious && (
                                        <Ionicons name="checkmark-circle" size={14} color="#3B82F6" />
                                    )}
                                </View>

                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                    {item.userBadge && (
                                        <View
                                            style={{
                                                backgroundColor: categoryBadgeColor + '20',
                                                paddingHorizontal: 6,
                                                paddingVertical: 1,
                                                borderRadius: 4,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    color: categoryBadgeColor,
                                                    fontSize: 10,
                                                    fontFamily: FontFamily.sansSemiBold,
                                                }}
                                            >
                                                {item.userBadge}
                                            </Text>
                                        </View>
                                    )}
                                    <Text
                                        style={{
                                            color: theme.colors.textMuted,
                                            fontSize: 11,
                                            fontFamily: FontFamily.sans,
                                        }}
                                    >
                                        • {formatRelativeTime(item.createdAt)}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Category Tag */}
                        <View
                            style={{
                                backgroundColor: categoryBadgeColor + '18',
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                borderRadius: Radius.sm,
                                borderWidth: 1,
                                borderColor: categoryBadgeColor + '35',
                            }}
                        >
                            <Text
                                style={{
                                    color: categoryBadgeColor,
                                    fontSize: 11,
                                    fontFamily: FontFamily.sansBold,
                                }}
                            >
                                {item.category}
                            </Text>
                        </View>
                    </View>

                    {/* Workout Attachment Tag */}
                    {item.workoutTag && (
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 6,
                                backgroundColor:
                                    theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
                                paddingHorizontal: 10,
                                paddingVertical: 6,
                                borderRadius: Radius.md,
                                marginBottom: 10,
                                alignSelf: 'flex-start',
                            }}
                        >
                            <Ionicons name="barbell" size={14} color={theme.colors.primary} />
                            <Text
                                style={{
                                    color: theme.colors.primary,
                                    fontSize: 12,
                                    fontFamily: FontFamily.sansSemiBold,
                                }}
                            >
                                {item.workoutTag}
                            </Text>
                        </View>
                    )}

                    {/* Workout Stats if provided */}
                    {item.workoutStats && (
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 14,
                                marginBottom: 12,
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                            }}
                        >
                            {item.workoutStats.durationMinutes && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    <Ionicons name="time-outline" size={13} color={theme.colors.textMuted} />
                                    <Text style={{ color: theme.colors.textSecondary, fontSize: 11, fontFamily: FontFamily.sansMedium }}>
                                        {item.workoutStats.durationMinutes} min
                                    </Text>
                                </View>
                            )}
                            {item.workoutStats.calories && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    <Ionicons name="flame-outline" size={13} color="#F59E0B" />
                                    <Text style={{ color: theme.colors.textSecondary, fontSize: 11, fontFamily: FontFamily.sansMedium }}>
                                        {item.workoutStats.calories} kcal
                                    </Text>
                                </View>
                            )}
                            {item.workoutStats.exercisesCount && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    <Ionicons name="fitness-outline" size={13} color={theme.colors.textMuted} />
                                    <Text style={{ color: theme.colors.textSecondary, fontSize: 11, fontFamily: FontFamily.sansMedium }}>
                                        {item.workoutStats.exercisesCount} exercícios
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Post Content */}
                    <Text
                        style={{
                            color: theme.colors.text,
                            fontSize: 14,
                            lineHeight: 22,
                            fontFamily: FontFamily.sans,
                            marginBottom: 14,
                        }}
                    >
                        {item.content}
                    </Text>

                    {/* Actions Bar */}
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderTopWidth: 1,
                            borderTopColor:
                                theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
                            paddingTop: 10,
                        }}
                    >
                        {/* Like Button */}
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => handleToggleLike(item)}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 }}
                        >
                            <Ionicons
                                name={item.isLikedByMe ? 'heart' : 'heart-outline'}
                                size={20}
                                color={item.isLikedByMe ? '#EF4444' : theme.colors.textMuted}
                            />
                            <Text
                                style={{
                                    color: item.isLikedByMe ? '#EF4444' : theme.colors.textMuted,
                                    fontSize: 13,
                                    fontFamily: item.isLikedByMe ? FontFamily.sansBold : FontFamily.sansMedium,
                                }}
                            >
                                {item.likesCount} {item.likesCount === 1 ? 'curtida' : 'curtidas'}
                            </Text>
                        </TouchableOpacity>

                        {/* Comment Button */}
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => handleOpenComments(item)}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 }}
                        >
                            <Ionicons name="chatbubble-ellipses-outline" size={19} color={theme.colors.textMuted} />
                            <Text
                                style={{
                                    color: theme.colors.textMuted,
                                    fontSize: 13,
                                    fontFamily: FontFamily.sansMedium,
                                }}
                            >
                                {item.commentsCount} {item.commentsCount === 1 ? 'comentário' : 'comentários'}
                            </Text>
                        </TouchableOpacity>

                        {/* Cheer / Encourage Button */}
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => toast.success('Incentivo enviado com sucesso! 🚀', 'Comunidade Strive')}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 }}
                        >
                            <Ionicons name="flash-outline" size={17} color={theme.colors.primary} />
                            <Text
                                style={{
                                    color: theme.colors.primary,
                                    fontSize: 12,
                                    fontFamily: FontFamily.sansSemiBold,
                                }}
                            >
                                Apoiar
                            </Text>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            </Animated.View>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <StatusBar style={theme.mode === 'light' ? 'dark' : 'light'} />

            {/* Header */}
            <Animated.View
                entering={FadeInUp.duration(400)}
                style={{
                    backgroundColor: theme.colors.background,
                    paddingTop: insets.top + 8,
                    paddingBottom: 10,
                    borderBottomWidth: 1,
                    borderBottomColor:
                        theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                }}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            activeOpacity={0.7}
                            style={{
                                backgroundColor: theme.colors.card,
                                width: 40,
                                height: 40,
                                borderRadius: 12,
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderColor: theme.colors.cardBorder,
                                borderWidth: 1,
                                marginRight: 12,
                            }}
                        >
                            <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
                        </TouchableOpacity>

                        <View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text
                                    style={{
                                        color: theme.colors.text,
                                        fontFamily: FontFamily.display,
                                        fontSize: 20,
                                        fontWeight: '800',
                                        letterSpacing: -0.3,
                                    }}
                                >
                                    COMUNIDADE
                                </Text>
                                <View
                                    style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: 4,
                                        backgroundColor: '#10B981',
                                    }}
                                />
                            </View>
                            <Text
                                style={{
                                    color: theme.colors.textMuted,
                                    fontFamily: FontFamily.sansMedium,
                                    fontSize: 11,
                                }}
                            >
                                {FICTITIOUS_PERSONAS.length + 1} atletas ativos diariamente
                            </Text>
                        </View>
                    </View>

                    {/* Novo Post CTA */}
                    <TouchableOpacity
                        onPress={() => setIsCreateModalOpen(true)}
                        activeOpacity={0.8}
                        style={{
                            backgroundColor: theme.colors.primary,
                            paddingHorizontal: 14,
                            paddingVertical: 8,
                            borderRadius: Radius.md,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                            shadowColor: theme.colors.primary,
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.35,
                            shadowRadius: 4,
                            elevation: 4,
                        }}
                    >
                        <Ionicons name="add" size={18} color="#000000" />
                        <Text
                            style={{
                                color: '#000000',
                                fontSize: 13,
                                fontFamily: FontFamily.sansBold,
                            }}
                        >
                            Publicar
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Categories Filter Tabs */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, gap: 8 }}
                >
                    {CATEGORIES.map((cat) => {
                        const isSelected = selectedCategory === cat.key;
                        return (
                            <TouchableOpacity
                                key={cat.key}
                                onPress={() => setSelectedCategory(cat.key)}
                                activeOpacity={0.7}
                                style={{
                                    backgroundColor: isSelected
                                        ? theme.colors.primary
                                        : theme.mode === 'dark'
                                        ? 'rgba(255, 255, 255, 0.07)'
                                        : '#F1F5F9',
                                    paddingHorizontal: 14,
                                    paddingVertical: 7,
                                    borderRadius: Radius.full,
                                    borderWidth: 1,
                                    borderColor: isSelected
                                        ? theme.colors.primary
                                        : theme.mode === 'dark'
                                        ? 'rgba(255, 255, 255, 0.08)'
                                        : 'rgba(0, 0, 0, 0.05)',
                                }}
                            >
                                <Text
                                    style={{
                                        color: isSelected
                                            ? '#000000'
                                            : theme.colors.textSecondary,
                                        fontSize: 12,
                                        fontFamily: isSelected
                                            ? FontFamily.sansBold
                                            : FontFamily.sansMedium,
                                    }}
                                >
                                    {cat.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </Animated.View>

            {/* Posts Feed */}
            {loading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text
                        style={{
                            color: theme.colors.textMuted,
                            fontSize: 13,
                            fontFamily: FontFamily.sansMedium,
                            marginTop: 12,
                        }}
                    >
                        Carregando comunidade...
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={posts}
                    keyExtractor={(item) => item.id}
                    renderItem={renderPostItem}
                    contentContainerStyle={{ paddingTop: 16, paddingBottom: insets.bottom + 60 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor={theme.colors.primary}
                            colors={[theme.colors.primary]}
                        />
                    }
                    ListEmptyComponent={
                        <View style={{ padding: 40, alignItems: 'center', justifyContent: 'center' }}>
                            <Ionicons name="chatbubbles-outline" size={48} color={theme.colors.textMuted} />
                            <Text
                                style={{
                                    color: theme.colors.text,
                                    fontSize: 16,
                                    fontFamily: FontFamily.sansBold,
                                    marginTop: 14,
                                }}
                            >
                                Nenhuma publicação encontrada
                            </Text>
                            <Text
                                style={{
                                    color: theme.colors.textMuted,
                                    fontSize: 13,
                                    fontFamily: FontFamily.sans,
                                    textAlign: 'center',
                                    marginTop: 6,
                                }}
                            >
                                Seja o primeiro a compartilhar seu treino ou dica com a comunidade Strive!
                            </Text>
                        </View>
                    }
                />
            )}

            {/* Modal de Criação de Post */}
            <Modal
                visible={isCreateModalOpen}
                animationType="slide"
                transparent
                onRequestClose={() => setIsCreateModalOpen(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'flex-end' }}
                >
                    <View
                        style={{
                            backgroundColor: theme.mode === 'dark' ? '#141720' : '#FFFFFF',
                            borderTopLeftRadius: 24,
                            borderTopRightRadius: 24,
                            paddingTop: 20,
                            paddingHorizontal: 20,
                            paddingBottom: insets.bottom + 20,
                            maxHeight: '90%',
                        }}
                    >
                        {/* Modal Header */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                            <View>
                                <Text style={{ color: theme.colors.text, fontSize: 18, fontFamily: FontFamily.sansBold }}>
                                    Nova Publicação
                                </Text>
                                <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontFamily: FontFamily.sans }}>
                                    Compartilhe sua rotina, dicas ou conquistas
                                </Text>
                            </View>

                            <TouchableOpacity
                                onPress={() => setIsCreateModalOpen(false)}
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 16,
                                    backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Ionicons name="close" size={20} color={theme.colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Author Preview */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                                <View
                                    style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 18,
                                        backgroundColor: theme.colors.primary,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'hidden',
                                        marginRight: 10,
                                    }}
                                >
                                    {profile?.photoUri ? (
                                        <Image source={{ uri: profile.photoUri }} style={{ width: '100%', height: '100%' }} />
                                    ) : (
                                        <Text style={{ color: '#000', fontFamily: FontFamily.display, fontWeight: '800' }}>
                                            {(userName || 'A').charAt(0).toUpperCase()}
                                        </Text>
                                    )}
                                </View>
                                <View>
                                    <Text style={{ color: theme.colors.text, fontSize: 14, fontFamily: FontFamily.sansBold }}>
                                        {userName || 'Você'}
                                    </Text>
                                    <Text style={{ color: theme.colors.primary, fontSize: 11, fontFamily: FontFamily.sansMedium }}>
                                        Atleta Strive
                                    </Text>
                                </View>
                            </View>

                            {/* Category Selector */}
                            <Text style={{ color: theme.colors.textSecondary, fontSize: 12, fontFamily: FontFamily.sansSemiBold, marginBottom: 8 }}>
                                CATEGORIA:
                            </Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                                {CATEGORIES.filter((c) => c.key !== 'Todos').map((cat) => {
                                    const isSelected = postCategory === cat.key;
                                    return (
                                        <TouchableOpacity
                                            key={cat.key}
                                            onPress={() => setPostCategory(cat.key as CommunityPost['category'])}
                                            style={{
                                                backgroundColor: isSelected ? theme.colors.primary : theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
                                                paddingHorizontal: 12,
                                                paddingVertical: 6,
                                                borderRadius: Radius.md,
                                                marginRight: 8,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    color: isSelected ? '#000' : theme.colors.textSecondary,
                                                    fontSize: 12,
                                                    fontFamily: isSelected ? FontFamily.sansBold : FontFamily.sansMedium,
                                                }}
                                            >
                                                {cat.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>

                            {/* Workout Tag Presets */}
                            <Text style={{ color: theme.colors.textSecondary, fontSize: 12, fontFamily: FontFamily.sansSemiBold, marginBottom: 8 }}>
                                MARCAR TREINO / SÉRIE (OPCIONAL):
                            </Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                                {WORKOUT_PRESET_TAGS.map((tag) => {
                                    const isSelected = selectedWorkoutTag === tag;
                                    return (
                                        <TouchableOpacity
                                            key={tag}
                                            onPress={() => setSelectedWorkoutTag(isSelected ? '' : tag)}
                                            style={{
                                                backgroundColor: isSelected ? theme.colors.primary + '25' : theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC',
                                                borderWidth: 1,
                                                borderColor: isSelected ? theme.colors.primary : 'transparent',
                                                paddingHorizontal: 10,
                                                paddingVertical: 5,
                                                borderRadius: Radius.sm,
                                                marginRight: 8,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    color: isSelected ? theme.colors.primary : theme.colors.textMuted,
                                                    fontSize: 11,
                                                    fontFamily: FontFamily.sansMedium,
                                                }}
                                            >
                                                {tag}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>

                            {/* Input Field */}
                            <TextInput
                                placeholder="Conte sobre sua sessão, cargas, séries, exercícios de hoje ou deixe uma dica..."
                                placeholderTextColor={theme.colors.textMuted}
                                multiline
                                numberOfLines={5}
                                value={postContent}
                                onChangeText={setPostContent}
                                style={{
                                    backgroundColor: theme.mode === 'dark' ? '#0E1017' : '#F8FAFC',
                                    color: theme.colors.text,
                                    borderRadius: Radius.md,
                                    padding: 14,
                                    fontSize: 14,
                                    fontFamily: FontFamily.sans,
                                    textAlignVertical: 'top',
                                    minHeight: 120,
                                    borderWidth: 1,
                                    borderColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
                                    marginBottom: 16,
                                }}
                            />

                            {/* Publish Action Button */}
                            <TouchableOpacity
                                onPress={handlePublishPost}
                                disabled={isPublishing || !postContent.trim()}
                                activeOpacity={0.8}
                                style={{
                                    backgroundColor: postContent.trim() ? theme.colors.primary : theme.colors.textMuted + '40',
                                    paddingVertical: 14,
                                    borderRadius: Radius.md,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexDirection: 'row',
                                    gap: 8,
                                }}
                            >
                                {isPublishing ? (
                                    <ActivityIndicator size="small" color="#000" />
                                ) : (
                                    <>
                                        <Ionicons name="paper-plane" size={18} color="#000" />
                                        <Text style={{ color: '#000', fontSize: 15, fontFamily: FontFamily.sansBold }}>
                                            Compartilhar na Comunidade
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Modal de Comentários */}
            <Modal
                visible={!!activeCommentsPost}
                animationType="slide"
                transparent
                onRequestClose={() => setActiveCommentsPost(null)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'flex-end' }}
                >
                    <View
                        style={{
                            backgroundColor: theme.mode === 'dark' ? '#141720' : '#FFFFFF',
                            borderTopLeftRadius: 24,
                            borderTopRightRadius: 24,
                            paddingTop: 20,
                            paddingHorizontal: 16,
                            paddingBottom: insets.bottom + 12,
                            maxHeight: '85%',
                            minHeight: '50%',
                        }}
                    >
                        {/* Header */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                            <Text style={{ color: theme.colors.text, fontSize: 17, fontFamily: FontFamily.sansBold }}>
                                Comentários
                            </Text>
                            <TouchableOpacity
                                onPress={() => setActiveCommentsPost(null)}
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 16,
                                    backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Ionicons name="close" size={20} color={theme.colors.text} />
                            </TouchableOpacity>
                        </View>

                        {/* List of comments */}
                        {loadingComments ? (
                            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                <ActivityIndicator size="small" color={theme.colors.primary} />
                            </View>
                        ) : (
                            <FlatList
                                data={commentsList}
                                keyExtractor={(item) => item.id}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ paddingBottom: 16 }}
                                ListEmptyComponent={
                                    <View style={{ paddingVertical: 30, alignItems: 'center' }}>
                                        <Text style={{ color: theme.colors.textMuted, fontSize: 13, fontFamily: FontFamily.sans }}>
                                            Nenhum comentário ainda. Deixe sua mensagem!
                                        </Text>
                                    </View>
                                }
                                renderItem={({ item }) => (
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            marginBottom: 14,
                                            paddingBottom: 12,
                                            borderBottomWidth: 1,
                                            borderBottomColor:
                                                theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                                        }}
                                    >
                                        <View
                                            style={{
                                                width: 32,
                                                height: 32,
                                                borderRadius: 16,
                                                backgroundColor: theme.colors.backgroundTertiary,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginRight: 10,
                                                overflow: 'hidden',
                                            }}
                                        >
                                            {item.userAvatar ? (
                                                <Image source={{ uri: item.userAvatar }} style={{ width: '100%', height: '100%' }} />
                                            ) : (
                                                <Text style={{ color: theme.colors.text, fontFamily: FontFamily.display, fontWeight: '800', fontSize: 12 }}>
                                                    {item.userName.charAt(0).toUpperCase()}
                                                </Text>
                                            )}
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <Text style={{ color: theme.colors.text, fontSize: 13, fontFamily: FontFamily.sansBold }}>
                                                    {item.userName}
                                                </Text>
                                                <Text style={{ color: theme.colors.textMuted, fontSize: 10, fontFamily: FontFamily.sans }}>
                                                    {formatRelativeTime(item.createdAt)}
                                                </Text>
                                            </View>
                                            <Text style={{ color: theme.colors.textSecondary, fontSize: 13, fontFamily: FontFamily.sans, marginTop: 3 }}>
                                                {item.content}
                                            </Text>
                                        </View>
                                    </View>
                                )}
                            />
                        )}

                        {/* Comment Input Box */}
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: theme.mode === 'dark' ? '#0E1017' : '#F1F5F9',
                                borderRadius: Radius.full,
                                paddingHorizontal: 14,
                                paddingVertical: 6,
                                borderWidth: 1,
                                borderColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
                            }}
                        >
                            <TextInput
                                placeholder="Escreva um comentário..."
                                placeholderTextColor={theme.colors.textMuted}
                                value={newCommentText}
                                onChangeText={setNewCommentText}
                                style={{
                                    flex: 1,
                                    color: theme.colors.text,
                                    fontSize: 13,
                                    fontFamily: FontFamily.sans,
                                    paddingVertical: 6,
                                }}
                            />
                            <TouchableOpacity
                                onPress={handleSendComment}
                                disabled={isSendingComment || !newCommentText.trim()}
                                style={{
                                    backgroundColor: newCommentText.trim() ? theme.colors.primary : 'transparent',
                                    width: 32,
                                    height: 32,
                                    borderRadius: 16,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginLeft: 6,
                                }}
                            >
                                <Ionicons
                                    name="send"
                                    size={16}
                                    color={newCommentText.trim() ? '#000' : theme.colors.textMuted}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}
