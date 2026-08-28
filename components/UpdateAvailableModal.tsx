import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Linking, Modal, Text, TouchableOpacity, View } from 'react-native';
import { FontFamily, Radius } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { AppUpdateInfo, checkForAppUpdates, dismissUpdateVersion } from '../services/updateService';

export function UpdateAvailableModal() {
    const { theme } = useTheme();
    const [updateInfo, setUpdateInfo] = useState<AppUpdateInfo | null>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        let isMounted = true;
        // Check for updates on startup with a 5-second timeout to never block app launch
        Promise.race([
            checkForAppUpdates(),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
        ])
            .then((info) => {
                if (isMounted && info?.hasUpdate) {
                    setUpdateInfo(info);
                    setVisible(true);
                }
            })
            .catch(() => {});

        return () => {
            isMounted = false;
        };
    }, []);

    if (!updateInfo || !visible) return null;

    const handleDownload = async () => {
        if (updateInfo.downloadUrl) {
            await Linking.openURL(updateInfo.downloadUrl).catch(() => {});
        }
        if (!updateInfo.isMandatory) {
            setVisible(false);
        }
    };

    const handleDismiss = async () => {
        if (updateInfo.latestVersion) {
            await dismissUpdateVersion(updateInfo.latestVersion);
        }
        setVisible(false);
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => {
                if (!updateInfo.isMandatory) setVisible(false);
            }}
        >
            <View
                style={{
                    flex: 1,
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 24,
                }}
            >
                <View
                    style={{
                        width: '100%',
                        maxWidth: 380,
                        borderRadius: 24,
                        overflow: 'hidden',
                        backgroundColor: theme.mode === 'dark' ? '#14161E' : '#FFFFFF',
                        borderWidth: 1.5,
                        borderColor: theme.colors.primary,
                        shadowColor: theme.colors.primary,
                        shadowOffset: { width: 0, height: 8 },
                        shadowOpacity: 0.25,
                        shadowRadius: 16,
                        elevation: 8,
                    }}
                >
                    <LinearGradient
                        colors={
                            theme.mode === 'dark'
                                ? ['rgba(255, 255, 255, 0.05)', 'rgba(0, 0, 0, 0.4)']
                                : ['rgba(240, 245, 255, 0.9)', 'rgba(255, 255, 255, 0.98)']
                        }
                        style={{ padding: 24 }}
                    >
                        {/* Header icon badge */}
                        <View style={{ alignItems: 'center', marginBottom: 16 }}>
                            <View
                                style={{
                                    width: 60,
                                    height: 60,
                                    borderRadius: 30,
                                    backgroundColor: theme.colors.primary + '20',
                                    borderWidth: 2,
                                    borderColor: theme.colors.primary,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 12,
                                }}
                            >
                                <Ionicons name="sparkles" size={28} color={theme.colors.primary} />
                            </View>

                            <Text
                                style={{
                                    color: theme.colors.text,
                                    fontSize: 20,
                                    fontFamily: FontFamily.display,
                                    fontWeight: '800',
                                    textAlign: 'center',
                                }}
                            >
                                Nova Versão Disponível!
                            </Text>

                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 6,
                                    marginTop: 4,
                                }}
                            >
                                <Text style={{ color: theme.colors.textMuted, fontSize: 13, fontFamily: FontFamily.sans }}>
                                    v{updateInfo.currentVersion}
                                </Text>
                                <Ionicons name="arrow-forward" size={12} color={theme.colors.textMuted} />
                                <View
                                    style={{
                                        backgroundColor: theme.colors.primary,
                                        paddingHorizontal: 8,
                                        paddingVertical: 2,
                                        borderRadius: 6,
                                    }}
                                >
                                    <Text style={{ color: '#000000', fontSize: 12, fontFamily: FontFamily.sansBold }}>
                                        v{updateInfo.latestVersion}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Release notes */}
                        <View
                            style={{
                                backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
                                borderRadius: Radius.md,
                                padding: 14,
                                marginBottom: 20,
                                borderWidth: 1,
                                borderColor: theme.colors.border,
                            }}
                        >
                            <Text
                                style={{
                                    color: theme.colors.text,
                                    fontSize: 12,
                                    fontFamily: FontFamily.sansBold,
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.5,
                                    marginBottom: 8,
                                }}
                            >
                                O que há de novo:
                            </Text>
                            {updateInfo.releaseNotes.map((note, index) => (
                                <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 4 }}>
                                    <Text style={{ color: theme.colors.primary, fontSize: 14, lineHeight: 18 }}>•</Text>
                                    <Text
                                        style={{
                                            color: theme.colors.textSecondary,
                                            fontSize: 13,
                                            fontFamily: FontFamily.sans,
                                            flex: 1,
                                            lineHeight: 18,
                                        }}
                                    >
                                        {note}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        {/* Actions */}
                        <View style={{ gap: 10 }}>
                            <TouchableOpacity
                                onPress={handleDownload}
                                activeOpacity={0.85}
                                style={{
                                    backgroundColor: theme.colors.primary,
                                    paddingVertical: 14,
                                    borderRadius: Radius.md,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                    shadowColor: theme.colors.primary,
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.3,
                                    shadowRadius: 8,
                                    elevation: 4,
                                }}
                            >
                                <Ionicons name="download-outline" size={20} color="#000000" />
                                <Text style={{ color: '#000000', fontSize: 15, fontFamily: FontFamily.sansBold }}>
                                    Atualizar APK Agora
                                </Text>
                            </TouchableOpacity>

                            {!updateInfo.isMandatory && (
                                <TouchableOpacity
                                    onPress={handleDismiss}
                                    style={{
                                        paddingVertical: 10,
                                        alignItems: 'center',
                                    }}
                                >
                                    <Text style={{ color: theme.colors.textMuted, fontSize: 13, fontFamily: FontFamily.sansMedium }}>
                                        Lembrar mais tarde
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </LinearGradient>
                </View>
            </View>
        </Modal>
    );
}
