import { useCallback, useMemo } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  Product,
  getProductImages,
  getProductPrice,
  getProductTitle,
} from '../utils/products';
import { useCartStore } from '../store/cartStore';

const LIST_BOTTOM_GUTTER = 112;

export default function CartPage() {
  const itemsMap = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clear);
  const incrementItem = useCartStore((state) => state.incrementItem);
  const decrementItem = useCartStore((state) => state.decrementItem);
  const removeItem = useCartStore((state) => state.removeItem);

  const entries = useMemo<CartEntry[]>(() => {
    return Object.entries(itemsMap).map(([key, entry]) => ({
      key,
      product: entry.product,
      quantity: entry.quantity,
    }));
  }, [itemsMap]);

  const handleIncrement = useCallback(
    (key: string, product: Product) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      incrementItem(key, product);
    },
    [incrementItem]
  );

  const handleDecrement = useCallback(
    (key: string) => {
      Haptics.selectionAsync();
      decrementItem(key);
    },
    [decrementItem]
  );

  const handleRemove = useCallback(
    (key: string) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      removeItem(key);
    },
    [removeItem]
  );

  const handleClearCart = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    clearCart();
  }, [clearCart]);

  const itemCount = entries.reduce((sum, entry) => sum + entry.quantity, 0);

  const subtotal = useMemo(() => {
    return entries.reduce((sum, entry) => {
      const price = getProductPrice(entry.product);
      if (typeof price === 'number') {
        return sum + price * entry.quantity;
      }
      return sum;
    }, 0);
  }, [entries]);

  if (itemCount === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="cart-outline" size={42} color="#64748b" />
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>
          Browse products in the Shop tab and tap “Add to Cart” to collect your
          essentials.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Your Cart</Text>
          <Text style={styles.subtitleText}>
            {itemCount} item{itemCount > 1 ? 's' : ''} · Subtotal ₹{subtotal.toFixed(2)}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleClearCart}
          style={styles.clearButton}
          accessibilityRole="button"
          accessibilityLabel="Clear cart"
        >
          <Ionicons name="trash-outline" size={18} color="#0C2B4E" />
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={entries}
        keyExtractor={(item, index) => item.key ?? `cart-item-${index}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        scrollIndicatorInsets={{ bottom: LIST_BOTTOM_GUTTER }}
        renderItem={({ item, index }) => (
          <CartItem
            entry={item}
            index={index}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
            onRemove={handleRemove}
          />
        )}
        ListFooterComponent={<View style={{ height: LIST_BOTTOM_GUTTER }} />}
      />
    </View>
  );
}

type CartEntry = {
  key: string;
  product: Product;
  quantity: number;
};

type CartItemProps = {
  entry: CartEntry;
  index: number;
  onIncrement: (key: string, product: Product) => void;
  onDecrement: (key: string) => void;
  onRemove: (key: string) => void;
};

function CartItem({
  entry,
  index,
  onIncrement,
  onDecrement,
  onRemove,
}: CartItemProps) {
  const { key, product, quantity } = entry;
  const images = getProductImages(product);
  const imageUri = images[0] ?? null;
  const title = getProductTitle(product, index);
  const price = getProductPrice(product);
  const lineTotal =
    typeof price === 'number' ? (price * quantity).toFixed(2) : null;
  const unitPrice =
    typeof price === 'number' ? price.toFixed(2) : null;

  return (
    <View style={styles.card}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.thumbnail} />
      ) : (
        <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
          <Text style={styles.thumbnailPlaceholderText}>No Image</Text>
        </View>
      )}
      <View style={styles.cardContent}>
        <View style={styles.titleRow}>
          <Text style={styles.productTitle} numberOfLines={1}>
            {title}
          </Text>
          {lineTotal && (
            <View style={styles.priceTag}>
              <Text style={styles.priceTagText}>₹{lineTotal}</Text>
            </View>
          )}
        </View>
        {unitPrice && (
          <Text style={styles.unitPrice}>₹{unitPrice} each</Text>
        )}
        <View style={styles.quantityRow}>
          <Text style={styles.quantityLabel}>Quantity</Text>
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={[styles.qtyButton, styles.qtyButtonLeft]}
              onPress={() => onDecrement(key)}
              accessibilityRole="button"
              accessibilityLabel="Decrease quantity"
              activeOpacity={0.8}
            >
              <Ionicons name="remove" size={18} color="#0C2B4E" />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity
              style={[styles.qtyButton, styles.qtyButtonRight]}
              onPress={() => onIncrement(key, product)}
              accessibilityRole="button"
              accessibilityLabel="Increase quantity"
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={18} color="#0C2B4E" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <TouchableOpacity
        onPress={() => onRemove(key)}
        style={styles.removeButton}
        accessibilityRole="button"
        accessibilityLabel="Remove item from cart"
      >
        <Ionicons name="close-circle" size={22} color="#dc2626" />
      </TouchableOpacity>
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
  subtitleText: {
    marginTop: 4,
    fontSize: 14,
    color: '#475569',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e2f0ff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  clearButtonText: {
    color: '#0C2B4E',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  listContent: {
    paddingHorizontal: 4,
    gap: 12,
    paddingBottom: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fdfefe',
    borderRadius: 16,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
  },
  thumbnailPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailPlaceholderText: {
    color: '#64748b',
    fontSize: 12,
  },
  cardContent: {
    flex: 1,
    marginHorizontal: 12,
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0f172a',
  },
  priceTag: {
    backgroundColor: '#0C2B4E',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  priceTagText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  unitPrice: {
    marginTop: 6,
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#dbeafe',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  qtyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f1f5ff',
  },
  qtyButtonLeft: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#cbd5f5',
  },
  qtyButtonRight: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: '#cbd5f5',
  },
  quantityText: {
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  quantityLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  removeButton: {
    padding: 4,
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
