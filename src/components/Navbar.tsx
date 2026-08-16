import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Heart, Clock, Menu, X, ShieldAlert, Phone, User, LogIn, LogOut, PackageCheck, ChevronDown, MapPin } from 'lucide-react';
import logoTransparent from '../assets/images/cheez_oclock_logo_transparent.png';
import { CustomerUser } from '../types';

interface NavbarProps {
  cartCount: number;
  wishlistCount: number;
  customerUser: CustomerUser | null;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenTracking: () => void;
  onOpenAuthModal: () => void;
  onOpenOrderHistory: () => void;
  onLogout: () => void;
  onOpenAdmin: () => void;
  onNavigateMenu: () => void;
  onNavigateHome: () => void;
  onNavigateContact: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  wishlistCount,
  customerUser,
  onOpenCart,
  onOpenWishlist,
  onOpenTracking,
  onOpenAuthModal,
  onOpenOrderHistory,
  onLogout,
  onOpenAdmin,
  onNavigateMenu,
  onNavigateHome,
  onNavigateContact
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      id="main-site-header"
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? 'bg-[#140202]/95 backdrop-blur-md shadow-2xl border-b border-[#FFB703]/20 py-0.5'
          : 'bg-[#140202] border-b border-[#2B0808] pb-1'
      }`}
    >
      {/* Top Strip */}
      <div className="w-full bg-[#D90429] h-1.5" />

      {/* Opening Hours Banner */}
      <div className="bg-[#FB8500] text-black py-1 px-4 text-center text-xs font-black tracking-wider uppercase flex items-center justify-center gap-2 shadow-sm">
        <Clock className="w-3.5 h-3.5 stroke-[3] text-black" />
        <span>OPENS AT 3:00 PM DAILY | FAST CASH ON DELIVERY RAWALPINDI</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between py-2 sm:py-2.5">
        {/* Far Left: Transparent Logo + Stacked CHEEZ O'CLOCK and RAWALPINDI */}
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-3 sm:gap-3.5 group text-left focus:outline-none cursor-pointer py-0.5 select-none shrink-0"
          id="header-brand-logo"
          aria-label="Cheez O'Clock Home"
        >
          <img
            src={logoTransparent}
            alt="Cheez O'Clock"
            className="h-12 sm:h-14 md:h-16 w-auto object-contain transition-transform duration-300 group-hover:scale-105 filter drop-shadow-[0_2px_8px_rgba(251,133,0,0.3)] shrink-0"
          />
          <div className="flex flex-col justify-center leading-none">
            <span className="font-display text-lg sm:text-xl md:text-2xl text-[#FFFBEB] font-black tracking-normal uppercase leading-none group-hover:text-[#FFB703] transition-colors drop-shadow-sm">
              CHEEZ O'CLOCK
            </span>
            <span className="text-[10px] sm:text-xs md:text-sm font-extrabold tracking-[0.2em] uppercase text-[#FFB703] leading-none mt-1 flex items-center gap-1 opacity-90">
              <MapPin className="w-3 h-3 text-[#D90429] inline fill-[#D90429] shrink-0" />
              RAWALPINDI
            </span>
          </div>
        </button>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-5 lg:gap-7 text-sm font-semibold">
          <button
            onClick={onNavigateHome}
            className="text-[#FFB703] hover:text-[#FFD166] transition-colors cursor-pointer whitespace-nowrap"
          >
            Home
          </button>
          <button
            onClick={onNavigateMenu}
            className="text-white hover:text-[#FFB703] transition-colors cursor-pointer whitespace-nowrap"
          >
            Menu
          </button>
          <button
            onClick={onOpenOrderHistory}
            className="text-white hover:text-[#FFB703] transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
          >
            <PackageCheck className="w-4 h-4 text-[#FFB703]" />
            <span>Order History</span>
          </button>
          <button
            onClick={onOpenTracking}
            className="text-white hover:text-[#FFB703] transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
          >
            <Clock className="w-4 h-4 text-[#FFB703]" />
            <span>Track Order</span>
          </button>
          <button
            onClick={onNavigateContact}
            className="text-white hover:text-[#FFB703] transition-colors cursor-pointer whitespace-nowrap"
          >
            Contact
          </button>
        </nav>

        {/* Right Section Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Customer Profile / Login Button */}
          {customerUser ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#220505] border border-[#4A0E0E] text-white hover:bg-[#350A0A] transition-all cursor-pointer shadow-sm"
              >
                <div className="w-6 h-6 rounded-md bg-[#FFB703] text-black font-black text-xs flex items-center justify-center uppercase">
                  {customerUser.name.charAt(0)}
                </div>
                <span className="hidden sm:inline text-xs font-bold text-white truncate max-w-[100px]">
                  {customerUser.name.split(' ')[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-white/70" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-[#180505] rounded-2xl border border-[#FFB703]/30 shadow-2xl p-2 z-50 text-xs space-y-1">
                  <div className="px-3 py-2 border-b border-white/10">
                    <p className="font-bold text-white truncate">{customerUser.name}</p>
                    <p className="text-[10px] text-gray-400 truncate">{customerUser.email}</p>
                  </div>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onOpenOrderHistory();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#220707] text-gray-200 hover:text-[#FFB703] flex items-center gap-2.5 font-semibold cursor-pointer"
                  >
                    <PackageCheck className="w-4 h-4 text-[#FFB703]" />
                    <span>My Order History</span>
                  </button>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onOpenWishlist();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#220707] text-gray-200 hover:text-[#FFB703] flex items-center gap-2.5 font-semibold cursor-pointer"
                  >
                    <Heart className="w-4 h-4 text-[#FFB703]" />
                    <span>My Wishlist ({wishlistCount})</span>
                  </button>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-red-950/60 text-red-300 hover:text-red-200 flex items-center gap-2.5 font-semibold cursor-pointer border-t border-white/5"
                  >
                    <LogOut className="w-4 h-4 text-red-400" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#220505] border border-[#4A0E0E] text-white hover:bg-[#350A0A] transition-all cursor-pointer shadow-sm"
            >
              <div className="w-6 h-6 rounded-md bg-[#FFB703] text-black font-black text-xs flex items-center justify-center uppercase">
                A
              </div>
              <span className="hidden sm:inline text-xs font-bold text-white">Ahmed</span>
              <ChevronDown className="w-3.5 h-3.5 text-white/70" />
            </button>
          )}

          {/* Wishlist Button */}
          <button
            onClick={onOpenWishlist}
            aria-label="Wishlist"
            className="relative p-2.5 rounded-xl bg-[#220505] border border-[#4A0E0E] text-[#FFB703] hover:bg-[#350A0A] transition-colors cursor-pointer"
          >
            <Heart className="w-4 h-4 text-[#FFB703]" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#DC2626] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Cart Button */}
          <button
            onClick={onOpenCart}
            aria-label="Shopping Cart"
            className="relative px-3.5 py-2 rounded-xl bg-[#220505] border border-[#4A0E0E] text-white hover:bg-[#350A0A] transition-colors flex items-center gap-2 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-[#FFB703]" />
            <span className="hidden sm:inline text-xs font-bold text-white">
              Cart
            </span>
            {cartCount > 0 && (
              <span className="bg-[#FFB703] text-black text-[10px] font-black px-1.5 py-0.5 rounded-full">
                {cartCount}
              </span>
            )}
          </button>

          {/* Primary Order Now Button */}
          <button
            onClick={onNavigateMenu}
            className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#FB8500] hover:bg-[#FFB703] text-black font-extrabold text-xs tracking-wider uppercase shadow-md active:scale-95 transition-all cursor-pointer"
          >
            ORDER NOW
          </button>

          {/* Host Portal Button */}
          <button
            onClick={onOpenAdmin}
            title="Host / Admin Portal"
            aria-label="Admin Portal"
            className="p-2.5 rounded-xl bg-[#220505] border border-[#4A0E0E] hover:bg-[#DC2626] text-[#FFB703] hover:text-white transition-colors cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4 text-[#FFB703]" />
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            className="p-2.5 rounded-xl bg-[#220505] border border-[#4A0E0E] text-[#FFB703] lg:hidden cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#180505] border-b border-[#FFB703]/20 px-4 pt-4 pb-6 space-y-3 mt-2 shadow-2xl animate-fadeIn">
          {customerUser ? (
            <div className="p-3 rounded-xl bg-[#1A0101] border border-[#FFB703]/30 flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-[#FFD166]">{customerUser.name}</p>
                <p className="text-xs text-gray-400">{customerUser.email}</p>
              </div>
              <button
                onClick={() => {
                  onLogout();
                  setMobileMenuOpen(false);
                }}
                className="text-xs font-bold text-red-400 hover:underline"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                onOpenAuthModal();
                setMobileMenuOpen(false);
              }}
              className="w-full py-3 rounded-xl bg-[#1A0101] border border-[#FFB703]/40 text-[#FFD166] font-bold text-xs uppercase flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4 text-[#FFB703]" />
              <span>Login or Create Account</span>
            </button>
          )}

          <button
            onClick={() => {
              onNavigateHome();
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2.5 text-base font-semibold text-[#FFFBEB] hover:text-[#FFB703] border-b border-white/5"
          >
            Home
          </button>
          <button
            onClick={() => {
              onNavigateMenu();
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2.5 text-base font-semibold text-[#FFFBEB] hover:text-[#FFB703] border-b border-white/5"
          >
            Menu
          </button>
          <button
            onClick={() => {
              onOpenOrderHistory();
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-2 w-full text-left py-2.5 text-base font-semibold text-[#FFFBEB] hover:text-[#FFB703] border-b border-white/5"
          >
            <PackageCheck className="w-4 h-4 text-[#FFB703]" />
            Order History
          </button>
          <button
            onClick={() => {
              onOpenTracking();
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-2 w-full text-left py-2.5 text-base font-semibold text-[#FFFBEB] hover:text-[#FFB703] border-b border-white/5"
          >
            <Clock className="w-4 h-4 text-[#FFB703]" />
            Track Order
          </button>
          <button
            onClick={() => {
              onNavigateContact();
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2.5 text-base font-semibold text-[#FFFBEB] hover:text-[#FFB703] border-b border-white/5"
          >
            Contact & Location
          </button>

          <a
            href="tel:03232444123"
            className="flex items-center justify-center gap-2 w-full py-3 mt-2 rounded-xl bg-[#C8102E] text-white font-bold text-sm"
          >
            <Phone className="w-4 h-4" /> Call 0323-2444123
          </a>

          <button
            onClick={() => {
              onNavigateMenu();
              setMobileMenuOpen(false);
            }}
            className="w-full py-3 rounded-xl bg-[#FFB703] text-[#3B0202] font-black text-sm tracking-wide uppercase text-center"
          >
            ORDER NOW
          </button>
        </div>
      )}
    </header>
  );
};

