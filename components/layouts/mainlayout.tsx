import { useState } from 'react';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity } from 'react-native';

import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { selectCartCount, useCartStore } from '../../store/cartStore';
import { selectFavoriteCount, useFavoritesStore } from '../../store/favoritesStore';
import { triggerHaptic } from '../../utils/haptics';

import { TabKey } from '../types/layout';
import AquaHeader from './header';
import AquaFooter from './footer';

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

function MainLayout({ onLogout, styles }: { onLogout: () => void; styles: any }) {
    const [activeTab, setActiveTab] = useState<TabKey>('home');
    const insets = useSafeAreaInsets();
    const cartCount = useCartStore(selectCartCount);
    const favoriteCount = useFavoritesStore(selectFavoriteCount);

    return (
        // ✅ SafeAreaView should own edges + flex
        <SafeAreaView style={{ flex: 1 }} edges={[]}>
            {/* ✅ Gradient fills screen (LinearGradient is NOT a SafeAreaView) */}
            <LinearGradient
                colors={['#24243e', '#302b63', '#0f0c29']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ flex: 1 }}
            >
                {/* Header */}
                <View style={styles.headerContainer}>
                    <AquaHeader
                        onLogout={onLogout}
                        headerText={activeTab === 'cart' || activeTab === 'favorites' || activeTab === 'shop'}
                        onBack={activeTab !== 'home' ? () => setActiveTab('home') : undefined}
                        headerContent={
                            <Text style={{ fontSize: 20, fontWeight: '700', color: '#fff', letterSpacing: 0.5 }}>
                                {activeTab === 'cart' ? 'Cart' : activeTab === 'favorites' ? 'Favourites' : activeTab === 'shop' ? 'Shop' : ''}
                            </Text>
                        }
                    />
                </View>

                {/* Content */}
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

                {/* Bottom Nav */}
                <AquaFooter styles={styles} insets={insets} activeTab={activeTab} setActiveTab={setActiveTab} cartCount={cartCount} favoriteCount={favoriteCount} />
            </LinearGradient>
        </SafeAreaView>
    );
}

export default MainLayout;