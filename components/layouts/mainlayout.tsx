import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { selectCartCount, useCartStore } from '../../store/cartStore';
import { selectFavoriteCount, useFavoritesStore } from '../../store/favoritesStore';
import { triggerHaptic } from '../../utils/haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Image, TouchableOpacity, View, Text } from 'react-native';
import { TabKey } from "../types/layout"

import HomePage from '../../pages/Home';
import ShopPage from '../../pages/Shop';
import FavoritesPage from '../../pages/Favorites';
import CartPage from '../../pages/Cart';
import ProfilePage from '../../pages/Profile';

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




function MainLayout({ onLogout, styles }: { onLogout: () => void, styles: any }) {
    const [activeTab, setActiveTab] = useState<TabKey>('home');
    const insets = useSafeAreaInsets();
    const cartCount = useCartStore(selectCartCount);
    const favoriteCount = useFavoritesStore(selectFavoriteCount);

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.headerContainer}>
                <BlurView intensity={30} tint="dark" style={styles.header}>
                    <Image
                        source={require('../../assets/logo-white.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />

                    <TouchableOpacity
                        onPress={() => {
                            triggerHaptic();
                            onLogout();
                        }}
                        style={styles.logoutButton}
                        activeOpacity={0.9}
                        accessibilityRole="button"
                        accessibilityLabel="Logout"
                    >
                        <Ionicons name="log-out-outline" size={20} color="#B9A7FF" />
                    </TouchableOpacity>
                </BlurView>
            </View>

            <View style={styles.content}>
                <Animated.View
                    key={activeTab}
                    entering={FadeIn.duration(280).springify()}
                    exiting={FadeOut.duration(180)}
                    style={{ flex: 1 }}
                >
                    {activeTab === 'home' && <HomePage onBrowsePress={() => setActiveTab('shop')} />}
                    {activeTab === 'shop' && <ShopPage />}
                    {activeTab === 'favorites' && <FavoritesPage />}
                    {activeTab === 'cart' && <CartPage />}
                    {activeTab === 'profile' && <ProfilePage />}
                </Animated.View>
            </View>

            {/* Bottom Nav (iOS pill style + safe above home indicator) */}
            <View
                style={[
                    styles.tabBarContainer,
                    {
                        paddingBottom: insets.bottom,   // keep safe-area correct
                        transform: [{ translateY: 19 }], // 👈 pulls bar DOWN closer to home bar
                    },
                ]}
                pointerEvents="box-none"
            >
                <BlurView intensity={35} tint="dark" style={styles.tabBar}>
                    {TABS.map((tab) => {
                        const isActive = tab.key === activeTab;

                        return (
                            <TouchableOpacity
                                key={tab.key}
                                onPress={() => {
                                    triggerHaptic();
                                    setActiveTab(tab.key);
                                }}
                                activeOpacity={0.9}
                                accessibilityRole="button"
                                accessibilityLabel={`${tab.label} tab`}
                                accessibilityState={{ selected: isActive }}
                                style={isActive ? styles.tabActivePill : styles.tabIconCircle}
                            >
                                <View style={styles.iconWrapper}>
                                    <Ionicons
                                        name={isActive ? tab.activeIcon : tab.icon}
                                        size={22}
                                        color={isActive ? '#B9A7FF' : 'rgba(255,255,255,0.92)'}
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
                </BlurView>
            </View>
        </SafeAreaView>
    );
}
export default MainLayout;