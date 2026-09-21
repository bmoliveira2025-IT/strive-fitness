import Palette from '../../constants/palette.json';
import { Ionicons } from '@expo/vector-icons';
import * as AuthSession from 'expo-auth-session';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import {
    Alert,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ModernLoading } from '../../components/ui/ModernLoading';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { continueAsGuest } = useAuth();

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);

    const withTimeout = async <T,>(operation: Promise<T>, timeoutMs = 15000): Promise<T> => {
        let timeoutId: ReturnType<typeof setTimeout> | undefined;
        const timeout = new Promise<never>((_, reject) => {
            timeoutId = setTimeout(
                () => reject(new Error('A conexão demorou demais. Verifique sua internet e tente novamente.')),
                timeoutMs
            );
        });

        try {
            return await Promise.race([operation, timeout]);
        } finally {
            if (timeoutId) clearTimeout(timeoutId);
        }
    };

    const handleAuth = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Atenção', 'Por favor, preencha todos os campos.');
            return;
        }

        setLoading(true);

        try {
            if (isSignUp) {
                const { error } = await withTimeout(supabase.auth.signUp({
                    email: email.trim(),
                    password,
                }));
                if (error) throw error;
                Alert.alert('Sucesso', 'Conta criada com sucesso! Verifique seu e-mail para confirmar o cadastro.');
            } else {
                const { data, error } = await withTimeout(supabase.auth.signInWithPassword({
                    email: email.trim(),
                    password,
                }));
                if (error) throw error;
                if (data.session) {
                    router.replace('/(tabs)');
                }
            }
        } catch (error: any) {
            console.error('Auth error:', error);
            if (error.message?.includes('Email not confirmed')) {
                Alert.alert('Verifique seu E-mail', 'Você precisa confirmar seu endereço de e-mail antes de fazer login.');
            } else if (error.message?.includes('Invalid login credentials')) {
                Alert.alert('Erro ao entrar', 'E-mail ou senha incorretos.');
            } else {
                Alert.alert('Erro', error.message || 'Ocorreu um erro na autenticação.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setGoogleLoading(true);

            // Web browser flow (Vercel, Chrome, Safari iOS)
            if (Platform.OS === 'web') {
                const redirectUrl = typeof window !== 'undefined'
                    ? `${window.location.origin}/auth/callback`
                    : 'https://strivefitness-mu.vercel.app/auth/callback';

                const { data, error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo: redirectUrl,
                        queryParams: {
                            access_type: 'offline',
                            prompt: 'consent',
                        },
                    },
                });

                if (error) throw error;
                if (data?.url && typeof window !== 'undefined') {
                    window.location.href = data.url;
                }
                return;
            }

            // Native Mobile flow (Android APK / iOS App)
            const redirectUrl = AuthSession.makeRedirectUri({
                scheme: 'strive-fitness-br',
                path: 'auth/callback',
            });
            console.log('🔗 OAuth Redirect URL:', redirectUrl);

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl,
                    skipBrowserRedirect: true,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            });

            if (error) throw error;
            if (!data?.url) throw new Error('Não foi possível gerar a URL de autenticação.');

            const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

            if (res.type === 'success' && res.url) {
                // Parse hash params (#access_token=...&refresh_token=...)
                const urlParts = res.url.split('#');
                if (urlParts.length > 1) {
                    const params = new URLSearchParams(urlParts[1]);
                    const accessToken = params.get('access_token');
                    const refreshToken = params.get('refresh_token');

                    if (accessToken && refreshToken) {
                        const { error: sessionError } = await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken,
                        });
                        if (sessionError) throw sessionError;
                    }
                }
            }
        } catch (e: any) {
            console.error('Google Auth Error:', e);
            Alert.alert('Erro no Google', e.message || 'Não foi possível completar o login com Google.');
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-background">
            <ImageBackground
                source={{ uri: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop' }}
                className="flex-1 justify-center"
                resizeMode="cover"
            >
                <View className="absolute inset-0" style={{ backgroundColor: theme.mode === 'dark' ? theme.colors.background + 'EB' : theme.colors.background }} />

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1 justify-center px-8"
                >
                    <View className="mb-10">
                        <View
                            style={{
                                width: 64,
                                height: 64,
                                backgroundColor: theme.colors.primary,
                                borderRadius: 20,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 20,
                                shadowColor: theme.colors.primary,
                                shadowOffset: { width: 0, height: 6 },
                                shadowOpacity: 0.1,
                                shadowRadius: 8,
                                elevation: 8,
                            }}
                        >
                            <Ionicons name="barbell" size={34} color={theme.colors.onPrimary} />
                        </View>
                        <Text className="text-text text-4xl font-bold mb-2 tracking-tighter" style={{ fontFamily: "Inter_700Bold" }}>
                            STRIVE
                        </Text>
                        <Text className="text-text-secondary text-base" style={{ fontFamily: 'Inter_500Medium' }}>
                            Evolua seu treino com inteligência.
                        </Text>
                    </View>

                    <View className="space-y-4">
                        <View>
                            <Text className="text-text-secondary text-xs font-bold uppercase mb-2 ml-1" style={{ fontFamily: "Inter_700Bold" }}>
                                E-mail
                            </Text>
                            <TextInput
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                className="p-4 rounded-2xl text-base"
                                style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border, borderWidth: 1, color: theme.colors.text, fontFamily: 'Inter_400Regular' }}
                                placeholderTextColor={theme.colors.textMuted}
                                placeholder="seu@email.com"
                            />
                        </View>

                        <View className="mb-6">
                            <Text className="text-text-secondary text-xs font-bold uppercase mb-2 ml-1" style={{ fontFamily: "Inter_700Bold" }}>
                                Senha
                            </Text>
                            <TextInput
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                className="p-4 rounded-2xl text-base"
                                style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border, borderWidth: 1, color: theme.colors.text, fontFamily: 'Inter_400Regular' }}
                                placeholderTextColor={theme.colors.textMuted}
                                placeholder="••••••••"
                            />
                        </View>

                        <TouchableOpacity
                            onPress={handleAuth}
                            disabled={loading || googleLoading}
                            activeOpacity={0.85}
                            style={{
                                backgroundColor: theme.colors.primary,
                                borderRadius: 16,
                                paddingVertical: 16,
                                alignItems: 'center',
                                justifyContent: 'center',
                                shadowColor: theme.colors.primary,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.1,
                                shadowRadius: 8,
                                elevation: 6,
                            }}
                        >
                            {loading ? (
                                <ModernLoading size={24} color={theme.colors.onPrimary} />
                            ) : (
                                <Text
                                    style={{
                                        color: theme.colors.onPrimary,
                                        fontFamily: "Inter_700Bold",
                                        fontSize: 16,
                                    }}
                                >
                                    {isSignUp ? 'Criar Conta' : 'Entrar'}
                                </Text>
                            )}
                        </TouchableOpacity>

                        <View className="flex-row items-center my-6">
                            <View className="flex-1 h-[1px] bg-backgroundTertiary" />
                            <Text className="text-text-muted mx-4 text-xs font-bold uppercase" style={{ fontFamily: 'Inter_600SemiBold' }}>
                                Ou continue com
                            </Text>
                            <View className="flex-1 h-[1px] bg-backgroundTertiary" />
                        </View>

                        <TouchableOpacity
                            onPress={handleGoogleLogin}
                            disabled={loading || googleLoading}
                            activeOpacity={0.85}
                            style={{
                                backgroundColor: theme.colors.card,
                                borderWidth: 1,
                                borderColor: theme.colors.border,
                                borderRadius: 16,
                                paddingVertical: 16,
                                alignItems: 'center',
                                flexDirection: 'row',
                                justifyContent: 'center',
                                shadowColor: Palette.ink,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.1,
                                shadowRadius: 8,
                                elevation: 4,
                            }}
                        >
                            {googleLoading ? (
                                <ModernLoading size={22} color={theme.colors.text} />
                            ) : (
                                <>
                                    <Ionicons name="logo-google" size={22} color={theme.colors.text} style={{ marginRight: 10 }} />
                                    <Text
                                        style={{
                                            color: theme.colors.text,
                                            fontFamily: "Inter_700Bold",
                                            fontSize: 15,
                                        }}
                                    >
                                        Continuar com Google
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setIsSignUp(!isSignUp)}
                            className="mt-6 p-2 items-center"
                        >
                            <Text className="text-text-secondary text-sm">
                                {isSignUp ? 'Já tem uma conta? ' : 'Não tem uma conta? '}
                                <Text
                                    style={{ color: theme.colors.primary, fontFamily: "Inter_700Bold" }}
                                >
                                    {isSignUp ? 'Fazer Login' : 'Cadastre-se'}
                                </Text>
                            </Text>
                        </TouchableOpacity>

                        {/* Offline / Guest Mode */}
                        <TouchableOpacity
                            onPress={async () => {
                                await continueAsGuest();
                                router.replace('/(tabs)');
                            }}
                            activeOpacity={0.75}
                            style={{
                                marginTop: 8,
                                paddingVertical: 12,
                                paddingHorizontal: 16,
                                borderRadius: 14,
                                backgroundColor: theme.colors.backgroundSecondary,
                                borderWidth: 1,
                                borderColor: theme.colors.border,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                            }}
                        >
                            <Ionicons name="cloud-offline-outline" size={16} color={theme.colors.textSecondary} />
                            <Text style={{ color: theme.colors.textSecondary, fontSize: 13, fontFamily: "Inter_600SemiBold" }}>
                                Continuar Offline (Sem Login)
                            </Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </ImageBackground>
        </View>
    );
}
