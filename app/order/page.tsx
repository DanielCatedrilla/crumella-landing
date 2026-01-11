"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ORDER_ITEMS } from "../../components/Menu";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const LocationPicker = dynamic(() => import('../../components/LocationPicker'), { 
  ssr: false,
  loading: () => <div className="h-96 md:h-64 w-full bg-gray-100 rounded-xl animate-pulse flex items-center justify-center text-gray-400 text-sm font-bold mt-4">Loading Map...</div>
});

const STORE_LOCATION = { lat: 10.7819, lng: 122.5438 }; // Store coordinates (GT Town Center Pavia)

export default function OrderPage() {
  // State to track quantities for each cookie (by ID)
  const [cart, setCart] = useState<{ [key: number]: number }>({});
  const [isCartLoaded, setIsCartLoaded] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
    orderType: "delivery",
    pickupLocation: "",
    date: "",
    timeWindow: "",
    preferredTime: "",
    googleMapsLink: "",
    latitude: null as number | null,
    longitude: null as number | null
  });

  const router = useRouter();
  
  // Load saved checkout details and cart on mount
  useEffect(() => {
    const savedData = localStorage.getItem("chewy_checkout_details");
    if (savedData) {
      try {
        setFormData((prev) => ({ ...prev, ...JSON.parse(savedData) }));
      } catch (error) {
        console.error("Error loading saved checkout details:", error);
      }
    }

    const savedCart = localStorage.getItem("chewy_cart_items");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error("Error loading saved cart:", error);
      }
    }
    setIsCartLoaded(true);
  }, []);

  // Save checkout details whenever they change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem("chewy_checkout_details", JSON.stringify(formData));
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [formData]);

  // Save cart items whenever they change
  useEffect(() => {
    if (isCartLoaded) {
      localStorage.setItem("chewy_cart_items", JSON.stringify(cart));
    }
  }, [cart, isCartLoaded]);

  // Add a listener to clear persisted data when the user intentionally navigates away.
  useEffect(() => {
    const clearStorage = () => {
      localStorage.removeItem("chewy_cart_items");
      localStorage.removeItem("chewy_checkout_details");
    };
    window.addEventListener('clear-order-persistence', clearStorage);
    return () => {
      window.removeEventListener('clear-order-persistence', clearStorage);
    };
  }, []);

  // Get unique categories
  const categories = Array.from(new Set(ORDER_ITEMS.map(item => item.category || "Single Flavors")));

  // Helper to update quantities
  const updateQuantity = (id: number, delta: number) => {
    setCart((prev) => {
      const currentQty = prev[id] || 0;
      const newQty = Math.max(0, currentQty + delta);
      const newCart = { ...prev, [id]: newQty };
      if (newQty === 0) delete newCart[id];
      return newCart;
    });
  };

  // Calculate totals
  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
  const itemsTotal = Object.entries(cart).reduce((total, [id, qty]) => {
    const item = ORDER_ITEMS.find(i => i.id === Number(id));
    const price = item?.price || 4.00; // Fallback to 4.00 if no price set
    return total + (price * qty);
  }, 0);

  // Calculate Delivery Fee
  let deliveryFee = 0;
  let distanceKm = 0;

  if (formData.orderType === 'delivery' && formData.latitude && formData.longitude) {
    const R = 6371; // Radius of the earth in km
    const dLat = (formData.latitude - STORE_LOCATION.lat) * (Math.PI / 180);
    const dLon = (formData.longitude - STORE_LOCATION.lng) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(STORE_LOCATION.lat * (Math.PI / 180)) * Math.cos(formData.latitude * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    distanceKm = R * c;
    
    if (distanceKm <= 5) {
      deliveryFee = 50;
    } else {
      deliveryFee = 50 + (Math.ceil(distanceKm - 5) * 6);
    }
  }

  const totalPrice = itemsTotal + deliveryFee;

  // Generate available dates based on constraints
  const getAvailableDates = () => {
    if (formData.orderType === "pickup" && !formData.pickupLocation) return [];
    
    const dates: Date[] = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const day = d.getDay();
      
      let isValid = false;
      if (formData.orderType === "delivery") {
        if ([2, 4, 6].includes(day)) isValid = true;
      } else if (formData.orderType === "pickup") {
        if (formData.pickupLocation === "Robinsons Place Jaro") {
          if ([2, 4].includes(day)) isValid = true;
        } else if (formData.pickupLocation === "SM City Iloilo") {
          if (day === 6) isValid = true;
        }
      }
      
      // Cutoff logic: Orders close at 10 PM (22:00) the day before
      if (isValid) {
        const cutoffTime = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1, 22, 0, 0);
        if (today > cutoffTime) {
          isValid = false;
        }
      }
      
      if (isValid) dates.push(d);
    }
    return dates;
  };

  const availableDates = getAvailableDates();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isDelivery = formData.orderType === 'delivery';

    const finalAddress = isDelivery
      ? `${formData.address}${formData.googleMapsLink ? `\n\n📍 Pinned Location: ${formData.googleMapsLink}` : ''}`
      : formData.address;

    // Sanitize data: remove delivery details if pickup, and vice versa
    const customerData = {
      ...formData,
      address: finalAddress,
      googleMapsLink: isDelivery ? formData.googleMapsLink : "",
      latitude: isDelivery ? formData.latitude : null,
      longitude: isDelivery ? formData.longitude : null,
      pickupLocation: isDelivery ? "" : formData.pickupLocation,
    };

    const orderData = {
      customer: customerData,
      items: Object.entries(cart).map(([id, qty]) => {
        const item = ORDER_ITEMS.find(i => i.id === Number(id));
        return { name: item?.name, quantity: qty };
      }),
      total: totalPrice,
      status: "New",
    };

    localStorage.setItem("latestOrder", JSON.stringify(orderData));
    router.push("/payment");
  };

  const scrollToCheckout = () => {
    const element = document.getElementById('checkout-form');
    if (element) {
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;
      
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  // Clear saved data when exiting to home
  const handleExit = () => {
    window.dispatchEvent(new Event('clear-order-persistence'));
  };

  return (
    <main className="min-h-screen bg-[#fffdf7] py-12 px-4 md:px-8 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#a7dff4] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <Link href="/" onClick={handleExit} className="text-sm font-bold uppercase tracking-widest text-black hover:text-[#a7dff4] transition-colors">
            ← Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-center text-black">
            Your Order<span className="text-[#a7dff4]">.</span>
          </h1>
          <div className="w-24 hidden md:block"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* LEFT COLUMN: Cookie Selection */}
          <div className="lg:col-span-7 space-y-6 pb-24 lg:pb-0">
            {categories.map((category) => (
              <div key={category} className="mb-10">
                <h2 className="text-2xl font-bold mb-6 sticky top-0 bg-[#fffdf7] py-2 z-10 text-black">{category}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {ORDER_ITEMS.filter(item => (item.category || "Single Flavors") === category).map((item) => {
                const qty = cart[item.id] || 0;
                const itemPrice = item.price || 4.00;
                return (
                  <div key={item.id} id={`cookie-flavor-${item.id}`} className={`bg-white rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col ${qty > 0 ? 'border-black shadow-lg ring-1 ring-black' : 'border-gray-100 shadow-sm'}`}>
                    <div className="relative h-48 md:h-64 w-full">
                      <Image 
                        src={item.src} 
                        alt={item.name} 
                        fill 
                        className="object-cover"
                      />
                      {item.badge && (
                        <span className="absolute top-4 left-4 bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md z-10">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div className="p-6 flex flex-col flex-grow justify-between">
                    <div className="flex justify-between items-end">
                      <div>
                        <h3 className="font-bold text-lg leading-tight mb-1 text-black">{item.name}</h3>
                        <p className="text-black text-sm">₱{itemPrice.toFixed(2)}</p>
                      </div>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center bg-gray-100 rounded-full p-1">
                        <button 
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm text-gray-600 hover:bg-black hover:text-white transition-colors disabled:opacity-50"
                          disabled={qty === 0}
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-bold text-sm text-black">{qty}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-10 h-10 flex items-center justify-center bg-black text-white rounded-full shadow-sm hover:bg-[#a7dff4] hover:text-black transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    </div>
                  </div>
                );
              })}
                </div>
              </div>
            ))}
            </div>

          {/* RIGHT COLUMN: Checkout Form */}
          <div id="checkout-form" className="lg:col-span-5">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 lg:sticky lg:top-8">
              <h2 className="text-2xl font-bold mb-8 text-black">Checkout Details</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Order Type Selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Order Type</label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.orderType === 'delivery' ? 'border-black bg-gray-50' : 'border-gray-100 hover:border-gray-200'}`}>
                      <input 
                        type="radio" 
                        name="orderType" 
                        value="delivery" 
                        checked={formData.orderType === "delivery"} 
                        onChange={() => setFormData({...formData, orderType: "delivery", pickupLocation: "", date: ""})}
                        className="accent-black w-5 h-5"
                      />
                      <span className="text-black font-bold">Delivery</span>
                    </label>
                    <label className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.orderType === 'pickup' ? 'border-black bg-gray-50' : 'border-gray-100 hover:border-gray-200'}`}>
                      <input 
                        type="radio" 
                        name="orderType" 
                        value="pickup" 
                        checked={formData.orderType === "pickup"} 
                        onChange={() => setFormData({...formData, orderType: "pickup", address: "", date: ""})}
                        className="accent-black w-5 h-5"
                      />
                      <span className="text-black font-bold">Pickup</span>
                    </label>
                  </div>
                </div>

                {/* Pickup Location (Conditional) */}
                {formData.orderType === "pickup" && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Pickup Location</label>
                    <div className="relative">
                      <select 
                        required 
                        className="w-full px-5 py-4 rounded-xl bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white outline-none transition-all text-black appearance-none font-medium"
                        value={formData.pickupLocation}
                        onChange={(e) => setFormData({...formData, pickupLocation: e.target.value, date: ""})}
                      >
                        <option value="">Select a location...</option>
                        <option value="SM City Iloilo">SM City Iloilo</option>
                        <option value="Robinsons Place Jaro">Robinsons Place Jaro</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}

                {/* Date Selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    {formData.orderType === "pickup" ? "Pickup Date" : "Delivery Date"}
                  </label>
                  <div className="relative">
                    <select 
                      required 
                      className="w-full px-5 py-4 rounded-xl bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white outline-none transition-all text-black appearance-none font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      disabled={formData.orderType === "pickup" && !formData.pickupLocation}
                    >
                      <option value="">Select a date...</option>
                      {availableDates.map((date) => {
                        // Format YYYY-MM-DD manually to avoid timezone issues
                        const dateVal = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
                        return (
                          <option key={dateVal} value={dateVal}>
                            {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                          </option>
                        );
                      })}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 ml-1 font-medium">
                    {formData.orderType === "delivery" && "Available: Tuesdays, Thursdays, Saturdays"}
                    {formData.orderType === "pickup" && formData.pickupLocation === "Robinsons Place Jaro" && "Available: Tuesdays, Thursdays"}
                    {formData.orderType === "pickup" && formData.pickupLocation === "SM City Iloilo" && "Available: Saturdays"}
                  </p>
                </div>

                {/* Time Window Selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Time Window</label>
                  <div className="grid grid-cols-2 gap-4">
                    {['10AM - 12PM', '1PM - 4PM'].map((time) => (
                      <label key={time} className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.timeWindow === time ? 'border-black bg-gray-50' : 'border-gray-100 hover:border-gray-200'}`}>
                        <input 
                          required
                          type="radio" 
                          name="timeWindow" 
                          value={time} 
                          checked={formData.timeWindow === time} 
                          onChange={(e) => setFormData({...formData, timeWindow: e.target.value})}
                          className="accent-black w-4 h-4"
                        />
                        <span className="text-black font-bold text-sm">{time}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Preferred Time (Optional) */}
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Preferred Time <span className="text-gray-300 font-normal normal-case">(Optional)</span></label>
                    <input 
                        type="text" 
                        placeholder="e.g., around 2:30 PM" 
                        className="w-full px-5 py-4 rounded-xl bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white outline-none transition-all text-black placeholder:text-gray-400 font-medium"
                        value={formData.preferredTime} 
                        onChange={(e) => setFormData({...formData, preferredTime: e.target.value})} 
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Full Name</label>
                    <input required type="text" placeholder="Jane Doe" className="w-full px-5 py-4 rounded-xl bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white outline-none transition-all text-black placeholder:text-gray-400 font-medium"
                      value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Email Address</label>
                    <input required type="email" placeholder="jane@example.com" className="w-full px-5 py-4 rounded-xl bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white outline-none transition-all text-black placeholder:text-gray-400 font-medium"
                      value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Phone Number</label>
                    <input required type="tel" placeholder="0917 123 4567" className="w-full px-5 py-4 rounded-xl bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white outline-none transition-all text-black placeholder:text-gray-400 font-medium"
                      value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>
                </div>
                
                {formData.orderType === "delivery" && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Delivery Address</label>
                    <textarea required rows={3} placeholder="123 Cookie Lane..." className="w-full px-5 py-4 rounded-xl bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white outline-none transition-all resize-none text-black placeholder:text-gray-400 font-medium"
                      value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                    
                    <div className="mt-4">
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Pin Exact Location</label>
                      <LocationPicker onLocationSelect={(lat, lng) => setFormData({
                        ...formData, 
                        googleMapsLink: `https://www.google.com/maps?q=${lat},${lng}`,
                        latitude: lat,
                        longitude: lng
                      })} />
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-100 pt-8 mt-8">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-500 font-medium">Subtotal ({totalItems} items)</span>
                    <span className="font-bold text-lg text-black">₱{itemsTotal.toFixed(2)}</span>
                  </div>
                  {deliveryFee > 0 && (
                    <div className="flex justify-between items-center mb-3 animate-in fade-in slide-in-from-top-1">
                      <span className="text-gray-500 font-medium">
                        Delivery Fee <span className="text-xs text-gray-400">({distanceKm.toFixed(1)}km)</span>
                      </span>
                      <span className="font-bold text-lg text-black">₱{deliveryFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-xl font-black text-black">
                    <span>Total</span>
                    <span>₱{totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={totalItems === 0}
                  className="w-full bg-black text-white font-bold py-5 rounded-full hover:bg-[#a7dff4] hover:text-black hover:scale-[1.02] active:scale-95 transition-all duration-300 shadow-xl mt-6 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                >
                  {totalItems === 0 ? "Select Cookies to Order" : "Place Order"}
                </button>
                
                <p className="text-xs text-center text-gray-400 mt-6 font-medium">
                  Payments are processed upon delivery/pickup.
                </p>
              </form>
            </div>
          </div>

        </div>
      </div>

      {/* Mobile Floating Cart Bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] lg:hidden z-50 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase">Total</p>
              <p className="text-xl font-black text-black">₱{totalPrice.toFixed(2)} <span className="text-sm font-medium text-gray-500">({totalItems} items)</span></p>
            </div>
            <button 
              onClick={scrollToCheckout}
              className="bg-black text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-gray-800 active:scale-95 transition-all"
            >
              Checkout →
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
