"use client";
import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { ORDER_ITEMS } from "../../components/Menu";
import { BsCart, BsArrowLeft } from "react-icons/bs";
import { useRouter, useSearchParams } from "next/navigation";
import CartSidePanel from "../../components/CartSidePanel";

function OrderContent() {
  // State to track quantities for each cookie (by ID)
  const [cart, setCart] = useState<{ [key: number]: number }>({});
  const [isCartLoaded, setIsCartLoaded] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [redeemedItems, setRedeemedItems] = useState<any[]>([]);

  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Load saved checkout details and cart on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("chewy_cart_items");
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        // Safety check: Ensure it's an object, not an array (which causes the crash)
        if (!Array.isArray(parsed)) {
          // Validate cart items against ORDER_ITEMS to prevent crashes from stale data
          const validatedCart: { [key: number]: number } = {};
          for (const id in parsed) {
            // Ensure the item exists in our master list before adding it to the cart
            if (ORDER_ITEMS.some(item => item.id === Number(id))) {
              validatedCart[Number(id)] = parsed[id];
            }
          }
          setCart(validatedCart);
        }
      } catch (error) {
        console.error("Error loading saved cart:", error);
      }
    }

    // Check for pending redemptions (handle array or single object)
    const pendingRedemption = localStorage.getItem("pending_redemption");
    if (pendingRedemption) {
      try {
        const parsed = JSON.parse(pendingRedemption);
        if (Array.isArray(parsed)) setRedeemedItems(parsed);
        else if (parsed.redeemed_item_id) setRedeemedItems([parsed]);
      } catch (e) {}
    }

    setIsCartLoaded(true);
  }, []);


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
    };
    window.addEventListener('clear-order-persistence', clearStorage);
    return () => {
      window.removeEventListener('clear-order-persistence', clearStorage);
    };
  }, []);

  // Open cart if redirected from redeeming points
  useEffect(() => {
    if (searchParams.get('openCart') === 'true') {
      setIsCartOpen(true);
      // Clean up the URL so the cart doesn't re-open on refresh
      router.replace('/order', { scroll: false });
    }
  }, [searchParams, router]);

  // Filter out items that should be hidden from the main menu (like exclusive redemption items)
  const visibleItems = ORDER_ITEMS.filter(item => !["Free Exclusive Merch", "Free Chocolate Chunk Cookie", "Free Crumella Minis", "Free Classic Assorted Bundle"].includes(item.name));
  // Get unique categories
  const categories = Array.from(new Set(visibleItems.map(item => item.category || "Single Flavors")));

  // Helper to update quantities
  const updateQuantity = (id: number, delta: number) => {
    setCart((prev) => {
      const currentQty = prev[id] || 0;
      const newQty = Math.max(0, currentQty + delta);
      const newCart = { ...prev, [id]: newQty };
      
      if (newQty === 0) {
        delete newCart[id];
        // If removing a redeemed item, remove it from the redemption list too
        if (redeemedItems.some(r => r.redeemed_item_id === id)) {
          const newRedeemedItems = redeemedItems.filter(r => r.redeemed_item_id !== id);
          setRedeemedItems(newRedeemedItems);
          localStorage.setItem("pending_redemption", JSON.stringify(newRedeemedItems));
        }
      }
      return newCart;
    });
  };

  // Calculate totals
  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
  const itemsTotal = Object.entries(cart).reduce((total, [id, qty]) => {
    const item = ORDER_ITEMS.find(i => i.id === Number(id));
    const price = item?.price || 4.00; // Fallback to 4.00 if no price set
    
// Calculate how many units of this item are free based on redemption list
    const freeQty = redeemedItems.filter(r => r.redeemed_item_id === Number(id)).length;
    
    // Only pay for quantity exceeding the free amount
    return total + (price * Math.max(0, qty - freeQty));
  }, 0);

  const handleProceedToCheckout = () => {
    if (totalItems > 0) {
      router.push("/checkout");
    }
  };

  // Clear saved data when exiting to home
  const handleExit = () => {
    window.dispatchEvent(new Event('clear-order-persistence'));
  };

  return (
    <>
    <style>{`
      @keyframes bounce-cart {
        0%, 100% { 
          transform: translateY(0); 
          animation-timing-function: cubic-bezier(0.8, 0, 1, 1); 
        }
        50% { 
          transform: translateY(-25%); 
          animation-timing-function: cubic-bezier(0, 0, 0.2, 1); 
        }
      }
      .animate-bounce-cart {
        animation: bounce-cart 1s infinite;
      }
    `}</style>
    <main className="min-h-screen bg-[#fffdf7] py-12 px-4 md:px-8 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#a7dff4] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10 ">
        {/* Header */}
        <div className="relative flex items-center justify-center mb-12">
          <div className="absolute left-0">
            <Link href="/" onClick={handleExit} className="text-sm font-bold uppercase tracking-widest text-black hover:text-[#a7dff4] transition-colors">
              <span className="md:hidden"><BsArrowLeft size={24} /></span>
              <span className="hidden md:inline">← Back to Home</span>
            </Link>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-center text-black mx-auto">
            Your Order<span className="text-[#a7dff4]">.</span>
          </h1>
          <div className="absolute right-0">
            <button onClick={() => setIsCartOpen(true)} className={`relative text-black hover:text-[#a7dff4] transition-colors p-2 ${totalItems > 0 ? 'animate-bounce-cart' : ''}`}>
                <BsCart size={30} />
                {totalItems > 0 && <span className="absolute top-0 right-0 bg-[#a7dff4] text-black rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold">{totalItems}</span>}
            </button>
          </div>
        </div>

        <div className="max-w-[90rem] mx-auto">
          
          {/* LEFT COLUMN: Cookie Selection */}
          <div className="space-y-6 pb-24">
            {categories.map((category) => (
              <div key={category} className="mb-10">
                <h2 className="text-2xl font-bold mb-6 sticky top-0 bg-[#fffdf7] py-2 z-10 text-black">{category}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {visibleItems.filter(item => (item.category || "Single Flavors") === category).map((item) => {
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
        </div>
      </div>

    </main>

    <CartSidePanel
      isOpen={isCartOpen}
      onClose={() => setIsCartOpen(false)}
      cart={cart}
      updateQuantity={updateQuantity}
      totalItems={totalItems}
      itemsTotal={itemsTotal}
      onProceedToCheckout={handleProceedToCheckout}
      redeemedItemIds={redeemedItems.map(r => r.redeemed_item_id)}
    />

    </>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fffdf7] flex items-center justify-center">Loading...</div>}>
      <OrderContent />
    </Suspense>
  );
}
