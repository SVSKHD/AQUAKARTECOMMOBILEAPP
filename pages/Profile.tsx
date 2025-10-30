import { useMemo, useReducer } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type TabKey = 'orders' | 'favorites' | 'about';

type OrderItem = {
  sku: string;
  name: string;
  quantity: number;
  price: number;
  favorite?: boolean;
};

type Order = {
  id: string;
  placedOn: string;
  status: 'Delivered' | 'Processing' | 'Cancelled';
  items: OrderItem[];
  total: number;
};

type UserDetails = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
  };
};

type ProfileState = {
  activeTab: TabKey;
  orders: Order[];
  user: UserDetails;
};

type ProfileAction = { type: 'SET_TAB'; payload: TabKey };

const initialState: ProfileState = {
  activeTab: 'orders',
  orders: [
    {
      id: 'AQA-1201',
      placedOn: '2024-07-15',
      status: 'Delivered',
      total: 620,
      items: [
        {
          sku: 'HYDRO-20L',
          name: 'AquaMax 20L Water Can',
          quantity: 2,
          price: 120,
          favorite: true,
        },
        {
          sku: 'SOFT-XL',
          name: 'HydroSoft Water Softener',
          quantity: 1,
          price: 380,
          favorite: true,
        },
      ],
    },
    {
      id: 'AQA-1174',
      placedOn: '2024-06-28',
      status: 'Delivered',
      total: 450,
      items: [
        {
          sku: 'MINI-DISP',
          name: 'Mini Countertop Dispenser',
          quantity: 1,
          price: 450,
        },
      ],
    },
    {
      id: 'AQA-1103',
      placedOn: '2024-05-12',
      status: 'Processing',
      total: 280,
      items: [
        {
          sku: 'FILTER-SET',
          name: 'Universal RO Filter Kit',
          quantity: 2,
          price: 140,
          favorite: true,
        },
      ],
    },
  ],
  user: {
    firstName: 'Anika',
    lastName: 'Sridhar',
    email: 'anika.s@aquakart.co',
    phone: '+91 90876 54321',
    address: {
      line1: '32, Blue Lagoon Residences',
      line2: 'Neelankarai',
      city: 'Chennai',
      state: 'Tamil Nadu',
      postalCode: '600115',
    },
  },
};

function profileReducer(state: ProfileState, action: ProfileAction): ProfileState {
  switch (action.type) {
    case 'SET_TAB':
      return { ...state, activeTab: action.payload };
    default:
      return state;
  }
}

const TABS: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] =
  [
    { key: 'orders', label: 'Orders', icon: 'bag-handle-outline' },
    { key: 'favorites', label: 'Favourites', icon: 'heart-outline' },
    { key: 'about', label: 'About', icon: 'person-circle-outline' },
  ];

export default function ProfilePage() {
  const [state, dispatch] = useReducer(profileReducer, initialState);

  const favouriteHistory = useMemo(() => {
    const map = new Map<string, { item: OrderItem; orderId: string; placedOn: string }>();
    state.orders.forEach((order) => {
      order.items.forEach((item) => {
        if (item.favorite) {
          const key = item.sku;
          if (!map.has(key)) {
            map.set(key, { item, orderId: order.id, placedOn: order.placedOn });
          }
        }
      });
    });
    return Array.from(map.values());
  }, [state.orders]);

  const handleTabPress = (tab: TabKey) => {
    dispatch({ type: 'SET_TAB', payload: tab });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View>
            <Text style={styles.greeting}>Hello, {state.user.firstName}</Text>
            <Text style={styles.heroTitle}>
              Stay hydrated with AquaKart
            </Text>
          </View>
          <Text style={styles.heroSubtitle}>
            Review recent orders, revisit favourites, and keep your delivery information up to date.
          </Text>
        </View>

        <View style={styles.tabBar}>
          {TABS.map((tab) => {
            const isActive = state.activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => handleTabPress(tab.key)}
                accessibilityRole="button"
                accessibilityLabel={`${tab.label} tab`}
                accessibilityState={{ selected: isActive }}
              >
                <Ionicons
                  name={tab.icon}
                  size={18}
                  color={isActive ? '#0C2B4E' : '#64748b'}
                />
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {state.activeTab === 'orders' && <OrdersPanel orders={state.orders} />}
        {state.activeTab === 'favorites' && (
          <FavoritesPanel favourites={favouriteHistory} />
        )}
        {state.activeTab === 'about' && <AboutPanel user={state.user} />}
      </ScrollView>
    </View>
  );
}

type OrdersPanelProps = {
  orders: Order[];
};

function OrdersPanel({ orders }: OrdersPanelProps) {
  return (
    <View style={styles.panel}>
      {orders.map((order) => (
        <View key={order.id} style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <View>
              <Text style={styles.orderId}>Order {order.id}</Text>
              <Text style={styles.orderMeta}>Placed on {order.placedOn}</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                order.status === 'Delivered' && styles.statusDelivered,
                order.status === 'Processing' && styles.statusProcessing,
                order.status === 'Cancelled' && styles.statusCancelled,
              ]}
            >
              <Text style={styles.statusText}>{order.status}</Text>
            </View>
          </View>
          <View style={styles.orderItems}>
            {order.items.map((item) => (
              <View key={item.sku} style={styles.orderItemRow}>
                <Ionicons
                  name={item.favorite ? 'heart' : 'water-outline'}
                  size={16}
                  color={item.favorite ? '#f472b6' : '#0C2B4E'}
                />
                <View style={styles.orderItemContent}>
                  <Text style={styles.orderItemTitle}>{item.name}</Text>
                  <Text style={styles.orderItemMeta}>
                    Qty {item.quantity} · ₹{item.price.toFixed(2)} each
                  </Text>
                </View>
              </View>
            ))}
          </View>
          <View style={styles.orderFooter}>
            <Text style={styles.orderTotalLabel}>Total</Text>
            <Text style={styles.orderTotalValue}>₹{order.total.toFixed(2)}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

type FavoritesPanelProps = {
  favourites: Array<{ item: OrderItem; orderId: string; placedOn: string }>;
};

function FavoritesPanel({ favourites }: FavoritesPanelProps) {
  if (favourites.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name='heart-outline' size={44} color='#0C2B4E' />
        <Text style={styles.emptyTitle}>No favourites yet</Text>
        <Text style={styles.emptySubtitle}>
          Mark items as favourite in your orders to see them here.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={favourites}
      keyExtractor={(entry) => entry.item.sku}
      contentContainerStyle={styles.favoritesList}
      renderItem={({ item }) => (
        <View style={styles.favoriteCard}>
          <View style={styles.favoriteIconWrap}>
            <Ionicons name='water' size={22} color='#0C2B4E' />
          </View>
          <View style={styles.favoriteContent}>
            <Text style={styles.favoriteTitle}>{item.item.name}</Text>
            <Text style={styles.favoriteMeta}>
              Last ordered in {item.orderId} · {item.placedOn}
            </Text>
          </View>
        </View>
      )}
    />
  );
}

type AboutPanelProps = {
  user: UserDetails;
};

function AboutPanel({ user }: AboutPanelProps) {
  const fullName = `${user.lastName} ${user.firstName}`;
  return (
    <View style={styles.aboutCard}>
      <Text style={styles.aboutTitle}>Account Details</Text>
      <View style={styles.aboutRow}>
        <Ionicons name='person-outline' size={18} color='#0C2B4E' />
        <Text style={styles.aboutValue}>{fullName}</Text>
      </View>
      <View style={styles.aboutRow}>
        <Ionicons name='mail-outline' size={18} color='#0C2B4E' />
        <Text style={styles.aboutValue}>{user.email}</Text>
      </View>
      <View style={styles.aboutRow}>
        <Ionicons name='call-outline' size={18} color='#0C2B4E' />
        <Text style={styles.aboutValue}>{user.phone}</Text>
      </View>
      <View style={styles.aboutRowAddress}>
        <Ionicons name='location-outline' size={18} color='#0C2B4E' />
        <View style={styles.addressBlock}>
          <Text style={styles.aboutValue}>{user.address.line1}</Text>
          {user.address.line2 ? (
            <Text style={styles.aboutValue}>{user.address.line2}</Text>
          ) : null}
          <Text style={styles.aboutValue}>
            {user.address.city}, {user.address.state} {user.address.postalCode}
          </Text>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    gap: 24,
  },
  heroCard: {
    backgroundColor: '#0C2B4E',
    borderRadius: 24,
    padding: 24,
    gap: 12,
    shadowColor: '#0C2B4E',
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  greeting: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    lineHeight: 21,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 6,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: '#e0f2fe',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  tabLabelActive: {
    color: '#0C2B4E',
  },
  panel: {
    gap: 16,
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  orderMeta: {
    fontSize: 13,
    color: '#475569',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
  },
  statusDelivered: {
    backgroundColor: '#dcfce7',
  },
  statusProcessing: {
    backgroundColor: '#fef3c7',
  },
  statusCancelled: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    textTransform: 'uppercase',
  },
  orderItems: {
    gap: 10,
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  orderItemContent: {
    flex: 1,
    gap: 2,
  },
  orderItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  orderItemMeta: {
    fontSize: 13,
    color: '#64748b',
  },
  orderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
  },
  orderTotalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  orderTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  favoritesList: {
    gap: 12,
    paddingBottom: 16,
  },
  favoriteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  favoriteIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteContent: {
    flex: 1,
    gap: 4,
  },
  favoriteTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  favoriteMeta: {
    fontSize: 13,
    color: '#475569',
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
    shadowOpacity: 0.08,
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
  aboutCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aboutRowAddress: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  aboutValue: {
    fontSize: 15,
    color: '#475569',
  },
  addressBlock: {
    flex: 1,
    gap: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
  },
});
