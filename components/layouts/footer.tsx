import {
    TouchableOpacity,
    View,
    Text
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

const AquaFooter = ({ styles, insets, activeTab, setActiveTab, cartCount, favoriteCount }: { styles: any, insets: any, activeTab: TabKey, setActiveTab: (key: TabKey) => void, cartCount: number, favoriteCount: number }) => {
    return (
        <View
            style={[
                styles.tabBarContainer,
                {
                    paddingBottom: insets.bottom,
                    transform: [{ translateY: 12 }], // ✅ closer to home bar (12 is safer than 19)
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
    )
}
export default AquaFooter