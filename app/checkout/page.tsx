"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ORDER_ITEMS } from "../../components/Menu";

const LocationPicker = dynamic(() => import('../../components/LocationPicker'), { 
  ssr: false,
  loading: () => <div className="h-96 md:h-64 w-full bg-gray-100 rounded-xl animate-pulse flex items-center justify-center text-gray-400 text-sm font-bold mt-4">Loading Map...</div>
});

const STORE_LOCATION = { lat: 10.7819, lng: 122.5438 }; // Store coordinates (GT Town Center Pavia)

const generateTrackingCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomPart = '';
  for (let i = 0; i < 5; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CRML-${randomPart}`;
};

export default function CheckoutPage() {
  const [cart, setCart] = useState<{ [key: number]: number } | null>(null);
  const [redeemedItems, setRedeemedItems] = useState<any[]>([]);
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
  const [locationError, setLocationError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
        const parsed = JSON.parse(savedCart);
        // Validate cart: ensure it's an object and all items exist in ORDER_ITEMS.
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
          const validatedCart: { [key: number]: number } = {};
          for (const id in parsed) {
            if (ORDER_ITEMS.some(item => item.id === Number(id))) {
              validatedCart[Number(id)] = parsed[id];
            }
          }
          
          if (Object.keys(validatedCart).length > 0) {
            setCart(validatedCart);
          } else {
            router.push("/order"); // Redirect if cart is empty after validation
          }
        } else {
          router.push("/order"); // Redirect if cart is not a valid object
        }
      } catch (error) {
        console.error("Error loading saved cart:", error);
        router.push("/order");
      }
    } else {
        router.push("/order");
    }

    // Load redeemed items to calculate correct prices
    const pendingRedemption = localStorage.getItem("pending_redemption");
    if (pendingRedemption) {
      try {
        const parsed = JSON.parse(pendingRedemption);
        if (Array.isArray(parsed)) setRedeemedItems(parsed);
        else if (parsed.redeemed_item_id) setRedeemedItems([parsed]);
      } catch (e) {}
    }
  }, [router]);

  // Save checkout details whenever they change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem("chewy_checkout_details", JSON.stringify(formData));
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [formData]);

  // Calculate totals
  let totalItems = 0;
  let itemsTotal = 0;

  // Ensure cart is a valid object before calculating totals
  if (cart && typeof cart === 'object' && !Array.isArray(cart)) {
    totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
    itemsTotal = Object.entries(cart).reduce((total, [id, qty]) => {
        const item = ORDER_ITEMS.find(i => i.id === Number(id));
        const price = item?.price || 4.00;
        
        const freeQty = redeemedItems.filter(r => r.redeemed_item_id === Number(id)).length;
        return total + (price * Math.max(0, qty - freeQty));
    }, 0);
  }

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
        if (day !== 0) isValid = true;
      } else if (formData.orderType === "pickup") {
        if (formData.pickupLocation === "Robinsons Place Jaro") {
          if ([2, 4].includes(day)) isValid = true;
        } else if (formData.pickupLocation === "SM City Iloilo") {
          if (day === 6) isValid = true;
        } else if (formData.pickupLocation === "ISAT U") {
          // Available every day except Fridays and March 18, 2026
          const isMarch18 = d.getFullYear() === 2026 && d.getMonth() === 2 && d.getDate() === 18;
          if (![0, 5, 6].includes(day) && !isMarch18) isValid = true;
        } else if (formData.pickupLocation === "Molo Mansion") {
          const isMay8to10 = d.getFullYear() === 2026 && d.getMonth() === 4 && [8, 9, 10].includes(d.getDate());
          if (isMay8to10) isValid = true;
        } else if (formData.pickupLocation === "Concrete Jungle") {
          const isMay10to16 = d.getFullYear() === 2026 && d.getMonth() === 4 && d.getDate() >= 10 && d.getDate() <= 16;
          if (isMay10to16) isValid = true;
        }
      }
      
      // Blocked dates
      const isJune9 = d.getFullYear() === 2026 && d.getMonth() === 5 && d.getDate() === 9;
      if (isJune9) isValid = false;

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

  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    setFormData((prev) => ({
      ...prev,
      googleMapsLink: `https://www.google.com/maps?q=${lat},${lng}`,
      latitude: lat,
      longitude: lng
    }));
    setLocationError(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isDelivery = formData.orderType === 'delivery';

    if (isDelivery && (!formData.latitude || !formData.longitude)) {
      setLocationError(true);
      alert("Please pin your exact delivery location on the map.");
      return;
    }

    setIsSubmitting(true);

    const finalAddress = isDelivery
      ? `${formData.address}${formData.googleMapsLink ? `\n\n📍 Pinned Location: ${formData.googleMapsLink}` : ''}`
      : formData.address;

    // Sanitize data: remove delivery details if pickup, and vice versa
    const customerData = {
      ...formData,
      address: finalAddress,
      deliveryFee: deliveryFee, // Add deliveryFee to the customer object
      googleMapsLink: isDelivery ? formData.googleMapsLink : "",
      latitude: isDelivery ? formData.latitude : null,
      longitude: isDelivery ? formData.longitude : null,
      pickupLocation: isDelivery ? "" : formData.pickupLocation,
    };

    // Normalize items for the order object
    let orderItems: any[] = [];
    if (cart) {
        // Split items into free (redeemed) and paid
        Object.entries(cart).forEach(([idStr, qty]) => {
            const id = Number(idStr);
            const quantity = qty;
            const item = ORDER_ITEMS.find(i => i.id === id);

            // Defensive check: If an item from the cart is somehow not in the master list, skip it.
            // This prevents creating an order with undefined items, which causes payment to fail.
            if (!item) {
              console.warn(`Item with ID ${id} not found in ORDER_ITEMS during checkout. Skipping.`);
              return;
            }
            const regularPrice = item.price || 4.00;
            
            const freeQty = redeemedItems.filter(r => r.redeemed_item_id === id).length;
            const paidQty = Math.max(0, quantity - freeQty);
            const actualFreeQty = Math.min(quantity, freeQty);

            if (actualFreeQty > 0) {
                orderItems.push({
                    id: item.id,
                    name: item.name,
                    price: 0,
                    quantity: actualFreeQty,
                    isRedeemed: true
                });
            }
            
            if (paidQty > 0) {
                orderItems.push({
                    id: item.id,
                    name: item.name,
                    price: regularPrice,
                    quantity: paidQty,
                    isRedeemed: false
                });
            }
        });

        // Attach bundle configs for Premium Assorted Bundle so admin can see flavor lineups
        const premiumEntry = orderItems.find(i => i.id === 9);
        if (premiumEntry) {
            try {
                const all = JSON.parse(localStorage.getItem("crumella_bundle_configs") || "{}");
                if (Array.isArray(all[9])) premiumEntry.bundleConfigs = all[9];
            } catch {}
        }
    }

    const orderData = {
      customer: customerData,
      items: orderItems,
      total: totalPrice,
      status: "New",
      tracking_number: generateTrackingCode(),
    };

    localStorage.setItem("latestOrder", JSON.stringify(orderData));
    router.push("/payment");
  };

  if (!cart) return null;

  return (
    <main className="min-h-screen bg-[#fffdf7] py-12 px-4 md:px-8 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#a7dff4] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

      <div className="max-w-3xl mx-auto relative z-10">
        {/* Header */}
        <div className="relative flex flex-col md:block items-center justify-center mb-8 md:mb-12">
          <Link href="/order" className="self-start md:absolute md:left-0 md:top-1/2 md:-translate-y-1/2 text-xs md:text-sm font-bold uppercase tracking-widest text-black hover:text-[#a7dff4] transition-colors mb-4 md:mb-0">
            ← Back to Order
          </Link>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-center text-black">
            Checkout<span className="text-[#a7dff4]">.</span>
          </h1>
        </div>

        <div className="bg-white p-6 md:p-12 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl border border-gray-100">
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
                        <option value="ISAT U">ISAT U</option>
                        <option value="Molo Mansion">Molo Mansion</option>
                        <option value="Concrete Jungle">Concrete Jungle</option>
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
                    {formData.orderType === "delivery" && "Available: Monday – Saturday"}
                    {formData.orderType === "pickup" && formData.pickupLocation === "Robinsons Place Jaro" && "Available: Tuesdays, Thursdays"}
                    {formData.orderType === "pickup" && formData.pickupLocation === "SM City Iloilo" && "Available: Saturdays"}
                    {formData.orderType === "pickup" && formData.pickupLocation === "Molo Mansion" && "Available: May 8, 9 & 10 only"}
                    {formData.orderType === "pickup" && formData.pickupLocation === "Concrete Jungle" && "Available: May 10 – 16 only"}
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
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Pin Exact Location <span className="text-red-500">*</span></label>
                      <LocationPicker 
                        hasError={locationError}
                        onLocationSelect={handleLocationSelect}
                      />
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
                  disabled={isSubmitting}
                  className="w-full bg-black text-white font-bold py-5 rounded-full hover:bg-[#a7dff4] hover:text-black hover:scale-[1.02] active:scale-95 transition-all duration-300 shadow-xl mt-6 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 text-lg flex items-center justify-center gap-3"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Processing...
                    </>
                  ) : (
                    "Place Order"
                  )}
                </button>
                
                <p className="text-xs text-center text-gray-400 mt-6 font-medium">
                  Payments are processed upon delivery/pickup.
                </p>
              </form>
            
          
        </div>
      </div>
    </main>
  );
}
