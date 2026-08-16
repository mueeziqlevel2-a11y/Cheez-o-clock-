import React from 'react';
import { Sparkles, Plus, Clock, Tag, CheckCircle2, SlidersHorizontal } from 'lucide-react';
import { SpecialDeal, MenuItem } from '../types';

interface SpecialDealCardProps {
  deal: SpecialDeal;
  menuItems?: MenuItem[];
  onAddToCart: (deal: SpecialDeal) => void;
  onClickDetails?: (deal: SpecialDeal) => void;
}

export const SpecialDealCard: React.FC<SpecialDealCardProps> = ({
  deal,
  menuItems = [],
  onAddToCart,
  onClickDetails
}) => {
  const hasSizes = Boolean(
    deal.hasSizes ||
    deal.sizes?.small ||
    deal.sizes?.medium ||
    deal.sizes?.large
  );

  const displayPrice = hasSizes && deal.sizes?.small ? deal.sizes.small : deal.price;

  const savings = deal.originalPrice && deal.originalPrice > displayPrice
    ? deal.originalPrice - displayPrice
    : 0;

  // Resolve included product names if IDs provided
  const includedNames = deal.includedProductIds && deal.includedProductIds.length > 0
    ? deal.includedProductIds
        .map((pid) => menuItems.find((m) => m.id === pid)?.name)
        .filter(Boolean)
    : [];

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasSizes && onClickDetails) {
      onClickDetails(deal);
      return;
    }
    onAddToCart(deal);
  };

  return (
    <div
      id={`special-deal-${deal.id}`}
      className="group bg-[#220707] rounded-3xl overflow-hidden border-2 border-[#FFB703]/30 hover:border-[#FFB703] transition-all duration-300 flex flex-col justify-between shadow-2xl hover:shadow-[#FFB703]/10 relative"
    >
      {/* Top Banner Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 items-start">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#D90429] to-[#EF233C] text-white text-[11px] font-black uppercase tracking-wider shadow-lg">
          <Sparkles className="w-3.5 h-3.5 animate-pulse text-[#FFD166]" />
          SPECIAL DEAL
        </span>
        {hasSizes && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#1A0101]/90 border border-[#FFB703]/40 text-[#FFD166] text-[10px] font-black uppercase tracking-wide shadow-md backdrop-blur-xs">
            S / M / L SIZES
          </span>
        )}
        {savings > 0 && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFB703] text-[#150404] text-[10px] font-black uppercase tracking-wide shadow-md">
            <Tag className="w-3 h-3" />
            Save Rs. {savings.toLocaleString()}
          </span>
        )}
      </div>

      {/* Image Container */}
      <div
        className="relative h-48 sm:h-52 w-full overflow-hidden cursor-pointer bg-[#150404]"
        onClick={() => onClickDetails && onClickDetails(deal)}
      >
        <img
          src={deal.image || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800'}
          alt={deal.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#220707] via-transparent to-black/30" />
      </div>

      {/* Content Body */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <h3
              onClick={() => onClickDetails && onClickDetails(deal)}
              className="font-display text-xl sm:text-2xl text-[#FFFBEB] group-hover:text-[#FFB703] transition-colors leading-tight cursor-pointer"
            >
              {deal.name}
            </h3>
          </div>

          <p className="text-xs sm:text-sm text-gray-300 line-clamp-2 leading-relaxed">
            {deal.description}
          </p>

          {/* Included Items Summary / Badges */}
          {(deal.includedItemsSummary || includedNames.length > 0) && (
            <div className="pt-1.5 pb-1">
              <p className="text-[10px] uppercase font-black text-[#FFD166] tracking-wider mb-1.5 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-[#FFB703]" />
                Included In Deal:
              </p>
              {includedNames.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {includedNames.map((name, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded-lg bg-[#150404] border border-[#FFB703]/20 text-gray-300 font-medium"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-300 bg-[#150404] p-2 rounded-xl border border-[#FFB703]/20">
                  {deal.includedItemsSummary}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Pricing & Add to Cart Action */}
        <div className="pt-3 border-t border-[#FFB703]/15 flex items-center justify-between gap-3">
          <div>
            {deal.originalPrice && deal.originalPrice > displayPrice && (
              <span className="text-xs text-gray-400 line-through block font-medium">
                Rs. {deal.originalPrice.toLocaleString()}
              </span>
            )}
            <div className="text-xl sm:text-2xl font-black text-[#FFB703] tracking-tight">
              {hasSizes ? 'From ' : ''}Rs. {displayPrice.toLocaleString()}
            </div>
          </div>

          <button
            id={`btn-add-deal-${deal.id}`}
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#FFB703] to-[#FB8500] hover:from-[#FB8500] hover:to-[#D90429] text-[#150404] hover:text-white font-black text-xs uppercase tracking-wider shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            {hasSizes ? (
              <>
                <SlidersHorizontal className="w-4 h-4" />
                <span>Choose Size</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Add Deal</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
