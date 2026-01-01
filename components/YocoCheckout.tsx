import React, { useState, useEffect } from 'react';
import { Loader2, CreditCard, Lock, CheckCircle } from 'lucide-react';
import { CustomerDetails } from '../types';

interface YocoCheckoutProps {
  amountInCents: number;
  onSuccess: () => void;
  onCancel: () => void;
  customer: CustomerDetails;
}

const YocoCheckout: React.FC<YocoCheckoutProps> = ({ amountInCents, onSuccess, onCancel, customer }) => {
  const [processing, setProcessing] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);

  // In a real implementation, you would load the script in index.html or here
  // <script src="https://js.yoco.com/sdk/v1/yoco-sdk-web.js"></script>
  
  useEffect(() => {
    // Simulate SDK load time
    const timer = setTimeout(() => setSdkLoaded(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    // ------------------------------------------------------------------
    // YOCO INTEGRATION LOGIC (SIMULATED)
    // ------------------------------------------------------------------
    // Real implementation:
    // const yoco = new window.YocoSDK({ publicKey: 'YOUR_PUBLIC_KEY' });
    // yoco.showPopup({
    //   amountInCents: amountInCents,
    //   currency: 'ZAR',
    //   name: 'Sumami Brand',
    //   description: 'Order #1234',
    //   callback: (result: any) => {
    //     if (result.error) {
    //        handleError(result.error);
    //     } else {
    //        onSuccess(result.id);
    //     }
    //   }
    // });
    // ------------------------------------------------------------------

    // Simulating a network request/payment processing
    setTimeout(() => {
      setProcessing(false);
      onSuccess();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative">
        
        {/* Header */}
        <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-wide">Yoco</span>
            <span className="bg-blue-500 text-xs px-2 py-0.5 rounded text-blue-100">Secure</span>
          </div>
          <button onClick={onCancel} className="text-blue-100 hover:text-white text-sm">
            Cancel
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex justify-between items-end mb-6 border-b pb-4">
            <div>
              <p className="text-gray-500 text-sm">Total Amount</p>
              <h3 className="text-3xl font-bold text-gray-900">R {(amountInCents / 100).toFixed(2)}</h3>
            </div>
            <div className="text-right">
               <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Yoco_Logo.svg/1200px-Yoco_Logo.svg.png" alt="Yoco" className="h-6 opacity-50" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Card Number</label>
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

            <button
              type="submit"
              disabled={processing || !sdkLoaded}
              className={`w-full mt-6 py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition-all ${
                processing ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {processing ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5" />
                  Processing...
                </>
              ) : (
                <>
                  Pay R {(amountInCents / 100).toFixed(2)}
                </>
              )}
            </button>
            
            <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
              <Lock className="h-3 w-3" /> Encrypted by Yoco. 100% Secure.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default YocoCheckout;
