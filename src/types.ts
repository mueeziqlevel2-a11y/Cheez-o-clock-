export type OrderStatus = 
  | 'NEW' 
  | 'CONFIRMED' 
  | 'PREPARING' 
  | 'OUT_FOR_DELIVERY' 
  | 'DELIVERED' 
  | 'CANCELLED';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number; // in PKR
  image: string;
  isAvailable: boolean;
  isSoldOut?: boolean;
  isFeatured?: boolean;
}

export interface SpecialDeal {
  id: string;
  name: string;
  description: string;
  price: number; // in PKR
  originalPrice?: number; // in PKR
  image: string;
  includedProductIds?: string[];
  includedItemsSummary?: string;
  startDate: string; // ISO string or YYYY-MM-DDTHH:mm
  endDate: string; // ISO string or YYYY-MM-DDTHH:mm
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  notes?: string;
}

export interface CustomerUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  wishlistIds?: string[];
  createdAt?: string;
}

export interface Order {
  id: string; // e.g. "COC-1024"
  customerId?: string;
  customerEmail?: string;
  customerName: string;
  phone: string;
  address: string;
  mapLocation?: string;
  notes?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: 'Cash on Delivery';
  status: OrderStatus;
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
}

export interface AdminSettings {
  deliveryFee: number;
  storeIsOpen: boolean;
  announcement?: string;
}

export interface DashboardStats {
  newOrders: number;
  preparing: number;
  outForDelivery: number;
  completed: number;
  totalOrders: number;
  totalRevenue: number;
}
