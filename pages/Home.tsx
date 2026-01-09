import { Ionicons } from '@expo/vector-icons';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { triggerHaptic } from '../utils/haptics';

type HomePageProps = {
  onBrowsePress?: () => void;
};

const highlights = [
  {
    icon: 'water-outline' as const,
    title: 'Purity, Delivered',
    description: 'Premium RO water cans, dispensers, and filters with doorstep delivery on your schedule.',
  },
  {
    icon: 'flash-outline' as const,
    title: 'Fast Refill',
    description: 'Lightning quick restocking so your family never runs out of clean, refreshing water.',
  },
  {
    icon: 'shield-checkmark-outline' as const,
    title: 'Trusted Quality',
    description: 'Certified brands and verified partners ensure every drop meets AquaKart standards.',
  },
];

export default function HomePage({ onBrowsePress }: HomePageProps) {
  return (
    <View style={styles.wrapper}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View>
            <Text style={styles.tagline}>Hydration made effortless</Text>
            <Text style={styles.title}>Welcome to AquaKart</Text>
          </View>
          <Text style={styles.subtitle}>
            Explore curated essentials, schedule refills, and keep every sip crisp, cool, and contaminant-free.
          </Text>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => {
              triggerHaptic();
              if (onBrowsePress) onBrowsePress();
            }}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Browse all products"
          >
            <Text style={styles.ctaText}>Shop All Products</Text>
            <Ionicons name="arrow-forward" size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why AquaKart?</Text>
          <View style={styles.highlightList}>
            {highlights.map((item) => (
              <View key={item.title} style={styles.highlightCard}>
                <View style={styles.highlightIconWrap}>
                  <Ionicons name={item.icon} size={22} color="#0C2B4E" />
                </View>
                <View style={styles.highlightBody}>
                  <Text style={styles.highlightTitle}>{item.title}</Text>
                  <Text style={styles.highlightDescription}>{item.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: 'transparent', // Glass UI
  },
  container: {
    padding: 20,
    paddingTop: 140,    // Increased spacing for header
    paddingBottom: 120, // Space for floating tab bar
    gap: 28,
  },
  hero: {
    backgroundColor: '#0C2B4E',
    borderRadius: 24,
    padding: 24,
    gap: 16,
    shadowColor: '#0C2B4E',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  tagline: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.85)',
  },
  ctaButton: {
    marginTop: 8,
    backgroundColor: '#38bdf8',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  ctaText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',

  },
  highlightList: {
    gap: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  highlightCard: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    width: '48%',
  },
  highlightIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightBody: {
    flex: 1,
    gap: 4,
    alignItems: 'center',
  },
  highlightTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
  },
  highlightDescription: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    textAlign: 'center',
  },
});
