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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { fetchProducts } from '../services/products';
import {
  Product,
  getProductDescription,
  getProductImages,
  getProductKey,
  getProductPrice,
  getProductTitle,
} from '../utils/products';
import { useCartStore } from '../store/cartStore';
import { useFavoritesStore } from '../store/favoritesStore';

const LIST_BOTTOM_GUTTER = 112;

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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
      Haptics.selectionAsync();
      toggleFavorite(productKey, product);
    },
    [toggleFavorite]
  );

  const listEmptyComponent = useMemo(() => {
    if (loading) {
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
  }, [loading, error]);

  if (loading) {
    return (
      <View style={styles.loaderWrapper}>
        <ActivityIndicator size="large" color="#0C2B4E" />
        <Text style={styles.loaderText}>Loading products...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={products}
      style={styles.list}
      scrollIndicatorInsets={{ bottom: LIST_BOTTOM_GUTTER }}
      keyExtractor={(item, index) =>
        getProductKey(item, index)
      }
      renderItem={({ item, index }) => {
        const title = getProductTitle(item, index);
        const price = getProductPrice(item);
        const imageUrls = getProductImages(item);
        const description = getProductDescription(item);
        const hasImages = imageUrls.length > 0;
        const productKey = getProductKey(item, index);
        const isFavorite = Boolean(favoriteItems[productKey]);
        const quantity = cartItems[productKey]?.quantity ?? 0;
        const inCart = quantity > 0;

        return (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.productTitle} numberOfLines={1}>
                {title}
              </Text>
              <TouchableOpacity
                onPress={() => handleToggleFavorite(productKey, item)}
                accessibilityRole="button"
                accessibilityLabel={
                  isFavorite ? 'Remove from favourites' : 'Add to favourites'
                }
                style={styles.favoriteButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={isFavorite ? 'heart' : 'heart-outline'}
                  size={22}
                  color={isFavorite ? '#dc2626' : '#0f172a'}
                />
              </TouchableOpacity>
            </View>
            {hasImages ? (
              <ProductCarousel images={imageUrls} />
            ) : (
              <View style={[styles.image, styles.imagePlaceholder]}>
                <Text style={styles.imagePlaceholderText}>No Image</Text>
              </View>
            )}
            <View style={styles.cardContent}>
              <Text style={styles.description} numberOfLines={2}>
                {description}
              </Text>
              {price !== null && (
                <Text style={styles.price}>₹{price.toFixed(2)}</Text>
              )}
              <View style={styles.cardFooter}>
                <TouchableOpacity
                  onPress={() => handleAddToCart(productKey, item)}
                  style={[
                    styles.cartButton,
                    inCart && styles.cartButtonAdded,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={
                    inCart ? 'Add one more to cart' : 'Add to cart'
                  }
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="cart-outline"
                    size={18}
                    color={inCart ? '#0C2B4E' : '#ffffff'}
                  />
                  <Text
                    style={[
                      styles.cartButtonText,
                      inCart && styles.cartButtonTextAdded,
                    ]}
                  >
                    {inCart ? `Add More (${quantity})` : 'Add to Cart'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      }}
      contentContainerStyle={
        products.length === 0
          ? styles.emptyListContainer
          : styles.listContent
      }
      refreshing={refreshing}
      onRefresh={handleRefresh}
      ListEmptyComponent={listEmptyComponent}
      ListFooterComponent={<View style={styles.footerSpacer} />}
    />
  );
}

function ProductCarousel({ images }: { images: string[] }) {
  return (
    <ScrollView
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      style={styles.carousel}
      contentContainerStyle={styles.carouselContent}
    >
      {images.map((uri, index) => (
        <Image
          key={`${uri}-${index}`}
          source={{ uri }}
          style={styles.image}
          resizeMode="cover"
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loaderWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loaderText: {
    fontSize: 16,
    color: '#0f172a',
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
    paddingTop: 12,
    paddingBottom: LIST_BOTTOM_GUTTER,
    paddingHorizontal: 12,
    gap: 12,
  },
  list: {
    flex: 1,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: LIST_BOTTOM_GUTTER,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
    marginHorizontal: 4,
  },
  cardHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  favoriteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: '#e2e8f0',
  },
  carousel: {
    width: '100%',
  },
  carouselContent: {
    flexGrow: 1,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    color: '#64748b',
    fontSize: 14,
  },
  cardContent: {
    padding: 16,
    paddingTop: 12,
    gap: 8,
  },
  productTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  description: {
    fontSize: 14,
    color: '#475569',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0C2B4E',
    marginTop: 8,
  },
  cardFooter: {
    marginTop: 12,
    width: '100%',
  },
  cartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#0C2B4E',
    paddingVertical: 10,
    paddingHorizontal: 18,
    gap: 8,
  },
  cartButtonAdded: {
    backgroundColor: '#e2f0ff',
    borderWidth: 1,
    borderColor: '#0C2B4E',
  },
  cartButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  cartButtonTextAdded: {
    color: '#0C2B4E',
  },
  footerSpacer: {
    height: 16,
  },
});
