
import React, { useState, useEffect } from 'react';
import { Loader2, CreditCard, Lock, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import { CustomerDetails } from '../types';
import { ASSETS } from '../constants';

interface YocoCheckoutProps {
  amountInCents: number;
  onSuccess: () => void;
  onCancel: () => void;
  customer: CustomerDetails;
  publicKey: string; // Dynamic Key Passed from App
}

const YocoCheckout: React.FC<YocoCheckoutProps> = ({ amountInCents, onSuccess, onCancel, customer, publicKey }) => {
  const [processing, setProcessing] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);

  // Clean key to ensure no whitespace issues
  const cleanKey = publicKey ? publicKey.trim() : '';

  // Determine mode based on Key string content
  const isLive = cleanKey && cleanKey.startsWith('pk_live');
  // If we have a key but it's not live, we consider it test mode (even if the prefix is slightly off, we try it)
  const isTest = cleanKey && !isLive;
  const isSimulation = !cleanKey;

  useEffect(() => {
    // Check if Yoco SDK is available on window
    if (window.YocoSDK) {
      setSdkLoaded(true);
    } else {
      // If no SDK in index.html, we just set loaded to true for simulation mode to work, 
      // but warn in console if they provided a key.
      if (cleanKey) {
        console.error("Yoco SDK script missing in index.html");
      }
      setSdkLoaded(true);
    }
  }, [cleanKey]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    if (cleanKey) {
      // ------------------------------------------------------------------
      // REAL PRODUCTION / TEST MODE
      // ------------------------------------------------------------------
      try {
        const yoco = new window.YocoSDK({ publicKey: cleanKey });
        yoco.showPopup({
          amountInCents: amountInCents,
          currency: 'ZAR',
          name: 'Sumami Brand',
          description: `Order for ${customer.firstName}`,
          displayMethod: 'MANUAL',
          callback: (result: any) => {
            if (result.error) {
               setProcessing(false);
               alert("Payment Failed: " + result.error.message);
            } else {
               // Successful charge
               onSuccess();
            }
          }
        });
      } catch (err) {
        console.error("Yoco SDK Error", err);
        setProcessing(false);
        alert("Could not initialize Payment Gateway. Please refresh.");
      }
    } else {
      // ------------------------------------------------------------------
      // SIMULATION MODE (No Key Provided)
      // ------------------------------------------------------------------
      setTimeout(() => {
        setProcessing(false);
        onSuccess();
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative transform transition-all scale-100">
        
        {/* Header */}
        <div className={`p-4 flex justify-between items-center text-white ${isLive ? 'bg-green-700' : 'bg-gray-900'}`}>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            <span className="font-bold text-lg tracking-wide">Secure Checkout</span>
          </div>
          <button onClick={onCancel} className="text-white/80 hover:text-white text-sm font-medium">
            Cancel
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex justify-between items-end mb-6 border-b border-gray-100 pb-4">
            <div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Total to Pay</p>
              <h3 className="text-3xl font-black text-gray-900">R {(amountInCents / 100).toFixed(2)}</h3>
            </div>
            <div className="text-right">
               <div className="flex flex-col items-end gap-1">
                  <img src={ASSETS.yoco} alt="Yoco" className="h-8" />
                  <span className="text-[10px] text-gray-400 font-medium">Official Partner</span>
               </div>
            </div>
          </div>

          {!isLive && (
             <div className="mb-4 bg-amber-50 text-amber-900 text-xs p-3 rounded-lg border border-amber-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
                <div>
                  <strong>{isSimulation ? 'Simulation Mode' : 'Test Mode Active'}</strong> 
                  <p className="mt-0.5 opacity-90">No real money will be charged.</p>
                </div>
             </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Simulation Fields */}
            {isSimulation && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Card Number (Simulated)</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="0000 0000 0000 0000" 
                      className="w-full border border-gray-300 rounded-lg py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      required
                    />
                    <CreditCard className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Expiry</label>
                    <input 
                      type="text" 
                      placeholder="MM/YY" 
                      className="w-full border border-gray-300 rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">CVC</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="123" 
                        className="w-full border border-gray-300 rounded-lg py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        required
                      />
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Payment Button with Dynamic Color */}
            <button
              type="submit"
              disabled={processing || !sdkLoaded}
              className={`w-full mt-2 py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 text-lg ${
                processing 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : isLive 
                    ? 'bg-green-600 hover:bg-green-700 shadow-green-900/20' 
                    : 'bg-red-600 hover:bg-red-700 shadow-red-900/20'
              }`}
            >
              {processing ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5" />
                  Processing...
                </>
              ) : (
                <>
                   <Lock className="w-5 h-5" />
                   {isLive ? 'Pay Securely Now' : isTest ? 'Pay (Test Mode)' : 'Pay (Simulation)'}
                </>
              )}
            </button>
            
            {/* Trust Badges & Encryption Status */}
            <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                <Lock className="w-3 h-3 text-green-600" />
                <span>256-Bit SSL Encrypted</span>
              </div>
              
              <div className="flex items-center justify-center gap-4 opacity-90 w-full">
                 <div className="flex items-center gap-2">
                    <img src={ASSETS.yoco} alt="Yoco" className="h-6 w-auto" />
                    <span className="text-[10px] text-gray-500 font-bold leading-tight">Verified<br/>Merchant</span>
                 </div>
                 <div className="h-6 w-px bg-gray-200"></div>
                 <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div className="text-left">
                       <p className="text-xs font-bold text-gray-800 leading-none">Safe to Transact</p>
                       <p className="text-[10px] text-gray-400 leading-none mt-0.5">Protected by Yoco</p>
                    </div>
                 </div>
              </div>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default YocoCheckout;
