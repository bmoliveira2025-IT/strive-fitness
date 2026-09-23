import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
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
} from '../services/communityService';
import { gamificationService } from '../services/gamificationService';
import { useUserStore } from '../store/useUserStore';
import { tabScrollBottomPadding } from '../constants/tabLayout';
import { useRouter } from 'expo-router';
import * as ImagePicker from '../services/imagePicker';
import { MUSCLE_IMAGES } from '../constants/muscleImages';

const CATEGORIES = [
    { key: 'Todos', label: 'Todos' },
    { key: 'Treinos', label: '🔥 Treinos' },
    { key: 'Geral', label: '💬 Conversas' },
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

function PostPhoto({ uri }: { uri: string }) {
    const { theme } = useTheme();
    const [width, setWidth] = useState(0);
    const [ratio, setRatio] = useState(1);
    const height = width ? Math.min(520, Math.max(180, width / ratio)) : 280;

    return <View onLayout={event => {
        const next = event.nativeEvent.layout.width;
        if (Math.abs(next - width) > 1) setWidth(next);
    }} style={{ width: '100%', borderRadius: 14, overflow: 'hidden', backgroundColor: theme.colors.backgroundTertiary, marginBottom: 14 }}>
        <Image source={{ uri }} contentFit="contain" cachePolicy="memory-disk"
            onLoad={event => {
                const { width: imageWidth, height: imageHeight } = event.source;
                if (imageWidth > 0 && imageHeight > 0) {
                    const next = imageWidth / imageHeight;
                    if (Math.abs(next - ratio) > 0.01) setRatio(next);
                }
            }}
            style={{ width: '100%', height }} accessibilityLabel="Foto completa da publicação" />
    </View>;
}

export default function CommunityScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const { session } = useAuth();
    const { userName, profile } = useUserStore();
    const toast = useToast();

    const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [postImageUri, setPostImageUri] = useState<string | null>(null);
    const [postImageMimeType, setPostImageMimeType] = useState<string | undefined>();
    const [postError, setPostError] = useState('');
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);

    // Modal state for creating post
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [postContent, setPostContent] = useState('');
    const [postCategory, setPostCategory] = useState<CommunityPost['category']>('Treinos');
    const [selectedWorkoutTag, setSelectedWorkoutTag] = useState<string>('');
    const [customWorkoutTag, setCustomWorkoutTag] = useState('');
    const [isPublishing, setIsPublishing] = useState(false);
    const [postMenuId, setPostMenuId] = useState<string | null>(null);
    const [editingPost, setEditingPost] = useState<CommunityPost | null>(null);
    const [editContent, setEditContent] = useState('');
    const [editImageUri, setEditImageUri] = useState<string | null>(null);
    const [editImageMimeType, setEditImageMimeType] = useState<string | undefined>();
    const [removeEditImage, setRemoveEditImage] = useState(false);
    const [editError, setEditError] = useState('');
    const [editSaving, setEditSaving] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<CommunityPost | null>(null);
    const [deleting, setDeleting] = useState(false);

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
            const data = await CommunityService.getPostsPage(selectedCategory, 0);
            setPosts(data);
            setPage(0);
            setHasMore(data.length === 12);
        } catch (err) {
            console.warn('Error fetching community posts:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedCategory]);

    const loadMorePosts = useCallback(async () => {
        if (loading || loadingMore || !hasMore) return;
        setLoadingMore(true);
        try {
            const next = page + 1;
            const batch = await CommunityService.getPostsPage(selectedCategory, next);
            setPosts(current => {
                const seen = new Set(current.map(post => post.id));
                return [...current, ...batch.filter(post => !seen.has(post.id))];
            });
            setPage(next);
            setHasMore(batch.length === 12);
        } finally { setLoadingMore(false); }
    }, [hasMore, loading, loadingMore, page, selectedCategory]);

    const pickPostPhoto = async () => {
        setPostError('');
        try {
            // On web, open the picker directly in the click gesture. Awaiting permissions
            // first loses browser user activation and the file chooser never opens.
            if (Platform.OS !== 'web') {
                const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (!permission.granted) { Alert.alert('Permissão necessária', 'Permita o acesso às fotos para anexar uma imagem.'); return; }
            }
            const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 0.8 });
            if (!result.canceled && result.assets[0]?.uri) {
                setPostImageUri(result.assets[0].uri);
                setPostImageMimeType(result.assets[0].mimeType);
            }
        } catch (error) {
            console.warn('Photo picker failed:', error);
            Alert.alert('Não foi possível abrir as fotos', 'Tente novamente ou confira as permissões do aplicativo.');
        }
    };

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
        if (!postContent.trim() && !postImageUri) {
            Alert.alert('Atenção', 'Escreva uma mensagem ou escolha uma foto.');
            return;
        }

        const currentUserId = session?.user?.id || profile?.id || 'local-user';
        const currentUserName = userName || session?.user?.user_metadata?.full_name || 'Atleta Strive';
        const currentUserAvatar = profile?.photoUri || session?.user?.user_metadata?.avatar_url;

        const finalWorkoutTag = customWorkoutTag.trim() || selectedWorkoutTag || undefined;

        if (postImageUri && !session?.user?.id) {
            setPostError('Entre na sua conta para enviar a foto à comunidade. Sua mensagem e a foto selecionada permanecem aqui.');
            return;
        }

        setIsPublishing(true);
        setPostError('');
        try {
            const imageUrl = postImageUri ? await CommunityService.uploadPostImage(postImageUri, session!.user.id, postImageMimeType) : undefined;
            const created = await CommunityService.createPost({
                userId: currentUserId,
                userName: currentUserName,
                userAvatar: currentUserAvatar,
                content: postContent.trim() || 'Compartilhando um momento do meu treino 📸',
                imageUrl,
                requireRemote: true,
                category: postCategory,
                workoutTag: finalWorkoutTag,
                userBadge: 'Membro da Comunidade',
            });

            setPosts((prev) => [created, ...prev]);
            setSelectedCategory('Todos');
            setIsCreateModalOpen(false);
            setPostContent('');
            setPostImageUri(null);
            setPostImageMimeType(undefined);
            setSelectedWorkoutTag('');
            setCustomWorkoutTag('');
            gamificationService.incrementCommunityPost();
            toast.success('Publicação compartilhada com sucesso! (+80 pts no ranking)');
        } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            console.warn('Community photo/post publish failed:', e);
            setPostError(/bucket not found|NoSuchBucket/i.test(message)
                ? 'O armazenamento de fotos da comunidade ainda não foi configurado no servidor. Sua foto e mensagem continuam aqui; tente novamente após a atualização do servidor.'
                : `Não foi possível publicar: ${message}. Seu rascunho foi preservado para tentar novamente.`);
        } finally {
            setIsPublishing(false);
        }
    };

    const ownerId = session?.user?.id || profile?.id || 'local-user';
    const openEditPost = (post: CommunityPost) => {
        setPostMenuId(null);
        setEditingPost(post);
        setEditContent(post.content);
        setEditImageUri(null);
        setEditImageMimeType(undefined);
        setRemoveEditImage(false);
        setEditError('');
    };
    const pickEditPhoto = async () => {
        try {
            if (Platform.OS !== 'web') {
                const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (!permission.granted) { setEditError('Permita acesso às fotos nas configurações do aparelho.'); return; }
            }
            const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 0.8 });
            if (!result.canceled && result.assets[0]?.uri) {
                setEditImageUri(result.assets[0].uri);
                setEditImageMimeType(result.assets[0].mimeType);
                setRemoveEditImage(false);
                setEditError('');
            }
        } catch (error) { setEditError(error instanceof Error ? error.message : 'Não foi possível abrir a galeria.'); }
    };
    const saveEditedPost = async () => {
        if (!editingPost || editSaving || !editContent.trim()) { setEditError('Escreva uma mensagem para a publicação.'); return; }
        setEditSaving(true);
        setEditError('');
        try {
            const imageUrl = editImageUri
                ? await CommunityService.uploadPostImage(editImageUri, ownerId, editImageMimeType)
                : removeEditImage ? null : editingPost.imageUrl || null;
            const updated = await CommunityService.updatePost(editingPost, ownerId, editContent.trim(), imageUrl);
            setPosts(current => current.map(post => post.id === updated.id ? updated : post));
            setEditingPost(null);
            toast.success('Publicação atualizada.');
        } catch (error) { setEditError(error instanceof Error ? error.message : 'Não foi possível salvar a edição.'); }
        finally { setEditSaving(false); }
    };
    const confirmDeletePost = async () => {
        if (!deleteTarget || deleting) return;
        setDeleting(true);
        try {
            await CommunityService.deletePost(deleteTarget, ownerId);
            setPosts(current => current.filter(post => post.id !== deleteTarget.id));
            setDeleteTarget(null);
            toast.success('Publicação excluída.');
        } catch (error) { setEditError(error instanceof Error ? error.message : 'Não foi possível excluir.'); }
        finally { setDeleting(false); }
    };

    // Render Post Card
    const renderPostItem = ({ item, index }: { item: CommunityPost; index: number }) => {
        const isAuthorMe = !item.isFictitious && item.userId === ownerId;

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
                entering={FadeInUp.delay(Math.min(index, 5) * 40).duration(220)}
                style={{
                    backgroundColor: theme.colors.backgroundTertiary,
                    borderRadius: Radius.lg,
                    marginHorizontal: 16,
                    marginBottom: 16,
                    overflow: 'hidden',
                }}
            >
                <View style={{ padding: 16 }}>
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
                                            fontWeight: '700',
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
                                        <Ionicons name="checkmark-circle" size={14} color={theme.colors.info} />
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

                        {/* Category and owner actions */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
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
                        {isAuthorMe && <TouchableOpacity onPress={() => setPostMenuId(current => current === item.id ? null : item.id)} accessibilityLabel="Opções da publicação" style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
                            <Ionicons name="ellipsis-horizontal" size={19} color={theme.colors.textSecondary} />
                        </TouchableOpacity>}
                        </View>
                    </View>
                    {postMenuId === item.id && <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end', marginBottom: 12 }}>
                        <TouchableOpacity onPress={() => openEditPost(item)} style={{ flexDirection: 'row', gap: 5, alignItems: 'center', paddingHorizontal: 12, minHeight: 36, backgroundColor: theme.colors.backgroundTertiary, borderRadius: 11 }}><Ionicons name="create-outline" size={16} color={theme.colors.text} /><Text style={{ color: theme.colors.text, fontSize: 12, fontWeight: '700' }}>Editar</Text></TouchableOpacity>
                        <TouchableOpacity onPress={() => { setPostMenuId(null); setEditError(''); setDeleteTarget(item); }} style={{ flexDirection: 'row', gap: 5, alignItems: 'center', paddingHorizontal: 12, minHeight: 36, backgroundColor: theme.colors.error + '18', borderRadius: 11 }}><Ionicons name="trash-outline" size={16} color={theme.colors.error} /><Text style={{ color: theme.colors.error, fontSize: 12, fontWeight: '700' }}>Excluir</Text></TouchableOpacity>
                    </View>}

                    {/* Workout Attachment Tag */}
                    {item.workoutTag && (
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 6,
                                backgroundColor:
                                    theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : theme.colors.backgroundSecondary,
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
                                    <Ionicons name="flame-outline" size={13} color={theme.colors.warning} />
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
                    {item.workoutStats?.exerciseNames?.length ? (() => {
                        const group = item.workoutStats?.muscleGroup || '';
                        const anatomy = group === 'Quadris' ? MUSCLE_IMAGES['Glúteos']
                            : MUSCLE_IMAGES[group as keyof typeof MUSCLE_IMAGES];
                        return <View style={{ backgroundColor: theme.colors.backgroundTertiary, borderRadius: 16, overflow: 'hidden', marginBottom: 14 }}>
                            <View style={{ flexDirection: 'row', minHeight: 126 }}>
                                <View style={{ width: 108, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' }}>
                                    {anatomy ? <Image source={anatomy} contentFit="contain" cachePolicy="memory-disk" style={{ width: '100%', height: '100%' }} />
                                        : <Ionicons name="barbell-outline" size={35} color={theme.colors.primary} />}
                                </View>
                                <View style={{ flex: 1, padding: 12, justifyContent: 'center' }}>
                                    <Text style={{ color: theme.colors.primary, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 }}>Treino concluído</Text>
                                    <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '700', marginTop: 3 }} numberOfLines={2}>{item.workoutTag || 'Minha sessão'}</Text>
                                    <Text style={{ color: theme.colors.textSecondary, fontSize: 11, marginTop: 6 }}>{item.workoutStats?.durationMinutes || 0} min · {item.workoutStats?.exerciseNames?.length} exercícios</Text>
                                    {group ? <Text style={{ color: theme.colors.textMuted, fontSize: 10, marginTop: 3 }}>Foco: {group}</Text> : null}
                                </View>
                            </View>
                            <View style={{ paddingHorizontal: 13, paddingVertical: 11, borderTopWidth: 1, borderTopColor: theme.colors.divider }}>
                                <Text style={{ color: theme.colors.textSecondary, fontSize: 11, fontWeight: '700', marginBottom: 5 }}>EXERCÍCIOS REALIZADOS</Text>
                                <Text style={{ color: theme.colors.text, fontSize: 12, lineHeight: 19 }}>{item.workoutStats?.exerciseNames?.join(' · ')}</Text>
                            </View>
                        </View>;
                    })() : null}
                    {item.imageUrl ? <PostPhoto uri={item.imageUrl} /> : null}
                    {item.localOnly && <Text style={{ color: theme.colors.warning, fontSize: 11, marginBottom: 10 }}>Salvo neste aparelho · não enviado à comunidade</Text>}

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
                                color={item.isLikedByMe ? theme.colors.error : theme.colors.textMuted}
                            />
                            <Text
                                style={{
                                    color: item.isLikedByMe ? theme.colors.error : theme.colors.textMuted,
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
                </View>
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
                        <View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text
                                    style={{
                                        color: theme.colors.text,
                                        fontFamily: FontFamily.display,
                                        fontSize: 20,
                                        fontWeight: '700',
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
                                        backgroundColor: theme.colors.success,
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
                                Treinos, dúvidas e conquistas em um só lugar
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
                            shadowOpacity: 0.1,
                            shadowRadius: 4,
                            elevation: 4,
                        }}
                    >
                        <Ionicons name="add" size={18} color={theme.colors.onPrimary} />
                        <Text
                            style={{
                                color: theme.colors.onPrimary,
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
                                        : theme.colors.backgroundSecondary,
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
                    onEndReached={loadMorePosts}
                    onEndReachedThreshold={0.5}
                    initialNumToRender={6}
                    maxToRenderPerBatch={6}
                    windowSize={5}
                    ListFooterComponent={loadingMore ? <ActivityIndicator color={theme.colors.primary} style={{ marginVertical: 16 }} /> : null}
                    keyExtractor={(item) => item.id}
                    renderItem={renderPostItem}
                    contentContainerStyle={{ paddingTop: 12, paddingBottom: tabScrollBottomPadding(Platform.OS, insets.bottom) }}
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
                            backgroundColor: theme.mode === 'dark' ? '#141720' : theme.colors.card,
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
                                    Sua publicação ficará visível na Comunidade
                                </Text>
                            </View>

                            <TouchableOpacity
                                onPress={() => setIsCreateModalOpen(false)}
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 16,
                                    backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : theme.colors.backgroundTertiary,
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
                                        <Text style={{ color: theme.colors.onPrimary, fontFamily: FontFamily.display, fontWeight: '700' }}>
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
                                                backgroundColor: isSelected ? theme.colors.primary : theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : theme.colors.backgroundSecondary,
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
                                                backgroundColor: isSelected ? theme.colors.primary + '25' : theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : theme.colors.background,
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
                                    backgroundColor: theme.mode === 'dark' ? '#0E1017' : theme.colors.background,
                                    color: theme.colors.text,
                                    borderRadius: Radius.md,
                                    padding: 14,
                                    fontSize: 14,
                                    fontFamily: FontFamily.sans,
                                    textAlignVertical: 'top',
                                    minHeight: 120,
                                    borderWidth: 1,
                                    borderColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : theme.colors.backgroundTertiary,
                                    marginBottom: 16,
                                }}
                            />

                            <TouchableOpacity onPress={pickPostPhoto} style={{ flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 12, marginBottom: 10 }}>
                                <Ionicons name="image-outline" size={21} color={theme.colors.primary} />
                                <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>{postImageUri ? 'Trocar foto' : 'Adicionar foto'}</Text>
                            </TouchableOpacity>
                            {postImageUri && <View style={{ marginBottom: 16 }}>
                                <Image source={{ uri: postImageUri }} contentFit="contain" style={{ width: '100%', height: 180, borderRadius: 14, backgroundColor: theme.colors.backgroundTertiary }} />
                                <TouchableOpacity onPress={() => { setPostImageUri(null); setPostImageMimeType(undefined); }} style={{ paddingVertical: 8 }}><Text style={{ color: theme.colors.error }}>Remover foto</Text></TouchableOpacity>
                            </View>}
                            {postError ? <View style={{ marginBottom: 12, padding: 12, borderRadius: 12, backgroundColor: theme.colors.warning + '18' }}>
                                <Text style={{ color: theme.colors.text, fontSize: 12, lineHeight: 18 }}>{postError}</Text>
                                {!session?.user?.id && postImageUri ? <TouchableOpacity onPress={() => { setIsCreateModalOpen(false); router.push('/(auth)/login'); }} style={{ paddingTop: 9 }}><Text style={{ color: theme.colors.primary, fontWeight: '700' }}>Entrar na conta</Text></TouchableOpacity> : null}
                            </View> : null}

                            {/* Publish Action Button */}
                            <TouchableOpacity
                                onPress={handlePublishPost}
                                disabled={isPublishing || (!postContent.trim() && !postImageUri)}
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

            <Modal visible={!!editingPost} animationType="slide" transparent onRequestClose={() => setEditingPost(null)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.65)' }}>
                    <View style={{ backgroundColor: theme.colors.background, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingBottom: insets.bottom + 20, maxHeight: '88%' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                            <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '700' }}>Editar publicação</Text>
                            <TouchableOpacity onPress={() => setEditingPost(null)} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="close" size={22} color={theme.colors.text} /></TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                            <TextInput value={editContent} onChangeText={setEditContent} multiline placeholder="Escreva sua mensagem" placeholderTextColor={theme.colors.textMuted}
                                style={{ minHeight: 110, textAlignVertical: 'top', color: theme.colors.text, backgroundColor: theme.colors.backgroundTertiary, borderRadius: 14, padding: 14, fontSize: 14 }} />
                            {(editImageUri || (!removeEditImage && editingPost?.imageUrl)) && <View style={{ marginTop: 14 }}>
                                <PostPhoto uri={editImageUri || editingPost!.imageUrl!} />
                                <TouchableOpacity onPress={() => { setEditImageUri(null); setRemoveEditImage(true); }} style={{ paddingVertical: 8 }}><Text style={{ color: theme.colors.error, fontWeight: '700' }}>Remover foto</Text></TouchableOpacity>
                            </View>}
                            <TouchableOpacity onPress={pickEditPhoto} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, marginTop: 8 }}><Ionicons name="image-outline" size={20} color={theme.colors.primary} /><Text style={{ color: theme.colors.primary, fontWeight: '700' }}>{editingPost?.imageUrl || editImageUri ? 'Trocar foto' : 'Adicionar foto'}</Text></TouchableOpacity>
                            {editError ? <Text style={{ color: theme.colors.error, fontSize: 12, lineHeight: 18, marginBottom: 10 }}>{editError}</Text> : null}
                            <TouchableOpacity onPress={saveEditedPost} disabled={editSaving} style={{ backgroundColor: theme.colors.primary, borderRadius: 14, minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 10 }}><Text style={{ color: theme.colors.onPrimary, fontWeight: '700' }}>{editSaving ? 'Salvando...' : 'Salvar alterações'}</Text></TouchableOpacity>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            <Modal visible={!!deleteTarget} animationType="fade" transparent onRequestClose={() => setDeleteTarget(null)}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                    <View style={{ width: '100%', maxWidth: 380, backgroundColor: theme.colors.background, borderRadius: 20, padding: 20 }}>
                        <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '700' }}>Excluir publicação?</Text>
                        <Text style={{ color: theme.colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 8 }}>Esta ação remove o post da comunidade e não pode ser desfeita.</Text>
                        {editError ? <Text style={{ color: theme.colors.error, fontSize: 12, marginTop: 10 }}>{editError}</Text> : null}
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                            <TouchableOpacity onPress={() => setDeleteTarget(null)} style={{ flex: 1, minHeight: 46, borderRadius: 13, backgroundColor: theme.colors.backgroundTertiary, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: theme.colors.text, fontWeight: '700' }}>Cancelar</Text></TouchableOpacity>
                            <TouchableOpacity onPress={confirmDeletePost} disabled={deleting} style={{ flex: 1, minHeight: 46, borderRadius: 13, backgroundColor: theme.colors.error, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontWeight: '700' }}>{deleting ? 'Excluindo...' : 'Excluir'}</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
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
                            backgroundColor: theme.mode === 'dark' ? '#141720' : theme.colors.card,
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
                                    backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : theme.colors.backgroundTertiary,
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
                                                <Text style={{ color: theme.colors.text, fontFamily: FontFamily.display, fontWeight: '700', fontSize: 12 }}>
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
                                backgroundColor: theme.mode === 'dark' ? '#0E1017' : theme.colors.backgroundSecondary,
                                borderRadius: Radius.full,
                                paddingHorizontal: 14,
                                paddingVertical: 6,
                                borderWidth: 1,
                                borderColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : theme.colors.backgroundTertiary,
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
