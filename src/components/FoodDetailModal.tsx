import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Minus, Plus, Heart, ShoppingBag, Check } from 'lucide-react';
import { MenuItem } from '../types';
import { getSafeFoodImage, handleImageError } from '../lib/imageFallback';

interface FoodDetailModalProps {
  item: MenuItem | null;
  isWishlisted: boolean;
  onClose: () => void;
  onAddToCart: (item: MenuItem, quantity: number, notes?: string) => void;
  onToggleWishlist: (item: MenuItem) => void;
}

export const FoodDetailModal: React.FC<FoodDetailModalProps> = ({
  item,
  isWishlisted,
  onClose,
  onAddToCart,
  onToggleWishlist
}) => {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [added, setAdded] = useState(false);

  if (!item) return null;

  const handleAdd = () => {
    onAddToCart(item, quantity, notes);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 1000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg bg-[#2C0202] rounded-3xl border border-[#FFB703]/30 overflow-hidden shadow-2xl my-auto text-[#FFFBEB] max-h-[92vh] flex flex-col"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 text-white hover:bg-[#C8102E] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Scrollable Container */}
          <div className="overflow-y-auto max-h-[92vh]">
            {/* Modal Header Image */}
            <div className="relative h-60 sm:h-64 w-full bg-[#1A0101]">
              <img
                src={getSafeFoodImage(item.image, item.category, item.name)}
                alt={item.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => handleImageError(e, item.category, item.name)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2C0202] via-transparent to-transparent" />

              <div className="absolute top-4 left-4">
                <span className="bg-[#FFB703] text-[#3B0202] text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  {item.category}
                </span>
              </div>

              <button
                onClick={() => onToggleWishlist(item)}
                aria-label="Wishlist"
                className={`absolute top-4 right-16 p-2.5 rounded-full backdrop-blur-md transition-all ${
                  isWishlisted ? 'bg-[#C8102E] text-white' : 'bg-black/50 text-gray-300'
                }`}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
            </div>

          {/* Modal Body */}
          <div className="p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-bold text-2xl text-[#FFFBEB] leading-tight">
                  {item.name}
                </h2>
                <p className="text-sm text-gray-300 mt-2 leading-relaxed">
                  {item.description}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-2xl font-black text-[#FFB703]">
                  Rs. {item.price.toLocaleString()}
                </span>
                <span className="text-[11px] text-gray-400 block mt-0.5">PKR</span>
              </div>
            </div>

            {/* Special Instructions Note */}
            <div>
              <label className="block text-xs font-bold text-[#FFD166] uppercase tracking-wider mb-1.5">
                Special Requests / Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Extra cheese drip, less spicy, no onions..."
                className="w-full px-4 py-2.5 rounded-xl bg-[#1A0101] border border-[#FFB703]/30 text-white text-sm focus:outline-none focus:border-[#FFB703] placeholder-gray-500"
              />
            </div>

            {/* Quantity Selector & Add Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center justify-between bg-[#1A0101] border border-[#FFB703]/30 rounded-2xl p-1.5 w-full sm:w-auto">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-xl bg-[#3B0202] hover:bg-[#C8102E] text-white font-bold flex items-center justify-center transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-6 font-black text-lg text-[#FFB703]">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-xl bg-[#3B0202] hover:bg-[#FFB703] hover:text-[#3B0202] text-white font-bold flex items-center justify-center transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleAdd}
                disabled={item.isSoldOut || !item.isAvailable}
                className={`flex-1 w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xl ${
                  added
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gradient-to-r from-[#FFB703] to-[#FB8500] text-[#3B0202] hover:brightness-110 active:scale-98'
                }`}
              >
                {added ? (
                  <>
                    <Check className="w-5 h-5 stroke-[3]" />
                    <span>ADDED ✓</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    <span>
                      ADD TO CART — Rs. {(item.price * quantity).toLocaleString()}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
