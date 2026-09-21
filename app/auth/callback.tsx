import Palette from '../../constants/palette.json';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function AuthCallbackScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                // 1. Web browser: check window.location for hash or PKCE code
                if (typeof window !== 'undefined') {
                    if (window.location.hash) {
                        const hash = window.location.hash.substring(1);
                        const hashParams = new URLSearchParams(hash);
                        const accessToken = hashParams.get('access_token');
                        const refreshToken = hashParams.get('refresh_token');

                        if (accessToken && refreshToken) {
                            const { error } = await supabase.auth.setSession({
                                access_token: accessToken,
                                refresh_token: refreshToken,
                            });
                            if (!error) {
                                router.replace('/(tabs)');
                                return;
                            }
                        }
                    }

                    const searchParams = new URLSearchParams(window.location.search);
                    const code = searchParams.get('code');
                    if (code) {
                        const { error } = await supabase.auth.exchangeCodeForSession(code);
                        if (!error) {
                            router.replace('/(tabs)');
                            return;
                        }
                    }
                }

                // 2. Native Mobile / Expo Linking
                const initialUrl = await Linking.getInitialURL();
                const currentUrl = initialUrl || '';

                if (currentUrl.includes('#')) {
                    const hash = currentUrl.split('#')[1];
                    const hashParams = new URLSearchParams(hash);
                    const accessToken = hashParams.get('access_token');
                    const refreshToken = hashParams.get('refresh_token');

                    if (accessToken && refreshToken) {
                        const { error } = await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken,
                        });
                        if (!error) {
                            router.replace('/(tabs)');
                            return;
                        }
                    }
                }

                const code = params.code as string;
                if (code) {
                    const { error } = await supabase.auth.exchangeCodeForSession(code);
                    if (!error) {
                        router.replace('/(tabs)');
                        return;
                    }
                }

                // 3. Fallback: check active session
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    router.replace('/(tabs)');
                } else {
                    router.replace('/(auth)/login');
                }
            } catch (err) {
                console.error('Error handling auth callback:', err);
                router.replace('/(auth)/login');
            }
        };

        handleAuthCallback();
    }, [params, router]);

    return (
        <View style={{ flex: 1, backgroundColor: Palette.dark.background, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={Palette.dark.primary} />
            <Text style={{ color: Palette.light.onImage, marginTop: 16, fontFamily: "Inter_700Bold", fontSize: 16 }}>
                Autenticando com Google...
            </Text>
        </View>
    );
}
