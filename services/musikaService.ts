import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';

export const MUSIKA_BASE_URL = 'https://somretro-theta.vercel.app';
export const MUSIKA_PACKAGE_NAME = 'com.musika.app';
export const MUSIKA_APK_DOWNLOAD_URL = `${MUSIKA_BASE_URL}/musika.apk`;
export const MUSIKA_API_SONGS = `${MUSIKA_BASE_URL}/api/oci/songs`;
export const MUSIKA_API_STATIONS = `${MUSIKA_BASE_URL}/api/radio/stations`;

const MUSIKA_SESSION_STORAGE_KEY = '@musika_user_session';
const MUSIKA_FAVORITES_STORAGE_KEY = '@musika_local_favorites';

export interface MusikaTrack {
    id: string;
    _id?: string;
    title: string;
    artist: string;
    artists?: string[];
    genre?: string;
    genres?: string[];
    album?: string;
    audioUrl?: string;
    coverUrl?: string;
    cover320?: string;
    cover160?: string;
    cover96?: string;
    playCount?: number;
}

export interface MusikaPlaylist {
    id: string;
    _id?: string;
    name: string;
    description?: string;
    coverUrl?: string;
    tracks: MusikaTrack[];
    createdAt?: string;
    updatedAt?: string;
}

export interface MusikaUser {
    id?: string;
    _id?: string;
    name: string;
    email: string;
    role?: string;
    avatar?: string;
    image?: string;
    playlists?: MusikaPlaylist[];
    favorites?: string[];
}

export interface MusikaStation {
    id: string;
    name: string;
    tags?: string | string[];
    genre?: string | string[];
    state?: string;
    logo?: string;
    artwork?: string;
    streamUrl?: string;
    tracks?: Array<{ audioUrl?: string }>;
}

export const formatMusikaMediaUrl = (url?: string): string | undefined => {
    if (!url) return undefined;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/')) return `${MUSIKA_BASE_URL}${url}`;
    return `${MUSIKA_BASE_URL}/${url}`;
};

export const musikaService = {
    // 1. Get stored user session
    async getStoredSession(): Promise<MusikaUser | null> {
        try {
            const raw = await AsyncStorage.getItem(MUSIKA_SESSION_STORAGE_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) {
            console.error('Error reading MusiKA session:', e);
            return null;
        }
    },

    // 2. Save user session locally
    async saveSession(user: MusikaUser): Promise<void> {
        try {
            await AsyncStorage.setItem(MUSIKA_SESSION_STORAGE_KEY, JSON.stringify(user));
        } catch (e) {
            console.error('Error saving MusiKA session:', e);
        }
    },

    // 3. Clear session
    async clearSession(): Promise<void> {
        try {
            await AsyncStorage.removeItem(MUSIKA_SESSION_STORAGE_KEY);
            await fetch(`${MUSIKA_BASE_URL}/api/auth/logout`, { method: 'POST' }).catch(() => {});
        } catch (e) {
            console.error('Error clearing MusiKA session:', e);
        }
    },

    // 4. Fetch real-time user profile with playlists and favorites from MusiKA DB
    async fetchUserProfile(email: string): Promise<MusikaUser | null> {
        try {
            const res = await fetch(`${MUSIKA_BASE_URL}/api/auth/profile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim().toLowerCase() }),
            });
            if (!res.ok) return null;
            const data = await res.json();
            if (data.success && data.user) {
                return data.user;
            }
            return null;
        } catch (e) {
            console.error('Error fetching MusiKA user profile:', e);
            return null;
        }
    },

    // 5. Authenticate via Email + Password
    async login(email: string, password: string): Promise<{ success: boolean; user?: MusikaUser; error?: string }> {
        try {
            const res = await fetch(`${MUSIKA_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
            });

            const data = await res.json();
            if (!res.ok) {
                return { success: false, error: data.error || 'Credenciais inválidas. Tente novamente.' };
            }

            if (data.user) {
                const userObj: MusikaUser = {
                    id: data.user.id || data.user._id,
                    name: data.user.name,
                    email: data.user.email,
                    avatar: data.user.image || data.user.avatar,
                    playlists: Array.isArray(data.user.playlists) ? data.user.playlists : [],
                    favorites: Array.isArray(data.user.favorites) ? data.user.favorites : [],
                };
                await this.saveSession(userObj);
                return { success: true, user: userObj };
            }

            return { success: false, error: 'Resposta inesperada do servidor MusiKA.' };
        } catch (e: any) {
            return { success: false, error: e?.message || 'Falha de conexão com o servidor MusiKA.' };
        }
    },

    // 6. Register new account
    async register(name: string, email: string, password: string): Promise<{ success: boolean; user?: MusikaUser; error?: string }> {
        try {
            const res = await fetch(`${MUSIKA_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password }),
            });

            const data = await res.json();
            if (!res.ok) {
                return { success: false, error: data.error || 'Não foi possível criar a conta. Tente novamente.' };
            }

            if (data.user) {
                const userObj: MusikaUser = {
                    id: data.user.id || data.user._id,
                    name: data.user.name,
                    email: data.user.email,
                    avatar: data.user.image || data.user.avatar,
                    playlists: Array.isArray(data.user.playlists) ? data.user.playlists : [],
                    favorites: Array.isArray(data.user.favorites) ? data.user.favorites : [],
                };
                await this.saveSession(userObj);
                return { success: true, user: userObj };
            }

            return { success: false, error: 'Resposta inesperada do servidor MusiKA.' };
        } catch (e: any) {
            return { success: false, error: e?.message || 'Falha de conexão com o servidor MusiKA.' };
        }
    },

    // 7. Authenticate via Google OAuth or Web Session
    async loginWithGoogle(): Promise<{ success: boolean; user?: MusikaUser; error?: string }> {
        try {
            const googleAuthUrl = `${MUSIKA_BASE_URL}/api/auth/google`;
            const callbackUrl = 'strive-fitness-br://auth/callback';

            await WebBrowser.openAuthSessionAsync(googleAuthUrl, callbackUrl);

            // Fetch session status from MusiKA
            const sessRes = await fetch(`${MUSIKA_BASE_URL}/api/auth/session`, {
                headers: { 'Cache-Control': 'no-cache' },
            }).catch(() => null);

            if (sessRes && sessRes.ok) {
                const sessData = await sessRes.json();
                if (sessData.authenticated && sessData.user) {
                    const userObj: MusikaUser = {
                        id: sessData.user.id || sessData.user._id,
                        name: sessData.user.name,
                        email: sessData.user.email,
                        avatar: sessData.user.image || sessData.user.avatar,
                        playlists: Array.isArray(sessData.user.playlists) ? sessData.user.playlists : [],
                        favorites: Array.isArray(sessData.user.favorites) ? sessData.user.favorites : [],
                    };
                    await this.saveSession(userObj);
                    return { success: true, user: userObj };
                }
            }

            return {
                success: false,
                error: 'Login com Google concluído na web. Sincronize suas playlists agora.',
            };
        } catch (e: any) {
            return { success: false, error: e?.message || 'Falha ao autenticar com Google.' };
        }
    },

    // 8. Direct 1-Tap Google Account Linking (fetches real user profile from MusiKA DB)
    async connectWithGoogleProfile(googleUser: { name?: string; email: string; avatar?: string }): Promise<{ success: boolean; user?: MusikaUser; error?: string }> {
        try {
            // First check if profile already exists on MusiKA MongoDB
            const profile = await this.fetchUserProfile(googleUser.email);

            const userObj: MusikaUser = {
                id: profile?.id || profile?._id,
                name: profile?.name || googleUser.name || googleUser.email.split('@')[0],
                email: googleUser.email,
                avatar: profile?.avatar || profile?.image || googleUser.avatar,
                playlists: Array.isArray(profile?.playlists) ? profile.playlists : [],
                favorites: Array.isArray(profile?.favorites) ? profile.favorites : [],
            };

            await this.saveSession(userObj);
            return { success: true, user: userObj };
        } catch (e: any) {
            return { success: false, error: e?.message || 'Falha ao vincular conta Google.' };
        }
    },

    // 9. Fetch songs catalog from OCI storage
    async fetchSongs(): Promise<MusikaTrack[]> {
        try {
            const res = await fetch(MUSIKA_API_SONGS);
            if (!res.ok) return [];
            const data = await res.json();
            return Array.isArray(data.songs) ? data.songs : [];
        } catch (e) {
            console.error('Error fetching MusiKA songs:', e);
            return [];
        }
    },

    // 10. Fetch radio stations
    async fetchStations(): Promise<MusikaStation[]> {
        try {
            const res = await fetch(MUSIKA_API_STATIONS);
            if (!res.ok) return [];
            const data = await res.json();
            return Array.isArray(data.stations) ? data.stations : [];
        } catch (e) {
            console.error('Error fetching MusiKA radio stations:', e);
            return [];
        }
    },

    // 11. Sync favorites or custom playlists
    async syncData(payload: { playlists?: MusikaPlaylist[]; favorites?: string[] }): Promise<void> {
        try {
            await fetch(`${MUSIKA_BASE_URL}/api/auth/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
        } catch (e) {
            console.error('Error syncing MusiKA data:', e);
        }
    },

    // 12. Local favorites storage fallback
    async getLocalFavorites(): Promise<string[]> {
        try {
            const raw = await AsyncStorage.getItem(MUSIKA_FAVORITES_STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    },

    async saveLocalFavorites(favorites: string[]): Promise<void> {
        try {
            await AsyncStorage.setItem(MUSIKA_FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
        } catch (e) {
            console.error('Error saving local favorites:', e);
        }
    },
};
