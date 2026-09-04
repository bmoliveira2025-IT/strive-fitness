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
        <View className="flex-1 bg-black">
            <ImageBackground
                source={{ uri: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop' }}
                className="flex-1 justify-center"
                resizeMode="cover"
            >
                <View className="absolute inset-0 bg-black/75" />

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
                                shadowOpacity: 0.35,
                                shadowRadius: 12,
                                elevation: 8,
                            }}
                        >
                            <Ionicons name="barbell" size={34} color={theme.colors.onPrimary} />
                        </View>
                        <Text className="text-white text-4xl font-black mb-2 tracking-tighter" style={{ fontFamily: 'Sora_800ExtraBold' }}>
                            STRIVE
                        </Text>
                        <Text className="text-zinc-400 text-base" style={{ fontFamily: 'Inter_500Medium' }}>
                            Evolua seu treino com inteligência.
                        </Text>
                    </View>

                    <View className="space-y-4">
                        <View>
                            <Text className="text-zinc-400 text-xs font-bold uppercase mb-2 ml-1" style={{ fontFamily: 'Sora_700Bold' }}>
                                E-mail
                            </Text>
                            <TextInput
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                className="bg-zinc-900/90 border border-zinc-800 text-white p-4 rounded-2xl text-base"
                                placeholderTextColor="#71717a"
                                placeholder="seu@email.com"
                            />
                        </View>

                        <View className="mb-6">
                            <Text className="text-zinc-400 text-xs font-bold uppercase mb-2 ml-1" style={{ fontFamily: 'Sora_700Bold' }}>
                                Senha
                            </Text>
                            <TextInput
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                className="bg-zinc-900/90 border border-zinc-800 text-white p-4 rounded-2xl text-base"
                                placeholderTextColor="#71717a"
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
                                shadowOpacity: 0.3,
                                shadowRadius: 10,
                                elevation: 6,
                            }}
                        >
                            {loading ? (
                                <ModernLoading size={24} color={theme.colors.onPrimary} />
                            ) : (
                                <Text
                                    style={{
                                        color: theme.colors.onPrimary,
                                        fontFamily: 'Sora_700Bold',
                                        fontSize: 16,
                                    }}
                                >
                                    {isSignUp ? 'Criar Conta' : 'Entrar'}
                                </Text>
                            )}
                        </TouchableOpacity>

                        <View className="flex-row items-center my-6">
                            <View className="flex-1 h-[1px] bg-zinc-800" />
                            <Text className="text-zinc-500 mx-4 text-xs font-bold uppercase" style={{ fontFamily: 'Inter_600SemiBold' }}>
                                Ou continue com
                            </Text>
                            <View className="flex-1 h-[1px] bg-zinc-800" />
                        </View>

                        <TouchableOpacity
                            onPress={handleGoogleLogin}
                            disabled={loading || googleLoading}
                            activeOpacity={0.85}
                            style={{
                                backgroundColor: '#FFFFFF',
                                borderRadius: 16,
                                paddingVertical: 16,
                                alignItems: 'center',
                                flexDirection: 'row',
                                justifyContent: 'center',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.15,
                                shadowRadius: 8,
                                elevation: 4,
                            }}
                        >
                            {googleLoading ? (
                                <ModernLoading size={22} color="#000000" />
                            ) : (
                                <>
                                    <Ionicons name="logo-google" size={22} color="#000000" style={{ marginRight: 10 }} />
                                    <Text
                                        style={{
                                            color: '#000000',
                                            fontFamily: 'Sora_700Bold',
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
                            <Text className="text-zinc-400 text-sm">
                                {isSignUp ? 'Já tem uma conta? ' : 'Não tem uma conta? '}
                                <Text
                                    style={{ color: theme.colors.primary, fontFamily: 'Sora_700Bold' }}
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
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                borderWidth: 1,
                                borderColor: 'rgba(255, 255, 255, 0.1)',
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                            }}
                        >
                            <Ionicons name="cloud-offline-outline" size={16} color="#A1A1AA" />
                            <Text style={{ color: '#E4E4E7', fontSize: 13, fontFamily: 'Sora_600SemiBold' }}>
                                Continuar Offline (Sem Login)
                            </Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </ImageBackground>
        </View>
    );
}
