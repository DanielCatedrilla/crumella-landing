"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "../../components/supabase";
import Link from "next/link";

const STORE_LOCATION = { lat: 10.7819, lng: 122.5438 }; // GT Town Center Pavia

export default function AdminPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'vouchers' | 'statistics' | 'feedbacks'>('orders');
  const [password, setPassword] = useState("");
  const [orderFilter, setOrderFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setAuthChecking(false);
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchOrders = async (background = false) => {
    if (!background) setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error("Error fetching orders:", error);
    } else {
      const sortedData = (data || []).sort((a, b) => {
        const dateA = a.customer?.date || '9999-12-31';
        const dateB = b.customer?.date || '9999-12-31';
        if (dateA !== dateB) return dateA.localeCompare(dateB);

        const getTimeVal = (t: string) => {
          if (!t) return 9999;
          const match = t.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|AM|PM)?/);
          if (!match) return 9999;
          let h = parseInt(match[1]);
          const m = match[2] ? parseInt(match[2]) : 0;
          const mer = match[3]?.toLowerCase();
          if (mer === 'pm' && h < 12) h += 12;
          if (mer === 'am' && h === 12) h = 0;
          return h * 60 + m;
        };
        return getTimeVal(a.customer?.timeWindow || '') - getTimeVal(b.customer?.timeWindow || '');
      });
      setOrders(sortedData);
    }
    setLoading(false);
  };

  const fetchVouchers = async () => {
    const { data, error } = await supabase
      .from('vouchers')
      .select('*')
      .order('id', { ascending: true });
    if (!error) setVouchers(data || []);
  };

  const fetchFeedbacks = async () => {
    const { data, error } = await supabase
      .from('feedbacks')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setFeedbacks(data || []);
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    const load = async () => {
      await fetchOrders();
      await fetchVouchers();
      await fetchFeedbacks();
    };
    void load();

    const channel = supabase
      .channel('realtime orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        void fetchOrders(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated]);

  const stats = React.useMemo(() => {
    const monthlyMap: Record<string, { count: number; revenue: number }> = {};
    const productMap: Record<string, number> = {};
    let totalBoxes = 0;

    orders.forEach((order) => {
      // Monthly Stats
      const d = new Date(order.createdAt);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { count: 0, revenue: 0 };
      monthlyMap[monthKey].count += 1;
      monthlyMap[monthKey].revenue += (Number(order.finalTotal) || 0);

      // Product Stats
      if (Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          const qty = Number(item.quantity) || 0;
          productMap[item.name] = (productMap[item.name] || 0) + qty;
          totalBoxes += qty;
        });
      }
    });

    const monthly = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, data]) => {
        const [year, month] = key.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return {
          label: date.toLocaleString('default', { month: 'short', year: '2-digit' }),
          count: data.count,
          revenue: data.revenue,
        };
      });

    let bestSeller = { name: 'No sales yet', count: 0 };
    Object.entries(productMap).forEach(([name, count]) => {
      if (count > bestSeller.count) {
        bestSeller = { name, count };
      }
    });

    // Cookie Ratings Logic
    const cookieRatingsMap: Record<string, {
      totalScore: number;
      count: number;
      taste: number;
      texture: number;
      smell: number;
      aftertaste: number;
    }> = {};

    feedbacks.forEach((fb) => {
      if (fb.ratings) {
        Object.entries(fb.ratings).forEach(([cookieName, scores]: [string, any]) => {
          if (!cookieRatingsMap[cookieName]) {
            cookieRatingsMap[cookieName] = { totalScore: 0, count: 0, taste: 0, texture: 0, smell: 0, aftertaste: 0 };
          }
          const entry = cookieRatingsMap[cookieName];
          entry.count += 1;
          entry.taste += (scores.taste || 0);
          entry.texture += (scores.texture || 0);
          entry.smell += (scores.smell || 0);
          entry.aftertaste += (scores.aftertaste || 0);
          
          const instanceAvg = ((scores.taste || 0) + (scores.texture || 0) + (scores.smell || 0) + (scores.aftertaste || 0)) / 4;
          entry.totalScore += instanceAvg;
        });
      }
    });

    const cookieRatings = Object.entries(cookieRatingsMap).map(([name, data]) => ({
      name,
      average: data.totalScore / data.count,
      count: data.count,
      taste: data.taste / data.count,
      texture: data.texture / data.count,
      smell: data.smell / data.count,
      aftertaste: data.aftertaste / data.count,
    })).sort((a, b) => b.average - a.average);

    return { monthly, bestSeller, totalBoxes, cookieRatings };
  }, [orders, feedbacks]);

  const filteredOrders = orders.filter(order => {
    const statusMatch = orderFilter === 'All' || order.status === orderFilter;
    if (!statusMatch) {
      return false;
    }

    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      return true;
    }

    return (
      (order.customer?.name || '').toLowerCase().includes(query) ||
      (order.tracking_number || '').toLowerCase().includes(query) ||
      (order.customer?.phone || '').toLowerCase().includes(query)
    );
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email: "compsci.daniel23@gmail.com",
      password,
    });
    if (error) {
      alert("Incorrect password");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setPassword("");
  };


  const deleteFeedback = async (id: any) => {
    if (!window.confirm("Are you sure you want to delete this feedback?")) return;

    const { error } = await supabase
      .from('feedbacks')
      .delete()
      .eq('id', id);

    if (error) {
      alert("Error deleting feedback");
    } else {
      setFeedbacks((prev) => prev.filter((fb) => fb.id !== id));
    }
  };

  const getDeliveryFee = (customer: any) => {
    if (customer.orderType !== 'delivery' || !customer.latitude || !customer.longitude) return 0;
    
    const R = 6371; // Radius of the earth in km
    const dLat = (customer.latitude - STORE_LOCATION.lat) * (Math.PI / 180);
    const dLon = (customer.longitude - STORE_LOCATION.lng) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(STORE_LOCATION.lat * (Math.PI / 180)) * Math.cos(customer.latitude * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;
    
    if (distanceKm <= 5) {
      return 50;
    } else {
      return 50 + (Math.ceil(distanceKm - 5) * 6);
    }
  };

  const resetVoucher = async (id: number) => {
    if (!window.confirm("Reset usage count for this voucher?")) return;

    const { error } = await supabase
      .from('vouchers')
      .update({ used_count: 0 })
      .eq('id', id);

    if (!error) {
      fetchVouchers();
    }
  };

  const updateStatus = async (id: any, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      alert("Error updating status");
    } else {
      fetchOrders(true); // Refresh list to show new status
    }
  };

  const updateOrderDate = async (id: any, currentCustomer: any, newDate: string) => {
    const updatedCustomer = { ...currentCustomer, date: newDate };
    const { error } = await supabase
      .from('orders')
      .update({ customer: updatedCustomer })
      .eq('id', id);

    if (error) {
      alert("Error updating date");
    } else {
      fetchOrders(true);
    }
  };

  const updatePaymentMethod = async (id: any, newMethod: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ paymentMethod: newMethod })
      .eq('id', id);

    if (error) {
      alert("Error updating payment method");
    } else {
      fetchOrders(true);
    }
  };

  const updateOrderTotal = async (id: any, newTotal: number, currentCustomer: any, currentOrderTotal: number) => {
    let originalTotal = currentCustomer.originalTotal;

    if (originalTotal === undefined && !currentCustomer.isManualDiscount) {
      originalTotal = currentOrderTotal;
    }

    const isBackToOriginal = originalTotal !== undefined && newTotal === originalTotal;
    const updatedCustomer = { ...currentCustomer };

    if (isBackToOriginal) {
      updatedCustomer.isManualDiscount = false;
      delete updatedCustomer.originalTotal;
    } else {
      updatedCustomer.isManualDiscount = true;
      if (originalTotal !== undefined) updatedCustomer.originalTotal = originalTotal;
    }

    const { error } = await supabase
      .from('orders')
      .update({ finalTotal: newTotal, customer: updatedCustomer })
      .eq('id', id);

    if (error) {
      alert("Error updating total");
    } else {
      fetchOrders(true);
    }
  };

  const deleteOrder = async (id: any) => {
    if (!window.confirm("Are you sure you want to delete this order? This action cannot be undone.")) return;

    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);

    if (error) {
      alert("Error deleting order");
    } else {
      setOrders((prev) => prev.filter((order) => order.id !== id));
    }
  };

  const printOrder = (order: any) => {
    const printWindow = window.open('', '', 'width=400,height=600');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Kitchen Ticket #${order.id}</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 20px; max-width: 320px; margin: 0 auto; color: #000; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px dashed #000; padding-bottom: 15px; }
            h1 { font-size: 24px; margin: 0 0 5px 0; font-weight: 900; }
            .meta { font-size: 12px; margin-bottom: 5px; }
            .tag { display: inline-block; background: #000; color: #fff; padding: 2px 6px; font-weight: bold; text-transform: uppercase; margin-top: 5px; }
            .section { margin-bottom: 15px; border-bottom: 1px dashed #ccc; padding-bottom: 15px; }
            .label { font-size: 10px; text-transform: uppercase; color: #666; margin-bottom: 2px; }
            .value { font-size: 14px; font-weight: bold; }
            .items { margin: 15px 0; }
            .item { display: flex; align-items: flex-start; margin-bottom: 8px; font-size: 14px; }
            .qty { font-weight: 900; width: 30px; font-size: 16px; }
            .name { flex: 1; }
            .notes { background: #f0f0f0; padding: 10px; font-style: italic; font-size: 12px; margin-top: 10px; }
            @media print {
              body { -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>THE CHEWY CO.</h1>
            <div class="meta">Order #{order.id} • Ref: ${order.tracking_number || 'N/A'} • ${new Date(order.createdAt).toLocaleDateString()}</div>
            <div class="tag">${order.customer.orderType}</div>
          </div>

          <div class="section">
            <div class="label">Customer</div>
            <div class="value">${order.customer.name}</div>
            <div style="font-size: 12px;">${order.customer.phone}</div>
          </div>

          <div class="section">
            <div class="label">Logistics</div>
            <div class="value">${order.customer.date}</div>
            <div style="font-size: 12px;">${order.customer.timeWindow}</div>
            <div style="font-size: 12px; margin-top: 5px;">
              ${order.customer.orderType === 'delivery' ? order.customer.address : order.customer.pickupLocation}
            </div>
          </div>

          <div class="items">
            <div class="label" style="margin-bottom: 10px;">Order Items</div>
            ${order.items.map((item: any) => `
              <div class="item">
                <div class="qty">${item.quantity}</div>
                <div class="name">${item.name}</div>
              </div>
            `).join('')}
          </div>

          ${order.customer.notes ? `
            <div class="notes">
              <strong>Note:</strong> ${order.customer.notes}
            </div>
          ` : ''}
          
          <script>
            window.onload = () => { window.print(); setTimeout(() => window.close(), 500); };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm">Checking session…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 w-full max-w-sm">
          <h1 className="text-2xl font-black text-center mb-6 text-gray-900">Admin Login</h1>
          <input
            type="password"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 mb-4 outline-none focus:border-black transition-all text-gray-900 placeholder-gray-500"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="w-full bg-black text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors cursor-pointer">
            Login
          </button>
          <Link href="/" className="block text-center text-sm text-gray-600 mt-4 hover:text-black">Back to Home</Link>
        </form>
      </div>
    );
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900">Loading orders...</div>;

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 font-sans">
      <div>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-black text-black">Admin Dashboard</h1>
          <div className="flex items-center gap-4 self-start md:self-auto">
            <Link href="/" className="text-sm font-bold underline hover:text-gray-600 whitespace-nowrap">Back to Home</Link>
            <button 
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-600 transition-colors whitespace-nowrap"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-8 p-1 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/80 shadow-sm self-start">
          <button 
            onClick={() => setActiveTab('orders')}
            className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'orders' ? 'bg-white text-black shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-black'}`}
          >
            Orders
          </button>
          <button 
            onClick={() => setActiveTab('vouchers')}
            className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'vouchers' ? 'bg-white text-black shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-black'}`}
          >
            Vouchers
          </button>
          <button 
            onClick={() => setActiveTab('statistics')}
            className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'statistics' ? 'bg-white text-black shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-black'}`}
          >
            Statistics
          </button>
          <button 
            onClick={() => setActiveTab('feedbacks')}
            className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'feedbacks' ? 'bg-white text-black shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-black'}`}
          >
            Feedbacks
          </button>
        </div>

        {activeTab === 'orders' ? (
          <>
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
              {['All', 'New', 'Pending', 'Processing', 'Releasing', 'Completed', 'Cancelled'].map((status) => (
                <button 
                  key={status}
                  onClick={() => setOrderFilter(status)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${
                    orderFilter === status 
                    ? 'bg-black text-white border-black' 
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  } shadow-sm`}
                >
                  {status}
                  <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] ${
                    orderFilter === status ? 'bg-white text-black' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {status === 'All' ? orders.length : orders.filter(o => o.status === status).length}
                  </span>
                </button>
              ))}
            </div>

            <div className="mb-6">
              <div className="relative md:max-w-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl leading-5 bg-white text-black placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:border-black sm:text-sm transition"
                  placeholder="Search by name, tracking no, or phone..."
                />
              </div>
            </div>

            <div className="hidden md:block bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white">
                <tr>
                  <th className="p-5 font-semibold text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">ID</th>
                  <th className="p-5 font-semibold text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">Tracking No.</th>
                  <th className="p-5 font-semibold text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">Date</th>
                  <th className="p-5 font-semibold text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">Customer</th>
                  <th className="p-5 font-semibold text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">Logistics</th>
                  <th className="p-5 font-semibold text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">Items</th>
                  <th className="p-5 font-semibold text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">Payment</th>
                  <th className="p-5 font-semibold text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">Del. Fee</th>
                  <th className="p-5 font-semibold text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">Total</th>
                  <th className="p-5 font-semibold text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">Proof</th>
                  <th className="p-5 font-semibold text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">Status</th>
                  <th className="p-5 font-semibold text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors border-b border-gray-100 last:border-b-0">
                    <td className="p-5 font-bold text-gray-500">{order.id}</td>
                    <td className="p-5 font-bold text-gray-900 font-mono">{order.tracking_number || '-'}</td>
                    <td className="p-5 text-gray-700 whitespace-nowrap">
                      {order.status === 'New' && (
                        <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold mb-1 inline-block animate-pulse">NEW</span>
                      )}
                      <div>{new Date(order.createdAt).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleTimeString()}</div>
                    </td>
                    <td className="p-5">
                      <div className="font-bold text-black">{order.customer.name}</div>
                      <div className="text-gray-600 text-xs">{order.customer.email}</div>
                      <div className="text-gray-600 text-xs">{order.customer.phone}</div>
                      <div className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                        order.customer.orderType === 'delivery' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-orange-50 text-orange-700 border-orange-200'
                      }`}>
                        {order.customer.orderType}
                      </div>
                    </td>
                    <td className="p-5 min-w-[200px]">
                      <div className="text-xs">
                        <div className="font-bold text-gray-900 mb-1">
                          {order.customer.orderType === 'delivery' ? '📍 Delivery Address' : '🏪 Pickup Location'}
                        </div>
                        <div className="text-gray-800 mb-3 leading-relaxed">
                          {order.customer.orderType === 'delivery' ? order.customer.address : order.customer.pickupLocation}
                        </div>
                        {(order.customer.latitude && order.customer.longitude || order.customer.googleMapsLink) && (
                          <a 
                            href={order.customer.latitude && order.customer.longitude 
                              ? `https://www.google.com/maps?q=${order.customer.latitude},${order.customer.longitude}`
                              : order.customer.googleMapsLink}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded border border-green-200 font-bold mb-3 hover:bg-green-100 transition-colors"
                          >
                            🗺️ View Pinned Map
                          </a>
                        )}
                        <div className="font-bold text-gray-900 mb-1">📅 Schedule</div>
                        <input 
                          type="date" 
                          className="text-gray-800 text-xs bg-transparent border-b border-gray-300 focus:border-black outline-none w-full mb-1"
                          defaultValue={order.customer.date}
                          onBlur={(e) => {
                            if (e.target.value !== order.customer.date) {
                              updateOrderDate(order.id, order.customer, e.target.value);
                            }
                          }}
                        />
                        <div className="text-gray-800">{order.customer.timeWindow}</div>
                        {order.customer.preferredTime && (
                          <div className="text-blue-600 font-bold mt-1">Pref: {order.customer.preferredTime}</div>
                        )}
                      </div>
                    </td>
                    <td className="p-5 min-w-[200px]">
                      <ul className="list-disc list-inside text-gray-700">
                        {order.items.map((item: any, idx: number) => (
                          <li key={idx}><span className="font-bold">{item.quantity}x</span> {item.name}</li>
                        ))}
                      </ul>
                      {order.customer.notes && (
                        <div className="text-xs text-gray-700 mt-2 italic bg-yellow-50 p-2 rounded-lg border border-yellow-100">Note: {order.customer.notes}</div>
                      )}
                    </td>
                    <td className="p-5 capitalize text-gray-700">
                      <select 
                        className="bg-gray-50 border border-gray-200 rounded-md focus:border-black outline-none cursor-pointer py-1 px-2 text-xs"
                        value={order.paymentMethod || 'cash'}
                        onChange={(e) => updatePaymentMethod(order.id, e.target.value)}
                      >
                        <option value="cash">Cash</option>
                        <option value="gcash">GCash</option>
                        <option value="bank">Bank Transfer</option>
                      </select>
                    </td>
                    <td className="p-5 text-gray-700 whitespace-nowrap">
                      {order.customer.orderType === 'delivery' ? (
                        <span className="font-medium">₱{getDeliveryFee(order.customer).toFixed(2)}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-5 font-bold text-black whitespace-nowrap">
                      <div className="flex items-center gap-1 relative group">
                        {order.customer.isManualDiscount && order.customer.originalTotal && (
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
                            Original: ₱{Number(order.customer.originalTotal).toFixed(2)}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                          </div>
                        )}
                        <span>₱</span>
                        <input 
                          key={order.finalTotal}
                          type="number" 
                          step="0.01"
                          defaultValue={order.finalTotal}
                          onBlur={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val) && val !== order.finalTotal) updateOrderTotal(order.id, val, order.customer, order.finalTotal);
                          }}
                          className={`w-20 bg-transparent border-b border-gray-300 focus:border-black outline-none py-1 ${order.customer.isManualDiscount ? 'text-purple-700 font-black' : ''}`}
                        />
                      </div>
                      {order.customer.isManualDiscount && (
                        <div className="mt-1">
                          <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-1 rounded border border-purple-200 inline-flex items-center gap-1">
                            ✍️ Personal Discount
                          </span>
                        </div>
                      )}
                      {order.voucherCode && (
                        <div className="mt-1">
                          <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded border border-green-200 inline-flex items-center gap-1">
                            🏷️ {order.voucherCode}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="p-5">
                      {order.proofUrl ? (
                        <a href={order.proofUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs font-bold">
                          View Image
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs font-medium">No Proof</span>
                      )}
                    </td>
                    <td className="p-5">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        order.status === 'Completed' ? 'bg-green-100 text-green-700' :
                        order.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                        order.status === 'Releasing' ? 'bg-orange-100 text-orange-700' :
                        order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-5">
                      <div className="flex flex-col gap-2">
                      <select 
                        className={`border-2 rounded-xl px-4 py-2 text-xs font-bold outline-none cursor-pointer transition-all ${
                          order.status === 'Completed' ? 'bg-green-50 border-green-200 text-green-700 hover:border-green-400' :
                          order.status === 'Processing' ? 'bg-blue-50 border-blue-200 text-blue-700 hover:border-blue-400' :
                          order.status === 'Releasing' ? 'bg-orange-50 border-orange-200 text-orange-700 hover:border-orange-400' :
                          order.status === 'Cancelled' ? 'bg-red-50 border-red-200 text-red-700 hover:border-red-400' :
                          'bg-yellow-50 border-yellow-200 text-yellow-700 hover:border-yellow-400'
                        }`}
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                      >
                        <option value="New">New (Received)</option>
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing (Baking)</option>
                        <option value="Releasing">Releasing (Ready/Out)</option>
                        <option value="Completed">Completed (Done)</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                      <button 
                        onClick={() => printOrder(order)}
                        className="flex items-center justify-center gap-2 w-full bg-slate-800 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors"
                      >
                        Print Ticket
                      </button>
                      <button 
                        onClick={() => deleteOrder(order.id)}
                        className="flex items-center justify-center gap-2 w-full bg-red-50 text-red-600 px-3 py-2 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors border border-red-100"
                      >
                        Delete
                      </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                    <tr>
                        <td colSpan={10} className="p-8 text-center text-gray-500">No orders found.</td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile View (Cards) */}
        <div className="md:hidden space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/50 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                  {order.status === 'New' && (
                    <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold mb-2 inline-block animate-pulse">NEW</span>
                  )}
                  <div className="text-xs text-gray-600 font-bold">
                    #{order.id} {order.tracking_number ? `• ${order.tracking_number}` : ''} • {new Date(order.createdAt).toLocaleDateString()} • {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                  <div className="font-black text-lg text-gray-900 mt-1">{order.customer.name}</div>
                  <div className="text-xs text-gray-600">{order.customer.phone}</div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  order.status === 'Completed' ? 'bg-green-100 text-green-700' :
                  order.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                  order.status === 'Releasing' ? 'bg-orange-100 text-orange-700' :
                  order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {order.status}
                </span>
              </div>

              <div className="bg-slate-100/80 p-4 rounded-2xl text-sm border border-white">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                     order.customer.orderType === 'delivery' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-orange-100 text-orange-700 border-orange-200'
                  }`}>
                    {order.customer.orderType}
                  </span>
                  <input 
                    type="date" 
                    className="font-bold text-gray-700 text-xs bg-transparent border-b border-gray-300 focus:border-black outline-none w-32"
                    defaultValue={order.customer.date}
                    onBlur={(e) => {
                      if (e.target.value !== order.customer.date) {
                        updateOrderDate(order.id, order.customer, e.target.value);
                      }
                    }}
                  />
                </div>
                <div className="text-gray-800 text-xs leading-relaxed">
                   {order.customer.orderType === 'delivery' ? order.customer.address : order.customer.pickupLocation}
                </div>
                {order.customer.orderType === 'delivery' && (order.customer.latitude && order.customer.longitude || order.customer.googleMapsLink) && (
                  <div className="mt-2">
                    <a 
                      href={order.customer.latitude && order.customer.longitude 
                        ? `https://www.google.com/maps?q=${order.customer.latitude},${order.customer.longitude}`
                        : order.customer.googleMapsLink}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded border border-green-200 font-bold text-xs hover:bg-green-200 transition-colors"
                    >
                      🗺️ View Pinned Map
                    </a>
                  </div>
                )}
                <div className="text-gray-800 text-xs mt-1">
                   Time: {order.customer.timeWindow}
                </div>
                {order.customer.orderType === 'delivery' && (
                  <div className="text-gray-800 text-xs mt-1 font-bold">
                    Delivery Fee: ₱{getDeliveryFee(order.customer).toFixed(2)}
                  </div>
                )}
              </div>

              <div>
                <div className="text-xs font-bold text-gray-600 uppercase mb-2">Items</div>
                <ul className="space-y-1">
                  {order.items.map((item: any, idx: number) => (
                    <li key={idx} className="text-sm text-gray-800">
                      <span className="font-bold">{item.quantity}x</span> {item.name}
                    </li>
                  ))}
                </ul>
                {order.customer.notes && (
                   <div className="mt-2 text-xs bg-yellow-50 text-yellow-800 p-2 rounded border border-yellow-100 italic">
                     "{order.customer.notes}"
                   </div>
                )}
              </div>

              <div className="flex justify-between items-center border-t border-slate-100 pt-4">
                <div>
                   <select 
                      className="text-xs text-gray-600 capitalize bg-slate-100/80 border border-gray-200 rounded-md focus:border-black outline-none mb-2 cursor-pointer p-1"
                      value={order.paymentMethod || 'cash'}
                      onChange={(e) => updatePaymentMethod(order.id, e.target.value)}
                   >
                      <option value="cash">Cash</option>
                      <option value="gcash">GCash</option>
                      <option value="bank">Bank Transfer</option>
                   </select>
                   <div className="font-black text-lg flex items-center gap-1 relative group">
                      {order.customer.isManualDiscount && order.customer.originalTotal && (
                        <div className="absolute bottom-full left-0 mb-2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg font-normal">
                          Original: ₱{Number(order.customer.originalTotal).toFixed(2)}
                          <div className="absolute top-full left-4 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                      )}
                      <span>₱</span>
                      <input 
                        key={order.finalTotal}
                        type="number" 
                        step="0.01"
                        defaultValue={order.finalTotal}
                        onBlur={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val) && val !== order.finalTotal) updateOrderTotal(order.id, val, order.customer, order.finalTotal);
                        }}
                        className={`w-24 bg-transparent border-b-2 border-gray-300 focus:border-black outline-none py-1 ${order.customer.isManualDiscount ? 'text-purple-700 font-black' : ''}`}
                      />
                   </div>
                   {order.customer.isManualDiscount && (
                      <div className="text-xs text-purple-600 font-bold mt-1 flex items-center gap-1">
                        <span>✍️ Personal Discount</span>
                      </div>
                   )}
                   {order.voucherCode && (
                      <div className="text-xs text-green-600 font-bold mt-1 flex items-center gap-1">
                        <span>🏷️ {order.voucherCode}</span>
                        <span className="text-green-500 font-medium">(-₱{order.discount?.toFixed(2)})</span>
                      </div>
                   )}
                </div>
                {order.proofUrl && (
                   <a href={order.proofUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs font-bold hover:underline">
                     View Proof
                   </a>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                 <select 
                    className={`w-full border-2 rounded-xl px-4 py-3 text-xs font-bold outline-none cursor-pointer transition-all ${
                      order.status === 'Completed' ? 'bg-green-50 border-green-200 text-green-700 hover:border-green-400' :
                      order.status === 'Processing' ? 'bg-blue-50 border-blue-200 text-blue-700 hover:border-blue-400' :
                      order.status === 'Releasing' ? 'bg-orange-50 border-orange-200 text-orange-700 hover:border-orange-400' :
                      order.status === 'Cancelled' ? 'bg-red-50 border-red-200 text-red-700 hover:border-red-400' :
                      'bg-yellow-50 border-yellow-200 text-yellow-700 hover:border-yellow-400'
                    }`}
                    value={order.status}
                    onChange={(e) => updateStatus(order.id, e.target.value)}
                 >
                    <option value="New">New (Received)</option>
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing (Baking)</option>
                    <option value="Releasing">Releasing (Ready/Out)</option>
                    <option value="Completed">Completed (Done)</option>
                    <option value="Cancelled">Cancelled</option>
                 </select>
                 <button 
                    onClick={() => printOrder(order)}
                    className="w-full bg-slate-800 text-white px-3 py-3 rounded-xl text-sm font-bold hover:bg-slate-700"
                 >
                    Print
                 </button>
                 <button 
                    onClick={() => deleteOrder(order.id)}
                    className="col-span-2 w-full bg-red-50 text-red-600 px-3 py-3 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors border border-red-100"
                 >
                    Delete Order
                 </button>
              </div>
            </div>
          ))}
          {filteredOrders.length === 0 && (
              <div className="text-center text-gray-500 py-10">No orders found.</div>
          )}
        </div>
          </>
        ) : activeTab === 'vouchers' ? (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="p-4 font-bold text-gray-700">Code</th>
                    <th className="p-4 font-bold text-gray-700">Value</th>
                    <th className="p-4 font-bold text-gray-700">Usage</th>
                    <th className="p-4 font-bold text-gray-700">Status</th>
                    <th className="p-4 font-bold text-gray-700">Expires</th>
                    <th className="p-4 font-bold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {vouchers.map((voucher) => (
                    <tr key={voucher.id} className="hover:bg-gray-50">
                      <td className="p-4 font-black text-gray-900">{voucher.code}</td>
                      <td className="p-4 text-gray-700">
                        {voucher.type === 'percentage' ? `${voucher.value}% OFF` : `₱${voucher.value} OFF`}
                      </td>
                      <td className="p-4 text-gray-700">
                        {voucher.used_count} / {voucher.max_uses || '∞'}
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          voucher.used_count >= voucher.max_uses ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {voucher.used_count >= voucher.max_uses ? 'Fully Redeemed' : 'Active'}
                        </span>
                      </td>
                      <td className="p-4 text-gray-500">
                        {voucher.expires_at ? new Date(voucher.expires_at).toLocaleDateString() : 'No Expiry'}
                      </td>
                      <td className="p-4">
                        <button 
                          onClick={() => resetVoucher(voucher.id)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-bold underline"
                        >
                          Reset
                        </button>
                      </td>
                    </tr>
                  ))}
                  {vouchers.length === 0 && (
                    <tr><td colSpan={6} className="p-8 text-center text-gray-500">No vouchers found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Mobile View */}
            <div className="md:hidden p-4 space-y-4">
              {vouchers.map((voucher) => (
                <div key={voucher.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-black text-lg text-gray-900">{voucher.code}</div>
                      <div className="text-sm text-gray-700 font-medium">
                        {voucher.type === 'percentage' ? `${voucher.value}% OFF` : `₱${voucher.value} OFF`}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      voucher.used_count >= voucher.max_uses ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {voucher.used_count >= voucher.max_uses ? 'Fully Redeemed' : 'Active'}
                    </span>
                  </div>
                  <div className="border-t border-gray-100 my-3"></div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div><strong>Usage:</strong> {voucher.used_count} / {voucher.max_uses || '∞'}</div>
                    <div><strong>Expires:</strong> {voucher.expires_at ? new Date(voucher.expires_at).toLocaleDateString() : 'No Expiry'}</div>
                  </div>
                  <div className="mt-3">
                    <button 
                      onClick={() => resetVoucher(voucher.id)}
                      className="text-blue-600 hover:text-blue-800 text-xs font-bold underline"
                    >
                      Reset Usage
                    </button>
                  </div>
                </div>
              ))}
              {vouchers.length === 0 && (
                <div className="text-center text-gray-500 py-10">No vouchers found.</div>
              )}
            </div>
          </div>
        ) : activeTab === 'statistics' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Most Popular Product</h3>
                <div className="text-3xl font-black text-black mb-1">{stats.bestSeller?.name}</div>
                <div className="text-sm text-gray-500">Sold {stats.bestSeller?.count} times all-time</div>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Total Boxes Sold</h3>
                <div className="text-3xl font-black text-black mb-1">{stats.totalBoxes}</div>
                <div className="text-sm text-gray-500">Across all orders</div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <div className="mb-8">
                <h3 className="text-xl font-black text-gray-900">Orders Overview</h3>
                <p className="text-sm text-gray-500 font-medium mt-1">Monthly order volume</p>
              </div>
              
              {stats.monthly.length > 0 ? (
                <div className="relative h-64 w-full">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="w-full border-t border-gray-100 h-0"></div>
                    ))}
                  </div>
                  
                  {/* Bars */}
                  <div className="absolute inset-0 flex items-end justify-between gap-4 pt-4 px-2">
                    {stats.monthly.map((m, i) => {
                      const max = Math.max(...stats.monthly.map(item => item.count), 1);
                      const height = (m.count / max) * 100;
                      return (
                        <div key={i} className="flex flex-col items-center justify-end h-full flex-1 group relative">
                           {/* Tooltip */}
                           <div className="absolute bottom-full mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-10 pointer-events-none">
                              <div className="bg-gray-900 text-white text-xs font-bold py-1.5 px-3 rounded-lg shadow-xl whitespace-nowrap">
                                {m.count} Orders
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                              </div>
                           </div>
                           
                           {/* Bar */}
                           <div 
                             className="w-full max-w-[48px] bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-xl transition-all duration-300 group-hover:to-blue-300 group-hover:scale-y-[1.05] origin-bottom shadow-lg shadow-blue-500/20"
                             style={{ height: `${height}%`, minHeight: '8px' }}
                           ></div>
                           
                           {/* Label */}
                           <div className="mt-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{m.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-400 font-medium bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  No data available yet
                </div>
              )}
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <div className="mb-8">
                <h3 className="text-xl font-black text-gray-900">Revenue Performance</h3>
                <p className="text-sm text-gray-500 font-medium mt-1">Monthly gross revenue</p>
              </div>

              {stats.monthly.length > 0 ? (
                <div className="relative h-64 w-full">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="w-full border-t border-gray-100 h-0"></div>
                    ))}
                  </div>
                  
                  {/* Bars */}
                  <div className="absolute inset-0 flex items-end justify-between gap-4 pt-4 px-2">
                    {stats.monthly.map((m, i) => {
                      const max = Math.max(...stats.monthly.map(item => item.revenue), 1);
                      const height = (m.revenue / max) * 100;
                      return (
                        <div key={i} className="flex flex-col items-center justify-end h-full flex-1 group relative">
                           {/* Tooltip */}
                           <div className="absolute bottom-full mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-10 pointer-events-none">
                              <div className="bg-gray-900 text-white text-xs font-bold py-1.5 px-3 rounded-lg shadow-xl whitespace-nowrap">
                                ₱{m.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                              </div>
                           </div>
                           
                           {/* Bar */}
                           <div 
                             className="w-full max-w-[48px] bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-xl transition-all duration-300 group-hover:to-emerald-300 group-hover:scale-y-[1.05] origin-bottom shadow-lg shadow-emerald-500/20"
                             style={{ height: `${height}%`, minHeight: '8px' }}
                           ></div>
                           
                           {/* Label */}
                           <div className="mt-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{m.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-400 font-medium bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  No data available yet
                </div>
              )}
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-black text-gray-900 mb-6">Cookie Ratings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.cookieRatings.map((rating) => (
                  <div key={rating.name} className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-black">{rating.name}</h4>
                      <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                        <span>★</span> {rating.average.toFixed(1)}
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 font-medium mb-3">{rating.count} reviews</div>
                    <div className="space-y-1">
                      {['Taste', 'Texture', 'Smell', 'Aftertaste'].map(criteria => {
                          const key = criteria.toLowerCase() as keyof typeof rating;
                          const val = rating[key] as number;
                          return (
                            <div key={criteria} className="flex items-center gap-2 text-[10px]">
                              <span className="w-16 text-gray-700 font-medium">{criteria}</span>
                              <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-black h-full rounded-full" style={{ width: `${(val / 5) * 100}%` }}></div>
                              </div>
                              <span className="w-6 text-right font-bold text-black">{val.toFixed(1)}</span>
                            </div>
                          )
                      })}
                    </div>
                  </div>
                ))}
                {stats.cookieRatings.length === 0 && (
                  <div className="col-span-full text-center text-gray-500 py-4">No ratings available yet.</div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="p-4 font-bold text-gray-700">Date</th>
                    <th className="p-4 font-bold text-gray-700">Customer</th>
                    <th className="p-4 font-bold text-gray-700">Ratings</th>
                    <th className="p-4 font-bold text-gray-700">Feedback</th>
                    <th className="p-4 font-bold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {feedbacks.map((fb) => (
                    <tr key={fb.id} className="hover:bg-gray-50">
                      <td className="p-4 text-gray-700 whitespace-nowrap align-top">
                        {new Date(fb.created_at).toLocaleDateString()}
                        <div className="text-xs text-gray-500">{new Date(fb.created_at).toLocaleTimeString()}</div>
                      </td>
                      <td className="p-4 align-top">
                        <div className="font-bold text-black">{fb.full_name}</div>
                        <div className="text-xs text-blue-700 font-bold">{fb.facebook_name}</div>
                        <div className="text-xs text-gray-600">{fb.email}</div>
                      </td>
                      <td className="p-4 align-top">
                        {fb.ratings && Object.entries(fb.ratings).map(([cookie, scores]: [string, any]) => (
                          <div key={cookie} className="mb-3 last:mb-0 bg-gray-50 p-2 rounded-lg border border-gray-100">
                            <div className="font-bold text-xs mb-1 text-black">{cookie}</div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-gray-700">
                              <div>Taste: <span className="font-bold text-black">{scores.taste}/5</span></div>
                              <div>Texture: <span className="font-bold text-black">{scores.texture}/5</span></div>
                              <div>Smell: <span className="font-bold text-black">{scores.smell}/5</span></div>
                              <div>Aftertaste: <span className="font-bold text-black">{scores.aftertaste}/5</span></div>
                            </div>
                          </div>
                        ))}
                      </td>
                      <td className="p-4 align-top max-w-xs">
                        <div className="mb-2">
                          <span className="text-[10px] uppercase font-bold text-gray-600">Favorite:</span>
                          <div className="text-sm font-medium text-black">{fb.favorite_cookie || '-'}</div>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-gray-600">Thoughts:</span>
                          <div className="text-sm italic text-gray-800">"{fb.final_thoughts || '-'}"</div>
                        </div>
                      </td>
                      <td className="p-4 align-top">
                        <button 
                          onClick={() => deleteFeedback(fb.id)}
                          className="text-red-600 hover:text-red-800 text-xs font-bold underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {feedbacks.length === 0 && (
                    <tr><td colSpan={5} className="p-8 text-center text-gray-500">No feedbacks found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Mobile View */}
            <div className="md:hidden p-4 space-y-4">
              {feedbacks.map((fb) => (
                <div key={fb.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="mb-3">
                    <div className="font-bold text-black">{fb.full_name}</div>
                    <div className="text-xs text-gray-500">{new Date(fb.created_at).toLocaleString()}</div>
                  </div>
                  
                  {fb.ratings && Object.keys(fb.ratings).length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-bold uppercase text-gray-500 mb-2">Ratings</div>
                      <div className="space-y-2">
                        {Object.entries(fb.ratings).map(([cookie, scores]: [string, any]) => (
                          <div key={cookie} className="bg-white p-2 rounded-lg border border-gray-200">
                            <div className="font-bold text-xs mb-1 text-black">{cookie}</div>
                            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-gray-700">
                              <div>Taste: <span className="font-bold text-black">{scores.taste}/5</span></div>
                              <div>Texture: <span className="font-bold text-black">{scores.texture}/5</span></div>
                              <div>Smell: <span className="font-bold text-black">{scores.smell}/5</span></div>
                              <div>Aftertaste: <span className="font-bold text-black">{scores.aftertaste}/5</span></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-3">
                    <div className="mb-2">
                      <span className="text-[10px] uppercase font-bold text-gray-600">Favorite:</span>
                      <div className="text-sm font-medium text-black">{fb.favorite_cookie || '-'}</div>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-600">Thoughts:</span>
                      <div className="text-sm italic text-gray-800">"{fb.final_thoughts || '-'}"</div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button 
                        onClick={() => deleteFeedback(fb.id)}
                        className="text-red-600 hover:text-red-800 text-xs font-bold underline"
                      >
                        Delete Feedback
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {feedbacks.length === 0 && (
                <div className="text-center text-gray-500 py-10">No feedbacks found.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
