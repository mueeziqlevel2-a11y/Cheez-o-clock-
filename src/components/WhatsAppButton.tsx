import React from 'react';
import { MessageCircle } from 'lucide-react';

interface WhatsAppButtonProps {
  phoneNumber?: string;
  defaultMessage?: string;
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  phoneNumber = '923232444123',
  defaultMessage = "Hi Cheez O'Clock! I would like to ask a question / place an order."
}) => {
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(defaultMessage)}`;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex items-center group">
      {/* Tooltip on hover for desktop */}
      <div className="hidden sm:flex items-center mr-3 px-3 py-1.5 rounded-xl bg-[#1A0101]/95 text-white border border-[#25D366]/40 shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none transform translate-x-2 group-hover:translate-x-0">
        <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse mr-2" />
        <div className="text-xs">
          <p className="font-bold text-[#25D366]">Chat on WhatsApp</p>
          <p className="text-[10px] text-gray-300">0323-2444123</p>
        </div>
      </div>

      {/* Floating Action Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        id="whatsapp-floating-btn"
        aria-label="Chat with Cheez O'Clock on WhatsApp"
        className="relative flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-2xl shadow-[#25D366]/40 border-2 border-white/20 transform hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
      >
        {/* Radar Pulse Effect */}
        <span className="absolute -inset-1 rounded-full bg-[#25D366]/30 animate-ping opacity-75 pointer-events-none" />
        
        {/* Custom SVG / Lucide WhatsApp icon */}
        <MessageCircle className="w-7 h-7 stroke-[2.5] relative z-10 fill-white/20" />

        {/* Small Online Badge */}
        <span className="absolute top-0 right-0 w-4 h-4 bg-[#FFB703] border-2 border-[#1A0101] rounded-full shadow-sm" />
      </a>
    </div>
  );
};
