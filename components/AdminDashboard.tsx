
import React, { useState, useEffect } from 'react';
import { 
  Lock, RefreshCw, X, TrendingUp, ShoppingBag, DollarSign, 
  Calendar, Eye, CheckSquare, Square, Truck, Printer, 
  Archive, Clock, Search, Filter, RotateCcw, Settings, 
  Key, Save, ToggleLeft, ToggleRight, Mail, BarChart2, 
  MapPin, Smartphone, Monitor, Send, Link as LinkIcon, 
  AlertTriangle, Home, Zap, ShieldCheck, ArrowRight, 
  Database, CreditCard, AlertCircle, EyeOff, Beaker, 
  Server, Activity, FileText, Briefcase, Tag, Package, 
  Calculator, Timer, UserCheck, Edit2 
} from 'lucide-react';
import { supabase } from '../lib/supabase/client';
import { PAYFAST_DEFAULTS, ADMIN_EMAIL, ASSETS } from '../constants';
import { StoreSettings } from '../types';

interface AdminDashboardProps {
  onClose: () => void;
  onSettingsUpdated?: () => void;
  onAddTestProduct: () => void;
}

const COURIER_PRESETS = [
  { name: 'The Courier Guy', url: 'https://portal.thecourierguy.co.za/track' },
  { name: 'Fastway', url: 'https://www.fastway.co.za/our-services/track-your-parcel' },
  { name: 'Aramex', url: 'https://www.aramex.com/za/en/track/shipments' },
  { name: 'PostNet', url: 'https://www.postnet.co.za/tracker' },
  { name: 'Paxi', url: 'https://paxi.co.za/track' },
  { name: 'Other', url: '' }
];

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose, onSettingsUpdated, onAddTestProduct }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Auth State
  const [authStep, setAuthStep] = useState<'init' | 'sending' | 'verify'>('init');
  const [serverCode, setServerCode] = useState<string | null>(null);
  const [inputCode, setInputCode] = useState('');
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);
  
  // Dashboard Data State
  const [orders, setOrders] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modal & Selection State
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [activeModal, setActiveModal] = useState<'none' | 'invoice' | 'fulfillment' | 'editProduct'>('none');
  
  // Fulfillment State
  const [trackingInput, setTrackingInput] = useState({ courier: 'The Courier Guy', code: '', url: 'https://portal.thecourierguy.co.za/track' });
  const [fulfillmentType, setFulfillmentType] = useState<'courier' | 'collection'>('courier');
  const [isSendingTracking, setIsSendingTracking] = useState(false);
  
  // View State
  const [viewTab, setViewTab] = useState<'active' | 'history' | 'analytics' | 'settings' | 'inventory'>('active');

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');

  // Settings State
  const [settings, setSettings] = useState<StoreSettings>({ 
    payfast_merchant_id: '', 
    payfast_merchant_key: '', 
    is_live_mode: false,
    facebook_url: '',
    instagram_url: '',
    pinterest_url: '',
    youtube_url: '',
    tiktok_url: '',
    meta_pixel_id: '',
    google_analytics_id: '',
    company_name: '',
    company_address: '',
    company_vat: '',
    company_reg: '',
    invoice_footer_text: '',
    shipping_markup: 150
  });
  const [savingSettings, setSavingSettings] = useState(false);
  
  // Inventory Edit State
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productEdits, setProductEdits] = useState<{price: number, badge: string}>({ price: 0, badge: '' });
  
  // Stats
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0
  });

  // Check for existing session on mount
  useEffect(() => {
    if (sessionStorage.getItem('sumami_admin_auth') === 'true') {
        setIsAuthenticated(true);
        fetchOrders();
        fetchSettings();
    }
  }, []);

  // --- TIMER LOGIC ---
  useEffect(() => {
    let timer: any;
    if (authStep === 'verify' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && authStep === 'verify') {
      setServerCode(null); 
      setAuthStep('init');
      setError('Session expired. Code invalid.');
    }
    return () => clearInterval(timer);
  }, [authStep, timeLeft]);
  
  // Fetch Inventory/Analytics when tab is active
  useEffect(() => {
      if (isAuthenticated) {
          if (viewTab === 'inventory') fetchInventory();
          if (viewTab === 'analytics') fetchAnalytics();
      }
  }, [isAuthenticated, viewTab]);

  const calculateStats = (data: any[]) => {
    // Only count paid or shipped orders for revenue, exclude pending/cancelled if desired
    // For now, we sum everything that isn't explicitly 'cancelled'
    const validOrders = data.filter(o => o.status !== 'cancelled');
    const revenue = validOrders.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0) || 0;
    const count = validOrders.length || 0;
    
    setStats({
      totalRevenue: revenue,
      totalOrders: count,
      avgOrderValue: count > 0 ? revenue / count : 0
    });
  };

  // --- SECURITY: SEND OTP ---
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
        setError("Database connection failed.");
        return;
    }

    setAuthStep('sending');
    setError('');
    setTimeLeft(30);

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setServerCode(code); 

    console.log("%c🔐 ADMIN OTP:", "color: orange; font-size: 16px; font-weight: bold;", code);

    try {
        const { error: fnError } = await supabase.functions.invoke('send-admin-otp', {
            body: {
                email: ADMIN_EMAIL,
                code: code
            }
        });

        if (fnError) {
             console.error("Function Error:", fnError);
             // Fallback for dev/testing if email fails
             // alert(`DEV MODE CODE: ${code}`);
        }
        setAuthStep('verify');

    } catch (err: any) {
        console.error("OTP Send Failed:", err);
        setError(`Email failed. Check console. Code sent to console for dev.`);
        setAuthStep('verify');
    }
  };

  const handleVerifyCode = (e: React.FormEvent) => {
      e.preventDefault();
      if (!serverCode) {
          setError("Session expired.");
          return;
      }
      if (inputCode === serverCode) {
          setIsAuthenticated(true);
          sessionStorage.setItem('sumami_admin_auth', 'true');
          fetchOrders();
          fetchSettings();
      } else {
          setError("Invalid code.");
          setInputCode('');
      }
  };

  const fetchOrders = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
      calculateStats(data || []);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('site_visits')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      setAnalyticsData(data || []);
    } catch(err) {
      console.error("Analytics fetch error", err);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchInventory = async () => {
      if (!supabase) return;
      setLoading(true);
      try {
          const { data, error } = await supabase.from('products').select('*').order('name');
          if (error) throw error;
          setInventory(data || []);
      } catch (err) {
          console.error("Inventory fetch error", err);
      } finally {
          setLoading(false);
      }
  };
  
  const handleEditProductClick = (product: any) => {
      setEditingProduct(product);
      setProductEdits({ price: product.price, badge: product.badge || '' });
      setActiveModal('editProduct');
  };
  
  const handleSaveProduct = async () => {
      if (!supabase || !editingProduct) return;
      try {
          const { error } = await supabase.from('products').update({
              price: productEdits.price,
              badge: productEdits.badge === '' ? null : productEdits.badge
          }).eq('id', editingProduct.id);
          
          if (error) throw error;
          
          setInventory(prev => prev.map(p => p.id === editingProduct.id ? { ...p, price: productEdits.price, badge: productEdits.badge === '' ? null : productEdits.badge } : p));
          setActiveModal('none');
          setEditingProduct(null);
      } catch (err: any) {
          alert("Error updating product: " + err.message);
      }
  };

  const fetchSettings = async () => {
    if (!supabase) return;
    try {
      const { data } = await supabase.from('store_settings').select('*').single();
      if (data) {
        setSettings({
            ...data,
            payfast_merchant_id: data.payfast_merchant_id || PAYFAST_DEFAULTS.merchant_id,
            payfast_merchant_key: data.payfast_merchant_key || PAYFAST_DEFAULTS.merchant_key,
            facebook_url: data.facebook_url || '',
            instagram_url: data.instagram_url || '',
            pinterest_url: data.pinterest_url || '',
            youtube_url: data.youtube_url || '',
            tiktok_url: data.tiktok_url || '',
            meta_pixel_id: data.meta_pixel_id || '',
            google_analytics_id: data.google_analytics_id || '',
            company_name: data.company_name || '',
            company_address: data.company_address || '',
            company_vat: data.company_vat || '',
            company_reg: data.company_reg || '',
            invoice_footer_text: data.invoice_footer_text || '',
            shipping_markup: data.shipping_markup !== undefined ? data.shipping_markup : 150
        });
      }
    } catch (err) {
      console.error("Error fetching settings", err);
    }
  };

  const saveSettings = async () => {
    if (!supabase) return;
    setSavingSettings(true);
    try {
        const { error } = await supabase.from('store_settings').upsert({
            id: 1, 
            payfast_merchant_id: settings.payfast_merchant_id.trim(),
            payfast_merchant_key: settings.payfast_merchant_key.trim(),
            is_live_mode: settings.is_live_mode,
            facebook_url: settings.facebook_url?.trim(),
            instagram_url: settings.instagram_url?.trim(),
            pinterest_url: settings.pinterest_url?.trim(),
            youtube_url: settings.youtube_url?.trim(),
            tiktok_url: settings.tiktok_url?.trim(),
            meta_pixel_id: settings.meta_pixel_id?.trim(),
            google_analytics_id: settings.google_analytics_id?.trim(),
            company_name: settings.company_name?.trim(),
            company_address: settings.company_address?.trim(),
            company_vat: settings.company_vat?.trim(),
            company_reg: settings.company_reg?.trim(),
            invoice_footer_text: settings.invoice_footer_text?.trim(),
            shipping_markup: Number(settings.shipping_markup)
        });

        if (error) throw error;
        if (onSettingsUpdated) onSettingsUpdated();
        alert("Settings Saved!");
    } catch (err: any) {
        alert("Failed to save settings: " + err.message);
    } finally {
        setSavingSettings(false);
    }
  };

  // --- FULFILLMENT LOGIC ---
  const initiateFulfillment = (order: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (order.status === 'shipped') {
        if (window.confirm("Undo completion? This will move the order back to Active.")) {
             updateOrderStatus(order.id, 'paid');
        }
        return;
    }
    setSelectedOrder(order);
    setTrackingInput({ 
        courier: 'The Courier Guy', 
        code: '', 
        url: 'https://portal.thecourierguy.co.za/track' 
    });
    setFulfillmentType('courier');
    setActiveModal('fulfillment');
  };

  const confirmFulfillment = async () => {
    if (!selectedOrder) return;
    if (fulfillmentType === 'courier' && !trackingInput.code) {
        alert("Waybill / Tracking number is required for courier shipments.");
        return;
    }

    setIsSendingTracking(true);
    try {
        const isCollection = fulfillmentType === 'collection';
        const finalCourier = isCollection ? 'Self Collection' : trackingInput.courier;
        const finalTracking = isCollection ? 'Ready for Pickup' : trackingInput.code;
        const finalUrl = isCollection ? '' : trackingInput.url;

        if (supabase) {
            const { error } = await supabase
                .from('orders')
                .update({ 
                    tracking_number: finalTracking,
                    courier_name: finalCourier,
                    tracking_url: finalUrl,
                    status: 'shipped' 
                })
                .eq('id', selectedOrder.id);
            if (error) throw error;

            await supabase.functions.invoke('resend-shipping-email', {
                body: {
                  customerName: selectedOrder.customer_name,
                  customerEmail: selectedOrder.email,
                  orderId: selectedOrder.id.toString(),
                  trackingNumber: finalTracking,
                  courierName: finalCourier,
                  trackingUrl: finalUrl
                }
            });
        }

        const updatedOrder = { 
            ...selectedOrder, 
            tracking_number: finalTracking,
            courier_name: finalCourier,
            tracking_url: finalUrl,
            status: 'shipped'
        };
        
        setOrders(prev => prev.map(o => o.id === selectedOrder.id ? updatedOrder : o));
        setActiveModal('none');
        setSelectedOrder(null);

    } catch (err: any) {
        console.error("Fulfillment Error:", err);
        alert("Failed to fulfill order: " + err.message);
    } finally {
        setIsSendingTracking(false);
    }
  };

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (supabase) {
          await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
      }
  };

  const handlePrintInvoice = () => window.print();

  const displayedOrders = orders.filter(order => {
    const isHistory = order.status === 'shipped';
    if (viewTab === 'active' && isHistory) return false;
    if (viewTab === 'history' && !isHistory) return false;
    if (viewTab === 'settings' || viewTab === 'analytics' || viewTab === 'inventory') return false; 
    if (searchTerm) {
        const q = searchTerm.toLowerCase();
        if (!order.customer_name?.toLowerCase().includes(q) && 
            !order.email?.toLowerCase().includes(q) && 
            !order.id.toString().includes(q)) return false;
    }
    return true;
  });

  // --- LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-[100] bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full text-center relative overflow-hidden">
          <div className="bg-amber-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10">
            <ShieldCheck className="w-10 h-10 text-amber-600" />
          </div>
          <h2 className="text-2xl font-black mb-2 text-gray-900 relative z-10">Admin Access</h2>
          
          {authStep === 'init' && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300 pt-4">
                  {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 font-medium">{error}</div>}
                  <div className="flex gap-2">
                    <button type="button" onClick={onClose} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl">Cancel</button>
                    <button onClick={handleSendCode} className="flex-1 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black shadow-lg flex items-center justify-center gap-2">Authenticate <ArrowRight className="w-4 h-4" /></button>
                  </div>
              </div>
          )}
          {authStep === 'sending' && (
              <div className="py-8 animate-in zoom-in duration-300">
                  <RefreshCw className="w-12 h-12 text-amber-600 animate-spin mx-auto mb-4" />
                  <p className="font-bold text-gray-700">Verifying...</p>
              </div>
          )}
          {authStep === 'verify' && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  {error && <div className="bg-amber-50 border border-amber-200 p-2 rounded mb-4 text-xs text-amber-800 text-left"><strong>System:</strong> {error}</div>}
                  <div className="flex justify-center items-center gap-2 mb-4 text-sm font-mono text-gray-500 bg-gray-100 py-2 rounded-lg">
                     <Timer className={`w-4 h-4 ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-gray-500'}`} />
                     <span className={timeLeft < 10 ? 'text-red-600 font-bold' : ''}>Session expires in {timeLeft}s</span>
                  </div>
                  <form onSubmit={handleVerifyCode}>
                      <input type="text" maxLength={6} className="w-full text-center text-3xl font-mono tracking-[0.5em] border-2 border-gray-200 rounded-xl py-4 px-2 focus:border-amber-500 outline-none transition-all placeholder:text-gray-200 mb-4" value={inputCode} onChange={(e) => setInputCode(e.target.value.replace(/\D/g, ''))} placeholder="000000" autoFocus />
                      <button type="submit" className="w-full py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg mb-3">Verify Login</button>
                  </form>
                  <button onClick={() => { setAuthStep('init'); setError(''); setServerCode(null); }} className="text-xs text-gray-400 hover:text-gray-600 underline">Cancel</button>
              </div>
          )}
        </div>
      </div>
    );
  }

  // --- DASHBOARD UI ---
  return (
    <div className="fixed inset-0 z-[100] bg-gray-100 overflow-hidden no-print flex flex-col">
      {/* Top Header */}
      <div className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm z-20">
        <div className="flex items-center gap-3">
          <div className="bg-amber-600 text-white p-2 rounded-lg"><Lock className="w-5 h-5" /></div>
          <div><h1 className="text-xl font-bold text-gray-900">Store Dashboard</h1></div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-bold text-sm transition-colors mr-2"><Home className="w-4 h-4" /><span className="hidden sm:inline">Back to Store</span></button>
          <button onClick={onClose} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full"><X className="w-6 h-6" /></button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-white border-r border-gray-200 flex-col hidden md:flex">
            <div className="p-4 space-y-2">
                <button onClick={() => setViewTab('active')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${viewTab === 'active' ? 'bg-amber-50 text-amber-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <ShoppingBag className="w-5 h-5" /> Active Orders
                </button>
                <button onClick={() => setViewTab('history')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${viewTab === 'history' ? 'bg-amber-50 text-amber-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <Archive className="w-5 h-5" /> Order History
                </button>
                <div className="h-px bg-gray-100 my-2"></div>
                <button onClick={() => setViewTab('inventory')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${viewTab === 'inventory' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <Tag className="w-5 h-5" /> Inventory
                </button>
                <button onClick={() => setViewTab('analytics')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${viewTab === 'analytics' ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <BarChart2 className="w-5 h-5" /> Analytics
                </button>
                <button onClick={() => setViewTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${viewTab === 'settings' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <Settings className="w-5 h-5" /> Settings
                </button>
            </div>
            <div className="mt-auto p-4 border-t border-gray-100">
                <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 font-bold uppercase mb-1">Quick Stats</p>
                    <div className="flex justify-between text-sm text-gray-700 mb-1"><span>Rev:</span> <span className="font-bold">R {stats.totalRevenue.toFixed(0)}</span></div>
                    <div className="flex justify-between text-sm text-gray-700"><span>Orders:</span> <span className="font-bold">{stats.totalOrders}</span></div>
                </div>
            </div>
        </div>

        {/* Mobile Nav (Horizontal Scroll) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 flex overflow-x-auto p-2 gap-2">
             <button onClick={() => setViewTab('active')} className={`flex-shrink-0 px-4 py-2 rounded-lg text-xs font-bold ${viewTab === 'active' ? 'bg-amber-100 text-amber-800' : 'bg-gray-50 text-gray-600'}`}>Active</button>
             <button onClick={() => setViewTab('history')} className={`flex-shrink-0 px-4 py-2 rounded-lg text-xs font-bold ${viewTab === 'history' ? 'bg-amber-100 text-amber-800' : 'bg-gray-50 text-gray-600'}`}>History</button>
             <button onClick={() => setViewTab('inventory')} className={`flex-shrink-0 px-4 py-2 rounded-lg text-xs font-bold ${viewTab === 'inventory' ? 'bg-blue-100 text-blue-800' : 'bg-gray-50 text-gray-600'}`}>Inventory</button>
             <button onClick={() => setViewTab('settings')} className={`flex-shrink-0 px-4 py-2 rounded-lg text-xs font-bold ${viewTab === 'settings' ? 'bg-gray-200 text-gray-800' : 'bg-gray-50 text-gray-600'}`}>Settings</button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-8 pb-20 md:pb-8">
            
            {/* ORDERS VIEW */}
            {(viewTab === 'active' || viewTab === 'history') && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-gray-900">{viewTab === 'active' ? 'Active Orders' : 'Order History'}</h2>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="Search orders..." 
                                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-amber-500 outline-none w-64"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Customer</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Items</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Total</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {displayedOrders.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">No orders found.</td></tr>
                                ) : (
                                    displayedOrders.map((order) => {
                                        const isShipped = order.status === 'shipped';
                                        const isPending = order.status === 'pending_payment';
                                        return (
                                            <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <button onClick={(e) => initiateFulfillment(order, e)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold ${isShipped ? 'bg-green-100 text-green-700 border-green-200' : isPending ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-white text-gray-700 border-gray-300'}`}>
                                                        {isShipped ? <CheckSquare className="w-3 h-3"/> : <Square className="w-3 h-3"/>}
                                                        {isShipped ? 'Done' : isPending ? 'Pending' : 'Mark Done'}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</td>
                                                <td className="px-6 py-4"><div className="font-bold text-sm">{order.customer_name}</div><div className="text-xs text-gray-400">{order.email}</div></td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{order.items?.length || 0} items</td>
                                                <td className="px-6 py-4 font-bold text-sm">R {order.total_amount?.toFixed(2)}</td>
                                                <td className="px-6 py-4"><button onClick={() => { setSelectedOrder(order); setActiveModal('invoice'); }} className="text-blue-600 font-bold text-xs hover:underline flex items-center gap-1"><Eye className="w-3 h-3"/> View</button></td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* INVENTORY VIEW */}
            {viewTab === 'inventory' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-gray-900">Inventory Management</h2>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Product</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">SKU</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Price</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Badge</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {inventory.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden"><img src={product.image} className="w-full h-full object-cover"/></div>
                                            <div><div className="font-bold text-sm text-gray-900">{product.name}</div><div className="text-xs text-gray-500">{product.category}</div></div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-mono text-gray-500">{product.sku}</td>
                                        <td className="px-6 py-4 font-bold text-sm">R {product.price}</td>
                                        <td className="px-6 py-4"><span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{product.badge || '-'}</span></td>
                                        <td className="px-6 py-4"><button onClick={() => handleEditProductClick(product)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500"><Edit2 className="w-4 h-4"/></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ANALYTICS VIEW */}
            {viewTab === 'analytics' && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900">Traffic Analytics</h2>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-4 border-b border-gray-200 bg-gray-50 text-xs font-bold text-gray-500 uppercase">Recent Visitors</div>
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-4 py-2 font-medium text-gray-500">Date</th>
                                    <th className="px-4 py-2 font-medium text-gray-500">Location</th>
                                    <th className="px-4 py-2 font-medium text-gray-500">Device</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analyticsData.map((visit, i) => (
                                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                                        <td className="px-4 py-2 text-gray-500">{new Date(visit.created_at).toLocaleString()}</td>
                                        <td className="px-4 py-2 font-medium text-gray-800">{visit.city}, {visit.region}</td>
                                        <td className="px-4 py-2 text-gray-500">{visit.device_type}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* SETTINGS VIEW */}
            {viewTab === 'settings' && (
                <div className="max-w-2xl mx-auto space-y-8">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-gray-900">Store Settings</h2>
                        <button onClick={onAddTestProduct} className="text-xs bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded">Debug: Add Test Product</button>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5 text-red-600"/> Payment Gateway (PayFast)</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Merchant ID</label>
                                <input className="w-full border border-gray-300 rounded p-2" value={settings.payfast_merchant_id} onChange={e => setSettings({...settings, payfast_merchant_id: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Merchant Key</label>
                                <input className="w-full border border-gray-300 rounded p-2" value={settings.payfast_merchant_key} onChange={e => setSettings({...settings, payfast_merchant_key: e.target.value})} />
                            </div>
                            <div className="flex items-center gap-3 pt-2">
                                <button onClick={() => setSettings({...settings, is_live_mode: !settings.is_live_mode})} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.is_live_mode ? 'bg-green-600' : 'bg-gray-300'}`}>
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.is_live_mode ? 'translate-x-6' : 'translate-x-1'}`}/>
                                </button>
                                <span className="text-sm font-medium">{settings.is_live_mode ? 'Live Mode (Real Money)' : 'Sandbox Mode (Testing)'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><BarChart2 className="w-5 h-5 text-blue-600"/> Analytics & Tracking</h3>
                        <div className="space-y-4">
                            <div><label className="block text-sm font-bold text-gray-700 mb-1">Meta Pixel ID</label><input className="w-full border border-gray-300 rounded p-2" placeholder="1234567890" value={settings.meta_pixel_id} onChange={e => setSettings({...settings, meta_pixel_id: e.target.value})} /></div>
                            <div><label className="block text-sm font-bold text-gray-700 mb-1">Google Analytics ID</label><input className="w-full border border-gray-300 rounded p-2" placeholder="G-XXXXXXXX" value={settings.google_analytics_id} onChange={e => setSettings({...settings, google_analytics_id: e.target.value})} /></div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-gray-600"/> Invoice Details</h3>
                        <div className="space-y-4">
                            <div><label className="block text-sm font-bold text-gray-700 mb-1">Company Name</label><input className="w-full border border-gray-300 rounded p-2" value={settings.company_name} onChange={e => setSettings({...settings, company_name: e.target.value})} /></div>
                            <div><label className="block text-sm font-bold text-gray-700 mb-1">Address</label><textarea className="w-full border border-gray-300 rounded p-2 h-20" value={settings.company_address} onChange={e => setSettings({...settings, company_address: e.target.value})} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-bold text-gray-700 mb-1">VAT No</label><input className="w-full border border-gray-300 rounded p-2" value={settings.company_vat} onChange={e => setSettings({...settings, company_vat: e.target.value})} /></div>
                                <div><label className="block text-sm font-bold text-gray-700 mb-1">Reg No</label><input className="w-full border border-gray-300 rounded p-2" value={settings.company_reg} onChange={e => setSettings({...settings, company_reg: e.target.value})} /></div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><DollarSign className="w-5 h-5 text-green-600"/> Dynamic Pricing</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Shipping Markup (Rand)</label>
                                <p className="text-xs text-gray-500 mb-2">This amount is added to the base price of Bundles to cover 'Free Shipping'.</p>
                                <input type="number" className="w-full border border-gray-300 rounded p-2" value={settings.shipping_markup} onChange={e => setSettings({...settings, shipping_markup: Number(e.target.value)})} />
                            </div>
                        </div>
                    </div>

                    <button onClick={saveSettings} disabled={savingSettings} className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-black shadow-lg">
                        {savingSettings ? 'Saving...' : 'Save All Settings'}
                    </button>
                </div>
            )}
        </div>
      </div>

      {/* --- MODALS --- */}
      
      {/* Invoice Modal */}
      {selectedOrder && activeModal === 'invoice' && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/70 backdrop-blur-sm no-print" onClick={() => { setActiveModal('none'); setSelectedOrder(null); }}></div>
             <div id="printable-invoice" className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl relative z-20 flex flex-col max-h-[90vh] overflow-hidden">
                 <div className="p-4 border-b flex justify-between items-center bg-gray-50 no-print">
                   <h3 className="font-bold text-gray-900 flex items-center gap-2"><FileText className="w-5 h-5 text-gray-500"/> Invoice Preview</h3>
                   <div className="flex items-center gap-2">
                       <button onClick={handlePrintInvoice} className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2"><Printer className="w-4 h-4" /> Print / Save PDF</button>
                       <button onClick={() => { setActiveModal('none'); setSelectedOrder(null); }} className="p-2 hover:bg-gray-200 rounded-full"><X className="w-5 h-5 text-gray-500" /></button>
                   </div>
                 </div>
                 <div className="p-8 overflow-y-auto bg-white">
                    <div className="flex justify-between items-start border-b border-gray-200 pb-8 mb-8">
                        <div>
                            <h1 className="text-4xl font-black text-gray-900 mb-2">INVOICE</h1>
                            <p className="text-sm text-gray-500 font-bold">#{selectedOrder.id}</p>
                            <div className="mt-4 text-sm text-gray-600">
                                <p><strong>Date:</strong> {new Date(selectedOrder.created_at).toLocaleDateString()}</p>
                                <p><strong>Status:</strong> <span className="uppercase">{selectedOrder.status === 'pending_payment' ? 'UNPAID' : 'PAID'}</span></p>
                            </div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                            {/* INSERTED LOGO HERE */}
                            <img src={ASSETS.logo} alt="Sumami Brand" className="h-12 w-auto mb-2" />
                            <div className="text-sm text-gray-500 whitespace-pre-wrap leading-relaxed">{settings.company_address || 'Amanzimtoti, KwaZulu-Natal\nSouth Africa'}</div>
                            {settings.company_vat && <p className="text-sm text-gray-500 mt-2"><strong>VAT No:</strong> {settings.company_vat}</p>}
                            {settings.company_reg && <p className="text-sm text-gray-500"><strong>Reg No:</strong> {settings.company_reg}</p>}
                        </div>
                    </div>
                    <div className="mb-8">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Bill To</h3>
                        <p className="font-bold text-gray-900">{selectedOrder.customer_name}</p>
                        <p className="text-sm text-gray-600">{selectedOrder.email}</p>
                        <p className="text-sm text-gray-600">{selectedOrder.phone}</p>
                        <p className="text-sm text-gray-600 max-w-xs">{selectedOrder.address_full}</p>
                    </div>
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
                            {selectedOrder.items?.map((item: any, idx: number) => (
                                <tr key={idx}>
                                    <td className="py-4 text-sm text-gray-800"><span className="font-medium">{item.name}</span><div className="text-xs text-gray-500">{item.variant} {item.is_bonus && '(Bonus Item)'}</div></td>
                                    <td className="py-4 text-center text-sm text-gray-600">{item.quantity}</td>
                                    <td className="py-4 text-right text-sm text-gray-600">{item.price === 0 ? 'Free' : `R ${item.price.toFixed(2)}`}</td>
                                    <td className="py-4 text-right text-sm font-bold text-gray-900">{item.price === 0 ? 'R 0.00' : `R ${(item.price * item.quantity).toFixed(2)}`}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="flex justify-end">
                        <div className="w-full max-w-xs space-y-2">
                            <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>R {selectedOrder.total_amount.toFixed(2)}</span></div>
                            {settings.company_vat && (<div className="flex justify-between text-sm text-gray-500"><span>Includes VAT (15%)</span><span>R {(selectedOrder.total_amount * 0.15 / 1.15).toFixed(2)}</span></div>)}
                            <div className="flex justify-between text-xl font-black text-gray-900 border-t-2 border-gray-900 pt-2 mt-2"><span>Total</span><span>R {selectedOrder.total_amount.toFixed(2)}</span></div>
                        </div>
                    </div>
                    <div className="mt-16 pt-8 border-t border-gray-200 text-center text-sm text-gray-500"><p>{settings.invoice_footer_text || 'Thank you for your business!'}</p></div>
                 </div>
             </div>
          </div>
      )}

      {/* Fulfillment Modal */}
      {selectedOrder && activeModal === 'fulfillment' && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => { setActiveModal('none'); setSelectedOrder(null); }}></div>
                <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl relative z-20 overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="p-6 bg-gray-900 text-white flex justify-between items-start">
                        <div><h3 className="text-xl font-bold flex items-center gap-2"><Package className="w-5 h-5 text-amber-500"/> Fulfill Order</h3><p className="text-gray-400 text-sm mt-1">Order #{selectedOrder.id}</p></div>
                        <button onClick={() => { setActiveModal('none'); setSelectedOrder(null); }} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="p-6">
                        <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
                            <button onClick={() => setFulfillmentType('courier')} className={`flex-1 py-2 text-sm font-bold rounded-md flex items-center justify-center gap-2 transition-all ${fulfillmentType === 'courier' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}><Truck className="w-4 h-4" /> Courier Delivery</button>
                            <button onClick={() => setFulfillmentType('collection')} className={`flex-1 py-2 text-sm font-bold rounded-md flex items-center justify-center gap-2 transition-all ${fulfillmentType === 'collection' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}><UserCheck className="w-4 h-4" /> Collection</button>
                        </div>
                        {fulfillmentType === 'courier' ? (
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between items-center mb-1"><label className="block text-xs font-bold text-gray-500 uppercase">Courier Service</label>
                                        <select className="text-xs border border-gray-300 rounded p-1 bg-gray-50 text-gray-700 outline-none" onChange={(e) => {const p = COURIER_PRESETS.find(pr => pr.name === e.target.value); if(p) setTrackingInput({...trackingInput, courier: p.name, url: p.url})}} value={COURIER_PRESETS.find(p => p.name === trackingInput.courier)?.name || 'Other'}>
                                            <option value="" disabled>Load Preset...</option>
                                            {COURIER_PRESETS.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                                        </select>
                                    </div>
                                    <input type="text" className="w-full border border-gray-300 rounded-lg p-3 focus:border-amber-500 outline-none" value={trackingInput.courier} onChange={(e) => setTrackingInput({...trackingInput, courier: e.target.value})} placeholder="Courier Name" />
                                </div>
                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tracking Number <span className="text-red-500">*</span></label><input type="text" className="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-amber-500 outline-none font-mono text-lg font-bold" value={trackingInput.code} onChange={(e) => setTrackingInput({...trackingInput, code: e.target.value})} autoFocus placeholder="e.g. TCG-123" /></div>
                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tracking URL</label><input type="text" className="w-full border border-gray-300 rounded-lg p-3 text-sm text-gray-600" value={trackingInput.url} onChange={(e) => setTrackingInput({...trackingInput, url: e.target.value})} placeholder="https://..." /></div>
                            </div>
                        ) : (
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><UserCheck className="w-8 h-8 text-blue-600" /></div>
                                <h4 className="text-lg font-bold text-blue-900 mb-2">Mark as Collected</h4>
                                <p className="text-sm text-blue-700">Notifies customer their order is ready.</p>
                            </div>
                        )}
                        <button onClick={confirmFulfillment} disabled={isSendingTracking} className={`w-full mt-6 py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${isSendingTracking ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>
                            {isSendingTracking ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckSquare className="w-5 h-5" />}
                            {isSendingTracking ? 'Saving...' : 'Confirm & Notify'}
                        </button>
                    </div>
                </div>
            </div>
      )}

      {/* Edit Product Modal */}
      {activeModal === 'editProduct' && editingProduct && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setActiveModal('none')}></div>
              <div className="bg-white p-6 rounded-xl shadow-xl z-20 w-full max-w-sm">
                  <h3 className="font-bold text-xl mb-4">Edit {editingProduct.name}</h3>
                  <div className="space-y-4">
                      <div><label className="block text-sm font-bold text-gray-700">Price (R)</label><input type="number" className="w-full border p-2 rounded" value={productEdits.price} onChange={e => setProductEdits({...productEdits, price: parseFloat(e.target.value)})} /></div>
                      <div><label className="block text-sm font-bold text-gray-700">Badge (Optional)</label><input type="text" className="w-full border p-2 rounded" value={productEdits.badge} onChange={e => setProductEdits({...productEdits, badge: e.target.value})} placeholder="e.g. Best Seller" /></div>
                      <button onClick={handleSaveProduct} className="w-full bg-amber-600 text-white font-bold py-3 rounded-lg hover:bg-amber-700">Save Changes</button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default AdminDashboard;
