import type { SyntheticEvent } from 'react';

export const DEFAULT_FOOD_IMAGE = 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&q=80&w=800';

export const CATEGORY_FALLBACKS: Record<string, string> = {
  'Fries & Sides': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&q=80&w=800',
  'Fried Chicken': 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&q=80&w=800',
  'Burgers': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800',
  'Special Crust Pizza': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800',
  'Traditional Pizza': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=800',
  'Sandwiches': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=800',
  'Shawarma & Wraps': 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&q=80&w=800',
  'Cheezy Pasta': 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&q=80&w=800',
  'Starters': 'https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&q=80&w=800',
  'Special Deals': 'https://images.unsplash.com/photo-1610614819513-58e34989848b?auto=format&fit=crop&q=80&w=800',
  'Desserts': 'https://images.unsplash.com/photo-1579372786545-d24232daf58c?auto=format&fit=crop&q=80&w=800',
  'Beverages': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=800',
};

export function getSafeFoodImage(imageSrc?: string, category?: string, name?: string): string {
  if (imageSrc && imageSrc.trim() && !imageSrc.includes('broken') && !imageSrc.includes('undefined')) {
    return imageSrc;
  }
  if (name) {
    const lower = name.toLowerCase();
    if (lower.includes('fries') || lower.includes('potato')) {
      return CATEGORY_FALLBACKS['Fries & Sides'];
    }
    if (lower.includes('chicken') || lower.includes('wings') || lower.includes('nugget') || lower.includes('strip')) {
      return CATEGORY_FALLBACKS['Fried Chicken'];
    }
    if (lower.includes('burger') || lower.includes('patty') || lower.includes('zinger')) {
      return CATEGORY_FALLBACKS['Burgers'];
    }
    if (lower.includes('pizza')) {
      return CATEGORY_FALLBACKS['Traditional Pizza'];
    }
  }
  if (category && CATEGORY_FALLBACKS[category]) {
    return CATEGORY_FALLBACKS[category];
  }
  return DEFAULT_FOOD_IMAGE;
}

export function handleImageError(e: SyntheticEvent<HTMLImageElement, Event>, category?: string, name?: string) {
  const target = e.currentTarget;
  const fallback = getSafeFoodImage('', category, name);
  if (target.src !== fallback) {
    target.src = fallback;
  }
}
