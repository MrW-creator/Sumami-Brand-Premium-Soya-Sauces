
import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Star, Check, ChevronRight, Menu, MapPin, Phone, Instagram, Facebook, Truck, BookOpen, Gift, Percent, Zap, MessageCircle, Download, Info, Mail, Lock, BellRing, ArrowRight, Quote, ShieldCheck, CreditCard, Youtube } from 'lucide-react';
import { supabase } from './lib/supabase/client';
import { PRODUCTS, BUNDLES, ASSETS, COOKBOOK_DOWNLOAD_URL, YOCO_PUBLIC_KEY } from './constants';
import { Product, CartItem, CustomerDetails, StoreSettings } from './types';
import Cart from './components/Cart';
import YocoCheckout from './components/YocoCheckout';
import BundleBuilder from './components/BundleBuilder';
import LegalModal, { PolicyType } from './components/LegalModal';
import AdminDashboard from './components/AdminDashboard';
import BonusSelector from './components/BonusSelector';
import UpsellSelector from './components/UpsellSelector';
import CookieConsent from './components/CookieConsent';
import WhatsAppButton from './components/WhatsAppButton';

// Shipping is now all inclusive (FREE)
const SHIPPING_COST = 0;

// Reviews Data
const CUSTOMER_REVIEWS = [
  { name: "Sarah Jenkins", text: "Absolutely delicious! The Garlic & Ginger is a staple in my kitchen now. Can't cook without it.", rating: 5 },
  { name: "Mike T.", text: "Fast delivery and the packaging was beautiful. The free cookbook has some amazing recipes.", rating: 5 },
  { name: "David Le Roux", text: "The Chili infusion has the perfect kick. Not too hot, just right. Adds great depth to my stir-fry.", rating: 5 },
  { name: "Jessica M.", text: "Best soya sauce I've ever tasted. You can really taste the quality compared to supermarket brands.", rating: 5 },
  { name: "Karen B.", text: "Ordered the 7-pack for my husband's birthday. He loves them all! The gift box presentation is stunning.", rating: 5 },
  { name: "Peter R.", text: "Finally, a local brand that rivals the big imports. Well done Sumami! Proudly South African.", rating: 5 },
  { name: "Amit Patel", text: "The Fenugreek one transforms my vegetarian curries. Incredible flavour depth.", rating: 5 },
  { name: "Lerato K.", text: "Super fast shipping. Got my order in 2 days to Joburg. Everything arrived safely.", rating: 4 },
  { name: "John D.", text: "The Starter Trio is great value. Will definitely be refilling soon. The Sesame Mustard is a winner.", rating: 5 },
  { name: "Emily S.", text: "Love the free bonuses. Made the glazed salmon recipe last night, yum! Highly recommend.", rating: 5 },
  { name: "Thabo M.", text: "Secure payment via Yoco was easy. Great customer service on WhatsApp when I had a question.", rating: 5 },
  { name: "Lisa W.", text: "Citrus & Coriander is refreshing on summer salads. Such a unique flavour profile.", rating: 5 }
];

const App: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  
  // Bonus & Upsell Selection Logic
  const [isBonusSelectorOpen, setIsBonusSelectorOpen] = useState(false);
  const [activeBonusVariant, setActiveBonusVariant] = useState<'3-Pack' | '6-Pack'>('3-Pack');
  
  const [isUpsellSelectorOpen, setIsUpsellSelectorOpen] = useState(false);
  const [activeUpsellVariant, setActiveUpsellVariant] = useState<'3-Pack' | '6-Pack'>('3-Pack');

  const prevEarnedFreebies3 = useRef(0);
  const prevEarnedFreebies6 = useRef(0);
  
  // Review Carousel State
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);

  // Legal Modal State
  const [activePolicy, setActivePolicy] = useState<PolicyType>(null);

  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'details' | 'payment' | 'success'>('cart');
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    firstName: '', lastName: '', email: '', phone: '', address: '', city: '', zipCode: ''
  });

  const [lastOrder, setLastOrder] = useState<{items: CartItem[], total: number} | null>(null);
  
  // Dynamic Settings State
  const [activeYocoKey, setActiveYocoKey] = useState<string>(YOCO_PUBLIC_KEY || '');
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);

  // --- ANALYTICS TRACKING ---
  useEffect(() => {
    const trackVisit = async () => {
      // Check if session already tracked to avoid duplicates on refresh
      if (sessionStorage.getItem('sumami_visit_tracked')) return;
      if (!supabase) return;

      try {
        // 1. Get Location Data (Free IP API)
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        
        // 2. Determine Device Type
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        // 3. Save to Supabase
        await supabase.from('site_visits').insert({
           city: data.city || 'Unknown',
           region: data.region || 'Unknown',
           country: data.country_name || 'Unknown',
           device_type: isMobile ? 'Mobile' : 'Desktop',
           user_agent: navigator.userAgent
        });

        // 4. Mark session as tracked
        sessionStorage.setItem('sumami_visit_tracked', 'true');

      } catch (err) {
        // Silent fail for AdBlockers
        console.debug("Analytics tracking skipped.");
      }
    };
    
    // Small delay to ensure page load
    const timer = setTimeout(trackVisit, 2000);
    return () => clearTimeout(timer);
  }, []);

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

  // --- INITIAL LOAD ---
  useEffect(() => {
    fetchStoreSettings();
  }, []);

  // --- REVIEW AUTO CYCLE EFFECT ---
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveReviewIndex((prev) => (prev + 1) % CUSTOMER_REVIEWS.length);
    }, 5000); // Change every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // --- STRICT ELIGIBILITY LOGIC ---
  // Calculates count of PAID items only for a specific size
  const getPaidCount = (items: CartItem[], variant: '3-Pack' | '6-Pack') => {
    return items.filter(i => !i.isBonus).reduce((acc, item) => {
      // 3-Pack logic (includes Starter Bundle)
      if (variant === '3-Pack' && (item.variantLabel === '3-Pack' || item.id === 'starter-pack')) {
        return acc + item.quantity;
      }
      // 6-Pack logic
      if (variant === '6-Pack' && item.variantLabel === '6-Pack') {
        return acc + item.quantity;
      }
      return acc;
    }, 0);
  };

  // --- CART SANITIZATION ---
  // Ensures we never have MORE free items than allowed per category
  const sanitizeCart = (items: CartItem[]): CartItem[] => {
     let newItems = [...items];

     // Sanitize 3-Packs
     const paid3 = getPaidCount(newItems, '3-Pack');
     const allowed3 = Math.floor(paid3 / 2);
     let currentBonus3 = newItems.filter(i => i.isBonus && i.variantLabel === '3-Pack').reduce((acc, item) => acc + item.quantity, 0);
     
     if (currentBonus3 > allowed3) {
         let excess = currentBonus3 - allowed3;
         for (let i = newItems.length - 1; i >= 0; i--) {
            if (newItems[i].isBonus && newItems[i].variantLabel === '3-Pack' && excess > 0) {
                if (newItems[i].quantity > excess) {
                    newItems[i].quantity -= excess;
                    excess = 0;
                } else {
                    excess -= newItems[i].quantity;
                    newItems.splice(i, 1);
                }
            }
            if (excess === 0) break;
         }
     }

     // Sanitize 6-Packs
     const paid6 = getPaidCount(newItems, '6-Pack');
     const allowed6 = Math.floor(paid6 / 2);
     let currentBonus6 = newItems.filter(i => i.isBonus && i.variantLabel === '6-Pack').reduce((acc, item) => acc + item.quantity, 0);

     if (currentBonus6 > allowed6) {
         let excess = currentBonus6 - allowed6;
         for (let i = newItems.length - 1; i >= 0; i--) {
            if (newItems[i].isBonus && newItems[i].variantLabel === '6-Pack' && excess > 0) {
                if (newItems[i].quantity > excess) {
                    newItems[i].quantity -= excess;
                    excess = 0;
                } else {
                    excess -= newItems[i].quantity;
                    newItems.splice(i, 1);
                }
            }
            if (excess === 0) break;
         }
     }
     
     return newItems;
  };

  // --- CALCULATION VARIABLES ---
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = subtotal + SHIPPING_COST; 
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  
  const paid3Packs = getPaidCount(cartItems, '3-Pack');
  const earnedFreebies3 = Math.floor(paid3Packs / 2);
  const currentBonus3 = cartItems.filter(i => i.isBonus && i.variantLabel === '3-Pack').reduce((acc, item) => acc + item.quantity, 0);
  const missingBonuses3 = Math.max(0, earnedFreebies3 - currentBonus3);

  const paid6Packs = getPaidCount(cartItems, '6-Pack');
  const earnedFreebies6 = Math.floor(paid6Packs / 2);
  const currentBonus6 = cartItems.filter(i => i.isBonus && i.variantLabel === '6-Pack').reduce((acc, item) => acc + item.quantity, 0);
  const missingBonuses6 = Math.max(0, earnedFreebies6 - currentBonus6);


  // --- EFFECT: DETECT BONUS ELIGIBILITY & AUTO OPEN MODAL ---
  useEffect(() => {
    // Priority to higher value (6-Pack)
    if (earnedFreebies6 > prevEarnedFreebies6.current && missingBonuses6 > 0) {
        setActiveBonusVariant('6-Pack');
        setIsBonusSelectorOpen(true);
    } 
    else if (earnedFreebies3 > prevEarnedFreebies3.current && missingBonuses3 > 0) {
        setActiveBonusVariant('3-Pack');
        setIsBonusSelectorOpen(true);
    }

    prevEarnedFreebies6.current = earnedFreebies6;
    prevEarnedFreebies3.current = earnedFreebies3;
  }, [earnedFreebies6, earnedFreebies3, missingBonuses6, missingBonuses3]);


  // Handlers
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  const addToCart = (product: Product, quantity: number = 1, options?: string[], variantLabel?: string, overridePrice?: number, isBonus: boolean = false) => {
    setCartItems(prev => {
      // 1. Add item
      const uniqueId = isBonus 
        ? `bonus-${product.id}-${variantLabel}` 
        : `${product.id}-${variantLabel || ''}-${options?.sort().join(',') || ''}`;
      
      let newItems = [...prev];
      
      const existingIndex = newItems.findIndex(item => {
          const itemUniqueId = item.isBonus 
             ? `bonus-${item.id}-${item.variantLabel}` 
             : `${item.id}-${item.variantLabel || ''}-${item.selectedOptions?.sort().join(',') || ''}`;
          return itemUniqueId === uniqueId;
      });

      if (existingIndex > -1) {
        newItems[existingIndex] = { 
          ...newItems[existingIndex], 
          quantity: newItems[existingIndex].quantity + quantity 
        };
      } else {
        newItems.push({ 
          ...product, 
          quantity, 
          selectedOptions: options, 
          variantLabel,
          price: overridePrice !== undefined ? overridePrice : product.price,
          isBonus,
          // Assign unique SKU for bonuses to differentiate in DB
          sku: isBonus ? `BONUS-${product.sku}` : product.sku
        });
      }

      // 2. Sanitize immediately to enforce rules
      return sanitizeCart(newItems);
    });

    if (!isBonus) {
        setIsCartOpen(true);
    }
  };

  const handleBonusSelect = (product: Product, variant: string) => {
      // Explicitly adding as bonus (isBonus=true, Price=0)
      addToCart(product, 1, undefined, variant, 0, true);
      
      // Close modal if we satisfied the need, OR if we switched types context
      // Simplified: Just close it, let the nudge system handle remaining
      setIsBonusSelectorOpen(false);
      setIsCartOpen(true); 
  };

  const addSaucePack = (product: Product, size: 3 | 6) => {
    const price = size === 3 ? 315 : 480;
    addToCart(product, 1, undefined, `${size}-Pack`, price);
  };

  const handleAddRecommended = (variant: '3-Pack' | '6-Pack') => {
    setIsCartOpen(false);
    setActiveUpsellVariant(variant);
    setIsUpsellSelectorOpen(true);
  };

  const handleUpsellSelect = (product: Product, variant: string) => {
    // Adds a PAID pack (isBonus=false)
    const price = variant === '6-Pack' ? 480 : 315;
    addToCart(product, 1, undefined, variant, price);
    setIsUpsellSelectorOpen(false);
    setIsCartOpen(true);
  };

  const handleBundleClick = (bundle: Product) => {
    if (bundle.id === 'starter-pack') {
      setIsBuilderOpen(true);
    } else {
      // Master Chef or other bundles
      // Pass 'Bundle' or specific pack size as variantLabel so it shows in email/cart
      addToCart(bundle, 1, undefined, 'Bundle');
    }
  };

  const handleBuilderComplete = (selectedIds: string[]) => {
    const trioProduct = BUNDLES.find(b => b.id === 'starter-pack');
    if (trioProduct) {
      const selectedNames = selectedIds.map(id => {
        const p = PRODUCTS.find(p => p.id === id);
        return p ? p.name.replace('Infused With ', '') : id;
      });
      // Explicitly mark as 3-Pack so it counts towards the "Buy 2 Get 1 Free" logic
      addToCart(trioProduct, 1, selectedNames, '3-Pack');
    }
  };

  const updateCartItemQuantity = (index: number, delta: number) => {
      setCartItems(prev => {
          let newItems = [...prev];
          const item = newItems[index];

          // Prevent manually increasing bonus items
          if (item.isBonus && delta > 0) return prev; 

          const newQty = Math.max(0, item.quantity + delta);
          
          if (newQty === 0) {
              newItems = newItems.filter((_, i) => i !== index);
          } else {
              newItems[index] = { ...item, quantity: newQty };
          }

          // Recalculate rules (e.g. if paid pack removed, bonus might be removed)
          return sanitizeCart(newItems);
      });
  };
  
  const removeCartItem = (index: number) => {
      setCartItems(prev => {
        const newItems = prev.filter((_, i) => i !== index);
        return sanitizeCart(newItems);
      });
  };

  const startCheckout = () => {
    setIsCartOpen(false);
    setCheckoutStep('details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ... [Database Saving Logic] ...
  const saveOrderToSupabase = async (details: CustomerDetails, items: CartItem[], finalTotal: number) => {
    if (!supabase) return;

    const orderItems = items.map(item => ({
      sku: item.sku,
      product_id: item.id,
      name: item.name,
      variant: item.variantLabel || 'Single',
      options: item.selectedOptions || [],
      quantity: item.quantity,
      price: item.price,
      is_bonus: item.isBonus || false 
    }));

    try {
      const { error } = await supabase
        .from('orders')
        .insert([{
            customer_name: `${details.firstName} ${details.lastName}`,
            email: details.email,
            phone: details.phone,
            address_full: `${details.address}, ${details.city}, ${details.zipCode}`,
            items: orderItems,
            total_amount: finalTotal,
            discount_amount: 0,
            status: 'paid',
            payment_provider: 'yoco'
        }]);
      if (error) throw error;
      
      // TRIGGER EMAIL SEND VIA SUPABASE EDGE FUNCTION
      await supabase.functions.invoke('resend-order-email', {
        body: {
          customerName: `${details.firstName} ${details.lastName}`,
          customerEmail: details.email,
          orderTotal: finalTotal,
          items: orderItems,
          orderId: `SUM-${Date.now().toString().slice(-6)}` // Generate a temp ID for email if DB ID unavailable
        }
      });

    } catch (err) {
      console.error("Error saving order or sending email:", err);
    }
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutStep('payment');
  };

  const handlePaymentSuccess = () => {
    setLastOrder({ items: [...cartItems], total: total });
    saveOrderToSupabase(customerDetails, cartItems, total);
    setCheckoutStep('success');
    setCartItems([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getWhatsAppLink = () => {
    if (!lastOrder) return '';
    const itemsSummary = lastOrder.items.map(i => 
      `${i.quantity} x ${i.name.replace('Infused With ', '')} (${i.variantLabel || 'Single'}) ${i.price === 0 ? '[FREE GIFT]' : ''}`
    ).join('\n');
    
    const message = `*ORDER #CONFIRMED - ACTIVATE TRACKING* 🚚\n\nCustomer: ${customerDetails.firstName} ${customerDetails.lastName}\nOrder Total: R${lastOrder.total.toFixed(2)}\n\n*Items Ordered:*\n${itemsSummary}\n\n------------------\n✅ *ACTION REQUIRED:*\nHi Sumami Team! I am messaging to *activate Priority Tracking* for my order.`;

    return `https://wa.me/27662434867?text=${encodeURIComponent(message)}`;
  };

  if (checkoutStep === 'success' && lastOrder) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        {/* Success View */}
        <div className="w-full max-w-lg">
          <div className="bg-white p-8 rounded-3xl shadow-2xl text-center mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-2">Order Confirmed!</h1>
            
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <span className="font-bold text-blue-900">Receipt Sent</span>
                </div>
                <p className="text-blue-800 text-sm">We've emailed your invoice to: <strong>{customerDetails.email}</strong></p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6 text-left border border-gray-100 mb-6">
               <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-2">
                 <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Receipt</span>
                 <span className="text-xs font-bold text-gray-400">{new Date().toLocaleDateString()}</span>
               </div>
               <div className="space-y-3 mb-4">
                 {lastOrder.items.map((item, idx) => (
                   <div key={idx} className="flex justify-between text-sm">
                     <span className={`${item.isBonus ? 'text-amber-600 font-bold' : 'text-gray-800'}`}>
                       <span className="font-bold">{item.quantity}x</span> {item.name} <span className="text-gray-400 text-xs">{item.variantLabel}</span>
                       {item.isBonus && <span className="ml-2 text-[10px] bg-amber-100 px-1 rounded uppercase">Free Gift</span>}
                     </span>
                     <span className="font-medium">
                        {item.price === 0 ? 'FREE' : `R ${(item.price * item.quantity).toFixed(2)}`}
                     </span>
                   </div>
                 ))}
               </div>
               <div className="border-t border-gray-200 pt-3 space-y-1">
                 <div className="flex justify-between text-xl font-black text-gray-900 mt-2">
                   <span>Total Paid</span>
                   <span>R {lastOrder.total.toFixed(2)}</span>
                 </div>
               </div>
            </div>

            <div className="bg-green-50 border-2 border-green-500 border-dashed rounded-2xl p-6 relative overflow-hidden mb-6">
                <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg uppercase tracking-wider">Final Step</div>
                <div className="flex flex-col items-center">
                    <div className="bg-white p-3 rounded-full shadow-sm mb-3"><BellRing className="w-8 h-8 text-green-600 animate-pulse" /></div>
                    <h3 className="text-lg font-black text-gray-900 mb-1">Activate Priority Tracking</h3>
                    <p className="text-xs text-gray-600 mb-4 max-w-xs mx-auto">Join our <span className="font-bold text-green-700">WhatsApp VIP List</span></p>
                    <a href={getWhatsAppLink()} target="_blank" rel="noopener noreferrer" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2"><MessageCircle className="w-5 h-5" /><span>Activate & Join VIP List</span><ArrowRight className="w-4 h-4" /></a>
                </div>
            </div>
          </div>
          
           <div className="bg-amber-50 p-6 rounded-2xl text-left border border-amber-100 shadow-sm flex flex-col gap-4">
             <div className="flex items-start gap-4">
                <div className="bg-amber-100 p-3 rounded-lg"><Gift className="w-6 h-6 text-amber-600" /></div>
                <div><h3 className="font-bold text-amber-900 mb-1">Bonus Unlocked!</h3><p className="text-sm text-amber-800/80">Your copy of <strong>The Sumami Alchemy Cookbook</strong> is ready for download.</p></div>
             </div>
             <a href={COOKBOOK_DOWNLOAD_URL} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold py-3 rounded-lg transition-colors border border-amber-300"><Download className="w-5 h-5" /> Download eBook (PDF)</a>
          </div>

          <div className="text-center mt-8">
            <button onClick={() => setCheckoutStep('cart')} className="text-gray-400 font-medium hover:text-gray-900 transition-colors">Back to Home</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans text-gray-900 antialiased selection:bg-amber-200">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-30 bg-white/90 backdrop-blur-md border-b border-gray-100 transition-all">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-amber-600 tracking-tighter">Sumami Brand</span>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 hover:bg-gray-100 rounded-full transition-colors group"
            >
              <ShoppingBag className="w-6 h-6 text-gray-800 group-hover:text-amber-600 transition-colors" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full animate-bounce">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Cart Drawer */}
      <Cart 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        items={cartItems}
        onUpdateQuantity={updateCartItemQuantity}
        onRemove={removeCartItem}
        onCheckout={startCheckout}
        onAddRecommended={handleAddRecommended}
        shippingCost={SHIPPING_COST}
        freeShippingThreshold={0}
        
        // Pass counts for separate nudge logic
        paid3Packs={paid3Packs}
        paid6Packs={paid6Packs}
        missingBonuses3={missingBonuses3}
        missingBonuses6={missingBonuses6}
        
        onOpenBonusSelector={(variant) => { 
           setActiveBonusVariant(variant);
           setIsCartOpen(false); 
           setIsBonusSelectorOpen(true); 
        }}
      />

      {/* Bonus Selector Modal (For FREE Items) */}
      <BonusSelector 
        isOpen={isBonusSelectorOpen}
        onClose={() => setIsBonusSelectorOpen(false)}
        onSelect={handleBonusSelect}
        products={PRODUCTS}
        countToSelect={activeBonusVariant === '6-Pack' ? missingBonuses6 : missingBonuses3}
        variant={activeBonusVariant}
      />

      {/* Upsell Selector Modal (For PAID Items) */}
      <UpsellSelector 
        isOpen={isUpsellSelectorOpen}
        onClose={() => setIsUpsellSelectorOpen(false)}
        onSelect={handleUpsellSelect}
        products={PRODUCTS}
        variant={activeUpsellVariant}
      />

      {/* Bundle Builder Modal */}
      <BundleBuilder 
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        onComplete={handleBuilderComplete}
        products={PRODUCTS}
      />

      {/* Legal Modal */}
      <LegalModal 
        isOpen={activePolicy !== null}
        type={activePolicy}
        onClose={() => setActivePolicy(null)}
      />

      {/* Admin Dashboard Overlay */}
      {isAdminOpen && (
        <AdminDashboard 
            onClose={() => setIsAdminOpen(false)} 
            onSettingsUpdated={fetchStoreSettings} // PASS REFRESH FUNCTION
        />
      )}

      {/* Yoco Payment Overlay - USING DYNAMIC KEY */}
      {checkoutStep === 'payment' && (
        <YocoCheckout 
          amountInCents={total * 100}
          customer={customerDetails}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setCheckoutStep('details')}
          publicKey={activeYocoKey} 
        />
      )}

      {/* Cookie Consent Banner */}
      <CookieConsent />

      {/* Floating WhatsApp Button */}
      <WhatsAppButton />

      {/* Checkout Details Form */}
      {checkoutStep === 'details' ? (
        <div className="min-h-screen pt-24 pb-12 bg-gray-50">
          <div className="container mx-auto px-4 max-w-2xl">
            <button onClick={() => setCheckoutStep('cart')} className="text-gray-500 mb-6 hover:text-gray-900 flex items-center gap-1">
               &larr; Back to Shopping
            </button>
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Shipping Details</h2>
                <p className="text-sm text-gray-500 flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-green-600" /> 
                  You’ll confirm payment on the next step.
                </p>
              </div>
              <form onSubmit={handleDetailsSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">First Name</label><input required className="w-full border border-gray-300 rounded-lg p-3 outline-none" value={customerDetails.firstName} onChange={e => setCustomerDetails({...customerDetails, firstName: e.target.value})} /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label><input required className="w-full border border-gray-300 rounded-lg p-3 outline-none" value={customerDetails.lastName} onChange={e => setCustomerDetails({...customerDetails, lastName: e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" required className="w-full border border-gray-300 rounded-lg p-3 outline-none" value={customerDetails.email} onChange={e => setCustomerDetails({...customerDetails, email: e.target.value})} /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input type="tel" required className="w-full border border-gray-300 rounded-lg p-3 outline-none" value={customerDetails.phone} onChange={e => setCustomerDetails({...customerDetails, phone: e.target.value})} /></div>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><input required className="w-full border border-gray-300 rounded-lg p-3 outline-none" value={customerDetails.address} onChange={e => setCustomerDetails({...customerDetails, address: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">City</label><input required className="w-full border border-gray-300 rounded-lg p-3 outline-none" value={customerDetails.city} onChange={e => setCustomerDetails({...customerDetails, city: e.target.value})} /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label><input required className="w-full border border-gray-300 rounded-lg p-3 outline-none" value={customerDetails.zipCode} onChange={e => setCustomerDetails({...customerDetails, zipCode: e.target.value})} /></div>
                </div>

                {/* Order Summary in Checkout */}
                <div className="bg-gray-50 p-4 rounded-lg mt-6">
                   <div className="flex justify-between text-sm mb-2"><span>Subtotal</span><span>R {subtotal.toFixed(2)}</span></div>
                   <div className="flex justify-between text-sm mb-2 font-bold text-green-600"><span>Shipping</span><span>FREE</span></div>
                   
                   <div className="flex justify-between text-xs text-amber-600 mb-2"><span>Bonus: Cookbook & Golden Ticket</span><span>FREE</span></div>
                   
                   {cartItems.some(i => i.isBonus) && (
                     <div className="flex justify-between text-sm mb-2 font-bold text-amber-600 animate-pulse">
                        <span className="flex items-center gap-1"><Gift className="w-3 h-3" /> Special Offer Applied</span>
                        <span>Free Bonus Items Included</span>
                     </div>
                   )}
                   {(missingBonuses3 > 0 || missingBonuses6 > 0) && (
                      <div className="bg-red-50 text-red-700 p-2 rounded text-xs font-bold mb-2 flex items-center gap-2 cursor-pointer border border-red-200" onClick={() => setIsBonusSelectorOpen(true)}>
                         <Gift className="w-4 h-4" />
                         You have unclaimed FREE gift(s)! Click to select.
                      </div>
                   )}

                   <div className="flex justify-between text-xl font-bold border-t pt-2 mt-2"><span>Total</span><span>R {total.toFixed(2)}</span></div>
                </div>

                <button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-95 text-lg">
                  Continue to Payment (R {total.toFixed(2)})
                </button>
                
                {/* NEW TRUST BADGE */}
                <div className="mt-4 flex items-center justify-center gap-2">
                   <ShieldCheck className="w-4 h-4 text-gray-400" />
                   <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Secured by</span>
                   <img src={ASSETS.yoco} alt="Yoco" className="h-5 transition-all" />
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : (
        /* MAIN LANDING PAGE CONTENT (Unchanged) */
        <main>
          {/* ... [Rest of content remains exactly the same] ... */}
          <section className="relative min-h-[90vh] flex items-center overflow-hidden">
            <div className="absolute inset-0 z-0">
               <img src={ASSETS.heroBg} alt="Sumami BBQ" className="w-full h-full object-cover" />
               <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
            </div>

            <div className="container mx-auto px-4 z-10 pt-20">
              <div className="max-w-3xl text-white">
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <div className="inline-flex items-center gap-2 bg-amber-500/20 backdrop-blur-sm border border-amber-500/50 rounded-full px-4 py-1">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="text-sm font-medium text-amber-100">Voted Best Artisan Sauce 2024</span>
                  </div>
                   <div className="inline-flex items-center gap-2 bg-green-500/90 backdrop-blur-sm border border-green-400 rounded-full px-4 py-1">
                    <Truck className="w-4 h-4 text-white" />
                    <span className="text-sm font-bold text-white uppercase tracking-wide">Free Nationwide Delivery</span>
                  </div>
                </div>
                
                <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
                  Unlock the <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
                    Fifth Taste.
                  </span>
                </h1>
                <p className="text-xl text-gray-200 mb-8 leading-relaxed max-w-lg">
                  Premium soya sauces infused with authentic South African flavours. 
                  Transform ordinary meals into culinary masterpieces with just a splash.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={() => scrollToSection('bundles')}
                    className="px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-full font-bold text-lg shadow-lg shadow-amber-900/50 transition-all hover:scale-105 text-center cursor-pointer"
                  >
                    Shop Bundles
                  </button>
                  <button 
                    onClick={() => scrollToSection('flavours')}
                    className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-full font-bold text-lg transition-all text-center cursor-pointer"
                  >
                    Explore Flavours
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Shipping Banner - UPDATED TO BE PROMINENT */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 text-white py-4 text-center text-base font-black uppercase tracking-widest shadow-lg relative z-20">
            <p className="flex items-center justify-center gap-3 animate-pulse">
              <Truck className="w-5 h-5" />
              <span>Limited Offer: Free Shipping on ALL Orders!</span>
              <Truck className="w-5 h-5 transform scale-x-[-1]" />
            </p>
          </div>

          {/* Social Proof Strip */}
          <div className="bg-amber-50 py-10 border-b border-amber-100">
            <div className="container mx-auto px-4 flex flex-wrap justify-center gap-8 md:gap-16 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
              {['Brewed for depth — not diluted', 'Fermented Soya Sauce', 'Infused with Umami Flavours'].map((item) => (
                <div key={item} className="flex items-center gap-2 font-bold text-gray-700">
                  <Check className="w-5 h-5 text-amber-600" /> {item}
                </div>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <section id="flavours" className="py-20 bg-white scroll-mt-28">
            <div className="container mx-auto px-4">
              
              {/* SMART SAVER BANNER - UPDATED FOR FREE GIFT LOGIC */}
              <div className="max-w-4xl mx-auto mb-16">
                 <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 text-center md:text-left relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 text-amber-100">
                        <Gift className="w-64 h-64 opacity-20 rotate-12" />
                    </div>
                    <div className="bg-amber-100 p-4 rounded-full text-amber-600 relative z-10">
                        <Zap className="w-8 h-8 fill-current" />
                    </div>
                    <div className="flex-1 relative z-10">
                        <h3 className="text-2xl font-black text-gray-900 mb-2">Smart Saver Tip: Buy 2, Get 1 FREE</h3>
                        <p className="text-gray-600">
                           Don't want 6 of the same flavour? <span className="font-bold text-amber-800">Buy ANY 2 x "3-Packs" and you'll get to CHOOSE a FREE 3-Pack (Worth R150).</span> 
                           Perfect for building your own variety pack!
                        </p>
                    </div>
                 </div>
              </div>

              <div className="text-center mb-16">
                <h2 className="text-4xl font-black text-gray-900 mb-4">The Flavour Collection</h2>
                <p className="text-gray-500 max-w-2xl mx-auto text-lg">
                  Stock up on your favourites. Available in 3-packs or 6-packs.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {PRODUCTS.filter(p => p.category === 'sauce').map((product) => (
                  <div key={product.id} className="group relative bg-gray-50 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100 flex flex-col">
                    <div className="aspect-[4/3] bg-white overflow-hidden relative">
                      <div className="absolute inset-0 bg-gray-100 animate-pulse"></div>
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                        loading="lazy"
                      />
                      {/* --- SALES BADGE --- */}
                      {product.badge && (
                        <div className="absolute top-4 right-4 bg-amber-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg z-10">
                           {product.badge}
                        </div>
                      )}
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="mb-4">
                        <p className="text-amber-600 font-bold text-xs tracking-wider uppercase mb-1">{product.subName}</p>
                        <h3 className="text-2xl font-bold text-gray-900">{product.name}</h3>
                      </div>
                      <p className="text-gray-600 mb-6 flex-1">{product.description}</p>
                      
                      <div className="flex items-center gap-2 mb-4">
                         <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                         <span className="text-xs font-bold text-green-700 uppercase">In Stock & Ready to Ship</span>
                      </div>

                      <div className="mt-auto">
                        <div className="grid grid-cols-2 gap-3">
                          <button 
                            onClick={() => addSaucePack(product, 3)}
                            className="px-2 py-3 bg-white border-2 border-gray-900 text-gray-900 rounded-lg font-bold hover:bg-gray-50 transition-colors text-sm flex flex-col items-center justify-center"
                          >
                            <span>Buy 3 Pack</span>
                            <span className="text-xs font-normal text-gray-500">R 315.00</span>
                          </button>
                          <button 
                            onClick={() => addSaucePack(product, 6)}
                            className="px-2 py-3 bg-gray-900 text-white rounded-lg font-bold hover:bg-amber-600 transition-colors text-sm shadow-lg flex flex-col items-center justify-center relative overflow-hidden group/btn"
                          >
                            {/* Shine Effect */}
                            <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 skew-x-12"></div>
                            
                            <span>Buy 6 Pack</span>
                            <span className="text-xs text-amber-400 font-bold">Best Value: R 480</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Feature/Lifestyle Section, Bonus Section, Bundles Section same as before but using the updated logic */}
          <section className="py-20 bg-gray-900 text-white relative overflow-hidden">
             {/* ... Feature Content ... */}
             <div className="absolute inset-0 opacity-20">
                <img src={ASSETS.lifestyle} alt="Cooking" className="w-full h-full object-cover" />
             </div>
             <div className="container mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center gap-12">
                <div className="flex-1 space-y-8">
                  <h2 className="text-4xl md:text-5xl font-black leading-tight">
                    More than just sauce.<br/>
                    It's a secret ingredient.
                  </h2>
                   <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-full bg-amber-600 flex items-center justify-center flex-shrink-0">
                        <span className="font-bold text-xl">1</span>
                      </div>
                      <div>
                        <h4 className="text-xl font-bold mb-2">Marinate</h4>
                        <p className="text-gray-400">Deep penetration for meats and tofu. 30 minutes is all you need.</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-full bg-amber-600 flex items-center justify-center flex-shrink-0">
                        <span className="font-bold text-xl">2</span>
                      </div>
                      <div>
                        <h4 className="text-xl font-bold mb-2">Stir-Fry</h4>
                        <p className="text-gray-400">Add a splash near the end of cooking for a glossy, aromatic finish.</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-full bg-amber-600 flex items-center justify-center flex-shrink-0">
                        <span className="font-bold text-xl">3</span>
                      </div>
                      <div>
                        <h4 className="text-xl font-bold mb-2">Dip</h4>
                        <p className="text-gray-400">The perfect companion for sushi, dumplings, and spring rolls.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex-1 w-full max-w-md">
                   <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20">
                      <h3 className="text-2xl font-bold mb-4">Chef's Tip</h3>
                      <p className="italic text-gray-300 mb-4">"I use the Roasted Sesame & Mustard seed sauce as a base for salad dressings. Just whisk with a little olive oil and lemon juice. It's unbeatable."</p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-500 rounded-full"></div>
                        <div>
                           <p className="font-bold">Chef Marco</p>
                           <p className="text-xs text-amber-400">Executive Chef, Amanzimtoti</p>
                        </div>
                      </div>
                   </div>
                </div>
             </div>
          </section>

          <section className="py-20 bg-amber-900 relative overflow-hidden">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
             <div className="container mx-auto px-4 relative z-10 text-center text-white">
                <span className="inline-block py-1 px-3 border border-amber-400 rounded-full text-amber-400 text-sm font-bold uppercase tracking-widest mb-4">Exclusive Launch Offer</span>
                <h2 className="text-3xl md:text-5xl font-black mb-8">
                  Get Exclusive Bonuses <br/> <span className="text-amber-400">Included FREE with Every Bundle</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-12 text-left">
                  {/* Bonus 1 */}
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors flex flex-col md:flex-row gap-6 items-center md:items-start">
                     <div className="w-full md:w-1/3 h-40 bg-gray-800 rounded-xl overflow-hidden relative flex-shrink-0">
                        <img src={ASSETS.cookbook} alt="Cookbook" className="w-full h-full object-cover opacity-80" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                           <BookOpen className="w-10 h-10 text-white" />
                        </div>
                     </div>
                     <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                           <h3 className="text-xl font-bold text-amber-200">The Sumami Alchemy Cookbook</h3>
                        </div>
                        <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded font-bold mb-3 inline-block">R250 Value</span>
                        <p className="text-gray-300 text-sm">50+ recipes. Learn how to transform simple weeknight meals into gourmet experiences.</p>
                     </div>
                  </div>

                  {/* Bonus 2 */}
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors flex flex-col md:flex-row gap-6 items-center md:items-start">
                     <div className="w-full md:w-1/3 h-40 bg-gradient-to-br from-yellow-600 to-amber-800 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Star className="w-12 h-12 text-white fill-white" />
                     </div>
                     <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                           <h3 className="text-xl font-bold text-amber-200">The "Golden Ticket"</h3>
                        </div>
                         <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded font-bold mb-3 inline-block">Priceless</span>
                        <p className="text-gray-300 text-sm">Hidden inside your box. Unlocks secret discounts and VIP status for future refills.</p>
                     </div>
                  </div>
                </div>

                <div className="mt-8 max-w-2xl mx-auto">
                    <p className="flex items-center justify-center gap-2 text-amber-200/60 text-sm">
                      <Info className="w-4 h-4" />
                      <span>Note: Only one digital cookbook download link provided per completed order.</span>
                    </p>
                </div>
             </div>
          </section>

          <section id="bundles" className="py-20 bg-amber-50 scroll-mt-28">
            <div className="container mx-auto px-4">
              <div className="text-center mb-16">
                 <span className="text-amber-600 font-bold tracking-widest uppercase">Best Value</span>
                 <h2 className="text-4xl font-black text-gray-900 mt-2">Curated Collections</h2>
                 <p className="text-gray-500 mt-2">Perfect for gifting or stocking up.</p>
              </div>
              
              <div className="flex flex-col md:flex-row justify-center gap-8 max-w-5xl mx-auto">
                {BUNDLES.map((bundle) => (
                   <div key={bundle.id} className={`flex-1 bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col relative ${bundle.highlight ? 'ring-4 ring-amber-500 transform md:-translate-y-4' : ''}`}>
                      <div className="aspect-video overflow-hidden">
                        <img src={bundle.image} alt={bundle.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-8 flex flex-col flex-1">
                        <h3 className="text-2xl font-bold text-gray-900">{bundle.name}</h3>
                        <p className="text-amber-600 font-medium mb-4">{bundle.subName}</p>
                        <p className="text-gray-600 mb-6 flex-1">{bundle.description}</p>
                        
                        <div className="mt-auto pt-6 border-t border-gray-100">
                          <div className="flex items-end gap-2 mb-4">
                             <span className="text-3xl font-black text-gray-900">R {bundle.price}</span>
                             <span className="text-lg text-gray-400 line-through mb-1">R {Math.round(bundle.price * 1.15)}</span>
                          </div>

                          {bundle.id === 'starter-pack' && (
                             <p className="text-xs text-gray-500 font-medium italic mb-4">
                               "Cheaper than one takeaway. Used across dozens of meals."
                             </p>
                          )}

                          <button 
                            onClick={() => handleBundleClick(bundle)}
                            className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl active:scale-95 ${bundle.highlight ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-gray-900 hover:bg-gray-800 text-white'}`}
                          >
                            {bundle.id === 'starter-pack' ? 'Build Your Pack' : 'Add to Cart'}
                          </button>
                        </div>
                      </div>
                   </div>
                ))}
              </div>
            </div>
          </section>

          {/* CUSTOMER REVIEWS CAROUSEL */}
          <section className="py-20 bg-gray-50 relative overflow-hidden">
             {/* Decorative Background Elements */}
             <div className="absolute top-0 left-0 w-64 h-64 bg-amber-100 rounded-full blur-3xl opacity-50 -translate-x-1/2 -translate-y-1/2"></div>
             <div className="absolute bottom-0 right-0 w-64 h-64 bg-amber-100 rounded-full blur-3xl opacity-50 translate-x-1/2 translate-y-1/2"></div>
             
             <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-12">
                   <h2 className="text-4xl font-black text-gray-900">What Our Customers Are Saying</h2>
                   <div className="flex justify-center gap-1 mt-4">
                      {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 text-amber-500 fill-amber-500" />)}
                   </div>
                </div>

                <div className="max-w-4xl mx-auto h-[250px] md:h-[200px] relative">
                   {CUSTOMER_REVIEWS.map((review, index) => (
                      <div 
                        key={index}
                        className={`absolute inset-0 transition-all duration-700 ease-in-out transform flex flex-col items-center justify-center text-center px-4
                           ${index === activeReviewIndex 
                              ? 'opacity-100 scale-100 translate-y-0' 
                              : 'opacity-0 scale-95 translate-y-4 pointer-events-none'}
                        `}
                      >
                         <Quote className="w-10 h-10 text-amber-200 mb-6 mx-auto" />
                         <p className="text-xl md:text-2xl font-medium text-gray-800 italic mb-6 leading-relaxed">"{review.text}"</p>
                         <div>
                            <p className="font-bold text-gray-900">{review.name}</p>
                            <div className="flex justify-center gap-0.5 mt-1">
                               {[...Array(review.rating)].map((_, i) => (
                                 <Star key={i} className="w-3 h-3 text-amber-500 fill-amber-500" />
                               ))}
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
                
                {/* Dots Indicator */}
                <div className="flex justify-center gap-2 mt-8">
                   {CUSTOMER_REVIEWS.map((_, index) => (
                      <button 
                        key={index}
                        onClick={() => setActiveReviewIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all ${index === activeReviewIndex ? 'bg-amber-600 w-6' : 'bg-gray-300'}`}
                      />
                   ))}
                </div>
             </div>
          </section>

          {/* YOCO TRUST SIGNAL - PAYMENT METHODS */}
          <section className="bg-white py-12 border-t border-gray-100">
             <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
                   <div className="flex items-center gap-4">
                      <div className="bg-blue-50 p-3 rounded-full">
                         <ShieldCheck className="w-8 h-8 text-blue-600" />
                      </div>
                      <div>
                         <h4 className="font-bold text-gray-900">Secure Payments</h4>
                         <p className="text-xs text-gray-500">256-bit SSL Encryption</p>
                      </div>
                   </div>
                   
                   <div className="h-10 w-px bg-gray-200 hidden md:block"></div>

                   <div className="flex flex-col items-center">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Powered By</p>
                      <img src={ASSETS.yoco} alt="Yoco" className="h-8 transition-all" />
                   </div>

                   <div className="h-10 w-px bg-gray-200 hidden md:block"></div>

                   <div className="flex items-center gap-4">
                      <div className="bg-green-50 p-3 rounded-full">
                         <CreditCard className="w-8 h-8 text-green-600" />
                      </div>
                      <div>
                         <h4 className="font-bold text-gray-900">Safe to Transact</h4>
                         <p className="text-xs text-gray-500">Verified Merchant Status</p>
                      </div>
                   </div>
                </div>
             </div>
          </section>

          {/* Footer */}
          <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
            {/* ... same footer ... */}
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                <div className="col-span-1 md:col-span-2">
                   <h2 className="text-3xl font-black text-white mb-4">Sumami Brand</h2>
                   <p className="max-w-xs">Handcrafted in South Africa. Bringing the fifth taste to your table with passion and precision.</p>
                </div>
                <div>
                  <h4 className="text-white font-bold mb-4">Contact</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Amanzimtoti, KwaZulu-Natal</li>
                    <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> 066 243 4867</li>
                    <li className="flex items-center gap-2">info@soyasauce.co.za</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-white font-bold mb-4">Legal</h4>
                  <ul className="space-y-2 text-sm">
                    <li><button onClick={() => setActivePolicy('privacy')} className="hover:text-white transition-colors">Privacy Policy</button></li>
                    <li><button onClick={() => setActivePolicy('terms')} className="hover:text-white transition-colors">Terms of Service</button></li>
                    <li><button onClick={() => setActivePolicy('shipping')} className="hover:text-white transition-colors">Shipping Policy</button></li>
                  </ul>
                </div>
              </div>
              <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-gray-800">
                 <p className="text-sm">&copy; 2024 Sumami Brand / soyasauce.co.za. All rights reserved.</p>
                 
                 {/* DYNAMIC SOCIAL ICONS */}
                 <div className="flex gap-4 mt-4 md:mt-0 items-center">
                    {storeSettings?.instagram_url && (
                        <a href={storeSettings.instagram_url} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                            <Instagram className="w-5 h-5 hover:text-white cursor-pointer transition-colors" />
                        </a>
                    )}
                    {storeSettings?.facebook_url && (
                        <a href={storeSettings.facebook_url} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                            <Facebook className="w-5 h-5 hover:text-white cursor-pointer transition-colors" />
                        </a>
                    )}
                     {storeSettings?.youtube_url && (
                        <a href={storeSettings.youtube_url} target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                            <Youtube className="w-6 h-6 hover:text-white cursor-pointer transition-colors" />
                        </a>
                    )}
                    {storeSettings?.tiktok_url && (
                        <a href={storeSettings.tiktok_url} target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                           {/* Custom SVG for TikTok since it might be missing in older Lucide versions */}
                           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 hover:text-white cursor-pointer transition-colors">
                             <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                           </svg>
                        </a>
                    )}
                    {storeSettings?.pinterest_url && (
                        <a href={storeSettings.pinterest_url} target="_blank" rel="noopener noreferrer" aria-label="Pinterest">
                           {/* Custom SVG for Pinterest */}
                           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 hover:text-white cursor-pointer transition-colors">
                              <path d="M8 12a4 4 0 1 0 8 0 4 4 0 0 0-8 0" />
                              <path d="M10.7 13.9L8 21" />
                           </svg>
                        </a>
                    )}
                 </div>

                 <div className="mt-4 md:mt-0 md:ml-4 flex items-center gap-3">
                    {storeSettings && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-gray-100 border border-gray-200" title={storeSettings.is_live_mode ? "Live Mode Active" : "Demo Mode Active"}>
                            <div className={`w-2 h-2 rounded-full ${storeSettings.is_live_mode ? 'bg-green-500 animate-pulse' : 'bg-yellow-400'}`}></div>
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{storeSettings.is_live_mode ? 'LIVE' : 'DEMO'}</span>
                        </div>
                    )}
                    <button onClick={() => setIsAdminOpen(true)} className="text-xs text-gray-800 hover:text-gray-600 font-bold uppercase tracking-wide">
                        Admin Access
                    </button>
                 </div>
              </div>
            </div>
          </footer>
        </main>
      )}
    </div>
  );
};

export default App;
