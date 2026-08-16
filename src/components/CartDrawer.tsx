import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Minus, Plus, ShoppingBag, ArrowRight, Heart } from 'lucide-react';
import { OrderItem } from '../types';
import { getSafeFoodImage, handleImageError } from '../lib/imageFallback';

interface CartDrawerProps {
  isOpen: boolean;
  cartItems: OrderItem[];
  deliveryFee: number;
  onClose: () => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onMoveToWishlist: (item: OrderItem) => void;
  onProceedToCheckout: () => void;
  onClearCart: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  cartItems,
  deliveryFee,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onMoveToWishlist,
  onProceedToCheckout,
  onClearCart
}) => {
  if (!isOpen) return null;

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal + (cartItems.length > 0 ? deliveryFee : 0);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Drawer Panel */}
        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-screen max-w-md bg-[#2C0202] text-[#FFFBEB] shadow-2xl flex flex-col border-l border-[#FFB703]/30"
          >
            {/* Header */}
            <div className="p-6 bg-[#1A0101] border-b border-[#FFB703]/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#FFB703] text-[#3B0202]">
                  <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h2 className="font-display text-2xl tracking-wide text-[#FFFBEB]">
                    YOUR CART
                  </h2>
                  <p className="text-xs text-[#FFD166]">
                    {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} selected
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-[#3B0202] text-gray-300 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {cartItems.length === 0 ? (
                <div className="text-center py-16 space-y-4">
                  <div className="w-20 h-20 mx-auto rounded-full bg-[#1A0101] border border-[#FFB703]/20 flex items-center justify-center text-gray-500">
                    <ShoppingBag className="w-10 h-10" />
                  </div>
                  <h3 className="font-bold text-lg text-white">Your cart is empty</h3>
                  <p className="text-xs text-gray-400 max-w-xs mx-auto">
                    Looks like you haven't added any cheesy deliciousness yet.
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-4 px-6 py-2.5 rounded-xl bg-[#FFB703] text-[#3B0202] font-black text-xs uppercase tracking-wider"
                  >
                    BROWSE MENU
                  </button>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-[#1A0101] border border-[#FFB703]/20 flex gap-4 items-center shadow-lg"
                  >
                    <img
                      src={getSafeFoodImage(item.image, '', item.name)}
                      alt={item.name}
                      className="w-20 h-20 rounded-xl object-cover shrink-0 border border-white/10"
                      referrerPolicy="no-referrer"
                      onError={(e) => handleImageError(e, '', item.name)}
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-[#FFFBEB] truncate">
                        {item.name}
                      </h4>
                      <p className="text-xs text-[#FFB703] font-black mt-0.5">
                        Rs. {item.price.toLocaleString()}
                      </p>
                      {item.notes && (
                        <p className="text-[11px] text-gray-400 italic mt-0.5 truncate">
                          "{item.notes}"
                        </p>
                      )}

                      {/* Quantity & Actions */}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2 bg-[#2C0202] border border-[#FFB703]/20 rounded-lg p-1">
                          <button
                            onClick={() => onUpdateQuantity(item.id, -1)}
                            className="w-6 h-6 rounded bg-[#3B0202] text-white flex items-center justify-center hover:bg-[#C8102E]"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold px-2 text-[#FFD166]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, 1)}
                            className="w-6 h-6 rounded bg-[#3B0202] text-white flex items-center justify-center hover:bg-[#FFB703] hover:text-[#3B0202]"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onMoveToWishlist(item)}
                            title="Move to Wishlist"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-[#FFB703] transition-colors"
                          >
                            <Heart className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onRemoveItem(item.id)}
                            title="Remove"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-[#C8102E] transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Calculation & Checkout Button */}
            {cartItems.length > 0 && (
              <div className="p-6 bg-[#1A0101] border-t border-[#FFB703]/20 space-y-4">
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-bold text-white">
                      Rs. {subtotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span className="font-bold text-[#FFD166]">
                      Rs. {deliveryFee.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-black text-[#FFB703] pt-2 border-t border-white/10">
                    <span>TOTAL</span>
                    <span>Rs. {total.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={onClearCart}
                    className="p-3.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 transition-colors"
                    title="Clear Cart"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>

                  <button
                    onClick={onProceedToCheckout}
                    className="flex-1 py-4 rounded-xl bg-gradient-to-r from-[#FFB703] to-[#FB8500] text-[#3B0202] font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-2xl hover:brightness-110 active:scale-98 transition-all cursor-pointer"
                  >
                    <span>PROCEED TO CHECKOUT</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};
