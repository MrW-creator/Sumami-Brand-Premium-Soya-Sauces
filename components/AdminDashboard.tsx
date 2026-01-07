
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Lock, Download, Database, RefreshCw, X, TrendingUp, ShoppingBag, DollarSign, Calendar } from 'lucide-react';
import { SUPABASE_CONFIG, ADMIN_PIN } from '../constants';

interface AdminDashboardProps {
  onClose: () => void;
}

// Initialize Supabase Client locally for this component
let supabase: any = null;
try {
  if (SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey) {
    supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
  }
} catch (error) {
  console.error("Supabase init error:", error);
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      setIsAuthenticated(true);
      fetchOrders();
    } else {
      setError('Invalid PIN');
    }
  };

  const fetchOrders = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      // Fetch all orders, newest first
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setOrders(data || []);
      
      // Calculate stats
      const revenue = data?.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0) || 0;
      const count = data?.length || 0;
      
      setStats({
        totalRevenue: revenue,
        totalOrders: count,
        avgOrderValue: count > 0 ? revenue / count : 0
      });

    } catch (err: any) {
      console.error('Error fetching orders:', err);
      alert('Error loading data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    // Headers
    let csv = 'Order ID,Date,Customer Name,Email,Phone,City,Items,Total Amount,Status\n';
    
    // Rows
    orders.forEach(order => {
      const date = new Date(order.created_at).toLocaleDateString();
      const itemsSummary = order.items.map((i: any) => `${i.quantity}x ${i.name} (${i.variant})`).join(' | ');
      // Escape commas in strings to prevent CSV breakage
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

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-[100] bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full text-center">
          <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Admin Access</h2>
          <p className="text-gray-500 mb-6">Enter PIN to view sales data.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              maxLength={6}
              className="w-full text-center text-2xl tracking-[0.5em] font-bold border-2 border-gray-200 rounded-lg py-3 focus:border-amber-500 outline-none"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              autoFocus
            />
            {error && <p className="text-red-500 text-sm font-bold">{error}</p>}
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
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-gray-100 overflow-auto">
      {/* Navbar */}
      <div className="bg-white border-b sticky top-0 z-10 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-amber-600 text-white p-2 rounded-lg">
            <Lock className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Store Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchOrders} className="p-2 hover:bg-gray-100 rounded-full" title="Refresh">
            <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={onClose} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        
        {/* Stats Cards */}
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

        {/* Actions */}
        <div className="flex gap-4 mb-6">
          <button 
            onClick={downloadCSV}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition-colors"
          >
            <Calendar className="w-4 h-4" />
            Export for Google Sheets (CSV)
          </button>
          <button 
            onClick={downloadBackup}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition-colors"
          >
            <Database className="w-4 h-4" />
            Download Full Backup (JSON)
          </button>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      {loading ? 'Loading sales data...' : 'No orders found yet.'}
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                        <div className="text-xs text-gray-400">{new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">{order.customer_name}</div>
                        <div className="text-xs text-gray-500">{order.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700 max-w-xs truncate">
                          {order.items.map((i: any) => `${i.quantity}x ${i.name}`).join(', ')}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {order.items.length} items
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        R {order.total_amount?.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${order.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {order.status?.toUpperCase() || 'PENDING'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
