import React, { useState, useEffect } from 'react';
import { MenuItem, OrderItem, Order, AdminSettings, CustomerUser } from './types';
import {
  fetchMenu,
  fetchSettings,
  getStoredCustomerToken,
  getStoredCustomerUser,
  setStoredCustomerToken,
  setStoredCustomerUser,
  fetchCustomerProfile,
  syncCustomerWishlist
} from './lib/api';
import { subscribeMenu, subscribeSettings } from './lib/firebase';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { MenuSection } from './components/MenuSection';
import { FoodDetailModal } from './components/FoodDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { WishlistModal } from './components/WishlistModal';
import { CheckoutModal } from './components/CheckoutModal';
import { CustomerAuthModal } from './components/CustomerAuthModal';
import { OrderHistoryModal } from './components/OrderHistoryModal';
import { OrderTrackingView } from './components/OrderTrackingView';
import { LocationContactSection } from './components/LocationContactSection';
import { Footer } from './components/Footer';
import { AdminPortal } from './components/admin/AdminPortal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { WhatsAppButton } from './components/WhatsAppButton';

export default function App() {
  // Navigation & View state
  const [currentView, setCurrentView] = useState<'customer' | 'admin'>('customer');
  const [activeTab, setActiveTab] = useState<'home' | 'menu' | 'tracking' | 'contact'>('home');

  // Customer Auth state
  const [customerToken, setCustomerToken] = useState<string | null>(() => getStoredCustomerToken());
  const [customerUser, setCustomerUser] = useState<CustomerUser | null>(() => getStoredCustomerUser());

  // App Data
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [settings, setSettings] = useState<AdminSettings>({ deliveryFee: 100, storeIsOpen: true });
  const [loading, setLoading] = useState(true);

  // Cart & Wishlist (Persisted in LocalStorage & synced with user account)
  const [cart, setCart] = useState<OrderItem[]>(() => {
    try {
      const saved = localStorage.getItem('coc_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState<MenuItem[]>(() => {
    try {
      const saved = localStorage.getItem('coc_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modal Overlay States
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOrderHistoryOpen, setIsOrderHistoryOpen] = useState(false);
  const [selectedModalItem, setSelectedModalItem] = useState<MenuItem | null>(null);
  const [activeTrackedOrder, setActiveTrackedOrder] = useState<Order | null>(null);

  // Toasts Notification system
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync Cart to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('coc_cart', JSON.stringify(cart));
    } catch (e) {}
  }, [cart]);

  // Sync Wishlist to LocalStorage & Customer Account
  useEffect(() => {
    try {
      localStorage.setItem('coc_wishlist', JSON.stringify(wishlist));
    } catch (e) {}

    if (customerToken) {
      syncCustomerWishlist(customerToken, wishlist.map((w) => w.id));
    }
  }, [wishlist, customerToken]);

  // Sync Customer profile on load
  useEffect(() => {
    if (customerToken) {
      fetchCustomerProfile(customerToken)
        .then((user) => setCustomerUser(user))
        .catch(() => {
          // Token invalid
          setCustomerToken(null);
          setCustomerUser(null);
          setStoredCustomerToken(null);
          setStoredCustomerUser(null);
        });
    }
  }, []);

  // Initial Load of Menu & Settings
  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [fetchedMenu, fetchedSettings] = await Promise.all([
        fetchMenu(),
        fetchSettings()
      ]);
      setMenuItems(fetchedMenu);
      setSettings(fetchedSettings);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load menu or settings:', err);
      setLoading(false);
      showToast('error', "We're having trouble loading the menu. Please refresh.");
    }
  };

  useEffect(() => {
    loadInitialData();

    const unsubMenu = subscribeMenu((liveMenu) => {
      setMenuItems(liveMenu);
      setLoading(false);
    });

    const unsubSettings = subscribeSettings((liveSettings) => {
      setSettings(liveSettings);
    });

    // Check if URL has #admin, #host, /admin, or /host
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    if (hash === '#admin' || hash === '#host' || path === '/admin' || path === '/host') {
      setCurrentView('admin');
    }

    return () => {
      unsubMenu();
      unsubSettings();
    };
  }, []);

  // Cart Actions
  const handleAddToCart = (item: MenuItem, quantity = 1, notes?: string) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((i) => i.id === item.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
          notes: notes || updated[existingIndex].notes
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            id: item.id,
            name: item.name,
            price: item.price,
            quantity,
            image: item.image,
            notes
          }
        ];
      }
    });

    showToast('success', `Added ${quantity}x ${item.name} to cart!`);
  };

  const handleUpdateCartQuantity = (id: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as OrderItem[];
    });
  };

  const handleRemoveFromCart = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
    showToast('info', 'Item removed from cart');
  };

  const handleClearCart = () => {
    setCart([]);
    showToast('info', 'Cart cleared');
  };

  // Wishlist Actions
  const handleToggleWishlist = (item: MenuItem) => {
    setWishlist((prev) => {
      const exists = prev.some((i) => i.id === item.id);
      if (exists) {
        showToast('info', `Removed ${item.name} from wishlist`);
        return prev.filter((i) => i.id !== item.id);
      } else {
        showToast('success', `Saved ${item.name} to wishlist!`);
        return [...prev, item];
      }
    });
  };

  const handleMoveToWishlistFromCart = (cartItem: OrderItem) => {
    const menuItem = menuItems.find((m) => m.id === cartItem.id) || {
      id: cartItem.id,
      name: cartItem.name,
      description: '',
      category: 'Saved',
      price: cartItem.price,
      image: cartItem.image,
      isAvailable: true
    };

    handleToggleWishlist(menuItem);
    handleRemoveFromCart(cartItem.id);
  };

  // Customer Auth Success & Logout Handlers
  const handleAuthSuccess = (user: CustomerUser, token: string, msg: string) => {
    setCustomerUser(user);
    setCustomerToken(token);
    setStoredCustomerUser(user);
    setStoredCustomerToken(token);

    // If user has saved wishlist items, restore them into local wishlist
    if (user.wishlistIds && user.wishlistIds.length > 0 && menuItems.length > 0) {
      const savedItems = menuItems.filter((m) => user.wishlistIds.includes(m.id));
      setWishlist((prev) => {
        const combined = [...prev];
        savedItems.forEach((si) => {
          if (!combined.some((c) => c.id === si.id)) {
            combined.push(si);
          }
        });
        return combined;
      });
    }

    showToast('success', msg);

    // If user has items in cart, auto open checkout modal after login
    if (cart.length > 0) {
      setIsCheckoutOpen(true);
    }
  };

  const handleLogout = () => {
    setCustomerUser(null);
    setCustomerToken(null);
    setStoredCustomerUser(null);
    setStoredCustomerToken(null);
    showToast('info', 'Logged out of your customer account.');
  };

  // Reorder items from history
  const handleReorder = (items: OrderItem[]) => {
    setCart((prev) => {
      const updated = [...prev];
      items.forEach((item) => {
        const existingIdx = updated.findIndex((i) => i.id === item.id);
        if (existingIdx > -1) {
          updated[existingIdx].quantity += item.quantity;
        } else {
          updated.push({ ...item });
        }
      });
      return updated;
    });
    setIsCartOpen(true);
    showToast('success', 'Previous items added to cart!');
  };

  // Order Success Callback
  const handleOrderSuccess = (newOrder: Order) => {
    setCart([]); // Clear cart
    setIsCheckoutOpen(false);
    setIsCartOpen(false);
    setActiveTrackedOrder(newOrder);
    setActiveTab('tracking');
    showToast('success', `Order #${newOrder.id} placed successfully! 🎉`);

    // Smooth scroll to top for tracking view
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Render Host Admin Portal View
  if (currentView === 'admin') {
    return (
      <>
        <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
        <AdminPortal
          onBackToStore={() => setCurrentView('customer')}
          onShowToast={showToast}
        />
      </>
    );
  }

  // Render Customer Website
  return (
    <div className="min-h-screen bg-[#180505] text-[#FFFBEB] flex flex-col font-sans">
      
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />

      {/* Navigation Bar */}
      <Navbar
        cartCount={cart.reduce((sum, i) => sum + i.quantity, 0)}
        wishlistCount={wishlist.length}
        customerUser={customerUser}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenTracking={() => {
          setActiveTab('tracking');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenOrderHistory={() => {
          if (!customerUser && !customerToken) {
            setIsAuthModalOpen(true);
            showToast('info', 'Please log in to view your order history.');
          } else {
            setIsOrderHistoryOpen(true);
          }
        }}
        onLogout={handleLogout}
        onOpenAdmin={() => setCurrentView('admin')}
        onNavigateHome={() => {
          setActiveTab('home');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigateMenu={() => {
          setActiveTab('menu');
          const el = document.getElementById('menu-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onNavigateContact={() => {
          setActiveTab('contact');
          const el = document.getElementById('contact-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Main Body Content based on Active Tab */}
      <main className="flex-1">
        
        {/* If Active Tab is Tracking Order */}
        {activeTab === 'tracking' ? (
          <OrderTrackingView
            initialOrder={activeTrackedOrder}
            onContinueOrdering={() => {
              setActiveTab('menu');
              const el = document.getElementById('menu-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          />
        ) : (
          <>
            {/* Hero Section */}
            <Hero
              onOrderNow={() => {
                setActiveTab('menu');
                const el = document.getElementById('menu-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              onExploreMenu={() => {
                setActiveTab('menu');
                const el = document.getElementById('menu-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* Interactive Menu Section */}
            {loading ? (
              <div className="py-24 text-center space-y-3">
                <div className="w-10 h-10 border-4 border-[#FFB703] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm font-bold text-[#FFD166]">Loading Cheez O'Clock menu...</p>
              </div>
            ) : (
              <MenuSection
                menuItems={menuItems}
                wishlistIds={wishlist.map((w) => w.id)}
                onAddToCart={handleAddToCart}
                onToggleWishlist={handleToggleWishlist}
                onClickDetails={(item) => setSelectedModalItem(item)}
              />
            )}

            {/* Location & Contact Section */}
            <LocationContactSection />
          </>
        )}

      </main>

      {/* Footer */}
      <Footer
        onNavigateHome={() => {
          setActiveTab('home');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigateMenu={() => {
          setActiveTab('menu');
          const el = document.getElementById('menu-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenTracking={() => {
          setActiveTab('tracking');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigateContact={() => {
          setActiveTab('contact');
          const el = document.getElementById('contact-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenAdmin={() => setCurrentView('admin')}
      />

      {/* Modals & Drawers */}

      {/* Food Item Detail Modal */}
      <FoodDetailModal
        item={selectedModalItem}
        isWishlisted={selectedModalItem ? wishlist.some((w) => w.id === selectedModalItem.id) : false}
        onClose={() => setSelectedModalItem(null)}
        onAddToCart={(item, qty, notes) => handleAddToCart(item, qty, notes)}
        onToggleWishlist={handleToggleWishlist}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        cartItems={cart}
        deliveryFee={settings.deliveryFee}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onMoveToWishlist={handleMoveToWishlistFromCart}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          if (!customerUser) {
            showToast('info', 'Please log in or sign up with your phone number or Google account to checkout.');
            setIsAuthModalOpen(true);
          } else {
            setIsCheckoutOpen(true);
          }
        }}
        onClearCart={handleClearCart}
      />

      {/* Wishlist Modal */}
      <WishlistModal
        isOpen={isWishlistOpen}
        wishlistItems={wishlist}
        onClose={() => setIsWishlistOpen(false)}
        onRemoveFromWishlist={(id) => setWishlist((prev) => prev.filter((i) => i.id !== id))}
        onAddToCart={(item) => {
          handleAddToCart(item);
          setIsWishlistOpen(false);
          setIsCartOpen(true);
        }}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        cartItems={cart}
        deliveryFee={settings.deliveryFee}
        customerUser={customerUser}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderSuccess={handleOrderSuccess}
        onError={(msg) => showToast('error', msg)}
        onRequireAuth={() => {
          setIsCheckoutOpen(false);
          setIsAuthModalOpen(true);
        }}
      />

      {/* Customer Auth Modal (Login / Signup) */}
      <CustomerAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        onError={(msg) => showToast('error', msg)}
      />

      {/* Order History Modal */}
      <OrderHistoryModal
        isOpen={isOrderHistoryOpen}
        onClose={() => setIsOrderHistoryOpen(false)}
        token={customerToken}
        customerUser={customerUser}
        onReorder={handleReorder}
        onTrackOrder={(order) => {
          setActiveTrackedOrder(order);
          setActiveTab('tracking');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* WhatsApp Floating Contact Option */}
      <WhatsAppButton />

    </div>
  );
}
