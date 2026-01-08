"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "../../components/supabase";
import Link from "next/link";

export default function AdminPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'vouchers'>('orders');
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
      fetchVouchers();
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const adminSecret = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123";
    if (password === adminSecret) {
      setIsAuthenticated(true);
    } else {
      alert("Incorrect password");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword("");
  };

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error("Error fetching orders:", error);
    } else {
      setOrders(data || []);
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
      fetchOrders(); // Refresh list to show new status
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black text-black">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-bold underline hover:text-gray-600">Back to Home</Link>
            <button 
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <button 
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${activeTab === 'orders' ? 'bg-black text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
          >
            Orders
          </button>
          <button 
            onClick={() => setActiveTab('vouchers')}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${activeTab === 'vouchers' ? 'bg-black text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
          >
            Vouchers
          </button>
        </div>

        {activeTab === 'orders' ? (
          <>
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
                  <th className="p-4 font-bold text-gray-700">Total</th>
                  <th className="p-4 font-bold text-gray-700">Proof</th>
                  <th className="p-4 font-bold text-gray-700">Status</th>
                  <th className="p-4 font-bold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-gray-700 whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString()} <br/>
                      <span className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleTimeString()}</span>
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
                        <div className="font-bold text-gray-900 mb-1">📅 Schedule</div>
                        <div className="text-gray-800">{order.customer.date}</div>
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
                      {order.paymentMethod === 'gcash' ? 'GCash' : order.paymentMethod === 'bank' ? 'Bank Transfer' : 'Cash'}
                    </td>
                    <td className="p-4 font-bold text-black whitespace-nowrap">
                      ₱{order.finalTotal?.toFixed(2)}
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
                      </div>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                    <tr>
                        <td colSpan={9} className="p-8 text-center text-gray-500">No orders found yet.</td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile View (Cards) */}
        <div className="md:hidden space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
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
                  <span className="font-bold text-gray-700">{order.customer.date}</span>
                </div>
                <div className="text-gray-800 text-xs leading-relaxed">
                   {order.customer.orderType === 'delivery' ? order.customer.address : order.customer.pickupLocation}
                </div>
                <div className="text-gray-800 text-xs mt-1">
                   Time: {order.customer.timeWindow}
                </div>
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
                   <div className="text-xs text-gray-600 capitalize">{order.paymentMethod === 'gcash' ? 'GCash' : order.paymentMethod === 'bank' ? 'Bank Transfer' : 'Cash'}</div>
                   <div className="font-black text-lg">₱{order.finalTotal?.toFixed(2)}</div>
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
              </div>
            </div>
          ))}
          {orders.length === 0 && (
              <div className="text-center text-gray-500 py-10">No orders found.</div>
          )}
        </div>
          </>
        ) : (
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
        )}
      </div>
    </main>
  );
}
