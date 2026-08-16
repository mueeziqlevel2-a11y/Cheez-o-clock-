import React from 'react';
import { motion } from 'motion/react';
import { Star, ShieldCheck, Flame, ArrowRight, MapPin, Phone, Zap, Clock } from 'lucide-react';
import heroPizzaImg from '../assets/images/regenerated_image_1786868429612.png';

interface HeroProps {
  onOrderNow: () => void;
  onExploreMenu: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOrderNow, onExploreMenu }) => {
  return (
    <section className="relative pt-8 sm:pt-12 pb-16 md:pt-14 md:pb-24 overflow-hidden bg-[#140202]">
      {/* Ambient Warm Orange/Red Glows */}
      <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-[#C8102E]/15 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-[600px] h-[600px] bg-[#FB8500]/20 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7 space-y-6 text-left"
          >
            {/* Rating, Opening Time & Melty Cheez Badges */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              {/* Stars badge */}
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#220505] border border-[#4A0E0E] text-[#FFB703] text-xs font-bold tracking-wide shadow-sm">
                <div className="flex text-[#FFB703]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-[#FFB703] text-[#FFB703]" />
                  ))}
                </div>
                <span>5.0 STARS RATED IN RAWALPINDI</span>
              </div>

              {/* Opening Time badge */}
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FFB703] text-black text-xs font-black tracking-wide shadow-sm">
                <Clock className="w-3.5 h-3.5 stroke-[3] text-black" />
                <span>OPENS 3:00 PM</span>
              </div>

              {/* Fresh melted cheez badge */}
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#3D0A0A] border border-[#6E1414] text-[#FFB703] text-xs font-bold shadow-sm">
                <Flame className="w-3.5 h-3.5 text-[#FFB703] fill-[#FFB703]" />
                <span>FRESH MELTED CHEEZ</span>
              </div>
            </div>

            {/* Main Headline */}
            <h1 className="font-display text-6xl sm:text-7xl lg:text-8xl xl:text-9xl text-white tracking-normal leading-[0.92] drop-shadow-md">
              CRAVINGS <br />
              <span className="text-[#FFB703]">
                START HERE.
              </span>
            </h1>

            {/* Supporting Text */}
            <p className="text-base sm:text-lg text-[#D6C7B9] max-w-xl font-normal leading-relaxed">
              Big flavors, cheesy cravings and delicious favorites — order from <strong className="text-[#FFB703] font-semibold">Cheez O'Clock</strong> and enjoy your food without the wait.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
              <button
                onClick={onOrderNow}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#FFB703] to-[#FB8500] hover:from-[#FB8500] hover:to-[#FFB703] text-black font-extrabold text-sm tracking-wider uppercase shadow-xl hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>ORDER NOW</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform stroke-[2.5]" />
              </button>

              <button
                onClick={onExploreMenu}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#220505] hover:bg-[#350A0A] text-white font-bold text-sm tracking-wider uppercase border border-[#4A0E0E] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                EXPLORE MENU
              </button>
            </div>

            {/* Bottom Highlights Strip */}
            <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-white/10 max-w-xl text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#220505] border border-[#4A0E0E] text-[#FFB703] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Cash on Delivery</h4>
                  <p className="text-[11px] text-[#A89898]">Pay at your doorstep</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#220505] border border-[#4A0E0E] text-[#FFB703] flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Dhamial Road</h4>
                  <p className="text-[11px] text-[#A89898]">Rawalpindi 46000</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#220505] border border-[#4A0E0E] text-[#FFB703] flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">0323-2444123</h4>
                  <p className="text-[11px] text-[#A89898]">Direct Hotline</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Hero Image Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="lg:col-span-5 relative"
          >
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Outer Warm Glow Frame */}
              <div className="relative rounded-[2.5rem] bg-[#1F0404] border-[3px] border-[#3D0A0A] overflow-hidden shadow-[0_0_80px_rgba(251,133,0,0.38)]">
                <img
                  src={heroPizzaImg}
                  alt="Cheez O'Clock Special Pizza"
                  className="w-full h-[390px] sm:h-[470px] object-cover transform hover:scale-105 transition-transform duration-500"
                />

                {/* Floating Special Badge */}
                <div className="absolute top-5 right-5 bg-[#180404]/90 backdrop-blur-md border border-[#4A0E0E] py-2 px-3.5 rounded-2xl shadow-xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#FFB703] text-black flex items-center justify-center">
                    <Flame className="w-4 h-4 fill-black text-black" />
                  </div>
                  <div>
                    <span className="text-[11px] text-[#A89898] font-medium block leading-tight">Top Seller</span>
                    <span className="text-xs font-bold text-[#FFB703] block leading-tight mt-0.5">Crown Crust Pizza</span>
                  </div>
                </div>

                {/* Floating Delivery Tag */}
                <div className="absolute bottom-5 left-5 bg-[#D90429] text-white py-2 px-4 rounded-xl font-black text-xs shadow-xl tracking-wider uppercase flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 fill-white text-white" />
                  <span>FAST RAWALPINDI DELIVERY</span>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
