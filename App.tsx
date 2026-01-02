import React, { useState, useEffect } from 'react';
import { ShoppingBag, Star, Check, ChevronRight, Menu, MapPin, Phone, Instagram, Facebook, Truck, BookOpen, Gift, Percent, Zap, MessageCircle, Download } from 'lucide-react';
import { PRODUCTS, BUNDLES, ASSETS, WC_CONFIG } from './constants';
import { Product, CartItem, CustomerDetails } from './types';
import Cart from './components/Cart';
import YocoCheckout from './components/YocoCheckout';
import BundleBuilder from './components/BundleBuilder';
import LegalModal, { PolicyType } from './components/LegalModal';

// Shipping is now all inclusive (FREE)
const SHIPPING_COST = 0;

const App: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  
  // Legal Modal State
  const [activePolicy, setActivePolicy] = useState<PolicyType>(null);

  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'details' | 'payment' | 'success'>('cart');
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    firstName: '', lastName: '', email: '', phone: '', address: '', city: '', zipCode: ''
  });

  // State to hold the order details for the Success View (after cart is cleared)
  const [lastOrder, setLastOrder] = useState<{items: CartItem[], total: number, discount: number} | null>(null);

  // --- CALCULATION LOGIC INCLUDING MIX & MATCH DISCOUNT ---
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  // Calculate Mix & Match Discount
  const packsOf3Count = cartItems.reduce((acc, item) => {
    if (item.variantLabel === '3-Pack' || item.id === 'starter-pack') {
      return acc + item.quantity;
    }
    return acc;
  }, 0);

  const discountPairs = Math.floor(packsOf3Count / 2);
  const discountAmount = discountPairs * 150;
  
  const total = subtotal - discountAmount + SHIPPING_COST;
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Handlers
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  // Standard Add to Cart
  const addToCart = (product: Product, quantity: number = 1, options?: string[], variantLabel?: string, overridePrice?: number) => {
    setCartItems(prev => {
      const uniqueId = `${product.id}-${variantLabel || ''}-${options?.sort().join(',') || ''}`;
      
      const existing = prev.find(item => {
          const itemUniqueId = `${item.id}-${item.variantLabel || ''}-${item.selectedOptions?.sort().join(',') || ''}`;
          return itemUniqueId === uniqueId;
      });

      if (existing) {
        return prev.map(item => {
           const itemUniqueId = `${item.id}-${item.variantLabel || ''}-${item.selectedOptions?.sort().join(',') || ''}`;
           if (itemUniqueId === uniqueId) {
             return { ...item, quantity: item.quantity + quantity };
           }
           return item;
        });
      }
      return [...prev, { 
        ...product, 
        quantity, 
        selectedOptions: options, 
        variantLabel,
        price: overridePrice || product.price 
      }];
    });
    setIsCartOpen(true);
  };

  const addSaucePack = (product: Product, size: 3 | 6) => {
    const price = size === 3 ? 315 : 480;
    addToCart(product, 1, undefined, `${size}-Pack`, price);
  };

  const handleBundleClick = (bundle: Product) => {
    if (bundle.id === 'starter-pack') {
      setIsBuilderOpen(true);
    } else {
      addToCart(bundle);
    }
  };

  const handleBuilderComplete = (selectedIds: string[]) => {
    const trioProduct = BUNDLES.find(b => b.id === 'starter-pack');
    if (trioProduct) {
      const selectedNames = selectedIds.map(id => {
        const p = PRODUCTS.find(p => p.id === id);
        return p ? p.name.replace('Infused With ', '') : id;
      });
      addToCart(trioProduct, 1, selectedNames);
    }
  };

  const updateCartItemQuantity = (index: number, delta: number) => {
      setCartItems(prev => {
          const newCart = [...prev];
          const item = newCart[index];
          const newQty = Math.max(0, item.quantity + delta);
          if (newQty === 0) {
              return newCart.filter((_, i) => i !== index);
          }
          newCart[index] = { ...item, quantity: newQty };
          return newCart;
      });
  };
  
  const removeCartItem = (index: number) => {
      setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  const startCheckout = () => {
    setIsCartOpen(false);
    setCheckoutStep('details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const syncToWooCommerce = async (details: CustomerDetails, items: CartItem[], discount: number) => {
    // 1. Prepare Line Items
    const lineItems = items.map(item => {
        let note = "";
        if (item.variantLabel) note += `[${item.variantLabel}] `;
        if (item.selectedOptions && item.selectedOptions.length > 0) {
            note += `Selection: ${item.selectedOptions.join(', ')}`;
        }
        return {
            product_id: item.wcId,
            quantity: item.quantity,
            meta_data: note ? [{ key: "Customer Selection", value: note }] : []
        };
    });

    const fullNote = items.map(i => {
        if (i.selectedOptions) return `${i.name}: ${i.selectedOptions.join(', ')}`;
        if (i.variantLabel) return `${i.name} (${i.variantLabel})`;
        return null;
    }).filter(Boolean).join(' | ');

    // 2. Prepare Fees (Negative Fee for Discount)
    const feeLines = [];
    if (discount > 0) {
      feeLines.push({
        name: 'Mix & Match Savings',
        total: String(-discount), // Negative value reduces the order total
        tax_status: 'none'
      });
    }

    // 3. Prepare Shipping (Force Free Shipping line)
    const shippingLines = [
      {
        method_id: 'flat_rate',
        method_title: 'Free Shipping (Landing Page Special)',
        total: '0.00'
      }
    ];

    const orderData = {
      payment_method: 'yoco',
      payment_method_title: 'Yoco Card Payment',
      set_paid: true,
      billing: {
        first_name: details.firstName,
        last_name: details.lastName,
        address_1: details.address,
        city: details.city,
        postcode: details.zipCode,
        country: 'ZA',
        email: details.email,
        phone: details.phone
      },
      line_items: lineItems,
      fee_lines: feeLines,         // Added fees
      shipping_lines: shippingLines, // Added forced free shipping
      customer_note: `Generated by Landing Page. ${fullNote}`
    };

    console.group('🔌 WooCommerce Integration Sync');
    console.log('Payload:', orderData);
    console.groupEnd();
    
    // In a real app, you would fetch() to your backend proxy here.
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutStep('payment');
  };

  const handlePaymentSuccess = () => {
    // 1. Save order details for the receipt view
    setLastOrder({
      items: [...cartItems],
      total: total,
      discount: discountAmount
    });

    // 2. Sync to Backend (Pass discount amount)
    syncToWooCommerce(customerDetails, cartItems, discountAmount);

    // 3. Move to success and clear cart
    setCheckoutStep('success');
    setCartItems([]);
  };

  // Construct WhatsApp Message
  const getWhatsAppLink = () => {
    if (!lastOrder) return '';
    
    const itemsList = lastOrder.items.map(i => 
      `${i.quantity}x ${i.name} ${i.variantLabel ? `(${i.variantLabel})` : ''}`
    ).join(', ');
    
    const message = `Hi Sumami Brand! 👋 I just placed an order. 
    
Name: ${customerDetails.firstName} ${customerDetails.lastName}
Phone: ${customerDetails.phone}
Total: R${lastOrder.total.toFixed(2)}
Items: ${itemsList}

Please confirm you received it!`;

    return `https://wa.me/27662434867?text=${encodeURIComponent(message)}`;
  };

  // Views
  if (checkoutStep === 'success' && lastOrder) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-lg">
          
          <div className="bg-white p-8 rounded-3xl shadow-2xl text-center mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-2">Order Confirmed!</h1>
            <p className="text-gray-500 mb-6">
              Thank you, {customerDetails.firstName}. We've sent an invoice to <strong>{customerDetails.email}</strong>.
            </p>
            
            {/* WHATSAPP CTA */}
            <a 
              href={getWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-4 rounded-xl font-bold shadow-lg shadow-green-200 hover:shadow-xl transition-all active:scale-95 mb-6"
            >
              <MessageCircle className="w-6 h-6" />
              <span>Confirm Order on WhatsApp</span>
            </a>

            {/* DIGITAL RECEIPT */}
            <div className="bg-gray-50 rounded-xl p-6 text-left border border-gray-100">
               <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-2">
                 <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Receipt</span>
                 <span className="text-xs font-bold text-gray-400">{new Date().toLocaleDateString()}</span>
               </div>
               
               <div className="space-y-3 mb-4">
                 {lastOrder.items.map((item, idx) => (
                   <div key={idx} className="flex justify-between text-sm">
                     <span className="text-gray-800">
                       <span className="font-bold">{item.quantity}x</span> {item.name} <span className="text-gray-400 text-xs">{item.variantLabel}</span>
                     </span>
                     <span className="font-medium">R {(item.price * item.quantity).toFixed(2)}</span>
                   </div>
                 ))}
               </div>

               <div className="border-t border-gray-200 pt-3 space-y-1">
                 {lastOrder.discount > 0 && (
                   <div className="flex justify-between text-sm text-amber-600">
                     <span>Discount</span>
                     <span>- R {lastOrder.discount.toFixed(2)}</span>
                   </div>
                 )}
                 <div className="flex justify-between text-sm text-green-600">
                   <span>Shipping</span>
                   <span>FREE</span>
                 </div>
                 <div className="flex justify-between text-xl font-black text-gray-900 mt-2">
                   <span>Total Paid</span>
                   <span>R {lastOrder.total.toFixed(2)}</span>
                 </div>
               </div>
            </div>
          </div>

          <div className="bg-amber-50 p-6 rounded-2xl text-left border border-amber-100 flex items-start gap-4 shadow-sm">
             <div className="bg-amber-100 p-3 rounded-lg">
                <Gift className="w-6 h-6 text-amber-600" />
             </div>
             <div>
                <h3 className="font-bold text-amber-900 mb-1">Check your Inbox!</h3>
                <p className="text-sm text-amber-800/80 mb-2">
                  We've emailed you <strong>The Sumami Alchemy Cookbook</strong>. 
                </p>
                <p className="text-xs text-amber-600">
                   (Check your Spam folder if you don't see it within 5 minutes)
                </p>
             </div>
          </div>

          <div className="text-center mt-8">
            <button 
              onClick={() => setCheckoutStep('cart')}
              className="text-gray-400 font-medium hover:text-gray-900 transition-colors"
            >
              Back to Home
            </button>
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
        shippingCost={SHIPPING_COST}
        freeShippingThreshold={0}
        discountAmount={discountAmount}
        packsOf3Count={packsOf3Count}
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

      {/* Yoco Payment Overlay */}
      {checkoutStep === 'payment' && (
        <YocoCheckout 
          amountInCents={total * 100}
          customer={customerDetails}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setCheckoutStep('details')}
        />
      )}

      {/* Checkout Details Form */}
      {checkoutStep === 'details' ? (
        <div className="min-h-screen pt-24 pb-12 bg-gray-50">
          <div className="container mx-auto px-4 max-w-2xl">
            <button onClick={() => setCheckoutStep('cart')} className="text-gray-500 mb-6 hover:text-gray-900 flex items-center gap-1">
               &larr; Back to Shopping
            </button>
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold mb-6 border-b pb-4">Shipping Details</h2>
              <form onSubmit={handleDetailsSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input 
                      required 
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-amber-500 outline-none"
                      value={customerDetails.firstName}
                      onChange={e => setCustomerDetails({...customerDetails, firstName: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input 
                      required 
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-amber-500 outline-none"
                      value={customerDetails.lastName}
                      onChange={e => setCustomerDetails({...customerDetails, lastName: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input 
                      type="email" 
                      required 
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-amber-500 outline-none"
                      value={customerDetails.email}
                      onChange={e => setCustomerDetails({...customerDetails, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input 
                      type="tel" 
                      required 
                      placeholder="e.g. 082 123 4567"
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-amber-500 outline-none"
                      value={customerDetails.phone}
                      onChange={e => setCustomerDetails({...customerDetails, phone: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
                  <input 
                    required 
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-amber-500 outline-none"
                    value={customerDetails.address}
                    onChange={e => setCustomerDetails({...customerDetails, address: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input 
                      required 
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-amber-500 outline-none"
                      value={customerDetails.city}
                      onChange={e => setCustomerDetails({...customerDetails, city: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                    <input 
                      required 
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-amber-500 outline-none"
                      value={customerDetails.zipCode}
                      onChange={e => setCustomerDetails({...customerDetails, zipCode: e.target.value})}
                    />
                  </div>
                </div>

                {/* Order Summary in Checkout */}
                <div className="bg-gray-50 p-4 rounded-lg mt-6">
                   <div className="flex justify-between text-sm mb-2">
                     <span>Subtotal</span>
                     <span>R {subtotal.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between text-sm mb-2 font-bold text-green-600">
                     <span>Shipping</span>
                     <span>FREE</span>
                   </div>
                   {discountAmount > 0 && (
                     <div className="flex justify-between text-sm mb-2 font-bold text-amber-600">
                       <span>Bulk Savings (Mix & Match)</span>
                       <span>- R {discountAmount.toFixed(2)}</span>
                     </div>
                   )}
                   {/* Bonus visual in checkout */}
                   <div className="flex justify-between text-xs text-amber-600 mb-2">
                      <span>Bonus: Cookbook & Golden Ticket</span>
                      <span>FREE</span>
                   </div>
                   <div className="flex justify-between text-xl font-bold border-t pt-2 mt-2">
                     <span>Total</span>
                     <span>R {total.toFixed(2)}</span>
                   </div>
                </div>

                <button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-95 text-lg">
                  Continue to Payment (R {total.toFixed(2)})
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        /* MAIN LANDING PAGE CONTENT */
        <main>
          {/* Hero Section */}
          <section className="relative min-h-[90vh] flex items-center overflow-hidden">
            <div className="absolute inset-0 z-0">
               <img src={ASSETS.heroBg} alt="Sumami BBQ" className="w-full h-full object-cover" />
               <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
            </div>

            <div className="container mx-auto px-4 z-10 pt-20">
              <div className="max-w-2xl text-white">
                <div className="inline-flex items-center gap-2 bg-amber-500/20 backdrop-blur-sm border border-amber-500/50 rounded-full px-4 py-1 mb-6">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-sm font-medium text-amber-100">Voted Best Artisan Sauce 2024</span>
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
            
            {/* Seal Floating */}
            <div className="absolute bottom-10 right-10 hidden md:block">
                <img src={ASSETS.seal} alt="Premium Quality Seal" className="w-32 h-32 md:w-48 md:h-48 drop-shadow-2xl" />
            </div>
          </section>

          {/* Shipping Banner */}
          <div className="bg-gray-900 text-white py-3 text-center text-sm font-medium">
            <p className="flex items-center justify-center gap-2">
              <Truck className="w-4 h-4 text-amber-500" />
              <span className="text-amber-400 font-bold">FREE Shipping on ALL Orders!</span>
            </p>
          </div>

          {/* Social Proof Strip */}
          <div className="bg-amber-50 py-10 border-b border-amber-100">
            <div className="container mx-auto px-4 flex flex-wrap justify-center gap-8 md:gap-16 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
              {['Premium Quality', 'Locally Produced', 'Fermented Soya Sauce', 'Hand Crafted'].map((item) => (
                <div key={item} className="flex items-center gap-2 font-bold text-gray-700">
                  <Check className="w-5 h-5 text-amber-600" /> {item}
                </div>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <section id="flavours" className="py-20 bg-white scroll-mt-28">
            <div className="container mx-auto px-4">
              
              {/* SMART SAVER BANNER - EXPLAINS MIX & MATCH */}
              <div className="max-w-4xl mx-auto mb-16">
                 <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 text-center md:text-left relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 text-amber-100">
                        <Percent className="w-64 h-64 opacity-20 rotate-12" />
                    </div>
                    <div className="bg-amber-100 p-4 rounded-full text-amber-600 relative z-10">
                        <Zap className="w-8 h-8 fill-current" />
                    </div>
                    <div className="flex-1 relative z-10">
                        <h3 className="text-2xl font-black text-gray-900 mb-2">Smart Saver Tip: Mix & Match</h3>
                        <p className="text-gray-600">
                           Don't want 6 of the same flavour? <span className="font-bold text-amber-800">Buy ANY 2 x "3-Packs" and we'll automatically drop the price.</span> 
                           You get the bulk savings (R150 off) even if you choose different flavours!
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
                {PRODUCTS.map((product) => (
                  <div key={product.id} className="group relative bg-gray-50 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100 flex flex-col">
                    <div className="aspect-[4/3] bg-white overflow-hidden relative">
                      <div className="absolute inset-0 bg-gray-100 animate-pulse"></div>
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                        loading="lazy"
                      />
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="mb-4">
                        <p className="text-amber-600 font-bold text-xs tracking-wider uppercase mb-1">{product.subName}</p>
                        <h3 className="text-2xl font-bold text-gray-900">{product.name}</h3>
                      </div>
                      <p className="text-gray-600 mb-6 flex-1">{product.description}</p>
                      
                      <div className="mt-auto">
                        <div className="grid grid-cols-2 gap-3">
                          <button 
                            onClick={() => addSaucePack(product, 3)}
                            className="px-4 py-3 bg-white border-2 border-gray-900 text-gray-900 rounded-lg font-bold hover:bg-gray-50 transition-colors text-sm"
                          >
                            Buy 3 Pack <span className="block text-xs font-normal text-gray-500">R 315.00</span>
                          </button>
                          <button 
                            onClick={() => addSaucePack(product, 6)}
                            className="px-4 py-3 bg-gray-900 text-white rounded-lg font-bold hover:bg-amber-600 transition-colors text-sm shadow-lg"
                          >
                            Buy 6 Pack <span className="block text-xs font-normal text-gray-300">R 480.00</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Feature/Lifestyle Section */}
          <section className="py-20 bg-gray-900 text-white relative overflow-hidden">
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

          {/* NEW BONUS VALUE STACK SECTION (REVISED: Only 2 items) */}
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
             </div>
          </section>

          {/* Bundles (Upsell) */}
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
                      {bundle.highlight && (
                        <div className="absolute top-0 inset-x-0 bg-amber-500 text-white text-center py-1 text-sm font-bold uppercase tracking-wide z-10">
                           Most Popular &bull; Free Shipping
                        </div>
                      )}
                      <div className="aspect-video overflow-hidden">
                        <img src={bundle.image} alt={bundle.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-8 flex flex-col flex-1">
                        <h3 className="text-2xl font-bold text-gray-900">{bundle.name}</h3>
                        <p className="text-amber-600 font-medium mb-4">{bundle.subName}</p>
                        <p className="text-gray-600 mb-6 flex-1">{bundle.description}</p>
                        
                        {/* Bonus Callout in Card */}
                        <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 mb-6 flex items-center gap-2">
                           <Gift className="w-4 h-4 text-amber-600" />
                           <span className="text-xs font-bold text-amber-800 uppercase">Includes FREE Cookbook</span>
                        </div>

                        <div className="mt-auto pt-6 border-t border-gray-100">
                          <div className="flex items-end gap-2 mb-4">
                             <span className="text-3xl font-black text-gray-900">R {bundle.price}</span>
                             <span className="text-lg text-gray-400 line-through mb-1">R {Math.round(bundle.price * 1.15)}</span>
                          </div>
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

          {/* Footer */}
          <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
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
                    <li className="flex items-center gap-2">info@biznizart.co.za</li>
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
                 <p className="text-sm">&copy; 2024 Sumami Brand / biznizart.co.za. All rights reserved.</p>
                 <div className="flex gap-4 mt-4 md:mt-0">
                    <Instagram className="w-5 h-5 hover:text-white cursor-pointer" />
                    <Facebook className="w-5 h-5 hover:text-white cursor-pointer" />
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