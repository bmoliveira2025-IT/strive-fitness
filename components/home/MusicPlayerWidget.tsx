import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { FontFamily, Radius } from '../../constants/theme';
import {
    formatMediaUrl,
    MediaItem,
    MUSIKA_STYLES,
    StyleCategory,
    useMusicPlayer,
} from '../../context/MusicPlayerContext';
import { useTheme } from '../../context/ThemeContext';
import { MusikaLoginModal } from '../music/MusikaLoginModal';
import { MarqueeText } from '../ui/MarqueeText';

const ITEM_HEIGHT = 58;

// Memoized Song Row for high-performance 60fps scrolling
const SongRowItem = memo(function SongRowItem({
    item,
    isCurrent,
    isPlaying,
    isFav,
    theme,
    onSelect,
    onToggleFav,
}: {
    item: MediaItem;
    isCurrent: boolean;
    isPlaying: boolean;
    isFav: boolean;
    theme: any;
    onSelect: (item: MediaItem) => void;
    onToggleFav?: (id: string) => void;
}) {
    const itemLogo = formatMediaUrl(item.logo);

    return (
        <TouchableOpacity
            onPress={() => onSelect(item)}
            activeOpacity={0.75}
            style={{
                height: ITEM_HEIGHT,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 12,
                borderRadius: Radius.md,
                backgroundColor: isCurrent
                    ? theme.colors.primary + '18'
                    : (theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC'),
                borderWidth: 1,
                borderColor: isCurrent ? theme.colors.primary : 'transparent',
                marginBottom: 6,
            }}
        >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, marginRight: 8 }}>
                <View
                    style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        backgroundColor: theme.mode === 'dark' ? '#202430' : '#E2E8F0',
                        overflow: 'hidden',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {itemLogo ? (
                        <Image
                            source={{ uri: itemLogo }}
                            style={{ width: '100%', height: '100%' }}
                            contentFit="cover"
                            cachePolicy="memory-disk"
                        />
                    ) : (
                        <Ionicons
                            name={item.type === 'song' ? 'musical-note' : 'radio'}
                            size={16}
                            color={theme.colors.primary}
                        />
                    )}
                </View>

                <View style={{ flex: 1 }}>
                    <Text
                        numberOfLines={1}
                        style={{
                            color: isCurrent ? theme.colors.primary : theme.colors.text,
                            fontSize: 13,
                            fontFamily: isCurrent ? FontFamily.sansBold : FontFamily.sansMedium,
                        }}
                    >
                        {item.title}
                    </Text>
                    <Text
                        numberOfLines={1}
                        style={{
                            color: theme.colors.textMuted,
                            fontSize: 11,
                            fontFamily: FontFamily.sans,
                        }}
                    >
                        {item.artist}
                    </Text>
                </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {item.type === 'song' && onToggleFav && (
                    <TouchableOpacity
                        onPress={() => onToggleFav(item.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={{ padding: 4 }}
                    >
                        <Ionicons
                            name={isFav ? 'heart' : 'heart-outline'}
                            size={18}
                            color={isFav ? '#EF4444' : theme.colors.textMuted}
                        />
                    </TouchableOpacity>
                )}

                <View
                    style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: isCurrent && isPlaying ? theme.colors.primary : theme.colors.primary + '20',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Ionicons
                        name={isCurrent && isPlaying ? 'pause' : 'play'}
                        size={13}
                        color={isCurrent && isPlaying ? '#000000' : theme.colors.primary}
                    />
                </View>
            </View>
        </TouchableOpacity>
    );
});

export function MusicPlayerWidget() {
    const { theme } = useTheme();
    const [playlistModalOpen, setPlaylistModalOpen] = useState(false);
    const [modalTab, setModalTab] = useState<'style' | 'playlists' | 'radios'>('style');
    const [searchQuery, setSearchQuery] = useState('');
    const [radioCategoryFilter, setRadioCategoryFilter] = useState<string>('all');

    const {
        selectedStyle,
        setSelectedStyle,
        allRadios,
        filteredItems,
        currentItem,
        isPlaying,
        isBuffering,
        togglePlay,
        nextTrack,
        prevTrack,
        selectTrack,
        musikaUser,
        isMusikaLoggedIn,
        userPlaylists,
        selectedPlaylistId,
        setSelectedPlaylistId,
        isFavorite,
        toggleFavorite,
        setIsAuthModalOpen,
    } = useMusicPlayer();

    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        setImageError(false);
    }, [currentItem?.id]);

    const logoUri = formatMediaUrl(currentItem?.logo);
    const isConnecting = isBuffering && !isPlaying;
    const currentIsFav = currentItem?.type === 'song' ? isFavorite(currentItem.id) : false;

    const currentStyleInfo =
        selectedStyle === 'user_playlists'
            ? { label: 'Minhas Playlists', icon: 'folder', description: 'Playlists da sua conta MusiKA' }
            : selectedStyle === 'favorites'
            ? { label: 'Músicas Favoritas', icon: 'heart', description: 'Músicas curtidas por você' }
            : MUSIKA_STYLES.find((s) => s.id === selectedStyle) || MUSIKA_STYLES[0];

    // Radio stations filter by genre
    const filteredRadios = useMemo(() => {
        if (radioCategoryFilter === 'all') return allRadios;
        const q = radioCategoryFilter.toLowerCase();
        return allRadios.filter((r) => {
            const g = (r.genre || '').toLowerCase();
            const t = (r.title || '').toLowerCase();
            return g.includes(q) || t.includes(q);
        });
    }, [allRadios, radioCategoryFilter]);

    // Search inside modal items
    const searchedSongs = useMemo(() => {
        let pool = filteredItems;
        if (modalTab === 'radios') pool = filteredRadios;

        if (!searchQuery.trim()) return pool;
        const q = searchQuery.toLowerCase();
        return pool.filter(
            (i) => i.title.toLowerCase().includes(q) || i.artist.toLowerCase().includes(q) || (i.genre && i.genre.toLowerCase().includes(q))
        );
    }, [searchQuery, filteredItems, modalTab, filteredRadios]);

    const handleSelectSong = useCallback(
        (item: MediaItem) => {
            selectTrack(item);
            setPlaylistModalOpen(false);
        },
        [selectTrack]
    );

    const handleToggleFav = useCallback(
        (id: string) => {
            toggleFavorite(id);
        },
        [toggleFavorite]
    );

    const renderItem = useCallback(
        ({ item }: { item: MediaItem }) => (
            <SongRowItem
                item={item}
                isCurrent={currentItem?.id === item.id}
                isPlaying={isPlaying}
                isFav={isFavorite(item.id)}
                theme={theme}
                onSelect={handleSelectSong}
                onToggleFav={handleToggleFav}
            />
        ),
        [currentItem?.id, isPlaying, theme, isFavorite, handleSelectSong, handleToggleFav]
    );

    const getItemLayout = useCallback(
        (_: any, index: number) => ({
            length: ITEM_HEIGHT + 6,
            offset: (ITEM_HEIGHT + 6) * index,
            index,
        }),
        []
    );

    return (
        <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
            {/* Header with Account Button */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                    <Ionicons name="musical-notes" size={15} color={theme.colors.primary} />
                    <Text
                        numberOfLines={1}
                        style={{
                            color: theme.colors.textSecondary,
                            fontSize: 12,
                            fontFamily: FontFamily.caption,
                            letterSpacing: 0.8,
                            textTransform: 'uppercase',
                        }}
                    >
                        MusiKA • Streaming
                    </Text>
                </View>

                {/* Right Header Actions */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {/* MusiKA Account Button */}
                    <TouchableOpacity
                        onPress={() => setIsAuthModalOpen(true)}
                        activeOpacity={0.8}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 5,
                            backgroundColor: isMusikaLoggedIn ? '#10B98115' : (theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9'),
                            paddingHorizontal: 8,
                            paddingVertical: 5,
                            borderRadius: Radius.sm,
                            borderWidth: 1,
                            borderColor: isMusikaLoggedIn ? '#10B98140' : (theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0'),
                        }}
                    >
                        <Ionicons
                            name={isMusikaLoggedIn ? 'person-circle' : 'person-outline'}
                            size={14}
                            color={isMusikaLoggedIn ? '#10B981' : theme.colors.textSecondary}
                        />
                        <Text
                            numberOfLines={1}
                            style={{
                                color: isMusikaLoggedIn ? '#10B981' : theme.colors.textSecondary,
                                fontSize: 11,
                                fontFamily: FontFamily.sansBold,
                                maxWidth: 100,
                            }}
                        >
                            {isMusikaLoggedIn ? (musikaUser?.name?.split(' ')[0] || 'Conectado') : 'Login MusiKA'}
                        </Text>
                    </TouchableOpacity>

                    {/* Fila / Queue Button */}
                    <TouchableOpacity
                        onPress={() => {
                            setModalTab('style');
                            setPlaylistModalOpen(true);
                        }}
                        activeOpacity={0.8}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 5,
                            backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
                            paddingHorizontal: 10,
                            paddingVertical: 5,
                            borderRadius: Radius.sm,
                            borderWidth: 1,
                            borderColor: theme.colors.primary + '40',
                            flexShrink: 0,
                        }}
                    >
                        <Ionicons name="list" size={13} color={theme.colors.primary} />
                        <Text
                            style={{
                                color: theme.colors.text,
                                fontSize: 11,
                                fontFamily: FontFamily.sansBold,
                            }}
                        >
                            Fila ({filteredItems.length})
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* MusiKA Style Selector Pills (Scrollable) */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 6, paddingBottom: 4 }}
                style={{ marginBottom: 10 }}
            >
                {/* Minhas Playlists Pill */}
                <TouchableOpacity
                    onPress={() => {
                        if (isMusikaLoggedIn && userPlaylists.length > 0) {
                            setSelectedStyle('user_playlists');
                        } else {
                            setIsAuthModalOpen(true);
                        }
                    }}
                    activeOpacity={0.75}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 5,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: Radius.sm,
                        backgroundColor: selectedStyle === 'user_playlists'
                            ? theme.colors.primary + '25'
                            : (theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9'),
                        borderWidth: 1,
                        borderColor: selectedStyle === 'user_playlists' ? theme.colors.primary : 'transparent',
                    }}
                >
                    <Ionicons
                        name="folder-open"
                        size={12}
                        color={selectedStyle === 'user_playlists' ? theme.colors.primary : theme.colors.textMuted}
                    />
                    <Text
                        style={{
                            color: selectedStyle === 'user_playlists' ? theme.colors.primary : theme.colors.textMuted,
                            fontSize: 11,
                            fontFamily: selectedStyle === 'user_playlists' ? FontFamily.sansBold : FontFamily.sansMedium,
                        }}
                    >
                        Minhas Playlists {userPlaylists.length > 0 ? `(${userPlaylists.length})` : ''}
                    </Text>
                </TouchableOpacity>

                {/* Favoritas Pill */}
                <TouchableOpacity
                    onPress={() => setSelectedStyle('favorites')}
                    activeOpacity={0.75}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 5,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: Radius.sm,
                        backgroundColor: selectedStyle === 'favorites'
                            ? '#EF444425'
                            : (theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9'),
                        borderWidth: 1,
                        borderColor: selectedStyle === 'favorites' ? '#EF4444' : 'transparent',
                    }}
                >
                    <Ionicons
                        name="heart"
                        size={12}
                        color={selectedStyle === 'favorites' ? '#EF4444' : theme.colors.textMuted}
                    />
                    <Text
                        style={{
                            color: selectedStyle === 'favorites' ? '#EF4444' : theme.colors.textMuted,
                            fontSize: 11,
                            fontFamily: selectedStyle === 'favorites' ? FontFamily.sansBold : FontFamily.sansMedium,
                        }}
                    >
                        Favoritas
                    </Text>
                </TouchableOpacity>

                {/* Musical Genres / Styles */}
                {MUSIKA_STYLES.map((style) => {
                    const active = selectedStyle === style.id;
                    return (
                        <TouchableOpacity
                            key={style.id}
                            onPress={() => setSelectedStyle(style.id as StyleCategory)}
                            activeOpacity={0.75}
                            style={{
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                borderRadius: Radius.sm,
                                backgroundColor: active
                                    ? theme.colors.primary + '25'
                                    : (theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9'),
                                borderWidth: 1,
                                borderColor: active ? theme.colors.primary : 'transparent',
                            }}
                        >
                            <Text
                                style={{
                                    color: active ? theme.colors.primary : theme.colors.textMuted,
                                    fontSize: 11,
                                    fontFamily: active ? FontFamily.sansBold : FontFamily.sansMedium,
                                }}
                            >
                                {style.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Main MusiKA Player Card */}
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
                            ? ['rgba(30, 34, 45, 0.8)', 'rgba(15, 17, 23, 0.95)']
                            : ['rgba(240, 245, 255, 0.7)', 'rgba(255, 255, 255, 0.95)']
                    }
                    style={{ padding: 16 }}
                >
                    {/* Track Info & Visualizer */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                        <TouchableOpacity
                            onPress={() => setPlaylistModalOpen(true)}
                            activeOpacity={0.85}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, marginRight: 8 }}
                        >
                            {/* Artwork / Cover */}
                            <View
                                style={{
                                    width: 52,
                                    height: 52,
                                    borderRadius: 14,
                                    backgroundColor: theme.mode === 'dark' ? '#1E222D' : '#F1F5F9',
                                    borderWidth: 1,
                                    borderColor: theme.colors.border,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                }}
                            >
                                {logoUri && !imageError ? (
                                    <Image
                                        source={{ uri: logoUri }}
                                        style={{ width: '100%', height: '100%' }}
                                        contentFit="cover"
                                        onError={() => setImageError(true)}
                                        cachePolicy="memory-disk"
                                    />
                                ) : (
                                    <View
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: theme.colors.primary + '18',
                                        }}
                                    >
                                        <Ionicons
                                            name={currentItem?.type === 'song' ? 'musical-note' : 'radio'}
                                            size={24}
                                            color={theme.colors.primary}
                                        />
                                    </View>
                                )}
                            </View>

                            {/* Details */}
                            <View style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                                    <View
                                        style={{
                                            backgroundColor: isPlaying
                                                ? theme.colors.primary
                                                : (theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0'),
                                            paddingHorizontal: 6,
                                            paddingVertical: 1.5,
                                            borderRadius: 4,
                                            flexShrink: 0,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                color: isPlaying ? '#000000' : theme.colors.textMuted,
                                                fontSize: 9,
                                                fontFamily: FontFamily.sansBold,
                                            }}
                                        >
                                            {currentItem?.badge || 'MÚSICA'}
                                        </Text>
                                    </View>

                                    <MarqueeText
                                        text={currentItem?.title || 'Música'}
                                        isPlaying={isPlaying}
                                        style={{
                                            color: theme.colors.text,
                                            fontSize: 14,
                                            fontFamily: FontFamily.displaySemiBold,
                                            letterSpacing: -0.2,
                                        }}
                                        containerStyle={{ flex: 1, minWidth: 0 }}
                                    />
                                </View>

                                <MarqueeText
                                    text={currentItem?.artist || 'MusiKA'}
                                    isPlaying={isPlaying}
                                    style={{
                                        color: theme.colors.textMuted,
                                        fontSize: 11,
                                        fontFamily: FontFamily.sans,
                                    }}
                                    containerStyle={{ width: '100%' }}
                                />
                            </View>
                        </TouchableOpacity>

                        {/* Favorite Button on Player Card */}
                        {currentItem?.type === 'song' && (
                            <TouchableOpacity
                                onPress={() => toggleFavorite(currentItem.id)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                style={{ padding: 6 }}
                            >
                                <Ionicons
                                    name={currentIsFav ? 'heart' : 'heart-outline'}
                                    size={22}
                                    color={currentIsFav ? '#EF4444' : theme.colors.textSecondary}
                                />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Playback Controls */}
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 32,
                            paddingTop: 10,
                            borderTopWidth: 1,
                            borderTopColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
                        }}
                    >
                        <TouchableOpacity onPress={prevTrack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                            <Ionicons name="play-skip-back" size={22} color={theme.colors.textSecondary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={togglePlay}
                            activeOpacity={0.85}
                            style={{
                                width: 46,
                                height: 46,
                                borderRadius: 23,
                                backgroundColor: theme.colors.primary,
                                alignItems: 'center',
                                justifyContent: 'center',
                                shadowColor: theme.colors.primary,
                                shadowOffset: { width: 0, height: 3 },
                                shadowOpacity: 0.4,
                                shadowRadius: 8,
                                elevation: 5,
                            }}
                        >
                            {isConnecting ? (
                                <ActivityIndicator size="small" color="#000000" />
                            ) : (
                                <Ionicons name={isPlaying ? 'pause' : 'play'} size={22} color="#000000" />
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity onPress={nextTrack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                            <Ionicons name="play-skip-forward" size={22} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            </View>

            {/* Modal de Playlist e Rádios com Abas */}
            <Modal
                visible={playlistModalOpen}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setPlaylistModalOpen(false)}
            >
                <View
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        justifyContent: 'flex-end',
                    }}
                >
                    <View
                        style={{
                            height: '80%',
                            backgroundColor: theme.mode === 'dark' ? '#14161F' : '#FFFFFF',
                            borderTopLeftRadius: 24,
                            borderTopRightRadius: 24,
                            borderTopWidth: 1,
                            borderColor: theme.colors.border,
                            paddingTop: 16,
                            paddingHorizontal: 20,
                        }}
                    >
                        {/* Drag Handle */}
                        <View style={{ alignItems: 'center', marginBottom: 12 }}>
                            <View
                                style={{
                                    width: 40,
                                    height: 4,
                                    borderRadius: 2,
                                    backgroundColor: theme.colors.border,
                                }}
                            />
                        </View>

                        {/* Title & Close */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <View>
                                <Text
                                    style={{
                                        color: theme.colors.text,
                                        fontSize: 17,
                                        fontFamily: FontFamily.display,
                                        fontWeight: '800',
                                    }}
                                >
                                    {modalTab === 'playlists' ? 'Minhas Playlists MusiKA' : modalTab === 'radios' ? 'Rádios Ao Vivo 24/7' : currentStyleInfo.label}
                                </Text>
                                <Text
                                    style={{
                                        color: theme.colors.textMuted,
                                        fontSize: 12,
                                        fontFamily: FontFamily.sans,
                                    }}
                                >
                                    {modalTab === 'radios' ? `${filteredRadios.length} estações` : `${filteredItems.length} faixas disponíveis`}
                                </Text>
                            </View>

                            <TouchableOpacity
                                onPress={() => setPlaylistModalOpen(false)}
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 16,
                                    backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Ionicons name="close" size={18} color={theme.colors.text} />
                            </TouchableOpacity>
                        </View>

                        {/* Modal Navigation Tabs */}
                        <View
                            style={{
                                flexDirection: 'row',
                                backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
                                borderRadius: Radius.md,
                                padding: 3,
                                marginBottom: 12,
                            }}
                        >
                            <TouchableOpacity
                                onPress={() => setModalTab('style')}
                                style={{
                                    flex: 1,
                                    paddingVertical: 7,
                                    alignItems: 'center',
                                    borderRadius: Radius.sm,
                                    backgroundColor: modalTab === 'style' ? (theme.mode === 'dark' ? '#222838' : '#FFFFFF') : 'transparent',
                                }}
                            >
                                <Text
                                    style={{
                                        color: modalTab === 'style' ? theme.colors.primary : theme.colors.textMuted,
                                        fontSize: 12,
                                        fontFamily: modalTab === 'style' ? FontFamily.sansBold : FontFamily.sans,
                                    }}
                                >
                                    Estilo Ativo
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setModalTab('playlists')}
                                style={{
                                    flex: 1,
                                    paddingVertical: 7,
                                    alignItems: 'center',
                                    borderRadius: Radius.sm,
                                    backgroundColor: modalTab === 'playlists' ? (theme.mode === 'dark' ? '#222838' : '#FFFFFF') : 'transparent',
                                }}
                            >
                                <Text
                                    style={{
                                        color: modalTab === 'playlists' ? theme.colors.primary : theme.colors.textMuted,
                                        fontSize: 12,
                                        fontFamily: modalTab === 'playlists' ? FontFamily.sansBold : FontFamily.sans,
                                    }}
                                >
                                    Playlists ({userPlaylists.length})
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setModalTab('radios')}
                                style={{
                                    flex: 1,
                                    paddingVertical: 7,
                                    alignItems: 'center',
                                    borderRadius: Radius.sm,
                                    backgroundColor: modalTab === 'radios' ? (theme.mode === 'dark' ? '#222838' : '#FFFFFF') : 'transparent',
                                }}
                            >
                                <Text
                                    style={{
                                        color: modalTab === 'radios' ? theme.colors.primary : theme.colors.textMuted,
                                        fontSize: 12,
                                        fontFamily: modalTab === 'radios' ? FontFamily.sansBold : FontFamily.sans,
                                    }}
                                >
                                    Rádios ({allRadios.length})
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Search Input */}
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
                                borderRadius: Radius.md,
                                paddingHorizontal: 12,
                                paddingVertical: 8,
                                marginBottom: 12,
                                gap: 8,
                            }}
                        >
                            <Ionicons name="search" size={16} color={theme.colors.textMuted} />
                            <TextInput
                                placeholder={modalTab === 'radios' ? 'Buscar rádio por nome ou estilo...' : 'Buscar música ou artista...'}
                                placeholderTextColor={theme.colors.textMuted}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                style={{
                                    flex: 1,
                                    color: theme.colors.text,
                                    fontSize: 13,
                                    fontFamily: FontFamily.sans,
                                    padding: 0,
                                }}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <Ionicons name="close-circle" size={16} color={theme.colors.textMuted} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Radio Category Chips (Only on Radios tab) */}
                        {modalTab === 'radios' && (
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ gap: 6, paddingBottom: 10 }}
                            >
                                {[
                                    { id: 'all', label: 'Todas' },
                                    { id: 'rock', label: '🎸 Rock' },
                                    { id: 'pop', label: '✨ Pop & Hits' },
                                    { id: 'dance', label: '⚡ Dance' },
                                    { id: 'flashback', label: '🎧 Flashback' },
                                    { id: 'gospel', label: '🙏 Gospel' },
                                    { id: 'pagode', label: '💃 Pagode' },
                                    { id: 'jazz', label: '🎷 Jazz' },
                                    { id: 'news', label: '📰 Notícias' },
                                ].map((cat) => (
                                    <TouchableOpacity
                                        key={cat.id}
                                        onPress={() => setRadioCategoryFilter(cat.id)}
                                        style={{
                                            paddingHorizontal: 10,
                                            paddingVertical: 5,
                                            borderRadius: Radius.sm,
                                            backgroundColor: radioCategoryFilter === cat.id ? theme.colors.primary + '25' : (theme.mode === 'dark' ? '#1E222D' : '#F1F5F9'),
                                            borderWidth: 1,
                                            borderColor: radioCategoryFilter === cat.id ? theme.colors.primary : 'transparent',
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 11,
                                                color: radioCategoryFilter === cat.id ? theme.colors.primary : theme.colors.textMuted,
                                                fontFamily: FontFamily.sansMedium,
                                            }}
                                        >
                                            {cat.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}

                        {/* TAB CONTENT */}
                        {modalTab === 'playlists' ? (
                            /* User Playlists Tab */
                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
                                {!isMusikaLoggedIn ? (
                                    <View
                                        style={{
                                            backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
                                            borderRadius: Radius.lg,
                                            padding: 20,
                                            alignItems: 'center',
                                            borderWidth: 1,
                                            borderColor: theme.colors.primary + '30',
                                            gap: 12,
                                            marginVertical: 10,
                                        }}
                                    >
                                        <Ionicons name="lock-closed" size={32} color={theme.colors.primary} />
                                        <Text
                                            style={{
                                                color: theme.colors.text,
                                                fontSize: 15,
                                                fontFamily: FontFamily.sansBold,
                                                textAlign: 'center',
                                            }}
                                        >
                                            Acesse Suas Playlists MusiKA
                                        </Text>
                                        <Text
                                            style={{
                                                color: theme.colors.textMuted,
                                                fontSize: 13,
                                                fontFamily: FontFamily.sans,
                                                textAlign: 'center',
                                                lineHeight: 18,
                                            }}
                                        >
                                            Faça login com sua conta do MusiKA para sincronizar e ouvir suas próprias playlists personalizadas de treino.
                                        </Text>
                                        <TouchableOpacity
                                            onPress={() => {
                                                setPlaylistModalOpen(false);
                                                setIsAuthModalOpen(true);
                                            }}
                                            activeOpacity={0.85}
                                            style={{
                                                backgroundColor: theme.colors.primary,
                                                paddingHorizontal: 20,
                                                paddingVertical: 10,
                                                borderRadius: Radius.md,
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                gap: 8,
                                                marginTop: 4,
                                            }}
                                        >
                                            <Ionicons name="log-in-outline" size={18} color="#000000" />
                                            <Text
                                                style={{
                                                    color: '#000000',
                                                    fontSize: 13,
                                                    fontFamily: FontFamily.sansBold,
                                                }}
                                            >
                                                Entrar no MusiKA
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : userPlaylists.length === 0 ? (
                                    <View style={{ alignItems: 'center', padding: 30, gap: 10 }}>
                                        <Ionicons name="folder-open-outline" size={36} color={theme.colors.textMuted} />
                                        <Text style={{ color: theme.colors.text, fontSize: 14, fontFamily: FontFamily.sansBold }}>
                                            Nenhuma playlist criada ainda
                                        </Text>
                                        <Text style={{ color: theme.colors.textMuted, fontSize: 12, textAlign: 'center' }}>
                                            Crie playlists no MusiKA e elas aparecerão aqui automaticamente sincronizadas.
                                        </Text>
                                    </View>
                                ) : (
                                    userPlaylists.map((pl) => {
                                        const isSelected = selectedPlaylistId === (pl.id || pl._id);
                                        return (
                                            <TouchableOpacity
                                                key={pl.id || pl._id}
                                                onPress={() => {
                                                    setSelectedPlaylistId(pl.id || pl._id || null);
                                                    setSelectedStyle('user_playlists');
                                                    setModalTab('style');
                                                }}
                                                activeOpacity={0.75}
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: 14,
                                                    backgroundColor: isSelected ? theme.colors.primary + '18' : (theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC'),
                                                    borderRadius: Radius.md,
                                                    marginBottom: 8,
                                                    borderWidth: 1,
                                                    borderColor: isSelected ? theme.colors.primary : 'transparent',
                                                }}
                                            >
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                                                    <View
                                                        style={{
                                                            width: 42,
                                                            height: 42,
                                                            borderRadius: 10,
                                                            backgroundColor: theme.colors.primary + '20',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                        }}
                                                    >
                                                        <Ionicons name="musical-notes" size={20} color={theme.colors.primary} />
                                                    </View>
                                                    <View style={{ flex: 1 }}>
                                                        <Text
                                                            numberOfLines={1}
                                                            style={{
                                                                color: isSelected ? theme.colors.primary : theme.colors.text,
                                                                fontSize: 14,
                                                                fontFamily: FontFamily.sansBold,
                                                            }}
                                                        >
                                                            {pl.name}
                                                        </Text>
                                                        <Text
                                                            style={{
                                                                color: theme.colors.textMuted,
                                                                fontSize: 12,
                                                                fontFamily: FontFamily.sans,
                                                            }}
                                                        >
                                                            {pl.tracks?.length || 0} músicas
                                                        </Text>
                                                    </View>
                                                </View>
                                                <Ionicons
                                                    name={isSelected ? 'checkmark-circle' : 'play-circle'}
                                                    size={24}
                                                    color={theme.colors.primary}
                                                />
                                            </TouchableOpacity>
                                        );
                                    })
                                )}
                            </ScrollView>
                        ) : (
                            /* Virtualized FlatList for Active Style & Radios */
                            playlistModalOpen && (
                                <FlatList
                                    data={searchedSongs}
                                    keyExtractor={(item, index) => item.id + index}
                                    renderItem={renderItem}
                                    getItemLayout={getItemLayout}
                                    initialNumToRender={15}
                                    maxToRenderPerBatch={15}
                                    windowSize={5}
                                    removeClippedSubviews={true}
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={{ paddingBottom: 30 }}
                                />
                            )
                        )}
                    </View>
                </View>
            </Modal>

            {/* MusiKA Account / Login Modal */}
            <MusikaLoginModal />
        </View>
    );
}
