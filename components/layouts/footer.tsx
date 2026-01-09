import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TouchableOpacity, View, Text, Animated, PanResponder, LayoutChangeEvent } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { triggerHaptic } from '../../utils/haptics';
import { TabKey } from '../types/layout';

type TabConfig = {
    key: TabKey;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    activeIcon: keyof typeof Ionicons.glyphMap;
};

const TABS: TabConfig[] = [
    { key: 'home', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
    { key: 'shop', label: 'Shop', icon: 'pricetags-outline', activeIcon: 'pricetags' },
    { key: 'favorites', label: 'Favorites', icon: 'heart-outline', activeIcon: 'heart' },
    { key: 'cart', label: 'Cart', icon: 'cart-outline', activeIcon: 'cart' },
    { key: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
];

type TabLayout = { x: number; width: number };

const BUBBLE_WIDTH = 74; // tweak
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const AquaFooter = ({
    styles,
    insets,
    activeTab,
    setActiveTab,
    cartCount,
    favoriteCount,
}: {
    styles: any;
    insets: any;
    activeTab: TabKey;
    setActiveTab: (key: TabKey) => void;
    cartCount: number;
    favoriteCount: number;
}) => {
    const [tabLayouts, setTabLayouts] = useState<TabLayout[]>([]);
    const dragging = useRef(false);

    const bubbleX = useRef(new Animated.Value(0)).current;
    const bubbleScale = useRef(new Animated.Value(1)).current;

    const dragStartX = useRef(0);
    const lastPreviewIdx = useRef<number>(0);

    const activeIndex = useMemo(
        () => Math.max(0, TABS.findIndex((t) => t.key === activeTab)),
        [activeTab]
    );

    const onTabLayout = (index: number) => (e: LayoutChangeEvent) => {
        const { x, width } = e.nativeEvent.layout;
        setTabLayouts((prev) => {
            const next = [...prev];
            next[index] = { x, width };
            return next;
        });
    };

    const getCenterX = (i: number) => {
        const l = tabLayouts[i];
        return l ? l.x + l.width / 2 : 0;
    };

    const getMinX = () => {
        if (!tabLayouts.length) return 0;
        const first = tabLayouts[0];
        return first.x + first.width / 2 - BUBBLE_WIDTH / 2;
    };

    const getMaxX = () => {
        if (!tabLayouts.length) return 0;
        const last = tabLayouts[tabLayouts.length - 1];
        return last.x + last.width / 2 - BUBBLE_WIDTH / 2;
    };

    const findNearestIndexFromBubbleCenter = (centerX: number) => {
        if (!tabLayouts.length) return activeIndex;

        let bestIdx = 0;
        let bestDist = Number.POSITIVE_INFINITY;

        for (let i = 0; i < tabLayouts.length; i++) {
            const d = Math.abs(getCenterX(i) - centerX);
            if (d < bestDist) {
                bestDist = d;
                bestIdx = i;
            }
        }
        return bestIdx;
    };

    const snapToIndex = (idx: number, shouldSetActive: boolean) => {
        const l = tabLayouts[idx];
        if (!l) return;

        const targetX = l.x + l.width / 2 - BUBBLE_WIDTH / 2;

        Animated.parallel([
            Animated.spring(bubbleX, {
                toValue: targetX,
                useNativeDriver: true, // ✅ smooth
                bounciness: 7,
                speed: 18,
            }),
            Animated.spring(bubbleScale, {
                toValue: 1,
                useNativeDriver: true,
                speed: 18,
                bounciness: 6,
            }),
        ]).start(() => {
            if (shouldSetActive) {
                const key = TABS[idx].key;
                if (key !== activeTab) {
                    triggerHaptic();
                    setActiveTab(key);
                }
            }
        });
    };

    // keep bubble aligned to active tab when not dragging
    useEffect(() => {
        if (!tabLayouts.length) return;
        if (dragging.current) return;

        lastPreviewIdx.current = activeIndex;
        snapToIndex(activeIndex, false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tabLayouts, activeIndex]);

    const panResponder = useMemo(
        () =>
            PanResponder.create({
                // Don’t steal taps. Only capture when user drags horizontally.
                onStartShouldSetPanResponder: () => false,
                onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
                onMoveShouldSetPanResponderCapture: (_, g) =>
                    Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),

                onPanResponderGrant: () => {
                    if (!tabLayouts.length) return;
                    dragging.current = true;

                    bubbleX.stopAnimation((x: number) => {
                        dragStartX.current = x; // ✅ base X
                    });

                    lastPreviewIdx.current = activeIndex;

                    Animated.spring(bubbleScale, {
                        toValue: 1.06, // “grab” feel
                        useNativeDriver: true,
                        speed: 20,
                        bounciness: 6,
                    }).start();
                },

                onPanResponderMove: (_, g) => {
                    if (!tabLayouts.length) return;

                    const nextX = clamp(dragStartX.current + g.dx, getMinX(), getMaxX());
                    bubbleX.setValue(nextX);

                    const center = nextX + BUBBLE_WIDTH / 2;
                    const nearest = findNearestIndexFromBubbleCenter(center);

                    // preview haptic only when crossing into another tab
                    if (nearest !== lastPreviewIdx.current) {
                        lastPreviewIdx.current = nearest;
                        triggerHaptic();
                    }
                },

                onPanResponderRelease: () => {
                    if (!tabLayouts.length) return;
                    dragging.current = false;

                    bubbleX.stopAnimation((finalX: number) => {
                        const center = finalX + BUBBLE_WIDTH / 2;
                        const nearest = findNearestIndexFromBubbleCenter(center);
                        snapToIndex(nearest, true); // ✅ release sets active
                    });
                },

                onPanResponderTerminate: () => {
                    dragging.current = false;
                    snapToIndex(activeIndex, false);
                },
            }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [tabLayouts, activeIndex]
    );

    return (
        <View
            style={[
                styles.tabBarContainer,
                { paddingBottom: insets.bottom, transform: [{ translateY: 12 }] },
            ]}
            pointerEvents="box-none"
        >
            <BlurView intensity={35} tint="dark" style={styles.tabBar}>
                {/* This wrapper captures drag gestures across the entire bar */}
                <View style={{ flexDirection: 'row', flex: 1 }} {...panResponder.panHandlers}>
                    {/* Bubble underlay */}
                    <Animated.View
                        pointerEvents="none" // ✅ let taps pass to buttons
                        style={[
                            localStyles.bubble,
                            {
                                width: BUBBLE_WIDTH,
                                transform: [{ translateX: bubbleX }, { scale: bubbleScale }],
                            },
                        ]}
                    />

                    {TABS.map((tab, idx) => {
                        const isActive = tab.key === activeTab;

                        return (
                            <TouchableOpacity
                                key={tab.key}
                                onLayout={onTabLayout(idx)}
                                onPress={() => {
                                    triggerHaptic();
                                    setActiveTab(tab.key);
                                    if (tabLayouts.length) snapToIndex(idx, false);
                                }}
                                activeOpacity={0.9}
                                accessibilityRole="button"
                                accessibilityLabel={`${tab.label} tab`}
                                accessibilityState={{ selected: isActive }}
                                style={[styles.tabIconCircle, { flex: 1 }]}
                            >
                                <View style={styles.iconWrapper}>
                                    <Ionicons
                                        name={isActive ? tab.activeIcon : tab.icon}
                                        size={22}
                                        color={isActive ? '#0b1220' : 'rgba(255,255,255,0.92)'}
                                    />

                                    {tab.key === 'cart' && cartCount > 0 && (
                                        <View style={[styles.badge, styles.cartBadge]}>
                                            <Text style={styles.badgeText}>{cartCount}</Text>
                                        </View>
                                    )}

                                    {tab.key === 'favorites' && favoriteCount > 0 && (
                                        <View style={[styles.badge, styles.favBadge]}>
                                            <Text style={styles.badgeText}>{favoriteCount}</Text>
                                        </View>
                                    )}
                                </View>

                                {isActive && <Text style={styles.activeLabel}>{tab.label}</Text>}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </BlurView>
        </View>
    );
};

export default AquaFooter;

const localStyles = {
    bubble: {
        position: 'absolute' as const,
        top: 8,
        bottom: 8,
        left: 0,
        borderRadius: 999,
        backgroundColor: 'rgba(185,167,255,0.26)',
        borderWidth: 1,
        borderColor: 'rgba(185,167,255,0.35)',
    },
};