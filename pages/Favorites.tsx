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
        <Ionicons name="heart-outline" size={44} color="#0C2B4E" />
        <Text style={styles.emptyTitle}>No favourites yet</Text>
        <Text style={styles.emptySubtitle}>
          Tap the heart icon on any product to save it here for quick access.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Favourites</Text>
          <Text style={styles.subtitle}>
            {entries.length} saved item{entries.length > 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            clearFavorites();
          }}
          style={styles.clearButton}
          accessibilityRole="button"
          accessibilityLabel="Clear favourites"
          activeOpacity={0.85}
        >
          <Ionicons name="trash-outline" size={18} color="#0C2B4E" />
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={entries}
        keyExtractor={(item, index) => item.key ?? `favorite-${index}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        scrollIndicatorInsets={{ bottom: LIST_BOTTOM_GUTTER }}
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
    <View style={styles.card}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.thumbnail} />
      ) : (
        <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
          <Ionicons name="image-outline" size={20} color="#64748b" />
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
                <Ionicons name="checkmark-circle" size={16} color="#0C2B4E" />
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
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
              color={inCart ? '#0C2B4E' : '#ffffff'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButtonSecondary}
            onPress={() => {
              Haptics.selectionAsync();
              onRemove(key);
            }}
            accessibilityRole="button"
            accessibilityLabel="Remove item from favourites"
            activeOpacity={0.85}
          >
            <Ionicons name="trash-outline" size={20} color="#dc2626" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#475569',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fee2e2',
    borderRadius: 999,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listContent: {
    paddingHorizontal: 4,
    gap: 12,
    paddingBottom: 24,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    gap: 16,
    alignItems: 'center',
  },
  thumbnail: {
    width: 70,
    height: 70,
    borderRadius: 14,
    backgroundColor: '#e2e8f0',
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
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0C2B4E',
  },
  inCartBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  inCartText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0C2B4E',
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
    backgroundColor: '#0C2B4E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0C2B4E',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  iconButtonPrimaryAdded: {
    backgroundColor: '#e0f2fe',
    shadowOpacity: 0.1,
  },
  iconButtonSecondary: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fff1f2',
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
    color: '#0f172a',
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 21,
  },
});
