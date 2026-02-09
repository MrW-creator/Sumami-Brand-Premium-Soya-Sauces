import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import NewsletterSignup from './NewsletterSignup';

interface NewsletterPopupProps {
  onClose: () => void;
}

export default function NewsletterPopup({ onClose }: NewsletterPopupProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fade in animation
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for fade out animation
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Popup Modal */}
      <div
        className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg mx-4 transition-all duration-300 ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header with close button */}
          <div className="relative p-8 bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <h2 className="text-3xl font-black mb-2">Wait! Don't Go Empty-Handed 🎁</h2>
              <p className="text-amber-100 text-lg">
                Get your FREE cookbook with 25+ delicious recipes
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                  <span className="text-green-600 font-bold text-sm">✓</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Instant Access to Premium Recipes</h3>
                  <p className="text-sm text-gray-600">25+ chef-tested recipes featuring our sauces</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                  <span className="text-green-600 font-bold text-sm">✓</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Exclusive Discounts & Offers</h3>
                  <p className="text-sm text-gray-600">Subscriber-only deals delivered to your inbox</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                  <span className="text-green-600 font-bold text-sm">✓</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Weekly Cooking Tips</h3>
                  <p className="text-sm text-gray-600">Expert tips to elevate your cooking game</p>
                </div>
              </div>
            </div>

            {/* Newsletter Signup Form */}
            <NewsletterSignup source="exit-intent-popup" />

            {/* Trust Badge */}
            <p className="text-center text-xs text-gray-500 mt-4">
              Join 500+ food lovers who get our exclusive content
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
