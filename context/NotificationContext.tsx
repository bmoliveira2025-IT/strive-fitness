import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type NotificationType = 'achievement' | 'recovery' | 'consistency' | 'system' | 'pr' | 'workout' | 'goal';
export type NotificationPriority = 'low' | 'medium' | 'high';

export interface Notification {
    id: string;
    type: NotificationType;
    priority?: NotificationPriority;
    title: string;
    message: string;
    timestamp: number;
    isRead: boolean;
    route?: string;
    actionLabel?: string;
    data?: any;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    addNotification: (
        type: NotificationType,
        title: string,
        message: string,
        data?: any,
        priority?: NotificationPriority,
        route?: string,
        actionLabel?: string
    ) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    deleteNotification: (id: string) => void;
    clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const STORAGE_KEY = 'strive_notifications';

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    // Load notifications on mount
    useEffect(() => {
        const loadNotifications = async () => {
            try {
                const stored = await AsyncStorage.getItem(STORAGE_KEY);
                if (stored) {
                    setNotifications(JSON.parse(stored));
                } else {
                    // Add initial welcome notification
                    const welcome: Notification = {
                        id: 'welcome',
                        type: 'system',
                        priority: 'low',
                        title: 'Bem-vindo ao Strive!',
                        message: 'Sua jornada com foco e consistência começa aqui. Registre seus treinos e acompanhe sua evolução.',
                        timestamp: Date.now(),
                        isRead: false
                    };
                    setNotifications([welcome]);
                    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([welcome]));
                }
            } catch (error) {
                console.error('Error loading notifications:', error);
            }
        };

        loadNotifications();
    }, []);

    // Save notifications whenever they change
    const saveNotifications = async (newNotifications: Notification[]) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newNotifications));
        } catch (error) {
            console.error('Error saving notifications:', error);
        }
    };

    const addNotification = (
        type: NotificationType,
        title: string,
        message: string,
        data?: any,
        priority: NotificationPriority = 'low',
        route?: string,
        actionLabel?: string
    ) => {
        const newNotification: Notification = {
            id: Date.now().toString(),
            type,
            priority,
            title,
            message,
            timestamp: Date.now(),
            isRead: false,
            route,
            actionLabel,
            data
        };
        const updated = [newNotification, ...notifications];
        setNotifications(updated);
        saveNotifications(updated);
    };

    const markAsRead = (id: string) => {
        const updated = notifications.map(n =>
            n.id === id ? { ...n, isRead: true } : n
        );
        setNotifications(updated);
        saveNotifications(updated);
    };

    const markAllAsRead = () => {
        const updated = notifications.map(n => ({ ...n, isRead: true }));
        setNotifications(updated);
        saveNotifications(updated);
    };

    const deleteNotification = (id: string) => {
        const updated = notifications.filter(n => n.id !== id);
        setNotifications(updated);
        saveNotifications(updated);
    };

    const clearAll = () => {
        setNotifications([]);
        saveNotifications([]);
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            addNotification,
            markAsRead,
            markAllAsRead,
            deleteNotification,
            clearAll
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
