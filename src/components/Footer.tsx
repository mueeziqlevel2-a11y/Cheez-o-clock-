import React from 'react';
import { Clock, Star, MapPin, Phone, Shield, MessageCircle } from 'lucide-react';
import logoTransparent from '../assets/images/cheez_oclock_logo_transparent.png';

interface FooterProps {
  onNavigateHome: () => void;
  onNavigateMenu: () => void;
  onOpenWishlist: () => void;
  onOpenTracking: () => void;
  onNavigateContact: () => void;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigateHome,
  onNavigateMenu,
  onOpenWishlist,
  onOpenTracking,
  onNavigateContact,
  onOpenAdmin
}) => {
  return (
    <footer className="bg-[#1A0101] text-[#FFFBEB] border-t border-[#FFB703]/20 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 pb-12 border-b border-white/10">
          
          {/* Brand Info */}
          <div className="lg:col-span-5 space-y-4">
            <button
              onClick={onNavigateHome}
              className="flex items-center text-left focus:outline-none cursor-pointer group"
            >
              <img
                src={logoTransparent}
                alt="Cheez O'Clock - It's Always Cheez O'Clock"
                className="h-24 sm:h-28 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </button>

            <p className="font-bold text-lg text-[#FFB703] tracking-wide">
              CRAVINGS START HERE.
            </p>

            <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
              Serving the richest, cheesiest burgers, pizzas, wraps, fries & pastas in Rawalpindi. Order online for fast Cash on Delivery!
            </p>

            <div className="flex items-center gap-2 pt-2">
              <div className="flex text-[#FFB703]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <span className="text-xs font-bold text-white">5 STARS RATED</span>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="font-bold text-sm text-[#FFB703] uppercase tracking-wider">
              Quick Navigation
            </h3>
            <ul className="space-y-2 text-xs text-gray-300 font-medium">
              <li>
                <button onClick={onNavigateHome} className="hover:text-[#FFB703] transition-colors cursor-pointer">
                  Home
                </button>
              </li>
              <li>
                <button onClick={onNavigateMenu} className="hover:text-[#FFB703] transition-colors cursor-pointer">
                  Menu
                </button>
              </li>
              <li>
                <button onClick={onOpenWishlist} className="hover:text-[#FFB703] transition-colors cursor-pointer">
                  Wishlist
                </button>
              </li>
              <li>
                <button onClick={onOpenTracking} className="hover:text-[#FFB703] transition-colors cursor-pointer">
                  Track Order
                </button>
              </li>
              <li>
                <button onClick={onNavigateContact} className="hover:text-[#FFB703] transition-colors cursor-pointer">
                  Contact Us
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="font-bold text-sm text-[#FFB703] uppercase tracking-wider">
              Rawalpindi Location
            </h3>
            
            <div className="space-y-2.5 text-xs text-gray-300">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#FFB703] shrink-0" />
                <span className="font-bold text-[#FFD166]">Opens Daily at 3:00 PM (3:00 PM - 3:00 AM)</span>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#FFB703] shrink-0 mt-0.5" />
                <span>Dhamial Road, opposite to Main Harley Road, Rawalpindi, 46000, Pakistan</span>
              </div>

              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#FFB703] shrink-0" />
                <a href="tel:03232444123" className="hover:text-[#FFB703] font-bold text-white transition-colors">
                  0323-2444123
                </a>
              </div>

              <div className="flex items-center gap-2.5">
                <MessageCircle className="w-4 h-4 text-[#25D366] shrink-0" />
                <a
                  href="https://wa.me/923232444123?text=Hi%20Cheez%20O'Clock,%20I%20would%20like%20to%20place%20an%20order!"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#25D366] font-bold text-[#25D366] transition-colors flex items-center gap-1.5"
                >
                  <span>Chat on WhatsApp (0323-2444123)</span>
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom copyright & Admin portal link */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© 2026 Cheez O'Clock. All rights reserved.</p>

          <button
            onClick={onOpenAdmin}
            className="flex items-center gap-1.5 text-gray-400 hover:text-[#FFB703] transition-colors cursor-pointer font-semibold"
          >
            <Shield className="w-3.5 h-3.5 text-[#FFB703]" />
            <span>Host / Admin Portal</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
