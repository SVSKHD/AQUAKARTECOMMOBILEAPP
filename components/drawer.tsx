import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    Animated,
    PanResponder,
    Pressable,
    Platform,
    Dimensions,
    KeyboardAvoidingView,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
export interface DraggableDrawerProps {
    visible: boolean;
    onClose: () => void;
    title?: string;
    subtitle?: string;
    children?: React.ReactNode;
}

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------
export function DraggableDrawer({
    visible,
    onClose,
    title,
    subtitle,
    children,
}: DraggableDrawerProps) {
    // ------------------------------------------------------------------
    // State & Refs
    // ------------------------------------------------------------------
    // 1. Animated values
    const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // 2. Dragging state ref to avoid re-renders during gestures
    const dragging = useRef(false);

    // ------------------------------------------------------------------
    // Effects
    // ------------------------------------------------------------------
    useEffect(() => {
        if (visible) {
            // Reset
            translateY.setValue(SCREEN_HEIGHT);
            fadeAnim.setValue(0);
            dragging.current = false;

            // Animate In
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
                    speed: 12,
                }),
            ]).start();
        }
    }, [visible, translateY, fadeAnim]);

    // ------------------------------------------------------------------
    // Handlers
    // ------------------------------------------------------------------
    const handleClose = useCallback(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: SCREEN_HEIGHT,
                duration: 250,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onClose();
        });
    }, [fadeAnim, translateY, onClose]);

    // ------------------------------------------------------------------
    // Pan Responder (Drag Logic)
    // ------------------------------------------------------------------
    const panResponder = useRef(
        PanResponder.create({
            // Only capture if user drags down significantly
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, { dy }) => dy > 5,

            onPanResponderGrant: () => {
                dragging.current = true;
                // Optionally extract offset if we want to resume
                translateY.extractOffset();
            },

            onPanResponderMove: (_, { dy }) => {
                // Only allow dragging down (positive dy)
                if (dy > 0) {
                    translateY.setValue(dy);
                }
            },

            onPanResponderRelease: (_, { dy, vy }) => {
                dragging.current = false;
                translateY.flattenOffset();

                // 1. If dragged down far enough (> 150) or flicked fast (> 0.5)
                if (dy > 150 || vy > 0.5) {
                    handleClose();
                } else {
                    // 2. Snap back to open
                    Animated.spring(translateY, {
                        toValue: 0,
                        useNativeDriver: true,
                        bounciness: 4,
                    }).start();
                }
            },
        })
    ).current;

    // ------------------------------------------------------------------
    // Render
    // ------------------------------------------------------------------
    if (!visible) return null;

    return (
        <Modal
            transparent
            visible={visible}
            onRequestClose={handleClose}
            animationType="none"
            statusBarTranslucent
        >
            {/* Backdrop */}
            <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
                <Pressable style={styles.backdropPressable} onPress={handleClose} />
            </Animated.View>

            {/* Drawer Container */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.container}
                pointerEvents="box-none"
            >
                <Animated.View
                    style={[
                        styles.drawerSheet,
                        {
                            transform: [{ translateY }],
                        },
                    ]}
                >
                    {/* Drag Handle Area */}
                    <View
                        style={styles.handleContainer}
                        {...panResponder.panHandlers}
                    >
                        <View style={styles.handleIndicator} />
                    </View>

                    {/* Header Content */}
                    <View style={styles.header}>
                        {title && <Text style={styles.title}>{title}</Text>}
                        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                    </View>

                    {/* Content */}
                    <View style={styles.content}>{children}</View>
                </Animated.View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

// ------------------------------------------------------------------
// Styles
// ------------------------------------------------------------------
const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
    },
    backdropPressable: {
        flex: 1,
    },
    container: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    drawerSheet: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '92%',
        paddingBottom: Platform.OS === 'ios' ? 34 : 24, // Safe area / bottom padding
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    handleContainer: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: 12,
        // Increase hit slop for easier grabbing
        backgroundColor: 'transparent',
    },
    handleIndicator: {
        width: 40,
        height: 5,
        borderRadius: 3,
        backgroundColor: '#CBD5E1',
    },
    header: {
        paddingHorizontal: 24,
        paddingBottom: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 20,
    },
    content: {
        flexShrink: 1, // Allow content to shrink if needed
    },
});
