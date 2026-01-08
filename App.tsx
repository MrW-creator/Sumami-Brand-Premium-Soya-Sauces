import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase/client';
import { StoreSettings } from './types';
import CookieConsent from './components/CookieConsent';
import WhatsAppButton from './components/WhatsAppButton';
import Cart from './components/Cart';
import { PRODUCTS, BUNDLES } from './constants';

// Placeholder components since they weren't provided in the file list but are likely needed for a full app.
// In a real scenario, these would be imported from their respective files.
const LandingPage = () => <div className="p-8 text-center"><h1>Welcome to Sumami Brand</h1><p>Delicious Soya Sauces</p></div>;

const App: React.FC = () => {
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [activeYocoKey, setActiveYocoKey] = useState<string>('');
  
  // State for Cart (Basic implementation to satisfy potential children usage)
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<any[]>([]);

  // --- FETCH STORE SETTINGS (Reusable Function) ---
  const fetchStoreSettings = async () => {
      if (!supabase) return;
      try {
        const { data } = await supabase.from('store_settings').select('*').single();
        if (data) {
           // CRITICAL: Trim the key coming from DB just in case
           const rawKey = data.is_live_mode ? data.yoco_live_key : data.yoco_test_key;
           const key = rawKey ? rawKey.trim() : '';
           
           if (key) {
             setActiveYocoKey(key);
           }
           setStoreSettings(data);
           console.log("Store settings updated. Active Mode:", data.is_live_mode ? "LIVE" : "TEST");
        }
      } catch (err) {
        console.debug("Using default settings (offline or first run)");
      }
  };

  useEffect(() => {
    fetchStoreSettings();
  }, []);

  return (
    <div className="font-sans text-gray-900 bg-gray-50 min-h-screen relative">
      <LandingPage />
      
      {/* Global Overlays */}
      <CookieConsent />
      <WhatsAppButton />
      
      {/* Cart (Hidden by default) */}
      <Cart 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={() => {}}
        onRemove={() => {}}
        onCheckout={() => {}}
        onAddRecommended={() => {}}
        onOpenBonusSelector={() => {}}
        shippingCost={0}
        freeShippingThreshold={1000}
      />
    </div>
  );
};

export default App;