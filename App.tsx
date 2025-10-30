import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HomePage from './pages/Home';
import ShopPage from './pages/Shop';
import CartPage from './pages/Cart';
import ProfilePage from './pages/Profile';
import FavoritesPage from './pages/Favorites';
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { selectCartCount, useCartStore } from './store/cartStore';
import { selectFavoriteCount, useFavoritesStore } from './store/favoritesStore';


type TabKey = 'home' | 'shop' | 'favorites' | 'cart' | 'profile';

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

export default function App() {
  return (
    <SafeAreaProvider>
      <TabLayout />
    </SafeAreaProvider>
  );
}

function TabLayout() {
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const insets = useSafeAreaInsets();
  const cartCount = useCartStore(selectCartCount);
  const favoriteCount = useFavoritesStore(selectFavoriteCount);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <View style={styles.content}>
          {activeTab === 'home' && (
            <HomePage onBrowsePress={() => setActiveTab('shop')} />
          )}
          {activeTab === 'shop' && <ShopPage />}
          {activeTab === 'favorites' && <FavoritesPage />}
          {activeTab === 'cart' && <CartPage />}
          {activeTab === 'profile' && <ProfilePage />}
        </View>
        <View style={[styles.tabBarContainer, { paddingBottom: insets.bottom + 8 }]}>
          <View style={styles.tabBar}>
            {TABS.map((tab) => {
              const isActive = tab.key === activeTab;

              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tabButton, isActive && styles.tabButtonActive]}
                  onPress={() => setActiveTab(tab.key)}
                  accessibilityRole="button"
                  accessibilityLabel={`${tab.label} tab`}
                  accessibilityState={{ selected: isActive }}
                  activeOpacity={0.85}
                >
                  <View style={styles.iconWrapper}>
                    <Ionicons
                      name={isActive ? tab.activeIcon : tab.icon}
                      size={24}
                      color="#ffffff"
                      style={isActive ? undefined : styles.inactiveIcon}
                    />
                    {tab.key === 'cart' && cartCount > 0 && (
                      <View style={[styles.badge, styles.cartBadge]}>
                        <Text style={styles.badgeText}>{cartCount}</Text>
                      </View>
                    )}
                    {tab.key === 'favorites' && favoriteCount > 0 && (
                      <View style={[styles.badge, styles.favoriteBadge]}>
                        <Text style={styles.badgeText}>{favoriteCount}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  tabBarContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0C2B4E',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    columnGap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  inactiveIcon: {
    opacity: 0.7,
  },
  iconWrapper: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -10,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadge: {
    backgroundColor: '#f97316',
  },
  favoriteBadge: {
    backgroundColor: '#f472b6',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
});
