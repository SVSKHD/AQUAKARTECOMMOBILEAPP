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
import { BlurView } from 'expo-blur';
import { triggerHaptic, triggerNotificationHaptic, triggerSelectionHaptic } from '../utils/haptics';
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
      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      incrementItem(key, product);
    },
    [incrementItem]
  );

  const handleDecrement = useCallback(
    (key: string) => {
      triggerSelectionHaptic();
      decrementItem(key);
    },
    [decrementItem]
  );

  const handleRemove = useCallback(
    (key: string) => {
      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Warning);
      removeItem(key);
    },
    [removeItem]
  );

  const handleClearCart = useCallback(() => {
    triggerNotificationHaptic(Haptics.NotificationFeedbackType.Warning);
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
        <Ionicons name="cart-outline" size={42} color="rgba(255,255,255,0.4)" />
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
      <FlatList
        data={entries}
        keyExtractor={(item, index) => item.key ?? `cart-item-${index}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        scrollIndicatorInsets={{ top: 90, bottom: LIST_BOTTOM_GUTTER }}
        ListHeaderComponent={
          <View style={styles.header}>
            <View>
              {/* Title moved to global header */}
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
              <Ionicons name="trash-outline" size={18} color="#fca5a5" />
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
        }
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
    <BlurView intensity={20} tint="dark" style={styles.card}>
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
              <Ionicons name="remove" size={18} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity
              style={[styles.qtyButton, styles.qtyButtonRight]}
              onPress={() => onIncrement(key, product)}
              accessibilityRole="button"
              accessibilityLabel="Increase quantity"
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={18} color="#fff" />
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
        <Ionicons name="close-circle" size={22} color="#f87171" />
      </TouchableOpacity>
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

  subtitleText: {
    marginTop: 4,
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  clearButtonText: {
    color: '#fca5a5',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  listContent: {
    paddingHorizontal: 0,
    gap: 12,
    paddingTop: 140, // Increased spacing for header
    paddingBottom: 40,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    overflow: 'hidden', // Needed for BlurView borderRadius
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  thumbnailPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailPlaceholderText: {
    color: 'rgba(255,255,255,0.5)',
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
    color: '#ffffff',
  },
  priceTag: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  priceTagText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  unitPrice: {
    marginTop: 6,
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
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
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  qtyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.0)',
  },
  qtyButtonLeft: {
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.2)',
  },
  qtyButtonRight: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.2)',
  },
  quantityText: {
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  quantityLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
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
    color: '#ffffff',
  },
  emptySubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 21,
  },
});
