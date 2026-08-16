import { SpecialDeal } from '../types';

export const initialSpecialDeals: SpecialDeal[] = [
  {
    id: 'deal-azadi-mega',
    name: 'Azadi Mega Feast',
    description: '1 Large Crown Crust Pizza + 2 Crispy Zinger Burgers + 1 Regular Fries + 1.5L Chilled Soft Drink.',
    price: 2199,
    originalPrice: 2840,
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800',
    includedProductIds: ['pz-1', 'bg-2', 'fr-1', 'bv-3'],
    includedItemsSummary: '1x Large Crown Crust Pizza, 2x Zinger Burgers, 1x Large Fries, 1x 1.5L Soft Drink',
    startDate: '2026-08-01T00:00',
    endDate: '2026-10-31T23:59',
    isActive: true,
    createdAt: '2026-08-16T12:00:00.000Z',
    updatedAt: '2026-08-16T12:00:00.000Z'
  },
  {
    id: 'deal-cheezy-duo',
    name: 'Cheezy Duo Combo',
    description: '2 Medium Cheezy Pizzas (Any Flavors) + 1 Cheesy Sticks (4 Pcs) + 2 Mint Margaritas.',
    price: 2450,
    originalPrice: 3060,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=800',
    includedProductIds: ['pz-2', 'pz-4', 'st-7', 'jc-4'],
    includedItemsSummary: '2x Medium Pizzas, 1x Cheesy Sticks, 2x Mint Margaritas',
    startDate: '2026-08-01T00:00',
    endDate: '2026-10-31T23:59',
    isActive: true,
    createdAt: '2026-08-16T12:00:00.000Z',
    updatedAt: '2026-08-16T12:00:00.000Z'
  },
  {
    id: 'deal-fried-chicken-bucket',
    name: 'Albaik Fried Chicken Bucket',
    description: '6 Pcs Albaik Style Fried Chicken + 1 Loaded Fries + 1.5L Chilled Soft Drink + Garlic Dips.',
    price: 2250,
    originalPrice: 2850,
    image: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&q=80&w=800',
    includedProductIds: ['fc-8', 'fr-4', 'bv-3'],
    includedItemsSummary: '6x Albaik Fried Chicken, 1x Loaded Fries, 1x 1.5L Soft Drink, Garlic Dips',
    startDate: '2026-08-01T00:00',
    endDate: '2026-10-31T23:59',
    isActive: true,
    createdAt: '2026-08-16T12:00:00.000Z',
    updatedAt: '2026-08-16T12:00:00.000Z'
  }
];

export function isSpecialDealActive(deal: SpecialDeal): boolean {
  if (!deal.isActive) return false;
  const now = new Date();
  if (deal.startDate) {
    const start = new Date(deal.startDate);
    if (!isNaN(start.getTime()) && now < start) return false;
  }
  if (deal.endDate) {
    const end = new Date(deal.endDate);
    if (!isNaN(end.getTime()) && now > end) return false;
  }
  return true;
}

export function getDealScheduleStatus(deal: SpecialDeal): 'active' | 'upcoming' | 'expired' | 'inactive' {
  if (!deal.isActive) return 'inactive';
  const now = new Date();
  if (deal.startDate) {
    const start = new Date(deal.startDate);
    if (!isNaN(start.getTime()) && now < start) return 'upcoming';
  }
  if (deal.endDate) {
    const end = new Date(deal.endDate);
    if (!isNaN(end.getTime()) && now > end) return 'expired';
  }
  return 'active';
}
