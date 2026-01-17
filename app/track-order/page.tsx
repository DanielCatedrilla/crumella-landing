"use client";
import React, { useState } from "react";
import { supabase } from "../../components/supabase";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function TrackOrderPage() {
  const [searchId, setSearchId] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;

    setLoading(true);
    setSearched(true);
    setOrder(null);

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('tracking_number', searchId.trim())
      .single();

    if (!error && data) {
      setOrder(data);
    }
    setLoading(false);
  };

  const refreshOrder = async () => {
    if (!order?.tracking_number) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('tracking_number', order.tracking_number)
      .single();

    if (!error && data) {
      setOrder(data);
    }
    setLoading(false);
  };

  const getProgress = () => {
    if (!order) return 0;
    if (order.status === 'New' || order.status === 'Pending') return 1;
    if (order.status === 'Processing') return 2;
    if (order.status === 'Releasing') return 3;
    if (order.status === 'Completed') return 4;
    return 0;
  };

  const getStatusText = () => {
    if (!order) return '';
    if (order.status === 'New' || order.status === 'Pending') return 'Order Received';
    if (order.status === 'Processing') return 'Baking';
    if (order.status === 'Releasing') return order.customer?.orderType === 'delivery' ? 'Out for Delivery' : 'Ready for Pickup';
    if (order.status === 'Completed') return order.customer?.orderType === 'delivery' ? 'Delivered' : 'Picked Up';
    if (order.status === 'Cancelled') return 'Cancelled';
    return order.status;
  };

  const currentStep = getProgress();
  const isCancelled = order?.status === 'Cancelled';

  const handleCopy = () => {
    if (order?.id) {
      navigator.clipboard.writeText(order.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <main className="min-h-screen bg-[#fffdf7] relative overflow-hidden flex flex-col font-sans selection:bg-[#a7dff4] selection:text-black">
      {/* Animated Decorative background elements */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#a7dff4] rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-blob -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#ffc8dd] rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-blob animation-delay-2000 translate-x-1/2 translate-y-1/2 pointer-events-none"></div>
      <div className="absolute -bottom-32 left-20 w-[500px] h-[500px] bg-[#bde0fe] rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-blob animation-delay-4000 pointer-events-none"></div>

      <Navbar />

      <div className="flex-grow w-full max-w-3xl mx-auto relative z-10 pb-12 pt-32 px-4 md:px-8">
        <div className="text-center mb-12 mt-8">
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-black mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 drop-shadow-sm">
            Track Order<span className="text-[#a7dff4]">.</span>
          </h1>
          <p className="text-gray-500 font-bold text-xl animate-in fade-in slide-in-from-bottom-3 duration-700 delay-150">Where are my cookies? 🍪</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/50 mb-12 transform transition-all hover:scale-[1.01] duration-500">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Order ID (e.g., CRML-8X29A)"
              className="flex-1 px-6 py-5 rounded-2xl bg-white border-2 border-gray-100 focus:border-black focus:ring-4 focus:ring-gray-100 outline-none transition-all text-black placeholder:text-gray-400 font-bold text-xl shadow-inner"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
            />
            <button 
              type="submit" 
              disabled={loading}
              className="bg-black text-white px-10 py-5 rounded-2xl font-black text-xl hover:bg-[#a7dff4] hover:text-black transition-all disabled:opacity-50 shadow-xl hover:shadow-2xl hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Searching...</span>
                </>
              ) : 'Track'}
            </button>
          </form>
        </div>

        {searched && !loading && !order && (
          <div className="bg-red-50 text-red-600 p-6 rounded-2xl text-center font-bold border border-red-100 mb-8 animate-in fade-in slide-in-from-top-4">
            Order not found. Please check the ID.
          </div>
        )}

        {order && (
          <div className="bg-white/90 backdrop-blur-xl p-8 md:p-12 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.12)] border border-white/60 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start mb-10 border-b border-gray-100 pb-8 gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-xs text-gray-500 font-black uppercase tracking-wider bg-gray-100 px-3 py-1 rounded-full">#{order.tracking_number || order.id}</div>
                  <button 
                    onClick={handleCopy}
                    className="text-[10px] bg-[#a7dff4] hover:bg-blue-300 text-blue-900 px-2 py-1 rounded transition-colors font-bold"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="font-black text-3xl md:text-4xl text-black tracking-tight">{order.customer?.name}</div>
              </div>
              <div className="text-left md:text-right">
                <div className="flex items-center md:justify-end gap-2 mb-1">
                  <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Current Status</div>
                  <button 
                    onClick={refreshOrder}
                    disabled={loading}
                    className="text-gray-400 hover:text-black transition-colors disabled:animate-spin"
                    title="Refresh Status"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                  </button>
                </div>
                <div className={`font-black text-2xl md:text-3xl ${isCancelled ? 'text-red-500' : 'text-black'}`}>{getStatusText()}</div>
                <div className="text-sm text-gray-400 font-medium mt-1">
                  {new Date(order.createdAt).toLocaleDateString()} • {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            </div>

            {isCancelled ? (
              <div className="bg-red-50 p-6 rounded-2xl text-center">
                <div className="text-red-600 font-black text-xl mb-2">Order Cancelled</div>
                <p className="text-red-500 font-medium">This order has been cancelled.</p>
              </div>
            ) : (
              <div className="relative pl-12 space-y-12 before:absolute before:left-[1.4rem] before:top-4 before:bottom-4 before:w-1 before:bg-gray-100 before:rounded-full">
                {/* Step 1 */}
                <div className="relative">
                  <div className={`absolute -left-[3.25rem] w-12 h-12 rounded-full border-4 flex items-center justify-center text-lg shadow-sm z-10 ${currentStep >= 1 ? 'bg-black border-black text-white' : 'bg-white border-gray-200 text-gray-300'} transition-all duration-500`}>📝</div>
                  <div className={`${currentStep >= 1 ? 'text-black' : 'text-gray-400'} transition-colors`}>
                    <div className="font-black text-xl md:text-2xl">Order Received</div>
                    <div className="text-sm text-gray-500 mt-1">We have received your order details.</div>
                  </div>
                </div>

                {/* Step 2 */}
                {currentStep >= 2 && (
                <div className="relative animate-in fade-in slide-in-from-left-4">
                  <div className={`absolute -left-[3.25rem] w-12 h-12 rounded-full border-4 flex items-center justify-center text-lg shadow-sm z-10 ${currentStep >= 2 ? 'bg-black border-black text-white' : 'bg-white border-gray-200 text-gray-300'} transition-all duration-500`}>🍪</div>
                  <div className={`${currentStep >= 2 ? 'text-black' : 'text-gray-400'} transition-colors`}>
                    <div className="font-black text-xl md:text-2xl">Baking</div>
                    <div className="text-sm text-gray-500 mt-1">Your order is being prepared with love.</div>
                  </div>
                </div>
                )}

                {/* Step 3 */}
                {currentStep >= 3 && (
                <div className="relative animate-in fade-in slide-in-from-left-4">
                  <div className={`absolute -left-[3.25rem] w-12 h-12 rounded-full border-4 flex items-center justify-center text-lg shadow-sm z-10 ${currentStep >= 3 ? 'bg-black border-black text-white' : 'bg-white border-gray-200 text-gray-300'} transition-all duration-500`}>{order.customer?.orderType === 'delivery' ? '🚚' : '🛍️'}</div>
                  <div className={`${currentStep >= 3 ? 'text-black' : 'text-gray-400'} transition-colors`}>
                    <div className="font-black text-xl md:text-2xl">
                      {order.customer?.orderType === 'delivery' ? 'Out for Delivery' : 'Ready for Pickup'}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {order.customer?.orderType === 'delivery' 
                        ? 'Your order is on its way to you!' 
                        : 'You can now pick up your order.'}
                    </div>
                  </div>
                </div>
                )}

                {/* Step 4 */}
                {currentStep >= 4 && (
                <div className="relative animate-in fade-in slide-in-from-left-4">
                  <div className={`absolute -left-[3.25rem] w-12 h-12 rounded-full border-4 flex items-center justify-center text-lg shadow-sm z-10 ${currentStep >= 4 ? 'bg-black border-black text-white' : 'bg-white border-gray-200 text-gray-300'} transition-all duration-500`}>🎉</div>
                  <div className={`${currentStep >= 4 ? 'text-black' : 'text-gray-400'} transition-colors`}>
                    <div className="font-black text-xl md:text-2xl">
                      {order.customer?.orderType === 'delivery' ? 'Delivered' : 'Picked Up'}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {order.customer?.orderType === 'delivery' 
                        ? 'Enjoy your sweets!' 
                        : 'Thank you for picking up your order!'}
                    </div>
                  </div>
                </div>
                )}
              </div>
            )}
            
            <div className="mt-10 pt-8 border-t border-gray-100">
               <div className="text-xs font-black uppercase tracking-wider text-gray-400 mb-4">Order Items</div>
               <ul className="space-y-3">
                 {order.items?.map((item: any, idx: number) => (
                   <li key={idx} className="text-lg font-bold text-gray-900 flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                     <span>{item.name}</span>
                     <span className="bg-white px-4 py-1 rounded-xl shadow-sm text-sm font-black border border-gray-100">x{item.quantity}</span>
                   </li>
                 ))}
               </ul>
            </div>
          </div>
        )}
      </div>

      <Footer />

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}} />
    </main>
  );
}
