import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Animated,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { FontFamily, Radius } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export default function WebInstallBanner() {
    const { theme } = useTheme();
    const [isVisible, setIsVisible] = useState(false);
    const [isIOSModalVisible, setIsIOSModalVisible] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isIOSDevice, setIsIOSDevice] = useState(false);
    const slideAnim = React.useRef(new Animated.Value(-120)).current;

    useEffect(() => {
        if (Platform.OS !== 'web' || typeof window === 'undefined') return;

        // Check if user dismissed recently
        const dismissedAt = localStorage.getItem('@strive_pwa_dismissed_at');
        if (dismissedAt) {
            const daysAgo = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
            if (daysAgo < 3) return; // don't nag for 3 days
        }

        // Check if already running in standalone PWA mode
        const isStandalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true;

        if (isStandalone) return;

        // Check if iOS
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOSDevice(isIOS);

        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            showBanner();
        };

        window.addEventListener('beforeinstallprompt', handler);

        if (isIOS) {
            showBanner();
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const showBanner = () => {
        setIsVisible(true);
        Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
            tension: 40,
        }).start();
    };

    const handleInstallClick = async () => {
        if (isIOSDevice) {
            setIsIOSModalVisible(true);
            return;
        }

        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                handleDismiss();
            }
            setDeferredPrompt(null);
        } else {
            setIsIOSModalVisible(true);
        }
    };

    const handleDismiss = () => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('@strive_pwa_dismissed_at', Date.now().toString());
        }
        Animated.timing(slideAnim, {
            toValue: -140,
            duration: 250,
            useNativeDriver: true,
        }).start(() => setIsVisible(false));
    };

    if (!isVisible || Platform.OS !== 'web') return null;

    return (
        <>
            <Animated.View
                style={[
                    styles.container,
                    {
                        backgroundColor: '#1E293B',
                        borderBottomColor: '#334155',
                        transform: [{ translateY: slideAnim }],
                    },
                ]}
            >
                <View style={styles.bannerInner}>
                    <View
                        style={{
                            width: 38,
                            height: 38,
                            borderRadius: 12,
                            backgroundColor: 'rgba(139, 92, 246, 0.2)',
                            borderWidth: 1,
                            borderColor: '#8B5CF6',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 12,
                        }}
                    >
                        <Ionicons
                            name={isIOSDevice ? 'logo-apple' : 'phone-portrait-outline'}
                            size={20}
                            color="#A78BFA"
                        />
                    </View>

                    <View style={{ flex: 1 }}>
                        <Text style={{ color: '#F8FAFC', fontSize: 13, fontFamily: FontFamily.sansBold }}>
                            {isIOSDevice ? 'Instalar no iPhone (App PWA)' : 'Instalar Strive no Aparelho'}
                        </Text>
                        <Text style={{ color: '#94A3B8', fontSize: 11, fontFamily: FontFamily.sansRegular }}>
                            {isIOSDevice
                                ? 'Use sem navegador com 60 FPS e tela cheia'
                                : 'Acesse direto pela tela inicial com alta performance'}
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={handleInstallClick}
                        style={{
                            backgroundColor: '#8B5CF6',
                            paddingHorizontal: 13,
                            paddingVertical: 7,
                            borderRadius: Radius.full,
                            marginRight: 8,
                        }}
                    >
                        <Text style={{ color: '#FFFFFF', fontSize: 12, fontFamily: FontFamily.sansBold }}>
                            {isIOSDevice ? 'Como Instalar' : 'Instalar'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleDismiss} style={{ padding: 4 }}>
                        <Ionicons name="close" size={20} color="#94A3B8" />
                    </TouchableOpacity>
                </View>
            </Animated.View>

            {/* iOS PWA Installation Instructions Modal */}
            <Modal
                visible={isIOSModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsIOSModalVisible(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={[styles.modalCard, { backgroundColor: '#18202F', borderColor: '#2E3D54' }]}>
                        <View style={{ alignItems: 'center', marginBottom: 16 }}>
                            <View
                                style={{
                                    width: 52,
                                    height: 52,
                                    borderRadius: 18,
                                    backgroundColor: 'rgba(139, 92, 246, 0.15)',
                                    borderWidth: 1,
                                    borderColor: '#8B5CF6',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 10,
                                }}
                            >
                                <Ionicons name="logo-apple" size={28} color="#C4B5FD" />
                            </View>
                            <Text style={{ color: '#FFFFFF', fontSize: 18, fontFamily: FontFamily.sansBold, textAlign: 'center' }}>
                                Instalar Strive no iPhone
                            </Text>
                            <Text style={{ color: '#94A3B8', fontSize: 12, textAlign: 'center', marginTop: 4 }}>
                                O iOS não precisa de APK. Você pode transformar o Strive em um App nativo em 3 passos:
                            </Text>
                        </View>

                        {/* Step 1 */}
                        <View style={styles.stepRow}>
                            <View style={styles.stepBadge}>
                                <Text style={styles.stepBadgeText}>1</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.stepTitle}>Toque no botão Compartilhar</Text>
                                <Text style={styles.stepDesc}>
                                    No navegador Safari do seu iPhone, toque no ícone{' '}
                                    <Ionicons name="share-outline" size={14} color="#38BDF8" /> na barra inferior.
                                </Text>
                            </View>
                        </View>

                        {/* Step 2 */}
                        <View style={styles.stepRow}>
                            <View style={styles.stepBadge}>
                                <Text style={styles.stepBadgeText}>2</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.stepTitle}>Adicionar à Tela de Início</Text>
                                <Text style={styles.stepDesc}>
                                    Role a lista de ações para baixo e toque em{' '}
                                    <Text style={{ color: '#FFFFFF', fontFamily: FontFamily.sansBold }}>
                                        "Adicionar à Tela de Início"
                                    </Text>{' '}
                                    <Ionicons name="add-circle-outline" size={14} color="#A78BFA" />.
                                </Text>
                            </View>
                        </View>

                        {/* Step 3 */}
                        <View style={styles.stepRow}>
                            <View style={styles.stepBadge}>
                                <Text style={styles.stepBadgeText}>3</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.stepTitle}>Confirmar e Usar</Text>
                                <Text style={styles.stepDesc}>
                                    Toque em <Text style={{ color: '#FFFFFF', fontFamily: FontFamily.sansBold }}>"Adicionar"</Text> no topo direito. O ícone do Strive aparecerá na tela do seu iPhone como um App!
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={() => setIsIOSModalVisible(false)}
                            style={{
                                backgroundColor: '#8B5CF6',
                                paddingVertical: 12,
                                borderRadius: Radius.lg,
                                alignItems: 'center',
                                marginTop: 18,
                            }}
                        >
                            <Text style={{ color: '#FFFFFF', fontSize: 14, fontFamily: FontFamily.sansBold }}>
                                Entendi, vou adicionar
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        borderBottomWidth: 1,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 10,
    },
    bannerInner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        maxWidth: 768,
        alignSelf: 'center',
        width: '100%',
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    modalCard: {
        width: '100%',
        maxWidth: 420,
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginVertical: 8,
        gap: 12,
    },
    stepBadge: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#8B5CF6',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },
    stepBadgeText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontFamily: FontFamily.sansBold,
    },
    stepTitle: {
        color: '#F8FAFC',
        fontSize: 14,
        fontFamily: FontFamily.sansBold,
        marginBottom: 2,
    },
    stepDesc: {
        color: '#94A3B8',
        fontSize: 12,
        fontFamily: FontFamily.sansRegular,
        lineHeight: 18,
    },
});
