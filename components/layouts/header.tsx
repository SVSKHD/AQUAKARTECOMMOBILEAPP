import React from 'react';
import { BlurView } from 'expo-blur';
import {
    Image,
    TouchableOpacity,
    StyleSheet,
    View,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { triggerHaptic } from '../../utils/haptics';

type Props = {
    onLogout: () => void;
    headerText?: React.ReactNode;
    headerContent?: React.ReactNode;
    onBack?: () => void;
};

const AquaHeader: React.FC<Props> = ({ onLogout, headerText, headerContent, onBack }) => {
    const insets = useSafeAreaInsets();

    return (
        <View
            pointerEvents="box-none"
            style={styles.wrapper}
        >
            <BlurView
                intensity={40}
                tint="dark"
                style={[
                    styles.glassBar,
                    { paddingTop: insets.top + (Platform.OS === 'android' ? 8 : 0) }
                ]}
            >
                {/* LEFT: Logo or Back Button + Title */}
                <View style={styles.leftWrap}>
                    {onBack && (
                        <TouchableOpacity
                            onPress={() => {
                                triggerHaptic();
                                onBack();
                            }}
                            activeOpacity={0.8}
                            style={[styles.logoCircle, { marginRight: 8 }]}
                        >
                            <Ionicons name="arrow-back" size={20} color="#fff" />
                        </TouchableOpacity>
                    )}

                    <View style={headerText ? styles.titleWrapper : styles.logoCircle}>
                        {headerText ? headerContent : <Image
                            source={require('../../assets/logo-white.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />}
                    </View>
                </View>

                {/* RIGHT: Logout pill button (like your reference right capsule) */}
                <TouchableOpacity
                    onPress={() => {
                        triggerHaptic();
                        onLogout();
                    }}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel="Logout"
                    style={styles.rightPill}
                >
                    <Ionicons name="log-out-outline" size={20} color="rgba(255,255,255,0.92)" />
                </TouchableOpacity>
            </BlurView>
        </View>
    );
};

export default AquaHeader;

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
    },

    glassBar: {
        paddingBottom: 12, // Bottom spacing for content
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',

        // Standard translucent header look
        backgroundColor: 'rgba(0,0,0,0.18)',
        borderBottomWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',

        // Curtain effect (optional - uncomment to make it rounded at bottom)
        // borderBottomLeftRadius: 24,
        // borderBottomRightRadius: 24,

        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOpacity: 0.15,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 8 },
            },
            android: {
                elevation: 8,
            },
        }),
    },

    leftWrap: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    logoCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.10)',
    },

    logo: {
        width: 26,
        height: 26,
        tintColor: 'rgba(255,255,255,0.92)',
    },

    rightPill: {
        height: 44,
        minWidth: 74,
        paddingHorizontal: 16,
        borderRadius: 22,

        alignItems: 'center',
        justifyContent: 'center',

        backgroundColor: 'rgba(0,0,0,0.22)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.10)',
    },

    titleWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
});