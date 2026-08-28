import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Linking,
    Modal,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { FontFamily, Radius } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useMusicPlayer } from '../../context/MusicPlayerContext';
import { useTheme } from '../../context/ThemeContext';
import { MUSIKA_BASE_URL } from '../../services/musikaService';
import { useUserStore } from '../../store/useUserStore';

export function MusikaLoginModal() {
    const { theme } = useTheme();
    const { session } = useAuth();
    const { userName, profile } = useUserStore();

    const {
        isAuthModalOpen,
        setIsAuthModalOpen,
        musikaUser,
        isMusikaLoggedIn,
        loginMusika,
        loginMusikaWithGoogle,
        connectMusikaWithGoogleProfile,
        logoutMusika,
        refreshMusikaData,
        userPlaylists,
        favoriteSongIds,
        setSelectedStyle,
        setSelectedPlaylistId,
        openMusikaApp,
    } = useMusicPlayer();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [syncLoading, setSyncLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleSync = async () => {
        setSyncLoading(true);
        setErrorMessage(null);
        setSuccessMessage(null);
        try {
            await refreshMusikaData();
            setSuccessMessage('Playlists e favoritas atualizadas com sucesso!');
        } catch (e: any) {
            setErrorMessage('Não foi possível sincronizar no momento.');
        } finally {
            setSyncLoading(false);
        }
    };

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            setErrorMessage('Por favor, preencha o e-mail e a senha.');
            return;
        }

        setLoading(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        const res = await loginMusika(email, password);
        setLoading(false);

        if (res.success) {
            setSuccessMessage('Conta conectada com sucesso!');
            setEmail('');
            setPassword('');
            setTimeout(() => {
                setIsAuthModalOpen(false);
                setSelectedStyle('user_playlists');
            }, 1000);
        } else {
            setErrorMessage(res.error || 'E-mail ou senha incorretos.');
        }
    };

    const handleGoogleLogin = async () => {
        setGoogleLoading(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            // If user already has an active Google session in Strive, offer seamless connection
            if (session?.user?.email) {
                const res = await connectMusikaWithGoogleProfile({
                    name: userName || session.user.user_metadata?.full_name || session.user.email.split('@')[0],
                    email: session.user.email,
                    avatar: profile?.photoUri || session.user.user_metadata?.avatar_url,
                });

                if (res.success) {
                    setSuccessMessage('Conta Google conectada com sucesso!');
                    setTimeout(() => {
                        setIsAuthModalOpen(false);
                        setSelectedStyle('user_playlists');
                    }, 1000);
                    return;
                }
            }

            // Fallback: Open MusiKA Google OAuth in browser
            const res = await loginMusikaWithGoogle();
            if (res.success) {
                setSuccessMessage('Conta Google conectada com sucesso!');
                setTimeout(() => {
                    setIsAuthModalOpen(false);
                    setSelectedStyle('user_playlists');
                }, 1000);
            } else {
                setErrorMessage(res.error || 'Não foi possível completar o login com Google.');
            }
        } catch (e: any) {
            setErrorMessage(e?.message || 'Erro ao conectar com Google.');
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleLogout = async () => {
        await logoutMusika();
        setSuccessMessage(null);
        setErrorMessage(null);
    };

    const openMusikaWeb = () => {
        Linking.openURL(MUSIKA_BASE_URL).catch(async () => {
            await WebBrowser.openBrowserAsync(MUSIKA_BASE_URL);
        });
    };

    const openRegisterWeb = () => {
        const regUrl = `${MUSIKA_BASE_URL}/login?mode=register`;
        Linking.openURL(regUrl).catch(async () => {
            await WebBrowser.openBrowserAsync(regUrl);
        });
    };

    return (
        <Modal
            visible={isAuthModalOpen}
            animationType="slide"
            transparent
            onRequestClose={() => setIsAuthModalOpen(false)}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    justifyContent: 'flex-end',
                }}
            >
                <View
                    style={{
                        backgroundColor: theme.mode === 'dark' ? '#121620' : '#FFFFFF',
                        borderTopLeftRadius: Radius.xl,
                        borderTopRightRadius: Radius.xl,
                        maxHeight: '90%',
                        paddingBottom: Platform.OS === 'ios' ? 36 : 24,
                        borderWidth: 1,
                        borderColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                    }}
                >
                    {/* Header */}
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingHorizontal: 20,
                            paddingTop: 20,
                            paddingBottom: 14,
                            borderBottomWidth: 1,
                            borderBottomColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                        }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <View
                                style={{
                                    width: 38,
                                    height: 38,
                                    borderRadius: 12,
                                    backgroundColor: theme.colors.primary + '18',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Ionicons name="musical-notes" size={20} color={theme.colors.primary} />
                            </View>
                            <View>
                                <Text
                                    style={{
                                        color: theme.colors.text,
                                        fontSize: 16,
                                        fontFamily: FontFamily.sansBold,
                                    }}
                                >
                                    {isMusikaLoggedIn ? 'Minha Conta MusiKA' : 'Conectar ao MusiKA'}
                                </Text>
                                <Text
                                    style={{
                                        color: theme.colors.textMuted,
                                        fontSize: 12,
                                        fontFamily: FontFamily.sans,
                                    }}
                                >
                                    {isMusikaLoggedIn ? 'Sincronizado com o streaming' : 'Acesse suas playlists e favoritas'}
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={() => setIsAuthModalOpen(false)}
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: 16,
                                backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Ionicons name="close" size={18} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ padding: 20 }}
                    >
                        {isMusikaLoggedIn && musikaUser ? (
                            /* User Profile View */
                            <View style={{ gap: 16 }}>
                                {/* User Card */}
                                <View
                                    style={{
                                        backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
                                        borderRadius: Radius.lg,
                                        padding: 16,
                                        borderWidth: 1,
                                        borderColor: theme.colors.primary + '30',
                                        gap: 12,
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                        <View
                                            style={{
                                                width: 48,
                                                height: 48,
                                                borderRadius: 24,
                                                backgroundColor: theme.colors.primary,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    color: '#000000',
                                                    fontSize: 18,
                                                    fontFamily: FontFamily.sansBold,
                                                }}
                                            >
                                                {musikaUser.name?.charAt(0).toUpperCase() || 'U'}
                                            </Text>
                                        </View>
                                        <View style={{ flex: 1, minWidth: 0 }}>
                                            <Text
                                                numberOfLines={1}
                                                style={{
                                                    color: theme.colors.text,
                                                    fontSize: 16,
                                                    fontFamily: FontFamily.sansBold,
                                                }}
                                            >
                                                {musikaUser.name}
                                            </Text>
                                            <Text
                                                numberOfLines={1}
                                                ellipsizeMode="tail"
                                                style={{
                                                    color: theme.colors.textMuted,
                                                    fontSize: 13,
                                                    fontFamily: FontFamily.sans,
                                                }}
                                            >
                                                {musikaUser.email}
                                            </Text>
                                        </View>
                                        <View
                                            style={{
                                                backgroundColor: '#10B98120',
                                                paddingHorizontal: 8,
                                                paddingVertical: 4,
                                                borderRadius: Radius.sm,
                                                flexShrink: 0,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    color: '#10B981',
                                                    fontSize: 10,
                                                    fontFamily: FontFamily.sansBold,
                                                }}
                                            >
                                                CONECTADO
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Stats row */}
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            gap: 10,
                                            marginTop: 4,
                                        }}
                                    >
                                        <TouchableOpacity
                                            onPress={() => {
                                                setIsAuthModalOpen(false);
                                                setSelectedStyle('user_playlists');
                                            }}
                                            activeOpacity={0.8}
                                            style={{
                                                flex: 1,
                                                backgroundColor: theme.mode === 'dark' ? '#181C26' : '#FFFFFF',
                                                padding: 12,
                                                borderRadius: Radius.md,
                                                borderWidth: 1,
                                                borderColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.06)' : '#E2E8F0',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <Ionicons name="folder-open" size={18} color={theme.colors.primary} />
                                            <Text
                                                style={{
                                                    color: theme.colors.text,
                                                    fontSize: 16,
                                                    fontFamily: FontFamily.sansBold,
                                                    marginTop: 4,
                                                }}
                                            >
                                                {userPlaylists.length}
                                            </Text>
                                            <Text
                                                style={{
                                                    color: theme.colors.textMuted,
                                                    fontSize: 11,
                                                    fontFamily: FontFamily.caption,
                                                }}
                                            >
                                                Playlists Criadas
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={() => {
                                                setIsAuthModalOpen(false);
                                                setSelectedStyle('favorites');
                                            }}
                                            activeOpacity={0.8}
                                            style={{
                                                flex: 1,
                                                backgroundColor: theme.mode === 'dark' ? '#181C26' : '#FFFFFF',
                                                padding: 12,
                                                borderRadius: Radius.md,
                                                borderWidth: 1,
                                                borderColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.06)' : '#E2E8F0',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <Ionicons name="heart" size={18} color="#EF4444" />
                                            <Text
                                                style={{
                                                    color: theme.colors.text,
                                                    fontSize: 16,
                                                    fontFamily: FontFamily.sansBold,
                                                    marginTop: 4,
                                                }}
                                            >
                                                {favoriteSongIds.length}
                                            </Text>
                                            <Text
                                                style={{
                                                    color: theme.colors.textMuted,
                                                    fontSize: 11,
                                                    fontFamily: FontFamily.caption,
                                                }}
                                            >
                                                Favoritas
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Playlists preview */}
                                {userPlaylists.length > 0 && (
                                    <View>
                                        <Text
                                            style={{
                                                color: theme.colors.textSecondary,
                                                fontSize: 12,
                                                fontFamily: FontFamily.sansBold,
                                                textTransform: 'uppercase',
                                                letterSpacing: 0.8,
                                                marginBottom: 10,
                                            }}
                                        >
                                            Suas Playlists MusiKA
                                        </Text>
                                        {userPlaylists.map((pl) => (
                                            <TouchableOpacity
                                                key={pl.id || pl._id}
                                                onPress={() => {
                                                    setSelectedPlaylistId(pl.id || pl._id || null);
                                                    setSelectedStyle('user_playlists');
                                                    setIsAuthModalOpen(false);
                                                }}
                                                activeOpacity={0.75}
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: 12,
                                                    backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#F8FAFC',
                                                    borderRadius: Radius.md,
                                                    marginBottom: 8,
                                                    borderWidth: 1,
                                                    borderColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#E2E8F0',
                                                }}
                                            >
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                                                    <Ionicons name="musical-note" size={18} color={theme.colors.primary} />
                                                    <View style={{ flex: 1 }}>
                                                        <Text
                                                            numberOfLines={1}
                                                            style={{
                                                                color: theme.colors.text,
                                                                fontSize: 13,
                                                                fontFamily: FontFamily.sansBold,
                                                            }}
                                                        >
                                                            {pl.name}
                                                        </Text>
                                                        <Text
                                                            style={{
                                                                color: theme.colors.textMuted,
                                                                fontSize: 11,
                                                                fontFamily: FontFamily.sans,
                                                            }}
                                                        >
                                                            {pl.tracks?.length || 0} faixas
                                                        </Text>
                                                    </View>
                                                </View>
                                                <Ionicons name="play-circle" size={24} color={theme.colors.primary} />
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}

                                {/* Feedback Messages in User View */}
                                {errorMessage && (
                                    <View
                                        style={{
                                            backgroundColor: '#EF444418',
                                            borderWidth: 1,
                                            borderColor: '#EF4444',
                                            padding: 10,
                                            borderRadius: Radius.md,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: 8,
                                        }}
                                    >
                                        <Ionicons name="alert-circle" size={16} color="#EF4444" />
                                        <Text
                                            style={{
                                                color: '#EF4444',
                                                fontSize: 12,
                                                fontFamily: FontFamily.sansMedium,
                                                flex: 1,
                                            }}
                                        >
                                            {errorMessage}
                                        </Text>
                                    </View>
                                )}

                                {successMessage && (
                                    <View
                                        style={{
                                            backgroundColor: '#10B98118',
                                            borderWidth: 1,
                                            borderColor: '#10B981',
                                            padding: 10,
                                            borderRadius: Radius.md,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: 8,
                                        }}
                                    >
                                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                        <Text
                                            style={{
                                                color: '#10B981',
                                                fontSize: 12,
                                                fontFamily: FontFamily.sansMedium,
                                                flex: 1,
                                            }}
                                        >
                                            {successMessage}
                                        </Text>
                                    </View>
                                )}

                                {/* Action Buttons */}
                                <View style={{ gap: 10, marginTop: 4 }}>
                                    {/* Sincronizar Agora */}
                                    <TouchableOpacity
                                        onPress={handleSync}
                                        disabled={syncLoading}
                                        activeOpacity={0.8}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 8,
                                            paddingVertical: 13,
                                            borderRadius: Radius.md,
                                            backgroundColor: theme.colors.primary,
                                        }}
                                    >
                                        {syncLoading ? (
                                            <ActivityIndicator size="small" color="#000000" />
                                        ) : (
                                            <>
                                                <Ionicons name="sync" size={18} color="#000000" />
                                                <Text
                                                    style={{
                                                        color: '#000000',
                                                        fontSize: 14,
                                                        fontFamily: FontFamily.sansBold,
                                                    }}
                                                >
                                                    Sincronizar Playlists e Favoritas
                                                </Text>
                                            </>
                                        )}
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={openMusikaApp}
                                        activeOpacity={0.8}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 8,
                                            paddingVertical: 12,
                                            borderRadius: Radius.md,
                                            backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#F1F5F9',
                                            borderWidth: 1,
                                            borderColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.1)' : '#E2E8F0',
                                        }}
                                    >
                                        <Ionicons name="musical-notes" size={18} color={theme.colors.primary} />
                                        <Text
                                            style={{
                                                color: theme.colors.text,
                                                fontSize: 14,
                                                fontFamily: FontFamily.sansBold,
                                            }}
                                        >
                                            Abrir o MusiKA
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={handleLogout}
                                        activeOpacity={0.8}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 8,
                                            paddingVertical: 11,
                                            borderRadius: Radius.md,
                                            backgroundColor: '#EF444415',
                                            borderWidth: 1,
                                            borderColor: '#EF444430',
                                        }}
                                    >
                                        <Ionicons name="log-out-outline" size={16} color="#EF4444" />
                                        <Text
                                            style={{
                                                color: '#EF4444',
                                                fontSize: 13,
                                                fontFamily: FontFamily.sansBold,
                                            }}
                                        >
                                            Desconectar do MusiKA
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            /* Login Form View */
                            <View style={{ gap: 16 }}>
                                <Text
                                    style={{
                                        color: theme.colors.textSecondary,
                                        fontSize: 13,
                                        fontFamily: FontFamily.sans,
                                        lineHeight: 20,
                                    }}
                                >
                                    Conecte sua conta do MusiKA para acessar e reproduzir suas próprias playlists de treino e faixas favoritas.
                                </Text>

                                {errorMessage && (
                                    <View
                                        style={{
                                            backgroundColor: '#EF444418',
                                            borderWidth: 1,
                                            borderColor: '#EF4444',
                                            padding: 12,
                                            borderRadius: Radius.md,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: 8,
                                        }}
                                    >
                                        <Ionicons name="alert-circle" size={18} color="#EF4444" />
                                        <Text
                                            style={{
                                                color: '#EF4444',
                                                fontSize: 12,
                                                fontFamily: FontFamily.sansMedium,
                                                flex: 1,
                                            }}
                                        >
                                            {errorMessage}
                                        </Text>
                                    </View>
                                )}

                                {successMessage && (
                                    <View
                                        style={{
                                            backgroundColor: '#10B98118',
                                            borderWidth: 1,
                                            borderColor: '#10B981',
                                            padding: 12,
                                            borderRadius: Radius.md,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: 8,
                                        }}
                                    >
                                        <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                                        <Text
                                            style={{
                                                color: '#10B981',
                                                fontSize: 12,
                                                fontFamily: FontFamily.sansMedium,
                                                flex: 1,
                                            }}
                                        >
                                            {successMessage}
                                        </Text>
                                    </View>
                                )}

                                {/* Google Sign In Button */}
                                <TouchableOpacity
                                    onPress={handleGoogleLogin}
                                    disabled={googleLoading || loading}
                                    activeOpacity={0.85}
                                    style={{
                                        backgroundColor: theme.mode === 'dark' ? '#FFFFFF' : '#0F172A',
                                        paddingVertical: 13,
                                        borderRadius: Radius.md,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexDirection: 'row',
                                        gap: 10,
                                        borderWidth: 1,
                                        borderColor: theme.mode === 'dark' ? 'transparent' : '#334155',
                                        shadowColor: '#000',
                                        shadowOffset: { width: 0, height: 2 },
                                        shadowOpacity: 0.15,
                                        shadowRadius: 4,
                                        elevation: 2,
                                    }}
                                >
                                    {googleLoading ? (
                                        <ActivityIndicator size="small" color={theme.mode === 'dark' ? '#000000' : '#FFFFFF'} />
                                    ) : (
                                        <>
                                            <Ionicons name="logo-google" size={18} color={theme.mode === 'dark' ? '#EA4335' : '#FFFFFF'} />
                                            <Text
                                                style={{
                                                    color: theme.mode === 'dark' ? '#000000' : '#FFFFFF',
                                                    fontSize: 14,
                                                    fontFamily: FontFamily.sansBold,
                                                }}
                                            >
                                                {session?.user?.email
                                                    ? `Continuar como ${userName?.split(' ')[0] || 'Google'}`
                                                    : 'Continuar com Google'}
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>

                                {/* Divider */}
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 4 }}>
                                    <View style={{ flex: 1, height: 1, backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }} />
                                    <Text
                                        style={{
                                            color: theme.colors.textMuted,
                                            fontSize: 11,
                                            fontFamily: FontFamily.caption,
                                            marginHorizontal: 12,
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        ou entre com e-mail
                                    </Text>
                                    <View style={{ flex: 1, height: 1, backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }} />
                                </View>

                                {/* Email Field */}
                                <View style={{ gap: 6 }}>
                                    <Text
                                        style={{
                                            color: theme.colors.text,
                                            fontSize: 12,
                                            fontFamily: FontFamily.sansBold,
                                        }}
                                    >
                                        E-MAIL
                                    </Text>
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            backgroundColor: theme.mode === 'dark' ? '#181C26' : '#F8FAFC',
                                            borderRadius: Radius.md,
                                            paddingHorizontal: 12,
                                            borderWidth: 1,
                                            borderColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                                        }}
                                    >
                                        <Ionicons name="mail-outline" size={16} color={theme.colors.textMuted} />
                                        <TextInput
                                            value={email}
                                            onChangeText={setEmail}
                                            placeholder="seu.email@exemplo.com"
                                            placeholderTextColor={theme.colors.textMuted}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            style={{
                                                flex: 1,
                                                paddingVertical: 12,
                                                paddingHorizontal: 10,
                                                color: theme.colors.text,
                                                fontSize: 14,
                                                fontFamily: FontFamily.sans,
                                            }}
                                        />
                                    </View>
                                </View>

                                {/* Password Field */}
                                <View style={{ gap: 6 }}>
                                    <Text
                                        style={{
                                            color: theme.colors.text,
                                            fontSize: 12,
                                            fontFamily: FontFamily.sansBold,
                                        }}
                                    >
                                        SENHA
                                    </Text>
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            backgroundColor: theme.mode === 'dark' ? '#181C26' : '#F8FAFC',
                                            borderRadius: Radius.md,
                                            paddingHorizontal: 12,
                                            borderWidth: 1,
                                            borderColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                                        }}
                                    >
                                        <Ionicons name="lock-closed-outline" size={16} color={theme.colors.textMuted} />
                                        <TextInput
                                            value={password}
                                            onChangeText={setPassword}
                                            placeholder="Sua senha do MusiKA"
                                            placeholderTextColor={theme.colors.textMuted}
                                            secureTextEntry={!showPassword}
                                            style={{
                                                flex: 1,
                                                paddingVertical: 12,
                                                paddingHorizontal: 10,
                                                color: theme.colors.text,
                                                fontSize: 14,
                                                fontFamily: FontFamily.sans,
                                            }}
                                        />
                                        <TouchableOpacity
                                            onPress={() => setShowPassword(!showPassword)}
                                            style={{ padding: 4 }}
                                        >
                                            <Ionicons
                                                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                                size={18}
                                                color={theme.colors.textMuted}
                                            />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Login Button */}
                                <TouchableOpacity
                                    onPress={handleLogin}
                                    disabled={loading || googleLoading}
                                    activeOpacity={0.85}
                                    style={{
                                        backgroundColor: theme.colors.primary,
                                        paddingVertical: 13,
                                        borderRadius: Radius.md,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginTop: 4,
                                        flexDirection: 'row',
                                        gap: 8,
                                    }}
                                >
                                    {loading ? (
                                        <ActivityIndicator size="small" color="#000000" />
                                    ) : (
                                        <>
                                            <Ionicons name="log-in-outline" size={18} color="#000000" />
                                            <Text
                                                style={{
                                                    color: '#000000',
                                                    fontSize: 14,
                                                    fontFamily: FontFamily.sansBold,
                                                }}
                                            >
                                                Entrar com E-mail
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>

                                {/* Register / Web Link */}
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 4,
                                        marginTop: 4,
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: theme.colors.textMuted,
                                            fontSize: 13,
                                            fontFamily: FontFamily.sans,
                                        }}
                                    >
                                        Ainda não tem conta?
                                    </Text>
                                    <TouchableOpacity onPress={openRegisterWeb}>
                                        <Text
                                            style={{
                                                color: theme.colors.primary,
                                                fontSize: 13,
                                                fontFamily: FontFamily.sansBold,
                                            }}
                                        >
                                            Cadastre-se no MusiKA
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}
