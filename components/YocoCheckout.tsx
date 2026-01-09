
import React, { useState, useEffect, useRef } from 'react';
import { Loader2, AlertCircle, ArrowRight, ShieldCheck, WifiOff } from 'lucide-react';
import { CustomerDetails, CartItem } from '../types';
import { ASSETS } from '../constants';
import { supabase } from '../lib/supabase/client';

interface YocoCheckoutProps {
  amountInCents: number;
  onSuccess: () => void;
  onCancel: () => void;
  customer: CustomerDetails;
  publicKey: string;
  cartItems: CartItem[];
}

const YocoCheckout: React.FC<YocoCheckoutProps> = ({ amountInCents, onCancel, customer, cartItems }) => {
  const [status, setStatus] = useState<'initializing' | 'redirecting' | 'error'>('initializing');
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const hasInitialized = useRef(false);

  const startCheckout = async () => {
    try {
      setStatus('redirecting');
      
      if (!supabase) throw new Error("Supabase client not initialized.");

      const pendingOrder = {
        cartItems,
        customerDetails: customer,
        total: amountInCents / 100,
        timestamp: Date.now()
      };
      localStorage.setItem('sumami_pending_order', JSON.stringify(pendingOrder));

      const lineItems = cartItems.map(item => ({
        name: item.name,
        price: item.price * 100,
        quantity: item.quantity
      }));

      console.log("🚀 Contacting Payment Server (v2.3)...");

      // Use invoke - this handles the Authorization header automatically
      const { data, error: fnError } = await supabase.functions.invoke('create-yoco-checkout', {
        body: {
          items: lineItems,
          successUrl: `${window.location.origin}/?payment_status=success`,
          cancelUrl: `${window.location.origin}/?payment_status=cancel`
        }
      });

      if (fnError) {
        console.error("Function Error:", fnError);
        let msg = fnError.message || "Unknown error";
        
        // Handle FunctionsFetchError specifically
        // This error happens when the fetch to the edge function fails (Network or CORS)
        if (typeof fnError === 'object' && fnError !== null && 'name' in fnError && fnError.name === 'FunctionsFetchError') {
             msg = "Network Error: Unable to reach the Payment Server. Please check your internet connection or try again.";
        } else if (msg.includes("Failed to fetch") || msg.includes("Load failed")) {
             msg = "Could not connect to server. Please check your internet connection.";
        }
        
        // Try to read deep error context if available
        if (fnError.context && typeof fnError.context.json === 'function') {
            try {
                const deepErr = await fnError.context.json();
                if (deepErr.error) msg = deepErr.error;
            } catch (e) {}
        }

        setDebugInfo(JSON.stringify(fnError, null, 2));
        throw new Error(msg);
      }

      if (!data || !data.redirectUrl) {
          throw new Error("Invalid response from payment provider.");
      }

      console.log("✅ Redirecting:", data.redirectUrl);
      window.location.href = data.redirectUrl;

    } catch (err: any) {
      console.error("Checkout Exception:", err);
      setError(err.message || "Failed to initialize checkout.");
      setStatus('error');
    }
  };

  useEffect(() => {
    if (!hasInitialized.current) {
        hasInitialized.current = true;
        startCheckout();
    }
  }, []);

  if (error) {
    return (
      <div className="fixed inset-0 z-[60] bg-white flex flex-col items-center justify-center p-4">
         <div className="bg-red-50 p-6 rounded-xl border border-red-100 max-w-md text-center shadow-2xl animate-in zoom-in-95 duration-300">
            <WifiOff className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Connection Failed</h3>
            <p className="text-gray-700 font-medium mb-4">{error}</p>
            
            <div className="text-left bg-white p-3 rounded border border-gray-200 mb-6 max-h-32 overflow-y-auto">
                <p className="text-[10px] text-gray-400 font-mono">DEBUG INFO:</p>
                <p className="text-xs text-gray-500 font-mono break-all">{debugInfo || error}</p>
            </div>

            <div className="flex gap-3 justify-center">
                <button onClick={onCancel} className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={() => { setError(''); setStatus('initializing'); startCheckout(); }} className="px-6 py-3 bg-gray-900 text-white rounded-lg font-bold hover:bg-black shadow-lg">
                  Retry
                </button>
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
        <div className="flex flex-col items-center gap-6 max-w-sm text-center p-6 bg-white rounded-2xl shadow-2xl border border-gray-100">
             <img src={ASSETS.yoco} alt="Yoco" className="h-10 w-auto mb-2" />
             
             <div className="space-y-2">
                <div className="flex items-center justify-center gap-3">
                    {status === 'redirecting' && <Loader2 className="w-6 h-6 animate-spin text-amber-600" />}
                    <h2 className="text-xl font-black text-gray-900">
                        Secure Checkout v2.3
                    </h2>
                </div>
                <p className="text-sm text-gray-500">
                  Connecting to Yoco Payment Gateway...
                </p>
             </div>

             <div className="flex items-center gap-2 text-[10px] text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 mt-2">
                <ShieldCheck className="w-3 h-3 text-green-500" />
                <span>256-Bit SSL Encrypted</span>
             </div>
        </div>
    </div>
  );
};

export default YocoCheckout;
