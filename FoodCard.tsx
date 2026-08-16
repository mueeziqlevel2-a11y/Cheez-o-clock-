import React, { useState } from 'react';
import { Heart, Plus, Check, SlidersHorizontal } from 'lucide-react';
import { MenuItem } from '../types';
import { getSafeFoodImage, handleImageError } from '../lib/imageFallback';

interface FoodCardProps {
  item: MenuItem;
  isWishlisted: boolean;
  onAddToCart: (item: MenuItem) => void;
  onToggleWishlist: (item: MenuItem) => void;
  onClickDetails: (item: MenuItem) => void;
}

export const FoodCard: React.FC<FoodCardProps> = ({
  item,
  isWishlisted,
  onAddToCart,
  onToggleWishlist,
  onClickDetails
}) => {
  const [added, setAdded] = useState(false);

  const hasSizes = Boolean(
    item.hasSizes ||
    item.sizes?.small ||
    item.sizes?.medium ||
    item.sizes?.large ||
    (item.category && item.category.toLowerCase().includes('pizza'))
  );

  // Compute minimum display price
  const displayPrice = item.sizes?.small || item.price;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.isSoldOut || !item.isAvailable) return;
    if (hasSizes) {
      // Open modal to let customer choose Small, Medium, or Large
      onClickDetails(item);
      return;
    }
    onAddToCart(item);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleWishlist(item);
  };

  return (
    <div
      onClick={() => onClickDetails(item)}
      className="group relative bg-[#220707] rounded-2xl border border-[#FFB703]/20 overflow-hidden shadow-xl hover:shadow-2xl hover:border-[#FFB703]/60 transition-all duration-300 flex flex-col justify-between cursor-pointer transform hover:-translate-y-1.5"
    >
      {/* Top Image Container */}
      <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-[#150404]">
        <img
          src={getSafeFoodImage(item.image, item.category, item.name)}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => handleImageError(e, item.category, item.name)}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#220707] via-transparent to-transparent opacity-80" />

        {/* Featured / Sold Out / Size Available Tag */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {item.isFeatured && (
            <span className="bg-[#FFB703] text-[#150404] font-black text-[10px] tracking-wider px-2.5 py-1 rounded-md uppercase shadow-md">
              POPULAR
            </span>
          )}
          {hasSizes && (
            <span className="bg-[#1A0101]/90 border border-[#FFB703]/40 text-[#FFD166] font-bold text-[10px] tracking-wider px-2 py-0.5 rounded-md uppercase shadow-md backdrop-blur-xs">
              S / M / L SIZES
            </span>
          )}
          {(item.isSoldOut || !item.isAvailable) && (
            <span className="bg-[#DC2626] text-white font-black text-[10px] tracking-wider px-2.5 py-1 rounded-md uppercase shadow-md">
              SOLD OUT
            </span>
          )}
        </div>

        {/* Wishlist Heart Button */}
        <button
          onClick={handleWishlist}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className={`absolute top-3 right-3 z-10 p-2 rounded-full backdrop-blur-md transition-all duration-200 cursor-pointer ${
            isWishlisted
              ? 'bg-[#DC2626] text-white scale-110 shadow-lg'
              : 'bg-black/40 text-gray-300 hover:bg-[#DC2626] hover:text-white'
          }`}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Price Tag Overlay */}
        <div className="absolute bottom-3 right-3 z-10 bg-[#FFB703] text-[#150404] px-3 py-1 rounded-lg font-black text-sm tracking-tight shadow-md">
          {hasSizes ? 'From ' : ''}Rs. {displayPrice.toLocaleString()}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <span className="text-[11px] font-bold text-[#FFB703] uppercase tracking-wider block mb-1">
            {item.category}
          </span>
          <h3 className="font-bold text-lg text-[#FFFBEB] group-hover:text-[#FFB703] transition-colors leading-snug line-clamp-1">
            {item.name}
          </h3>
          <p className="text-xs text-gray-300/80 mt-1.5 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          {item.isSoldOut || !item.isAvailable ? (
            <button
              disabled
              className="w-full py-2.5 rounded-xl bg-gray-800 text-gray-500 font-bold text-xs cursor-not-allowed uppercase"
            >
              CURRENTLY UNAVAILABLE
            </button>
          ) : hasSizes ? (
            <button
              onClick={handleAdd}
              className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 shadow-lg cursor-pointer bg-gradient-to-r from-[#FFB703] to-[#FB8500] hover:from-[#FB8500] hover:to-[#FFB703] text-[#150404] font-black hover:brightness-105 active:scale-95"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>CHOOSE SIZE</span>
            </button>
          ) : (
            <button
              onClick={handleAdd}
              className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                added
                  ? 'bg-emerald-600 text-white shadow-emerald-900/50 scale-98'
                  : 'bg-gradient-to-r from-[#FFB703] to-[#FB8500] hover:from-[#FB8500] hover:to-[#FFB703] text-[#150404] font-black hover:brightness-105 active:scale-95'
              }`}
            >
              {added ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>ADDED ✓</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>ADD TO CART</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
