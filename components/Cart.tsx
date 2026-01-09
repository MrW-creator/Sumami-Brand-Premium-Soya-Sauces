
import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, ShoppingBag, Trash2, Truck, Tag, AlertCircle, Gift, Lock, ArrowRight, Zap } from 'lucide-react';
import { CartItem } from '../types';
import { ASSETS } from '../constants';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (index: number, delta: number) => void;
  onRemove: (index: number) => void;
  onCheckout: () => void;
  onAddRecommended: (variant: '3-Pack' | '6-Pack') => void;
  onOpenBonusSelector: (variant: '3-Pack' | '6-Pack') => void;
  shippingCost: number;
  freeShippingThreshold: number;
  discountAmount?: number;
  paid3Packs?: number;
  paid6Packs?: number;
  missingBonuses3?: number;
  missingBonuses6?: number;
}

const Cart: React.FC<CartProps> = ({ 
  isOpen, 
  onClose, 
  items, 
  onUpdateQuantity, 
  onRemove, 
  onCheckout, 
  onAddRecommended,
  onOpenBonusSelector,
  shippingCost,
  paid3Packs = 0,
  paid6Packs = 0,
  missingBonuses3 = 0,
  missingBonuses6 = 0
}) => {
  const [isNudgeDismissed, setIsNudgeDismissed] = useState(false);
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal + shippingCost;
  
  // Logic: Priority -> Claim 6, Claim 3, Upsell 6, Upsell 3.
  let nudgeType: 'claim-6' | 'claim-3' | 'upsell-6' | 'upsell-3' | null = null;
  let progressPercentage = 0;
  let progressMessage = "";

  if (missingBonuses6 > 0) {
      nudgeType = 'claim-6';
      progressPercentage = 100;
      progressMessage = "Gift Unlocked!";
  } else if (missingBonuses3 > 0) {
      nudgeType = 'claim-3';
      progressPercentage = 100;
      progressMessage = "Gift Unlocked!";
  } else if (paid6Packs > 0 && paid6Packs % 2 !== 0) {
      nudgeType = 'upsell-6';
      progressPercentage = 50;
      progressMessage = "Add 1 more 6-Pack for a FREE Gift";
  } else if (paid3Packs > 0 && paid3Packs % 2 !== 0) {
      nudgeType = 'upsell-3';
      progressPercentage = 50;
      progressMessage = "Add 1 more 3-Pack for a FREE Gift";
  } else {
      // Default state (0 progress)
      progressPercentage = 0;
      progressMessage = "Buy 2 Packs, Get 1 Free";
  }

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
        
        {/* Header - REDUCED PADDING */}
        <div className="px-5 py-3 border-b flex justify-between items-center bg-gray-50 shadow-sm z-10 relative">
          <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800">
            <ShoppingBag className="w-5 h-5 text-amber-600" />
            Your Cart
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* --- GAMIFICATION BAR (High Converting Feature) - REDUCED PADDING --- */}
        {items.length > 0 && (
          <div className="bg-gray-900 px-5 py-3 text-white">
             <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider mb-2">
                <span className="flex items-center gap-1"><Gift className="w-3 h-3 text-amber-500" /> Rewards Progress</span>
                <span className={progressPercentage === 100 ? "text-green-400" : "text-amber-500"}>{progressPercentage}%</span>
             </div>
             
             {/* Progress Track */}
             <div className="h-3 w-full bg-gray-700 rounded-full overflow-hidden relative">
                {/* Striped Animation Background */}
                <div 
                  className={`absolute top-0 left-0 h-full transition-all duration-700 ease-out ${progressPercentage === 100 ? 'bg-green-500' : 'bg-gradient-to-r from-amber-500 to-amber-600'}`}
                  style={{ width: `${progressPercentage}%` }}
                >
                  {/* CSS Stripe Effect */}
                   <div className="w-full h-full opacity-30" style={{backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)', backgroundSize: '1rem 1rem'}}></div>
                </div>
             </div>
             
             <p className="text-[10px] mt-2 text-gray-400 font-medium text-center flex items-center justify-center gap-1.5">
                {progressPercentage === 100 ? <Gift className="w-3 h-3 text-green-400 animate-bounce" /> : <Zap className="w-3 h-3 text-amber-400" />}
                {progressMessage}
             </p>
          </div>
        )}

        {/* NUDGES (Call to Action) */}
        {(nudgeType === 'claim-6' || nudgeType === 'claim-3') && (
            <div className="bg-green-100 px-4 py-2 text-xs text-green-900 border-b border-green-200 flex items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-300 shadow-inner">
                <div className="flex items-center gap-2 flex-1">
                    <div className="bg-green-200 p-1.5 rounded-full flex-shrink-0 animate-pulse">
                      <Gift className="w-3.5 h-3.5 text-green-700" />
                    </div>
                    <span className="leading-tight font-medium">
                       You have <strong>{nudgeType === 'claim-6' ? missingBonuses6 : missingBonuses3} FREE</strong> {nudgeType === 'claim-6' ? '6-Pack' : '3-Pack'}(s) waiting!
                    </span>
                </div>
                <button 
                  onClick={() => onOpenBonusSelector(nudgeType === 'claim-6' ? '6-Pack' : '3-Pack')}
                  className="whitespace-nowrap bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded shadow-sm font-bold transition-colors flex items-center gap-1 animate-pulse"
                >
                   Select Flavour
                </button>
            </div>
        )}

        {(nudgeType === 'upsell-6' || nudgeType === 'upsell-3') && !isNudgeDismissed && (
            <div className="bg-amber-100 px-4 py-2 text-xs text-amber-900 border-b border-amber-200 flex items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-300 shadow-inner">
                <div className="flex items-center gap-2 flex-1">
                    <div className="bg-amber-200 p-1.5 rounded-full flex-shrink-0">
                      <Gift className="w-3.5 h-3.5 text-amber-700" />
                    </div>
                    <span className="leading-tight">
                       Add 1 more "{nudgeType === 'upsell-6' ? '6-Pack' : '3-Pack'}" to unlock a <span className="font-bold underline decoration-amber-500 decoration-2">FREE {nudgeType === 'upsell-6' ? '6-Pack' : '3-Pack'}</span>!
                    </span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                      onClick={() => {
                        onAddRecommended(nudgeType === 'upsell-6' ? '6-Pack' : '3-Pack');
                        setIsNudgeDismissed(true); 
                      }}
                      className="whitespace-nowrap bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded shadow-sm font-bold transition-colors flex items-center gap-1"
                  >
                      <Plus className="w-3 h-3" /> Select Pack
                  </button>
                  <button 
                    onClick={() => setIsNudgeDismissed(true)}
                    className="text-amber-500 hover:text-amber-800 p-1.5 rounded hover:bg-amber-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
            </div>
        )}

        {/* Items - ADDED SCROLLBAR VISIBILITY */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-white scrollbar-thin scrollbar-thumb-amber-500 scrollbar-track-gray-100">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
              <div className="bg-gray-50 p-6 rounded-full mb-4">
                <ShoppingBag className="w-10 h-10 text-gray-300" />
              </div>
              <p className="text-lg font-medium text-gray-900">Your cart is empty</p>
              <p className="text-sm mt-1">Time to add some flavour!</p>
              <button onClick={onClose} className="mt-6 px-8 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200">
                Start Shopping
              </button>
            </div>
          ) : (
            items.map((item, index) => (
              <div key={`${item.id}-${index}`} className={`flex gap-3 p-3 rounded-xl border shadow-sm transition-all group ${item.isBonus ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-100'}`}>
                <div className="w-16 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover mix-blend-multiply" />
                  {item.isBonus && (
                    <div className="absolute inset-x-0 bottom-0 bg-amber-600 text-white text-[8px] font-bold text-center py-0.5 uppercase">
                      Free Gift
                    </div>
                  )}
                </div>
                
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      {/* REMOVED LINE CLAMP FOR FULL NAME VISIBILITY */}
                      <h3 className="font-bold text-gray-900 text-sm leading-tight pr-4">{item.name}</h3>
                      {!item.isBonus && (
                        <button 
                          onClick={() => onRemove(index)}
                          className="text-gray-300 hover:text-red-500 transition-colors -mt-1 -mr-1 p-1 opacity-0 group-hover:opacity-100"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
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
                    {/* QUANTITY CONTROLS - RESTYLED TO BE ATTENTION GRABBING */}
                    <div className={`flex items-center gap-2 rounded-lg px-1.5 py-0.5 border ${item.isBonus ? 'border-amber-200 bg-amber-100' : 'bg-white border-gray-300 shadow-sm'}`}>
                      {!item.isBonus && (
                        <button 
                          onClick={() => onUpdateQuantity(index, -1)}
                          className="w-6 h-6 flex items-center justify-center bg-gray-100 hover:bg-amber-500 hover:text-white rounded transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                      )}
                      <span className="text-sm font-bold w-6 text-center text-gray-900">{item.quantity}</span>
                      {!item.isBonus && (
                        <button 
                          onClick={() => onUpdateQuantity(index, 1)}
                          className="w-6 h-6 flex items-center justify-center bg-gray-100 hover:bg-amber-500 hover:text-white rounded transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <p className={`font-bold text-sm ${item.isBonus ? 'text-amber-600' : 'text-gray-900'}`}>
                      {item.price === 0 ? 'FREE' : `R ${(item.price * item.quantity).toFixed(2)}`}
                    </p>
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
              
              {items.some(i => i.isBonus) && (
                <div className="flex justify-between text-amber-600 font-bold text-sm animate-pulse">
                   <span className="flex items-center gap-1"><Gift className="w-3 h-3" /> Bonus Item</span>
                   <span>FREE</span>
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
              onClick={(missingBonuses6 > 0 || missingBonuses3 > 0) ? () => onOpenBonusSelector(missingBonuses6 > 0 ? '6-Pack' : '3-Pack') : onCheckout}
              className={`w-full py-3.5 rounded-xl font-bold text-base hover:shadow-lg transition-all shadow active:scale-95 flex items-center justify-center gap-2 mt-2 
                 ${(missingBonuses6 > 0 || missingBonuses3 > 0) ? 'bg-amber-600 hover:bg-amber-700 text-white animate-pulse' : 'bg-gray-900 hover:bg-black text-white'}
              `}
            >
              {(missingBonuses6 > 0 || missingBonuses3 > 0) ? (
                  <>
                     <Gift className="w-4 h-4" />
                     Select Free Gift to Checkout
                  </>
              ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Secure Checkout
                    <ArrowRight className="w-4 h-4 opacity-50" />
                  </>
              )}
            </button>
            
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-center gap-2">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Payments Powered by</span>
                <img src={ASSETS.payfast} alt="PayFast" className="h-6" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
