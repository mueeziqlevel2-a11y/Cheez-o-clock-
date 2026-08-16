import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { MenuItem } from '../types';

interface WishlistModalProps {
  isOpen: boolean;
  wishlistItems: MenuItem[];
  onClose: () => void;
  onRemoveFromWishlist: (id: string) => void;
  onAddToCart: (item: MenuItem) => void;
}

export const WishlistModal: React.FC<WishlistModalProps> = ({
  isOpen,
  wishlistItems,
  onClose,
  onRemoveFromWishlist,
  onAddToCart
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl bg-[#2C0202] rounded-3xl border border-[#FFB703]/30 overflow-hidden shadow-2xl my-8 text-[#FFFBEB] flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="p-6 bg-[#1A0101] border-b border-[#FFB703]/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#C8102E] text-white">
                <Heart className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h2 className="font-display text-2xl tracking-wide text-[#FFFBEB]">
                  YOUR WISHLIST
                </h2>
                <p className="text-xs text-[#FFD166]">
                  {wishlistItems.length} {wishlistItems.length === 1 ? 'favorite' : 'favorites'} saved
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

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {wishlistItems.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-[#1A0101] border border-[#FFB703]/20 flex items-center justify-center text-gray-500">
                  <Heart className="w-10 h-10" />
                </div>
                <h3 className="font-bold text-lg text-white">Your wishlist is empty</h3>
                <p className="text-xs text-gray-400 max-w-xs mx-auto">
                  Click the heart icon on any food item to save your cheesy favorites for later!
                </p>
              </div>
            ) : (
              wishlistItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-[#1A0101] border border-[#FFB703]/20 flex flex-col sm:flex-row items-center gap-4 shadow-lg justify-between"
                >
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 rounded-xl object-cover shrink-0 border border-white/10"
                    />
                    <div>
                      <span className="text-[10px] font-bold text-[#FFB703] uppercase">
                        {item.category}
                      </span>
                      <h4 className="font-bold text-sm text-[#FFFBEB]">
                        {item.name}
                      </h4>
                      <p className="text-xs text-[#FFD166] font-black mt-0.5">
                        Rs. {item.price.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => onRemoveFromWishlist(item.id)}
                      className="p-2.5 rounded-xl bg-red-950/40 text-red-300 hover:bg-red-900/60 transition-colors"
                      title="Remove from wishlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        onAddToCart(item);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-[#FFB703] text-[#3B0202] font-black text-xs uppercase tracking-wider flex items-center gap-2 hover:brightness-110"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>ADD TO CART</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
