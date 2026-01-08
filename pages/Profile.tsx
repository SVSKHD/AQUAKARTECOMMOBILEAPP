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
      <View style={styles.heroCard}>
        <View>
          <Text style={styles.greeting}>Hello, {user.firstName}</Text>
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
                color={isActive ? '#0C2B4E' : '#64748b'}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

type OrderCardProps = {
  order: Order;
};

function OrderCard({ order }: OrderCardProps) {
  return (
    <View style={styles.orderCard}>
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
  );
}

type FavoriteCardProps = {
  favourite: FavouriteEntry;
};

function FavoriteCard({ favourite }: FavoriteCardProps) {
  return (
    <View style={styles.favoriteCard}>
      <View style={styles.favoriteIconWrap}>
        <Ionicons name='water' size={22} color='#0C2B4E' />
      </View>
      <View style={styles.favoriteContent}>
        <Text style={styles.favoriteTitle}>{favourite.item.name}</Text>
        <Text style={styles.favoriteMeta}>
          Last ordered in {favourite.orderId} · {favourite.placedOn}
        </Text>
      </View>
    </View>
  );
}

type AboutCardProps = {
  user: UserDetails;
  onEditPress: () => void;
};

function AboutCard({ user, onEditPress }: AboutCardProps) {
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
      {user.altPhone ? (
        <View style={styles.aboutRow}>
          <Ionicons name='call' size={18} color='#0C2B4E' />
          <Text style={styles.aboutValue}>{user.altPhone}</Text>
        </View>
      ) : null}
      <View style={styles.aboutRowAddress}>
        <Ionicons name='location-outline' size={18} color='#0C2B4E' />
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
                  <Text style={styles.aboutValue}>{address.line1}</Text>
                  {address.line2 ? <Text style={styles.aboutValue}>{address.line2}</Text> : null}
                  <Text style={styles.aboutValue}>
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
          <Ionicons name='create-outline' size={16} color='#0C2B4E' />
          <Text style={styles.editButtonText}>Edit details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function EmptyFavorites() {
  return (
    <View style={styles.emptyWrapper}>
      <View style={styles.emptyState}>
        <Ionicons name='heart-outline' size={44} color='#0C2B4E' />
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

function EditProfileDrawer({ visible, onClose, onSave, user }: EditProfileDrawerProps) {
  const [formState, setFormState] = useState(() => createFormState(user));
  const [error, setError] = useState<string | null>(null);

  // Animations
  const translateY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dragging = useRef(false);

  useEffect(() => {
    if (visible) {
      translateY.setValue(600);
      fadeAnim.setValue(0);
      dragging.current = false;
      setFormState(createFormState(user));
      setError(null);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 4,
        })
      ]).start();
    }
  }, [visible, user]);

  const handleClose = useCallback(() => {
    setError(null);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 800,
        duration: 250,
        useNativeDriver: true,
      })
    ]).start(() => {
      onClose();
    });
  }, [onClose]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, { dy }) => {
        return dy > 10;
      },
      onPanResponderGrant: () => {
        dragging.current = true;
      },
      onPanResponderMove: (_, { dy }) => {
        if (dy > 0) {
          translateY.setValue(dy);
        }
      },
      onPanResponderRelease: (_, { dy, vy }) => {
        dragging.current = false;
        if (dy > 150 || vy > 0.5) {
          handleClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      }
    })
  ).current;

  const handleInputChange = useCallback((key: keyof EditProfileFormState, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const handleAddressChange = useCallback(
    (id: string, key: keyof Address, value: string) => {
      setFormState((prev) => ({
        ...prev,
        addresses: prev.addresses.map((address) =>
          address.id === id ? { ...address, [key]: value } : address,
        ),
      }));
    },
    [],
  );

  const handleSetDefaultAddress = useCallback((id: string) => {
    setFormState((prev) => ({
      ...prev,
      addresses: prev.addresses.map((address) => ({
        ...address,
        isDefault: address.id === id,
      })),
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
          ? addresses.map((address) => ({ ...address, isDefault: address.id === newAddress.id }))
          : addresses,
      };
    });
  }, []);

  const handleRemoveAddress = useCallback((id: string) => {
    setFormState((prev) => {
      if (prev.addresses.length === 1) return prev;
      const remaining = prev.addresses.filter((address) => address.id !== id);
      if (remaining.length === 0) return prev;

      if (!remaining.some((address) => address.isDefault)) {
        const [first, ...rest] = remaining;
        return {
          ...prev,
          addresses: [
            { ...first, isDefault: true },
            ...rest.map((address) => ({ ...address, isDefault: false })),
          ],
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

        return {
          ...address,
          label,
          line1,
          line2,
          city,
          state,
          postalCode,
        };
      })
      .filter((address) => address.line1.length > 0 || address.city.length > 0);

    if (!firstName || !email || !phone) {
      setError('First name, email, and primary phone are required.');
      return;
    }

    if (normalizedAddresses.length === 0) {
      setError('Add at least one address with street details.');
      return;
    }

    let defaultIndex = normalizedAddresses.findIndex((address) => address.isDefault);
    if (defaultIndex === -1) defaultIndex = 0;

    const preparedAddresses = normalizedAddresses.map((address, index) => ({
      ...address,
      isDefault: index === defaultIndex,
      line2: address.line2.length ? address.line2 : undefined,
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

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent onRequestClose={handleClose}>
      <Animated.View
        style={[
          styles.drawerBackdrop,
          { opacity: fadeAnim }
        ]}
      >
        <Pressable style={styles.backdropPressable} onPress={handleClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.drawerContainer,
          {
            position: 'absolute',
            bottom: 0,
            transform: [{ translateY }]
          }
        ]}
      >
        <View style={styles.drawerShell}>
          <View
            style={styles.drawerHandle}
            {...panResponder.panHandlers}
          />
          <Text style={styles.drawerTitle}>Edit profile</Text>
          <Text style={styles.drawerSubtitle}>
            Update your contact information and saved addresses. Changes apply instantly.
          </Text>

          <ScrollView
            style={styles.drawerScroll}
            contentContainerStyle={styles.drawerContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>First name</Text>
                <TextInput
                  style={styles.textInput}
                  value={formState.firstName}
                  onChangeText={(value) => handleInputChange('firstName', value)}
                  autoCapitalize='words'
                  placeholder='First name'
                  placeholderTextColor='#94a3b8'
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Last name</Text>
                <TextInput
                  style={styles.textInput}
                  value={formState.lastName}
                  onChangeText={(value) => handleInputChange('lastName', value)}
                  autoCapitalize='words'
                  placeholder='Last name'
                  placeholderTextColor='#94a3b8'
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.textInput}
                value={formState.email}
                onChangeText={(value) => handleInputChange('email', value)}
                keyboardType='email-address'
                autoCapitalize='none'
                placeholder='Email address'
                placeholderTextColor='#94a3b8'
              />
            </View>

            <View style={styles.formRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Primary phone</Text>
                <TextInput
                  style={styles.textInput}
                  value={formState.phone}
                  onChangeText={(value) => handleInputChange('phone', value)}
                  keyboardType='phone-pad'
                  placeholder='+91 90000 00000'
                  placeholderTextColor='#94a3b8'
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Alternative phone</Text>
                <TextInput
                  style={styles.textInput}
                  value={formState.altPhone}
                  onChangeText={(value) => handleInputChange('altPhone', value)}
                  keyboardType='phone-pad'
                  placeholder='Optional'
                  placeholderTextColor='#94a3b8'
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
                    placeholder='Label (Home, Work)'
                    placeholderTextColor='#94a3b8'
                  />
                  <View style={styles.addressHeaderActions}>
                    <TouchableOpacity
                      style={[
                        styles.defaultAddressButton,
                        address.isDefault && styles.defaultAddressButtonActive,
                      ]}
                      onPress={() => handleSetDefaultAddress(address.id)}
                      accessibilityRole='button'
                      accessibilityState={{ selected: address.isDefault }}
                      accessibilityLabel={
                        address.isDefault
                          ? 'Default delivery address'
                          : 'Set as default delivery address'
                      }
                    >
                      <Ionicons
                        name={address.isDefault ? 'radio-button-on' : 'radio-button-off'}
                        size={18}
                        color={address.isDefault ? '#0C2B4E' : '#64748b'}
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
                        accessibilityRole='button'
                        accessibilityLabel='Remove address'
                      >
                        <Ionicons name='trash-outline' size={16} color='#ef4444' />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>

                <TextInput
                  style={styles.textInput}
                  value={address.line1}
                  onChangeText={(value) => handleAddressChange(address.id, 'line1', value)}
                  placeholder='Address line 1'
                  placeholderTextColor='#94a3b8'
                />
                <TextInput
                  style={styles.textInput}
                  value={address.line2 ?? ''}
                  onChangeText={(value) => handleAddressChange(address.id, 'line2', value)}
                  placeholder='Address line 2 (optional)'
                  placeholderTextColor='#94a3b8'
                />
                <View style={styles.addressInlineRow}>
                  <TextInput
                    style={[styles.textInput, styles.addressInlineInput]}
                    value={address.city}
                    onChangeText={(value) => handleAddressChange(address.id, 'city', value)}
                    placeholder='City'
                    placeholderTextColor='#94a3b8'
                  />
                  <TextInput
                    style={[styles.textInput, styles.addressInlineInput]}
                    value={address.state}
                    onChangeText={(value) => handleAddressChange(address.id, 'state', value)}
                    placeholder='State'
                    placeholderTextColor='#94a3b8'
                  />
                </View>
                <TextInput
                  style={styles.textInput}
                  value={address.postalCode}
                  onChangeText={(value) => handleAddressChange(address.id, 'postalCode', value)}
                  placeholder='Postal code'
                  placeholderTextColor='#94a3b8'
                  keyboardType='number-pad'
                />
              </View>
            ))}

            <TouchableOpacity
              style={styles.addAddressButton}
              onPress={handleAddAddress}
              accessibilityRole='button'
              accessibilityLabel='Add another address'
            >
              <Ionicons name='add-circle-outline' size={18} color='#0C2B4E' />
              <Text style={styles.addAddressText}>Add another address</Text>
            </TouchableOpacity>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleClose}
                accessibilityRole='button'
                accessibilityLabel='Cancel profile update'
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleSubmit}
                accessibilityRole='button'
                accessibilityLabel='Save profile changes'
              >
                <Text style={styles.primaryButtonText}>Save changes</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Animated.View>
    </Modal>
  );
}


function EmptyCartProfile() {
  return (
    <View style={styles.emptyWrapper}>
      <View style={styles.emptyState}>
        <Ionicons name='cart-outline' size={44} color='#0C2B4E' />
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
    <View style={styles.favoriteCard}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={{ width: 60, height: 60, borderRadius: 12, backgroundColor: '#e2e8f0' }} />
      ) : (
        <View style={{ width: 60, height: 60, borderRadius: 12, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="image-outline" size={20} color="#64748b" />
        </View>
      )}
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: '#0f172a' }} numberOfLines={1}>{title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 13, fontWeight: '500', color: '#475569' }}>
            Qty {quantity}
          </Text>
          {lineTotal && (
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#0C2B4E' }}>
              ₹{lineTotal}
            </Text>
          )}
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <TouchableOpacity
          onPress={() => onDecrement(key)}
          style={{ padding: 6, backgroundColor: '#f1f5f9', borderRadius: 8 }}
        >
          <Ionicons name="remove" size={16} color="#0f172a" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onIncrement(key, product)}
          style={{ padding: 6, backgroundColor: '#f1f5f9', borderRadius: 8 }}
        >
          <Ionicons name="add" size={16} color="#0f172a" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onRemove(key)}
          style={{ padding: 6, backgroundColor: '#fee2e2', borderRadius: 8 }}
        >
          <Ionicons name="trash-outline" size={16} color="#dc2626" />
        </TouchableOpacity>
      </View>
    </View>
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
    paddingTop: 100, // Header space
    paddingHorizontal: 20, // Standardized
    paddingBottom: 120,
    gap: 16,
  },
  headerContainer: {
    gap: 24,
    marginBottom: 24,
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: '#e0f2fe',
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
    gap: 8,
  },
  aboutAddressList: {
    gap: 16,
  },
  aboutAddressItem: {
    gap: 4,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  aboutAddressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aboutAddressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#e0f2fe',
  },
  defaultBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0C2B4E',
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
    backgroundColor: '#e0f2fe',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0C2B4E',
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
    color: '#0f172a',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#475569',
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
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  backdropPressable: {
    flex: 1,
  },
  drawerContainer: {
    width: '100%',
  },
  drawerShell: {
    backgroundColor: '#ffffff',
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
    backgroundColor: '#cbd5f5',
    marginBottom: 12,
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  drawerSubtitle: {
    fontSize: 14,
    color: '#475569',
    marginTop: 4,
    marginBottom: 16,
  },
  drawerScroll: {
    flexGrow: 0,
  },
  drawerContent: {
    gap: 18,
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
    color: '#334155',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#cbd5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  sectionHeader: {
    gap: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  sectionHint: {
    fontSize: 13,
    color: '#64748b',
  },
  addressCard: {
    gap: 10,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
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
    borderColor: '#cbd5f5',
    backgroundColor: '#ffffff',
  },
  defaultAddressButtonActive: {
    borderColor: '#0C2B4E',
    backgroundColor: '#e0f2fe',
  },
  defaultAddressButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  defaultAddressButtonTextActive: {
    color: '#0C2B4E',
  },
  removeAddressButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
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
    borderColor: '#bae6fd',
    backgroundColor: '#ecfeff',
  },
  addAddressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0C2B4E',
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
    backgroundColor: '#0C2B4E',
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
    backgroundColor: '#e2e8f0',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
});
