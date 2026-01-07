
import React from 'react';
import { MessageCircle } from 'lucide-react';

const WhatsAppButton: React.FC = () => {
  const phoneNumber = '27662434867';
  const message = encodeURIComponent('Hi Sumami Team! 👋 I have a question about your sauces.');
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 left-6 z-40 flex items-center justify-center w-14 h-14 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-full shadow-[0_4px_20px_rgba(37,211,102,0.4)] transition-all duration-300 hover:scale-110 hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-[#25D366]/50 group print:hidden"
      aria-label="Chat on WhatsApp"
    >
      {/* Ripple Animation */}
      <span className="absolute inset-0 rounded-full animate-ping bg-[#25D366] opacity-20 duration-2000"></span>
      
      {/* Icon */}
      <MessageCircle className="w-7 h-7 relative z-10 fill-current" />
      
      {/* Tooltip (Visible on Hover) - Positioned to the RIGHT of the button now */}
      <span className="absolute left-full ml-4 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Chat with Support
        {/* Arrow pointing LEFT towards the button */}
        <span className="absolute top-1/2 -left-1 -mt-1 border-4 border-transparent border-r-gray-900"></span>
      </span>
    </a>
  );
};

export default WhatsAppButton;
