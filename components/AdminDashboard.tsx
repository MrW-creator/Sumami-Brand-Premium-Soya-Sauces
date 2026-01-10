
import React, { useState, useEffect } from 'react';
import { Lock, RefreshCw, X, TrendingUp, ShoppingBag, DollarSign, Calendar, Eye, CheckSquare, Square, Truck, Printer, Archive, Clock, Search, Filter, RotateCcw, Settings, Key, Save, ToggleLeft, ToggleRight, Mail, BarChart2, MapPin, Smartphone, Monitor, Send, Link as LinkIcon, AlertTriangle, Home, Zap, ShieldCheck, ArrowRight, Database, CreditCard, AlertCircle, EyeOff, Beaker, Server, Activity, FileText, Briefcase, Tag, Package, Calculator } from 'lucide-react';
import { supabase } from '../lib/supabase/client';
import { PAYFAST_DEFAULTS, ADMIN_EMAIL } from '../constants';
import { StoreSettings } from '../types';

interface AdminDashboardProps {
  onClose: () => void;
  onSettingsUpdated?: () => void;
  onAddTestProduct: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose, onSettingsUpdated, onAddTestProduct }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Auth State
  const [authStep, setAuthStep] = useState<'init' | 'sending' | 'verify'>('init');
  const [serverCode, setServerCode] = useState<string | null>(null);
  const [inputCode, setInputCode] = useState('');
  const [error, setError] = useState('');
  
  // Dashboard Data State
  const [orders, setOrders] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  
  // Tracking Input State
  const [trackingInput, setTrackingInput] = useState({ courier: 'The Courier Guy', code: '', url: '' });
  const [isSendingTracking, setIsSendingTracking] = useState(false);
  
  // View State
  const [viewTab, setViewTab] = useState<'active' | 'history' | 'analytics' | 'settings' | 'inventory'>('active');

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [productEdits, setProductEdits] = useState<any>({});
  
  // UI State for Keys Visibility
  const [showKey, setShowKey] = useState(false);

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

  // Reset tracking inputs when modal opens
  useEffect(() => {
    if (selectedOrder) {
        setTrackingInput({
            courier: selectedOrder.courier_name || 'The Courier Guy',
            code: selectedOrder.tracking_number || '',
            url: selectedOrder.tracking_url || 'https://portal.thecourierguy.co.za/track'
        });
    }
  }, [selectedOrder]);
  
  // Fetch Inventory when tab is active
  useEffect(() => {
      if (isAuthenticated && viewTab === 'inventory') {
          fetchInventory();
      }
  }, [isAuthenticated, viewTab]);

  const calculateStats = (data: any[]) => {
    const revenue = data.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0) || 0;
    const count = data.length || 0;
    
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
             const errorDetails = typeof fnError === 'object' && fnError !== null && 'message' in fnError 
                ? (fnError as any).message 
                : JSON.stringify(fnError);
             throw new Error(errorDetails);
        }
        setAuthStep('verify');

    } catch (err: any) {
        console.error("OTP Send Failed:", err);
        setError(`Email failed. Check console (F12) for code. Error: ${err.message}`);
        setAuthStep('verify');
    }
  };

  const handleVerifyCode = (e: React.FormEvent) => {
      e.preventDefault();
      if (inputCode === serverCode) {
          setIsAuthenticated(true);
          sessionStorage.setItem('sumami_admin_auth', 'true');
          fetchOrders();
          fetchSettings();
      } else {
          setError("Invalid code. Please try again.");
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
        .limit(500);
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
  
  const handleEditProduct = (product: any) => {
      setEditingProduct(product.id);
      setProductEdits({ price: product.price, badge: product.badge });
  };
  
  const handleSaveProduct = async (id: string) => {
      if (!supabase) return;
      try {
          const { error } = await supabase.from('products').update({
              price: parseFloat(productEdits.price),
              badge: productEdits.badge === '' ? null : productEdits.badge
          }).eq('id', id);
          
          if (error) throw error;
          
          setInventory(prev => prev.map(p => p.id === id ? { ...p, price: parseFloat(productEdits.price), badge: productEdits.badge === '' ? null : productEdits.badge } : p));
          setEditingProduct(null);
          alert("Product Updated!");
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
            shipping_markup: settings.shipping_markup
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

  const toggleShippingStatus = async (orderId: number, currentStatus: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newStatus = currentStatus === 'shipped' ? 'paid' : 'shipped';
    
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev: any) => ({ ...prev, status: newStatus }));
    }

    if (supabase) {
      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
      if (error) {
        console.error("Failed to update status", error);
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: currentStatus } : o));
      }
    }
  };

  const handleSaveTracking = async () => {
    if (!selectedOrder || !trackingInput.code) {
        alert("Please enter a tracking code.");
        return;
    }
    setIsSendingTracking(true);
    try {
        if (supabase) {
            const { error } = await supabase
                .from('orders')
                .update({ 
                    tracking_number: trackingInput.code,
                    courier_name: trackingInput.courier,
                    tracking_url: trackingInput.url,
                    status: 'shipped' 
                })
                .eq('id', selectedOrder.id);
            if (error) throw error;
            await supabase.functions.invoke('resend-shipping-email', {
                body: {
                  customerName: selectedOrder.customer_name,
                  customerEmail: selectedOrder.email,
                  orderId: selectedOrder.id.toString(),
                  trackingNumber: trackingInput.code,
                  courierName: trackingInput.courier,
                  trackingUrl: trackingInput.url
                }
            });
        }
        const updatedOrder = { 
            ...selectedOrder, 
            tracking_number: trackingInput.code,
            courier_name: trackingInput.courier,
            tracking_url: trackingInput.url,
            status: 'shipped'
        };
        setSelectedOrder(updatedOrder);
        setOrders(prev => prev.map(o => o.id === selectedOrder.id ? updatedOrder : o));
        alert("Tracking saved and Shipping Email sent to customer!");
    } catch (err: any) {
        console.error("Tracking Error:", err);
        alert("Failed to save tracking: " + err.message);
    } finally {
        setIsSendingTracking(false);
    }
  };

  const handlePrintInvoice = () => {
    window.print();
  };

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

  const getDeviceStats = () => {
      let mobile = 0;
      let desktop = 0;
      analyticsData.forEach(v => { v.device_type === 'Mobile' ? mobile++ : desktop++; });
      return { mobile, desktop };
  };

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
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <p className="text-gray-500 text-sm mb-6">For enhanced security, we will send a <strong>6-digit verification code</strong> to your registered email.</p>
                  <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-xs text-blue-800 mb-6 flex items-center gap-2 text-left">
                      <Mail className="w-4 h-4 shrink-0" /><span>Sending to: <strong>{ADMIN_EMAIL}</strong></span>
                  </div>
                  {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}
                  <div className="flex gap-2">
                    <button type="button" onClick={onClose} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl">Cancel</button>
                    <button onClick={handleSendCode} className="flex-1 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black shadow-lg flex items-center justify-center gap-2">Send Code <ArrowRight className="w-4 h-4" /></button>
                  </div>
              </div>
          )}
          {authStep === 'sending' && (
              <div className="py-8 animate-in zoom-in duration-300">
                  <RefreshCw className="w-12 h-12 text-amber-600 animate-spin mx-auto mb-4" />
                  <p className="font-bold text-gray-700">Sending Secure Code...</p>
              </div>
          )}
          {authStep === 'verify' && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <p className="text-gray-500 text-sm mb-4">Enter the 6-digit code sent to your email.</p>
                  {error && <div className="bg-amber-50 border border-amber-200 p-2 rounded mb-4 text-xs text-amber-800 text-left"><strong>Debug Mode Active:</strong> {error}</div>}
                  <form onSubmit={handleVerifyCode}>
                      <input type="text" maxLength={6} className="w-full text-center text-3xl font-mono tracking-[0.5em] border-2 border-gray-200 rounded-xl py-4 px-2 focus:border-amber-500 outline-none transition-all placeholder:text-gray-200 mb-4" value={inputCode} onChange={(e) => setInputCode(e.target.value.replace(/\D/g, ''))} placeholder="000000" autoFocus />
                      <button type="submit" className="w-full py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg mb-3">Verify & Unlock</button>
                  </form>
                  <button onClick={() => { setAuthStep('init'); setError(''); }} className="text-xs text-gray-400 hover:text-gray-600 underline">Resend Code</button>
              </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-gray-100 overflow-auto no-print">
      <div className="bg-white border-b sticky top-0 z-10 px-6 py-4 flex justify-between items-center shadow-sm no-print">
        <div className="flex items-center gap-3">
          <div className="bg-amber-600 text-white p-2 rounded-lg"><Lock className="w-5 h-5" /></div>
          <div><h1 className="text-xl font-bold text-gray-900">Store Dashboard</h1></div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-bold text-sm transition-colors mr-2"><Home className="w-4 h-4" /><span className="hidden sm:inline">Back to Store</span></button>
          <button onClick={onClose} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full"><X className="w-6 h-6" /></button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl no-print">
        {(viewTab !== 'settings' && viewTab !== 'analytics' && viewTab !== 'inventory') && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-2"><h3 className="text-gray-500 text-sm font-medium">Total Revenue</h3><DollarSign className="w-5 h-5 text-green-500" /></div>
                <p className="text-3xl font-black text-gray-900">R {stats.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-2"><h3 className="text-gray-500 text-sm font-medium">Total Orders</h3><ShoppingBag className="w-5 h-5 text-blue-500" /></div>
                <p className="text-3xl font-black text-gray-900">{stats.totalOrders}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-2"><h3 className="text-gray-500 text-sm font-medium">Avg. Order Value</h3><TrendingUp className="w-5 h-5 text-amber-500" /></div>
                <p className="text-3xl font-black text-gray-900">R {stats.avgOrderValue.toFixed(2)}</p>
            </div>
            </div>
        )}

        <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="bg-white p-1 rounded-lg border border-gray-200 inline-flex shadow-sm">
                    <button onClick={() => setViewTab('active')} className={`px-4 py-2 rounded-md font-bold text-sm ${viewTab === 'active' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>Active Orders</button>
                    <button onClick={() => setViewTab('history')} className={`px-4 py-2 rounded-md font-bold text-sm ${viewTab === 'history' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>History</button>
                    <button onClick={() => setViewTab('inventory')} className={`px-4 py-2 rounded-md font-bold text-sm ${viewTab === 'inventory' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>Inventory</button>
                    <button onClick={() => setViewTab('analytics')} className={`px-4 py-2 rounded-md font-bold text-sm ${viewTab === 'analytics' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>Analytics</button>
                    <button onClick={() => setViewTab('settings')} className={`px-4 py-2 rounded-md font-bold text-sm ${viewTab === 'settings' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>Settings</button>
                </div>
            </div>
        </div>
        
        {viewTab === 'inventory' && (
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                 <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2"><Package className="w-6 h-6 text-purple-600" /> Product Inventory</h2>
                        <p className="text-gray-500 text-sm">Manage prices and badges in real-time.</p>
                    </div>
                    <button onClick={fetchInventory} className="text-gray-500 hover:text-gray-700"><RefreshCw className="w-5 h-5" /></button>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Product</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">SKU</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Price (ZAR)</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Badge</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {inventory.map((product) => (
                                <tr key={product.id}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <img src={product.image} alt="" className="w-10 h-10 rounded-md object-cover bg-gray-100" />
                                            <div>
                                                <div className="font-bold text-gray-900">{product.name}</div>
                                                <div className="text-xs text-gray-500">{product.category}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">{product.sku}</td>
                                    <td className="px-6 py-4">
                                        {editingProduct === product.id ? (
                                            <input 
                                                type="number" 
                                                className="w-24 border border-purple-300 rounded p-1 text-sm focus:outline-none focus:border-purple-500"
                                                value={productEdits.price}
                                                onChange={(e) => setProductEdits({...productEdits, price: e.target.value})}
                                            />
                                        ) : (
                                            <span className="font-bold text-gray-900">R {product.price}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {editingProduct === product.id ? (
                                            <input 
                                                type="text" 
                                                className="w-32 border border-purple-300 rounded p-1 text-sm focus:outline-none focus:border-purple-500"
                                                placeholder="e.g. Best Seller"
                                                value={productEdits.badge || ''}
                                                onChange={(e) => setProductEdits({...productEdits, badge: e.target.value})}
                                            />
                                        ) : (
                                            product.badge && <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded-full">{product.badge}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {editingProduct === product.id ? (
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleSaveProduct(product.id)} className="bg-green-600 text-white p-1.5 rounded hover:bg-green-700"><CheckSquare className="w-4 h-4" /></button>
                                                <button onClick={() => setEditingProduct(null)} className="bg-gray-200 text-gray-600 p-1.5 rounded hover:bg-gray-300"><X className="w-4 h-4" /></button>
                                            </div>
                                        ) : (
                                            <button onClick={() => handleEditProduct(product)} className="text-purple-600 hover:text-purple-800 font-bold text-sm">Edit</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
             </div>
        )}

        {viewTab === 'analytics' && (
            <div className="space-y-6">
               <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2"><BarChart2 className="w-6 h-6 text-amber-600" /> Traffic Overview</h2>
                    <p className="text-gray-500">Tracking last 500 visitors...</p>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm font-bold">Device Usage</p>
                            <div className="flex justify-between mt-2">
                                <span>Mobile: {getDeviceStats().mobile}</span>
                                <span>Desktop: {getDeviceStats().desktop}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {viewTab === 'settings' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-2xl mx-auto">
                 <div className="flex items-center gap-4 mb-6 border-b pb-4">
                     <div className="bg-gray-100 p-3 rounded-full"><Key className="w-8 h-8 text-gray-700" /></div>
                     <div><h2 className="text-2xl font-black text-gray-900">Store Configuration</h2><p className="text-gray-500">Manage Payments & Invoicing.</p></div>
                 </div>

                 <div className="space-y-6">
                     
                     {/* DYNAMIC PRICING SECTION (NEW) */}
                     <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-900 flex items-start gap-3">
                        <Calculator className="w-5 h-5 flex-shrink-0 mt-0.5 text-green-600" />
                        <div>
                            <strong>Dynamic Pricing Logic</strong>
                            <p className="mt-1 mb-2 opacity-90">Pack prices are calculated automatically: <code>(Single Price x Qty) + Base Markup</code>.</p>
                        </div>
                     </div>

                     <div>
                         <label className="block text-sm font-bold text-gray-700 mb-1">Base Shipping/Handling Markup (ZAR)</label>
                         <input 
                            type="number" 
                            className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 focus:border-green-500 focus:bg-white outline-none font-mono font-bold" 
                            value={settings.shipping_markup || 150} 
                            onChange={(e) => setSettings(prev => ({...prev, shipping_markup: parseFloat(e.target.value)}))} 
                            placeholder="150" 
                         />
                         <p className="text-xs text-gray-500 mt-1">This amount is added to every 3-Pack and 6-Pack to cover shipping costs.</p>
                     </div>

                     <div className="border-t border-gray-100 my-4"></div>

                     <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900 flex items-start gap-3">
                        <Lock className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
                        <div><strong>PayFast Configuration</strong><p className="mt-1 mb-2 opacity-90">Enter your Merchant ID and Key.</p></div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">PayFast Merchant ID</label>
                            <input type="text" className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 focus:border-amber-500 focus:bg-white outline-none" value={settings.payfast_merchant_id} onChange={(e) => setSettings(prev => ({...prev, payfast_merchant_id: e.target.value}))} placeholder="10000100" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">PayFast Merchant Key</label>
                            <div className="relative">
                                <input type={showKey ? "text" : "password"} className="w-full border border-gray-300 rounded-lg p-3 pr-12 bg-gray-50 focus:border-amber-500 focus:bg-white outline-none" value={settings.payfast_merchant_key} onChange={(e) => setSettings(prev => ({...prev, payfast_merchant_key: e.target.value}))} placeholder="46f0cd694581a" />
                                <button type="button" onClick={() => setShowKey(!showKey)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">{showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
                            </div>
                        </div>
                     </div>

                     {/* BUSINESS INFO SECTION */}
                     <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-sm text-purple-900 flex items-start gap-3 mt-8">
                        <Briefcase className="w-5 h-5 flex-shrink-0 mt-0.5 text-purple-600" />
                        <div><strong>Business Invoice Details</strong><p className="mt-1 mb-2 opacity-90">These details will appear on the printable invoices.</p></div>
                     </div>

                     <div>
                         <label className="block text-sm font-bold text-gray-700 mb-1">Company Registered Name</label>
                         <input type="text" className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 focus:border-purple-500 focus:bg-white outline-none" value={settings.company_name || ''} onChange={(e) => setSettings(prev => ({...prev, company_name: e.target.value}))} placeholder="e.g. Sumami Trading (Pty) Ltd" />
                     </div>

                     <div>
                         <label className="block text-sm font-bold text-gray-700 mb-1">Full Address</label>
                         <textarea className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 focus:border-purple-500 focus:bg-white outline-none h-20" value={settings.company_address || ''} onChange={(e) => setSettings(prev => ({...prev, company_address: e.target.value}))} placeholder="123 Example Street, City, Zip Code" />
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                             <label className="block text-sm font-bold text-gray-700 mb-1">VAT Number (Optional)</label>
                             <input type="text" className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 focus:border-purple-500 focus:bg-white outline-none" value={settings.company_vat || ''} onChange={(e) => setSettings(prev => ({...prev, company_vat: e.target.value}))} placeholder="4000..." />
                        </div>
                        <div>
                             <label className="block text-sm font-bold text-gray-700 mb-1">Registration Number (Optional)</label>
                             <input type="text" className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 focus:border-purple-500 focus:bg-white outline-none" value={settings.company_reg || ''} onChange={(e) => setSettings(prev => ({...prev, company_reg: e.target.value}))} placeholder="2023/..." />
                        </div>
                     </div>
                     
                     <div>
                         <label className="block text-sm font-bold text-gray-700 mb-1">Invoice Footer Text</label>
                         <input type="text" className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 focus:border-purple-500 focus:bg-white outline-none" value={settings.invoice_footer_text || ''} onChange={(e) => setSettings(prev => ({...prev, invoice_footer_text: e.target.value}))} placeholder="Thank you for your business!" />
                     </div>


                     <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900 flex items-start gap-3 mt-8">
                        <Activity className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-600" />
                        <div><strong>Analytics & Tracking</strong><p className="mt-1 mb-2 opacity-90">Paste your IDs here. We handle the code injection automatically.</p></div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                             <label className="block text-sm font-bold text-gray-700 mb-1">Meta Pixel ID (Facebook)</label>
                             <input type="text" className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 focus:border-blue-500 focus:bg-white outline-none" value={settings.meta_pixel_id || ''} onChange={(e) => setSettings(prev => ({...prev, meta_pixel_id: e.target.value}))} placeholder="e.g. 1234567890" />
                        </div>
                        <div>
                             <label className="block text-sm font-bold text-gray-700 mb-1">Google Analytics ID (G-XXXX)</label>
                             <input type="text" className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 focus:border-blue-500 focus:bg-white outline-none" value={settings.google_analytics_id || ''} onChange={(e) => setSettings(prev => ({...prev, google_analytics_id: e.target.value}))} placeholder="e.g. G-A1B2C3D4" />
                        </div>
                     </div>

                     <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200 mt-4">
                         <div>
                             <h4 className="font-bold text-gray-900">Payment Gateway Mode</h4>
                             <p className="text-xs text-gray-500 mt-1">{settings.is_live_mode ? "Live Transactions (Real Money)" : "Sandbox Mode (Testing)"}</p>
                         </div>
                         <button onClick={() => setSettings(prev => ({...prev, is_live_mode: !prev.is_live_mode}))} className={`flex items-center gap-3 px-5 py-3 rounded-xl font-bold transition-all shadow-sm border-2 ${settings.is_live_mode ? 'bg-green-50 border-green-500 text-green-700 hover:bg-green-100' : 'bg-yellow-50 border-yellow-400 text-yellow-700 hover:bg-yellow-100'}`}>
                            <span className={`relative flex h-3 w-3`}>
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${settings.is_live_mode ? 'bg-green-500' : 'bg-yellow-400'}`}></span>
                                <span className={`relative inline-flex rounded-full h-3 w-3 ${settings.is_live_mode ? 'bg-green-600' : 'bg-yellow-400'}`}></span>
                            </span>
                            <span>{settings.is_live_mode ? 'LIVE MODE' : 'DEMO MODE'}</span>
                            {settings.is_live_mode ? <ToggleRight className="w-6 h-6 ml-2" /> : <ToggleLeft className="w-6 h-6 ml-2" />}
                        </button>
                     </div>
                     
                     {/* ADD TEST PRODUCT BUTTON (Only for Live Testing) */}
                     {settings.is_live_mode && (
                        <div className="flex items-center justify-between bg-purple-50 p-4 rounded-lg border border-purple-200 mt-2">
                             <div>
                                 <h4 className="font-bold text-purple-900">Live Verification</h4>
                                 <p className="text-xs text-purple-600 mt-1">Safely verify your gateway is working.</p>
                             </div>
                             <button onClick={onAddTestProduct} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-sm flex items-center gap-2">
                                <Zap className="w-4 h-4" />
                                Add R5.00 Test Item
                             </button>
                        </div>
                     )}

                     <div className="pt-4 border-t flex flex-col gap-4">
                         <button onClick={saveSettings} disabled={savingSettings} className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                             {savingSettings ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                             {savingSettings ? 'Saving...' : 'Save Settings'}
                         </button>
                     </div>
                 </div>
            </div>
        )}
        {/* Orders Table rendering preserved... */}
        {(viewTab !== 'settings' && viewTab !== 'analytics' && viewTab !== 'inventory') && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
               <div className="overflow-x-auto">
                <table className="w-full text-left">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Items Summary</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">View</th>
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
                            <td className="px-6 py-4 whitespace-nowrap">
                            <button onClick={(e) => toggleShippingStatus(order.id, order.status, e)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-bold transition-all shadow-sm ${isShipped ? 'bg-green-100 border-green-200 text-green-700 hover:bg-green-200' : isPending ? 'bg-yellow-100 border-yellow-300 text-yellow-700' : 'bg-white border-gray-300 text-gray-600 hover:bg-amber-50 hover:border-amber-300'}`}>
                                {isShipped ? <CheckSquare className="w-4 h-4" /> : isPending ? <Clock className="w-4 h-4"/> : <Square className="w-4 h-4" />}
                                {isShipped ? 'Done' : isPending ? 'Pending' : 'Mark Done'}
                            </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-bold text-gray-900">{order.customer_name}</div><div className="text-xs text-gray-500">{order.email}</div></td>
                            <td className="px-6 py-4"><div className="text-sm text-gray-700 max-w-xs truncate">{order.items?.length || 0} items</div></td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">R {order.total_amount?.toFixed(2)}</td>
                            <td className="px-6 py-4 whitespace-nowrap"><button onClick={() => setSelectedOrder(order)} className="text-blue-600 hover:text-blue-800 font-bold text-sm flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100"><Eye className="w-4 h-4" /> Invoice</button></td>
                        </tr>
                        );
                    })
                    )}
                </tbody>
                </table>
            </div>
            </div>
        )}

        {selectedOrder && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/70 backdrop-blur-sm no-print" onClick={() => setSelectedOrder(null)}></div>
             
             {/* PROFESSIONAL PRINTABLE INVOICE */}
             <div id="printable-invoice" className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl relative z-20 flex flex-col max-h-[90vh] overflow-hidden">
                 
                 {/* Modal Header - HIDDEN IN PRINT */}
                 <div className="p-4 border-b flex justify-between items-center bg-gray-50 no-print">
                   <h3 className="font-bold text-gray-900 flex items-center gap-2"><FileText className="w-5 h-5 text-gray-500"/> Invoice Preview</h3>
                   <div className="flex items-center gap-2">
                       <button onClick={handlePrintInvoice} className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2"><Printer className="w-4 h-4" /> Print / Save PDF</button>
                       <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-200 rounded-full"><X className="w-5 h-5 text-gray-500" /></button>
                   </div>
                 </div>

                 <div className="p-8 overflow-y-auto bg-white">
                    {/* INVOICE HEADER */}
                    <div className="flex justify-between items-start border-b border-gray-200 pb-8 mb-8">
                        <div>
                            <h1 className="text-4xl font-black text-gray-900 mb-2">INVOICE</h1>
                            <p className="text-sm text-gray-500 font-bold">#{selectedOrder.id}</p>
                            <div className="mt-4 text-sm text-gray-600">
                                <p><strong>Date:</strong> {new Date(selectedOrder.created_at).toLocaleDateString()}</p>
                                <p><strong>Status:</strong> <span className="uppercase">{selectedOrder.status === 'pending_payment' ? 'UNPAID' : 'PAID'}</span></p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-xl font-bold text-gray-900 mb-1">{settings.company_name || 'Sumami Brand'}</h2>
                            <div className="text-sm text-gray-500 whitespace-pre-wrap leading-relaxed">
                                {settings.company_address || 'Amanzimtoti, KwaZulu-Natal\nSouth Africa'}
                            </div>
                            {settings.company_vat && <p className="text-sm text-gray-500 mt-2"><strong>VAT No:</strong> {settings.company_vat}</p>}
                            {settings.company_reg && <p className="text-sm text-gray-500"><strong>Reg No:</strong> {settings.company_reg}</p>}
                        </div>
                    </div>

                    {/* BILL TO */}
                    <div className="mb-8">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Bill To</h3>
                        <p className="font-bold text-gray-900">{selectedOrder.customer_name}</p>
                        <p className="text-sm text-gray-600">{selectedOrder.email}</p>
                        <p className="text-sm text-gray-600">{selectedOrder.phone}</p>
                        <p className="text-sm text-gray-600 max-w-xs">{selectedOrder.address_full}</p>
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
                            {selectedOrder.items?.map((item: any, idx: number) => (
                                <tr key={idx}>
                                    <td className="py-4 text-sm text-gray-800">
                                        <span className="font-medium">{item.name}</span>
                                        <div className="text-xs text-gray-500">{item.variant} {item.is_bonus && '(Bonus Item)'}</div>
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
                                <span>R {selectedOrder.total_amount.toFixed(2)}</span>
                            </div>
                            {settings.company_vat && (
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span>Includes VAT (15%)</span>
                                    <span>R {(selectedOrder.total_amount * 0.15 / 1.15).toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-xl font-black text-gray-900 border-t-2 border-gray-900 pt-2 mt-2">
                                <span>Total</span>
                                <span>R {selectedOrder.total_amount.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* FOOTER */}
                    <div className="mt-16 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
                        <p>{settings.invoice_footer_text || 'Thank you for your business!'}</p>
                    </div>
                 </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
