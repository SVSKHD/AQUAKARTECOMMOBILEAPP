import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { triggerHaptic, triggerNotificationHaptic, triggerSelectionHaptic } from '../utils/haptics';
import { useFavoritesStore } from '../store/favoritesStore';
import { Product, getProductImages, getProductTitle, getProductPrice } from '../utils/products';
import { useCartStore } from '../store/cartStore';

const LIST_BOTTOM_GUTTER = 112;

export default function FavoritesPage() {
  const favoritesMap = useFavoritesStore((state) => state.items);
  const removeFavorite = useFavoritesStore((state) => state.removeItem);
  const clearFavorites = useFavoritesStore((state) => state.clear);
  const incrementCartItem = useCartStore((state) => state.incrementItem);
  const cartItems = useCartStore((state) => state.items);

  const entries = useMemo(() => {
    return Object.entries(favoritesMap).map(([key, product]) => ({
      key,
      product,
    }));
  }, [favoritesMap]);

  if (entries.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="heart-outline" size={44} color="rgba(255,255,255,0.4)" />
        <Text style={styles.emptyTitle}>No favourites yet</Text>
        <Text style={styles.emptySubtitle}>
          Tap the heart icon on any product to save it here for quick access.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={entries}
        keyExtractor={(item, index) => item.key ?? `favorite-${index}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        scrollIndicatorInsets={{ top: 90, bottom: LIST_BOTTOM_GUTTER }}
        ListHeaderComponent={
          <View style={styles.header}>
            <View>
              {/* Title moved to global header */}
              <Text style={styles.subtitle}>
                {entries.length} saved item{entries.length > 1 ? 's' : ''}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                triggerNotificationHaptic(Haptics.NotificationFeedbackType.Warning);
                clearFavorites();
              }}
              style={styles.clearButton}
              accessibilityRole="button"
              accessibilityLabel="Clear favourites"
              activeOpacity={0.85}
            >
              <Ionicons name="trash-outline" size={18} color="#fca5a5" />
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item, index }) => (
          <FavoriteCard
            entry={item}
            index={index}
            onRemove={removeFavorite}
            onAddToCart={incrementCartItem}
            inCart={Boolean(cartItems[item.key])}
          />
        )}
        ListFooterComponent={<View style={{ height: LIST_BOTTOM_GUTTER }} />}
      />
    </View>
  );
}

type FavoriteEntry = {
  key: string;
  product: Product;
};

type FavoriteCardProps = {
  entry: FavoriteEntry;
  index: number;
  onRemove: (key: string) => void;
  onAddToCart: (key: string, product: Product) => void;
  inCart: boolean;
};

function FavoriteCard({ entry, index, onRemove, onAddToCart, inCart }: FavoriteCardProps) {
  const { key, product } = entry;
  const images = getProductImages(product);
  const imageUri = images[0] ?? null;
  const title = getProductTitle(product, index);
  const price = getProductPrice(product);

  return (
    <BlurView intensity={20} tint="dark" style={styles.card}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.thumbnail} />
      ) : (
        <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
          <Ionicons name="image-outline" size={20} color="rgba(255,255,255,0.5)" />
        </View>
      )}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {title}
        </Text>
        {(price !== null || inCart) && (
          <View style={styles.metaRow}>
            {price !== null && (
              <Text style={styles.cardPrice}>₹{price.toFixed(2)}</Text>
            )}
            {inCart && (
              <View style={styles.inCartBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#ffffff" />
                <Text style={styles.inCartText}>In Cart</Text>
              </View>
            )}
          </View>
        )}
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[
              styles.iconButtonPrimary,
              inCart && styles.iconButtonPrimaryAdded,
            ]}
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
              onAddToCart(key, product);
            }}
            accessibilityRole="button"
            accessibilityLabel={
              inCart
                ? 'Already in cart. Tap to add another.'
                : 'Add favourite item to cart'
            }
            activeOpacity={0.85}
          >
            <Ionicons
              name={inCart ? 'checkmark' : 'cart-outline'}
              size={20}
              color={inCart ? '#ffffff' : '#ffffff'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButtonSecondary}
            onPress={() => {
              triggerSelectionHaptic();
              onRemove(key);
            }}
            accessibilityRole="button"
            accessibilityLabel="Remove item from favourites"
            activeOpacity={0.85}
          >
            <Ionicons name="trash-outline" size={20} color="#fca5a5" />
          </TouchableOpacity>
        </View>
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 20, // Standardized
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12, // Reduced from 24
  },

  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fca5a5',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listContent: {
    paddingHorizontal: 0,
    gap: 12,
    paddingTop: 140, // Increased spacing for header
    paddingBottom: 40,
  },
  card: {
    flexDirection: 'row',
    // backgroundColor removed, using BlurView
    borderRadius: 16, // Standardized from 18
    padding: 14,
    overflow: 'hidden',
    borderWidth: 1, // Added border
    borderColor: 'rgba(255,255,255,0.1)', // Added border color
    gap: 16,
    alignItems: 'center',
  },
  thumbnail: {
    width: 72, // Match Cart 72
    height: 72, // Match Cart 72
    borderRadius: 12, // Standardized from 14
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  thumbnailPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    gap: 8,
  },
  cardTitle: {
    fontSize: 17, // Match Cart 17 (was 16)
    fontWeight: '600',
    color: '#ffffff',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardPrice: {
    fontSize: 15, // Match Cart Quantity Text approx or Keep as is? Cart uses 14/15. 15 is good.
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  inCartBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  inCartText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
  },
  iconButtonPrimary: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#38bdf8', // Light blue accent
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonPrimaryAdded: {
    backgroundColor: 'rgba(56, 189, 248, 0.3)', // Dimmed when added
  },
  iconButtonSecondary: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
  },
  emptySubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 21,
  },
});
