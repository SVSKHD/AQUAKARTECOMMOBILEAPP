import * as Haptics from 'expo-haptics';

export const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    Haptics.impactAsync(style).catch(() => {
        // Ignore errors on unsupported devices
    });
};

export const triggerSelectionHaptic = () => {
    Haptics.selectionAsync().catch(() => { });
};

export const triggerNotificationHaptic = (type: Haptics.NotificationFeedbackType) => {
    Haptics.notificationAsync(type).catch(() => { });
};
