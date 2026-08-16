import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  Tag,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  ToggleLeft,
  ToggleRight,
  Percent,
  Layers,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { SpecialDeal, MenuItem } from '../../types';
import { isSpecialDealActive, getDealScheduleStatus } from '../../data/initialSpecialDeals';

interface SpecialDealsManagerProps {
  specialDeals: SpecialDeal[];
  menuItems: MenuItem[];
  onSaveDeal: (dealData: Partial<SpecialDeal> & { name: string; price: number }) => Promise<void>;
  onDeleteDeal: (dealId: string) => Promise<void>;
  onToggleActive: (deal: SpecialDeal) => Promise<void>;
  onShowToast: (type: 'success' | 'error' | 'info', text: string) => void;
}

const PRESET_DEAL_IMAGES = [
  { label: 'Pizza & Burger Feast', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800' },
  { label: 'Fried Chicken Platter', url: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=800' },
  { label: 'Cheezy Burger Combo', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800' },
  { label: 'Fries & Wings Bucket', url: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&q=80&w=800' },
  { label: 'Kunafa & Sweet Treats', url: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&q=80&w=800' },
  { label: 'Family Pizza Night', url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=800' },
];

export const SpecialDealsManager: React.FC<SpecialDealsManagerProps> = ({
  specialDeals,
  menuItems,
  onSaveDeal,
  onDeleteDeal,
  onToggleActive,
  onShowToast
}) => {
  const [dealFilter, setDealFilter] = useState<'ALL' | 'ACTIVE' | 'UPCOMING' | 'EXPIRED' | 'INACTIVE'>('ALL');
  const [dealSearch, setDealSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<SpecialDeal | null>(null);
  const [dealToDelete, setDealToDelete] = useState<SpecialDeal | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  // Form State
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState<number | ''>(1500);
  const [formOriginalPrice, setFormOriginalPrice] = useState<number | ''>(2000);
  const [formImage, setFormImage] = useState('');
  const [formIncludedProductIds, setFormIncludedProductIds] = useState<string[]>([]);
  const [formIncludedItemsSummary, setFormIncludedItemsSummary] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  // Helper to format ISO date to datetime-local input string
  const toDateTimeLocal = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    } catch {
      return '';
    }
  };

  const openCreateModal = () => {
    setEditingDeal(null);
    setFormName('');
    setFormDescription('');
    setFormPrice(1500);
    setFormOriginalPrice(2000);
    setFormImage(PRESET_DEAL_IMAGES[0].url);
    setFormIncludedProductIds([]);
    setFormIncludedItemsSummary('');
    const now = new Date();
    const nextMonth = new Date(now.getTime() + 30 * 86400000);
    setFormStartDate(toDateTimeLocal(now.toISOString()));
    setFormEndDate(toDateTimeLocal(nextMonth.toISOString()));
    setFormIsActive(true);
    setProductSearch('');
    setIsModalOpen(true);
  };

  const openEditModal = (deal: SpecialDeal) => {
    setEditingDeal(deal);
    setFormName(deal.name);
    setFormDescription(deal.description);
    setFormPrice(deal.price);
    setFormOriginalPrice(deal.originalPrice || '');
    setFormImage(deal.image);
    setFormIncludedProductIds(deal.includedProductIds || []);
    setFormIncludedItemsSummary(deal.includedItemsSummary || '');
    setFormStartDate(toDateTimeLocal(deal.startDate));
    setFormEndDate(toDateTimeLocal(deal.endDate));
    setFormIsActive(deal.isActive !== false);
    setProductSearch('');
    setIsModalOpen(true);
  };

  // Toggle included product in form
  const handleToggleProductInclusion = (productId: string) => {
    const isIncluded = formIncludedProductIds.includes(productId);
    let updatedIds: string[];
    if (isIncluded) {
      updatedIds = formIncludedProductIds.filter(id => id !== productId);
    } else {
      updatedIds = [...formIncludedProductIds, productId];
    }
    setFormIncludedProductIds(updatedIds);

    // Auto-update summary text with selected product names if empty or user wants auto-generation
    const selectedNames = updatedIds
      .map(id => menuItems.find(m => m.id === id)?.name)
      .filter(Boolean);
    if (selectedNames.length > 0) {
      setFormIncludedItemsSummary(selectedNames.join(' + '));
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      onShowToast('error', 'Deal name is required');
      return;
    }
    if (formPrice === '' || Number(formPrice) <= 0) {
      onShowToast('error', 'Please enter a valid deal price');
      return;
    }

    setIsSaving(true);
    try {
      await onSaveDeal({
        id: editingDeal?.id,
        name: formName.trim(),
        description: formDescription.trim(),
        price: Number(formPrice),
        originalPrice: formOriginalPrice !== '' ? Number(formOriginalPrice) : undefined,
        image: formImage.trim() || PRESET_DEAL_IMAGES[0].url,
        includedProductIds: formIncludedProductIds,
        includedItemsSummary: formIncludedItemsSummary.trim(),
        startDate: formStartDate ? new Date(formStartDate).toISOString() : new Date().toISOString(),
        endDate: formEndDate ? new Date(formEndDate).toISOString() : new Date(Date.now() + 30 * 86400000).toISOString(),
        isActive: formIsActive
      });

      setIsModalOpen(false);
      onShowToast('success', editingDeal ? 'Special deal updated!' : 'New special deal created!');
    } catch (err: any) {
      onShowToast('error', err.message || 'Failed to save special deal');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!dealToDelete) return;
    try {
      await onDeleteDeal(dealToDelete.id);
      onShowToast('success', `Special Deal "${dealToDelete.name}" was deleted.`);
      setDealToDelete(null);
    } catch (err: any) {
      onShowToast('error', err.message || 'Failed to delete deal');
    }
  };

  // Filtered Special Deals
  const filteredDeals = specialDeals.filter(deal => {
    const status = getDealScheduleStatus(deal);
    
    // Tab filtering
    if (dealFilter === 'ACTIVE' && status !== 'active') return false;
    if (dealFilter === 'UPCOMING' && status !== 'upcoming') return false;
    if (dealFilter === 'EXPIRED' && status !== 'expired') return false;
    if (dealFilter === 'INACTIVE' && status !== 'inactive') return false;

    // Search filtering
    if (dealSearch.trim()) {
      const q = dealSearch.toLowerCase();
      const matchName = deal.name.toLowerCase().includes(q);
      const matchDesc = deal.description.toLowerCase().includes(q);
      const matchSummary = deal.includedItemsSummary?.toLowerCase().includes(q);
      return matchName || matchDesc || matchSummary;
    }

    return true;
  });

  const activeCount = specialDeals.filter(d => getDealScheduleStatus(d) === 'active').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#2C0202] p-6 rounded-3xl border border-[#FFB703]/30 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#FFB703]" />
            <h2 className="font-display text-3xl text-white">SPECIAL DEALS & PROMOTIONS</h2>
          </div>
          <p className="text-xs text-gray-300 mt-1">
            Create, schedule, edit, and manage limited-time combo packages and discounted deals.
          </p>
        </div>

        <button
          id="btn-create-special-deal"
          onClick={openCreateModal}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#FFB703] to-[#FB8500] hover:brightness-110 text-[#3B0202] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-98 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>CREATE NEW SPECIAL DEAL</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1A0101] p-4 rounded-2xl border border-white/10">
        
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {(['ALL', 'ACTIVE', 'UPCOMING', 'EXPIRED', 'INACTIVE'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setDealFilter(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                dealFilter === tab
                  ? 'bg-[#FFB703] text-[#3B0202] shadow-md'
                  : 'bg-[#2C0202] text-gray-400 hover:text-white border border-white/5'
              }`}
            >
              {tab === 'ALL' && `All Deals (${specialDeals.length})`}
              {tab === 'ACTIVE' && `Live Active (${activeCount})`}
              {tab === 'UPCOMING' && 'Upcoming'}
              {tab === 'EXPIRED' && 'Expired'}
              {tab === 'INACTIVE' && 'Inactive'}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            value={dealSearch}
            onChange={(e) => setDealSearch(e.target.value)}
            placeholder="Search deals or items..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#2C0202] border border-white/10 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#FFB703]"
          />
        </div>
      </div>

      {/* Deals Grid */}
      {filteredDeals.length === 0 ? (
        <div className="text-center py-16 bg-[#2C0202] rounded-3xl border border-white/10 space-y-3">
          <Sparkles className="w-10 h-10 mx-auto text-gray-500" />
          <h3 className="font-bold text-lg text-white">No special deals found</h3>
          <p className="text-xs text-gray-400">
            {dealSearch ? `No deals match your search "${dealSearch}".` : 'No deals in this category.'}
          </p>
          <button
            onClick={openCreateModal}
            className="mt-2 px-5 py-2 rounded-xl bg-[#FFB703] text-[#3B0202] font-black text-xs uppercase cursor-pointer"
          >
            Create Your First Deal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDeals.map((deal) => {
            const status = getDealScheduleStatus(deal);
            const savings = deal.originalPrice && deal.originalPrice > deal.price
              ? deal.originalPrice - deal.price
              : 0;
            const discountPct = deal.originalPrice && deal.originalPrice > deal.price
              ? Math.round(((deal.originalPrice - deal.price) / deal.originalPrice) * 100)
              : 0;

            const includedNames = deal.includedProductIds
              ? deal.includedProductIds
                  .map(id => menuItems.find(m => m.id === id)?.name)
                  .filter(Boolean)
              : [];

            return (
              <div
                key={deal.id}
                className="bg-[#2C0202] rounded-3xl border border-white/10 hover:border-[#FFB703]/40 overflow-hidden flex flex-col justify-between shadow-xl transition-all"
              >
                {/* Image Header */}
                <div className="relative h-44 w-full bg-[#1A0101] overflow-hidden">
                  <img
                    src={deal.image}
                    alt={deal.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#2C0202] via-transparent to-black/40" />

                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    {status === 'active' && (
                      <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-lg">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        LIVE ON STORE
                      </span>
                    )}
                    {status === 'upcoming' && (
                      <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-lg">
                        <Clock className="w-3 h-3" />
                        SCHEDULED (UPCOMING)
                      </span>
                    )}
                    {status === 'expired' && (
                      <span className="px-3 py-1 rounded-full bg-red-950 text-red-300 border border-red-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-lg">
                        <AlertCircle className="w-3 h-3" />
                        EXPIRED
                      </span>
                    )}
                    {status === 'inactive' && (
                      <span className="px-3 py-1 rounded-full bg-gray-800 text-gray-300 text-[10px] font-black uppercase tracking-wider shadow-lg">
                        INACTIVE / PAUSED
                      </span>
                    )}
                  </div>

                  {/* Discount Badge */}
                  {discountPct > 0 && (
                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-1 rounded-full bg-[#D90429] text-white text-[11px] font-black uppercase shadow-lg">
                        -{discountPct}% OFF
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-display text-xl text-white">{deal.name}</h3>
                    <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">
                      {deal.description}
                    </p>

                    {/* Included Products */}
                    {(deal.includedItemsSummary || includedNames.length > 0) && (
                      <div className="pt-2">
                        <span className="text-[10px] font-bold text-[#FFB703] uppercase block mb-1">
                          Included Products:
                        </span>
                        {includedNames.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {includedNames.map((n, i) => (
                              <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-[#1A0101] text-gray-300 border border-white/5">
                                {n}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-gray-300 bg-[#1A0101] p-1.5 rounded-lg border border-white/5">
                            {deal.includedItemsSummary}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Schedule Date Details */}
                    <div className="pt-2 text-[10px] text-gray-400 space-y-0.5 border-t border-white/5">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-[#FFB703]" />
                        <span>
                          {new Date(deal.startDate).toLocaleDateString()} — {new Date(deal.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Price & Action Row */}
                  <div className="pt-3 border-t border-white/10 space-y-3">
                    <div className="flex items-baseline justify-between">
                      <div>
                        {deal.originalPrice && deal.originalPrice > deal.price && (
                          <span className="text-xs text-gray-400 line-through mr-2">
                            Rs. {deal.originalPrice.toLocaleString()}
                          </span>
                        )}
                        <span className="font-display text-2xl text-[#FFD166]">
                          Rs. {deal.price.toLocaleString()}
                        </span>
                      </div>

                      {savings > 0 && (
                        <span className="text-[10px] font-bold text-emerald-400">
                          Save Rs. {savings.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <button
                        onClick={() => onToggleActive(deal)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                          deal.isActive
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                            : 'bg-gray-800 text-gray-400'
                        }`}
                      >
                        {deal.isActive ? 'Active' : 'Paused'}
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(deal)}
                          className="p-2 rounded-xl bg-[#1A0101] text-gray-300 hover:text-[#FFB703] border border-white/10 cursor-pointer"
                          title="Edit Deal"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setDealToDelete(deal)}
                          className="p-2 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-500/30 cursor-pointer"
                          title="Delete Deal"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT SPECIAL DEAL MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#2C0202] rounded-3xl border border-[#FFB703]/40 p-6 sm:p-8 space-y-6 shadow-2xl my-8 text-[#FFFBEB]">
            
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-[#FFB703]" />
                <h3 className="font-display text-2xl text-white">
                  {editingDeal ? 'EDIT SPECIAL DEAL' : 'CREATE NEW SPECIAL DEAL'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl bg-[#1A0101] text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              
              {/* Deal Name */}
              <div>
                <label className="block font-bold text-gray-300 mb-1">
                  Deal Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Cheezy Mega Feast Deal"
                  className="w-full px-4 py-3 rounded-xl bg-[#1A0101] border border-white/20 text-white focus:outline-none focus:border-[#FFB703] text-sm font-semibold"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-gray-300 mb-1">
                  Description / Catchphrase
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="e.g. 1 Large Cheezy Pizza, 2 Zinger Burgers, Large Fries, and 1.5L Drink at an unbelievable price!"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#1A0101] border border-white/20 text-white resize-none focus:outline-none focus:border-[#FFB703]"
                />
              </div>

              {/* Pricing Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#FFB703] mb-1">
                    Special Deal Price in PKR <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="1500"
                    className="w-full px-4 py-3 rounded-xl bg-[#1A0101] border border-[#FFB703]/40 text-[#FFD166] text-base font-black focus:outline-none focus:border-[#FFB703]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-300 mb-1">
                    Original Price in PKR (Optional Strikethrough)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formOriginalPrice}
                    onChange={(e) => setFormOriginalPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="2000"
                    className="w-full px-4 py-3 rounded-xl bg-[#1A0101] border border-white/20 text-gray-300 text-sm focus:outline-none focus:border-[#FFB703]"
                  />
                  {formOriginalPrice && formPrice && Number(formOriginalPrice) > Number(formPrice) && (
                    <p className="text-[11px] text-emerald-400 font-bold mt-1">
                      Save Rs. {(Number(formOriginalPrice) - Number(formPrice)).toLocaleString()} (
                      {Math.round(((Number(formOriginalPrice) - Number(formPrice)) / Number(formOriginalPrice)) * 100)}% Discount)
                    </p>
                  )}
                </div>
              </div>

              {/* Schedule Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-300 mb-1">
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#1A0101] border border-white/20 text-white focus:outline-none focus:border-[#FFB703]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-300 mb-1">
                    End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#1A0101] border border-white/20 text-white focus:outline-none focus:border-[#FFB703]"
                  />
                </div>
              </div>

              {/* Deal Image with Quick Presets */}
              <div>
                <label className="block font-bold text-gray-300 mb-1">Image URL</label>
                <input
                  type="url"
                  required
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#1A0101] border border-white/20 text-white focus:outline-none focus:border-[#FFB703]"
                />
                
                {/* Preset Chips */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-gray-400 font-bold uppercase mr-1">Presets:</span>
                  {PRESET_DEAL_IMAGES.map((preset, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setFormImage(preset.url)}
                      className="px-2 py-0.5 rounded-lg bg-[#1A0101] hover:bg-[#FFB703]/20 border border-white/10 text-[10px] text-gray-300 hover:text-[#FFB703] cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reference Existing Products */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#FFB703] text-xs uppercase flex items-center gap-1.5">
                    <Layers className="w-4 h-4" />
                    <span>Select Products Included In Deal ({formIncludedProductIds.length} Selected)</span>
                  </label>
                  
                  <span className="text-[11px] text-gray-400">
                    References products without duplication
                  </span>
                </div>

                {/* Product Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search menu products to attach..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#1A0101] border border-white/10 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#FFB703]"
                  />
                </div>

                {/* Products Picker Box */}
                <div className="max-h-36 overflow-y-auto p-2 rounded-xl bg-[#1A0101] border border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {menuItems
                    .filter(m => {
                      if (!productSearch.trim()) return true;
                      return m.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                             m.category.toLowerCase().includes(productSearch.toLowerCase());
                    })
                    .map(m => {
                      const isSelected = formIncludedProductIds.includes(m.id);
                      return (
                        <div
                          key={m.id}
                          onClick={() => handleToggleProductInclusion(m.id)}
                          className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-[#FFB703]/20 border-[#FFB703] text-white'
                              : 'bg-[#2C0202] border-white/5 text-gray-300 hover:border-white/20'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <span className="font-bold text-xs block truncate">{m.name}</span>
                            <span className="text-[10px] text-gray-400">{m.category} • Rs. {m.price}</span>
                          </div>
                          <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${isSelected ? 'bg-[#FFB703] text-[#3B0202]' : 'border border-white/30'}`}>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Included Items Summary Text */}
              <div>
                <label className="block font-bold text-gray-300 mb-1">
                  Custom Included Items Summary (Displayed on customer deal card)
                </label>
                <input
                  type="text"
                  value={formIncludedItemsSummary}
                  onChange={(e) => setFormIncludedItemsSummary(e.target.value)}
                  placeholder="e.g. 1 Large Pizza + 2 Zinger Burgers + 1.5L Beverage"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#1A0101] border border-white/20 text-white focus:outline-none focus:border-[#FFB703]"
                />
              </div>

              {/* Active Toggle Switch */}
              <div className="pt-2 flex items-center justify-between p-3 rounded-xl bg-[#1A0101] border border-white/10">
                <div>
                  <span className="font-bold text-white text-xs block">Enable / Activate Deal</span>
                  <span className="text-[11px] text-gray-400">When active and within schedule, it will appear on customer website</span>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 rounded-xl bg-[#1A0101] hover:bg-[#220707] text-gray-300 font-bold text-xs uppercase cursor-pointer"
                >
                  CANCEL
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-8 py-3 rounded-xl bg-[#FFB703] text-[#3B0202] font-black text-xs uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-98 transition-all cursor-pointer"
                >
                  {isSaving ? 'SAVING...' : editingDeal ? 'UPDATE SPECIAL DEAL' : 'CREATE SPECIAL DEAL'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* DELETE DEAL CONFIRMATION MODAL */}
      {dealToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-[#2C0202] rounded-3xl border border-red-500/50 p-6 sm:p-8 space-y-6 shadow-2xl text-[#FFFBEB]">
            
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-red-950 border border-red-500/40 flex items-center justify-center mx-auto text-red-400">
                <Trash2 className="w-6 h-6" />
              </div>

              <h3 className="font-display text-2xl text-white">
                DELETE SPECIAL DEAL?
              </h3>

              <div className="p-4 rounded-2xl bg-[#1A0101] border border-white/10 text-left space-y-2 text-xs">
                <p className="font-bold text-[#FFD166] text-sm">
                  "{dealToDelete.name}"
                </p>
                <p className="text-gray-300 leading-relaxed">
                  Are you sure you want to delete this special deal?
                </p>
                <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                  <span>
                    <strong>Safe Operation:</strong> Deleting this special promotion will <strong>NOT</strong> delete the individual food products included in the deal.
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDealToDelete(null)}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#1A0101] hover:bg-[#220707] text-gray-300 font-bold text-xs uppercase cursor-pointer"
              >
                CANCEL
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider shadow-lg cursor-pointer transition-all"
              >
                YES, DELETE DEAL
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
