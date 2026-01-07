
import React, { useState, useEffect } from 'react';
import { Cookie } from 'lucide-react';

const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already accepted
    const consent = localStorage.getItem('sumami_cookie_consent');
    
    if (!consent) {
      // Small delay for better UX (don't block the screen immediately)
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('sumami_cookie_consent', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-4 pointer-events-none">
      <div className="max-w-4xl mx-auto pointer-events-auto animate-in slide-in-from-bottom-4 duration-700">
        <div className="bg-gray-900/95 backdrop-blur-md text-white rounded-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.2)] p-4 md:p-5 flex flex-col md:flex-row items-center gap-4 md:gap-8 border border-white/10">
          
          <div className="flex items-start gap-4 flex-1">
            <div className="bg-gray-800 p-2.5 rounded-xl shrink-0 border border-gray-700">
              <Cookie className="w-6 h-6 text-amber-500" />
            </div>
            <div className="text-sm text-gray-300 leading-relaxed">
              <p>
                We use cookies to ensure you get the best experience and to track your VIP discounts. 
                By continuing to shop, you agree to our use of cookies.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={handleAccept}
              className="w-full md:w-auto whitespace-nowrap bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-amber-900/20 active:scale-95 hover:scale-105"
            >
              Yes, I Accept
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
