import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import logo from '../../assets/images/cheez_oclock_exact_logo_1786817851558.jpg';
import {
  ShieldCheck,
  LogOut,
  Package,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChefHat,
  Search,
  Plus,
  Edit2,
  Trash2,
  Settings,
  Store,
  X,
  ArrowLeft,
  Phone,
  MessageSquare,
  MapPin,
  ExternalLink,
  Calendar,
  DollarSign,
  Printer,
  Eye,
  Bell,
  FileText,
  Sparkles
} from 'lucide-react';
import { Order, MenuItem, AdminSettings, OrderStatus, SpecialDeal } from '../../types';
import { MENU_CATEGORIES } from '../../data/initialMenu';
import { getSafeFoodImage, handleImageError } from '../../lib/imageFallback';
import { subscribeOrders, subscribeMenu, subscribeSettings, subscribeSpecialDeals } from '../../lib/firebase';
import {
  adminLogin,
  fetchAdminOrders,
  updateOrderStatus,
  fetchMenu,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  fetchSettings,
  updateAdminSettings,
  deleteAdminOrder,
  deleteAllAdminOrders,
  deleteAllAdminMenuItems,
  clearAdminCustomers,
  fetchSpecialDeals,
  addSpecialDeal,
  updateSpecialDeal,
  deleteSpecialDeal
} from '../../lib/api';
import { SpecialDealsManager } from './SpecialDealsManager';
import { ThermalReceipt } from './ThermalReceipt';

interface AdminPortalProps {
  onBackToStore: () => void;
  onShowToast: (type: 'success' | 'error' | 'info', text: string) => void;
}

// Web Audio API Chime for New Order Alert
const playOrderChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch (e) {
    // Audio playback disabled or prevented by browser
  }
};

// WhatsApp URL Generator
const getWhatsAppUrl = (phone: string, orderId: string, name: string) => {
  let cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '92' + cleanPhone.substring(1);
  } else if (!cleanPhone.startsWith('92')) {
    cleanPhone = '92' + cleanPhone;
  }
  const message = encodeURIComponent(`Hello ${name}, this is Cheez O'Clock regarding your order #${orderId}.`);
  return `https://wa.me/${cleanPhone}?text=${message}`;
};

// Google Maps URL Generator
const getGoogleMapsUrl = (address: string, mapLocation?: string) => {
  if (mapLocation && mapLocation.trim()) {
    const loc = mapLocation.trim();
    if (loc.startsWith('http://') || loc.startsWith('https://')) {
      return loc;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address + ', Rawalpindi')}`;
};

// Date & Exact Time Formatter
const formatExactDateTime = (isoString: string) => {
  try {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return isoString;
  }
};

export const AdminPortal: React.FC<AdminPortalProps> = ({ onBackToStore, onShowToast }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('coc_admin_token'));
  const [email, setEmail] = useState('admin@cheezoclock.pk');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Dashboard Data State
  const [activeTab, setActiveTab] = useState<'orders' | 'special_deals' | 'menu' | 'settings'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [specialDeals, setSpecialDeals] = useState<SpecialDeal[]>([]);
  const [settings, setSettings] = useState<AdminSettings>({ deliveryFee: 100, storeIsOpen: true });
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters & Search
  const [orderSearch, setOrderSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');

  // Modal States
  const [selectedOrderDetailModal, setSelectedOrderDetailModal] = useState<Order | null>(null);
  const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isAddMenuModalOpen, setIsAddMenuModalOpen] = useState(false);
  const [menuForm, setMenuForm] = useState<{
    name: string;
    description: string;
    category: string;
    price: number;
    image: string;
    isAvailable: boolean;
    isFeatured: boolean;
    hasSizes: boolean;
    sizeSmallPrice: number;
    sizeMediumPrice: number;
    sizeLargePrice: number;
  }>({
    name: '',
    description: '',
    category: 'Cheezy Pizzas',
    price: 500,
    image: '',
    isAvailable: true,
    isFeatured: false,
    hasSizes: true,
    sizeSmallPrice: 590,
    sizeMediumPrice: 1050,
    sizeLargePrice: 1390
  });

  // Settings Form State
  const [deliveryFeeInput, setDeliveryFeeInput] = useState(100);

  // Reference to track previous order count for sound notification
  const prevOrderCountRef = useRef<number>(0);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    try {
      const res = await adminLogin(email, password);
      setToken(res.token);
      localStorage.setItem('coc_admin_token', res.token);
      setLoginLoading(false);
      onShowToast('success', 'Host Portal authenticated successfully!');
    } catch (err: any) {
      setLoginLoading(false);
      setLoginError(err.message || 'Invalid admin credentials');
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('coc_admin_token');
    onShowToast('info', 'Logged out of Host Portal');
  };

  // Load Data when authenticated
  const loadData = async (showRefreshIndicator = false) => {
    if (!token) return;
    if (showRefreshIndicator) setIsRefreshing(true);
    try {
      const [fetchedOrders, fetchedMenu, fetchedDeals, fetchedSettings] = await Promise.all([
        fetchAdminOrders(token),
        fetchMenu(),
        fetchSpecialDeals(),
        fetchSettings()
      ]);

      // Check for new orders to trigger chime sound
      if (prevOrderCountRef.current > 0 && fetchedOrders.length > prevOrderCountRef.current) {
        playOrderChime();
        onShowToast('info', '🔔 NEW ORDER RECEIVED!');
      }
      prevOrderCountRef.current = fetchedOrders.length;

      setOrders(fetchedOrders);
      setMenuItems(fetchedMenu);
      setSpecialDeals(fetchedDeals);
      setSettings(fetchedSettings);
      setDeliveryFeeInput(fetchedSettings.deliveryFee);
      
      // Keep selected detail modal synchronized if open
      if (selectedOrderDetailModal) {
        const updatedModalOrder = fetchedOrders.find(o => o.id === selectedOrderDetailModal.id);
        if (updatedModalOrder) setSelectedOrderDetailModal(updatedModalOrder);
      }
    } catch (err: any) {
      if (err.message && (err.message.includes('Forbidden') || err.message.includes('Unauthorized'))) {
        handleLogout();
      }
    } finally {
      setLoadingOrders(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) {
      setLoadingOrders(true);
      loadData();

      // Subscribe to real-time Firestore updates
      const unsubOrders = subscribeOrders((liveOrders) => {
        if (prevOrderCountRef.current > 0 && liveOrders.length > prevOrderCountRef.current) {
          playOrderChime();
          onShowToast('info', `🔔 NEW ORDER RECEIVED! #${liveOrders[0]?.id}`);
        }
        prevOrderCountRef.current = liveOrders.length;
        setOrders(liveOrders);
        setLoadingOrders(false);

        if (selectedOrderDetailModal) {
          const updatedModalOrder = liveOrders.find(o => o.id === selectedOrderDetailModal.id);
          if (updatedModalOrder) setSelectedOrderDetailModal(updatedModalOrder);
        }
      });

      const unsubMenu = subscribeMenu((liveMenu) => {
        setMenuItems(liveMenu);
      });

      const unsubDeals = subscribeSpecialDeals((liveDeals) => {
        setSpecialDeals(liveDeals);
      });

      const unsubSettings = subscribeSettings((liveSettings) => {
        setSettings(liveSettings);
        setDeliveryFeeInput(liveSettings.deliveryFee);
      });

      return () => {
        unsubOrders();
        unsubMenu();
        unsubDeals();
        unsubSettings();
      };
    }
  }, [token]);

  // Order Status Change Handler
  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    if (!token) return;
    try {
      const updated = await updateOrderStatus(token, orderId, newStatus);
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
      if (selectedOrderDetailModal?.id === orderId) {
        setSelectedOrderDetailModal(updated);
      }
      onShowToast('success', `Order #${orderId} status changed to ${newStatus.replace(/_/g, ' ')}`);
    } catch (err: any) {
      onShowToast('error', err.message || 'Failed to update order status');
    }
  };

  // Menu Handlers
  const handleSaveMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const itemData: any = {
        name: menuForm.name,
        description: menuForm.description,
        category: menuForm.category,
        price: menuForm.hasSizes ? Number(menuForm.sizeMediumPrice || menuForm.price) : Number(menuForm.price),
        image: menuForm.image,
        isAvailable: menuForm.isAvailable,
        isFeatured: menuForm.isFeatured,
        hasSizes: menuForm.hasSizes,
        sizes: menuForm.hasSizes
          ? {
              small: Number(menuForm.sizeSmallPrice) || Math.round(Number(menuForm.price) * 0.7),
              medium: Number(menuForm.sizeMediumPrice) || Number(menuForm.price),
              large: Number(menuForm.sizeLargePrice) || Math.round(Number(menuForm.price) * 1.35)
            }
          : undefined
      };

      if (editingItem) {
        const updated = await updateMenuItem(token, editingItem.id, itemData);
        setMenuItems(prev => prev.map(m => m.id === editingItem.id ? { ...m, ...updated } : m));
        onShowToast('success', `"${menuForm.name}" updated successfully!`);
      } else {
        const added = await addMenuItem(token, itemData);
        setMenuItems(prev => [...prev.filter(m => m.id !== added.id), added]);
        onShowToast('success', `"${menuForm.name}" added to menu!`);
      }
      setIsAddMenuModalOpen(false);
      setEditingItem(null);
      loadData(true);
    } catch (err: any) {
      onShowToast('error', err.message || 'Failed to save menu item');
    }
  };

  const handleDeleteMenu = async (id: string, name: string) => {
    if (!token || !window.confirm(`Delete "${name}" from menu/projects permanently?`)) return;
    try {
      setMenuItems(prev => prev.filter(m => m.id.trim() !== id.trim()));
      await deleteMenuItem(token, id);
      onShowToast('success', `Deleted "${name}"`);
      loadData(true);
    } catch (err: any) {
      onShowToast('error', err.message || 'Failed to delete item');
      loadData(true);
    }
  };

  const handleDeleteAllProjects = async () => {
    if (!token || !window.confirm('⚠️ Are you sure you want to delete ALL test projects / menu items?\n\nThis will remove all products from the catalog.')) return;
    try {
      setMenuItems([]);
      await deleteAllAdminMenuItems(token);
      onShowToast('success', 'All test projects & menu items deleted!');
      loadData(true);
    } catch (err: any) {
      onShowToast('error', err.message || 'Failed to delete menu items');
      loadData(true);
    }
  };

  const handleClearAllCustomerAccounts = async () => {
    if (!token || !window.confirm('⚠️ Are you sure you want to delete ALL registered customer accounts?\n\nThis will clean up test customer users.')) return;
    try {
      await clearAdminCustomers(token);
      onShowToast('success', 'All test customer accounts cleared!');
      loadData(true);
    } catch (err: any) {
      onShowToast('error', err.message || 'Failed to clear customer accounts');
      loadData(true);
    }
  };

  const handleToggleMenuStock = async (item: MenuItem) => {
    if (!token) return;
    try {
      await updateMenuItem(token, item.id, { isAvailable: !item.isAvailable, isSoldOut: item.isAvailable });
      onShowToast('info', `Updated availability for ${item.name}`);
      loadData(true);
    } catch (err: any) {
      onShowToast('error', 'Failed to update stock state');
    }
  };

  // Special Deals Handlers
  const handleSaveSpecialDeal = async (dealData: Partial<SpecialDeal> & { name: string; price: number }) => {
    if (!token) return;
    if (dealData.id) {
      await updateSpecialDeal(token, dealData.id, dealData);
    } else {
      await addSpecialDeal(token, dealData);
    }
    loadData(true);
  };

  const handleDeleteSpecialDeal = async (dealId: string) => {
    if (!token) return;
    await deleteSpecialDeal(token, dealId);
    loadData(true);
  };

  const handleToggleDealActive = async (deal: SpecialDeal) => {
    if (!token) return;
    try {
      await updateSpecialDeal(token, deal.id, { isActive: !deal.isActive });
      onShowToast('info', `Deal "${deal.name}" is now ${!deal.isActive ? 'Active' : 'Paused'}`);
      loadData(true);
    } catch (err: any) {
      onShowToast('error', 'Failed to update deal status');
    }
  };

  // Settings Handler
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      await updateAdminSettings(token, { deliveryFee: Number(deliveryFeeInput) });
      onShowToast('success', 'Store delivery settings updated!');
      loadData(true);
    } catch (err: any) {
      onShowToast('error', 'Failed to update store settings');
    }
  };

  // Thermal Printer Bill Handler
  const handlePrintBill = (order: Order) => {
    setOrderToPrint(order);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Delete Single Order Handler
  const handleDeleteSingleOrder = async (orderId: string) => {
    if (!token) return;
    if (!window.confirm(`Are you sure you want to PERMANENTLY DELETE order #${orderId}? This action cannot be undone.`)) return;
    try {
      // Optimistically remove from state
      setOrders(prev => prev.filter(o => o.id.toUpperCase().trim() !== orderId.toUpperCase().trim() && o.id.replace(/\D/g, '') !== orderId.replace(/\D/g, '')));
      if (selectedOrderDetailModal?.id === orderId) {
        setSelectedOrderDetailModal(null);
      }
      await deleteAdminOrder(token, orderId);
      onShowToast('success', `Order #${orderId} deleted permanently.`);
      loadData(true);
    } catch (err: any) {
      onShowToast('error', err.message || 'Failed to delete order');
      loadData(true);
    }
  };

  // Clear / Reset All Orders Handler (Start from 0 for the month)
  const handleClearAllOrders = async () => {
    if (!token) return;
    if (orders.length === 0) {
      onShowToast('info', 'There are no orders to delete.');
      return;
    }

    const confirmCode = window.prompt(
      `⚠️ PERMANENT DELETE WARNING ⚠️\n\nThis will PERMANENTLY DELETE ALL ${orders.length} ORDERS from your history so you can start from 0 for the new month!\n\nType "DELETE" to confirm:`
    );

    if (confirmCode !== 'DELETE') {
      if (confirmCode !== null) onShowToast('info', 'Action cancelled. Orders were not deleted.');
      return;
    }

    try {
      setOrders([]);
      setSelectedOrderDetailModal(null);
      await deleteAllAdminOrders(token);
      onShowToast('success', 'Order history reset to 0! You can now track new monthly sales.');
      loadData(true);
    } catch (err: any) {
      onShowToast('error', err.message || 'Failed to clear order history');
      loadData(true);
    }
  };

  // Extract available unique months from orders
  const availableMonths = Array.from(
    new Set(
      orders.map(o => {
        try {
          const date = new Date(o.createdAt);
          return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
        } catch {
          return '';
        }
      }).filter(Boolean)
    )
  );

  // Filter orders by month first
  const monthFilteredOrders = orders.filter(o => {
    if (selectedMonth === 'ALL') return true;
    try {
      const date = new Date(o.createdAt);
      const m = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      return m === selectedMonth;
    } catch {
      return true;
    }
  });

  // Stats Calculations for selected month
  const newOrdersCount = monthFilteredOrders.filter(o => o.status === 'NEW').length;
  const preparingCount = monthFilteredOrders.filter(o => o.status === 'PREPARING' || o.status === 'CONFIRMED').length;
  const outForDeliveryCount = monthFilteredOrders.filter(o => o.status === 'OUT_FOR_DELIVERY').length;
  const completedCount = monthFilteredOrders.filter(o => o.status === 'DELIVERED').length;
  const totalRevenue = monthFilteredOrders.filter(o => o.status !== 'CANCELLED').reduce((sum, o) => sum + o.total, 0);

  // Filtered Orders List (Month + Status + Search)
  const filteredOrders = monthFilteredOrders.filter(order => {
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    const query = orderSearch.toLowerCase();
    const matchesSearch =
      order.id.toLowerCase().includes(query) ||
      order.customerName.toLowerCase().includes(query) ||
      order.phone.toLowerCase().includes(query) ||
      order.address.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  // ------------------- LOGIN VIEW -------------------
  if (!token) {
    return (
      <div className="min-h-screen bg-[#120101] text-[#FFFBEB] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#2C0202] rounded-3xl border border-[#FFB703]/30 p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto rounded-2xl overflow-hidden shadow-lg border border-[#FFB703]/30">
              <img
                src={logo}
                alt="Cheez O'Clock"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="font-display text-3xl tracking-wide text-[#FFFBEB]">
              CHEEZ O'CLOCK HOST PORTAL
            </h1>
            <p className="text-xs text-[#FFD166]">
              Authorized Store Order Management — Rawalpindi
            </p>
          </div>

          {loginError && (
            <div className="p-3.5 rounded-xl bg-[#C8102E]/20 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                Admin Username / Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#1A0101] border border-[#FFB703]/30 text-white text-sm focus:outline-none focus:border-[#FFB703]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                Master Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-[#1A0101] border border-[#FFB703]/30 text-white text-sm focus:outline-none focus:border-[#FFB703]"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#FFB703] to-[#FB8500] text-[#3B0202] font-black text-sm uppercase tracking-wider shadow-xl hover:brightness-110 active:scale-98 transition-all cursor-pointer"
            >
              {loginLoading ? 'AUTHENTICATING...' : 'ACCESS HOST DASHBOARD'}
            </button>
          </form>

          <div className="pt-4 border-t border-white/10 text-center">
            <button
              onClick={onBackToStore}
              className="text-xs text-gray-400 hover:text-[#FFB703] inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Customer Website
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ------------------- AUTHENTICATED ADMIN DASHBOARD -------------------
  return (
    <div className="min-h-screen bg-[#180101] text-[#FFFBEB]">
      
      {/* Top Host Header */}
      <header className="bg-[#2C0202] border-b border-[#FFB703]/20 sticky top-0 z-30 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="Cheez O'Clock"
              className="w-10 h-10 object-contain rounded-xl shadow-md"
            />
            <div>
              <h1 className="font-display text-2xl tracking-wide text-white">
                CHEEZ O'CLOCK HOST DASHBOARD
              </h1>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live Order Stream — Rawalpindi
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Manual Refresh Button */}
            <button
              onClick={() => loadData(true)}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1A0101] text-xs font-bold text-[#FFB703] border border-[#FFB703]/30 hover:bg-[#FFB703]/10 cursor-pointer transition-all"
              title="Refresh order database"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
            </button>

            <button
              onClick={onBackToStore}
              className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1A0101] text-xs font-bold text-gray-300 hover:text-white border border-white/10 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Customer Site
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#C8102E] text-white text-xs font-bold hover:brightness-110 cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <button
              id="tab-btn-orders"
              onClick={() => setActiveTab('orders')}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-[#FFB703] text-[#3B0202] shadow-lg'
                  : 'bg-[#2C0202] text-gray-300 hover:text-white'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Incoming Orders</span>
              {newOrdersCount > 0 && (
                <span className="bg-[#C8102E] text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                  {newOrdersCount}
                </span>
              )}
            </button>

            <button
              id="tab-btn-special-deals"
              onClick={() => setActiveTab('special_deals')}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'special_deals'
                  ? 'bg-[#FFB703] text-[#3B0202] shadow-lg'
                  : 'bg-[#2C0202] text-gray-300 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#D90429]" />
              <span>Special Deals ({specialDeals.length})</span>
            </button>

            <button
              id="tab-btn-menu"
              onClick={() => setActiveTab('menu')}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'menu'
                  ? 'bg-[#FFB703] text-[#3B0202] shadow-lg'
                  : 'bg-[#2C0202] text-gray-300 hover:text-white'
              }`}
            >
              <ChefHat className="w-4 h-4" />
              <span>Menu Management ({menuItems.length})</span>
            </button>

            <button
              id="tab-btn-settings"
              onClick={() => setActiveTab('settings')}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-[#FFB703] text-[#3B0202] shadow-lg'
                  : 'bg-[#2C0202] text-gray-300 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Store Settings</span>
            </button>
          </div>

          <div className="text-xs text-gray-400 hidden lg:flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#FFB703]" />
            <span>Auto-refresh & live updates enabled</span>
          </div>
        </div>

        {/* TAB 1: ORDERS DASHBOARD */}
        {activeTab === 'orders' && (
          <div className="space-y-8">
            
            {/* New Orders Banner Alert if any new unconfirmed order */}
            {newOrdersCount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-[#C8102E] text-white flex items-center justify-between shadow-2xl border border-red-400"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white text-[#C8102E] font-black animate-bounce">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base tracking-wide">
                      🔔 {newOrdersCount} NEW ORDER{newOrdersCount > 1 ? 'S' : ''} RECEIVED!
                    </h3>
                    <p className="text-xs text-red-100">
                      Please accept and process incoming orders promptly.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setStatusFilter('NEW')}
                  className="px-4 py-2 rounded-xl bg-white text-[#C8102E] text-xs font-black uppercase tracking-wider hover:bg-gray-100 cursor-pointer shrink-0"
                >
                  VIEW NEW ORDERS
                </button>
              </motion.div>
            )}

            {/* Monthly Sales Tracker & Reset Order History Bar */}
            <div className="bg-[#2C0202] p-5 rounded-3xl border border-[#FFB703]/30 shadow-xl space-y-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-[#FFB703] text-[#3B0202] font-black">
                    <Calendar className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl sm:text-2xl text-white">MONTHLY SALES & HISTORY TRACKER</h2>
                    <p className="text-xs text-gray-300">
                      Filter analytics by month or clear order history to start from 0 every month.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  {/* Refresh Button */}
                  <button
                    onClick={() => loadData(true)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1A0101] border border-white/20 text-gray-200 hover:text-white hover:border-[#FFB703] text-xs font-bold transition-all cursor-pointer shadow"
                    title="Refresh orders and data"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders || isRefreshing ? 'animate-spin text-[#FFB703]' : 'text-gray-400'}`} />
                    <span>Refresh</span>
                  </button>

                  {/* Month Selector */}
                  <div className="flex items-center gap-2 bg-[#1A0101] px-3.5 py-2 rounded-xl border border-white/15">
                    <span className="text-xs font-bold text-[#FFB703] shrink-0">Month:</span>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
                    >
                      <option value="ALL" className="bg-[#1A0101] text-white">All Time (Total History)</option>
                      {availableMonths.map(m => (
                        <option key={m} value={m} className="bg-[#1A0101] text-white">
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Reset / Start Fresh from 0 Button */}
                  <button
                    onClick={handleClearAllOrders}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-200 text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg hover:border-red-400 shrink-0"
                    title="Clear order history to start fresh from 0 for the month"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                    <span>Clear Orders (Start 0)</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                <div className="p-3.5 rounded-2xl bg-[#1A0101] border border-white/5 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 uppercase">Selected Period:</span>
                  <span className="text-xs font-bold text-[#FFB703] bg-[#2C0202] px-3 py-1 rounded-lg border border-[#FFB703]/30">
                    {selectedMonth === 'ALL' ? 'All Time' : selectedMonth}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#1A0101] border border-white/5 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 uppercase">Total Period Orders:</span>
                  <span className="text-sm font-display text-white">{monthFilteredOrders.length} Orders</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#1A0101] border border-white/5 flex items-center justify-between sm:col-span-2 lg:col-span-1">
                  <span className="text-xs font-bold text-gray-400 uppercase">Period Sales Revenue:</span>
                  <span className="text-sm font-display text-[#FFD166]">Rs. {totalRevenue.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Dashboard Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div
                onClick={() => setStatusFilter('NEW')}
                className={`p-4 rounded-2xl bg-[#2C0202] border transition-all cursor-pointer ${
                  statusFilter === 'NEW' ? 'border-[#FFB703] ring-2 ring-[#FFB703]/30' : 'border-[#FFB703]/30 hover:border-[#FFB703]'
                }`}
              >
                <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">NEW ORDERS</span>
                <p className="font-display text-3xl text-[#FFB703]">{newOrdersCount}</p>
              </div>

              <div
                onClick={() => setStatusFilter('PREPARING')}
                className={`p-4 rounded-2xl bg-[#2C0202] border transition-all cursor-pointer ${
                  statusFilter === 'PREPARING' ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-amber-500/30 hover:border-amber-400'
                }`}
              >
                <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">PREPARING</span>
                <p className="font-display text-3xl text-amber-400">{preparingCount}</p>
              </div>

              <div
                onClick={() => setStatusFilter('OUT_FOR_DELIVERY')}
                className={`p-4 rounded-2xl bg-[#2C0202] border transition-all cursor-pointer ${
                  statusFilter === 'OUT_FOR_DELIVERY' ? 'border-blue-400 ring-2 ring-blue-400/30' : 'border-blue-500/30 hover:border-blue-400'
                }`}
              >
                <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">OUT FOR DELIVERY</span>
                <p className="font-display text-3xl text-blue-400">{outForDeliveryCount}</p>
              </div>

              <div
                onClick={() => setStatusFilter('DELIVERED')}
                className={`p-4 rounded-2xl bg-[#2C0202] border transition-all cursor-pointer ${
                  statusFilter === 'DELIVERED' ? 'border-emerald-400 ring-2 ring-emerald-400/30' : 'border-emerald-500/30 hover:border-emerald-400'
                }`}
              >
                <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">DELIVERED</span>
                <p className="font-display text-3xl text-emerald-400">{completedCount}</p>
              </div>

              <div
                onClick={() => setStatusFilter('ALL')}
                className={`p-4 rounded-2xl bg-[#2C0202] border transition-all cursor-pointer ${
                  statusFilter === 'ALL' ? 'border-white ring-2 ring-white/30' : 'border-white/10 hover:border-white/30'
                }`}
              >
                <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">TOTAL ORDERS</span>
                <p className="font-display text-3xl text-white">{orders.length}</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#2C0202] border border-[#FFB703]/40 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">TOTAL REVENUE</span>
                <p className="font-display text-2xl text-[#FFD166]">Rs. {totalRevenue.toLocaleString()}</p>
              </div>
            </div>

            {/* Filter Bar & Search */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#2C0202] p-4 rounded-2xl border border-white/10">
              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
                {[
                  { id: 'ALL', label: 'ALL' },
                  { id: 'NEW', label: 'NEW' },
                  { id: 'CONFIRMED', label: 'CONFIRMED' },
                  { id: 'PREPARING', label: 'PREPARING' },
                  { id: 'OUT_FOR_DELIVERY', label: 'OUT FOR DELIVERY' },
                  { id: 'DELIVERED', label: 'DELIVERED' },
                  { id: 'CANCELLED', label: 'CANCELLED' }
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setStatusFilter(st.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase shrink-0 transition-colors cursor-pointer ${
                      statusFilter === st.id
                        ? 'bg-[#C8102E] text-white shadow-md'
                        : 'bg-[#1A0101] text-gray-400 hover:text-white'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Search order #, phone, address..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#1A0101] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FFB703]"
                />
              </div>
            </div>

            {/* Orders Feed */}
            <div className="space-y-4">
              {loadingOrders && orders.length === 0 ? (
                <div className="p-12 text-center bg-[#2C0202] rounded-3xl border border-white/10 space-y-3">
                  <div className="w-8 h-8 border-3 border-[#FFB703] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm font-bold text-gray-400">Loading incoming orders...</p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="p-12 text-center bg-[#2C0202] rounded-3xl border border-white/10 space-y-2">
                  <Package className="w-10 h-10 mx-auto text-gray-500" />
                  <p className="text-sm font-bold text-gray-300">No orders match your filter criteria.</p>
                  <p className="text-xs text-gray-500">New orders placed by customers will appear here automatically.</p>
                </div>
              ) : (
                filteredOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className={`p-6 rounded-3xl bg-[#2C0202] border transition-all space-y-4 shadow-xl ${
                      ord.status === 'NEW'
                        ? 'border-[#FFB703] ring-2 ring-[#FFB703]/30 bg-[#340404]'
                        : 'border-white/10'
                    }`}
                  >
                    {/* Order Card Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-display text-2xl text-[#FFB703]">
                          #{ord.id}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                            ord.status === 'NEW'
                              ? 'bg-[#FFB703] text-[#3B0202] animate-pulse'
                              : ord.status === 'CONFIRMED'
                              ? 'bg-emerald-800 text-emerald-100'
                              : ord.status === 'PREPARING'
                              ? 'bg-amber-500 text-black'
                              : ord.status === 'OUT_FOR_DELIVERY'
                              ? 'bg-blue-500 text-white'
                              : ord.status === 'DELIVERED'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-red-950 text-red-300 border border-red-800'
                          }`}
                        >
                          {ord.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-500" />
                          <span className="text-gray-200 font-medium">{formatExactDateTime(ord.createdAt)}</span>
                        </span>

                        <button
                          onClick={() => setSelectedOrderDetailModal(ord)}
                          className="flex items-center gap-1 text-[#FFB703] hover:underline font-bold cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Details
                        </button>
                      </div>
                    </div>

                    {/* Order Information Columns */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-gray-300">
                      
                      {/* Customer Info */}
                      <div className="space-y-2 bg-[#1A0101] p-4 rounded-2xl border border-white/5">
                        <span className="font-bold text-[#FFB703] uppercase text-[11px] block">
                          Customer Details
                        </span>
                        <div>
                          <p className="font-bold text-white text-sm">{ord.customerName}</p>
                          
                          {/* Phone Number with Clickable Call and WhatsApp */}
                          <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            <a
                              href={`tel:${ord.phone}`}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FFD166] hover:underline bg-[#2C0202] px-2.5 py-1 rounded-lg border border-[#FFB703]/30"
                              title="Click to call customer"
                            >
                              <Phone className="w-3.5 h-3.5 text-[#FFB703]" />
                              <span>{ord.phone}</span>
                            </a>

                            <a
                              href={getWhatsAppUrl(ord.phone, ord.id, ord.customerName)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 hover:bg-emerald-900 px-2.5 py-1 rounded-lg border border-emerald-500/30"
                              title="Message customer on WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        </div>

                        {/* Complete Delivery Address & Google Maps Button */}
                        <div className="pt-2 border-t border-white/10 space-y-2">
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 block uppercase">
                              Delivery Address
                            </span>
                            <p className="text-white font-medium mt-0.5 leading-relaxed">
                              {ord.address}
                            </p>
                          </div>

                          <a
                            href={getGoogleMapsUrl(ord.address, ord.mapLocation)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 w-full justify-center px-3 py-2 rounded-xl bg-[#2C0202] text-[#FFB703] hover:bg-[#3B0202] border border-[#FFB703]/40 font-bold text-[11px] uppercase tracking-wider transition-colors"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            <span>OPEN LOCATION IN GOOGLE MAPS</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>

                        {ord.notes && (
                          <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-200 text-[11px]">
                            <span className="font-bold block">Instruction:</span>
                            <span>"{ord.notes}"</span>
                          </div>
                        )}
                      </div>

                      {/* Ordered Food Items */}
                      <div className="space-y-2 bg-[#1A0101] p-4 rounded-2xl border border-white/5 flex flex-col justify-between">
                        <div>
                          <span className="font-bold text-[#FFB703] uppercase text-[11px] block mb-2">
                            Ordered Items ({ord.items.reduce((s, i) => s + i.quantity, 0)})
                          </span>
                          <ul className="space-y-2 max-h-36 overflow-y-auto pr-1">
                            {ord.items.map((i, idx) => (
                              <li key={idx} className="flex items-start justify-between text-xs pb-1 border-b border-white/5 last:border-0">
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-white">{i.quantity}x</span>
                                    <span>{i.name}</span>
                                    {i.size && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-[#FFB703] text-[#3B0202]">
                                        {i.size}
                                      </span>
                                    )}
                                  </div>
                                  {i.notes && <p className="text-[10px] text-gray-400 italic">"{i.notes}"</p>}
                                </div>
                                <span className="text-white font-semibold shrink-0 ml-2">
                                  Rs. {(i.price * i.quantity).toLocaleString()}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="pt-2 border-t border-white/10 space-y-1 text-[11px]">
                          <div className="flex justify-between text-gray-400">
                            <span>Subtotal</span>
                            <span>Rs. {ord.subtotal.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-gray-400">
                            <span>Delivery Fee</span>
                            <span>Rs. {ord.deliveryFee.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Total & Payment Method */}
                      <div className="space-y-3 bg-[#1A0101] p-4 rounded-2xl border border-white/5 flex flex-col justify-between">
                        <div>
                          <span className="font-bold text-[#FFB703] uppercase text-[11px] block mb-1">
                            Total Payable
                          </span>
                          <p className="font-display text-3xl text-[#FFD166]">
                            Rs. {ord.total.toLocaleString()}
                          </p>
                          
                          <div className="mt-3 p-2.5 rounded-xl bg-[#2C0202] border border-[#FFB703]/20 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <div>
                              <span className="text-[10px] text-gray-400 uppercase font-bold block">
                                Payment Method
                              </span>
                              <span className="text-xs font-bold text-white">
                                Cash on Delivery
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setSelectedOrderDetailModal(ord)}
                            className="w-full py-2 rounded-xl bg-[#2C0202] hover:bg-[#340404] text-gray-300 hover:text-white font-bold text-xs uppercase border border-white/10 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5 text-[#FFB703]" />
                            <span className="truncate">View Invoice</span>
                          </button>

                          <button
                            onClick={() => handlePrintBill(ord)}
                            className="w-full py-2 rounded-xl bg-[#FFB703] hover:bg-[#FB8500] text-[#3B0202] font-black text-xs uppercase shadow flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            title="Print thermal receipt bill for kitchen / rider"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print Bill</span>
                          </button>
                        </div>
                      </div>

                    </div>

                    {/* Order Status Action Controls */}
                    <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 mr-1">Update Status:</span>
                        
                        {ord.status === 'NEW' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(ord.id, 'CONFIRMED')}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-md cursor-pointer transition-all"
                            >
                              ACCEPT ORDER
                            </button>
                            <button
                              onClick={() => handleStatusChange(ord.id, 'CANCELLED')}
                              className="px-3.5 py-2 rounded-xl bg-red-950 hover:bg-red-900 text-red-200 font-bold text-xs uppercase border border-red-800/50 cursor-pointer transition-all"
                            >
                              CANCEL
                            </button>
                          </>
                        )}

                        {(ord.status === 'NEW' || ord.status === 'CONFIRMED') && (
                          <button
                            onClick={() => handleStatusChange(ord.id, 'PREPARING')}
                            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider shadow-md cursor-pointer transition-all"
                          >
                            START PREPARING
                          </button>
                        )}

                        {(ord.status === 'PREPARING' || ord.status === 'CONFIRMED') && (
                          <button
                            onClick={() => handleStatusChange(ord.id, 'OUT_FOR_DELIVERY')}
                            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-md cursor-pointer transition-all"
                          >
                            SEND OUT FOR DELIVERY
                          </button>
                        )}

                        {ord.status === 'OUT_FOR_DELIVERY' && (
                          <button
                            onClick={() => handleStatusChange(ord.id, 'DELIVERED')}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-md cursor-pointer transition-all"
                          >
                            MARK DELIVERED
                          </button>
                        )}

                        {ord.status !== 'DELIVERED' && ord.status !== 'CANCELLED' && ord.status !== 'NEW' && (
                          <button
                            onClick={() => handleStatusChange(ord.id, 'CANCELLED')}
                            className="px-3 py-2 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-300 font-bold text-xs uppercase cursor-pointer"
                          >
                            CANCEL ORDER
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={getWhatsAppUrl(ord.phone, ord.id, ord.customerName)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>WHATSAPP</span>
                        </a>

                        <button
                          onClick={() => handleDeleteSingleOrder(ord.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-300 font-bold text-xs uppercase transition-all cursor-pointer"
                          title="Delete this order permanently"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          <span className="hidden sm:inline">DELETE</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB: SPECIAL DEALS MANAGEMENT */}
        {activeTab === 'special_deals' && (
          <SpecialDealsManager
            specialDeals={specialDeals}
            menuItems={menuItems}
            onSaveDeal={handleSaveSpecialDeal}
            onDeleteDeal={handleDeleteSpecialDeal}
            onToggleActive={handleToggleDealActive}
            onShowToast={onShowToast}
          />
        )}

        {/* TAB 2: MENU MANAGEMENT */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#2C0202] p-6 rounded-3xl border border-[#FFB703]/30 shadow-xl">
              <div>
                <h2 className="font-display text-3xl text-white">MENU & PROJECT MANAGEMENT</h2>
                <p className="text-xs text-gray-300 mt-1">
                  Add new food items/projects, update prices, change descriptions, or delete test projects.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setMenuForm({
                      name: '',
                      description: '',
                      category: 'Cheezy Pizzas',
                      price: 1050,
                      image: '',
                      isAvailable: true,
                      isFeatured: false,
                      hasSizes: true,
                      sizeSmallPrice: 590,
                      sizeMediumPrice: 1050,
                      sizeLargePrice: 1390
                    });
                    setIsAddMenuModalOpen(true);
                  }}
                  className="px-5 py-3 rounded-xl bg-[#FFB703] text-[#3B0202] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:brightness-110 active:scale-98 transition-all"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>ADD NEW FOOD ITEM</span>
                </button>

                <button
                  onClick={handleDeleteAllProjects}
                  className="px-4 py-3 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-lg transition-all"
                  title="Delete all test projects / food items"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                  <span>DELETE TEST PROJECTS</span>
                </button>
              </div>
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItems.map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl bg-[#2C0202] border border-white/10 flex gap-4 items-center justify-between shadow-xl hover:border-[#FFB703]/40 transition-colors"
                >
                  <img
                    src={getSafeFoodImage(item.image, item.category, item.name)}
                    alt={item.name}
                    className="w-20 h-20 rounded-xl object-cover shrink-0 border border-white/10"
                    referrerPolicy="no-referrer"
                    onError={(e) => handleImageError(e, item.category, item.name)}
                  />

                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-[#FFB703] uppercase block">{item.category}</span>
                    <h4 className="font-bold text-sm text-white truncate">{item.name}</h4>
                    <p className="text-xs font-black text-[#FFD166] mt-0.5">Rs. {item.price.toLocaleString()}</p>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => handleToggleMenuStock(item)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase cursor-pointer ${
                          item.isAvailable
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                            : 'bg-red-950 text-red-300 border border-red-500/30'
                        }`}
                      >
                        {item.isAvailable ? 'AVAILABLE' : 'SOLD OUT'}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setEditingItem(item);
                        setMenuForm({
                          name: item.name,
                          description: item.description,
                          category: item.category,
                          price: item.price,
                          image: item.image,
                          isAvailable: item.isAvailable,
                          isFeatured: !!item.isFeatured,
                          hasSizes: Boolean(item.hasSizes || (item.sizes && (item.sizes.small || item.sizes.large))),
                          sizeSmallPrice: item.sizes?.small || Math.round(item.price * 0.7),
                          sizeMediumPrice: item.sizes?.medium || item.price,
                          sizeLargePrice: item.sizes?.large || Math.round(item.price * 1.35)
                        });
                        setIsAddMenuModalOpen(true);
                      }}
                      className="p-2 rounded-lg bg-[#1A0101] text-gray-300 hover:text-[#FFB703] cursor-pointer"
                      title="Edit Item"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteMenu(item.id, item.name)}
                      className="p-2 rounded-lg bg-[#1A0101] text-gray-300 hover:text-[#C8102E] cursor-pointer"
                      title="Delete Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: STORE SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="max-w-2xl bg-[#2C0202] p-8 rounded-3xl border border-[#FFB703]/30 shadow-2xl space-y-6">
              <h2 className="font-display text-3xl text-white">STORE CONFIGURATION</h2>

              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-[#FFB703] uppercase mb-1">
                    Delivery Fee in PKR
                  </label>
                  <input
                    type="number"
                    required
                    value={deliveryFeeInput}
                    onChange={(e) => setDeliveryFeeInput(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-[#1A0101] border border-[#FFB703]/30 text-white font-bold text-base focus:outline-none focus:border-[#FFB703]"
                  />
                  <p className="text-xs text-gray-400 mt-1">Delivery charge added to every checkout order in Rawalpindi.</p>
                </div>

                <button
                  type="submit"
                  className="px-8 py-3.5 rounded-xl bg-[#FFB703] text-[#3B0202] font-black text-xs uppercase tracking-wider shadow-xl hover:brightness-110 cursor-pointer active:scale-98 transition-all"
                >
                  SAVE STORE SETTINGS
                </button>
              </form>
            </div>

            {/* DATA CLEANUP & RESET MAINTENANCE */}
            <div className="max-w-2xl bg-[#2C0202] p-8 rounded-3xl border border-red-500/30 shadow-2xl space-y-4">
              <h3 className="font-display text-2xl text-red-400">ADMIN MAINTENANCE & DATA RESET</h3>
              <p className="text-xs text-gray-300">
                Use these options to start fresh every month, clean up test projects, or reset test customer accounts.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleClearAllOrders}
                  className="p-4 rounded-2xl bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-left transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-red-300 font-bold text-xs uppercase">
                    <Trash2 className="w-4 h-4 text-red-400" />
                    <span>Clear Orders (Start 0)</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Reset monthly order history to zero</p>
                </button>

                <button
                  onClick={handleDeleteAllProjects}
                  className="p-4 rounded-2xl bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-left transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-red-300 font-bold text-xs uppercase">
                    <Trash2 className="w-4 h-4 text-red-400" />
                    <span>Delete Test Projects</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Remove all menu items / test projects</p>
                </button>

                <button
                  onClick={handleClearAllCustomerAccounts}
                  className="p-4 rounded-2xl bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-left transition-all cursor-pointer sm:col-span-2"
                >
                  <div className="flex items-center gap-2 text-red-300 font-bold text-xs uppercase">
                    <Trash2 className="w-4 h-4 text-red-400" />
                    <span>Clear Test Customer Accounts</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Reset customer database & remove test user signups</p>
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* FULL ORDER DETAILS MODAL */}
      {selectedOrderDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-2xl bg-[#2C0202] rounded-3xl border border-[#FFB703]/40 p-6 sm:p-8 space-y-6 shadow-2xl my-8 text-[#FFFBEB]"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <span className="text-xs font-bold text-[#FFB703] uppercase tracking-wider">
                  Order Details & Invoice
                </span>
                <h3 className="font-display text-3xl text-white mt-0.5">
                  #{selectedOrderDetailModal.id}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePrintBill(selectedOrderDetailModal)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FFB703] hover:bg-[#FB8500] text-[#3B0202] font-black text-xs uppercase shadow transition-all cursor-pointer"
                  title="Print Thermal Receipt"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={() => setSelectedOrderDetailModal(null)}
                  className="p-2.5 rounded-xl bg-[#1A0101] text-gray-300 hover:text-white border border-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Order Time & Status */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-[#1A0101] border border-white/10 text-xs">
              <div>
                <span className="text-gray-400 font-bold block uppercase text-[10px]">Date & Exact Time Placed</span>
                <span className="text-white font-bold text-sm mt-0.5 block">
                  {formatExactDateTime(selectedOrderDetailModal.createdAt)}
                </span>
              </div>

              <div>
                <span className="text-gray-400 font-bold block uppercase text-[10px]">Current Status</span>
                <span className="text-[#FFB703] font-bold text-sm mt-0.5 block uppercase">
                  {selectedOrderDetailModal.status.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            {/* Customer Details */}
            <div className="p-4 rounded-2xl bg-[#1A0101] border border-white/10 space-y-3 text-xs">
              <span className="font-bold text-[#FFB703] uppercase block text-[11px]">
                Customer Information
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-400 block text-[10px]">Customer Name</span>
                  <p className="font-bold text-white text-base">{selectedOrderDetailModal.customerName}</p>
                </div>

                <div>
                  <span className="text-gray-400 block text-[10px]">Customer Mobile Phone</span>
                  <div className="flex items-center gap-2 mt-1">
                    <a
                      href={`tel:${selectedOrderDetailModal.phone}`}
                      className="inline-flex items-center gap-1.5 text-sm font-bold text-[#FFD166] hover:underline"
                    >
                      <Phone className="w-4 h-4 text-[#FFB703]" />
                      <span>{selectedOrderDetailModal.phone}</span>
                    </a>

                    <a
                      href={getWhatsAppUrl(selectedOrderDetailModal.phone, selectedOrderDetailModal.id, selectedOrderDetailModal.customerName)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                    </a>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10">
                <span className="text-gray-400 block text-[10px]">Delivery Address in Rawalpindi</span>
                <p className="text-white font-medium text-sm mt-0.5 leading-relaxed">
                  {selectedOrderDetailModal.address}
                </p>
              </div>

              <a
                href={getGoogleMapsUrl(selectedOrderDetailModal.address, selectedOrderDetailModal.mapLocation)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#FFB703] text-[#3B0202] font-black text-xs uppercase tracking-wider hover:brightness-110 transition-all"
              >
                <MapPin className="w-4 h-4" />
                <span>OPEN LOCATION IN GOOGLE MAPS</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              {selectedOrderDetailModal.notes && (
                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200">
                  <span className="font-bold block">Order Note:</span>
                  <span>"{selectedOrderDetailModal.notes}"</span>
                </div>
              )}
            </div>

            {/* Item Breakdown */}
            <div className="p-4 rounded-2xl bg-[#1A0101] border border-white/10 space-y-3 text-xs">
              <span className="font-bold text-[#FFB703] uppercase block text-[11px]">
                Ordered Items
              </span>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedOrderDetailModal.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between items-start pb-2 border-b border-white/5 last:border-0">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-white text-sm">
                          {i.quantity}x {i.name}
                        </p>
                        {i.size && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-[#FFB703] text-[#3B0202]">
                            {i.size}
                          </span>
                        )}
                      </div>
                      <span className="text-gray-400 text-[11px]">Rs. {i.price.toLocaleString()} each</span>
                      {i.notes && (
                        <p className="text-[11px] text-gray-400 italic mt-0.5">"{i.notes}"</p>
                      )}
                    </div>
                    <span className="font-bold text-white text-sm">
                      Rs. {(i.price * i.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-white/10 space-y-1.5">
                <div className="flex justify-between text-gray-300">
                  <span>Subtotal</span>
                  <span>Rs. {selectedOrderDetailModal.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Delivery Charge</span>
                  <span>Rs. {selectedOrderDetailModal.deliveryFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-base font-black text-[#FFB703] pt-1 border-t border-white/10">
                  <span>TOTAL IN PKR</span>
                  <span>Rs. {selectedOrderDetailModal.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="p-4 rounded-2xl bg-[#1A0101] border border-white/10 flex items-center justify-between text-xs">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Payment Method</span>
                <span className="font-bold text-white text-sm">Cash on Delivery</span>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 font-bold text-[11px]">
                Pay Cash to Rider
              </span>
            </div>

            {/* Status Update Quick Controls */}
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-gray-300 block w-full mb-1">Set Order Status:</span>
              {(['NEW', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'] as OrderStatus[]).map((st) => (
                <button
                  key={st}
                  onClick={() => handleStatusChange(selectedOrderDetailModal.id, st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase cursor-pointer ${
                    selectedOrderDetailModal.status === st
                      ? 'bg-[#FFB703] text-[#3B0202] shadow-md'
                      : 'bg-[#1A0101] text-gray-400 hover:text-white'
                  }`}
                >
                  {st.replace(/_/g, ' ')}
                </button>
              ))}
            </div>

            {/* Permanent Delete Action */}
            <div className="pt-4 border-t border-white/10 flex justify-end">
              <button
                onClick={() => handleDeleteSingleOrder(selectedOrderDetailModal.id)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
                <span>PERMANENTLY DELETE THIS ORDER</span>
              </button>
            </div>

          </motion.div>
        </div>
      )}

      {/* Add / Edit Menu Item Modal */}
      {isAddMenuModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-[#2C0202] rounded-3xl border border-[#FFB703]/40 p-6 space-y-6 shadow-2xl text-[#FFFBEB]">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h3 className="font-display text-2xl text-white">
                {editingItem ? 'EDIT MENU ITEM' : 'ADD NEW MENU ITEM'}
              </h3>
              <button
                onClick={() => setIsAddMenuModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveMenu} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-300 mb-1">Food Item Name</label>
                <input
                  type="text"
                  required
                  value={menuForm.name}
                  onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                  placeholder="e.g. Cheez O'Clock Special Pizza"
                  className="w-full px-3 py-2.5 rounded-xl bg-[#1A0101] border border-white/20 text-white focus:outline-none focus:border-[#FFB703]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-300 mb-1">Category</label>
                  <select
                    value={menuForm.category}
                    onChange={(e) => setMenuForm({ ...menuForm, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#1A0101] border border-white/20 text-white focus:outline-none focus:border-[#FFB703]"
                  >
                    {MENU_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    {menuForm.category && !MENU_CATEGORIES.includes(menuForm.category as any) && (
                      <option value={menuForm.category}>{menuForm.category}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-300 mb-1">Base Price in PKR</label>
                  <input
                    type="number"
                    required
                    value={menuForm.price}
                    onChange={(e) => setMenuForm({ ...menuForm, price: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#1A0101] border border-white/20 text-white focus:outline-none focus:border-[#FFB703]"
                  />
                </div>
              </div>

              {/* SIZES CONFIGURATION (Small, Medium, Large) */}
              <div className="p-3.5 rounded-2xl bg-[#1A0101] border border-[#FFB703]/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#FFB703] text-xs uppercase block">
                      Size Options (Small / Medium / Large)
                    </span>
                    <p className="text-[10px] text-gray-400">
                      Enable for Pizzas or items with multiple portion sizes
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={menuForm.hasSizes}
                      onChange={(e) => setMenuForm({ ...menuForm, hasSizes: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#FFB703]"></div>
                  </label>
                </div>

                {menuForm.hasSizes && (
                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/10">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-300 mb-0.5">
                        Small (Rs.)
                      </label>
                      <input
                        type="number"
                        required={menuForm.hasSizes}
                        value={menuForm.sizeSmallPrice}
                        onChange={(e) => setMenuForm({ ...menuForm, sizeSmallPrice: Number(e.target.value) })}
                        placeholder="590"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#2C0202] border border-[#FFB703]/30 text-white font-bold text-xs focus:outline-none focus:border-[#FFB703]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#FFD166] mb-0.5">
                        Medium (Rs.)
                      </label>
                      <input
                        type="number"
                        required={menuForm.hasSizes}
                        value={menuForm.sizeMediumPrice}
                        onChange={(e) => setMenuForm({ ...menuForm, sizeMediumPrice: Number(e.target.value) })}
                        placeholder="1050"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#2C0202] border border-[#FFB703]/40 text-white font-bold text-xs focus:outline-none focus:border-[#FFB703]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-300 mb-0.5">
                        Large (Rs.)
                      </label>
                      <input
                        type="number"
                        required={menuForm.hasSizes}
                        value={menuForm.sizeLargePrice}
                        onChange={(e) => setMenuForm({ ...menuForm, sizeLargePrice: Number(e.target.value) })}
                        placeholder="1390"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#2C0202] border border-[#FFB703]/30 text-white font-bold text-xs focus:outline-none focus:border-[#FFB703]"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1">Image URL</label>
                <input
                  type="url"
                  required
                  value={menuForm.image}
                  onChange={(e) => setMenuForm({ ...menuForm, image: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2.5 rounded-xl bg-[#1A0101] border border-white/20 text-white focus:outline-none focus:border-[#FFB703]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={menuForm.description}
                  onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#1A0101] border border-white/20 text-white resize-none focus:outline-none focus:border-[#FFB703]"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={menuForm.isAvailable}
                    onChange={(e) => setMenuForm({ ...menuForm, isAvailable: e.target.checked })}
                  />
                  <span>Available in Stock</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={menuForm.isFeatured}
                    onChange={(e) => setMenuForm({ ...menuForm, isFeatured: e.target.checked })}
                  />
                  <span>Featured Item</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-[#FFB703] text-[#3B0202] font-black uppercase tracking-wider mt-4 hover:brightness-110 cursor-pointer active:scale-98 transition-all"
              >
                SAVE ITEM
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Thermal Receipt Print Component for 80mm / 58mm POS receipt printers */}
      <ThermalReceipt order={orderToPrint} />

    </div>
  );
};
