import type { ComponentType } from 'react';
import React, { useCallback, useEffect, useMemo, useReducer, useState, useRef } from 'react';
import {
  Alert,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  ListRenderItem,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { triggerHaptic, triggerNotificationHaptic, triggerSelectionHaptic } from '../utils/haptics';
import { useCartStore } from '../store/cartStore';
import { Product, getProductImages, getProductPrice, getProductTitle } from '../utils/products';
import * as Haptics from 'expo-haptics';

// Or react-native Image if that was used. Checking Cart.tsx... it used react-native Image. I should stick to that or standard. Cart.tsx used: import { Image } from 'react-native';
// Wait, Cart.tsx imported Image from react-native. Profile.tsx doesn't use Image yet.
// I need to import Image from react-native.


type TabKey = 'orders' | 'favorites' | 'cart' | 'about';

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

type Address = {
  id: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
};

type AddressTextField = 'label' | 'line1' | 'line2' | 'city' | 'state' | 'postalCode';

type UserDetails = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  altPhone?: string;
  addresses: Address[];
};

type FavouriteEntry = { item: OrderItem; orderId: string; placedOn: string };

type ProfileState = {
  activeTab: TabKey;
  orders: Order[];
  user: UserDetails;
};

type ProfileAction =
  | { type: 'SET_TAB'; payload: TabKey }
  | { type: 'UPDATE_USER'; payload: UserDetails };

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
    altPhone: '+91 99887 65432',
    addresses: [
      {
        id: 'addr-home',
        label: 'Home',
        line1: '32, Blue Lagoon Residences',
        line2: 'Neelankarai',
        city: 'Chennai',
        state: 'Tamil Nadu',
        postalCode: '600115',
        isDefault: true,
      },
      {
        id: 'addr-office',
        label: 'Office',
        line1: 'AquaKart Towers, 4th Floor',
        line2: 'OMR, Thoraipakkam',
        city: 'Chennai',
        state: 'Tamil Nadu',
        postalCode: '600096',
        isDefault: false,
      },
    ],
  },
};

function profileReducer(state: ProfileState, action: ProfileAction): ProfileState {
  switch (action.type) {
    case 'SET_TAB':
      return { ...state, activeTab: action.payload };
    case 'UPDATE_USER':
      return { ...state, user: action.payload };
    default:
      return state;
  }
}

const TABS: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'orders', label: 'Orders', icon: 'bag-handle-outline' },
  { key: 'favorites', label: 'Favourites', icon: 'heart-outline' },
  { key: 'cart', label: 'Cart', icon: 'cart-outline' },
  { key: 'about', label: 'About', icon: 'person-circle-outline' },
];

const DRAWER_BOTTOM_PADDING =
  Platform.select<number>({ ios: 64, android: 48, default: 48 }) ?? 48;

type ListConfig = {
  data: ReadonlyArray<any>;
  keyExtractor: (item: any, index: number) => string;
  renderItem: ListRenderItem<any>;
  ItemSeparatorComponent?: ComponentType<any> | null;
  ListEmptyComponent?: ComponentType<any> | null;
};

export default function ProfilePage() {
  const [state, dispatch] = useReducer(profileReducer, initialState);
  const [isDrawerVisible, setDrawerVisible] = useState(false);

  const cartItemsMap = useCartStore((state) => state.items);
  const incrementCartItem = useCartStore((state) => state.incrementItem);
  const decrementCartItem = useCartStore((state) => state.decrementItem);
  const removeCartItem = useCartStore((state) => state.removeItem);

  const cartEntries = useMemo(() => {
    return Object.entries(cartItemsMap).map(([key, entry]) => ({
      key,
      product: entry.product,
      quantity: entry.quantity,
    }));
  }, [cartItemsMap]);

  const favouriteHistory = useMemo(() => {
    const map = new Map<string, FavouriteEntry>();
    state.orders.forEach((order) => {
      order.items.forEach((item) => {
        if (item.favorite && !map.has(item.sku)) {
          map.set(item.sku, { item, orderId: order.id, placedOn: order.placedOn });
        }
      });
    });
    return Array.from(map.values());
  }, [state.orders]);

  const notifyUpdate = useCallback((message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert(message);
    }
  }, []);

  const handleTabPress = useCallback((tab: TabKey) => {
    dispatch({ type: 'SET_TAB', payload: tab });
  }, []);

  const handleEditPress = useCallback(() => {
    setDrawerVisible(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setDrawerVisible(false);
  }, []);

  const handleSaveProfile = useCallback(
    (updatedUser: UserDetails) => {
      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
      setDrawerVisible(false);
      notifyUpdate('Profile updated');
    },
    [notifyUpdate],
  );

  const renderOrderItem = useCallback<ListRenderItem<Order>>(
    ({ item }) => <OrderCard order={item} />,
    [],
  );

  const renderFavoriteItem = useCallback<ListRenderItem<FavouriteEntry>>(
    ({ item }) => <FavoriteCard favourite={item} />,
    [],
  );

  const renderAboutItem = useCallback<ListRenderItem<UserDetails>>(
    ({ item }) => <AboutCard user={item} onEditPress={handleEditPress} />,
    [handleEditPress],
  );

  const renderProfileCartItem = useCallback<ListRenderItem<any>>(
    ({ item, index }) => (
      <ProfileCartItem
        entry={item}
        index={index}
        onIncrement={(key, product) => {
          triggerHaptic();
          incrementCartItem(key, product);
        }}
        onDecrement={(key) => {
          triggerSelectionHaptic();
          decrementCartItem(key);
        }}
        onRemove={(key) => {
          triggerNotificationHaptic(Haptics.NotificationFeedbackType.Warning);
          removeCartItem(key);
        }}
      />
    ),
    [incrementCartItem, decrementCartItem, removeCartItem]
  );

  const listConfig = useMemo<ListConfig>(() => {
    switch (state.activeTab) {
      case 'orders':
        return {
          data: state.orders,
          keyExtractor: (order: Order) => order.id,
          renderItem: renderOrderItem,
          ItemSeparatorComponent: OrdersSeparator,
        };
      case 'favorites':
        return {
          data: favouriteHistory,
          keyExtractor: (entry: FavouriteEntry) => entry.item.sku,
          renderItem: renderFavoriteItem,
          ItemSeparatorComponent: FavoritesSeparator,
          ListEmptyComponent: EmptyFavorites,
        };
      case 'cart':
        return {
          data: cartEntries,
          keyExtractor: (item) => item.key,
          renderItem: renderProfileCartItem,
          ItemSeparatorComponent: FavoritesSeparator, // Reuse separator
          ListEmptyComponent: EmptyCartProfile,
        };
      case 'about':
      default:
        return {
          data: [state.user],
          keyExtractor: () => 'profile-about',
          renderItem: renderAboutItem,
        };
    }
  }, [
    favouriteHistory,
    renderAboutItem,
    renderFavoriteItem,
    renderOrderItem,
    state.activeTab,
    state.orders,
    state.user,
  ]);

  return (
    <View style={styles.container}>
      <FlatList
        key={state.activeTab}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={listConfig.data}
        keyExtractor={listConfig.keyExtractor}
        renderItem={listConfig.renderItem}
        ItemSeparatorComponent={listConfig.ItemSeparatorComponent}
        ListEmptyComponent={listConfig.ListEmptyComponent}
        ListHeaderComponent={
          <ProfileHeader
            activeTab={state.activeTab}
            onTabPress={handleTabPress}
            user={state.user}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <EditProfileDrawer
        visible={isDrawerVisible}
        user={state.user}
        onClose={handleCloseDrawer}
        onSave={handleSaveProfile}
      />
    </View>
  );
}

type ProfileHeaderProps = {
  activeTab: TabKey;
  onTabPress: (tab: TabKey) => void;
  user: UserDetails;
};

function ProfileHeader({ activeTab, onTabPress, user }: ProfileHeaderProps) {
  return (
    <View style={styles.headerContainer}>
      <LinearGradient
        colors={['#0C2B4E', '#1e40af']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View>
          <Text style={styles.greeting}>Hello, {user.firstName}</Text>
          <Text style={styles.heroTitle}>
            Stay hydrated with AquaKart
          </Text>
        </View>
        <Text style={styles.heroSubtitle}>
          Review recent orders, revisit favourites, and keep your delivery information up to date.
        </Text>
      </LinearGradient>

      <BlurView intensity={20} tint="dark" style={styles.tabBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
              onPress={() => {
                triggerHaptic();
                onTabPress(tab.key);
              }}
              accessibilityRole="button"
              accessibilityLabel={`${tab.label} tab`}
              accessibilityState={{ selected: isActive }}
            >
              <Ionicons
                name={tab.icon}
                size={18}
                color={isActive ? '#ffffff' : 'rgba(255,255,255,0.6)'}
              />
            </TouchableOpacity>
          );
        })}
      </BlurView>
    </View>
  );
}

type OrderCardProps = {
  order: Order;
};

function OrderCard({ order }: OrderCardProps) {
  return (
    <BlurView intensity={20} tint="dark" style={styles.orderCard}>
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
              color={item.favorite ? '#f472b6' : '#ffffff'}
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
    </BlurView>
  );
}

type FavoriteCardProps = {
  favourite: FavouriteEntry;
};

function FavoriteCard({ favourite }: FavoriteCardProps) {
  return (
    <BlurView intensity={20} tint="dark" style={styles.favoriteCard}>
      <View style={styles.favoriteIconWrap}>
        <Ionicons name='water' size={22} color='#ffffff' />
      </View>
      <View style={styles.favoriteContent}>
        <Text style={styles.favoriteTitle}>{favourite.item.name}</Text>
        <Text style={styles.favoriteMeta}>
          Last ordered in {favourite.orderId} · {favourite.placedOn}
        </Text>
      </View>
    </BlurView>
  );
}

type AboutCardProps = {
  user: UserDetails;
  onEditPress: () => void;
};

function AboutCard({ user, onEditPress }: AboutCardProps) {
  const fullName = `${user.lastName} ${user.firstName}`;
  return (
    <BlurView intensity={20} tint="dark" style={styles.aboutCard}>
      <Text style={styles.aboutTitle}>Account Details</Text>
      <View style={styles.aboutRow}>
        <Ionicons name='person-outline' size={18} color='rgba(255,255,255,0.7)' />
        <Text style={styles.aboutValue}>{fullName}</Text>
      </View>
      <View style={styles.aboutRow}>
        <Ionicons name='mail-outline' size={18} color='rgba(255,255,255,0.7)' />
        <Text style={styles.aboutValue}>{user.email}</Text>
      </View>
      <View style={styles.aboutRow}>
        <Ionicons name='call-outline' size={18} color='rgba(255,255,255,0.7)' />
        <Text style={styles.aboutValue}>{user.phone}</Text>
      </View>
      {user.altPhone ? (
        <View style={styles.aboutRow}>
          <Ionicons name='call' size={18} color='rgba(255,255,255,0.7)' />
          <Text style={styles.aboutValue}>{user.altPhone}</Text>
        </View>
      ) : null}
      <View style={styles.aboutRowAddress}>
        <Ionicons name='location-outline' size={18} color='rgba(255,255,255,0.7)' />
        <View style={styles.addressBlock}>
          <Text style={styles.aboutValue}>Saved Addresses</Text>
          <View style={styles.aboutAddressList}>
            {[...user.addresses]
              .sort((a, b) => (a.isDefault === b.isDefault ? 0 : a.isDefault ? -1 : 1))
              .map((address) => (
                <View key={address.id} style={styles.aboutAddressItem}>
                  <View style={styles.aboutAddressHeader}>
                    <Text style={styles.aboutAddressLabel}>{address.label}</Text>
                    {address.isDefault ? (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Default</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={[styles.aboutValue, { color: 'rgba(255,255,255,0.9)' }]}>{address.line1}</Text>
                  {address.line2 ? <Text style={[styles.aboutValue, { color: 'rgba(255,255,255,0.9)' }]}>{address.line2}</Text> : null}
                  <Text style={[styles.aboutValue, { color: 'rgba(255,255,255,0.9)' }]}>
                    {address.city}, {address.state} {address.postalCode}
                  </Text>
                </View>
              ))}
          </View>
        </View>
      </View>

      <View style={styles.aboutActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => {
            triggerHaptic();
            onEditPress();
          }}
          accessibilityRole='button'
          accessibilityLabel='Edit profile details'
        >
          <Ionicons name='create-outline' size={16} color='#ffffff' />
          <Text style={styles.editButtonText}>Edit details</Text>
        </TouchableOpacity>
      </View>
    </BlurView>
  );
}

function EmptyFavorites() {
  return (
    <View style={styles.emptyWrapper}>
      <View style={styles.emptyState}>
        <Ionicons name='heart-outline' size={44} color='rgba(255,255,255,0.4)' />
        <Text style={styles.emptyTitle}>No favourites yet</Text>
        <Text style={styles.emptySubtitle}>
          Mark items as favourite in your orders to see them here.
        </Text>
      </View>
    </View>
  );
}

function OrdersSeparator() {
  return <View style={styles.ordersSeparator} />;
}

function FavoritesSeparator() {
  return <View style={styles.favoritesSeparator} />;
}

type EditProfileDrawerProps = {
  visible: boolean;
  user: UserDetails;
  onClose: () => void;
  onSave: (user: UserDetails) => void;
};

type EditProfileFormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  altPhone: string;
  addresses: Address[];
};

function createFormState(user: UserDetails): EditProfileFormState {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    altPhone: user.altPhone ?? '',
    addresses: user.addresses.map((address) => ({ ...address })),
  };
}


import { DraggableDrawer } from '../components/drawer';


export function EditProfileDrawer({ visible, onClose, onSave, user }: EditProfileDrawerProps) {
  const [formState, setFormState] = useState(() => createFormState(user));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setFormState(createFormState(user));
    setError(null);
  }, [visible, user]);

  const handleClose = useCallback(() => {
    setError(null);
    onClose();
  }, [onClose]);

  const handleInputChange = useCallback((key: keyof EditProfileFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleAddressChange = useCallback((id: string, key: keyof Address, value: string) => {
    setFormState((prev) => ({
      ...prev,
      addresses: prev.addresses.map((a) => (a.id === id ? { ...a, [key]: value } : a)),
    }));
  }, []);

  const handleSetDefaultAddress = useCallback((id: string) => {
    setFormState((prev) => ({
      ...prev,
      addresses: prev.addresses.map((a) => ({ ...a, isDefault: a.id === id })),
    }));
  }, []);

  const handleAddAddress = useCallback(() => {
    setFormState((prev) => {
      const isFirstAddress = prev.addresses.length === 0;
      const newAddress: Address = {
        id: `addr-${Date.now()}`,
        label: 'New Address',
        line1: '',
        line2: '',
        city: '',
        state: '',
        postalCode: '',
        isDefault: isFirstAddress,
      };

      const addresses = [...prev.addresses, newAddress];
      return {
        ...prev,
        addresses: isFirstAddress
          ? addresses.map((a) => ({ ...a, isDefault: a.id === newAddress.id }))
          : addresses,
      };
    });
  }, []);

  const handleRemoveAddress = useCallback((id: string) => {
    setFormState((prev) => {
      if (prev.addresses.length === 1) return prev;

      const remaining = prev.addresses.filter((a) => a.id !== id);
      if (remaining.length === 0) return prev;

      if (!remaining.some((a) => a.isDefault)) {
        const [first, ...rest] = remaining;
        return {
          ...prev,
          addresses: [{ ...first, isDefault: true }, ...rest.map((a) => ({ ...a, isDefault: false }))],
        };
      }

      return { ...prev, addresses: remaining };
    });
  }, []);

  const handleSubmit = useCallback(() => {
    const firstName = formState.firstName.trim();
    const lastName = formState.lastName.trim();
    const email = formState.email.trim();
    const phone = formState.phone.trim();
    const altPhone = formState.altPhone.trim();

    const normalizedAddresses = formState.addresses
      .map((address) => {
        const label = address.label.trim() || 'Address';
        const line1 = address.line1.trim();
        const line2 = address.line2?.trim() ?? '';
        const city = address.city.trim();
        const state = address.state.trim();
        const postalCode = address.postalCode.trim();
        return { ...address, label, line1, line2, city, state, postalCode };
      })
      .filter((a) => a.line1.length > 0 || a.city.length > 0);

    if (!firstName || !email || !phone) {
      setError('First name, email, and primary phone are required.');
      return;
    }
    if (normalizedAddresses.length === 0) {
      setError('Add at least one address with street details.');
      return;
    }

    let defaultIndex = normalizedAddresses.findIndex((a) => a.isDefault);
    if (defaultIndex === -1) defaultIndex = 0;

    const preparedAddresses = normalizedAddresses.map((a, index) => ({
      ...a,
      isDefault: index === defaultIndex,
      line2: a.line2.length ? a.line2 : undefined,
    }));

    const payload: UserDetails = {
      ...user,
      firstName,
      lastName,
      email,
      phone,
      altPhone: altPhone.length ? altPhone : undefined,
      addresses: preparedAddresses,
    };

    setError(null);
    onSave(payload);
  }, [formState, onSave, user]);

  return (
    <DraggableDrawer
      visible={visible}
      onClose={handleClose}
      title="Edit profile"
      subtitle="Update your contact information and saved addresses. Changes apply instantly."
      onDone={handleSubmit}
      doneLabel="Save"
    >
      <ScrollView
        style={styles.drawerScroll}
        contentContainerStyle={styles.drawerContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ---- your exact UI stays same below ---- */}

        <View style={styles.formRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>First name</Text>
            <TextInput
              style={styles.textInput}
              value={formState.firstName}
              onChangeText={(value) => handleInputChange('firstName', value)}
              autoCapitalize="words"
              placeholder="First name"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Last name</Text>
            <TextInput
              style={styles.textInput}
              value={formState.lastName}
              onChangeText={(value) => handleInputChange('lastName', value)}
              autoCapitalize="words"
              placeholder="Last name"
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.textInput}
            value={formState.email}
            onChangeText={(value) => handleInputChange('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="Email address"
            placeholderTextColor="#94a3b8"
          />
        </View>

        <View style={styles.formRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Primary phone</Text>
            <TextInput
              style={styles.textInput}
              value={formState.phone}
              onChangeText={(value) => handleInputChange('phone', value)}
              keyboardType="phone-pad"
              placeholder="+91 90000 00000"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Alternative phone</Text>
            <TextInput
              style={styles.textInput}
              value={formState.altPhone}
              onChangeText={(value) => handleInputChange('altPhone', value)}
              keyboardType="phone-pad"
              placeholder="Optional"
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Addresses</Text>
          <Text style={styles.sectionHint}>Store multiple delivery locations for faster checkout.</Text>
        </View>

        {formState.addresses.map((address) => (
          <View key={address.id} style={styles.addressCard}>
            <View style={styles.addressHeader}>
              <TextInput
                style={[styles.textInput, styles.addressTitleInput]}
                value={address.label}
                onChangeText={(value) => handleAddressChange(address.id, 'label', value)}
                placeholder="Label (Home, Work)"
                placeholderTextColor="#94a3b8"
              />

              <View style={styles.addressHeaderActions}>
                <TouchableOpacity
                  style={[
                    styles.defaultAddressButton,
                    address.isDefault && styles.defaultAddressButtonActive,
                  ]}
                  onPress={() => handleSetDefaultAddress(address.id)}
                >
                  <Ionicons
                    name={address.isDefault ? 'radio-button-on' : 'radio-button-off'}
                    size={18}
                    color={address.isDefault ? '#38bdf8' : 'rgba(255,255,255,0.6)'}
                  />
                  <Text
                    style={[
                      styles.defaultAddressButtonText,
                      address.isDefault && styles.defaultAddressButtonTextActive,
                    ]}
                  >
                    {address.isDefault ? 'Default' : 'Make default'}
                  </Text>
                </TouchableOpacity>

                {formState.addresses.length > 1 ? (
                  <TouchableOpacity
                    style={styles.removeAddressButton}
                    onPress={() => handleRemoveAddress(address.id)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#fca5a5" />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            <TextInput
              style={styles.textInput}
              value={address.line1}
              onChangeText={(value) => handleAddressChange(address.id, 'line1', value)}
              placeholder="Address line 1"
              placeholderTextColor="rgba(255,255,255,0.4)"
            />
            <TextInput
              style={styles.textInput}
              value={address.line2 ?? ''}
              onChangeText={(value) => handleAddressChange(address.id, 'line2', value)}
              placeholder="Address line 2 (optional)"
              placeholderTextColor="rgba(255,255,255,0.4)"
            />

            <View style={styles.addressInlineRow}>
              <TextInput
                style={[styles.textInput, styles.addressInlineInput]}
                value={address.city}
                onChangeText={(value) => handleAddressChange(address.id, 'city', value)}
                placeholder="City"
                placeholderTextColor="rgba(255,255,255,0.4)"
              />
              <TextInput
                style={[styles.textInput, styles.addressInlineInput]}
                value={address.state}
                onChangeText={(value) => handleAddressChange(address.id, 'state', value)}
                placeholder="State"
                placeholderTextColor="rgba(255,255,255,0.4)"
              />
            </View>

            <TextInput
              style={styles.textInput}
              value={address.postalCode}
              onChangeText={(value) => handleAddressChange(address.id, 'postalCode', value)}
              placeholder="Postal code"
              placeholderTextColor="#94a3b8"
              keyboardType="number-pad"
            />
          </View>
        ))}

        <TouchableOpacity style={styles.addAddressButton} onPress={handleAddAddress}>
          <Ionicons name="add-circle-outline" size={18} color="#ffffff" />
          <Text style={styles.addAddressText}>Add another address</Text>
        </TouchableOpacity>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleClose}>
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit}>
            <Text style={styles.primaryButtonText}>Save changes</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </DraggableDrawer>
  );
}


function EmptyCartProfile() {
  return (
    <View style={styles.emptyWrapper}>
      <View style={styles.emptyState}>
        <Ionicons name='cart-outline' size={44} color='rgba(255,255,255,0.4)' />
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>
          Check out the Shop tab to find products.
        </Text>
      </View>
    </View>
  );
}

type ProfileCartItemProps = {
  entry: { key: string; product: Product; quantity: number };
  index: number;
  onIncrement: (key: string, product: Product) => void;
  onDecrement: (key: string) => void;
  onRemove: (key: string) => void;
};

function ProfileCartItem({ entry, index, onIncrement, onDecrement, onRemove }: ProfileCartItemProps) {
  const { key, product, quantity } = entry;
  const images = getProductImages(product);
  const imageUri = images[0] ?? null;
  const title = getProductTitle(product, index);
  const price = getProductPrice(product);
  const lineTotal = typeof price === 'number' ? (price * quantity).toFixed(2) : null;

  return (
    <BlurView intensity={20} tint="dark" style={styles.favoriteCard}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={{ width: 60, height: 60, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)' }} />
      ) : (
        <View style={{ width: 60, height: 60, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="image-outline" size={20} color="rgba(255,255,255,0.5)" />
        </View>
      )}
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: '#ffffff' }} numberOfLines={1}>{title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.6)' }}>
            Qty {quantity}
          </Text>
          {lineTotal && (
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#ffffff' }}>
              ₹{lineTotal}
            </Text>
          )}
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <TouchableOpacity
          onPress={() => onDecrement(key)}
          style={{ padding: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8 }}
        >
          <Ionicons name="remove" size={16} color="#ffffff" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onIncrement(key, product)}
          style={{ padding: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8 }}
        >
          <Ionicons name="add" size={16} color="#ffffff" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onRemove(key)}
          style={{ padding: 6, backgroundColor: 'rgba(239, 68, 68, 0.2)', borderRadius: 8 }}
        >
          <Ionicons name="trash-outline" size={16} color="#fca5a5" />
        </TouchableOpacity>
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingTop: 140, // Header space
    paddingHorizontal: 20, // Standardized
    paddingBottom: 120,
    gap: 16,
  },
  headerContainer: {
    gap: 24,
    marginBottom: 24,
  },
  heroCard: {
    borderRadius: 24,
    padding: 24,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
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
    fontSize: 28, // Standardized
    fontWeight: '700',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    lineHeight: 21,
  },
  tabBar: {
    flexDirection: 'row',
    // backgroundColor: '#ffffff', // Removed for Glass
    borderRadius: 16,
    padding: 6,
    gap: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  orderCard: {
    // backgroundColor: '#ffffff', // Removed for Glass
    borderRadius: 18,
    padding: 18,
    gap: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  orderMeta: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusDelivered: {
    backgroundColor: 'rgba(220, 252, 231, 0.2)', // Light green glass
  },
  statusProcessing: {
    backgroundColor: 'rgba(254, 243, 199, 0.2)', // Light yellow glass
  },
  statusCancelled: {
    backgroundColor: 'rgba(254, 226, 226, 0.2)', // Light red glass
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
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
    color: '#ffffff',
  },
  orderItemMeta: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  orderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 10,
  },
  orderTotalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  orderTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  favoriteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    // backgroundColor: '#ffffff', // Removed for Glass
    padding: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  favoriteIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
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
    color: '#ffffff',
  },
  favoriteMeta: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  aboutCard: {
    // backgroundColor: '#ffffff', // Removed for Glass
    borderRadius: 18,
    padding: 20,
    gap: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
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
    color: 'rgba(255,255,255,0.8)',
  },
  addressBlock: {
    flex: 1,
    gap: 8,
  },
  aboutAddressList: {
    gap: 16,
  },
  aboutAddressItem: {
    gap: 4,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  aboutAddressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aboutAddressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  defaultBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  aboutActions: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  emptyWrapper: {
    marginTop: 12,
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 20,
  },
  ordersSeparator: {
    height: 16,
  },
  favoritesSeparator: {
    height: 12,
  },
  drawerBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  backdropPressable: {
    flex: 1,
  },
  drawerContainer: {
    width: '100%',
  },
  drawerShell: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    maxHeight: '92%',
  },
  drawerHandle: {
    alignSelf: 'center',
    width: 46,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 12,
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  drawerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
    marginBottom: 16,
  },
  drawerScroll: {
    flex: 1, // Fix scrolling
  },
  drawerContent: {
    gap: 18,
    paddingTop: 140, // Add padding for absolute header
    paddingBottom: DRAWER_BOTTOM_PADDING,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  textInput: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#ffffff',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  sectionHeader: {
    gap: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  sectionHint: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  addressCard: {
    gap: 10,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  addressHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressTitleInput: {
    flex: 1,
  },
  defaultAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'transparent',
  },
  defaultAddressButtonActive: {
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
  },
  defaultAddressButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  defaultAddressButtonTextActive: {
    color: '#38bdf8',
  },
  removeAddressButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  addressInlineRow: {
    flexDirection: 'row',
    gap: 10,
  },
  addressInlineInput: {
    flex: 1,
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  addAddressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  errorText: {
    fontSize: 13,
    color: '#ef4444',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 6,
  },
  primaryButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#38bdf8',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  secondaryButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});
