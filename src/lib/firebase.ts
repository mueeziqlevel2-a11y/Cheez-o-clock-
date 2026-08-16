import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { Order, MenuItem, AdminSettings, OrderStatus, SpecialDeal } from '../types';
import jsonConfig from '../../firebase-applet-config.json';

// Robust configuration merging VITE env vars, JSON config, and embedded defaults for Netlify exports
const getEnvVar = (key: string): string | undefined => {
  try {
    return (import.meta as any)?.env?.[key];
  } catch (e) {
    return undefined;
  }
};

const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY') || jsonConfig.apiKey || "",
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN') || jsonConfig.authDomain || "",
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID') || jsonConfig.projectId || "",
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET') || jsonConfig.storageBucket || "",
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID') || jsonConfig.messagingSenderId || "",
  appId: getEnvVar('VITE_FIREBASE_APP_ID') || jsonConfig.appId || "",
  firestoreDatabaseId: getEnvVar('VITE_FIREBASE_DATABASE_ID') || jsonConfig.firestoreDatabaseId || ""
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

// Collection references
const ORDERS_COL = 'orders';
const MENU_COL = 'menu';
const SPECIAL_DEALS_COL = 'special_deals';
const SETTINGS_COL = 'settings';
const CUSTOMERS_COL = 'customers';
const COUNTER_DOC = 'meta/counters';

// --- REAL-TIME LISTENERS FOR CLIENT & ADMIN ---

export function subscribeOrders(onUpdate: (orders: Order[]) => void, onError?: (err: any) => void) {
  const colRef = collection(firestore, ORDERS_COL);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const ordersList: Order[] = snapshot.docs.map((docSnap) => ({
        ...(docSnap.data() as Order),
        id: docSnap.id
      }));
      // Sort newest first
      ordersList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(ordersList);
    },
    (err) => {
      console.error('Firestore orders subscription error:', err);
      if (onError) onError(err);
    }
  );
}

export function subscribeMenu(onUpdate: (items: MenuItem[]) => void) {
  const colRef = collection(firestore, MENU_COL);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const menuList: MenuItem[] = snapshot.docs.map((docSnap) => ({
        ...(docSnap.data() as MenuItem),
        id: docSnap.id
      }));
      onUpdate(menuList);
    },
    (err) => console.error('Firestore menu subscription error:', err)
  );
}

export function subscribeSettings(onUpdate: (settings: AdminSettings) => void) {
  const docRef = doc(firestore, SETTINGS_COL, 'global');
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data() as AdminSettings);
      } else {
        const defaults: AdminSettings = {
          deliveryFee: 100,
          storeIsOpen: true,
          announcement: "Hot & Fresh Cheez O'Clock Delivered Fast in Rawalpindi!"
        };
        onUpdate(defaults);
      }
    },
    (err) => console.error('Firestore settings subscription error:', err)
  );
}

// --- FIRESTORE DIRECT DATA FUNCTIONS ---

// Orders
export async function fsGetOrders(): Promise<Order[]> {
  try {
    const snap = await getDocs(collection(firestore, ORDERS_COL));
    const list: Order[] = snap.docs.map((d) => ({ ...(d.data() as Order), id: d.id }));
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  } catch (err) {
    console.error('fsGetOrders error:', err);
    return [];
  }
}

export async function fsCreateOrder(orderData: {
  customerId?: string;
  customerEmail?: string;
  customerName: string;
  phone: string;
  address: string;
  mapLocation?: string;
  notes?: string;
  items: { id: string; name: string; price: number; quantity: number; image: string; notes?: string }[];
}): Promise<Order> {
  // Get settings for delivery fee (fail-safe)
  let deliveryFee = 100;
  try {
    const settingsSnap = await getDoc(doc(firestore, SETTINGS_COL, 'global'));
    if (settingsSnap.exists()) {
      deliveryFee = (settingsSnap.data() as AdminSettings).deliveryFee ?? 100;
    }
  } catch (e) {
    console.warn('fsCreateOrder settings fetch error:', e);
  }

  // Calculate order counter (fail-safe)
  let nextCounter = Math.floor(1000 + Math.random() * 9000);
  const counterRef = doc(firestore, COUNTER_DOC);
  try {
    const counterSnap = await getDoc(counterRef);
    if (counterSnap.exists()) {
      nextCounter = (counterSnap.data().orderCounter || 1000) + 1;
    } else {
      nextCounter = 1001;
    }
    await setDoc(counterRef, { orderCounter: nextCounter }, { merge: true });
  } catch (e) {
    console.warn('Counter fetch error, fallback counter generated:', e);
  }

  const orderId = `COC-${nextCounter}`;
  const subtotal = orderData.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + deliveryFee;
  const now = new Date().toISOString();

  const newOrder: Order = {
    id: orderId,
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

  await setDoc(doc(firestore, ORDERS_COL, orderId), newOrder);
  return newOrder;
}

export async function fsUpdateOrderStatus(orderId: string, status: OrderStatus): Promise<Order | null> {
  const cleanId = orderId.trim().toUpperCase();
  const orderRef = doc(firestore, ORDERS_COL, cleanId);
  const snap = await getDoc(orderRef);
  if (!snap.exists()) {
    // Try matching by digits or case-insensitive query if doc ID differs
    const allOrdersSnap = await getDocs(collection(firestore, ORDERS_COL));
    const target = allOrdersSnap.docs.find(d => {
      const dId = d.id.trim().toUpperCase();
      return dId === cleanId || dId.replace(/\D/g, '') === orderId.replace(/\D/g, '');
    });
    if (target) {
      const now = new Date().toISOString();
      await updateDoc(doc(firestore, ORDERS_COL, target.id), { status, updatedAt: now });
      return { ...(target.data() as Order), id: target.id, status, updatedAt: now };
    }
    return null;
  }
  const now = new Date().toISOString();
  await updateDoc(orderRef, { status, updatedAt: now });
  return { ...(snap.data() as Order), id: cleanId, status, updatedAt: now };
}

export async function fsDeleteOrder(orderId: string): Promise<boolean> {
  const cleanId = orderId.trim().toUpperCase();
  const cleanDigits = orderId.replace(/\D/g, '');
  
  // Try direct doc delete
  const docRef = doc(firestore, ORDERS_COL, cleanId);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    await deleteDoc(docRef);
    return true;
  }

  // Scan all orders for match by cleanDigits or uppercase id
  const allSnap = await getDocs(collection(firestore, ORDERS_COL));
  const target = allSnap.docs.find(d => {
    const dId = d.id.trim().toUpperCase();
    const dDigits = d.id.replace(/\D/g, '');
    return dId === cleanId || (cleanDigits && dDigits && dDigits === cleanDigits);
  });

  if (target) {
    await deleteDoc(doc(firestore, ORDERS_COL, target.id));
    return true;
  }

  return false;
}

export async function fsDeleteAllOrders(): Promise<number> {
  const snap = await getDocs(collection(firestore, ORDERS_COL));
  const batch = writeBatch(firestore);
  snap.docs.forEach((docSnap) => {
    batch.delete(docSnap.ref);
  });
  await batch.commit();
  return snap.docs.length;
}

// Menu
export async function fsGetMenu(): Promise<MenuItem[]> {
  try {
    const snap = await getDocs(collection(firestore, MENU_COL));
    return snap.docs.map((d) => ({ ...(d.data() as MenuItem), id: d.id }));
  } catch (err) {
    console.error('fsGetMenu error:', err);
    return [];
  }
}

export async function fsSaveMenuItem(item: MenuItem): Promise<MenuItem> {
  await setDoc(doc(firestore, MENU_COL, item.id), item);
  return item;
}

export async function fsDeleteMenuItem(id: string): Promise<boolean> {
  await deleteDoc(doc(firestore, MENU_COL, id));
  return true;
}

export async function fsDeleteAllMenuItems(): Promise<number> {
  const snap = await getDocs(collection(firestore, MENU_COL));
  const batch = writeBatch(firestore);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  return snap.docs.length;
}

// Settings
export async function fsGetSettings(): Promise<AdminSettings> {
  const snap = await getDoc(doc(firestore, SETTINGS_COL, 'global'));
  if (snap.exists()) {
    return snap.data() as AdminSettings;
  }
  const defaults: AdminSettings = {
    deliveryFee: 100,
    storeIsOpen: true,
    announcement: "Hot & Fresh Cheez O'Clock Delivered Fast in Rawalpindi!"
  };
  await setDoc(doc(firestore, SETTINGS_COL, 'global'), defaults);
  return defaults;
}

export async function fsUpdateSettings(settings: Partial<AdminSettings>): Promise<AdminSettings> {
  const current = await fsGetSettings();
  const updated = { ...current, ...settings };
  await setDoc(doc(firestore, SETTINGS_COL, 'global'), updated);
  return updated;
}

// --- SPECIAL DEALS FIRESTORE OPERATIONS ---

export function subscribeSpecialDeals(onUpdate: (deals: SpecialDeal[]) => void, onError?: (err: any) => void) {
  const colRef = collection(firestore, SPECIAL_DEALS_COL);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const dealsList: SpecialDeal[] = snapshot.docs.map((docSnap) => ({
        ...(docSnap.data() as SpecialDeal),
        id: docSnap.id
      }));
      onUpdate(dealsList);
    },
    (err) => {
      console.warn('Firestore subscribeSpecialDeals offline/error:', err);
      if (onError) onError(err);
    }
  );
}

export async function fsGetSpecialDeals(): Promise<SpecialDeal[]> {
  try {
    const snap = await getDocs(collection(firestore, SPECIAL_DEALS_COL));
    return snap.docs.map((d) => ({ ...(d.data() as SpecialDeal), id: d.id }));
  } catch (err) {
    console.warn('fsGetSpecialDeals fallback:', err);
    return [];
  }
}

export async function fsSaveSpecialDeal(deal: SpecialDeal): Promise<SpecialDeal> {
  const docRef = doc(firestore, SPECIAL_DEALS_COL, deal.id);
  await setDoc(docRef, deal, { merge: true });
  return deal;
}

export async function fsDeleteSpecialDeal(id: string): Promise<boolean> {
  const docRef = doc(firestore, SPECIAL_DEALS_COL, id);
  await deleteDoc(docRef);
  return true;
}

