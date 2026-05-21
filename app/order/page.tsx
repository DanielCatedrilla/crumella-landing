"use client";
import { useState, useEffect, Suspense, startTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { ORDER_ITEMS } from "../../components/Menu";

const toSlug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
import { BsCart } from "react-icons/bs";
import { useRouter, useSearchParams } from "next/navigation";
import CartSidePanel from "../../components/CartSidePanel";
import Navbar from "../../components/Navbar";

function OrderContent() {
  // State to track quantities for each cookie (by ID)
  const [cart, setCart] = useState<{ [key: number]: number }>({});
  const [isCartLoaded, setIsCartLoaded] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [redeemedItems, setRedeemedItems] = useState<{ redeemed_item_id: number }[]>([]);

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
          startTransition(() => setCart(validatedCart));
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
        if (Array.isArray(parsed)) startTransition(() => setRedeemedItems(parsed));
        else if (parsed.redeemed_item_id) startTransition(() => setRedeemedItems([parsed]));
      } catch {}
    }

    startTransition(() => setIsCartLoaded(true));
  }, []);

  // Save cart items whenever they change
  useEffect(() => {
    if (isCartLoaded) {
      localStorage.setItem("chewy_cart_items", JSON.stringify(cart));
    }
  }, [cart, isCartLoaded]);

  // If bundle is not in the cart, clear its stale configs so the detail page shows correctly.
  useEffect(() => {
    if (isCartLoaded) {
      const BUNDLE_ID = 9;
      if (!cart[BUNDLE_ID]) {
        try {
          const all = JSON.parse(localStorage.getItem("crumella_bundle_configs") || "{}");
          if (all[BUNDLE_ID]) {
            delete all[BUNDLE_ID];
            localStorage.setItem("crumella_bundle_configs", JSON.stringify(all));
          }
        } catch {}
      }
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
      startTransition(() => setIsCartOpen(true));
      router.replace('/order', { scroll: false });
    }
  }, [searchParams, router]);

  // Filter out items that should be hidden from the main menu (like exclusive redemption items)
  const visibleItems = ORDER_ITEMS.filter(item => !["Free Exclusive Merch", "Free Chocolate Chunk Cookie", "Free Crumella Minis", "Free Classic Assorted Bundle"].includes(item.name));
  // Get unique categories in a fixed display order
  const CATEGORY_ORDER = [
    "Single Flavors",
    "Box of 4 - Single Flavor Bundles",
    "Box of 4 - Assorted Bundles",
    "Box of 12 - Crumella Minis",
  ];
  const rawCategories = Array.from(new Set(visibleItems.map(item => item.category || "Single Flavors")));
  const categories = [
    ...CATEGORY_ORDER.filter(c => rawCategories.includes(c)),
    ...rawCategories.filter(c => !CATEGORY_ORDER.includes(c)),
  ];

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

  return (
    <>
    <Navbar rightSlot={
      <button
        onClick={() => setIsCartOpen(true)}
        className="relative p-2 text-black hover:text-white transition-colors z-50"
      >
        <BsCart size={22} />
        {totalItems > 0 && (
          <span className="absolute top-0 right-0 bg-black text-white rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold">
            {totalItems}
          </span>
        )}
      </button>
    } />

    <main className="min-h-screen bg-[#fffdf7] pt-24 pb-12 px-4 md:px-8 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#a7dff4] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Page title */}
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-black mb-10">
          Your Order<span className="text-[#a7dff4]">.</span>
        </h1>

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
                  <Link key={item.id} href={`/order/${toSlug(item.name)}`} id={`cookie-flavor-${item.id}`} className={`bg-white rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col cursor-pointer group ${qty > 0 ? 'border-black shadow-lg ring-1 ring-black' : 'border-gray-100 shadow-sm hover:shadow-md'}`}>
                    <div className="relative h-48 md:h-64 w-full overflow-hidden">
                      <Image
                        src={item.src}
                        alt={item.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {item.badge && (
                        <span className="absolute top-4 left-4 bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md z-10">
                          {item.badge}
                        </span>
                      )}
                      {qty > 0 && (
                        <span className="absolute top-4 right-4 bg-black text-white text-[10px] font-bold px-2.5 py-1 rounded-full z-10">
                          {qty} in cart
                        </span>
                      )}
                    </div>
                    <div className="p-5 flex items-end justify-between">
                      <div>
                        <h3 className="font-bold text-base leading-tight mb-0.5 text-black">{item.name}</h3>
                        <p className="text-gray-500 text-sm">₱{itemPrice.toFixed(2)}</p>
                      </div>
                      <span className="shrink-0 bg-black text-white text-xs font-black px-5 py-2.5 rounded-full group-hover:bg-[#a7dff4] group-hover:text-black transition-all duration-200 uppercase tracking-wider">
                        Order
                      </span>
                    </div>
                  </Link>
                );
              })}
                </div>
              </div>
            ))}
            </div>
        </div>
      </div>

    </main>

    {/* Mobile Sticky Cart Button */}
    {totalItems > 0 && !isCartOpen && (
      <div className="fixed bottom-6 left-6 right-6 z-40 md:hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
        <button 
          onClick={() => setIsCartOpen(true)}
          className="w-full bg-black/60 backdrop-blur-xl text-white font-bold py-4 rounded-full shadow-2xl flex items-center justify-between px-6 hover:scale-[1.02] active:scale-95 transition-all border border-white/20"
        >
          <span className="flex items-center gap-2">
            <BsCart size={20} />
            View Cart
          </span>
          <span className="bg-[#a7dff4] text-black text-xs font-bold px-2 py-1 rounded-md">
            {totalItems} {totalItems === 1 ? 'item' : 'items'} • ₱{itemsTotal.toFixed(2)}
          </span>
        </button>
      </div>
    )}

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
