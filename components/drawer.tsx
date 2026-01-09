import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
    Animated,
    Modal,
    PanResponder,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { triggerHaptic } from '../utils/haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type DraggableDrawerProps = {
    visible: boolean;
    onClose: () => void;

    title?: string;
    subtitle?: string;

    // Primary action in header
    onDone?: () => void;
    doneLabel?: string; // default 'Done'

    children: React.ReactNode;

    // Drag-to-close tuning
    closeDy?: number; // default 150
    closeVy?: number; // default 0.5

    // Optional bottom close button (inside drawer)
    showBottomCloseButton?: boolean;
    bottomCloseLabel?: string;

    // style overrides if you want
    containerStyle?: ViewStyle;
    shellStyle?: ViewStyle;
};

export function DraggableDrawer({
    visible,
    onClose,
    title,
    subtitle,
    onDone,
    doneLabel = 'Done',
    children,
    closeDy = 150,
    closeVy = 0.5,
    showBottomCloseButton = false,
    bottomCloseLabel = 'Close',
    containerStyle,
    shellStyle,
}: DraggableDrawerProps) {
    const translateY = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const dragging = useRef(false);

    useEffect(() => {
        if (!visible) return;

        translateY.setValue(600);
        fadeAnim.setValue(0);
        dragging.current = false;

        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                bounciness: 4,
            }),
        ]).start();
    }, [visible, fadeAnim, translateY]);

    const handleClose = useCallback(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 800,
                duration: 250,
                useNativeDriver: true,
            }),
        ]).start(() => onClose());
    }, [fadeAnim, translateY, onClose]);

    const panResponder = useMemo(
        () =>
            PanResponder.create({
                onStartShouldSetPanResponder: () => true,
                onMoveShouldSetPanResponder: (_, { dy }) => dy > 10,
                onPanResponderGrant: () => {
                    dragging.current = true;
                },
                onPanResponderMove: (_, { dy }) => {
                    if (dy > 0) translateY.setValue(dy);
                },
                onPanResponderRelease: (_, { dy, vy }) => {
                    dragging.current = false;
                    if (dy > closeDy || vy > closeVy) {
                        handleClose();
                    } else {
                        Animated.spring(translateY, {
                            toValue: 0,
                            useNativeDriver: true,
                        }).start();
                    }
                },
            }),
        [closeDy, closeVy, handleClose, translateY],
    );

    if (!visible) return null;

    return (
        <Modal visible={visible} transparent onRequestClose={handleClose}>
            {/* Backdrop */}
            <Animated.View style={[styles.drawerBackdrop, { opacity: fadeAnim }]}>
                <Pressable style={styles.backdropPressable} onPress={handleClose} />
            </Animated.View>

            {/* Drawer */}
            <Animated.View
                style={[
                    styles.drawerContainer,
                    containerStyle,
                    {
                        position: 'absolute',
                        bottom: 0,
                        transform: [{ translateY }],
                    },
                ]}
            >
                <LinearGradient
                    colors={['#24243e', '#302b63', '#0f0c29']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.drawerShell, shellStyle]}
                >
                    {/* Content (Scrollable area) - First so it sits behind header */}
                    <View style={styles.drawerContent}>{children}</View>

                    {/* Header (Absolute Overlay with Blur) */}
                    <BlurView intensity={30} tint="dark" style={styles.headerAbsolute}>
                        {/* Handle (draggable - increased hit slop area) */}
                        <View style={styles.handleContainer} {...panResponder.panHandlers}>
                            <View style={styles.drawerHandle} />
                        </View>

                        {/* Header Row */}
                        <View style={styles.headerRow}>
                            {!!title && (
                                <Text style={styles.drawerTitle} numberOfLines={1}>
                                    {title}
                                </Text>
                            )}

                            <View style={styles.headerActions}>
                                {onDone && (
                                    <TouchableOpacity
                                        style={styles.doneButton}
                                        onPress={() => {
                                            triggerHaptic();
                                            onDone();
                                        }}
                                        accessibilityRole="button"
                                        accessibilityLabel={doneLabel}
                                    >
                                        <Text style={styles.doneButtonText}>{doneLabel}</Text>
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity
                                    style={styles.headerCloseBtn}
                                    onPress={() => {
                                        triggerHaptic();
                                        handleClose();
                                    }}
                                    accessibilityRole="button"
                                    accessibilityLabel="Close drawer"
                                >
                                    <Ionicons name="close" size={22} color="#ffffff" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Subtitle */}
                        {!!subtitle && <Text style={styles.drawerSubtitle}>{subtitle}</Text>}
                    </BlurView>

                    {/* Bottom close button (optional) */}
                    {showBottomCloseButton ? (
                        <TouchableOpacity style={styles.bottomCloseBtn} onPress={handleClose}>
                            <Text style={styles.bottomCloseText}>{bottomCloseLabel}</Text>
                        </TouchableOpacity>
                    ) : null}
                </LinearGradient>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    drawerBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(2,6,23,0.55)',
    },
    backdropPressable: { flex: 1 },

    drawerContainer: {
        left: 0,
        right: 0,
    },

    drawerShell: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        // backgroundColor removed, handled by LinearGradient
        overflow: 'hidden',
        height: SCREEN_HEIGHT * 0.75,
    },
    headerAbsolute: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        borderBottomWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },

    handleContainer: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: 10,
    },
    drawerHandle: {
        width: 100,
        height: 5,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.4)', // Increased visibility
    },
    drawerContent: {
        padding: 20,
        flex: 1,
        // Padding top is handled by the consumer (e.g. Profile.tsx) 
        // passing contentContainerStyle={{ paddingTop: X }} 
        // to avoid clipping initial content behind absolute header.
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 4,
        gap: 12,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    drawerTitle: {
        fontSize: 30,
        fontWeight: '700',
        color: '#fff',
        flex: 1,
    },
    doneButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: '#38bdf8', // Light blue accent
    },
    doneButtonText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#ffffff',
    },
    headerCloseBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.1)', // Light glass background
        alignItems: 'center',
        justifyContent: 'center',
    },

    drawerSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.6)',
        paddingHorizontal: 20,
        paddingBottom: 16, // Increased padding
        lineHeight: 18,
    },

    bottomCloseBtn: {
        marginTop: 10,
        marginHorizontal: 18,
        borderRadius: 14,
        paddingVertical: 12,
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.12)',
    },
    bottomCloseText: {
        color: '#fff',
        fontWeight: '800',
    },
});