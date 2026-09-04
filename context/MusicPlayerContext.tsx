import { Audio } from 'expo-av';
import * as WebBrowser from 'expo-web-browser';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Linking, NativeModules, Platform } from 'react-native';
import {
    formatMusikaMediaUrl,
    MUSIKA_APK_DOWNLOAD_URL,
    MUSIKA_BASE_URL,
    MusikaPlaylist,
    musikaService,
    MusikaUser
} from '../services/musikaService';

export type StyleCategory =
    | 'all'
    | 'dance'
    | 'rock'
    | 'hiphop'
    | 'flashback'
    | 'mpb_pop'
    | 'gospel'
    | 'funk_pagode'
    | 'sertanejo'
    | 'radios'
    | 'user_playlists'
    | 'favorites';

export interface StyleOption {
    id: StyleCategory;
    label: string;
    icon: string;
    description: string;
    badgeCount?: number;
}

export const MUSIKA_STYLES: StyleOption[] = [
    { id: 'all', label: '🔥 Todas', icon: 'flame', description: 'Catálogo completo de 740+ músicas' },
    { id: 'dance', label: '⚡ Treino Dance', icon: 'flash', description: 'Eurodance, House, Techno & Eletro' },
    { id: 'rock', label: '🎸 Rock & Metal', icon: 'skull', description: 'Rock Nacional, Classic Rock & Metal' },
    { id: 'hiphop', label: '🎤 Hip-Hop & Rap', icon: 'mic', description: 'Hip-Hop, Rap & Trap de Treino' },
    { id: 'flashback', label: '🎧 Flashback & 90s', icon: 'disc', description: 'Freestyle, Soul, 80s & 90s' },
    { id: 'mpb_pop', label: '🇧🇷 MPB & Pop', icon: 'musical-note', description: 'MPB, Pop Rock & Reggae' },
    { id: 'gospel', label: '🙏 Gospel & Fé', icon: 'heart', description: 'Músicas Gospel, Louvor & Adoração' },
    { id: 'funk_pagode', label: '💃 Funk & Pagode', icon: 'musical-notes', description: 'Funk Melody, Pagode & Piseiro' },
    { id: 'sertanejo', label: '🤠 Sertanejo', icon: 'bonfire', description: 'Sertanejo Universitário & Modão' },
    { id: 'radios', label: '📻 Rádios Ao Vivo', icon: 'radio', description: '31 estações ao vivo transmitindo 24/7' },
];

export interface MediaItem {
    id: string;
    type: 'song' | 'radio';
    title: string;
    artist: string;
    genre?: string;
    logo?: string;
    audioUrl?: string;
    badge: string;
    playlistName?: string;
}

export const formatMediaUrl = formatMusikaMediaUrl;

type TrackPlayerModule = typeof import('react-native-track-player');
let nativeTrackPlayerModule: TrackPlayerModule | null = null;
// Automatically enable native TrackPlayer when native module is linked (APK / standalone),
// safely falling back to expo-av on web or Expo Go where native module is absent.
const USE_NATIVE_TRACK_PLAYER = Platform.OS !== 'web' && !!NativeModules.TrackPlayerModule;

const getNativeTrackPlayer = (): TrackPlayerModule => {
    if (Platform.OS === 'web') {
        throw new Error('TrackPlayer is not available on web.');
    }
    if (!nativeTrackPlayerModule) {
        nativeTrackPlayerModule = require('react-native-track-player') as TrackPlayerModule;
    }
    return nativeTrackPlayerModule;
};

export const DEFAULT_ITEMS: MediaItem[] = [
    {
        id: 'eurodance-90s',
        type: 'radio',
        title: 'Eurodance 90s',
        artist: 'Alemanha • Treino Dance 24/7',
        genre: 'Eurodance',
        logo: `${MUSIKA_BASE_URL}/images/external-radios/eurodance-90s-official.png`,
        audioUrl: 'https://stream-90s.bdjradio.com/',
        badge: 'TREINO DANCE',
    },
    {
        id: 'radio-rock-89',
        type: 'radio',
        title: '89 FM A Rádio Rock',
        artist: 'São Paulo • Rock & Alternativo',
        genre: 'Rock',
        logo: `${MUSIKA_BASE_URL}/images/external-radios/89-a-radio-rock-official.png`,
        audioUrl: 'https://playerservices.streamtheworld.com/api/livestream-redirect/RADIO_89FM_ADP.aac?dist=site-89fm',
        badge: 'ROCK',
    },
    {
        id: 'radio-mix-fm',
        type: 'radio',
        title: 'Rádio Mix 106.3 FM',
        artist: 'São Paulo • Pop & Hits',
        genre: 'Pop',
        logo: `${MUSIKA_BASE_URL}/images/external-radios/mix-fm-official.png`,
        audioUrl: 'https://playerservices.streamtheworld.com/api/livestream-redirect/MIXFM_SAOPAULOAAC.aac',
        badge: 'POP & HITS',
    },
    {
        id: 'radio-mania',
        type: 'radio',
        title: 'Rádio Mania 103.3',
        artist: 'Rio de Janeiro • Pagode & Samba',
        genre: 'Pagode',
        logo: `${MUSIKA_BASE_URL}/images/external-radios/radio-mania-official.png`,
        audioUrl: 'https://stream.zeno.fm/cic1u0lbdo2uv',
        badge: 'PAGODE',
    },
];

export const filterSongsByStyle = (
    style: StyleCategory,
    songs: MediaItem[],
    radios: MediaItem[],
    userPlaylistItems: MediaItem[] = [],
    favoriteItems: MediaItem[] = []
): MediaItem[] => {
    if (style === 'radios') return radios;
    if (style === 'user_playlists') return userPlaylistItems;
    if (style === 'favorites') return favoriteItems;
    if (songs.length === 0) return radios;
    if (style === 'all') return songs;

    return songs.filter((song) => {
        const g = (song.genre || '').toLowerCase();

        if (style === 'dance') {
            return (
                g.includes('dance') ||
                g.includes('eurodance') ||
                g.includes('house') ||
                g.includes('techno') ||
                g.includes('eletrônica') ||
                g.includes('synth') ||
                g.includes('edm')
            );
        }
        if (style === 'rock') {
            return (
                g.includes('rock') ||
                g.includes('metal') ||
                g.includes('alternativ') ||
                g.includes('punk') ||
                g.includes('indie')
            );
        }
        if (style === 'hiphop') {
            return (
                g.includes('hip-hop') ||
                g.includes('rap') ||
                g.includes('trap') ||
                g.includes('r&b')
            );
        }
        if (style === 'flashback') {
            return (
                g.includes('flashback') ||
                g.includes('soul') ||
                g.includes('freestyle') ||
                g.includes('2000') ||
                g.includes('90s') ||
                g.includes('80s') ||
                g.includes('romântico')
            );
        }
        if (style === 'mpb_pop') {
            return (
                g.includes('mpb') ||
                (g.includes('pop') && !g.includes('synth-pop')) ||
                g.includes('reggae') ||
                g.includes('bossa')
            );
        }
        if (style === 'gospel') {
            return (
                g.includes('gospel') ||
                g.includes('louvor') ||
                g.includes('adoração') ||
                g.includes('cristã')
            );
        }
        if (style === 'funk_pagode') {
            return (
                g.includes('funk') ||
                g.includes('pagode') ||
                g.includes('piseiro') ||
                g.includes('axé') ||
                g.includes('forró') ||
                g.includes('samba')
            );
        }
        if (style === 'sertanejo') {
            return (
                g.includes('sertanejo') ||
                g.includes('arrocha') ||
                g.includes('modão') ||
                g.includes('country')
            );
        }
        return true;
    });
};

interface MusicPlayerContextType {
    selectedStyle: StyleCategory;
    setSelectedStyle: (style: StyleCategory) => void;
    allSongs: MediaItem[];
    allRadios: MediaItem[];
    filteredItems: MediaItem[];
    currentItem: MediaItem;
    isPlaying: boolean;
    isBuffering: boolean;
    togglePlay: () => Promise<void>;
    nextTrack: () => Promise<void>;
    prevTrack: () => Promise<void>;
    selectTrack: (item: MediaItem) => Promise<void>;
    openMusikaApp: () => Promise<void>;

    // MusiKA User & Playlists Integration
    musikaUser: MusikaUser | null;
    isMusikaLoggedIn: boolean;
    userPlaylists: MusikaPlaylist[];
    selectedPlaylistId: string | null;
    setSelectedPlaylistId: (id: string | null) => void;
    favoriteSongIds: string[];
    isFavorite: (songId: string) => boolean;
    toggleFavorite: (songId: string) => Promise<void>;
    loginMusika: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
    loginMusikaWithGoogle: () => Promise<{ success: boolean; error?: string }>;
    connectMusikaWithGoogleProfile: (googleUser: { name?: string; email: string; avatar?: string }) => Promise<{ success: boolean; error?: string }>;
    logoutMusika: () => Promise<void>;
    refreshMusikaData: () => Promise<void>;
    isAuthModalOpen: boolean;
    setIsAuthModalOpen: (open: boolean) => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | null>(null);

export function MusicPlayerProvider({ children }: { children: React.ReactNode }) {
    const [selectedStyle, setSelectedStyle] = useState<StyleCategory>('dance');
    const [allSongs, setAllSongs] = useState<MediaItem[]>([]);
    const [allRadios, setAllRadios] = useState<MediaItem[]>(DEFAULT_ITEMS);

    const [currentItem, setCurrentItem] = useState<MediaItem>(DEFAULT_ITEMS[0]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);

    // MusiKA User State
    const [musikaUser, setMusikaUser] = useState<MusikaUser | null>(null);
    const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
    const [favoriteSongIds, setFavoriteSongIds] = useState<string[]>([]);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    const soundRef = useRef<Audio.Sound | null>(null);
    const playRequestIdRef = useRef(0);
    const currentItemRef = useRef<MediaItem>(DEFAULT_ITEMS[0]);
    const activeQueueRef = useRef<MediaItem[]>(DEFAULT_ITEMS);
    const isPlayingRef = useRef(false);
    const playHistoryRef = useRef<string[]>([]);
    const playerSetupPromiseRef = useRef<Promise<void> | null>(null);
    const nativeEventSubscriptionsRef = useRef<Array<{ remove: () => void }>>([]);

    useEffect(() => {
        currentItemRef.current = currentItem;
    }, [currentItem]);

    useEffect(() => {
        isPlayingRef.current = isPlaying;
    }, [isPlaying]);

    // Convert Musika User playlists to MediaItem list
    const userPlaylists: MusikaPlaylist[] = useMemo(() => {
        return musikaUser?.playlists || [];
    }, [musikaUser?.playlists]);

    const activeUserPlaylistTracks = useMemo<MediaItem[]>(() => {
        if (!userPlaylists.length) return [];

        if (selectedPlaylistId) {
            const pl = userPlaylists.find((p) => (p.id || p._id) === selectedPlaylistId);
            if (pl && Array.isArray(pl.tracks)) {
                return pl.tracks.map((t) => ({
                    id: t.id || t._id || `track-${Math.random()}`,
                    type: 'song',
                    title: t.title || 'Música',
                    artist: t.artist || t.artists?.join(', ') || 'MusiKA',
                    genre: t.genre || t.genres?.join(', ') || pl.name,
                    logo: formatMusikaMediaUrl(t.cover320 || t.coverUrl || pl.coverUrl),
                    audioUrl: t.audioUrl || `${MUSIKA_BASE_URL}/api/oci/audio/${t.id || t._id}?redirect=1`,
                    badge: pl.name.toUpperCase(),
                    playlistName: pl.name,
                }));
            }
        }

        // Return all tracks across all user playlists
        const combined: MediaItem[] = [];
        userPlaylists.forEach((pl) => {
            if (Array.isArray(pl.tracks)) {
                pl.tracks.forEach((t) => {
                    combined.push({
                        id: t.id || t._id || `track-${Math.random()}`,
                        type: 'song',
                        title: t.title || 'Música',
                        artist: t.artist || t.artists?.join(', ') || 'MusiKA',
                        genre: t.genre || t.genres?.join(', ') || pl.name,
                        logo: formatMusikaMediaUrl(t.cover320 || t.coverUrl || pl.coverUrl),
                        audioUrl: t.audioUrl || `${MUSIKA_BASE_URL}/api/oci/audio/${t.id || t._id}?redirect=1`,
                        badge: pl.name.toUpperCase(),
                        playlistName: pl.name,
                    });
                });
            }
        });
        return combined;
    }, [userPlaylists, selectedPlaylistId]);

    const favoriteTracks = useMemo<MediaItem[]>(() => {
        if (!favoriteSongIds.length || !allSongs.length) return [];
        const favSet = new Set(favoriteSongIds);
        return allSongs.filter((s) => favSet.has(s.id) || favSet.has(s.id.replace(/^song-/, '')));
    }, [favoriteSongIds, allSongs]);

    // Match songs to chosen style
    const filteredItems = useMemo(() => {
        return filterSongsByStyle(selectedStyle, allSongs, allRadios, activeUserPlaylistTracks, favoriteTracks);
    }, [selectedStyle, allSongs, allRadios, activeUserPlaylistTracks, favoriteTracks]);

    useEffect(() => {
        activeQueueRef.current = filteredItems.length > 0 ? filteredItems : (allSongs.length > 0 ? allSongs : allRadios);
    }, [filteredItems, allSongs, allRadios]);

    // Helper: Pick a random item from a list (preferring ones not equal to current)
    const getRandomItem = (items: MediaItem[], excludeId?: string): MediaItem | null => {
        if (!items || items.length === 0) return null;
        if (items.length === 1) return items[0];

        const candidates = excludeId ? items.filter((i) => i.id !== excludeId) : items;
        const pool = candidates.length > 0 ? candidates : items;
        const randomIndex = Math.floor(Math.random() * pool.length);
        return pool[randomIndex];
    };

    // When clicking a style, select and play a track from that style
    const handleSetStyle = (style: StyleCategory) => {
        setSelectedStyle(style);
        const styleItems = filterSongsByStyle(style, allSongs, allRadios, activeUserPlaylistTracks, favoriteTracks);
        if (styleItems.length > 0) {
            const randomTrack = getRandomItem(styleItems) || styleItems[0];
            setCurrentItem(randomTrack);
            if (isPlayingRef.current) {
                playMedia(randomTrack);
            }
        }
    };

    const ensureNativePlayer = async () => {
        if (Platform.OS === 'web') return;

        if (!playerSetupPromiseRef.current) {
            playerSetupPromiseRef.current = (async () => {
                const playerModule = getNativeTrackPlayer();
                const TrackPlayer = playerModule.default;
                try {
                    await TrackPlayer.setupPlayer();
                } catch (error: any) {
                    // setupPlayer is intentionally idempotent for this provider. Track Player
                    // rejects when another mounted provider has already initialized it.
                    if (!String(error?.message || error).toLowerCase().includes('already')) {
                        throw error;
                    }
                }

                await TrackPlayer.updateOptions({
                    android: {
                        appKilledPlaybackBehavior: playerModule.AppKilledPlaybackBehavior.ContinuePlayback,
                    },
                    capabilities: [
                        playerModule.Capability.Play,
                        playerModule.Capability.Pause,
                        playerModule.Capability.SkipToNext,
                        playerModule.Capability.SkipToPrevious,
                        playerModule.Capability.Stop,
                    ],
                    compactCapabilities: [
                        playerModule.Capability.Play,
                        playerModule.Capability.Pause,
                        playerModule.Capability.SkipToNext,
                    ],
                    progressUpdateEventInterval: 1,
                });
                await TrackPlayer.setRepeatMode(playerModule.RepeatMode.Queue);

                if (nativeEventSubscriptionsRef.current.length === 0) {
                    nativeEventSubscriptionsRef.current = [
                        TrackPlayer.addEventListener(playerModule.Event.PlaybackActiveTrackChanged, (event: any) => {
                            const trackId = event?.track?.id;
                            if (!trackId) return;
                            const queue = activeQueueRef.current;
                            const matchingItem = queue.find((queueItem) => queueItem.id === trackId);
                            if (matchingItem) {
                                setCurrentItem(matchingItem);
                                playHistoryRef.current = [
                                    matchingItem.id,
                                    ...playHistoryRef.current.filter((id) => id !== matchingItem.id),
                                ].slice(0, 50);
                            }
                        }),
                        TrackPlayer.addEventListener(playerModule.Event.PlaybackState, (event: any) => {
                            setIsPlaying(event.state === playerModule.State.Playing);
                            setIsBuffering(
                                event.state === playerModule.State.Buffering ||
                                event.state === playerModule.State.Loading
                            );
                        }),
                    ];
                }
            })().catch((error) => {
                playerSetupPromiseRef.current = null;
                throw error;
            });
        }

        await playerSetupPromiseRef.current;
    };

    // Configure only the web engine eagerly. Native TrackPlayer must be set up
    // on demand, after the user starts playback, so authentication/startup is
    // never blocked by a foreground media service.
    const configureAudioMode = async () => {
        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                staysActiveInBackground: true,
                playsInSilentModeIOS: true,
                shouldDuckAndroid: true,
                interruptionModeIOS: 1,
                interruptionModeAndroid: 2,
                playThroughEarpieceAndroid: false,
            });
        } catch (err) {
            console.log('Audio mode config error:', err);
        }
    };

    useEffect(() => {
        configureAudioMode();
        return () => {
            nativeEventSubscriptionsRef.current.forEach((subscription) => subscription.remove());
            nativeEventSubscriptionsRef.current = [];
        };
    }, []);

    // Load initial stored user session & local favorites with real-time MusiKA sync
    useEffect(() => {
        let isMounted = true;
        const initUserSession = async () => {
            const stored = await musikaService.getStoredSession();
            if (stored && isMounted) {
                setMusikaUser(stored);
                if (Array.isArray(stored.favorites)) {
                    setFavoriteSongIds(stored.favorites);
                }

                // Silently re-sync with MusiKA server to fetch latest playlists & favorites
                if (stored.email) {
                    musikaService.fetchUserProfile(stored.email).then(async (fresh) => {
                        if (fresh && isMounted) {
                            const merged: MusikaUser = {
                                ...stored,
                                ...fresh,
                                playlists: Array.isArray(fresh.playlists) ? fresh.playlists : stored.playlists || [],
                                favorites: Array.isArray(fresh.favorites) ? fresh.favorites : stored.favorites || [],
                            };
                            setMusikaUser(merged);
                            if (Array.isArray(fresh.favorites)) {
                                setFavoriteSongIds(fresh.favorites);
                            }
                            await musikaService.saveSession(merged);
                        }
                    });
                }
            } else if (isMounted) {
                const localFavs = await musikaService.getLocalFavorites();
                setFavoriteSongIds(localFavs);
            }
        };
        initUserSession();
        return () => {
            isMounted = false;
        };
    }, []);

    // Load full MusiKA catalog & live stations
    useEffect(() => {
        let isMounted = true;

        const loadMedia = async () => {
            try {
                const [songsData, stationsData] = await Promise.allSettled([
                    musikaService.fetchSongs(),
                    musikaService.fetchStations(),
                ]);

                const loadedSongs: MediaItem[] = [];
                const loadedStations: MediaItem[] = [];

                if (songsData.status === 'fulfilled' && songsData.value?.length > 0) {
                    songsData.value.forEach((s) => {
                        const artistName = s.artist || s.artists?.join(', ') || 'MusiKA';
                        const coverImg = formatMusikaMediaUrl(s.cover320 || s.cover160 || s.coverUrl);
                        const songAudio = s.audioUrl || `${MUSIKA_BASE_URL}/api/oci/audio/${s.id || s._id}?redirect=1`;
                        const mainGenre = s.genre || (Array.isArray(s.genres) ? s.genres.join(', ') : 'Música');

                        loadedSongs.push({
                            id: `song-${s.id || s._id}`,
                            type: 'song',
                            title: s.title || 'Música',
                            artist: artistName,
                            genre: mainGenre,
                            logo: coverImg,
                            audioUrl: songAudio,
                            badge: mainGenre ? mainGenre.split(',')[0].trim().toUpperCase() : 'MÚSICA',
                        });
                    });
                }

                if (stationsData.status === 'fulfilled' && stationsData.value?.length > 0) {
                    stationsData.value.forEach((st) => {
                        const tagsText = Array.isArray(st.tags)
                            ? st.tags.join(', ')
                            : Array.isArray(st.genre)
                            ? st.genre.join(', ')
                            : st.tags || st.genre || 'Rádio';

                        loadedStations.push({
                            id: `radio-${st.id}`,
                            type: 'radio',
                            title: st.name,
                            artist: `${st.state || 'Brasil'} • Rádio Ao Vivo`,
                            genre: tagsText,
                            logo: formatMusikaMediaUrl(st.logo || st.artwork),
                            audioUrl: st.streamUrl || st.tracks?.[0]?.audioUrl,
                            badge: 'RÁDIO AO VIVO',
                        });
                    });
                }

                if (isMounted) {
                    if (loadedSongs.length > 0) setAllSongs(loadedSongs);
                    if (loadedStations.length > 0) setAllRadios(loadedStations);

                    // Pick random initial track from Dance / Workout style to start with energy
                    if (!isPlayingRef.current && !soundRef.current && loadedSongs.length > 0) {
                        const danceTracks = filterSongsByStyle('dance', loadedSongs, loadedStations);
                        const initialTrack = getRandomItem(danceTracks) || getRandomItem(loadedSongs) || loadedSongs[0];
                        setCurrentItem(initialTrack);
                    }
                }
            } catch (err) {
                console.log('MusiKA load error:', err);
            }
        };

        loadMedia();

        return () => {
            isMounted = false;
        };
    }, []);

    const enforceExclusiveAudioFocus = async () => {
        try {
            if (Platform.OS === 'web') {
                await Audio.setAudioModeAsync({ staysActiveInBackground: true });
            }
        } catch {}
    };

    const isTransitioningRef = useRef(false);

    const nextTrackRef = useRef<() => Promise<void>>(async () => {});

    const nextTrack = async () => {
        if (USE_NATIVE_TRACK_PLAYER && Platform.OS !== 'web') {
            try {
                await ensureNativePlayer();
                const TrackPlayer = getNativeTrackPlayer().default;
                await TrackPlayer.skipToNext();
                await TrackPlayer.play();
                return;
            } catch (error) {
                console.log('Native next track error:', error);
            }
        }

        const queue = activeQueueRef.current.length > 0 ? activeQueueRef.current : (allSongs.length > 0 ? allSongs : allRadios);
        const nextItem = getRandomItem(queue, currentItemRef.current?.id) || queue[0];
        if (nextItem) {
            await playMedia(nextItem);
        }
    };

    useEffect(() => {
        nextTrackRef.current = nextTrack;
    });

    const playMedia = async (item: MediaItem) => {
        if (!item?.audioUrl) return;

        const requestId = ++playRequestIdRef.current;
        setCurrentItem(item);
        setIsBuffering(true);

        if (item.id) {
            playHistoryRef.current = [item.id, ...playHistoryRef.current.filter((id) => id !== item.id)].slice(0, 50);
        }

        if (USE_NATIVE_TRACK_PLAYER && Platform.OS !== 'web') {
            try {
                await ensureNativePlayer();
                const playerModule = getNativeTrackPlayer();
                const TrackPlayer = playerModule.default;

                const sourceQueue = activeQueueRef.current.length > 0
                    ? activeQueueRef.current
                    : (allSongs.length > 0 ? allSongs : allRadios);
                const playableQueue = sourceQueue.filter((queueItem) => !!queueItem.audioUrl);
                const selectedIndex = playableQueue.findIndex((queueItem) => queueItem.id === item.id);
                const orderedQueue = selectedIndex >= 0
                    ? [...playableQueue.slice(selectedIndex), ...playableQueue.slice(0, selectedIndex)]
                    : [item, ...playableQueue.filter((queueItem) => queueItem.id !== item.id)];

                await TrackPlayer.reset();
                await TrackPlayer.add(orderedQueue.map((queueItem) => ({
                    id: queueItem.id,
                    url: queueItem.audioUrl!,
                    title: queueItem.title,
                    artist: queueItem.artist,
                    artwork: queueItem.logo,
                    genre: queueItem.genre,
                })));
                await TrackPlayer.setRepeatMode(playerModule.RepeatMode.Queue);
                await TrackPlayer.play();
                setIsPlaying(true);
                setIsBuffering(false);
            } catch (error) {
                console.log('Native playback error:', error);
                setIsPlaying(false);
                setIsBuffering(false);
            }
            return;
        }

        await enforceExclusiveAudioFocus();

        if (soundRef.current) {
            const oldSound = soundRef.current;
            soundRef.current = null;
            try {
                await oldSound.stopAsync();
                await oldSound.unloadAsync();
            } catch {}
        }

        try {
            const { sound } = await Audio.Sound.createAsync(
                { uri: item.audioUrl },
                {
                    shouldPlay: true,
                    isLooping: false,
                    progressUpdateIntervalMillis: 1000,
                },
                (status: any) => {
                    if (status.isLoaded) {
                        setIsPlaying(status.isPlaying);
                        if (status.isPlaying) {
                            setIsBuffering(false);
                        }
                        if (status.didJustFinish && !isTransitioningRef.current) {
                            isTransitioningRef.current = true;
                            nextTrackRef.current().finally(() => {
                                setTimeout(() => {
                                    isTransitioningRef.current = false;
                                }, 800);
                            });
                        }
                    }
                }
            );

            if (requestId !== playRequestIdRef.current) {
                try {
                    await sound.stopAsync();
                    await sound.unloadAsync();
                } catch {}
                return;
            }

            soundRef.current = sound;
            setIsPlaying(true);
            setIsBuffering(false);
        } catch (error) {
            console.log('Playback error:', error);
            if (requestId === playRequestIdRef.current) {
                setIsBuffering(false);
                setIsPlaying(false);
                setTimeout(() => {
                    if (isPlayingRef.current) {
                        nextTrackRef.current();
                    }
                }, 1500);
            }
        }
    };

    const togglePlay = async () => {
        try {
            if (USE_NATIVE_TRACK_PLAYER && Platform.OS !== 'web') {
                await ensureNativePlayer();
                const playerModule = getNativeTrackPlayer();
                const TrackPlayer = playerModule.default;
                const playbackState = await TrackPlayer.getPlaybackState();
                if (playbackState.state === playerModule.State.Playing) {
                    await TrackPlayer.pause();
                } else {
                    const queue = await TrackPlayer.getQueue();
                    if (queue.length === 0) {
                        const trackToPlay = currentItemRef.current || getRandomItem(activeQueueRef.current) || DEFAULT_ITEMS[0];
                        await playMedia(trackToPlay);
                    } else {
                        await TrackPlayer.play();
                    }
                }
                return;
            }

            if (isPlaying && soundRef.current) {
                await soundRef.current.pauseAsync();
                setIsPlaying(false);
                setIsBuffering(false);
                return;
            }

            if (soundRef.current) {
                await enforceExclusiveAudioFocus();
                await soundRef.current.playAsync();
                setIsPlaying(true);
                return;
            }

            const trackToPlay = currentItemRef.current || getRandomItem(activeQueueRef.current) || DEFAULT_ITEMS[0];
            await playMedia(trackToPlay);
        } catch (error) {
            console.log('Toggle error:', error);
            const trackToPlay = currentItemRef.current || getRandomItem(activeQueueRef.current) || DEFAULT_ITEMS[0];
            await playMedia(trackToPlay);
        }
    };

    const prevTrack = async () => {
        if (USE_NATIVE_TRACK_PLAYER && Platform.OS !== 'web') {
            try {
                await ensureNativePlayer();
                const TrackPlayer = getNativeTrackPlayer().default;
                await TrackPlayer.skipToPrevious();
                await TrackPlayer.play();
                return;
            } catch (error) {
                console.log('Native previous track error:', error);
            }
        }

        const queue = activeQueueRef.current.length > 0 ? activeQueueRef.current : (allSongs.length > 0 ? allSongs : allRadios);
        const history = playHistoryRef.current;
        const currentId = currentItemRef.current?.id;

        const currentHistIdx = history.indexOf(currentId || '');
        if (currentHistIdx >= 0 && currentHistIdx + 1 < history.length) {
            const prevId = history[currentHistIdx + 1];
            const prevItem = queue.find((i) => i.id === prevId);
            if (prevItem) {
                await playMedia(prevItem);
                return;
            }
        }

        const randomPrev = getRandomItem(queue, currentId) || queue[0];
        if (randomPrev) {
            await playMedia(randomPrev);
        }
    };

    const selectTrack = async (item: MediaItem) => {
        await playMedia(item);
    };

    const isFavorite = (songId: string): boolean => {
        const cleanId = songId.replace(/^song-/, '');
        return favoriteSongIds.includes(songId) || favoriteSongIds.includes(cleanId);
    };

    const toggleFavorite = async (songId: string) => {
        const cleanId = songId.replace(/^song-/, '');
        let newFavs: string[];
        if (isFavorite(songId)) {
            newFavs = favoriteSongIds.filter((id) => id !== songId && id !== cleanId);
        } else {
            newFavs = [...favoriteSongIds, cleanId];
        }
        setFavoriteSongIds(newFavs);

        if (musikaUser) {
            const updatedUser = { ...musikaUser, favorites: newFavs };
            setMusikaUser(updatedUser);
            await musikaService.saveSession(updatedUser);
            musikaService.syncData({ favorites: newFavs });
        } else {
            await musikaService.saveLocalFavorites(newFavs);
        }
    };

    const loginMusika = async (email: string, pass: string) => {
        const res = await musikaService.login(email, pass);
        if (res.success && res.user) {
            setMusikaUser(res.user);
            if (Array.isArray(res.user.favorites)) {
                setFavoriteSongIds(res.user.favorites);
            }
            return { success: true };
        }
        return { success: false, error: res.error || 'Falha ao autenticar no MusiKA.' };
    };

    const loginMusikaWithGoogle = async () => {
        const res = await musikaService.loginWithGoogle();
        if (res.success && res.user) {
            setMusikaUser(res.user);
            if (Array.isArray(res.user.favorites)) {
                setFavoriteSongIds(res.user.favorites);
            }
            return { success: true };
        }
        return { success: false, error: res.error || 'Não foi possível conectar com o Google.' };
    };

    const connectMusikaWithGoogleProfile = async (googleUser: { name?: string; email: string; avatar?: string }) => {
        const res = await musikaService.connectWithGoogleProfile(googleUser);
        if (res.success && res.user) {
            setMusikaUser(res.user);
            return { success: true };
        }
        return { success: false, error: res.error || 'Falha ao vincular perfil Google.' };
    };

    const logoutMusika = async () => {
        await musikaService.clearSession();
        setMusikaUser(null);
        setSelectedPlaylistId(null);
        const localFavs = await musikaService.getLocalFavorites();
        setFavoriteSongIds(localFavs);
    };

    const refreshMusikaData = async () => {
        if (!musikaUser?.email) return;
        try {
            const fresh = await musikaService.fetchUserProfile(musikaUser.email);
            if (fresh) {
                const merged: MusikaUser = {
                    ...musikaUser,
                    ...fresh,
                    playlists: Array.isArray(fresh.playlists) ? fresh.playlists : musikaUser.playlists || [],
                    favorites: Array.isArray(fresh.favorites) ? fresh.favorites : musikaUser.favorites || [],
                };
                setMusikaUser(merged);
                if (Array.isArray(fresh.favorites)) {
                    setFavoriteSongIds(fresh.favorites);
                }
                await musikaService.saveSession(merged);
            }
        } catch (e) {
            console.error('Error in refreshMusikaData:', e);
        }
    };

    const openMusikaApp = async () => {
        if (USE_NATIVE_TRACK_PLAYER && Platform.OS !== 'web') {
            try {
                const TrackPlayer = getNativeTrackPlayer().default;
                await TrackPlayer.pause();
            } catch {}
        }
        if (soundRef.current && isPlaying) {
            try {
                await soundRef.current.pauseAsync();
                setIsPlaying(false);
            } catch {}
        }

        const candidateUris = Platform.OS === 'android'
            ? [
                'musika://auth',
                'musika://',
                'musika://open',
                'intent:#Intent;component=com.musika.app/.MainActivity;end',
                'intent:#Intent;package=com.musika.app;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end',
            ]
            : ['musika://auth', 'musika://', 'musika://open'];

        for (const uri of candidateUris) {
            try {
                const canOpen = await Linking.canOpenURL(uri).catch(() => false);
                if (canOpen) {
                    await Linking.openURL(uri);
                    return;
                }
            } catch {}
        }

        // Fallback: Abre diretamente no PWA/Web de forma suave
        try {
            const canOpenWeb = await Linking.canOpenURL(MUSIKA_BASE_URL).catch(() => false);
            if (canOpenWeb) {
                await Linking.openURL(MUSIKA_BASE_URL);
            } else {
                await WebBrowser.openBrowserAsync(MUSIKA_BASE_URL);
            }
        } catch {
            await WebBrowser.openBrowserAsync(MUSIKA_BASE_URL);
        }
    };

    return (
        <MusicPlayerContext.Provider
            value={{
                selectedStyle,
                setSelectedStyle: handleSetStyle,
                allSongs,
                allRadios,
                filteredItems,
                currentItem,
                isPlaying,
                isBuffering,
                togglePlay,
                nextTrack,
                prevTrack,
                selectTrack,
                openMusikaApp,
                musikaUser,
                isMusikaLoggedIn: !!musikaUser,
                userPlaylists,
                selectedPlaylistId,
                setSelectedPlaylistId,
                favoriteSongIds,
                isFavorite,
                toggleFavorite,
                loginMusika,
                loginMusikaWithGoogle,
                connectMusikaWithGoogleProfile,
                logoutMusika,
                refreshMusikaData,
                isAuthModalOpen,
                setIsAuthModalOpen,
            }}
        >
            {children}
        </MusicPlayerContext.Provider>
    );
}

export function useMusicPlayer() {
    const context = useContext(MusicPlayerContext);
    if (!context) {
        throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
    }
    return context;
}
