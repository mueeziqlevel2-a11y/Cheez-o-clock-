import React from 'react';
import { MapPin, Phone, ExternalLink, Clock, Star, MessageCircle } from 'lucide-react';

export const LocationContactSection: React.FC = () => {
  const googleMapsUrl = "https://www.google.com/maps/place/Cheez+O'Clock/@33.5755568,73.0402078,17z/data=!4m15!1m8!3m7!1s0x38df93c5e4cd3361:0xfc3b7af6f553a708!2sCheez+O'Clock!8m2!3d33.5755742!4d33.0401444!10e9!16s%2Fg%2F11z7cwll93!3m5!1s0x38df93c5e4cd3361:0xfc3b7af6f553a708!8m2!3d33.5755742!4d73.0401444!16s1!5m1!1e1";

  return (
    <section id="contact-section" className="py-20 bg-[#180505] text-[#FFFBEB] relative overflow-hidden border-t border-[#FFB703]/20 scroll-mt-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">
        
        {/* Section Header */}
        <div className="text-center space-y-3">
          <span className="text-xs font-black text-[#FFB703] uppercase tracking-widest px-3.5 py-1 rounded-full bg-[#FFB703]/10 border border-[#FFB703]/30 inline-block">
            VISIT & CALL US
          </span>
          <h2 className="font-display text-4xl sm:text-6xl text-[#FFFBEB] tracking-wide">
            FIND CHEEZ O'CLOCK
          </h2>
          <p className="text-sm text-gray-300 max-w-xl mx-auto">
            Located right in Rawalpindi. Stop by or order online for fast doorstep delivery.
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Info Card */}
          <div className="lg:col-span-5 bg-[#220707] p-8 rounded-3xl border border-[#FFB703]/30 shadow-2xl flex flex-col justify-between space-y-8">
            <div className="space-y-6">
              
              {/* Opening Hours */}
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-[#FFB703] text-[#150404] shrink-0 mt-1">
                  <Clock className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-bold text-xs uppercase text-[#FFB703] tracking-wider">
                    TIMINGS & OPENING HOURS
                  </h3>
                  <p className="font-black text-xl text-white mt-1 leading-snug">
                    Opens Daily at 3:00 PM
                  </p>
                  <p className="text-xs text-[#FFD166] mt-0.5 font-semibold">3:00 PM – 3:00 AM (Daily Service)</p>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-[#150404] border border-[#FFB703]/30 text-[#FFB703] shrink-0 mt-1">
                  <MapPin className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-bold text-xs uppercase text-[#FFB703] tracking-wider">
                    RESTAURANT ADDRESS
                  </h3>
                  <p className="font-semibold text-base text-white mt-1 leading-snug">
                    Dhamial Road, opposite to Main Harley Road, Rawalpindi, 46000, Pakistan
                  </p>
                </div>
              </div>

              {/* Phone & WhatsApp */}
              <div className="space-y-3">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-[#C8102E] text-white shrink-0 mt-1">
                    <Phone className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs uppercase text-[#FFD166] tracking-wider">
                      HOTLINE PHONE NUMBER
                    </h3>
                    <a
                      href="tel:03232444123"
                      className="font-display text-3xl text-white hover:text-[#FFB703] transition-colors mt-0.5 block tracking-wide"
                    >
                      0323-2444123
                    </a>
                    <p className="text-xs text-gray-400 mt-0.5">Click to call directly on mobile</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-[#25D366] text-white shrink-0 mt-1 shadow-lg shadow-[#25D366]/20">
                    <MessageCircle className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs uppercase text-[#25D366] tracking-wider">
                      WHATSAPP ORDER & INQUIRY
                    </h3>
                    <a
                      href="https://wa.me/923232444123?text=Hi%20Cheez%20O'Clock,%20I%20would%20like%20to%20place%20an%20order!"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-lg text-white hover:text-[#25D366] transition-colors mt-0.5 block tracking-wide"
                    >
                      0323-2444123 (Chat on WhatsApp)
                    </a>
                    <p className="text-xs text-gray-400 mt-0.5">Click to redirect to WhatsApp chat instantly</p>
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-start gap-4 pt-2 border-t border-white/10">
                <div className="p-3 rounded-2xl bg-[#FFB703]/10 text-[#FFB703] shrink-0">
                  <Star className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <h3 className="font-bold text-xs uppercase text-[#FFB703] tracking-wider">
                    GOOGLE RATING
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex text-[#FFB703]">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <span className="font-bold text-sm text-white">5.0 Stars</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Get Directions Button */}
            <div className="pt-4 border-t border-white/10">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#FFB703] to-[#FB8500] text-[#3B0202] font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl hover:brightness-110 transition-all text-center"
              >
                <span>GET DIRECTIONS ON GOOGLE MAPS</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Embedded Google Maps Box */}
          <div className="lg:col-span-7 bg-[#1A0101] rounded-3xl border border-[#FFB703]/30 overflow-hidden shadow-2xl h-[380px] lg:h-auto relative">
            <iframe
              title="Cheez O'Clock Location Rawalpindi"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3323.758416871589!2d73.0375631!3d33.5755742!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x38df93c5e4cd3361%3A0xfc3b7af6f553a708!2sCheez%20O'Clock!5e0!3m2!1sen!2spk!4v1700000000000!5m2!1sen!2spk"
              className="w-full h-full border-0 filter saturate-120 opacity-90 hover:opacity-100 transition-opacity"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            
            <div className="absolute bottom-4 left-4 bg-[#2C0202]/90 backdrop-blur-md px-4 py-2 rounded-xl border border-[#FFB703]/30 text-xs font-bold text-white flex items-center gap-2 shadow-lg">
              <Clock className="w-4 h-4 text-[#FFB703]" />
              <span>Dhamial Road, Rawalpindi</span>
            </div>
          </div>

        </div>

        {/* Got a Craving Callout */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-[#C8102E] via-[#3B0202] to-[#2C0202] border border-[#FFB703]/40 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="font-display text-3xl text-white tracking-wide">
              GOT A CRAVING?
            </h3>
            <p className="text-xs sm:text-sm text-gray-200">
              Have a question about your order? Get in touch with Cheez O'Clock.
            </p>
          </div>

          <a
            href="tel:03232444123"
            className="px-8 py-3.5 rounded-xl bg-[#FFB703] text-[#3B0202] font-black text-sm uppercase tracking-wider flex items-center gap-2 hover:brightness-110 shrink-0 shadow-lg"
          >
            <Phone className="w-4 h-4" />
            <span>0323-2444123</span>
          </a>
        </div>

      </div>
    </section>
  );
};
