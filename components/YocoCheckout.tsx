
import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Lock, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { CustomerDetails, CartItem } from '../types';
import { ASSETS } from '../constants';

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
  const hasInitialized = useRef(false);

  const startCheckout = async () => {
    try {
      setStatus('redirecting');
      
      // 1. Save pending order state
      const pendingOrder = {
        cartItems,
        customerDetails: customer,
        total: amountInCents / 100,
        timestamp: Date.now()
      };
      localStorage.setItem('sumami_pending_order', JSON.stringify(pendingOrder));

      // 2. Prepare Items
      const lineItems = cartItems.map(item => ({
        name: item.name,
        price: item.price * 100,
        quantity: item.quantity
      }));

      console.log("V2 Checkout: Contacting Supabase Edge Function...");

      // 3. Call Edge Function
      const response = await fetch(
        "https://lnzloecnqcxknozokflr.supabase.co/functions/v1/create-yoco-checkout",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: lineItems,
            successUrl: `${window.location.origin}/?payment_status=success`,
            cancelUrl: `${window.location.origin}/?payment_status=cancel`
          })
        }
      );

      if (!response.ok) {
         const errData = await response.json().catch(() => ({}));
         console.error("Supabase Error:", errData);
         throw new Error(errData.error || "Connection to payment server failed");
      }

      const { redirectUrl } = await response.json();
      if (!redirectUrl) throw new Error("No redirect URL received from payment provider");

      console.log("Redirecting to:", redirectUrl);

      // 4. Redirect
      window.location.href = redirectUrl;

    } catch (err: any) {
      console.error("Checkout Error:", err);
      setError(err.message || "Failed to initialize secure checkout.");
      setStatus('error');
    }
  };

  // Auto-start on mount
  useEffect(() => {
    if (!hasInitialized.current) {
        hasInitialized.current = true;
        startCheckout();
    }
  }, []);

  if (error) {
    return (
      <div className="fixed inset-0 z-[60] bg-white flex flex-col items-center justify-center p-4">
         <div className="bg-red-50 p-6 rounded-xl border border-red-100 max-w-md text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Connection Error</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex gap-3 justify-center">
                <button onClick={onCancel} className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-bold">
                  Cancel
                </button>
                <button onClick={() => { setError(''); startCheckout(); }} className="px-6 py-3 bg-gray-900 text-white rounded-lg font-bold">
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
                        {status === 'initializing' ? 'Connecting...' : 'Connecting to Yoco Gateway...'}
                    </h2>
                </div>
                <p className="text-sm text-gray-500">
                  Transferring you to Yoco's secure gateway.
                </p>
             </div>

             {/* Manual button if auto-redirect hangs */}
             <button 
                onClick={startCheckout}
                className="mt-2 text-xs font-bold text-amber-600 hover:text-amber-700 underline flex items-center gap-1"
             >
                Click here if you aren't redirected automatically
                <ArrowRight className="w-3 h-3" />
             </button>

             <div className="flex items-center gap-2 text-[10px] text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 mt-2">
                <ShieldCheck className="w-3 h-3 text-green-500" />
                <span>256-Bit SSL Encrypted</span>
             </div>
        </div>
    </div>
  );
};

export default YocoCheckout;
