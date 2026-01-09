// App.tsx
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AuthPage from './pages/Auth';
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { TabKey } from './components/types/layout';
import { LinearGradient } from 'expo-linear-gradient';
import MainLayout from './components/layouts/mainlayout';





export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <LinearGradient
          colors={['#24243e', '#302b63', '#0f0c29']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />

        {isAuthenticated ? (
          <MainLayout onLogout={() => setIsAuthenticated(false)} styles={styles} />
        ) : (
          <AuthPage onLoginSuccess={() => setIsAuthenticated(true)} />
        )}
      </View>

      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}



const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    // paddingTop removed to allow scroll behind header
  },

  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  // Legacy header style removed as it is handled in header.tsx
  logo: {
    width: 100,
    height: 32,
    tintColor: '#FFFFFF', // White for dark glass
  },
  logoutButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  tabBarContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
  },

  tabBar: {
    width: '100%',
    maxWidth: 420,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(0,0,0,0.35)',

    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 18,
      },
      android: { elevation: 18 },
    }),
  },

  tabIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabActivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,

    height: 56,
    paddingHorizontal: 18,
    borderRadius: 999,

    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  activeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B9A7FF',
  },

  iconWrapper: {
    position: 'relative',
  },

  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  cartBadge: {
    backgroundColor: '#0C2B4E',
  },
  favBadge: {
    backgroundColor: '#ef4444',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
    paddingHorizontal: 2,
  },
});