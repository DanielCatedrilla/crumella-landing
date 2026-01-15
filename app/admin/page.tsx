"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "../../components/supabase";
import Link from "next/link";

const STORE_LOCATION = { lat: 10.7819, lng: 122.5438 }; // GT Town Center Pavia

export default function AdminPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'vouchers' | 'statistics'>('orders');
  const [password, setPassword] = useState("");
  const [orderFilter, setOrderFilter] = useState('All');

  useEffect(() => {
    const storedAuth = localStorage.getItem("adminAuthenticated");
    if (storedAuth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
      fetchVouchers();

      const channel = supabase
        .channel('realtime orders')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
          fetchOrders(true);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAuthenticated]);

  const stats = React.useMemo(() => {
    if (!orders.length) return { monthly: [], bestSeller: null, totalBoxes: 0 };

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

    return { monthly, bestSeller, totalBoxes };
  }, [orders]);

  const filteredOrders = orders.filter(order => orderFilter === 'All' || order.status === orderFilter);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const adminSecret = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
    if (adminSecret && password === adminSecret) {
      setIsAuthenticated(true);
      localStorage.setItem("adminAuthenticated", "true");
    } else {
      alert("Incorrect password");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword("");
    localStorage.removeItem("adminAuthenticated");
  };

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
        // Sort by Date (Ascending) - Earliest date first
        const dateA = a.customer?.date || '9999-12-31';
        const dateB = b.customer?.date || '9999-12-31';
        if (dateA !== dateB) return dateA.localeCompare(dateB);

        // Sort by Time (Ascending) - Earliest time first
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

    if (!error) {
      setVouchers(data || []);
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

  const updateStatus = async (id: number, newStatus: string) => {
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

  const updateOrderDate = async (id: number, currentCustomer: any, newDate: string) => {
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

  const updatePaymentMethod = async (id: number, newMethod: string) => {
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

  const updateOrderTotal = async (id: number, newTotal: number, currentCustomer: any, currentOrderTotal: number) => {
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

  const deleteOrder = async (id: number) => {
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
            <div class="meta">Order #${order.id} • ${new Date(order.createdAt).toLocaleDateString()}</div>
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
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
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

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
          <button 
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors whitespace-nowrap ${activeTab === 'orders' ? 'bg-black text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
          >
            Orders
          </button>
          <button 
            onClick={() => setActiveTab('vouchers')}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors whitespace-nowrap ${activeTab === 'vouchers' ? 'bg-black text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
          >
            Vouchers
          </button>
          <button 
            onClick={() => setActiveTab('statistics')}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors whitespace-nowrap ${activeTab === 'statistics' ? 'bg-black text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
          >
            Statistics
          </button>
        </div>

        {activeTab === 'orders' ? (
          <>
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
              {['All', 'New', 'Pending', 'Processing', 'Completed', 'Cancelled'].map((status) => (
                <button 
                  key={status}
                  onClick={() => setOrderFilter(status)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${
                    orderFilter === status 
                    ? 'bg-black text-white border-black' 
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
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

            <div className="hidden md:block bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="p-4 font-bold text-gray-700">Date</th>
                  <th className="p-4 font-bold text-gray-700">Customer</th>
                  <th className="p-4 font-bold text-gray-700">Logistics</th>
                  <th className="p-4 font-bold text-gray-700">Items</th>
                  <th className="p-4 font-bold text-gray-700">Payment</th>
                  <th className="p-4 font-bold text-gray-700">Del. Fee</th>
                  <th className="p-4 font-bold text-gray-700">Total</th>
                  <th className="p-4 font-bold text-gray-700">Proof</th>
                  <th className="p-4 font-bold text-gray-700">Status</th>
                  <th className="p-4 font-bold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-gray-700 whitespace-nowrap">
                      {order.status === 'New' && (
                        <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold mb-1 inline-block animate-pulse">NEW</span>
                      )}
                      <div>{new Date(order.createdAt).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleTimeString()}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-black">{order.customer.name}</div>
                      <div className="text-gray-600 text-xs">{order.customer.email}</div>
                      <div className="text-gray-600 text-xs">{order.customer.phone}</div>
                      <div className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                        order.customer.orderType === 'delivery' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-orange-50 text-orange-700 border-orange-200'
                      }`}>
                        {order.customer.orderType}
                      </div>
                    </td>
                    <td className="p-4 min-w-[200px]">
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
                    <td className="p-4 min-w-[200px]">
                      <ul className="list-disc list-inside text-gray-700">
                        {order.items.map((item: any, idx: number) => (
                          <li key={idx}><span className="font-bold">{item.quantity}x</span> {item.name}</li>
                        ))}
                      </ul>
                      {order.customer.notes && (
                        <div className="text-xs text-gray-700 mt-1 italic bg-yellow-50 p-1 rounded">Note: {order.customer.notes}</div>
                      )}
                    </td>
                    <td className="p-4 capitalize text-gray-700">
                      <select 
                        className="bg-transparent border-b border-gray-300 focus:border-black outline-none cursor-pointer py-1"
                        value={order.paymentMethod || 'cash'}
                        onChange={(e) => updatePaymentMethod(order.id, e.target.value)}
                      >
                        <option value="cash">Cash</option>
                        <option value="gcash">GCash</option>
                        <option value="bank">Bank Transfer</option>
                      </select>
                    </td>
                    <td className="p-4 text-gray-700 whitespace-nowrap">
                      {order.customer.orderType === 'delivery' ? (
                        <span className="font-medium">₱{getDeliveryFee(order.customer).toFixed(2)}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-4 font-bold text-black whitespace-nowrap">
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
                    <td className="p-4">
                      {order.proofUrl ? (
                        <a href={order.proofUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs font-bold">
                          View Image
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs">No Proof</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        order.status === 'Completed' ? 'bg-green-100 text-green-700' :
                        order.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                        order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-2">
                      <select 
                        className={`border-2 rounded-xl px-4 py-2 text-xs font-bold outline-none cursor-pointer transition-all ${
                          order.status === 'Completed' ? 'bg-green-50 border-green-200 text-green-700 hover:border-green-400' :
                          order.status === 'Processing' ? 'bg-blue-50 border-blue-200 text-blue-700 hover:border-blue-400' :
                          order.status === 'Cancelled' ? 'bg-red-50 border-red-200 text-red-700 hover:border-red-400' :
                          'bg-yellow-50 border-yellow-200 text-yellow-700 hover:border-yellow-400'
                        }`}
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                      >
                        <option value="New">New</option>
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                      <button 
                        onClick={() => printOrder(order)}
                        className="flex items-center justify-center gap-2 w-full bg-gray-900 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-gray-700 transition-colors"
                      >
                        Print Ticket
                      </button>
                      <button 
                        onClick={() => deleteOrder(order.id)}
                        className="flex items-center justify-center gap-2 w-full bg-red-50 text-red-600 px-3 py-2 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors"
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
            <div key={order.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                  {order.status === 'New' && (
                    <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold mb-2 inline-block animate-pulse">NEW</span>
                  )}
                  <div className="text-xs text-gray-600 font-bold">
                    {new Date(order.createdAt).toLocaleDateString()} • {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                  <div className="font-black text-lg text-gray-900 mt-1">{order.customer.name}</div>
                  <div className="text-xs text-gray-600">{order.customer.phone}</div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  order.status === 'Completed' ? 'bg-green-100 text-green-700' :
                  order.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                  order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {order.status}
                </span>
              </div>

              <div className="bg-gray-50 p-3 rounded-xl text-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                     order.customer.orderType === 'delivery' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-orange-100 text-orange-700 border-orange-200'
                  }`}>
                    {order.customer.orderType}
                  </span>
                  <input 
                    type="date" 
                    className="font-bold text-gray-700 text-xs bg-transparent border-b border-gray-300 focus:border-black outline-none"
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

              <div className="flex justify-between items-center border-t border-gray-100 pt-3">
                <div>
                   <select 
                      className="text-xs text-gray-600 capitalize bg-transparent border-b border-gray-300 focus:border-black outline-none mb-1 cursor-pointer"
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
                        className={`w-24 bg-transparent border-b border-gray-300 focus:border-black outline-none py-1 ${order.customer.isManualDiscount ? 'text-purple-700 font-black' : ''}`}
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

              <div className="grid grid-cols-2 gap-3">
                 <select 
                    className={`w-full border-2 rounded-xl px-4 py-2 text-xs font-bold outline-none cursor-pointer transition-all ${
                      order.status === 'Completed' ? 'bg-green-50 border-green-200 text-green-700 hover:border-green-400' :
                      order.status === 'Processing' ? 'bg-blue-50 border-blue-200 text-blue-700 hover:border-blue-400' :
                      order.status === 'Cancelled' ? 'bg-red-50 border-red-200 text-red-700 hover:border-red-400' :
                      'bg-yellow-50 border-yellow-200 text-yellow-700 hover:border-yellow-400'
                    }`}
                    value={order.status}
                    onChange={(e) => updateStatus(order.id, e.target.value)}
                 >
                    <option value="New">New</option>
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                 </select>
                 <button 
                    onClick={() => printOrder(order)}
                    className="w-full bg-gray-900 text-white px-3 py-2 rounded-xl text-sm font-bold"
                 >
                    Print
                 </button>
                 <button 
                    onClick={() => deleteOrder(order.id)}
                    className="col-span-2 w-full bg-red-50 text-red-600 px-3 py-2 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors"
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
            <div className="overflow-x-auto">
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
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Most Popular Product</h3>
                <div className="text-3xl font-black text-black mb-1">{stats.bestSeller?.name}</div>
                <div className="text-sm text-gray-500">Sold {stats.bestSeller?.count} times all-time</div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Total Boxes Sold</h3>
                <div className="text-3xl font-black text-black mb-1">{stats.totalBoxes}</div>
                <div className="text-sm text-gray-500">Across all orders</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Orders per Month</h3>
              {stats.monthly.length > 0 ? (
                <div className="flex items-end gap-4 h-64 w-full overflow-x-auto pb-2">
                  {stats.monthly.map((m, i) => {
                    const max = Math.max(...stats.monthly.map(item => item.count), 1);
                    const height = (m.count / max) * 100;
                    return (
                      <div key={i} className="flex flex-col items-center gap-2 min-w-[60px] flex-1 group">
                        <div className="text-xs font-bold text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">{m.count}</div>
                        <div 
                          className="w-full bg-blue-500 rounded-t-lg transition-all hover:bg-blue-600 relative"
                          style={{ height: `${height}%`, minHeight: '4px' }}
                        ></div>
                        <div className="text-xs text-gray-500 font-medium whitespace-nowrap">{m.label}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-10">No data available for graph.</div>
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Revenue per Month</h3>
              {stats.monthly.length > 0 ? (
                <div className="flex items-end gap-4 h-64 w-full overflow-x-auto pb-2">
                  {stats.monthly.map((m, i) => {
                    const max = Math.max(...stats.monthly.map(item => item.revenue), 1);
                    const height = (m.revenue / max) * 100;
                    return (
                      <div key={i} className="flex flex-col items-center gap-2 min-w-[60px] flex-1 group">
                        <div className="text-xs font-bold text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          ₱{m.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div 
                          className="w-full bg-green-500 rounded-t-lg transition-all hover:bg-green-600 relative"
                          style={{ height: `${height}%`, minHeight: '4px' }}
                        ></div>
                        <div className="text-xs text-gray-500 font-medium whitespace-nowrap">{m.label}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-10">No data available for graph.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
