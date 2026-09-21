import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, AppState, Linking, Modal, NativeModules, Platform, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SubscriptionModal } from '../components/settings/SubscriptionModal';
import { useAuth } from '../context/AuthContext';
import { usePushNotifications } from '../context/PushNotificationContext';
import { useTheme } from '../context/ThemeContext';
import { useUserStore } from '../store/useUserStore';

const SectionLabel = React.memo(function SectionLabel({ title, theme }: { title: string; theme: any }) {
    return (
    <Text style={{ color: theme.colors.textSecondary, fontSize: 11, fontFamily: 'Inter_700Bold', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8, marginLeft: 4 }}>
        {title}
    </Text>
    );
});

const CardGroup = React.memo(function CardGroup({ children, theme }: { children: React.ReactNode; theme: any }) {
    return (
    <View style={{ backgroundColor: theme.colors.card, borderRadius: 18, borderWidth: 1, borderColor: theme.colors.cardBorder, overflow: 'hidden', marginBottom: 22 }}>
        {children}
    </View>
    );
});

const SettingsRow = React.memo(function SettingsRow({ icon, iconColor, title, subtitle, onPress, isLast = false, theme }: {
    icon: string; iconColor: string; title: string; subtitle?: string; onPress?: () => void; isLast?: boolean; theme: any;
}) {
    return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 16, borderBottomWidth: isLast ? 0 : 1, borderBottomColor: theme.colors.divider, minHeight: 58 }}>
        <View style={{ backgroundColor: iconColor + '18', width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 13 }}>
            <Ionicons name={icon as any} size={19} color={iconColor} />
        </View>
        <View style={{ flex: 1 }}>
            <Text style={{ color: theme.colors.text, fontSize: 15, fontFamily: 'Inter_700Bold', fontWeight: '700' }}>{title}</Text>
            {subtitle && <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginTop: 2 }}>{subtitle}</Text>}
        </View>
        {onPress && <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />}
    </TouchableOpacity>
    );
});

export default function SettingsScreen() {
    const { theme, setTheme } = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const settingsAccent = theme.mode === 'light' ? theme.colors.primaryDark : theme.colors.primary;
    const settingsActionText = theme.mode === 'light' ? '#FFFFFF' : theme.colors.onPrimary;
    const { prefs, updatePrefs, requestPermission, refreshPermission, testNotification } = usePushNotifications();
    const { userName } = useUserStore();
    const { session, signOut } = useAuth();

    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [pickerHour, setPickerHour] = useState(prefs.workoutReminderHour);
    const [pickerMinute, setPickerMinute] = useState(prefs.workoutReminderMinute);

    useEffect(() => {
        refreshPermission();
        const subscription = AppState.addEventListener('change', state => {
            if (state === 'active') refreshPermission();
        });
        return () => subscription.remove();
    }, [refreshPermission]);

    const formatTime = (h: number, m: number) =>
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

    const handleToggleReminder = useCallback(async (value: boolean) => {
        if (value && !prefs.permissionGranted) {
            const granted = await requestPermission();
            if (!granted) {
                Alert.alert('Permissão necessária', 'Ative as notificações nas configurações do sistema para receber lembretes de treino.');
                return;
            }
        }
        await updatePrefs({ workoutReminderEnabled: value });
    }, [prefs.permissionGranted, requestPermission, updatePrefs]);

    const handleToggleStreakAlert = useCallback(async (value: boolean) => {
        if (value && !prefs.permissionGranted) {
            const granted = await requestPermission();
            if (!granted) {
                Alert.alert('Permissão necessária', 'Ative as notificações nas configurações do sistema para receber alertas de streak.');
                return;
            }
        }
        await updatePrefs({ streakAlertEnabled: value });
    }, [prefs.permissionGranted, requestPermission, updatePrefs]);

    const handleSaveTime = useCallback(async () => {
        await updatePrefs({ workoutReminderHour: pickerHour, workoutReminderMinute: pickerMinute });
        setShowTimePicker(false);
    }, [pickerHour, pickerMinute, updatePrefs]);

    const handleTestNotification = useCallback(async () => {
        const delivered = await testNotification();
        if (delivered) {
            Alert.alert('Teste enviado', 'A notificação deve aparecer agora.');
            return;
        }
        Alert.alert(
            'Notificações bloqueadas',
            'Ative as notificações do Strive nas configurações do Android.',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Abrir configurações', onPress: () => Linking.openSettings() },
            ]
        );
    }, [testNotification]);

    const handleResetApp = useCallback(() => {
        Alert.alert(
            'Redefinir aplicativo?',
            'Todos os dados locais, treinos e preferências serão apagados. Esta ação não pode ser desfeita.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Redefinir',
                    style: 'destructive',
                    onPress: async () => {
                        await AsyncStorage.clear();
                        router.replace('/');
                        NativeModules.DevSettings?.reload?.();
                    },
                },
            ]
        );
    }, [router]);

    const handleLogout = useCallback(() => {
        if (Platform.OS === 'web') {
            const confirmed = typeof window !== 'undefined'
                ? window.confirm('Deseja realmente sair da sua conta?')
                : true;
            if (confirmed) {
                (async () => {
                    try {
                        await signOut();
                        if (typeof window !== 'undefined') {
                            window.location.href = '/login';
                        } else {
                            router.replace('/(auth)/login');
                        }
                    } catch (err: any) {
                        console.error('Erro ao sair:', err);
                    }
                })();
            }
            return;
        }

        Alert.alert(
            'Sair da Conta',
            'Deseja realmente sair da sua conta?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Sair',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await signOut();
                            router.replace('/(auth)/login');
                        } catch (err: any) {
                            Alert.alert('Erro ao sair', err?.message || 'Tente novamente.');
                        }
                    },
                },
            ]
        );
    }, [signOut, router]);

    const userInitial = userName ? userName.charAt(0).toUpperCase() : 'A';
    const userEmail = session?.user?.email || '';

    return (
        <View style={{ flex: 1, backgroundColor: 'transparent' }}>
            <StatusBar style={theme.mode === 'light' ? 'dark' : 'light'} />

            {/* ── Header ── */}
            <View style={{
                paddingTop: insets.top + 12,
                paddingBottom: 16,
                paddingHorizontal: 20,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'transparent',
            }}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    activeOpacity={0.7}
                    style={{
                        backgroundColor: theme.colors.card,
                        width: 44,
                        height: 44,
                        borderRadius: 16,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: theme.colors.cardBorder,
                        marginRight: 16,
                    }}
                >
                    <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <View>
                    <Text style={{ color: theme.colors.text, fontSize: 24, fontFamily: 'Inter_700Bold', fontWeight: '700', letterSpacing: -0.5 }}>
                        Configurações
                    </Text>
                    <Text style={{ color: theme.colors.textSecondary, fontSize: 10, fontFamily: 'Inter_700Bold', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
                        Sua conta & preferências
                    </Text>
                </View>
            </View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40 }}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews
            >

                {/* ── Profile Summary Card ── */}
                <View style={{ marginBottom: 28 }}>
                    <TouchableOpacity
                        onPress={() => router.push('/profile?action=edit')}
                        activeOpacity={0.85}
                        style={{
                            borderRadius: 24,
                            overflow: 'hidden',
                            borderWidth: 1,
                            borderColor: theme.colors.cardBorder,
                        }}
                    >
                        <View style={{ padding: 16, backgroundColor: theme.colors.card }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                {/* Avatar */}
                                <View style={{
                                    width: 58,
                                    height: 58,
                                    borderRadius: 20,
                                    backgroundColor: settingsAccent + '16',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: 16,
                                    borderWidth: 2,
                                    borderColor: settingsAccent + '45',
                                }}>
                                    <Text style={{ color: settingsAccent, fontSize: 26, fontFamily: 'Inter_700Bold', fontWeight: '700' }}>
                                        {userInitial}
                                    </Text>
                                </View>

                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: theme.colors.text, fontSize: 18, fontFamily: 'Inter_700Bold', fontWeight: '700', marginBottom: 2 }}>
                                        {userName || 'Atleta'}
                                    </Text>
                                    <Text style={{ color: theme.colors.textSecondary, fontSize: 12, fontFamily: 'Inter_500Medium', fontWeight: '500' }} numberOfLines={1}>
                                        {userEmail}
                                    </Text>
                                    {/* Premium badge */}
                                    <View style={{
                                        backgroundColor: theme.colors.warning + '20',
                                        borderWidth: 1,
                                        borderColor: theme.colors.warning + '40',
                                        borderRadius: 8,
                                        paddingHorizontal: 8,
                                        paddingVertical: 3,
                                        alignSelf: 'flex-start',
                                        marginTop: 6,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 4,
                                    }}>
                                        <Ionicons name="ribbon" size={11} color={theme.colors.warning} />
                                        <Text style={{ color: theme.colors.warning, fontSize: 10, fontFamily: 'Inter_700Bold', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                            Premium
                                        </Text>
                                    </View>
                                </View>

                                <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* ── Conta ── */}
                <View>
                    <SectionLabel title="Conta" theme={theme} />
                    <CardGroup theme={theme}>
                        <SettingsRow
                            icon="ribbon-outline"
                            iconColor={theme.colors.warning}
                            title="Assinatura"
                            subtitle="Plano Premium ativo"
                            onPress={() => setShowSubscriptionModal(true)}
                            isLast
                            theme={theme}
                        />
                    </CardGroup>
                </View>


                {/* ── Notificações ── */}
                <View>
                    <SectionLabel title="Notificações" theme={theme} />
                    <CardGroup theme={theme}>
                        {/* Reminder toggle */}
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: 14,
                            paddingHorizontal: 16,
                            borderBottomWidth: 1,
                            borderBottomColor: theme.colors.border + '25',
                            minHeight: 60,
                        }}>
                            <View style={{
                                backgroundColor: theme.colors.warning + '20',
                                width: 40, height: 40, borderRadius: 13,
                                alignItems: 'center', justifyContent: 'center', marginRight: 14,
                            }}>
                                <Ionicons name="alarm-outline" size={20} color={theme.colors.warning} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: theme.colors.text, fontSize: 15, fontFamily: 'Inter_700Bold', fontWeight: '700' }}>Lembrete de Treino</Text>
                                <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                                    {prefs.workoutReminderEnabled
                                        ? `Ativo todos os dias às ${formatTime(prefs.workoutReminderHour, prefs.workoutReminderMinute)}`
                                        : 'Desativado'}
                                </Text>
                            </View>
                            <Switch
                                value={prefs.workoutReminderEnabled}
                                onValueChange={handleToggleReminder}
                                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                                thumbColor={theme.colors.onImage}
                            />
                        </View>

                        {/* Time picker row (only when enabled) */}
                        {prefs.workoutReminderEnabled && (
                            <TouchableOpacity
                                onPress={() => {
                                    setPickerHour(prefs.workoutReminderHour);
                                    setPickerMinute(prefs.workoutReminderMinute);
                                    setShowTimePicker(true);
                                }}
                                activeOpacity={0.7}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingVertical: 14,
                                    paddingHorizontal: 16,
                                    borderBottomWidth: 1,
                                    borderBottomColor: theme.colors.border + '25',
                                    minHeight: 60,
                                    backgroundColor: theme.colors.primary + '06',
                                }}
                            >
                                <View style={{
                                    backgroundColor: theme.colors.info + '20',
                                    width: 40, height: 40, borderRadius: 13,
                                    alignItems: 'center', justifyContent: 'center', marginRight: 14,
                                }}>
                                    <Ionicons name="time-outline" size={20} color={theme.colors.info} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: theme.colors.text, fontSize: 15, fontFamily: 'Inter_700Bold', fontWeight: '700' }}>Horário do Lembrete</Text>
                                </View>
                                <View style={{
                                    backgroundColor: theme.colors.primary + '15',
                                    borderRadius: 10,
                                    paddingHorizontal: 12,
                                    paddingVertical: 6,
                                    marginRight: 8,
                                }}>
                                    <Text style={{ color: theme.mode === 'light' ? theme.colors.primaryDark : theme.colors.primary, fontSize: 15, fontFamily: 'Inter_700Bold', fontWeight: '700' }}>
                                        {formatTime(prefs.workoutReminderHour, prefs.workoutReminderMinute)}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
                            </TouchableOpacity>
                        )}

                        {/* Streak alert */}
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: 14,
                            paddingHorizontal: 16,
                            minHeight: 60,
                        }}>
                            <View style={{
                                backgroundColor: theme.colors.error + '20',
                                width: 40, height: 40, borderRadius: 13,
                                alignItems: 'center', justifyContent: 'center', marginRight: 14,
                            }}>
                                <Ionicons name="flame-outline" size={20} color={theme.colors.error} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: theme.colors.text, fontSize: 15, fontFamily: 'Inter_700Bold', fontWeight: '700' }}>Alerta de Streak</Text>
                                <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                                    {prefs.streakAlertEnabled ? 'Ativo às 20h quando não houver treino' : 'Desativado'}
                                </Text>
                            </View>
                            <Switch
                                value={prefs.streakAlertEnabled}
                                onValueChange={handleToggleStreakAlert}
                                trackColor={{ false: theme.colors.border, true: '#F59E0B' }}
                                thumbColor={theme.colors.onImage}
                            />
                        </View>

                        <TouchableOpacity
                            onPress={handleTestNotification}
                            activeOpacity={0.7}
                            style={{
                                flexDirection: 'row', alignItems: 'center', paddingVertical: 13,
                                paddingHorizontal: 16, minHeight: 58,
                                borderTopWidth: 1, borderTopColor: theme.colors.divider,
                            }}
                        >
                            <View style={{ backgroundColor: settingsAccent + '16', width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                                <Ionicons name="notifications-outline" size={20} color={settingsAccent} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: theme.colors.text, fontSize: 15, fontFamily: 'Inter_700Bold', fontWeight: '700' }}>Testar Notificação</Text>
                                <Text style={{ color: prefs.permissionGranted ? settingsAccent : theme.colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                                    {prefs.permissionGranted ? 'Permissão ativa no aparelho' : 'Permissão bloqueada ou não concedida'}
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
                        </TouchableOpacity>
                    </CardGroup>
                </View>

                {/* ── Aparência ── */}
                <View>
                    <SectionLabel title={`Aparência — Tema ${theme.mode === 'light' ? 'Claro' : 'Escuro'}`} theme={theme} />
                    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
                        {/* Light mode */}
                        <TouchableOpacity
                            onPress={() => setTheme('light')}
                            activeOpacity={0.8}
                            style={{
                                flex: 1,
                                backgroundColor: theme.mode === 'light' ? settingsAccent + '15' : theme.colors.card,
                                borderRadius: 16,
                                borderWidth: 1.5,
                                borderColor: theme.mode === 'light' ? settingsAccent : theme.colors.cardBorder,
                                padding: 12,
                                minHeight: 58,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                            }}
                        >
                            <View style={{
                                backgroundColor: theme.mode === 'light' ? settingsAccent + '20' : theme.colors.backgroundTertiary,
                                width: 34, height: 34, borderRadius: 11,
                                alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Ionicons name="sunny" size={19} color={theme.mode === 'light' ? theme.colors.primaryDark : theme.colors.textMuted} />
                            </View>
                            <View>
                                <Text style={{
                                    color: theme.mode === 'light' ? theme.colors.primaryDark : theme.colors.text,
                                    fontSize: 13,
                                    fontFamily: 'Inter_700Bold', fontWeight: '700',
                                }}>
                                    Claro
                                </Text>
                                {theme.mode === 'light' && (
                                    <Text style={{ color: theme.colors.primaryDark, fontSize: 10, fontFamily: 'Inter_600SemiBold' }}>Ativo</Text>
                                )}
                            </View>
                        </TouchableOpacity>

                        {/* Dark mode */}
                        <TouchableOpacity
                            onPress={() => setTheme('dark')}
                            activeOpacity={0.8}
                            style={{
                                flex: 1,
                                backgroundColor: theme.mode === 'dark' ? theme.colors.primary + '18' : theme.colors.card,
                                borderRadius: 16,
                                borderWidth: 1.5,
                                borderColor: theme.mode === 'dark' ? theme.colors.primary : theme.colors.cardBorder,
                                padding: 12,
                                minHeight: 58,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                            }}
                        >
                            <View style={{
                                backgroundColor: theme.mode === 'dark' ? theme.colors.primary + '25' : theme.colors.backgroundTertiary,
                                width: 34, height: 34, borderRadius: 11,
                                alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Ionicons name="moon" size={18} color={theme.mode === 'dark' ? theme.colors.primaryLight : theme.colors.textMuted} />
                            </View>
                            <View>
                                <Text style={{
                                    color: theme.mode === 'dark' ? theme.colors.primary : theme.colors.text,
                                    fontSize: 13,
                                    fontFamily: 'Inter_700Bold', fontWeight: '700',
                                }}>
                                    Escuro
                                </Text>
                                {theme.mode === 'dark' && (
                                    <Text style={{ color: theme.colors.primary, fontSize: 10, fontFamily: 'Inter_600SemiBold' }}>Ativo</Text>
                                )}
                            </View>
                        </TouchableOpacity>
                    </View>
                    <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginBottom: 24, paddingHorizontal: 4 }}>
                        O topo e o menu do celular acompanham exatamente a cor de fundo do aplicativo.
                    </Text>
                </View>

                {/* ── Zona de Risco ── */}
                <View>
                    <SectionLabel title="Zona de Risco" theme={theme} />
                    <View style={{
                        backgroundColor: theme.colors.error + '08',
                        borderRadius: 22,
                        borderWidth: 1,
                        borderColor: theme.colors.error + '25',
                        overflow: 'hidden',
                        marginBottom: 24,
                    }}>
                        <TouchableOpacity
                            onPress={handleLogout}
                            activeOpacity={0.7}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                padding: 16,
                                minHeight: 60,
                                borderBottomWidth: 1,
                                borderBottomColor: theme.colors.error + '20',
                            }}
                        >
                            <View style={{
                                backgroundColor: theme.colors.error + '20',
                                width: 40, height: 40, borderRadius: 13,
                                alignItems: 'center', justifyContent: 'center', marginRight: 14,
                            }}>
                                <Ionicons name="log-out-outline" size={20} color={theme.colors.error} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: theme.colors.error, fontSize: 15, fontFamily: 'Inter_700Bold', fontWeight: '700' }}>Sair da Conta</Text>
                                <Text style={{ color: theme.colors.error + '80', fontSize: 12, marginTop: 2 }}>Desconectar desta sessão</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={theme.colors.error + '50'} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleResetApp}
                            activeOpacity={0.7}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                padding: 16,
                                minHeight: 60,
                            }}
                        >
                            <View style={{
                                backgroundColor: theme.colors.error + '20',
                                width: 40, height: 40, borderRadius: 13,
                                alignItems: 'center', justifyContent: 'center', marginRight: 14,
                            }}>
                                <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: theme.colors.error, fontSize: 15, fontFamily: 'Inter_700Bold', fontWeight: '700' }}>Redefinir Aplicativo</Text>
                                <Text style={{ color: theme.colors.error + '80', fontSize: 12, marginTop: 2 }}>Apaga todos os dados locais permanentemente</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={theme.colors.error + '50'} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Footer */}
                <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                    <Text style={{ color: theme.colors.textMuted, fontSize: 11, fontFamily: 'Inter_600SemiBold', fontWeight: '600' }}>Versão 1.0.0 (Build 42)</Text>
                    <Text style={{ color: theme.colors.textMuted, fontSize: 11, marginTop: 4 }}>Feito com ❤️ pelo time Strive</Text>
                </View>

            </ScrollView>

            {/* ── Time Picker Modal ── */}
            {showTimePicker && <Modal visible transparent animationType="none" onRequestClose={() => setShowTimePicker(false)}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' }}>
                    <View
                        style={{
                            backgroundColor: theme.colors.card,
                            borderRadius: 28,
                            padding: 28,
                            width: 300,
                            borderWidth: 1,
                            borderColor: theme.colors.cardBorder,
                        }}
                    >
                        <Text style={{ color: theme.colors.text, fontSize: 18, fontFamily: 'Inter_700Bold', fontWeight: '700', textAlign: 'center', marginBottom: 24 }}>
                            Horário do Lembrete
                        </Text>

                        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 28, gap: 8 }}>
                            {/* Hour */}
                            <View style={{ alignItems: 'center' }}>
                                <TouchableOpacity onPress={() => setPickerHour(h => (h + 1) % 24)} style={{ padding: 10 }}>
                                    <Ionicons name="chevron-up" size={28} color={settingsAccent} />
                                </TouchableOpacity>
                                <View style={{
                                    backgroundColor: theme.colors.backgroundTertiary,
                                    borderRadius: 16, width: 72, height: 72,
                                    alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Text style={{ color: theme.colors.text, fontSize: 38, fontFamily: 'Inter_700Bold', fontWeight: '700' }}>
                                        {String(pickerHour).padStart(2, '0')}
                                    </Text>
                                </View>
                                <TouchableOpacity onPress={() => setPickerHour(h => (h - 1 + 24) % 24)} style={{ padding: 10 }}>
                                    <Ionicons name="chevron-down" size={28} color={settingsAccent} />
                                </TouchableOpacity>
                            </View>

                            <Text style={{ color: theme.colors.text, fontSize: 36, fontFamily: 'Inter_700Bold', fontWeight: '700', marginBottom: 4 }}>:</Text>

                            {/* Minute */}
                            <View style={{ alignItems: 'center' }}>
                                <TouchableOpacity onPress={() => setPickerMinute(m => (m + 5) % 60)} style={{ padding: 10 }}>
                                    <Ionicons name="chevron-up" size={28} color={settingsAccent} />
                                </TouchableOpacity>
                                <View style={{
                                    backgroundColor: theme.colors.backgroundTertiary,
                                    borderRadius: 16, width: 72, height: 72,
                                    alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Text style={{ color: theme.colors.text, fontSize: 38, fontFamily: 'Inter_700Bold', fontWeight: '700' }}>
                                        {String(pickerMinute).padStart(2, '0')}
                                    </Text>
                                </View>
                                <TouchableOpacity onPress={() => setPickerMinute(m => (m - 5 + 60) % 60)} style={{ padding: 10 }}>
                                    <Ionicons name="chevron-down" size={28} color={settingsAccent} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <TouchableOpacity
                                onPress={() => setShowTimePicker(false)}
                                style={{
                                    flex: 1, paddingVertical: 14, borderRadius: 16,
                                    alignItems: 'center',
                                    backgroundColor: theme.colors.backgroundTertiary,
                                    borderWidth: 1, borderColor: theme.colors.cardBorder,
                                }}
                            >
                                <Text style={{ color: theme.colors.textSecondary, fontFamily: 'Inter_700Bold', fontWeight: '700', fontSize: 14 }}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleSaveTime}
                                style={{
                                    flex: 1, paddingVertical: 14, borderRadius: 16,
                                    alignItems: 'center',
                                    backgroundColor: settingsAccent,
                                }}
                            >
                                <Text style={{ color: settingsActionText, fontFamily: 'Inter_700Bold', fontWeight: '700', fontSize: 14 }}>Salvar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>}

            {showSubscriptionModal && <SubscriptionModal
                visible={showSubscriptionModal}
                onClose={() => setShowSubscriptionModal(false)}
            />}
        </View>
    );
}
