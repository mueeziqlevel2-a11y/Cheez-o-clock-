import bcrypt from 'bcryptjs';
import { MenuItem, Order, AdminSettings, OrderStatus, CustomerUser, SpecialDeal } from '../types';
import { initialMenu } from '../data/initialMenu';
import { initialSpecialDeals } from '../data/initialSpecialDeals';
import {
  firestore,
  fsGetSettings,
  fsUpdateSettings,
  fsGetMenu,
  fsSaveMenuItem,
  fsDeleteMenuItem,
  fsDeleteAllMenuItems,
  fsGetOrders,
  fsCreateOrder,
  fsUpdateOrderStatus,
  fsDeleteOrder,
  fsDeleteAllOrders,
  fsGetSpecialDeals,
  fsSaveSpecialDeal,
  fsDeleteSpecialDeal
} from '../lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';

export interface StoredCustomerUser extends CustomerUser {
  passwordHash: string;
}

const CUSTOMERS_COL = 'customers';
const ADMIN_AUTH_DOC = 'meta/adminAuth';

export class FirestoreDatabase {
  // --- SETTINGS ---
  public async getSettings(): Promise<AdminSettings> {
    return await fsGetSettings();
  }

  public async updateSettings(newSettings: Partial<AdminSettings>): Promise<AdminSettings> {
    return await fsUpdateSettings(newSettings);
  }

  // --- MENU ---
  public async getMenu(): Promise<MenuItem[]> {
    let items = await fsGetMenu();
    if (items.length === 0) {
      // Seed initial menu to Firestore on first run
      console.log('Seeding initial menu to Firestore...');
      for (const item of initialMenu) {
        await fsSaveMenuItem(item);
      }
      items = await fsGetMenu();
    }
    return items;
  }

  public async getMenuItem(id: string): Promise<MenuItem | undefined> {
    const cleanId = id.trim();
    const snap = await getDoc(doc(firestore, 'menu', cleanId));
    if (snap.exists()) {
      return { ...(snap.data() as MenuItem), id: snap.id };
    }
    const base = initialMenu.find(m => m.id === cleanId);
    if (base) {
      await fsSaveMenuItem(base);
      return base;
    }
    return undefined;
  }

  public async addMenuItem(item: Omit<MenuItem, 'id'>): Promise<MenuItem> {
    const newId = 'm-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    const newItem: MenuItem = {
      ...item,
      id: newId,
      price: Number(item.price)
    };
    return await fsSaveMenuItem(newItem);
  }

  public async updateMenuItem(id: string, update: Partial<MenuItem>): Promise<MenuItem | undefined> {
    const cleanId = id.trim();
    let existing = await this.getMenuItem(cleanId);
    if (!existing) {
      const base = initialMenu.find(m => m.id === cleanId);
      if (!base) return undefined;
      existing = base;
    }
    const updated: MenuItem = {
      ...existing,
      ...update,
      id: cleanId,
      price: update.price !== undefined ? Number(update.price) : existing.price
    };
    await fsSaveMenuItem(updated);
    return updated;
  }

  public async deleteMenuItem(id: string): Promise<boolean> {
    const cleanId = id.trim();
    return await fsDeleteMenuItem(cleanId);
  }

  public async deleteAllMenuItems(): Promise<number> {
    return await fsDeleteAllMenuItems();
  }

  // --- ORDERS ---
  public async createOrder(orderData: {
    customerId?: string;
    customerEmail?: string;
    customerName: string;
    phone: string;
    address: string;
    mapLocation?: string;
    notes?: string;
    items: { id: string; name: string; price: number; quantity: number; image: string; notes?: string }[];
  }): Promise<Order> {
    return await fsCreateOrder(orderData);
  }

  public async getOrders(): Promise<Order[]> {
    return await fsGetOrders();
  }

  public async getOrderById(id: string): Promise<Order | undefined> {
    const queryId = id.trim().toUpperCase();
    const queryDigits = id.replace(/\D/g, '');
    const orders = await fsGetOrders();
    return orders.find(o => 
      o.id.toUpperCase() === queryId || 
      (queryDigits && o.id.replace(/\D/g, '') === queryDigits) ||
      (queryDigits && o.phone.replace(/\D/g, '') === queryDigits)
    );
  }

  public async getCustomerOrders(email?: string, phone?: string): Promise<Order[]> {
    const cleanEmail = email ? email.toLowerCase().trim() : '';
    const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
    const orders = await fsGetOrders();

    return orders.filter(order => {
      if (cleanEmail && order.customerEmail && order.customerEmail.toLowerCase().trim() === cleanEmail) {
        return true;
      }
      if (cleanPhone && order.phone && order.phone.replace(/\D/g, '') === cleanPhone) {
        return true;
      }
      return false;
    });
  }

  public async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order | undefined> {
    const result = await fsUpdateOrderStatus(orderId, status);
    return result || undefined;
  }

  public async deleteOrder(id: string): Promise<boolean> {
    return await fsDeleteOrder(id);
  }

  public async deleteAllOrders(): Promise<number> {
    return await fsDeleteAllOrders();
  }

  // --- CUSTOMERS ---
  public async createCustomer(data: {
    name: string;
    email: string;
    phone: string;
    passwordHash: string;
    address?: string;
  }): Promise<CustomerUser> {
    const newId = 'cust-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    const stored: StoredCustomerUser = {
      id: newId,
      name: data.name,
      email: data.email.toLowerCase().trim(),
      phone: data.phone.trim(),
      passwordHash: data.passwordHash,
      address: data.address || '',
      wishlistIds: [],
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(firestore, CUSTOMERS_COL, newId), stored);
    const { passwordHash, ...safeUser } = stored;
    return safeUser;
  }

  public async findCustomerByEmail(email: string): Promise<StoredCustomerUser | undefined> {
    if (!email) return undefined;
    const clean = email.toLowerCase().trim();
    const snap = await getDocs(collection(firestore, CUSTOMERS_COL));
    const docs = snap.docs.map(d => d.data() as StoredCustomerUser);
    return docs.find(c => c.email === clean);
  }

  public async findCustomerByPhone(phone: string): Promise<StoredCustomerUser | undefined> {
    if (!phone) return undefined;
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone) return undefined;
    const snap = await getDocs(collection(firestore, CUSTOMERS_COL));
    const docs = snap.docs.map(d => d.data() as StoredCustomerUser);
    return docs.find(c => c.phone.replace(/\D/g, '') === cleanPhone);
  }

  public async findCustomerByEmailOrPhone(identifier: string): Promise<StoredCustomerUser | undefined> {
    if (!identifier) return undefined;
    const clean = identifier.trim();
    if (clean.includes('@')) {
      return await this.findCustomerByEmail(clean);
    }
    return await this.findCustomerByPhone(clean);
  }

  public async findOrCreateGoogleCustomer(data: {
    name: string;
    email: string;
  }): Promise<CustomerUser> {
    const cleanEmail = data.email.toLowerCase().trim();
    let existing = await this.findCustomerByEmail(cleanEmail);
    if (existing) {
      const { passwordHash, ...safeUser } = existing;
      return safeUser;
    }

    const newId = 'cust-g-' + Date.now().toString(36);
    const stored: StoredCustomerUser = {
      id: newId,
      name: data.name || 'Google User',
      email: cleanEmail,
      phone: '',
      passwordHash: 'GOOGLE_AUTH_OAUTH',
      address: '',
      wishlistIds: [],
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(firestore, CUSTOMERS_COL, newId), stored);
    const { passwordHash, ...safeUser } = stored;
    return safeUser;
  }

  public async findCustomerById(id: string): Promise<StoredCustomerUser | undefined> {
    const snap = await getDoc(doc(firestore, CUSTOMERS_COL, id));
    if (snap.exists()) {
      return snap.data() as StoredCustomerUser;
    }
    return undefined;
  }

  public async updateCustomerWishlist(customerId: string, wishlistIds: string[]): Promise<CustomerUser | undefined> {
    const customerRef = doc(firestore, CUSTOMERS_COL, customerId);
    const snap = await getDoc(customerRef);
    if (!snap.exists()) return undefined;

    await updateDoc(customerRef, { wishlistIds });
    const updated = (await getDoc(customerRef)).data() as StoredCustomerUser;
    const { passwordHash, ...safeUser } = updated;
    return safeUser;
  }

  public async updateCustomerPassword(identifier: string, newPasswordHash: string): Promise<boolean> {
    const customer = await this.findCustomerByEmailOrPhone(identifier);
    if (!customer) return false;
    await updateDoc(doc(firestore, CUSTOMERS_COL, customer.id), { passwordHash: newPasswordHash });
    return true;
  }

  public async deleteCustomer(id: string): Promise<boolean> {
    const docRef = doc(firestore, CUSTOMERS_COL, id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      await deleteDoc(docRef);
      return true;
    }
    return false;
  }

  public async clearCustomers(): Promise<void> {
    const snap = await getDocs(collection(firestore, CUSTOMERS_COL));
    const batch = writeBatch(firestore);
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  }

  // --- SPECIAL DEALS ---
  public async getSpecialDeals(): Promise<SpecialDeal[]> {
    let deals = await fsGetSpecialDeals();
    if (deals.length === 0) {
      for (const d of initialSpecialDeals) {
        await fsSaveSpecialDeal(d);
      }
      deals = await fsGetSpecialDeals();
    }
    return deals;
  }

  public async getSpecialDeal(id: string): Promise<SpecialDeal | undefined> {
    const snap = await getDoc(doc(firestore, 'special_deals', id));
    if (snap.exists()) {
      return { ...(snap.data() as SpecialDeal), id: snap.id };
    }
    const base = initialSpecialDeals.find(d => d.id === id);
    if (base) {
      await fsSaveSpecialDeal(base);
      return base;
    }
    return undefined;
  }

  public async saveSpecialDeal(dealData: Partial<SpecialDeal> & { name: string; price: number }): Promise<SpecialDeal> {
    const dealId = dealData.id || ('deal-' + Date.now().toString(36));
    const fullDeal: SpecialDeal = {
      id: dealId,
      name: dealData.name,
      description: dealData.description || '',
      price: Number(dealData.price),
      originalPrice: dealData.originalPrice ? Number(dealData.originalPrice) : undefined,
      image: dealData.image || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800',
      includedProductIds: dealData.includedProductIds || [],
      includedItemsSummary: dealData.includedItemsSummary || '',
      startDate: dealData.startDate || new Date().toISOString(),
      endDate: dealData.endDate || new Date(Date.now() + 30 * 86400000).toISOString(),
      isActive: dealData.isActive !== undefined ? dealData.isActive : true,
      createdAt: dealData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return await fsSaveSpecialDeal(fullDeal);
  }

  public async deleteSpecialDeal(id: string): Promise<boolean> {
    return await fsDeleteSpecialDeal(id);
  }

  // --- ADMIN AUTH ---
  public async getAdminAuthInfo(): Promise<{ email: string; hash: string }> {
    const authRef = doc(firestore, ADMIN_AUTH_DOC);
    const snap = await getDoc(authRef);
    if (snap.exists()) {
      return snap.data() as { email: string; hash: string };
    }
    const defaultHash = bcrypt.hashSync('cheez123', 10);
    const defaults = { email: 'admin@cheezoclock.pk', hash: defaultHash };
    await setDoc(authRef, defaults);
    return defaults;
  }

  public async updateAdminPassword(newPasswordHash: string): Promise<void> {
    const authRef = doc(firestore, ADMIN_AUTH_DOC);
    await setDoc(authRef, { email: 'admin@cheezoclock.pk', hash: newPasswordHash }, { merge: true });
  }
}

export const db = new FirestoreDatabase();
