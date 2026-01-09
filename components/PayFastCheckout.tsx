
import React, { useEffect, useRef } from 'react';
import { Loader2, ShieldCheck, Lock } from 'lucide-react';
import { CustomerDetails, CartItem } from '../types';
import { ASSETS } from '../constants';

interface PayFastCheckoutProps {
  amountInCents: number; // PayFast takes Rands, we convert
  customer: CustomerDetails;
  cartItems: CartItem[];
  merchantId: string;
  merchantKey: string;
  isLive: boolean;
  onCancel: () => void;
}

const PayFastCheckout: React.FC<PayFastCheckoutProps> = ({ 
  amountInCents, 
  customer, 
  cartItems, 
  merchantId, 
  merchantKey, 
  isLive,
  onCancel
}) => {
  const formRef = useRef<HTMLFormElement>(null);
  const amountInRands = (amountInCents / 100).toFixed(2);
  
  // Construct Item Name Summary
  const itemNames = cartItems.map(i => `${i.quantity}x ${i.name} (${i.variantLabel || 'Single'})`).join(', ');
  const orderId = `SUM-${Date.now().toString().slice(-8)}`; // Simple Order ID
  
  // URL Selection
  const actionUrl = isLive 
    ? 'https://www.payfast.co.za/eng/process' 
    : 'https://sandbox.payfast.co.za/eng/process';

  useEffect(() => {
    // Auto-submit the form on mount
    const timer = setTimeout(() => {
        if (formRef.current) {
            formRef.current.submit();
        }
    }, 1500); // 1.5s delay to show the "Redirecting" UI so user knows what's happening
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[60] bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
        <div className="flex flex-col items-center gap-6 max-w-sm text-center p-6 bg-white rounded-2xl shadow-2xl border border-gray-100 relative">
             
             {/* PayFast Logo */}
             <img src="https://www.payfast.co.za/images/branding/payfast-logo.svg" alt="PayFast" className="h-12 w-auto mb-2" />
             
             <div className="space-y-4">
                <div className="flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-10 h-10 animate-spin text-red-600" />
                    <h2 className="text-xl font-black text-gray-900">
                        Redirecting to Secure Payment...
                    </h2>
                </div>
                <p className="text-sm text-gray-500">
                  You will be redirected to PayFast to complete your purchase of <span className="font-bold text-gray-800">R {amountInRands}</span>.
                </p>
             </div>

             <div className="flex items-center gap-2 text-[10px] text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 mt-2">
                <ShieldCheck className="w-3 h-3 text-green-500" />
                <span>SSL Secured Transaction</span>
             </div>

             <button onClick={onCancel} className="text-xs text-gray-400 hover:text-gray-600 underline mt-4">
                Cancel and return to cart
             </button>

             {/* HIDDEN FORM - THE ENGINE */}
             <form ref={formRef} action={actionUrl} method="POST" className="hidden">
                <input type="hidden" name="merchant_id" value={merchantId} />
                <input type="hidden" name="merchant_key" value={merchantKey} />
                <input type="hidden" name="return_url" value={`${window.location.origin}/?payment_status=success`} />
                <input type="hidden" name="cancel_url" value={`${window.location.origin}/?payment_status=cancel`} />
                
                {/* Removed notify_url to prevent 404 errors since we have no backend listener */}
                {/* <input type="hidden" name="notify_url" value="..." /> */}
                
                <input type="hidden" name="name_first" value={customer.firstName} />
                <input type="hidden" name="name_last" value={customer.lastName} />
                <input type="hidden" name="email_address" value={customer.email} />
                <input type="hidden" name="cell_number" value={customer.phone} />
                
                <input type="hidden" name="m_payment_id" value={orderId} />
                <input type="hidden" name="amount" value={amountInRands} />
                <input type="hidden" name="item_name" value={`Sumami Order: ${itemNames.substring(0, 90)}...`} />
                
                <input type="hidden" name="email_confirmation" value="1" />
                <input type="hidden" name="confirmation_address" value={customer.email} />
             </form>
        </div>
    </div>
  );
};

export default PayFastCheckout;
