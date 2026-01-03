import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, ShoppingBag, Trash2, Truck, Tag, AlertCircle, Gift, Lock, ArrowRight } from 'lucide-react';
import { CartItem } from '../types';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (index: number, delta: number) => void;
  onRemove: (index: number) => void;
  onCheckout: () => void;
  onAddRecommended: () => void;
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
  onAddRecommended,
  shippingCost,
  freeShippingThreshold,
  discountAmount = 0,
  packsOf3Count = 0
}) => {
  const [isNudgeDismissed, setIsNudgeDismissed] = useState(false);
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal - discountAmount + shippingCost;
  
  // Calculate if we need to nudge the user to add one more 3-pack
  // If packsOf3Count is odd (1, 3, 5...), they are missing out on a discount for the unpaired one.
  const needsNudge = packsOf3Count > 0 && packsOf3Count % 2 !== 0;

  // Reset dismissal if cart becomes empty
  useEffect(() => {
    if (items.length === 0) {
      setIsNudgeDismissed(false);
    }
  }, [items.length]);

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
        <div className="px-5 py-4 border-b flex justify-between items-center bg-gray-50 shadow-sm z-10">
          <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800">
            <ShoppingBag className="w-5 h-5 text-amber-600" />
            Your Cart
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Compact Nudge Banner (Dismissible) */}
        {needsNudge && !isNudgeDismissed && (
            <div className="bg-amber-100 px-4 py-2 text-xs text-amber-900 border-b border-amber-200 flex items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-2 flex-1">
                    <div className="bg-amber-200 p-1 rounded-full flex-shrink-0">
                      <AlertCircle className="w-3 h-3 text-amber-700" />
                    </div>
                    <span>
                       Add 1 more "3-Pack" to save <span className="font-bold underline">R150!</span>
                    </span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                      onClick={onAddRecommended}
                      className="whitespace-nowrap bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded shadow-sm font-bold transition-colors flex items-center gap-1"
                  >
                      <Plus className="w-3 h-3" /> Add
                  </button>
                  <button 
                    onClick={() => setIsNudgeDismissed(true)}
                    className="text-amber-500 hover:text-amber-800 p-1 rounded hover:bg-amber-200 transition-colors"
                    aria-label="Dismiss suggestion"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
            </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
              <ShoppingBag className="w-16 h-16 mb-4 text-gray-300" />
              <p className="text-lg font-medium">Your cart is empty</p>
              <p className="text-sm">Time to add some flavour!</p>
              <button onClick={onClose} className="mt-6 px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
                Start Shopping
              </button>
            </div>
          ) : (
            items.map((item, index) => (
              <div key={`${item.id}-${index}`} className="flex gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-16 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-gray-900 text-sm line-clamp-2 leading-tight pr-4">{item.name}</h3>
                      <button 
                        onClick={() => onRemove(index)}
                        className="text-gray-300 hover:text-red-500 transition-colors -mt-1 -mr-1 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {item.variantLabel && (
                      <span className="inline-block px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wide rounded mt-1">
                        {item.variantLabel}
                      </span>
                    )}
                    
                    {item.selectedOptions && item.selectedOptions.length > 0 && (
                      <p className="text-[10px] text-gray-500 mt-1 line-clamp-1">
                         {item.selectedOptions.join(', ')}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-between items-end mt-2">
                    <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-1.5 py-0.5 border border-gray-200">
                      <button 
                        onClick={() => onUpdateQuantity(index, -1)}
                        className="p-0.5 hover:bg-white rounded transition-colors"
                      >
                        <Minus className="w-3 h-3 text-gray-600" />
                      </button>
                      <span className="text-xs font-bold w-4 text-center text-gray-900">{item.quantity}</span>
                      <button 
                        onClick={() => onUpdateQuantity(index, 1)}
                        className="p-0.5 hover:bg-white rounded transition-colors"
                      >
                        <Plus className="w-3 h-3 text-gray-600" />
                      </button>
                    </div>
                    <p className="font-bold text-gray-900 text-sm">R {(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t bg-white p-5 space-y-3 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-20">
            
            {/* Free Bonuses Badge (Compact) */}
            <div className="bg-amber-50 border border-amber-100 rounded px-3 py-2 flex items-center justify-between text-xs text-amber-800">
               <div className="flex items-center gap-2 font-bold">
                 <Gift className="w-3.5 h-3.5" />
                 <span>Free Bonuses Unlocked!</span>
               </div>
               <span className="text-amber-600 text-[10px]">(Cookbook + VIP Access)</span>
            </div>

            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-gray-500 text-sm">
                <span>Subtotal</span>
                <span>R {subtotal.toFixed(2)}</span>
              </div>
              
              {/* Discount Line Item */}
              {discountAmount > 0 && (
                <div className="flex justify-between text-amber-600 font-bold text-sm">
                   <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> Bulk Savings</span>
                   <span>- R {discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-green-600 font-bold text-sm">
                <span>Shipping</span>
                <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> FREE</span>
              </div>
              
              <div className="flex justify-between text-xl font-black text-gray-900 pt-3 border-t border-dashed border-gray-200">
                <span>Total</span>
                <span>R {total.toFixed(2)}</span>
              </div>
            </div>

            <button 
              onClick={onCheckout}
              className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-bold text-base hover:bg-black transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 mt-2"
            >
              <Lock className="w-4 h-4" />
              Secure Checkout
              <ArrowRight className="w-4 h-4 opacity-50" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;