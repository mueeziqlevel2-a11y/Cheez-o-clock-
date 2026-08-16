import React, { useState } from 'react';
import { Search, Flame, Filter, Sparkles } from 'lucide-react';
import { MenuItem, SpecialDeal } from '../types';
import { MENU_CATEGORIES, MenuCategoryName, normalizeMenuCategory } from '../data/initialMenu';
import { isSpecialDealActive } from '../data/initialSpecialDeals';
import { FoodCard } from './FoodCard';
import { SpecialDealCard } from './SpecialDealCard';

interface MenuSectionProps {
  menuItems: MenuItem[];
  specialDeals?: SpecialDeal[];
  wishlistIds: string[];
  onAddToCart: (item: MenuItem) => void;
  onAddDealToCart?: (deal: SpecialDeal) => void;
  onToggleWishlist: (item: MenuItem) => void;
  onClickDetails: (item: MenuItem) => void;
  onClickDealDetails?: (deal: SpecialDeal) => void;
}

export const MenuSection: React.FC<MenuSectionProps> = ({
  menuItems,
  specialDeals = [],
  wishlistIds,
  onAddToCart,
  onAddDealToCart,
  onToggleWishlist,
  onClickDetails,
  onClickDealDetails
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active special deals currently live
  const activeDeals = specialDeals.filter(isSpecialDealActive);

  // Exact 12 category canonical list + ALL
  const categoryTabs: string[] = ['ALL', ...MENU_CATEGORIES];

  // Helper to handle deal addition to cart
  const handleDealAddToCart = (deal: SpecialDeal) => {
    if (onAddDealToCart) {
      onAddDealToCart(deal);
    } else {
      // Fallback convert to MenuItem shape
      const dealItem: MenuItem = {
        id: deal.id,
        name: deal.name,
        description: deal.description,
        category: 'Special Deals',
        price: deal.price,
        image: deal.image,
        isAvailable: true,
        isFeatured: true
      };
      onAddToCart(dealItem);
    }
  };

  const query = searchQuery.trim().toLowerCase();

  // Filter special deals matching search
  const filteredDeals = activeDeals.filter((deal) => {
    if (selectedCategory !== 'ALL' && selectedCategory !== 'Special Deals') return false;
    if (!query) return true;
    return (
      deal.name.toLowerCase().includes(query) ||
      deal.description.toLowerCase().includes(query) ||
      (deal.includedItemsSummary && deal.includedItemsSummary.toLowerCase().includes(query))
    );
  });

  // Filter menu items by selected category and search query
  const filteredItems = menuItems.filter((item) => {
    if (selectedCategory === 'Special Deals') return false;
    
    // Normalize category for robust matching
    const itemNormCategory = normalizeMenuCategory(item.category);
    const matchesCategory = selectedCategory === 'ALL' || itemNormCategory === selectedCategory || item.category === selectedCategory;

    if (!matchesCategory) return false;
    if (!query) return true;

    return (
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
    );
  });

  // Sort filtered items by category order if ALL is selected
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (selectedCategory !== 'ALL') return 0;
    const catA = normalizeMenuCategory(a.category);
    const catB = normalizeMenuCategory(b.category);
    const idxA = MENU_CATEGORIES.indexOf(catA as any);
    const idxB = MENU_CATEGORIES.indexOf(catB as any);
    if (idxA !== idxB) return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
    // Keep featured items first within same category
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;
    return 0;
  });

  const totalResultsCount = (selectedCategory === 'Special Deals' ? filteredDeals.length : (filteredDeals.length + sortedItems.length));

  return (
    <section id="menu-section" className="py-16 md:py-24 bg-[#180505] text-[#FFFBEB] relative scroll-mt-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFB703]/10 border border-[#FFB703]/30 text-[#FFD166] text-xs font-black uppercase tracking-widest">
            <Flame className="w-4 h-4 text-[#FFB703]" />
            <span>AUTHENTIC CHEEZ O'CLOCK MENU</span>
          </div>

          <h2 className="font-display text-4xl sm:text-6xl text-[#FFFBEB] tracking-wide">
            WHAT ARE YOU CRAVING TODAY?
          </h2>

          <p className="text-sm sm:text-base text-gray-300 max-w-xl mx-auto">
            Order fresh pizzas, premium burgers, crispy fries, wraps, shawarmas, kunafas, and special value deals delivered fast in Rawalpindi.
          </p>
        </div>

        {/* Search & Category Filter Controls */}
        <div className="space-y-6">
          
          {/* Search Bar */}
          <div className="max-w-md mx-auto relative">
            <Search className="w-5 h-5 absolute left-4 top-3.5 text-gray-400" />
            <input
              id="menu-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pizza, burger, fries, wings, kunafa..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-[#150404] border border-[#FFB703]/30 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#FFB703] shadow-xl transition-colors"
            />
          </div>

          {/* Category Filter Pills (Strict Ordered Tabs) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 pt-2 no-scrollbar scroll-smooth justify-start md:justify-center">
            {categoryTabs.map((cat) => {
              const isSelected = selectedCategory === cat;
              const isSpecial = cat === 'Special Deals';

              return (
                <button
                  key={cat}
                  id={`cat-btn-${cat.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 sm:px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#FFB703] to-[#FB8500] text-[#150404] shadow-xl scale-105 ring-2 ring-[#FFB703]/50'
                      : isSpecial
                      ? 'bg-[#D90429]/20 text-[#FFD166] border border-[#D90429]/50 hover:bg-[#D90429]/40'
                      : 'bg-[#220707] text-gray-300 hover:text-white border border-[#FFB703]/20 hover:border-[#FFB703]/40'
                  }`}
                >
                  {isSpecial && <Sparkles className="w-3.5 h-3.5 text-[#FFB703]" />}
                  <span>{cat}</span>
                  {isSpecial && activeDeals.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full bg-[#D90429] text-white text-[10px] font-black">
                      {activeDeals.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

        </div>

        {/* Empty State */}
        {totalResultsCount === 0 ? (
          <div className="text-center py-16 bg-[#220707] rounded-3xl border border-[#FFB703]/20 space-y-3">
            <Filter className="w-10 h-10 mx-auto text-gray-500" />
            <h3 className="font-bold text-lg text-white">No items found</h3>
            <p className="text-xs text-gray-400">
              {searchQuery ? `No menu items or deals matching "${searchQuery}".` : 'No items currently in this category.'}
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
              }}
              className="mt-2 px-5 py-2 rounded-xl bg-[#FFB703] text-[#150404] font-black text-xs uppercase cursor-pointer hover:bg-[#FB8500] transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            
            {/* Special Deals Grid when in ALL or Special Deals view */}
            {(selectedCategory === 'ALL' || selectedCategory === 'Special Deals') && filteredDeals.length > 0 && (
              <div className="space-y-6">
                {selectedCategory === 'ALL' && (
                  <div className="flex items-center gap-3 border-b border-[#FFB703]/20 pb-3">
                    <Sparkles className="w-5 h-5 text-[#FFB703]" />
                    <h3 className="font-display text-2xl sm:text-3xl text-[#FFB703] tracking-wide">
                      LIMITED TIME SPECIAL DEALS
                    </h3>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {filteredDeals.map((deal) => (
                    <SpecialDealCard
                      key={deal.id}
                      deal={deal}
                      menuItems={menuItems}
                      onAddToCart={handleDealAddToCart}
                      onClickDetails={onClickDealDetails}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Menu Items Grid */}
            {sortedItems.length > 0 && (
              <div className="space-y-6">
                {selectedCategory === 'ALL' && filteredDeals.length > 0 && (
                  <div className="flex items-center gap-3 border-b border-[#FFB703]/20 pb-3 pt-4">
                    <Flame className="w-5 h-5 text-[#FB8500]" />
                    <h3 className="font-display text-2xl sm:text-3xl text-[#FFFBEB] tracking-wide">
                      A LA CARTE & COMBOS
                    </h3>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
                  {sortedItems.map((item) => (
                    <FoodCard
                      key={item.id}
                      item={item}
                      isWishlisted={wishlistIds.includes(item.id)}
                      onAddToCart={onAddToCart}
                      onToggleWishlist={onToggleWishlist}
                      onClickDetails={onClickDetails}
                    />
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </section>
  );
};
