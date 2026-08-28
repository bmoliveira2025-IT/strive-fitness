import React, { useState, useMemo } from 'react';
import {
    Modal,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
    StyleSheet
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Notification, NotificationType, useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import { EmptyState } from './feedback/EmptyState';
import { StatusChip } from './feedback/StatusChip';
import { hapticSelection, hapticLight } from '../utils/haptics';

interface NotificationModalProps {
    visible: boolean;
    onClose: () => void;
}

type TabFilter = 'all' | 'unread' | 'records_goals';

const getIconForType = (type: NotificationType) => {
    switch (type) {
        case 'achievement':
        case 'pr':
            return { name: 'trophy' as const, color: '#EAB308', bg: '#EAB30815' };
        case 'recovery':
            return { name: 'fitness' as const, color: '#10B981', bg: '#10B98115' };
        case 'consistency':
            return { name: 'flame' as const, color: '#F97316', bg: '#F9731615' };
        case 'workout':
            return { name: 'barbell' as const, color: '#3B82F6', bg: '#3B82F615' };
        case 'goal':
            return { name: 'flag' as const, color: '#8B5CF6', bg: '#8B5CF615' };
        default:
            return { name: 'information-circle' as const, color: '#64748B', bg: '#64748B15' };
    }
};

const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Agora';
    if (diff < 3600000) return `Há ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `Há ${Math.floor(diff / 3600000)}h`;
    if (diff < 172800000) return 'Ontem';
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

export const NotificationModal = ({ visible, onClose }: NotificationModalProps) => {
    const { theme } = useTheme();
    const router = useRouter();
    const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAll } = useNotifications();
    const [currentTab, setCurrentTab] = useState<TabFilter>('all');
    const { height: SCREEN_HEIGHT } = useWindowDimensions();

    const filteredNotifications = useMemo(() => {
        if (currentTab === 'unread') {
            return notifications.filter(n => !n.isRead);
        }
        if (currentTab === 'records_goals') {
            return notifications.filter(n => n.type === 'pr' || n.type === 'achievement' || n.type === 'goal');
        }
        return notifications;
    }, [notifications, currentTab]);

    const handleNotificationPress = (notif: Notification) => {
        hapticLight();
        markAsRead(notif.id);
        if (notif.route) {
            onClose();
            router.push(notif.route as any);
        }
    };

    const handleTabChange = (tab: TabFilter) => {
        hapticSelection();
        setCurrentTab(tab);
    };

    const Content = () => (
        <View
            style={[
                styles.modalContent,
                {
                    backgroundColor: theme.colors.background,
                    height: SCREEN_HEIGHT * 0.88,
                    marginTop: SCREEN_HEIGHT * 0.12,
                    borderColor: theme.colors.cardBorder,
                }
            ]}
        >
            {/* Header */}
            <View style={[styles.header, { borderColor: theme.colors.border }]}>
                <View style={styles.titleRow}>
                    <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                        NOTIFICAÇÕES
                    </Text>
                    {unreadCount > 0 && (
                        <View style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
                            <Text style={[styles.badgeText, { color: theme.colors.onPrimary }]}>
                                {unreadCount}
                            </Text>
                        </View>
                    )}
                </View>

                <TouchableOpacity
                    onPress={onClose}
                    style={[styles.closeBtn, { backgroundColor: theme.colors.backgroundSecondary }]}
                >
                    <Ionicons name="close" size={20} color={theme.colors.text} />
                </TouchableOpacity>
            </View>

            {/* Filter Tabs */}
            <View style={[styles.tabsRow, { borderBottomColor: theme.colors.border }]}>
                <TouchableOpacity
                    onPress={() => handleTabChange('all')}
                    style={[
                        styles.tabItem,
                        currentTab === 'all' && [styles.activeTab, { borderBottomColor: theme.colors.primary }]
                    ]}
                >
                    <Text
                        style={[
                            styles.tabText,
                            { color: currentTab === 'all' ? theme.colors.text : theme.colors.textMuted }
                        ]}
                    >
                        Todas ({notifications.length})
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => handleTabChange('unread')}
                    style={[
                        styles.tabItem,
                        currentTab === 'unread' && [styles.activeTab, { borderBottomColor: theme.colors.primary }]
                    ]}
                >
                    <Text
                        style={[
                            styles.tabText,
                            { color: currentTab === 'unread' ? theme.colors.text : theme.colors.textMuted }
                        ]}
                    >
                        Não Lidas {unreadCount > 0 ? `(${unreadCount})` : ''}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => handleTabChange('records_goals')}
                    style={[
                        styles.tabItem,
                        currentTab === 'records_goals' && [styles.activeTab, { borderBottomColor: theme.colors.primary }]
                    ]}
                >
                    <Text
                        style={[
                            styles.tabText,
                            { color: currentTab === 'records_goals' ? theme.colors.text : theme.colors.textMuted }
                        ]}
                    >
                        Recordes & Metas
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Notifications List */}
            <ScrollView
                style={styles.scrollArea}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {filteredNotifications.length === 0 ? (
                    <EmptyState
                        icon="notifications-off-outline"
                        title={
                            currentTab === 'unread'
                                ? 'Nenhuma notificação pendente'
                                : currentTab === 'records_goals'
                                    ? 'Nenhum recorde ainda'
                                    : 'Central limpa!'
                        }
                        description={
                            currentTab === 'unread'
                                ? 'Você já leu todas as suas notificações recentes.'
                                : 'Continue registrando seus treinos para desbloquear novos recordes e marcos aqui.'
                        }
                        style={{ paddingVertical: 40 }}
                    />
                ) : (
                    <>
                        {/* Quick actions */}
                        <View style={styles.actionsRow}>
                            {unreadCount > 0 && (
                                <TouchableOpacity onPress={markAllAsRead} style={styles.actionLink}>
                                    <Ionicons name="checkmark-done-outline" size={14} color={theme.colors.primary} style={{ marginRight: 4 }} />
                                    <Text style={[styles.actionLinkText, { color: theme.colors.primary }]}>
                                        Marcar lidas
                                    </Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity onPress={clearAll} style={styles.actionLink}>
                                <Ionicons name="trash-outline" size={14} color={theme.colors.textMuted} style={{ marginRight: 4 }} />
                                <Text style={[styles.actionLinkText, { color: theme.colors.textMuted }]}>
                                    Limpar tudo
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {filteredNotifications.map((notif) => {
                            const iconCfg = getIconForType(notif.type);
                            return (
                                <TouchableOpacity
                                    key={notif.id}
                                    onPress={() => handleNotificationPress(notif)}
                                    activeOpacity={0.7}
                                    style={[
                                        styles.notificationCard,
                                        {
                                            backgroundColor: notif.isRead ? theme.colors.card : (theme.mode === 'dark' ? '#171B22' : '#F8FAFC'),
                                            borderColor: notif.isRead ? theme.colors.cardBorder : theme.colors.primary + '50',
                                            borderLeftColor: notif.isRead ? theme.colors.cardBorder : theme.colors.primary,
                                            borderLeftWidth: notif.isRead ? 1 : 4,
                                        }
                                    ]}
                                >
                                    <View
                                        style={[
                                            styles.iconCircle,
                                            { backgroundColor: iconCfg.bg }
                                        ]}
                                    >
                                        <Ionicons name={iconCfg.name} size={22} color={iconCfg.color} />
                                    </View>

                                    <View style={styles.contentCol}>
                                        <View style={styles.topMetaRow}>
                                            <Text
                                                style={[
                                                    styles.notifTitle,
                                                    {
                                                        color: theme.colors.text,
                                                        fontFamily: notif.isRead ? 'Sora_600SemiBold' : 'Sora_700Bold'
                                                    }
                                                ]}
                                                numberOfLines={1}
                                            >
                                                {notif.title}
                                            </Text>
                                            <Text style={[styles.timestamp, { color: theme.colors.textMuted }]}>
                                                {formatDate(notif.timestamp)}
                                            </Text>
                                        </View>

                                        <Text style={[styles.notifMessage, { color: theme.colors.textSecondary }]}>
                                            {notif.message}
                                        </Text>

                                        <View style={styles.footerRow}>
                                            {!notif.isRead && (
                                                <StatusChip label="Novo" type="active" size="sm" />
                                            )}
                                            {notif.priority === 'high' && (
                                                <StatusChip label="Importante" type="pr" size="sm" style={{ marginLeft: 6 }} />
                                            )}
                                            {notif.actionLabel && (
                                                <View style={styles.actionHint}>
                                                    <Text style={[styles.actionHintText, { color: theme.colors.primary }]}>
                                                        {notif.actionLabel}
                                                    </Text>
                                                    <Ionicons name="chevron-forward" size={12} color={theme.colors.primary} />
                                                </View>
                                            )}
                                        </View>
                                    </View>

                                    <TouchableOpacity
                                        onPress={() => deleteNotification(notif.id)}
                                        style={styles.deleteBtn}
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    >
                                        <Ionicons name="close-circle-outline" size={18} color={theme.colors.textMuted} />
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            );
                        })}
                    </>
                )}
            </ScrollView>
        </View>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            {Platform.OS !== 'web' ? (
                <BlurView
                    intensity={25}
                    tint={theme.mode === 'dark' ? 'dark' : 'light'}
                    style={styles.blurBackdrop}
                >
                    <Content />
                </BlurView>
            ) : (
                <View style={styles.webBackdrop}>
                    <Content />
                </View>
            )}
        </Modal>
    );
};

const styles = StyleSheet.create({
    blurBackdrop: {
        flex: 1,
    },
    webBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    modalContent: {
        flex: 1,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        borderTopWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 20,
    },
    header: {
        paddingHorizontal: 22,
        paddingTop: 18,
        paddingBottom: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        fontFamily: 'Sora_800ExtraBold',
        fontSize: 20,
        letterSpacing: -0.4,
        marginRight: 8,
    },
    badge: {
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 999,
    },
    badgeText: {
        fontFamily: 'Sora_700Bold',
        fontSize: 11,
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabsRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
    },
    tabItem: {
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomWidth: 2,
    },
    tabText: {
        fontFamily: 'Sora_600SemiBold',
        fontSize: 13,
    },
    scrollArea: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 16,
        marginBottom: 12,
    },
    actionLink: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionLinkText: {
        fontFamily: 'Sora_600SemiBold',
        fontSize: 12,
    },
    notificationCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 14,
        borderRadius: 18,
        borderWidth: 1,
        marginBottom: 10,
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    contentCol: {
        flex: 1,
    },
    topMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    notifTitle: {
        fontSize: 14,
        flex: 1,
        marginRight: 8,
        letterSpacing: -0.2,
    },
    timestamp: {
        fontFamily: 'Inter_400Regular',
        fontSize: 11,
    },
    notifMessage: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 8,
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionHint: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 'auto',
    },
    actionHintText: {
        fontFamily: 'Sora_600SemiBold',
        fontSize: 11.5,
        marginRight: 2,
    },
    deleteBtn: {
        paddingLeft: 6,
        paddingTop: 2,
    },
});
