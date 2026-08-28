import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const isAvailable = Platform.OS !== 'web';

export const hapticSelection = () => {
    if (isAvailable) {
        Haptics.selectionAsync().catch(() => {});
    }
};

export const hapticLight = () => {
    if (isAvailable) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
};

export const hapticMedium = () => {
    if (isAvailable) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
};

export const hapticHeavy = () => {
    if (isAvailable) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }
};

export const hapticSuccess = () => {
    if (isAvailable) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
};

export const hapticWarning = () => {
    if (isAvailable) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    }
};

export const hapticError = () => {
    if (isAvailable) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
};
