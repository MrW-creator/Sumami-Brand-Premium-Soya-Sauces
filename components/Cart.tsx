import React from 'react';
import { X, Plus, Minus, ShoppingBag, Trash2, Truck, Tag, AlertCircle, Gift } from 'lucide-react';
import { CartItem } from '../types';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (index: number, delta: number) => void;
  onRemove: (index: number) => void;
  onCheckout: () => void;
  shippingCost: number;
  freeShippingThreshold: number;
  discountAmount?: number;
  packsOf3Count?: number;
}

const Cart: React.FC<CartProps> = ({ 
  isOpen, 
  onClose, 
  items, 
  onUpdateQuantity, 
  onRemove, 
  onCheckout, 
  shippingCost,
  freeShippingThreshold,
  discountAmount = 0,
  packsOf3Count = 0
}) => {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal - discountAmount + shippingCost;
  
  // Calculate if we need to nudge the user to add one more 3-pack
  // If packsOf3Count is odd (1, 3, 5...), they are missing out on a discount for the unpaired one.
  const needsNudge = packsOf3Count > 0 && packsOf3Count % 2 !== 0;

  return (
    <div className={`fixed inset-0 z-40 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="p-5 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-600" />
            Your Cart
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Nudge Banner for Mix & Match */}
        {needsNudge && (
            <div className="bg-amber-100 p-3 px-5 text-sm text-amber-900 border-b border-amber-200 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
                <div>
                    <span className="font-bold">Almost there!</span> Add 1 more "3-Pack" (any flavour) to your cart and <span className="font-bold underline">save R150 instantly!</span>
                </div>
            </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
              <ShoppingBag className="w-16 h-16 mb-4 text-gray-300" />
              <p className="text-lg font-medium">Your cart is empty</p>
              <p className="text-sm">Time to add some flavour!</p>
              <button onClick={onClose} className="mt-6 px-6 py-2 bg-gray-900 text-white rounded-lg">
                Start Shopping
              </button>
            </div>
          ) : (
            items.map((item, index) => (
              <div key={`${item.id}-${index}`} className="flex gap-4">
                <div className="w-20 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-gray-900 line-clamp-2">{item.name}</h3>
                    <button 
                      onClick={() => onRemove(index)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Variant / Pack Label */}
                  {item.variantLabel && (
                    <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-1">
                      {item.variantLabel}
                    </p>
                  )}

                  {/* Selected Options Display */}
                  {item.selectedOptions && item.selectedOptions.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs text-gray-500 font-medium">Selection:</p>
                      <ul className="text-xs text-gray-600 list-disc pl-4">
                        {item.selectedOptions.map((opt, i) => (
                           <li key={i}>{opt}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex justify-between items-end mt-2">
                    <div className="flex items-center gap-3 bg-gray-100 rounded-lg px-2 py-1">
                      <button 
                        onClick={() => onUpdateQuantity(index, -1)}
                        className="p-1 hover:bg-white rounded shadow-sm transition-all"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => onUpdateQuantity(index, 1)}
                        className="p-1 hover:bg-white rounded shadow-sm transition-all"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="font-bold text-gray-900">R {(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t bg-gray-50 p-6 space-y-4">
            
            {/* Free Bonuses Section */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
               <div className="flex items-center gap-2 font-bold text-amber-800 mb-2">
                 <Gift className="w-4 h-4" />
                 <span>Free Gifts Unlocked!</span>
               </div>
               <ul className="space-y-1 text-xs text-amber-900 ml-6 list-disc">
                 <li>The Sumami Alchemy Cookbook <span className="font-bold text-amber-600">(Value R250)</span></li>
                 <li>VIP Discount Card (For your next purchase)</li>
               </ul>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>R {subtotal.toFixed(2)}</span>
              </div>
              
              {/* Discount Line Item */}
              {discountAmount > 0 && (
                <div className="flex justify-between text-amber-600 font-medium animate-pulse">
                   <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> Bulk Savings</span>
                   <span>- R {discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-green-600 font-medium">
                <span>Shipping</span>
                <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> FREE</span>
              </div>
              <div className="flex justify-between text-2xl font-black text-gray-900 pt-2 border-t">
                <span>Total</span>
                <span>R {total.toFixed(2)}</span>
              </div>
            </div>

            <button 
              onClick={onCheckout}
              className="w-full py-4 bg-amber-600 text-white rounded-xl font-bold text-lg hover:bg-amber-700 transition-all shadow-lg active:scale-95"
            >
              Secure Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;