import React, { useState, useEffect } from 'react';
import { Loader2, CreditCard, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { CustomerDetails } from '../types';
import { YOCO_PUBLIC_KEY } from '../constants';

interface YocoCheckoutProps {
  amountInCents: number;
  onSuccess: () => void;
  onCancel: () => void;
  customer: CustomerDetails;
}

const YocoCheckout: React.FC<YocoCheckoutProps> = ({ amountInCents, onSuccess, onCancel, customer }) => {
  const [processing, setProcessing] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);

  useEffect(() => {
    // Check if Yoco SDK is available on window
    if (window.YocoSDK) {
      setSdkLoaded(true);
    } else {
      // If no SDK in index.html, we just set loaded to true for simulation mode to work, 
      // but warn in console if they provided a key.
      if (YOCO_PUBLIC_KEY) {
        console.error("Yoco SDK script missing in index.html");
      }
      setSdkLoaded(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    if (YOCO_PUBLIC_KEY) {
      // ------------------------------------------------------------------
      // REAL PRODUCTION MODE
      // ------------------------------------------------------------------
      try {
        const yoco = new window.YocoSDK({ publicKey: YOCO_PUBLIC_KEY });
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

          {!YOCO_PUBLIC_KEY && (
             <div className="mb-4 bg-yellow-50 text-yellow-800 text-xs p-3 rounded border border-yellow-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <div>
                  <strong>Test Mode:</strong> No Money will be charged. <br/>
                  Add <code>YOCO_PUBLIC_KEY</code> in constants.ts to go live.
                </div>
             </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* If using Real Yoco, the popup handles inputs. We just show a summary here or a 'Pay' button. 
                But for UI consistency, we show dummy fields in Simulation mode, or hide them in Real mode?
                Actually, Yoco Popup is an overlay. So we just need a button to trigger it.
            */}
            
            {!YOCO_PUBLIC_KEY && (
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

            {YOCO_PUBLIC_KEY && (
              <p className="text-sm text-gray-600 mb-4">
                Clicking pay will open the secure Yoco Payment Popup to complete your transaction.
              </p>
            )}

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
                  {YOCO_PUBLIC_KEY ? 'Proceed to Secure Payment' : `Pay R ${(amountInCents / 100).toFixed(2)}`}
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