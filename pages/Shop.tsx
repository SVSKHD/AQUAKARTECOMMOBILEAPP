// ... imports remain the same, ensuring Haptics and Icons are there
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { triggerHaptic, triggerSelectionHaptic } from '../utils/haptics';
import { fetchProducts } from '../services/products';
import {
  Product,
  getProductImages,
  getProductKey,
  getProductPrice,
  getProductTitle,
  getProductDescription,
} from '../utils/products';
import { useCartStore } from '../store/cartStore';
import { useFavoritesStore } from '../store/favoritesStore';

const LIST_BOTTOM_GUTTER = 112;
const SKELETON_PLACEHOLDERS = Array.from({ length: 6 }, (_, index) => index);
const { width } = Dimensions.get('window');
const CONTENT_PADDING = 20; // Standardized to 20px
const COLUMN_GAP = 12;
const CARD_WIDTH = (width - (CONTENT_PADDING * 2) - COLUMN_GAP) / 2;

function normalizeProducts(payload: unknown): Product[] {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload)) {
    return payload as Product[];
  }

  if (
    typeof payload === 'object' &&
    payload !== null &&
    'data' in payload &&
    Array.isArray((payload as { data: unknown }).data)
  ) {
    return (payload as { data: Product[] }).data;
  }

  if (
    typeof payload === 'object' &&
    payload !== null &&
    'items' in payload &&
    Array.isArray((payload as { items: unknown }).items)
  ) {
    return (payload as { items: Product[] }).items;
  }

  return [];
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const cartItems = useCartStore((state) => state.items);
  const incrementItem = useCartStore((state) => state.incrementItem);
  const favoriteItems = useFavoritesStore((state) => state.items);
  const toggleFavorite = useFavoritesStore((state) => state.toggleItem);

  const loadProducts = useCallback(
    async (isRefresh = false) => {
      if (!isRefresh) {
        setLoading(true);
      }
      setError(null);

      try {
        const response = await fetchProducts();
        const nextProducts = normalizeProducts(response.data);
        setProducts(nextProducts);
      } catch (err) {
        setError('Unable to load products right now. Please try again later.');
      } finally {
        if (isRefresh) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleAddToCart = useCallback(
    (productKey: string, product: Product) => {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      incrementItem(productKey, product);
    },
    [incrementItem]
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadProducts(true);
  }, [loadProducts]);

  const handleToggleFavorite = useCallback(
    (productKey: string, product: Product) => {
      triggerSelectionHaptic();
      toggleFavorite(productKey, product);
    },
    [toggleFavorite]
  );

  const isInitialLoading = loading && products.length === 0;

  const listEmptyComponent = useMemo(() => {
    if (isInitialLoading) {
      return null;
    }

    if (error) {
      return (
        <View style={styles.messageWrapper}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }

    return (
      <View style={styles.messageWrapper}>
        <Text style={styles.emptyText}>No products found.</Text>
      </View>
    );
  }, [isInitialLoading, error]);

  const dataSource = isInitialLoading ? SKELETON_PLACEHOLDERS : products;

  return (
    <FlatList<Product | number>
      data={dataSource}
      style={styles.list}
      numColumns={2}
      columnWrapperStyle={styles.columnWrapper}
      contentContainerStyle={
        dataSource.length === 0
          ? styles.emptyListContainer
          : styles.listContent
      }
      scrollIndicatorInsets={{ bottom: LIST_BOTTOM_GUTTER }}
      keyExtractor={(item, index) =>
        isInitialLoading ? `skeleton-${index}` : getProductKey(item as Product, index)
      }
      renderItem={({ item, index }) => {
        if (isInitialLoading) {
          return <ProductLoadingCard />;
        }

        const product = item as Product;
        const title = getProductTitle(product, index);
        const price = getProductPrice(product);
        const imageUrls = getProductImages(product);
        const hasImages = imageUrls.length > 0;
        const productKey = getProductKey(product, index);
        const isFavorite = Boolean(favoriteItems[productKey]);
        const quantity = cartItems[productKey]?.quantity ?? 0;
        const inCart = quantity > 0;

        return (
          <View style={styles.card}>
            <View style={styles.imageContainer}>
              {hasImages ? (
                <Image
                  source={{ uri: imageUrls[0] }}
                  style={styles.image}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.image, styles.imagePlaceholder]}>
                  <Text style={styles.imagePlaceholderText}>No Image</Text>
                </View>
              )}
              <TouchableOpacity
                onPress={() => handleToggleFavorite(productKey, product)}
                style={styles.favoriteButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={isFavorite ? 'heart' : 'heart-outline'}
                  size={20}
                  color={isFavorite ? '#dc2626' : '#0f172a'}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.cardContent}>
              <Text style={styles.productTitle} numberOfLines={2}>
                {title}
              </Text>

              <View style={styles.priceRow}>
                {price !== null && (
                  <Text style={styles.price}>₹{price.toFixed(0)}</Text>
                )}
                {inCart && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{quantity}</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                onPress={() => handleAddToCart(productKey, product)}
                style={[
                  styles.cartButton,
                  inCart && styles.cartButtonAdded,
                ]}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={inCart ? "add" : "cart-outline"}
                  size={16}
                  color={inCart ? '#0C2B4E' : '#ffffff'}
                />
                <Text
                  style={[
                    styles.cartButtonText,
                    inCart && styles.cartButtonTextAdded,
                  ]}
                  numberOfLines={1}
                >
                  {inCart ? 'Add' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      }}
      refreshing={refreshing}
      onRefresh={handleRefresh}
      ListEmptyComponent={listEmptyComponent}
      ListFooterComponent={
        !isInitialLoading && products.length > 0 ? (
          <View style={styles.footerSpacer} />
        ) : null
      }
    />
  );
}

function ProductLoadingCard() {
  return (
    <View style={[styles.card, styles.skeletonCard]}>
      <View style={[styles.image, styles.skeletonImage]}>
        <ActivityIndicator size="small" color="#0C2B4E" />
      </View>
      <View style={styles.skeletonContent}>
        <View style={[styles.skeletonBlock, styles.skeletonTitle]} />
        <View style={[styles.skeletonBlock, styles.skeletonLine]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingTop: Platform.OS === 'android' ? 16 : 0,
  },
  messageWrapper: {
    paddingVertical: 48,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
  },
  listContent: {
    paddingTop: 140, // Increased spacing for header
    paddingBottom: LIST_BOTTOM_GUTTER,
    paddingHorizontal: CONTENT_PADDING,
    gap: 16,
  },
  list: {
    flex: 1,
  },
  columnWrapper: {
    gap: COLUMN_GAP,
    marginBottom: COLUMN_GAP,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: CONTENT_PADDING,
    paddingBottom: LIST_BOTTOM_GUTTER,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    flex: 1,
    maxWidth: CARD_WIDTH,
    width: CARD_WIDTH,
  },
  skeletonCard: {
    opacity: 0.95,
  },
  skeletonBlock: {
    backgroundColor: '#e2e8f0',
    borderRadius: 6,
  },
  skeletonTitle: {
    width: '80%',
    height: 14,
    marginBottom: 6,
  },
  skeletonImage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonContent: {
    padding: 12,
  },
  skeletonLine: {
    width: '40%',
    height: 12,
  },
  imageContainer: {
    position: 'relative',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 20,
    padding: 6,
  },
  image: {
    width: '100%',
    height: 140,
    backgroundColor: '#f1f5f9',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    color: '#64748b',
    fontSize: 12,
  },
  cardContent: {
    padding: 10,
    gap: 6,
  },
  productTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    lineHeight: 18,
    height: 36, // Fixed height for 2 lines
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0C2B4E',
  },
  badge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0984e3',
  },
  cartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#0C2B4E',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  cartButtonAdded: {
    backgroundColor: '#e2f0ff',
    borderWidth: 1,
    borderColor: '#0C2B4E',
  },
  cartButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  cartButtonTextAdded: {
    color: '#0C2B4E',
  },
  footerSpacer: {
    height: 16,
  },
});
