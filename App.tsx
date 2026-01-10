
import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Star, Check, ChevronRight, Menu, MapPin, Phone, Instagram, Facebook, Truck, BookOpen, Gift, Percent, Zap, MessageCircle, Download, Info, Mail, Lock, BellRing, ArrowRight, Quote, ShieldCheck, CreditCard, Youtube, Award, ThumbsUp, Printer, FileText } from 'lucide-react';
import { supabase } from './lib/supabase/client';
import { PRODUCTS as INITIAL_PRODUCTS, ASSETS, COOKBOOK_DOWNLOAD_URL, PAYFAST_DEFAULTS } from './constants';
import { Product, CartItem, CustomerDetails, StoreSettings } from './types';
import Cart from './components/Cart';
import PayFastCheckout from './components/PayFastCheckout';
import BundleBuilder from './components/BundleBuilder';
import LegalModal, { PolicyType } from './components/LegalModal';
import AdminDashboard from './components/AdminDashboard';
import BonusSelector from './components/BonusSelector';
import UpsellSelector from './components/UpsellSelector';
import CookieConsent from './components/CookieConsent';
import WhatsAppButton from './components/WhatsAppButton';
import AnalyticsTracker from './components/AnalyticsTracker';

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
  { name: "Thabo M.", text: "Secure payment was easy. Great customer service on WhatsApp when I had a question.", rating: 5 },
  { name: "Lisa W.", text: "Citrus & Coriander is refreshing on summer salads. Such a unique flavour profile.", rating: 5 }
];

const App: React.FC = () => {
  // --- DYNAMIC PRODUCTS STATE ---
  // We initialize with the hardcoded constants to ensure immediate render (SSR/Static support)
  // then useEffect updates it from the DB.
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);

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

  // --- SECURITY: ANTI-BOT STATE ---
  const [formStartTime, setFormStartTime] = useState<number>(0);
  const [honeypot, setHoneypot] = useState<string>(''); // If this gets filled, it's a bot

  const [lastOrder, setLastOrder] = useState<{items: CartItem[], total: number} | null>(null);
  
  // Dynamic Settings State
  const [payFastSettings, setPayFastSettings] = useState<{id: string, key: string, isLive: boolean}>({
      id: PAYFAST_DEFAULTS.merchant_id,
      key: PAYFAST_DEFAULTS.merchant_key,
      isLive: false
  });
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  
  // DYNAMIC PRICING STATE (Default 150)
  const [shippingMarkup, setShippingMarkup] = useState(150);

  // --- 1. FETCH PRODUCTS FROM DB ---
  useEffect(() => {
    const fetchProducts = async () => {
      if (!supabase) return;
      try {
        const { data, error } = await supabase.from('products').select('*');
        if (error) throw error;
        if (data && data.length > 0) {
            // Map DB snake_case columns to camelCase Types
            const mappedProducts: Product[] = data.map((p: any) => ({
                id: p.id,
                sku: p.sku,
                name: p.name,
                subName: p.sub_name, 
                description: p.description,
                price: p.price,
                image: p.image,
                category: p.category,
                highlight: p.highlight,
                badge: p.badge
            }));
            setProducts(mappedProducts);
        }
      } catch (err) {
        console.error("Using fallback products due to DB error:", err);
      }
    };
    fetchProducts();
  }, []);

  // --- ANALYTICS TRACKING ---
  useEffect(() => {
    const trackVisit = async () => {
      // Check if session already tracked to avoid duplicates on refresh
      if (sessionStorage.getItem('sumami_visit_tracked')) return;
      if (!supabase) return;

      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        await supabase.from('site_visits').insert({
           city: data.city || 'Unknown',
           region: data.region || 'Unknown',
           country: data.country_name || 'Unknown',
           device_type: isMobile ? 'Mobile' : 'Desktop',
           user_agent: navigator.userAgent
        });

        sessionStorage.setItem('sumami_visit_tracked', 'true');

      } catch (err) {
        console.debug("Analytics tracking skipped.");
      }
    };
    
    const timer = setTimeout(trackVisit, 2000);
    return () => clearTimeout(timer);
  }, []);

  // --- HANDLE RETURN FROM PAYMENT REDIRECT ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment_status');

    if (paymentStatus === 'success') {
      const stored = localStorage.getItem('sumami_pending_order');
      if (stored) {
        const { cartItems: savedItems, customerDetails: savedDetails, total } = JSON.parse(stored);
        
        // Restore state for display
        setCartItems(savedItems);
        setCustomerDetails(savedDetails);
        setLastOrder({ items: savedItems, total: total });
        
        // Trigger Analytics Purchase Event
        if ((window as any).fbq) {
           (window as any).fbq('track', 'Purchase', { value: total, currency: 'ZAR' });
        }
        if ((window as any).gtag) {
           (window as any).gtag('event', 'purchase', {
              currency: 'ZAR',
              value: total,
              items: savedItems.map((i: any) => ({
                 item_id: i.sku,
                 item_name: i.name,
                 price: i.price,
                 quantity: i.quantity
              }))
           });
        }
        
        // Clear storage & show success
        localStorage.removeItem('sumami_pending_order');
        setCheckoutStep('success');
        
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } else if (paymentStatus === 'cancel') {
      alert("Payment was cancelled. You have returned to the checkout page.");
      const stored = localStorage.getItem('sumami_pending_order');
      if (stored) {
         const { cartItems: savedItems, customerDetails: savedDetails } = JSON.parse(stored);
         setCartItems(savedItems);
         setCustomerDetails(savedDetails);
         setCheckoutStep('details'); // Go back to details so they can try again
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);


  // --- FETCH STORE SETTINGS (Reusable Function) ---
  const fetchStoreSettings = async () => {
      if (!supabase) return;
      try {
        const { data } = await supabase.from('store_settings').select('*').single();
        if (data) {
           setStoreSettings(data);
           setPayFastSettings({
             id: data.payfast_merchant_id || PAYFAST_DEFAULTS.merchant_id,
             key: data.payfast_merchant_key || PAYFAST_DEFAULTS.merchant_key,
             isLive: data.is_live_mode
           });
           
           if (data.shipping_markup !== undefined) {
               setShippingMarkup(data.shipping_markup);
           }
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
  const getPaidCount = (items: CartItem[], variant: '3-Pack' | '6-Pack') => {
    return items.filter(i => !i.isBonus).reduce((acc, item) => {
      if (variant === '3-Pack' && (item.variantLabel === '3-Pack' || item.id === 'starter-pack')) {
        return acc + item.quantity;
      }
      if (variant === '6-Pack' && item.variantLabel === '6-Pack') {
        return acc + item.quantity;
      }
      return acc;
    }, 0);
  };

  // --- CART SANITIZATION ---
  const sanitizeCart = (items: CartItem[]): CartItem[] => {
     let newItems = [...items];

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
          sku: isBonus ? `BONUS-${product.sku}` : product.sku
        });
      }

      return sanitizeCart(newItems);
    });

    if (!isBonus) {
        setIsCartOpen(true);
    }
  };

  const handleBonusSelect = (product: Product, variant: string) => {
      addToCart(product, 1, undefined, variant, 0, true);
      setIsBonusSelectorOpen(false);
      setIsCartOpen(true); 
  };

  const addSaucePack = (product: Product, size: 3 | 6) => {
    // Dynamic Pricing Logic: (SinglePrice * Size) + ShippingMarkup
    const price = (product.price * size) + shippingMarkup;
    addToCart(product, 1, undefined, `${size}-Pack`, price);
  };

  const handleAddRecommended = (variant: '3-Pack' | '6-Pack') => {
    setIsCartOpen(false);
    setActiveUpsellVariant(variant);
    setIsUpsellSelectorOpen(true);
  };

  const handleUpsellSelect = (product: Product, variant: string) => {
    const size = variant === '3-Pack' ? 3 : 6;
    const price = (product.price * size) + shippingMarkup;
    addToCart(product, 1, undefined, variant, price);
    setIsUpsellSelectorOpen(false);
    setIsCartOpen(true);
  };

  const handleBundleClick = (bundle: Product) => {
    if (bundle.id === 'starter-pack') {
      setIsBuilderOpen(true);
    } else {
      addToCart(bundle, 1, undefined, 'Bundle');
    }
  };

  const handleBuilderComplete = (selectedIds: string[]) => {
    const trioProduct = products.find(b => b.id === 'starter-pack');
    if (trioProduct) {
      const selectedNames = selectedIds.map(id => {
        const p = products.find(p => p.id === id);
        return p ? p.name.replace('Infused With ', '') : id;
      });
      // The Starter Trio price is fetched from DB directly (usually matches dynamic logic but kept as DB product price for stability)
      addToCart(trioProduct, 1, selectedNames, '3-Pack');
    }
  };

  const updateCartItemQuantity = (index: number, delta: number) => {
      setCartItems(prev => {
          let newItems = [...prev];
          const item = newItems[index];
          if (item.isBonus && delta > 0) return prev; 
          const newQty = Math.max(0, item.quantity + delta);
          if (newQty === 0) {
              newItems = newItems.filter((_, i) => i !== index);
          } else {
              newItems[index] = { ...item, quantity: newQty };
          }
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
    // Start the bot timer
    setFormStartTime(Date.now());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- DEBUG/TESTING FUNCTION ---
  const handleAddTestProduct = () => {
    addToCart({
      id: 'test-product',
      sku: 'TEST-001',
      name: 'Live Gateway Test Item',
      subName: 'Debug Item',
      description: 'This is a hidden item to test real money transactions.',
      price: 5, // R5.00
      image: ASSETS.seal,
      category: 'sauce'
    }, 1, undefined, 'Single');
    setIsAdminOpen(false);
    setIsCartOpen(true);
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
            status: 'pending_payment', // New status for PayFast redirect
            payment_provider: 'payfast'
        }]);
      if (error) throw error;
      
      // We still try to send the email, although usually we'd wait for payment confirmation
      // For MVP, sending it now ensures they get "Order Received" even if they drop off at payment
      await supabase.functions.invoke('resend-order-email', {
        body: {
          customerName: `${details.firstName} ${details.lastName}`,
          customerEmail: details.email,
          orderTotal: finalTotal,
          items: orderItems,
          orderId: `SUM-${Date.now().toString().slice(-6)}` 
        }
      });

    } catch (err) {
      console.error("Error saving order or sending email:", err);
    }
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // --- SECURITY CHECK: HONEYPOT ---
    if (honeypot) {
        console.warn("Bot detected: Honeypot field filled.");
        return; // Silent fail
    }

    // --- SECURITY CHECK: SPEED LIMIT ---
    const timeTaken = Date.now() - formStartTime;
    if (timeTaken < 3000) { // If filled in under 3 seconds
        console.warn("Bot detected: Form filled too fast.");
        return; // Silent fail
    }
    
    // Save locally for retrieval after redirect
    const pendingOrder = {
        cartItems,
        customerDetails,
        total,
        timestamp: Date.now()
    };
    localStorage.setItem('sumami_pending_order', JSON.stringify(pendingOrder));

    // Save to Database BEFORE redirecting
    await saveOrderToSupabase(customerDetails, cartItems, total);

    // Proceed to Payment Step (Render PayFastCheckout)
    setCheckoutStep('payment');
  };

  const getWhatsAppLink = () => {
    if (!lastOrder) return '';
    const itemsSummary = lastOrder.items.map(i => 
      `${i.quantity} x ${i.name.replace('Infused With ', '')} (${i.variantLabel || 'Single'}) ${i.price === 0 ? '[FREE GIFT]' : ''}`
    ).join('\n');
    
    const message = `*ORDER #CONFIRMED - ACTIVATE TRACKING* 🚚\n\nCustomer: ${customerDetails.firstName} ${customerDetails.lastName}\nOrder Total: R${lastOrder.total.toFixed(2)}\n\n*Items Ordered:*\n${itemsSummary}\n\n------------------\n✅ *ACTION REQUIRED:*\nHi Sumami Team! I am messaging to *activate Priority Tracking* for my order.`;

    return `https://wa.me/27662434867?text=${encodeURIComponent(message)}`;
  };

  // SUCCESS PAGE ... (Same as before)
  if (checkoutStep === 'success' && lastOrder) {
     // ... [Success UI is preserved] ...
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <AnalyticsTracker settings={storeSettings} />
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

            <button 
              onClick={() => window.print()}
              className="flex items-center justify-center gap-2 w-full bg-white border-2 border-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors mb-6 shadow-sm"
            >
              <Printer className="w-5 h-5" /> Download Tax Invoice
            </button>
            
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

        {/* --- HIDDEN INVOICE TEMPLATE (VISIBLE ON PRINT) --- */}
        <div id="printable-invoice" className="hidden">
           <div className="p-8">
                {/* INVOICE HEADER */}
                <div className="flex justify-between items-start border-b border-gray-200 pb-8 mb-8">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 mb-2">INVOICE</h1>
                        <p className="text-sm text-gray-500 font-bold">#{`WEB-${Date.now().toString().slice(-6)}`}</p>
                        <div className="mt-4 text-sm text-gray-600">
                            <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                            <p><strong>Status:</strong> <span className="uppercase">PAID</span></p>
                        </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                        {/* INSERTED LOGO HERE */}
                        <img src={ASSETS.logo} alt="Sumami Brand" className="h-12 w-auto mb-2" />
                        <div className="text-sm text-gray-500 whitespace-pre-wrap leading-relaxed">
                            {storeSettings?.company_address || 'Amanzimtoti, KwaZulu-Natal\nSouth Africa'}
                        </div>
                        {storeSettings?.company_vat && <p className="text-sm text-gray-500 mt-2"><strong>VAT No:</strong> {storeSettings.company_vat}</p>}
                        {storeSettings?.company_reg && <p className="text-sm text-gray-500"><strong>Reg No:</strong> {storeSettings.company_reg}</p>}
                    </div>
                </div>

                {/* BILL TO */}
                <div className="mb-8">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Bill To</h3>
                    <p className="font-bold text-gray-900">{customerDetails.firstName} {customerDetails.lastName}</p>
                    <p className="text-sm text-gray-600">{customerDetails.email}</p>
                    <p className="text-sm text-gray-600">{customerDetails.phone}</p>
                    <p className="text-sm text-gray-600 max-w-xs">{customerDetails.address}, {customerDetails.city}, {customerDetails.zipCode}</p>
                </div>

                {/* TABLE */}
                <table className="w-full mb-8">
                    <thead>
                        <tr className="border-b-2 border-gray-900">
                            <th className="text-left py-3 text-sm font-bold text-gray-900">Item</th>
                            <th className="text-center py-3 text-sm font-bold text-gray-900">Qty</th>
                            <th className="text-right py-3 text-sm font-bold text-gray-900">Price</th>
                            <th className="text-right py-3 text-sm font-bold text-gray-900">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {lastOrder.items?.map((item, idx) => (
                            <tr key={idx}>
                                <td className="py-4 text-sm text-gray-800">
                                    <span className="font-medium">{item.name}</span>
                                    <div className="text-xs text-gray-500">{item.variantLabel} {item.isBonus && '(Bonus Item)'}</div>
                                </td>
                                <td className="py-4 text-center text-sm text-gray-600">{item.quantity}</td>
                                <td className="py-4 text-right text-sm text-gray-600">{item.price === 0 ? 'Free' : `R ${item.price.toFixed(2)}`}</td>
                                <td className="py-4 text-right text-sm font-bold text-gray-900">{item.price === 0 ? 'R 0.00' : `R ${(item.price * item.quantity).toFixed(2)}`}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* TOTALS */}
                <div className="flex justify-end">
                    <div className="w-full max-w-xs space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Subtotal</span>
                            <span>R {lastOrder.total.toFixed(2)}</span>
                        </div>
                        {storeSettings?.company_vat && (
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>Includes VAT (15%)</span>
                                <span>R {(lastOrder.total * 0.15 / 1.15).toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-xl font-black text-gray-900 border-t-2 border-gray-900 pt-2 mt-2">
                            <span>Total</span>
                            <span>R {lastOrder.total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="mt-16 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
                    <p>{storeSettings?.invoice_footer_text || 'Thank you for your business!'}</p>
                </div>
            </div>
        </div>

      </div>
    );
  }

  // --- MAIN RENDER ---
  return (
    <div className="font-sans text-gray-900 antialiased selection:bg-amber-200">
      <AnalyticsTracker settings={storeSettings} />
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-30 bg-white/90 backdrop-blur-md border-b border-gray-100 transition-all">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {/* LOGO REPLACEMENT IN NAVBAR */}
            <img src={ASSETS.logo} alt="Sumami Brand" className="h-8 md:h-10 w-auto" />
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

      <BonusSelector 
        isOpen={isBonusSelectorOpen}
        onClose={() => setIsBonusSelectorOpen(false)}
        onSelect={handleBonusSelect}
        products={products}
        countToSelect={activeBonusVariant === '6-Pack' ? missingBonuses6 : missingBonuses3}
        variant={activeBonusVariant}
      />

      <UpsellSelector 
        isOpen={isUpsellSelectorOpen}
        onClose={() => setIsUpsellSelectorOpen(false)}
        onSelect={handleUpsellSelect}
        products={products}
        variant={activeUpsellVariant}
        shippingMarkup={shippingMarkup} // Pass dynamic markup
      />

      <BundleBuilder 
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        onComplete={handleBuilderComplete}
        products={products}
      />

      <LegalModal 
        isOpen={activePolicy !== null}
        type={activePolicy}
        onClose={() => setActivePolicy(null)}
      />

      {isAdminOpen && (
        <AdminDashboard 
            onClose={() => setIsAdminOpen(false)} 
            onSettingsUpdated={fetchStoreSettings}
            onAddTestProduct={handleAddTestProduct}
        />
      )}

      {/* PayFast Payment Overlay - REPLACING YOCO */}
      {checkoutStep === 'payment' && (
        <PayFastCheckout 
          amountInCents={total * 100}
          customer={customerDetails}
          cartItems={cartItems}
          merchantId={payFastSettings.id}
          merchantKey={payFastSettings.key}
          isLive={payFastSettings.isLive}
          onCancel={() => setCheckoutStep('details')}
        />
      )}

      <CookieConsent />
      <WhatsAppButton />

      {cartCount > 0 && checkoutStep === 'cart' && !isCartOpen && (
          <button
            onClick={() => setIsCartOpen(true)}
            className="fixed bottom-6 right-6 z-40 bg-gray-900 text-white rounded-full shadow-2xl p-4 flex items-center gap-3 animate-in slide-in-from-bottom-6 duration-500 hover:scale-105 active:scale-95 transition-transform group"
          >
             <div className="relative">
                <ShoppingBag className="w-6 h-6" />
                <span className="absolute -top-2 -right-2 bg-amber-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-gray-900">
                  {cartCount}
                </span>
             </div>
             <span className="font-bold pr-2 hidden sm:inline">Checkout</span>
          </button>
      )}

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
              <form onSubmit={handleDetailsSubmit} className="space-y-6 relative">
                
                {/* --- SECURITY: HONEYPOT FIELD (Bot Trap) --- */}
                <input 
                    type="text" 
                    name="fax_number" 
                    tabIndex={-1} 
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    style={{ opacity: 0, position: 'absolute', top: 0, left: 0, height: 0, width: 0, zIndex: -1 }} 
                />

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
                
                <div className="mt-4 flex items-center justify-center gap-2">
                   <ShieldCheck className="w-4 h-4 text-gray-400" />
                   <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Secured by</span>
                   <img src={ASSETS.payfast} alt="PayFast" className="h-5" />
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : (
        /* MAIN LANDING PAGE CONTENT ... */
        <main>
           {/* ... (Existing landing page content preserved) ... */}
           {/* Re-rendering the main landing page to ensure no code loss */}
          <section className="relative min-h-[90vh] flex items-center overflow-hidden">
            <div className="absolute inset-0 z-0">
               <img src={ASSETS.heroBg} alt="Sumami BBQ" className="w-full h-full object-cover" />
               <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
            </div>

            <div className="container mx-auto px-4 z-10 pt-20">
              <div className="max-w-3xl text-white">
                <div className="flex flex-wrap items-center gap-3 mb-6 animate-in slide-in-from-left duration-700">
                  <div className="inline-flex items-center gap-2 bg-amber-500/20 backdrop-blur-sm border border-amber-500/50 rounded-full px-4 py-1">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="text-sm font-medium text-amber-100">Voted Best Artisan Sauce 2024</span>
                  </div>
                   <div className="inline-flex items-center gap-2 bg-green-500/90 backdrop-blur-sm border border-green-400 rounded-full px-4 py-1">
                    <Truck className="w-4 h-4 text-white" />
                    <span className="text-sm font-bold text-white uppercase tracking-wide">Free Nationwide Delivery</span>
                  </div>
                </div>
                
                <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight animate-in slide-in-from-bottom-4 duration-1000">
                  Unlock the <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
                    Fifth Taste.
                  </span>
                </h1>
                <p className="text-xl text-gray-200 mb-8 leading-relaxed max-w-lg animate-in slide-in-from-bottom-4 duration-1000 delay-200">
                  Premium soya sauces infused with authentic South African flavours. 
                  Transform ordinary meals into culinary masterpieces with just a splash.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in duration-1000 delay-300">
                  <button 
                    onClick={() => scrollToSection('flavours')}
                    className="px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-full font-bold text-lg shadow-lg shadow-amber-900/50 transition-all hover:scale-105 text-center cursor-pointer"
                  >
                    Start Shopping
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
          
          {/* NEW: TRUST BAR (HIGH CONVERTING) */}
          <div className="bg-white border-b border-gray-100 py-6">
            <div className="container mx-auto px-4">
                <div className="flex flex-wrap justify-center md:justify-between items-center gap-6 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
                    <div className="flex items-center gap-3">
                        <div className="bg-amber-100 p-2 rounded-full"><Award className="w-6 h-6 text-amber-600" /></div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-900">100% Handcrafted</span>
                            <span className="text-xs text-gray-500">Small Batch Quality</span>
                        </div>
                    </div>
                    <div className="h-8 w-px bg-gray-200 hidden md:block"></div>
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-full"><ShieldCheck className="w-6 h-6 text-blue-600" /></div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-900">Verified Merchant</span>
                            <span className="text-xs text-gray-500">Secure Checkout</span>
                        </div>
                    </div>
                    <div className="h-8 w-px bg-gray-200 hidden md:block"></div>
                    <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-full"><Truck className="w-6 h-6 text-green-600" /></div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-900">The Courier Guy</span>
                            <span className="text-xs text-gray-500">Reliable Delivery</span>
                        </div>
                    </div>
                     <div className="h-8 w-px bg-gray-200 hidden md:block"></div>
                     <div className="flex items-center gap-3">
                        <div className="bg-yellow-100 p-2 rounded-full"><ThumbsUp className="w-6 h-6 text-yellow-600" /></div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-900">5-Star Reviews</span>
                            <span className="text-xs text-gray-500">Happy Customers</span>
                        </div>
                    </div>
                </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-600 to-green-700 text-white py-4 text-center text-base font-black uppercase tracking-widest shadow-lg relative z-20">
            <p className="flex items-center justify-center gap-3 animate-pulse">
              <Truck className="w-5 h-5" />
              <span>Limited Offer: Free Shipping on ALL Orders!</span>
              <Truck className="w-5 h-5 transform scale-x-[-1]" />
            </p>
          </div>

          <section id="flavours" className="py-20 bg-gray-50 scroll-mt-28">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto mb-16">
                 <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 text-center md:text-left relative overflow-hidden shadow-sm">
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
                  Shop individual flavours or select a curated value bundle.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* COMBINED PRODUCT LIST: Sauces + Bundles = 9 Items (Perfect 3x3 Grid) */}
                {[
                    ...products.filter(p => p.category === 'sauce'),
                    ...products.filter(p => p.category === 'bundle')
                ].map((product) => (
                  <div key={product.id} className={`group relative bg-white rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100 flex flex-col ${product.highlight ? 'ring-2 ring-amber-500' : ''}`}>
                    <div className="aspect-[4/3] bg-gray-50 overflow-hidden relative">
                      <div className="absolute inset-0 bg-gray-100 animate-pulse"></div>
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                        loading="lazy"
                      />
                      {product.badge && (
                        <div className="absolute top-4 right-4 bg-amber-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg z-10">
                           {product.badge}
                        </div>
                      )}
                      {product.highlight && (
                         <div className="absolute top-4 left-4 bg-gray-900 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg z-10">
                           Best Value
                        </div>
                      )}
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="mb-4">
                        <p className="text-amber-600 font-bold text-xs tracking-wider uppercase mb-1">{product.subName}</p>
                        <h3 className="text-2xl font-bold text-gray-900 leading-tight">{product.name}</h3>
                      </div>
                      <p className="text-gray-600 mb-6 flex-1 text-sm leading-relaxed">{product.description}</p>
                      
                      <div className="flex items-center gap-2 mb-4">
                         <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                         <span className="text-xs font-bold text-green-700 uppercase">In Stock & Ready to Ship</span>
                      </div>

                      <div className="mt-auto">
                        {product.category === 'sauce' ? (
                            <div className="grid grid-cols-2 gap-3">
                              <button 
                                onClick={() => addSaucePack(product, 3)}
                                className="px-2 py-3 bg-white border-2 border-gray-900 text-gray-900 rounded-lg font-bold hover:bg-gray-50 transition-colors text-sm flex flex-col items-center justify-center"
                              >
                                <span>Buy 3 Pack</span>
                                <span className="text-xs font-normal text-gray-500">R {((product.price * 3) + shippingMarkup).toFixed(2)}</span>
                              </button>
                              <button 
                                onClick={() => addSaucePack(product, 6)}
                                className="px-2 py-3 bg-gray-900 text-white rounded-lg font-bold hover:bg-amber-600 transition-colors text-sm shadow-lg flex flex-col items-center justify-center relative overflow-hidden group/btn"
                              >
                                <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 skew-x-12"></div>
                                <span>Buy 6 Pack</span>
                                <span className="text-xs text-amber-400 font-bold">R {((product.price * 6) + shippingMarkup).toFixed(2)}</span>
                              </button>
                            </div>
                        ) : (
                            <button 
                                onClick={() => handleBundleClick(product)}
                                className="w-full px-2 py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition-all shadow-lg text-base flex flex-col items-center justify-center relative overflow-hidden group/btn active:scale-95"
                            >
                                <span className="relative z-10">{product.id === 'starter-pack' ? 'Build Your Trio' : 'Add to Cart'}</span>
                                <span className="relative z-10 text-xs font-medium opacity-90">R {product.price.toFixed(2)}</span>
                            </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ... [Rest of content] ... */}
          <section className="py-20 bg-gray-900 text-white relative overflow-hidden">
             <div className="absolute inset-0 opacity-20">
                <img src={ASSETS.lifestyle} alt="Cooking" className="w-full h-full object-cover" />
             </div>
             <div className="container mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center gap-12">
                <div className="flex-1 space-y-8">
                  <h2 className="text-4xl md:text-5xl font-black leading-tight">More than just sauce.<br/>It's a secret ingredient.</h2>
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

          {/* REMOVED SEPARATE BUNDLES SECTION - NOW MERGED ABOVE */}

          <section className="py-20 bg-gray-50 relative overflow-hidden">
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
                      <img src={ASSETS.payfast} alt="PayFast" className="h-8" />
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

          {/* ADDED PADDING BOTTOM (pb-36) TO PREVENT FLOATING BUTTONS FROM BLOCKING FOOTER */}
          <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800 pb-36 md:pb-12">
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
                    <li><button onClick={() => setActivePolicy('returns')} className="hover:text-white transition-colors">Returns Policy</button></li>
                  </ul>
                </div>
              </div>
              
              {/* RESTRUCTURED BOTTOM BAR: Admin Button Centered, Padding Added */}
              <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-gray-800 gap-4">
                 <p className="text-sm order-2 md:order-1">&copy; 2024 Sumami Brand / soyasauce.co.za. All rights reserved. <span className="opacity-50 text-xs ml-2">v2.1</span></p>
                 
                 {/* CENTERED ADMIN BUTTON */}
                 <div className="order-3 md:order-2">
                     <button onClick={() => setIsAdminOpen(true)} className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-400 font-bold uppercase tracking-wide transition-colors py-2 px-4 rounded-full hover:bg-gray-800">
                        <Lock className="w-3 h-3" /> Admin Access
                    </button>
                 </div>

                 <div className="flex gap-4 order-1 md:order-3 items-center">
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
                           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 hover:text-white cursor-pointer transition-colors">
                             <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                           </svg>
                        </a>
                    )}
                    {storeSettings?.pinterest_url && (
                        <a href={storeSettings.pinterest_url} target="_blank" rel="noopener noreferrer" aria-label="Pinterest">
                           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 hover:text-white cursor-pointer transition-colors">
                              <path d="M8 12a4 4 0 1 0 8 0 4 4 0 0 0-8 0" />
                              <path d="M10.7 13.9L8 21" />
                           </svg>
                        </a>
                    )}
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
