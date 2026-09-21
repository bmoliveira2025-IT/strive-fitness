import Palette from '../../constants/palette.json';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { hapticWarning } from '../../utils/haptics';

interface ConfirmDialogProps {
    visible: boolean;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    icon?: keyof typeof Ionicons.glyphMap;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    visible,
    title,
    description,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    isDestructive = true,
    icon = 'alert-circle',
    onConfirm,
    onCancel
}) => {
    const { theme } = useTheme();

    React.useEffect(() => {
        if (visible && isDestructive) {
            hapticWarning();
        }
    }, [visible, isDestructive]);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onCancel}
        >
            <View style={styles.overlay}>
                <View
                    style={[
                        styles.card,
                        {
                            backgroundColor: theme.colors.card,
                            borderColor: theme.colors.cardBorder,
                        }
                    ]}
                >
                    <View
                        style={[
                            styles.iconWrapper,
                            {
                                backgroundColor: isDestructive
                                    ? (theme.mode === 'dark' ? theme.colors.errorMuted : theme.colors.errorMuted)
                                    : (theme.mode === 'dark' ? theme.colors.infoMuted : theme.colors.infoMuted),
                            }
                        ]}
                    >
                        <Ionicons
                            name={icon}
                            size={28}
                            color={isDestructive ? theme.colors.error : theme.colors.primary}
                        />
                    </View>

                    <Text style={[styles.title, { color: theme.colors.text }]}>
                        {title}
                    </Text>

                    <Text style={[styles.description, { color: theme.colors.textMuted }]}>
                        {description}
                    </Text>

                    <View style={styles.btnRow}>
                        <TouchableOpacity
                            onPress={onCancel}
                            style={[
                                styles.cancelBtn,
                                {
                                    backgroundColor: theme.colors.backgroundSecondary,
                                    borderColor: theme.colors.border,
                                }
                            ]}
                        >
                            <Text style={[styles.cancelText, { color: theme.colors.textSecondary }]}>
                                {cancelText}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={onConfirm}
                            style={[
                                styles.confirmBtn,
                                {
                                    backgroundColor: isDestructive ? theme.colors.error : theme.colors.primary,
                                }
                            ]}
                        >
                            <Text style={[styles.confirmText, { color: theme.colors.onPrimary }]}>
                                {confirmText}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.65)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    card: {
        width: '100%',
        maxWidth: 380,
        borderRadius: 24,
        borderWidth: 1,
        padding: 24,
        alignItems: 'center',
        shadowColor: Palette.ink,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 12,
    },
    iconWrapper: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontFamily: "Inter_700Bold",
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 8,
    },
    description: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13.5,
        lineHeight: 20,
        textAlign: 'center',
        marginBottom: 24,
    },
    btnRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 13,
        borderRadius: 14,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelText: {
        fontFamily: "Inter_600SemiBold",
        fontSize: 14,
    },
    confirmBtn: {
        flex: 1,
        paddingVertical: 13,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmText: {
        fontFamily: "Inter_600SemiBold",
        fontSize: 14,
        color: Palette.light.onImage,
    },
});
