
import React, { useState, useEffect } from 'react';
import { Lock, Download, Database, RefreshCw, X, TrendingUp, ShoppingBag, DollarSign, Calendar, Eye, CheckSquare, Square, Truck, Printer, Archive, Clock, Search, Filter, RotateCcw, Settings, Key, Save, ToggleLeft, ToggleRight, Mail, Globe, Share2, BarChart2, MapPin, Smartphone, Monitor, Send, Link as LinkIcon, AlertTriangle, Home, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase/client';
import { ADMIN_PIN } from '../constants';
import { StoreSettings } from '../types';

interface AdminDashboardProps {
  onClose: () => void;
  onSettingsUpdated?: () => void; // New optional prop
}

// Mock Data for Preview Mode
const MOCK_ORDERS = [
  {
    id: 1024,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    customer_name: "Sarah Jenkins",
    email: "sarah.j@example.com",
    phone: "082 555 1234",
    address_full: "12 Palm Ave, Durban North, 4051",
    items: [
      { quantity: 2, name: "Infused With Garlic & Ginger", variant: "3-Pack", price: 315, sku: "SUM-001" },
      { quantity: 1, name: "BONUS: Beef Stock", variant: "3-Pack", price: 0, is_bonus: true, sku: "SUM-BONUS-BEEF" }
    ],
    total_amount: 630.00,
    status: "paid"
  },
  {
    id: 1023,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    customer_name: "Mike Ross",
    email: "mike.ross@law.co.za",
    phone: "071 222 9988",
    address_full: "45 West St, Sandton, Johannesburg, 2196",
    items: [
      { quantity: 1, name: "Master Chef Collection", variant: "7-Pack", price: 535, sku: "SUM-BUN-7" }
    ],
    total_amount: 535.00,
    status: "shipped",
    tracking_number: "THE123456789",
    courier_name: "The Courier Guy",
    tracking_url: "https://thecourierguy.co.za"
  }
];

const ALLOWED_ADMIN_EMAIL = 'waldeckwayne@gmail.com';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose, onSettingsUpdated }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  // Login State
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  const [pin, setPin] = useState('');
  const [email, setEmail] = useState(ALLOWED_ADMIN_EMAIL);
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Dashboard Data State
  const [orders, setOrders] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  
  // Tracking Input State
  const [trackingInput, setTrackingInput] = useState({ courier: 'The Courier Guy', code: '', url: '' });
  const [isSendingTracking, setIsSendingTracking] = useState(false);
  
  // View State: 'active' | 'history' | 'analytics' | 'settings'
  const [viewTab, setViewTab] = useState<'active' | 'history' | 'analytics' | 'settings'>('active');

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Settings State
  const [settings, setSettings] = useState<StoreSettings>({ 
    yoco_test_key: '', 
    yoco_live_key: '', 
    is_live_mode: false,
    facebook_url: '',
    instagram_url: '',
    pinterest_url: '',
    youtube_url: '',
    tiktok_url: ''
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [sendingTestEmail, setSendingTestEmail] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0
  });

  // Check for existing session on mount
  useEffect(() => {
    if (supabase) {
        supabase.auth.getSession().then(({ data: { session } }: any) => {
            if (session) {
                // Verify Email Match
                if (session.user?.email?.toLowerCase() === ALLOWED_ADMIN_EMAIL.toLowerCase()) {
                    setIsAuthenticated(true);
                    fetchOrders();
                    fetchSettings();
                } else {
                    supabase.auth.signOut();
                    setError("Unauthorized email address.");
                }
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
            if (session) {
                if (session.user?.email?.toLowerCase() === ALLOWED_ADMIN_EMAIL.toLowerCase()) {
                    setIsAuthenticated(true);
                    fetchOrders();
                    fetchSettings();
                } else {
                     supabase.auth.signOut();
                     setIsAuthenticated(false);
                     setError("Unauthorized email address.");
                }
            }
        });
        return () => subscription.unsubscribe();
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

  const calculateStats = (data: any[]) => {
    const revenue = data.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0) || 0;
    const count = data.length || 0;
    
    setStats({
      totalRevenue: revenue,
      totalOrders: count,
      avgOrderValue: count > 0 ? revenue / count : 0
    });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (pin === ADMIN_PIN) {
      setIsAuthenticated(true);
      fetchOrders();
      fetchSettings();
    } else if (pin === '0000000000') {
      setIsAuthenticated(true);
      setIsDemoMode(true);
      setOrders(MOCK_ORDERS);
      calculateStats(MOCK_ORDERS);
    } else {
      setError('Invalid Password');
    }
  };

  const handleOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
        setError("Supabase not configured. Cannot send OTP.");
        return;
    }

    if (email.toLowerCase() !== ALLOWED_ADMIN_EMAIL.toLowerCase()) {
        setError(`Access restricted. Only ${ALLOWED_ADMIN_EMAIL} can login.`);
        return;
    }

    setError('');
    setOtpLoading(true);

    try {
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: { shouldCreateUser: true } // Allow user creation for this admin email
        });
        if (error) throw error;
        setOtpSent(true);
    } catch (err: any) {
        setError(err.message || "Failed to send login link.");
    } finally {
        setOtpLoading(false);
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
      // Fetch site_visits
      const { data, error } = await supabase
        .from('site_visits')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500); // Limit to last 500 visits for lightweight overview
      
      if (error) throw error;
      setAnalyticsData(data || []);
    } catch(err) {
      console.error("Analytics fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger Analytics fetch when tab changes
  useEffect(() => {
    if (isAuthenticated && viewTab === 'analytics') {
      fetchAnalytics();
    }
  }, [viewTab, isAuthenticated]);

  const fetchSettings = async () => {
    if (!supabase) return;
    try {
      // Assuming ID 1 is the main settings row
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .single();
      
      if (data) {
        setSettings({
            ...data,
            // Ensure strings are not null for inputs
            yoco_test_key: data.yoco_test_key || '',
            yoco_live_key: data.yoco_live_key || '',
            facebook_url: data.facebook_url || '',
            instagram_url: data.instagram_url || '',
            pinterest_url: data.pinterest_url || '',
            youtube_url: data.youtube_url || '',
            tiktok_url: data.tiktok_url || ''
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
        // Upsert logic for ID 1
        // CRITICAL FIX: Trim whitespace from keys to prevent " pk_test" errors
        const { error } = await supabase.from('store_settings').upsert({
            id: 1, // Always update row 1
            yoco_test_key: settings.yoco_test_key.trim(),
            yoco_live_key: settings.yoco_live_key.trim(),
            is_live_mode: settings.is_live_mode,
            facebook_url: settings.facebook_url?.trim(),
            instagram_url: settings.instagram_url?.trim(),
            pinterest_url: settings.pinterest_url?.trim(),
            youtube_url: settings.youtube_url?.trim(),
            tiktok_url: settings.tiktok_url?.trim()
        });

        if (error) throw error;

        // TRIGGER APP REFRESH
        if (onSettingsUpdated) {
            onSettingsUpdated();
        }

        alert("Settings Saved! The app will now use the new configuration.");
    } catch (err: any) {
        alert("Failed to save settings: " + err.message);
    } finally {
        setSavingSettings(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!supabase) return;
    
    // Prompt user for destination email
    const targetEmail = prompt("Enter the email address to send the test invoice to:", "admin@soyasauce.co.za");
    if (!targetEmail) return; // Cancelled

    setSendingTestEmail(true);
    try {
        const { error } = await supabase.functions.invoke('resend-order-email', {
            body: {
              customerName: "Test Customer",
              customerEmail: targetEmail,
              orderTotal: 100.00,
              items: [{ name: "Test Sauce", variant: "Single", quantity: 1, price: 100 }],
              orderId: "TEST-123"
            }
        });

        if (error) throw error;
        alert(`Test email sent successfully to ${targetEmail}! Check your inbox (or Mailtrap sandbox).`);
    } catch (err: any) {
        alert("Failed to send test email. Check Supabase Logs or Mailtrap Token. Error: " + err.message);
    } finally {
        setSendingTestEmail(false);
    }
  };

  const toggleShippingStatus = async (orderId: number, currentStatus: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newStatus = currentStatus === 'shipped' ? 'paid' : 'shipped';
    
    // Optimistic Update
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev: any) => ({ ...prev, status: newStatus }));
    }

    if (!isDemoMode && supabase) {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
      
      if (error) {
        console.error("Failed to update status", error);
        // Revert
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
        if (!isDemoMode && supabase) {
            // 1. Update Order in DB
            const { error } = await supabase
                .from('orders')
                .update({ 
                    tracking_number: trackingInput.code,
                    courier_name: trackingInput.courier,
                    tracking_url: trackingInput.url,
                    status: 'shipped' // Auto mark as shipped
                })
                .eq('id', selectedOrder.id);
            
            if (error) throw error;

            // 2. Trigger Shipping Email via Edge Function
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
        
        // 3. Update Local State
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

  const downloadCSV = () => {
    let csv = 'Order ID,Date,Customer Name,Email,Phone,City,Items,Total Amount,Status\n';
    orders.forEach(order => {
      const date = new Date(order.created_at).toLocaleDateString();
      const itemsSummary = order.items.map((i: any) => `${i.quantity}x ${i.name} (${i.variant})`).join(' | ');
      const safeName = `"${order.customer_name || ''}"`;
      const safeItems = `"${itemsSummary}"`;
      const safeCity = `"${order.address_full?.split(',').slice(-2)[0]?.trim() || ''}"`;
      csv += `${order.id},${date},${safeName},${order.email},${order.phone},${safeCity},${safeItems},${order.total_amount},${order.status}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sumami_Sales_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const downloadBackup = () => {
    const json = JSON.stringify(orders, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sumami_Full_Backup_${new Date().toISOString()}.json`;
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

  const clearFilters = () => {
      setSearchTerm('');
      setStartDate('');
      setEndDate('');
  };

  // FILTER LOGIC
  const displayedOrders = orders.filter(order => {
    const isHistory = order.status === 'shipped';
    if (viewTab === 'active' && isHistory) return false;
    if (viewTab === 'history' && !isHistory) return false;
    if (viewTab === 'settings' || viewTab === 'analytics') return false; 

    if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchesName = order.customer_name?.toLowerCase().includes(q);
        const matchesEmail = order.email?.toLowerCase().includes(q);
        const matchesPhone = order.phone?.includes(q);
        const matchesId = order.id.toString().includes(q);
        if (!matchesName && !matchesEmail && !matchesPhone && !matchesId) return false;
    }

    if (startDate || endDate) {
        const orderDate = new Date(order.created_at);
        if (startDate) {
            const start = new Date(startDate);
            if (orderDate < start) return false;
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); 
            if (orderDate > end) return false;
        }
    }
    return true;
  });

  // ANALYTICS HELPER
  const getTopLocations = () => {
     const cities: {[key:string]: number} = {};
     analyticsData.forEach(v => {
        const key = `${v.city}, ${v.region}`;
        cities[key] = (cities[key] || 0) + 1;
     });
     return Object.entries(cities).sort((a,b) => b[1] - a[1]).slice(0, 5);
  };

  const getDeviceStats = () => {
      let mobile = 0;
      let desktop = 0;
      analyticsData.forEach(v => {
          if (v.device_type === 'Mobile') mobile++;
          else desktop++;
      });
      return { mobile, desktop };
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-[100] bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full text-center">
          <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Admin Access</h2>
          <p className="text-gray-500 mb-6">Enter password to view sales data.<br/><span className="text-xs text-gray-400">(Hint: Use 0000000000 for Preview Mode)</span></p>
          
          {loginMethod === 'password' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <input 
                  type="password" 
                  className="w-full text-lg border-2 border-gray-200 rounded-lg py-3 px-4 focus:border-amber-500 outline-none transition-all placeholder:text-gray-300"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter Password"
                  autoFocus
                />
                {error && <p className="text-red-500 text-sm font-bold animate-pulse">{error}</p>}
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={onClose}
                    className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-3 bg-gray-900 text-white font-bold rounded-lg hover:bg-black"
                  >
                    Unlock
                  </button>
                </div>
              </form>
          ) : (
              <form onSubmit={handleOtpLogin} className="space-y-4">
                {otpSent ? (
                    <div className="bg-green-50 text-green-800 p-4 rounded-lg text-sm mb-4 border border-green-200">
                        <p className="font-bold mb-1">Magic Link Sent!</p>
                        <p>Check your email ({email}) for the login link.</p>
                        <p className="text-xs mt-2 text-green-600">Waiting for you to click the link...</p>
                    </div>
                ) : (
                    <>
                        <input 
                        type="email" 
                        className="w-full text-lg border-2 border-gray-200 rounded-lg py-3 px-4 focus:border-amber-500 outline-none transition-all placeholder:text-gray-300"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@soyasauce.co.za"
                        required
                        />
                        {error && <p className="text-red-500 text-sm font-bold animate-pulse">{error}</p>}
                        <button 
                        type="submit" 
                        disabled={otpLoading}
                        className="w-full py-3 bg-gray-900 text-white font-bold rounded-lg hover:bg-black flex items-center justify-center gap-2"
                        >
                            {otpLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
                            {otpLoading ? 'Sending...' : 'Send Magic Link'}
                        </button>
                    </>
                )}
                {!otpSent && (
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="w-full py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg"
                    >
                        Cancel
                    </button>
                )}
              </form>
          )}

          <div className="mt-6 pt-6 border-t border-gray-100">
             <button 
                onClick={() => {
                    setLoginMethod(prev => prev === 'password' ? 'otp' : 'password');
                    setError('');
                    setOtpSent(false);
                }}
                className="text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline flex items-center justify-center gap-1 w-full"
             >
                {loginMethod === 'password' ? (
                    <>
                       <Mail className="w-3 h-3" /> Use Secure Email Login
                    </>
                ) : (
                    <>
                       <Key className="w-3 h-3" /> Use Password / PIN
                    </>
                )}
             </button>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-gray-100 overflow-auto no-print">
      {/* Navbar */}
      <div className="bg-white border-b sticky top-0 z-10 px-6 py-4 flex justify-between items-center shadow-sm no-print">
        <div className="flex items-center gap-3">
          <div className={`bg-amber-600 text-white p-2 rounded-lg ${isDemoMode ? 'bg-amber-400' : ''}`}>
            {isDemoMode ? <Eye className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Store Dashboard</h1>
            {isDemoMode && <span className="text-xs font-bold text-amber-600 uppercase tracking-wide">Preview Mode (Mock Data)</span>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-bold text-sm transition-colors mr-2"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Store</span>
          </button>

          {!isDemoMode && viewTab !== 'settings' && viewTab !== 'analytics' && (
            <button onClick={fetchOrders} className="p-2 hover:bg-gray-100 rounded-full" title="Refresh">
              <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
           {viewTab === 'analytics' && (
            <button onClick={fetchAnalytics} className="p-2 hover:bg-gray-100 rounded-full" title="Refresh Analytics">
              <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
          <button onClick={onClose} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl no-print">
        
        {/* Stats Cards - Only show on Order Tabs */}
        {(viewTab !== 'settings' && viewTab !== 'analytics') && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-500 text-sm font-medium">Total Revenue</h3>
                <DollarSign className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-3xl font-black text-gray-900">R {stats.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-500 text-sm font-medium">Total Orders</h3>
                <ShoppingBag className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-3xl font-black text-gray-900">{stats.totalOrders}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-500 text-sm font-medium">Avg. Order Value</h3>
                <TrendingUp className="w-5 h-5 text-amber-500" />
                </div>
                <p className="text-3xl font-black text-gray-900">R {stats.avgOrderValue.toFixed(2)}</p>
            </div>
            </div>
        )}

        {/* Actions & Tab Navigation */}
        <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="bg-white p-1 rounded-lg border border-gray-200 inline-flex shadow-sm">
                    <button 
                        onClick={() => { setViewTab('active'); clearFilters(); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md font-bold text-sm transition-all ${viewTab === 'active' ? 'bg-gray-900 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <Clock className="w-4 h-4" /> Active Orders
                    </button>
                    <button 
                        onClick={() => setViewTab('history')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md font-bold text-sm transition-all ${viewTab === 'history' ? 'bg-gray-900 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <Archive className="w-4 h-4" /> History
                    </button>
                     <button 
                        onClick={() => setViewTab('analytics')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md font-bold text-sm transition-all ${viewTab === 'analytics' ? 'bg-gray-900 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <BarChart2 className="w-4 h-4" /> Analytics
                    </button>
                     <button 
                        onClick={() => setViewTab('settings')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md font-bold text-sm transition-all ${viewTab === 'settings' ? 'bg-gray-900 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <Settings className="w-4 h-4" /> Settings
                    </button>
                </div>

                {(viewTab !== 'settings' && viewTab !== 'analytics') && (
                    <div className="flex gap-2">
                        <button 
                        onClick={downloadCSV}
                        className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg font-bold text-sm shadow-sm transition-colors"
                        >
                        <Calendar className="w-4 h-4" />
                        Export CSV
                        </button>
                        <button 
                        onClick={downloadBackup}
                        className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg font-bold text-sm shadow-sm transition-colors"
                        >
                        <Database className="w-4 h-4" />
                        Backup JSON
                        </button>
                    </div>
                )}
            </div>

            {/* SEARCH & FILTERS BAR (Visible in History Tab) */}
            {viewTab === 'history' && (
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm animate-in slide-in-from-top-2">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="w-full md:flex-1">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Search Customer</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <input 
                                    type="text"
                                    placeholder="Name, Email, Phone or ID..."
                                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-amber-500 outline-none"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        
                        <div className="w-full md:w-auto flex gap-2">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">From Date</label>
                                <input 
                                    type="date"
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-amber-500 outline-none"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">To Date</label>
                                <input 
                                    type="date"
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-amber-500 outline-none"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <button 
                            onClick={clearFilters}
                            className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                            title="Clear Filters"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>
                    </div>
                    {(searchTerm || startDate || endDate) && (
                        <div className="mt-2 text-xs text-amber-600 font-medium flex items-center gap-1">
                            <Filter className="w-3 h-3" /> Filters active showing specific results
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* ... (Analytics & Settings Views - UNCHANGED) ... */}
        {viewTab === 'analytics' && (
            <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                        <BarChart2 className="w-6 h-6 text-amber-600" />
                        Traffic Overview (Last 500 Hits)
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Device Breakdown */}
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                             <h3 className="text-sm font-bold text-gray-500 uppercase mb-4">Device Usage</h3>
                             <div className="flex items-center gap-8">
                                <div className="flex-1 text-center">
                                    <Smartphone className="w-8 h-8 mx-auto text-blue-500 mb-2" />
                                    <p className="text-2xl font-black text-gray-900">{getDeviceStats().mobile}</p>
                                    <p className="text-xs text-gray-500">Mobile</p>
                                </div>
                                <div className="w-px h-12 bg-gray-200"></div>
                                <div className="flex-1 text-center">
                                    <Monitor className="w-8 h-8 mx-auto text-indigo-500 mb-2" />
                                    <p className="text-2xl font-black text-gray-900">{getDeviceStats().desktop}</p>
                                    <p className="text-xs text-gray-500">Desktop</p>
                                </div>
                             </div>
                             {analyticsData.length > 0 && (
                                <div className="mt-4 text-center">
                                    <p className="text-xs font-bold text-green-600 bg-green-100 inline-block px-2 py-1 rounded">
                                        Conversion Rate: {((stats.totalOrders / analyticsData.length) * 100).toFixed(1)}%
                                    </p>
                                </div>
                             )}
                        </div>

                        {/* Top Locations */}
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                             <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 flex items-center gap-2">
                                <MapPin className="w-4 h-4" /> Top Locations
                             </h3>
                             <div className="space-y-3">
                                {getTopLocations().length === 0 ? (
                                    <p className="text-gray-400 text-sm">No location data collected yet.</p>
                                ) : (
                                    getTopLocations().map(([loc, count], idx) => (
                                        <div key={idx} className="flex justify-between items-center text-sm border-b border-gray-200 pb-2 last:border-0">
                                            <span className="font-medium text-gray-700">{idx + 1}. {loc}</span>
                                            <span className="font-bold bg-white px-2 py-0.5 rounded border text-gray-900">{count}</span>
                                        </div>
                                    ))
                                )}
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {viewTab === 'settings' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-2xl mx-auto">
                 {/* ... (Settings UI code - UNCHANGED) ... */}
                 <div className="flex items-center gap-4 mb-6 border-b pb-4">
                     <div className="bg-gray-100 p-3 rounded-full">
                         <Key className="w-8 h-8 text-gray-700" />
                     </div>
                     <div>
                         <h2 className="text-2xl font-black text-gray-900">Store Configuration</h2>
                         <p className="text-gray-500">Manage your Yoco API Keys and Payment Mode.</p>
                     </div>
                 </div>

                 <div className="space-y-6">
                     {/* Toggle Mode */}
                     <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200">
                         <div>
                             <h4 className="font-bold text-gray-900">Payment Gateway Mode</h4>
                             <p className="text-xs text-gray-500 mt-1">
                                 {settings.is_live_mode 
                                    ? "Real money transactions enabled." 
                                    : "Simulation only. No cards charged."}
                             </p>
                         </div>
                         <button 
                            onClick={() => setSettings(prev => ({...prev, is_live_mode: !prev.is_live_mode}))}
                            className={`flex items-center gap-3 px-5 py-3 rounded-xl font-bold transition-all shadow-sm border-2 ${
                            settings.is_live_mode 
                                ? 'bg-green-50 border-green-500 text-green-700 hover:bg-green-100' 
                                : 'bg-yellow-50 border-yellow-400 text-yellow-700 hover:bg-yellow-100'
                            }`}
                        >
                            {/* The Light Indicator */}
                            <span className={`relative flex h-3 w-3`}>
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${settings.is_live_mode ? 'bg-green-500' : 'bg-yellow-400'}`}></span>
                                <span className={`relative inline-flex rounded-full h-3 w-3 ${settings.is_live_mode ? 'bg-green-600' : 'bg-yellow-400'}`}></span>
                            </span>

                            <span>{settings.is_live_mode ? 'LIVE MODE' : 'DEMO MODE'}</span>
                            
                            {/* Toggle Icon */}
                            {settings.is_live_mode ? <ToggleRight className="w-6 h-6 ml-2" /> : <ToggleLeft className="w-6 h-6 ml-2" />}
                        </button>
                     </div>

                     {/* Keys */}
                     <div>
                         <label className="block text-sm font-bold text-gray-700 mb-1">Yoco Test Key (pk_test_...)</label>
                         <input 
                            type="text" 
                            className="w-full border border-gray-300 rounded-lg p-3 font-mono text-sm bg-gray-50 focus:border-amber-500 focus:bg-white outline-none transition-all"
                            value={settings.yoco_test_key}
                            onChange={(e) => setSettings(prev => ({...prev, yoco_test_key: e.target.value}))}
                            placeholder="pk_test_..."
                         />
                     </div>
                     
                     <div>
                         <label className="block text-sm font-bold text-gray-700 mb-1">Yoco Live Key (pk_live_...)</label>
                         <input 
                            type="text" 
                            className="w-full border border-gray-300 rounded-lg p-3 font-mono text-sm bg-gray-50 focus:border-amber-500 focus:bg-white outline-none transition-all"
                            value={settings.yoco_live_key}
                            onChange={(e) => setSettings(prev => ({...prev, yoco_live_key: e.target.value}))}
                            placeholder="pk_live_..."
                         />
                     </div>

                     <div className="pt-4 border-t flex flex-col gap-4">
                         <button 
                            onClick={saveSettings}
                            disabled={savingSettings}
                            className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                         >
                             {savingSettings ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                             {savingSettings ? 'Saving...' : 'Save Settings'}
                         </button>

                         {/* TEST EMAIL BUTTON */}
                         <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center justify-between">
                             <div>
                                <h5 className="font-bold text-blue-900 text-sm">Test Email Connection</h5>
                                <p className="text-xs text-blue-700">Send a dummy receipt to verify Mailtrap.</p>
                             </div>
                             <button
                                onClick={handleSendTestEmail}
                                disabled={sendingTestEmail}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                             >
                                {sendingTestEmail ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                                {sendingTestEmail ? 'Sending...' : 'Send Test'}
                             </button>
                         </div>
                     </div>
                 </div>
            </div>
        )}

        {/* Orders Table */}
        {(viewTab !== 'settings' && viewTab !== 'analytics') && (
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
                    <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
                        {viewTab === 'active' ? <CheckSquare className="w-12 h-12 opacity-20" /> : <Archive className="w-12 h-12 opacity-20" />}
                        <p className="font-medium">
                            {loading ? 'Loading...' : viewTab === 'active' ? 'All active orders are cleared!' : 'No matching history found.'}
                        </p>
                        {(searchTerm || startDate || endDate) && viewTab === 'history' && (
                            <button onClick={clearFilters} className="text-sm text-blue-600 hover:underline">Clear Search Filters</button>
                        )}
                        </td>
                    </tr>
                    ) : (
                    displayedOrders.map((order) => {
                        const isShipped = order.status === 'shipped';
                        return (
                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                            <button 
                                onClick={(e) => toggleShippingStatus(order.id, order.status, e)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-bold transition-all shadow-sm ${
                                isShipped 
                                    ? 'bg-green-100 border-green-200 text-green-700 hover:bg-green-200' 
                                    : 'bg-white border-gray-300 text-gray-600 hover:bg-amber-50 hover:border-amber-300'
                                }`}
                            >
                                {isShipped ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                {isShipped ? 'Done' : 'Mark Done'}
                            </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleDateString()}
                            <div className="text-xs text-gray-400">{new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-gray-900">{order.customer_name}</div>
                            <div className="text-xs text-gray-500">{order.email}</div>
                            <div className="text-xs text-gray-400 md:hidden">{order.phone}</div>
                            </td>
                            <td className="px-6 py-4">
                            <div className="text-sm text-gray-700 max-w-xs truncate">
                                {order.items.length} items 
                                {order.items.some((i: any) => i.is_bonus) && <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1 rounded">+ BONUS</span>}
                            </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                            R {order.total_amount?.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                            <button 
                                onClick={() => setSelectedOrder(order)}
                                className="text-blue-600 hover:text-blue-800 font-bold text-sm flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100"
                            >
                                <Eye className="w-4 h-4" /> Invoice
                            </button>
                            </td>
                        </tr>
                        );
                    })
                    )}
                </tbody>
                </table>
            </div>
            </div>
        )}

        {/* DETAILED INVOICE MODAL */}
        {selectedOrder && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/70 backdrop-blur-sm no-print" onClick={() => setSelectedOrder(null)}></div>
             
             {/* Invoice Container - ID used for print CSS */}
             <div id="printable-invoice" className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl relative z-20 flex flex-col max-h-[90vh]">
                
                {/* Invoice Header */}
                <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl no-print-bg">
                   <div>
                      <div className="flex items-center gap-3">
                         <h3 className="text-2xl font-black text-gray-900">Invoice #{selectedOrder.id}</h3>
                         <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase border ${selectedOrder.status === 'shipped' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                            {selectedOrder.status === 'shipped' ? 'Paid & Shipped' : 'Paid - Pending'}
                         </span>
                      </div>
                      <p className="text-sm text-gray-500">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                   </div>
                   
                   <div className="flex items-center gap-2 no-print">
                     <button onClick={handlePrint} className="p-2 hover:bg-gray-200 rounded-full text-gray-700 flex items-center gap-2 bg-white border border-gray-300 shadow-sm px-4">
                        <Printer className="w-4 h-4" /> Print
                     </button>
                     <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500">
                        <X className="w-6 h-6" />
                     </button>
                   </div>
                </div>

                <div className="p-8 overflow-y-auto">
                   
                   {/* Print-only Header (Visible only when printing) */}
                   <div className="hidden print:block mb-8 pb-4 border-b border-gray-200">
                      <div className="flex justify-between items-start">
                           <div>
                               <h1 className="text-4xl font-black text-gray-900 tracking-tight">Sumami Brand</h1>
                               <p className="text-sm text-gray-500 mt-1">Premium Infused Soya Sauces</p>
                           </div>
                           <div className="text-right text-sm text-gray-600">
                               <p className="font-bold text-gray-900">Sumami Sales</p>
                               <p>sales@soyasauce.co.za</p>
                               <p>066 243 4867</p>
                               <p>Amanzimtoti, KwaZulu-Natal</p>
                           </div>
                       </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 print:bg-white print:border-0 print:p-0">
                         <h4 className="font-bold text-gray-700 mb-2 uppercase text-xs tracking-wider">Customer</h4>
                         <p className="text-lg font-bold">{selectedOrder.customer_name}</p>
                         <p className="text-gray-600">{selectedOrder.email}</p>
                         <p className="text-gray-600">{selectedOrder.phone}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 print:bg-white print:border-0 print:p-0">
                         <h4 className="font-bold text-gray-700 mb-2 uppercase text-xs tracking-wider">Shipping Address</h4>
                         <p className="text-gray-800">{selectedOrder.address_full}</p>
                      </div>
                   </div>

                   {/* --- TRACKING SECTION (NEW) --- */}
                   <div className="no-print mb-8">
                        <h4 className="font-bold text-gray-900 mb-4 text-lg border-b pb-2">Fulfillment</h4>
                        
                        {selectedOrder.tracking_number ? (
                            <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-green-100 p-2 rounded-full"><Truck className="w-5 h-5 text-green-700" /></div>
                                        <div>
                                            <h5 className="font-bold text-green-900">Order Shipped</h5>
                                            <p className="text-sm text-green-700">{selectedOrder.courier_name} - {selectedOrder.tracking_number}</p>
                                        </div>
                                    </div>
                                    {selectedOrder.tracking_url && (
                                        <a href={selectedOrder.tracking_url} target="_blank" rel="noopener noreferrer" className="text-green-700 hover:text-green-900 text-sm font-bold underline flex items-center gap-1">
                                            Track <LinkIcon className="w-3 h-3" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-blue-50 p-5 rounded-xl border border-blue-200">
                                <h5 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                                    <Truck className="w-4 h-4" /> Add Tracking Details
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                    <div>
                                        <label className="block text-xs font-bold text-blue-800 uppercase mb-1">Courier Name</label>
                                        <input 
                                            value={trackingInput.courier}
                                            onChange={(e) => setTrackingInput({...trackingInput, courier: e.target.value})}
                                            className="w-full text-sm p-2 border border-blue-200 rounded-lg focus:outline-none focus:border-blue-500"
                                            placeholder="e.g. The Courier Guy"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-blue-800 uppercase mb-1">Tracking Code</label>
                                        <input 
                                            value={trackingInput.code}
                                            onChange={(e) => setTrackingInput({...trackingInput, code: e.target.value})}
                                            className="w-full text-sm p-2 border border-blue-200 rounded-lg focus:outline-none focus:border-blue-500"
                                            placeholder="TCG..."
                                        />
                                    </div>
                                </div>
                                <div className="mb-4">
                                     <label className="block text-xs font-bold text-blue-800 uppercase mb-1">Tracking Link (Optional)</label>
                                     <input 
                                        value={trackingInput.url}
                                        onChange={(e) => setTrackingInput({...trackingInput, url: e.target.value})}
                                        className="w-full text-sm p-2 border border-blue-200 rounded-lg focus:outline-none focus:border-blue-500"
                                        placeholder="https://portal.thecourierguy.co.za/track/..."
                                     />
                                </div>
                                <button 
                                    onClick={handleSaveTracking}
                                    disabled={isSendingTracking}
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                                >
                                    {isSendingTracking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    {isSendingTracking ? 'Sending Update...' : 'Save & Notify Customer'}
                                </button>
                                <p className="text-xs text-blue-600/70 mt-2 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    This will trigger an email to {selectedOrder.email}
                                </p>
                            </div>
                        )}
                   </div>

                   <h4 className="font-bold text-gray-900 mb-4 text-lg">Order Items</h4>
                   <div className="border border-gray-200 rounded-lg overflow-hidden print:border-black">
                      <table className="w-full text-left">
                         <thead className="bg-gray-100 print:bg-white print:border-b">
                            <tr>
                               <th className="p-4 text-xs font-bold text-gray-500 uppercase">Item / Description</th>
                               <th className="p-4 text-xs font-bold text-gray-500 uppercase">SKU</th>
                               <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Qty</th>
                               <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Price</th>
                               <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Total</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-100 print:divide-gray-300">
                            {selectedOrder.items.map((item: any, idx: number) => (
                               <tr key={idx} className={`${item.is_bonus ? 'bg-amber-50 print:bg-white' : ''}`}>
                                  <td className="p-4">
                                     <div className="font-bold text-gray-900">
                                        {item.name}
                                        {item.is_bonus && <span className="ml-2 bg-amber-200 text-amber-800 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase print:border print:border-gray-300">FREE GIFT</span>}
                                     </div>
                                     <div className="text-sm text-gray-500">{item.variant}</div>
                                     {item.options && item.options.length > 0 && (
                                        <div className="text-xs text-gray-400 mt-1">{item.options.join(', ')}</div>
                                     )}
                                  </td>
                                  <td className="p-4 text-sm text-gray-500 font-mono">{item.sku || '-'}</td>
                                  <td className="p-4 text-center font-bold">{item.quantity}</td>
                                  <td className="p-4 text-right text-sm text-gray-600">R {item.price}</td>
                                  <td className="p-4 text-right font-bold text-gray-900">
                                     R {(item.price * item.quantity).toFixed(2)}
                                  </td>
                               </tr>
                            ))}
                         </tbody>
                         <tfoot className="bg-gray-50 print:bg-white print:border-t print:border-black">
                            <tr>
                               <td colSpan={4} className="p-4 text-right font-bold text-gray-600">Total Paid:</td>
                               <td className="p-4 text-right font-black text-xl text-gray-900">R {selectedOrder.total_amount?.toFixed(2)}</td>
                            </tr>
                         </tfoot>
                      </table>
                   </div>
                </div>

                <div className="p-6 border-t bg-gray-50 rounded-b-2xl flex justify-end no-print">
                   <button 
                      onClick={() => setSelectedOrder(null)}
                      className="px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-colors"
                   >
                      Close Invoice
                   </button>
                </div>
             </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
