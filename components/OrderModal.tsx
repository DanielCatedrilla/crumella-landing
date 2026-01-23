"use client";
import React, { useState } from 'react';

type OrderModalProps = {
  isOpen: boolean;
  onClose: () => void;
  preSelectedCookie?: string;
};

export default function OrderModal({ isOpen, onClose, preSelectedCookie }: OrderModalProps) {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    quantity: 1,
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Connect this to a Server Action, API route, or Email service
    console.log("Order submitted:", { ...formData, cookie: preSelectedCookie });
    alert(`Thanks for ordering the ${preSelectedCookie}! We'll be in touch shortly.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl relative overflow-hidden border border-gray-100">
        <button 
            onClick={onClose} 
            className="absolute top-5 right-5 p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-black hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <h2 className="text-3xl font-black mb-2 tracking-tight">Place Order</h2>
        <p className="text-gray-500 mb-6 font-medium">You are ordering: <span className="text-black font-bold">{preSelectedCookie || "Cookies"}</span></p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1">Your Name</label>
            <input 
              required
              type="text" 
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-black focus:ring-0 outline-none transition-all font-medium text-black"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          
          <div className="flex gap-4">
            <div className="flex-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1">Email</label>
                <input 
                required
                type="email" 
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-black focus:ring-0 outline-none transition-all font-medium text-black"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
            </div>
            <div className="w-24">
                <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1">Qty</label>
                <input 
                required
                type="number" 
                min="1"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-black focus:ring-0 outline-none transition-all font-medium text-black"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
                />
            </div>
           </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1">Delivery Address</label>
            <textarea 
              required
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-black focus:ring-0 outline-none transition-all font-medium resize-none text-black"
              placeholder="Street, City, Zip Code"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
            />
          </div>

          <button type="submit" className="w-full bg-black text-white font-bold py-4 rounded-full hover:bg-[#a7dff4] hover:text-black hover:scale-[1.02] active:scale-95 transition-all duration-300 shadow-lg mt-2 cursor-pointer">
            Confirm Order
          </button>
        </form>
      </div>
    </div>
  );
}