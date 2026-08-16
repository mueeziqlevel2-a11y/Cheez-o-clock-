import { MenuItem, Order, AdminSettings, OrderStatus, CustomerUser, SpecialDeal } from '../types';
import { initialMenu } from '../data/initialMenu';
import { initialSpecialDeals } from '../data/initialSpecialDeals';
import {
  fsCreateOrder,
  fsGetOrders,
  fsUpdateOrderStatus,
  fsDeleteOrder,
  fsDeleteAllOrders,
  fsGetMenu,
  fsSaveMenuItem,
  fsDeleteMenuItem,
  fsDeleteAllMenuItems,
  fsGetSettings,
  fsGetSpecialDeals,
  fsSaveSpecialDeal,
  fsDeleteSpecialDeal
} from './firebase';

// Local storage fallback helpers for static platforms (e.g. Netlify, Vercel, GitHub Pages)
function getLocalMenu(): MenuItem[] {
  try {
    const saved = localStorage.getItem('coc_client_menu');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  localStorage.setItem('coc_client_menu', JSON.stringify(initialMenu));
  return initialMenu;
}

function saveLocalMenu(menu: MenuItem[]): void {
  try {
    localStorage.setItem('coc_client_menu', JSON.stringify(menu));
  } catch (e) {}
}

function getLocalSpecialDeals(): SpecialDeal[] {
  try {
    const saved = localStorage.getItem('coc_client_special_deals');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  localStorage.setItem('coc_client_special_deals', JSON.stringify(initialSpecialDeals));
  return initialSpecialDeals;
}

function saveLocalSpecialDeals(deals: SpecialDeal[]): void {
  try {
    localStorage.setItem('coc_client_special_deals', JSON.stringify(deals));
  } catch (e) {}
}

function getLocalSettings(): AdminSettings {
  try {
    const saved = localStorage.getItem('coc_client_settings');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  const defaults: AdminSettings = { deliveryFee: 100, storeIsOpen: true };
  localStorage.setItem('coc_client_settings', JSON.stringify(defaults));
  return defaults;
}

function saveLocalSettings(settings: AdminSettings): void {
  try {
    localStorage.setItem('coc_client_settings', JSON.stringify(settings));
  } catch (e) {}
}

function getLocalOrders(): Order[] {
  try {
    const saved = localStorage.getItem('coc_client_orders');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return [];
}

function saveLocalOrders(orders: Order[]): void {
  try {
    localStorage.setItem('coc_client_orders', JSON.stringify(orders));
  } catch (e) {}
}

function getLocalCustomers(): (CustomerUser & { passwordHash: string })[] {
  try {
    const saved = localStorage.getItem('coc_client_customers');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return [];
}

function saveLocalCustomers(customers: (CustomerUser & { passwordHash: string })[]): void {
  try {
    localStorage.setItem('coc_client_customers', JSON.stringify(customers));
  } catch (e) {}
}

export function getStoredCustomerToken(): string | null {
  try {
    return localStorage.getItem('coc_customer_token') || sessionStorage.getItem('coc_customer_token');
  } catch (e) {
    return null;
  }
}

export function setStoredCustomerToken(token: string | null, rememberMe: boolean = true): void {
  try {
    if (token) {
      if (rememberMe) {
        localStorage.setItem('coc_customer_token', token);
        sessionStorage.removeItem('coc_customer_token');
      } else {
        sessionStorage.setItem('coc_customer_token', token);
        localStorage.removeItem('coc_customer_token');
      }
    } else {
      localStorage.removeItem('coc_customer_token');
      sessionStorage.removeItem('coc_customer_token');
    }
  } catch (e) {}
}

export function getStoredCustomerUser(): CustomerUser | null {
  try {
    const saved = localStorage.getItem('coc_customer_user') || sessionStorage.getItem('coc_customer_user');
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    return null;
  }
}

export function setStoredCustomerUser(user: CustomerUser | null, rememberMe: boolean = true): void {
  try {
    if (user) {
      if (rememberMe) {
        localStorage.setItem('coc_customer_user', JSON.stringify(user));
        sessionStorage.removeItem('coc_customer_user');
      } else {
        sessionStorage.setItem('coc_customer_user', JSON.stringify(user));
        localStorage.removeItem('coc_customer_user');
      }
    } else {
      localStorage.removeItem('coc_customer_user');
      sessionStorage.removeItem('coc_customer_user');
    }
  } catch (e) {}
}

// Check if response is valid JSON
async function parseResponseJson(res: Response): Promise<any> {
  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error('Non-JSON server response (Static host fallback)');
  }
  return res.json();
}

export async function fetchMenu(): Promise<MenuItem[]> {
  try {
    const res = await fetch('/api/menu');
    if (res.ok) {
      const data = await parseResponseJson(res);
      if (Array.isArray(data) && data.length > 0) {
        saveLocalMenu(data);
        return data;
      }
    }
  } catch (e) {
    // API server unreachable or static deployment (e.g. Netlify)
  }

  try {
    const fsMenu = await fsGetMenu();
    if (fsMenu && fsMenu.length > 0) {
      saveLocalMenu(fsMenu);
      return fsMenu;
    }
  } catch (e) {}

  return getLocalMenu();
}

export async function fetchSettings(): Promise<AdminSettings> {
  try {
    const res = await fetch('/api/settings');
    if (res.ok) {
      const data = await parseResponseJson(res);
      saveLocalSettings(data);
      return data;
    }
  } catch (e) {}

  try {
    const fsSettings = await fsGetSettings();
    if (fsSettings) {
      saveLocalSettings(fsSettings);
      return fsSettings;
    }
  } catch (e) {}

  return getLocalSettings();
}

export async function placeOrder(orderData: {
  customerId?: string;
  customerEmail?: string;
  customerName: string;
  phone: string;
  address: string;
  mapLocation?: string;
  notes?: string;
  items: { id: string; name: string; price: number; quantity: number; image: string; notes?: string }[];
}): Promise<{ success: boolean; order: Order }> {
  let createdOrder: Order | null = null;

  // 1. Save directly to Cloud Firestore FIRST for instant global sync across all devices
  try {
    createdOrder = await fsCreateOrder(orderData);
  } catch (err) {
    console.error('Direct Firestore placeOrder error:', err);
  }

  // 2. Also notify server API endpoint if active
  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    if (res.ok) {
      const data = await parseResponseJson(res);
      if (data && data.order) {
        createdOrder = data.order;
      }
    }
  } catch (e) {}

  if (createdOrder) {
    const local = getLocalOrders();
    if (!local.some(o => o.id === createdOrder!.id)) {
      local.unshift(createdOrder);
      saveLocalOrders(local);
    }
    return { success: true, order: createdOrder };
  }

  // 3. Fallback for offline static host
  const settings = getLocalSettings();
  const subtotal = orderData.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = settings.deliveryFee;
  const total = subtotal + deliveryFee;

  const now = new Date().toISOString();
  const newOrder: Order = {
    id: `COC-${Math.floor(1000 + Math.random() * 9000)}`,
    customerId: orderData.customerId,
    customerEmail: orderData.customerEmail,
    customerName: orderData.customerName,
    phone: orderData.phone,
    address: orderData.address,
    mapLocation: orderData.mapLocation,
    notes: orderData.notes,
    items: orderData.items,
    subtotal,
    deliveryFee,
    total,
    paymentMethod: 'Cash on Delivery',
    status: 'NEW',
    createdAt: now,
    updatedAt: now
  };

  const localOrders = getLocalOrders();
  localOrders.unshift(newOrder);
  saveLocalOrders(localOrders);

  return { success: true, order: newOrder };
}

// --- CUSTOMER API ---
export async function customerSignup(data: {
  name?: string;
  email?: string;
  phone: string;
  password: string;
  address?: string;
}, rememberMe: boolean = true): Promise<{ token: string; user: CustomerUser }> {
  try {
    const res = await fetch('/api/customer/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await parseResponseJson(res);
    if (!res.ok) {
      throw new Error(json.error || 'Signup failed');
    }
    setStoredCustomerToken(json.token, rememberMe);
    setStoredCustomerUser(json.user, rememberMe);
    return json;
  } catch (err: any) {
    if (err.message && !err.message.includes('Non-JSON server response')) {
      throw err;
    }
  }

  // Fallback for static platforms
  const cleanPhone = data.phone.trim();
  const cleanEmail = data.email ? data.email.trim().toLowerCase() : `${cleanPhone.replace(/\D/g, '')}@cheezoclock.pk`;
  const customers = getLocalCustomers();

  if (customers.some(c => c.phone.replace(/\D/g, '') === cleanPhone.replace(/\D/g, ''))) {
    throw new Error('An account with this phone number already exists. Please log in.');
  }

  const newId = 'cust-' + Date.now();
  const newUser: CustomerUser = {
    id: newId,
    name: data.name ? data.name.trim() : `Customer (${cleanPhone.slice(-4)})`,
    email: cleanEmail,
    phone: cleanPhone,
    address: data.address ? data.address.trim() : '',
    wishlistIds: [],
    createdAt: new Date().toISOString()
  };

  customers.push({ ...newUser, passwordHash: data.password });
  saveLocalCustomers(customers);

  const mockToken = `mock-token-${newId}`;
  setStoredCustomerToken(mockToken, rememberMe);
  setStoredCustomerUser(newUser, rememberMe);

  return { token: mockToken, user: newUser };
}

export async function customerLogin(identifier: string, password: string, rememberMe: boolean = true): Promise<{ token: string; user: CustomerUser }> {
  try {
    const res = await fetch('/api/customer/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });
    const json = await parseResponseJson(res);
    if (!res.ok) {
      throw new Error(json.error || 'Login failed');
    }
    setStoredCustomerToken(json.token, rememberMe);
    setStoredCustomerUser(json.user, rememberMe);
    return json;
  } catch (err: any) {
    if (err.message && !err.message.includes('Non-JSON server response')) {
      throw err;
    }
  }

  // Fallback for static platforms
  const cleanId = identifier.trim().toLowerCase();
  const cleanPhone = identifier.replace(/\D/g, '');
  const customers = getLocalCustomers();

  const matched = customers.find(c =>
    (c.email === cleanId || (cleanPhone && c.phone.replace(/\D/g, '') === cleanPhone)) &&
    c.passwordHash === password
  );

  if (!matched) {
    throw new Error('Invalid phone/email or password.');
  }

  const { passwordHash, ...safeUser } = matched;
  const mockToken = `mock-token-${safeUser.id}`;
  setStoredCustomerToken(mockToken, rememberMe);
  setStoredCustomerUser(safeUser, rememberMe);

  return { token: mockToken, user: safeUser };
}

export async function customerResetPassword(identifier: string, newPassword: string): Promise<string> {
  try {
    const res = await fetch('/api/customer/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, newPassword })
    });
    const json = await parseResponseJson(res);
    if (!res.ok) {
      throw new Error(json.error || 'Password reset failed');
    }
    return json.message || 'Password reset successfully!';
  } catch (err: any) {
    if (err.message && !err.message.includes('Non-JSON server response')) {
      throw err;
    }
  }

  // Fallback for static platforms
  const cleanId = identifier.trim().toLowerCase();
  const cleanPhone = identifier.replace(/\D/g, '');
  const customers = getLocalCustomers();

  const matched = customers.find(c =>
    c.email === cleanId || (cleanPhone && c.phone.replace(/\D/g, '') === cleanPhone)
  );

  if (!matched) {
    throw new Error('No account found with this Phone Number or Email address.');
  }

  matched.passwordHash = newPassword;
  saveLocalCustomers(customers);

  return 'Your password has been reset successfully! You can now log in.';
}

export async function customerGoogleAuth(name: string, email: string): Promise<{ token: string; user: CustomerUser }> {
  try {
    const res = await fetch('/api/customer/google-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email })
    });
    const json = await parseResponseJson(res);
    if (!res.ok) {
      throw new Error(json.error || 'Google auth failed');
    }
    setStoredCustomerToken(json.token);
    setStoredCustomerUser(json.user);
    return json;
  } catch (err: any) {
    if (err.message && !err.message.includes('Non-JSON server response')) {
      throw err;
    }
  }

  // Fallback for static hosts
  const cleanEmail = email.toLowerCase().trim();
  const customers = getLocalCustomers();
  let matched = customers.find(c => c.email === cleanEmail);

  if (!matched) {
    const newId = 'cust-g-' + Date.now();
    const newUser: CustomerUser = {
      id: newId,
      name: name || 'Google Customer',
      email: cleanEmail,
      phone: '',
      address: '',
      wishlistIds: [],
      createdAt: new Date().toISOString()
    };
    customers.push({ ...newUser, passwordHash: 'GOOGLE_OAUTH' });
    saveLocalCustomers(customers);
    matched = { ...newUser, passwordHash: 'GOOGLE_OAUTH' };
  }

  const { passwordHash, ...safeUser } = matched;
  const mockToken = `mock-token-${safeUser.id}`;
  setStoredCustomerToken(mockToken);
  setStoredCustomerUser(safeUser);

  return { token: mockToken, user: safeUser };
}

export async function fetchCustomerProfile(token: string): Promise<CustomerUser> {
  try {
    const res = await fetch('/api/customer/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await parseResponseJson(res);
      if (data && data.user) {
        setStoredCustomerUser(data.user);
        return data.user;
      }
    }
  } catch (e) {}

  const cached = getStoredCustomerUser();
  if (cached) return cached;
  throw new Error('Unauthorized');
}

export async function syncCustomerWishlist(token: string, wishlistIds: string[]): Promise<string[]> {
  try {
    const res = await fetch('/api/customer/wishlist', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ wishlistIds })
    });
    if (res.ok) {
      const data = await parseResponseJson(res);
      if (data && data.wishlistIds) return data.wishlistIds;
    }
  } catch (e) {}

  // Fallback for static platforms
  const cachedUser = getStoredCustomerUser();
  if (cachedUser) {
    cachedUser.wishlistIds = wishlistIds;
    setStoredCustomerUser(cachedUser);

    const customers = getLocalCustomers();
    const idx = customers.findIndex(c => c.id === cachedUser.id);
    if (idx !== -1) {
      customers[idx].wishlistIds = wishlistIds;
      saveLocalCustomers(customers);
    }
  }
  return wishlistIds;
}

export async function fetchCustomerOrderHistory(token: string, customerUser?: CustomerUser | null): Promise<Order[]> {
  try {
    const res = await fetch('/api/customer/orders', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await parseResponseJson(res);
      if (Array.isArray(data)) return data;
    }
  } catch (e) {}

  // Fallback for static platforms
  const allOrders = getLocalOrders();
  if (!customerUser) return [];

  const cleanEmail = customerUser.email.trim().toLowerCase();
  const cleanPhone = customerUser.phone.replace(/\D/g, '');

  return allOrders.filter(o => {
    if (o.customerEmail && o.customerEmail.trim().toLowerCase() === cleanEmail) return true;
    if (o.phone && o.phone.replace(/\D/g, '') === cleanPhone) return true;
    return false;
  });
}

export async function trackOrder(query: string): Promise<Order> {
  try {
    const res = await fetch(`/api/orders/track/${encodeURIComponent(query)}`);
    if (res.ok) {
      const data = await parseResponseJson(res);
      if (data) return data;
    }
  } catch (e) {}

  // Direct Firestore query
  try {
    const cleanQuery = query.trim().toLowerCase().replace('#', '');
    const cleanDigits = query.replace(/\D/g, '');
    const fsOrders = await fsGetOrders();
    const matched = fsOrders.find((o) =>
      o.id.toLowerCase().includes(cleanQuery) ||
      (cleanDigits && o.phone.replace(/\D/g, '').includes(cleanDigits))
    );
    if (matched) return matched;
  } catch (e) {}

  // Local fallback
  const cleanQuery = query.trim().toLowerCase().replace('#', '');
  const localOrders = getLocalOrders();
  const matched = localOrders.find(
    (o) => o.id.toLowerCase().includes(cleanQuery) || o.phone.replace(/\D/g, '').includes(cleanQuery)
  );

  if (matched) return matched;
  throw new Error('Order not found. Please verify your order # or phone number.');
}

// Admin API
export async function adminLogin(email: string, password: string): Promise<{ token: string; admin: any }> {
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await parseResponseJson(res);
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  } catch (e: any) {
    if (e.message && e.message.includes('Login failed')) {
      throw e;
    }
  }

  // Fallback for static hosts (e.g. Netlify)
  if (email.trim().toLowerCase() === 'admin@cheezoclock.pk' && password === 'cheezoclock123') {
    return { token: 'static-host-admin-token-12345', admin: { email: 'admin@cheezoclock.pk' } };
  }
  throw new Error('Invalid admin password. Master Password is: cheezoclock123');
}

export async function fetchAdminOrders(token: string): Promise<Order[]> {
  try {
    const res = await fetch('/api/orders', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await parseResponseJson(res);
      if (Array.isArray(data) && data.length > 0) {
        saveLocalOrders(data);
        return data;
      }
    }
  } catch (e) {}

  // Direct Firestore fetch
  try {
    const fsOrders = await fsGetOrders();
    if (fsOrders && fsOrders.length > 0) {
      saveLocalOrders(fsOrders);
      return fsOrders;
    }
  } catch (e) {}

  return getLocalOrders();
}

export async function updateOrderStatus(token: string, orderId: string, status: OrderStatus): Promise<Order> {
  try {
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      const data = await parseResponseJson(res);
      if (data && data.order) return data.order;
    }
  } catch (e) {}

  // Direct Firestore update
  try {
    const updated = await fsUpdateOrderStatus(orderId, status);
    if (updated) return updated;
  } catch (e) {}

  const orders = getLocalOrders();
  const index = orders.findIndex((o) => o.id === orderId);
  if (index !== -1) {
    orders[index].status = status;
    orders[index].updatedAt = new Date().toISOString();
    saveLocalOrders(orders);
    return orders[index];
  }
  throw new Error('Order not found');
}

export async function deleteAdminOrder(token: string, orderId: string): Promise<void> {
  try {
    const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      const json = await parseResponseJson(res);
      if (res.status === 401 || res.status === 403) {
        throw new Error(json.error || 'Admin session expired. Please log in again.');
      }
    } else {
      await fsDeleteOrder(orderId).catch(() => {});
      return;
    }
  } catch (err: any) {
    if (err.message && err.message.includes('Admin session expired')) {
      throw err;
    }
  }

  await fsDeleteOrder(orderId).catch(() => {});

  const clean = orderId.toUpperCase().trim();
  const cleanDigits = orderId.replace(/\D/g, '');
  const orders = getLocalOrders().filter(o => {
    const oId = o.id.toUpperCase().trim();
    const oDigits = o.id.replace(/\D/g, '');
    if (oId === clean) return false;
    if (cleanDigits && oDigits && cleanDigits === oDigits) return false;
    return true;
  });
  saveLocalOrders(orders);
}

export async function deleteAllAdminOrders(token: string): Promise<void> {
  try {
    const res = await fetch('/api/orders', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      const json = await parseResponseJson(res);
      if (res.status === 401 || res.status === 403) {
        throw new Error(json.error || 'Admin session expired. Please log in again.');
      }
    }
  } catch (err: any) {
    if (err.message && err.message.includes('Admin session expired')) {
      throw err;
    }
  }

  await fsDeleteAllOrders().catch(() => {});
  saveLocalOrders([]);
}

export async function addMenuItem(token: string, item: Omit<MenuItem, 'id'>): Promise<MenuItem> {
  const newId = 'm-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
  const newItem: MenuItem = {
    ...item,
    id: newId,
    price: Number(item.price)
  };

  // 1. Direct Firestore write for instant global sync
  try {
    await fsSaveMenuItem(newItem);
  } catch (err) {
    console.warn('Direct Firestore addMenuItem fallback:', err);
  }

  // 2. Server API
  try {
    const res = await fetch('/api/menu', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(newItem)
    });
    if (res.ok) {
      const data = await parseResponseJson(res);
      if (data && data.item) {
        const local = getLocalMenu().filter(m => m.id !== data.item.id);
        local.push(data.item);
        saveLocalMenu(local);
        return data.item;
      }
    }
  } catch (e) {}

  const menu = getLocalMenu().filter(m => m.id !== newItem.id);
  menu.push(newItem);
  saveLocalMenu(menu);
  return newItem;
}

export async function updateMenuItem(token: string, id: string, update: Partial<MenuItem>): Promise<MenuItem> {
  const cleanId = id.trim();
  let updatedItem: MenuItem | null = null;

  // 1. Direct Firestore update for instant real-time sync across all clients
  try {
    const local = getLocalMenu();
    let existing = local.find(m => m.id === cleanId) || initialMenu.find(m => m.id === cleanId);
    if (existing) {
      const merged: MenuItem = {
        ...existing,
        ...update,
        id: cleanId,
        price: update.price !== undefined ? Number(update.price) : existing.price
      };
      await fsSaveMenuItem(merged);
      updatedItem = merged;
    }
  } catch (err) {
    console.warn('Direct Firestore updateMenuItem warn:', err);
  }

  // 2. Server API update
  try {
    const res = await fetch(`/api/menu/${encodeURIComponent(cleanId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(update)
    });
    if (res.ok) {
      const data = await parseResponseJson(res);
      if (data && data.item) {
        updatedItem = data.item;
      }
    }
  } catch (e) {}

  // 3. Local update and state persistence
  const menu = getLocalMenu();
  const index = menu.findIndex((m) => m.id === cleanId);
  if (index !== -1) {
    menu[index] = {
      ...menu[index],
      ...update,
      price: update.price !== undefined ? Number(update.price) : menu[index].price
    };
    saveLocalMenu(menu);
    return menu[index];
  } else if (updatedItem) {
    menu.push(updatedItem);
    saveLocalMenu(menu);
    return updatedItem;
  }

  // Fallback if not found in cache
  const base = initialMenu.find(m => m.id === cleanId);
  if (base) {
    const fallback: MenuItem = {
      ...base,
      ...update,
      id: cleanId,
      price: update.price !== undefined ? Number(update.price) : base.price
    };
    menu.push(fallback);
    saveLocalMenu(menu);
    return fallback;
  }

  throw new Error('Menu item not found');
}

export async function deleteMenuItem(token: string, id: string): Promise<void> {
  const cleanId = id.trim();

  // 1. Direct Firestore delete
  try {
    await fsDeleteMenuItem(cleanId);
  } catch (err) {
    console.warn('Direct Firestore deleteMenuItem warn:', err);
  }

  // 2. Server API delete
  try {
    const res = await fetch(`/api/menu/${encodeURIComponent(cleanId)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      const json = await parseResponseJson(res);
      if (res.status === 401 || res.status === 403) {
        throw new Error(json.error || 'Admin session expired. Please log in again.');
      }
    }
  } catch (err: any) {
    if (err.message && err.message.includes('Admin session expired')) {
      throw err;
    }
  }

  const menu = getLocalMenu().filter((m) => m.id.trim() !== cleanId);
  saveLocalMenu(menu);
}

export async function deleteAllAdminMenuItems(token: string): Promise<void> {
  // 1. Direct Firestore delete all
  try {
    await fsDeleteAllMenuItems();
  } catch (e) {}

  // 2. Server API delete all
  try {
    const res = await fetch('/api/menu', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      const json = await parseResponseJson(res);
      if (res.status === 401 || res.status === 403) {
        throw new Error(json.error || 'Admin session expired. Please log in again.');
      }
    }
  } catch (err: any) {
    if (err.message && err.message.includes('Admin session expired')) {
      throw err;
    }
  }

  saveLocalMenu([]);
}

export async function clearAdminCustomers(token: string): Promise<void> {
  try {
    const res = await fetch('/api/customers', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      const json = await parseResponseJson(res);
      if (res.status === 401 || res.status === 403) {
        throw new Error(json.error || 'Admin session expired. Please log in again.');
      }
    }
  } catch (err: any) {
    if (err.message && err.message.includes('Admin session expired')) {
      throw err;
    }
  }

  saveLocalCustomers([]);
}

export async function updateAdminSettings(token: string, settings: Partial<AdminSettings>): Promise<AdminSettings> {
  try {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(settings)
    });
    if (res.ok) {
      const data = await parseResponseJson(res);
      if (data && data.settings) return data.settings;
    }
  } catch (e) {}

  const current = getLocalSettings();
  const updated = { ...current, ...settings };
  saveLocalSettings(updated);
  return updated;
}

// ==========================================
// SPECIAL DEALS API & ADMIN HELPERS
// ==========================================

export async function fetchSpecialDeals(): Promise<SpecialDeal[]> {
  try {
    const res = await fetch('/api/special-deals');
    if (res.ok) {
      const data = await parseResponseJson(res);
      if (Array.isArray(data) && data.length > 0) {
        saveLocalSpecialDeals(data);
        return data;
      }
    }
  } catch (e) {}

  try {
    const fsDeals = await fsGetSpecialDeals();
    if (fsDeals && fsDeals.length > 0) {
      saveLocalSpecialDeals(fsDeals);
      return fsDeals;
    }
  } catch (e) {}

  return getLocalSpecialDeals();
}

export async function saveAdminSpecialDeal(token: string, deal: SpecialDeal): Promise<SpecialDeal> {
  try {
    const res = await fetch('/api/special-deals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(deal)
    });
    if (res.ok) {
      const data = await parseResponseJson(res);
      if (data && data.deal) {
        const deals = getLocalSpecialDeals();
        const idx = deals.findIndex((d) => d.id === deal.id);
        if (idx > -1) deals[idx] = data.deal;
        else deals.push(data.deal);
        saveLocalSpecialDeals(deals);
        return data.deal;
      }
    } else {
      const json = await parseResponseJson(res);
      if (res.status === 401 || res.status === 403) {
        throw new Error(json.error || 'Admin session expired. Please log in again.');
      }
    }
  } catch (err: any) {
    if (err.message && err.message.includes('Admin session expired')) {
      throw err;
    }
  }

  // Firestore & local fallback
  try {
    await fsSaveSpecialDeal(deal);
  } catch (e) {}

  const deals = getLocalSpecialDeals();
  const idx = deals.findIndex((d) => d.id === deal.id);
  if (idx > -1) deals[idx] = deal;
  else deals.push(deal);
  saveLocalSpecialDeals(deals);
  return deal;
}

export async function deleteAdminSpecialDeal(token: string, id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/special-deals/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!res.ok) {
      const json = await parseResponseJson(res);
      if (res.status === 401 || res.status === 403) {
        throw new Error(json.error || 'Admin session expired. Please log in again.');
      }
    }
  } catch (err: any) {
    if (err.message && err.message.includes('Admin session expired')) {
      throw err;
    }
  }

  // Firestore & local fallback
  try {
    await fsDeleteSpecialDeal(id);
  } catch (e) {}

  const deals = getLocalSpecialDeals().filter((d) => d.id !== id);
  saveLocalSpecialDeals(deals);
  return true;
}

export async function addSpecialDeal(
  token: string,
  dealData: Partial<SpecialDeal> & { name: string; price: number }
): Promise<SpecialDeal> {
  const now = new Date().toISOString();
  const newDeal: SpecialDeal = {
    id: dealData.id || `deal-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: dealData.name,
    description: dealData.description || '',
    price: dealData.price,
    originalPrice: dealData.originalPrice,
    image: dealData.image || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800',
    includedProductIds: dealData.includedProductIds || [],
    includedItemsSummary: dealData.includedItemsSummary || '',
    startDate: dealData.startDate || now,
    endDate: dealData.endDate || new Date(Date.now() + 30 * 86400000).toISOString(),
    isActive: dealData.isActive !== false,
    createdAt: dealData.createdAt || now,
    updatedAt: now
  };

  return saveAdminSpecialDeal(token, newDeal);
}

export async function updateSpecialDeal(
  token: string,
  id: string,
  updates: Partial<SpecialDeal>
): Promise<SpecialDeal> {
  const now = new Date().toISOString();
  const existingDeals = getLocalSpecialDeals();
  const current = existingDeals.find(d => d.id === id);
  const updatedDeal: SpecialDeal = {
    id,
    name: updates.name ?? current?.name ?? 'Special Deal',
    description: updates.description ?? current?.description ?? '',
    price: updates.price ?? current?.price ?? 1000,
    originalPrice: updates.originalPrice !== undefined ? updates.originalPrice : current?.originalPrice,
    image: updates.image ?? current?.image ?? 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800',
    includedProductIds: updates.includedProductIds ?? current?.includedProductIds ?? [],
    includedItemsSummary: updates.includedItemsSummary ?? current?.includedItemsSummary ?? '',
    startDate: updates.startDate ?? current?.startDate ?? now,
    endDate: updates.endDate ?? current?.endDate ?? new Date(Date.now() + 30 * 86400000).toISOString(),
    isActive: updates.isActive !== undefined ? updates.isActive : (current?.isActive !== false),
    createdAt: current?.createdAt || now,
    updatedAt: now
  };

  return saveAdminSpecialDeal(token, updatedDeal);
}

export const deleteSpecialDeal = deleteAdminSpecialDeal;

