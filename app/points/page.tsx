"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "../../components/supabase";
import { ORDER_ITEMS } from "../../components/Menu";

const REDEEMABLES = [
  { name: "Free Chocolate Chunk Cookie", points: 75, src: "/CS/CCH.png", color: "bg-[#fffdf7]", terms: "This reward requires at least one other purchased item in your cart to checkout." },
  { name: "Free Crumella Minis", points: 150, src: "/HS/HS7.png", color: "bg-pink-100", terms: "Delivery Fee Applies." },
  { name: "Free Exclusive Merch", points: 400, src: "/HS/Merch.png", color: "bg-[#a6dff6]", terms: "Delivery Fee Applies." },
  { name: "Free Classic Assorted Bundle", points: 250, src: "/CS/CA.png", color: "bg-yellow-100", terms: "Delivery Fee Applies." },
].map((item, index) => {
  // Find the matching item in the main menu to get the correct ID
  const match = ORDER_ITEMS.find((i) => i.name === item.name);
  return {
    // Use the real Menu ID if found. If not found, use a fallback (note: fallback items won't appear in cart)
    id: match ? match.id : index + 9000,
    ...item,
    src: match ? match.src : item.src, // Sync image with Menu to prevent errors
  };
});

function LoyaltyCard({ user }: { user: any }) {
  const [transform, setTransform] = useState("");

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const { left, top, width, height } = card.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;
    const centerX = width / 2;
    const centerY = height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -15; 
    const rotateY = ((x - centerX) / centerX) * 15;

    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
  };

  const handleMouseLeave = () => {
    setTransform("");
  };

  return (
    <div
      className="relative w-full max-w-md mx-auto aspect-[1.586/1] rounded-3xl bg-gradient-to-br from-[#a6dff6] via-[#ccecf9] to-[#9adcf7] text-black shadow-2xl overflow-hidden transition-all duration-200 ease-out cursor-pointer mb-8 md:mb-0 border border-white/50 group"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transform: transform || "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)" }}
    >
       {/* Card Content */}
       <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/40 rounded-full blur-3xl mix-blend-overlay"></div>
       <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/30 rounded-full blur-3xl mix-blend-overlay"></div>
       
       <div className="relative z-10 p-8 flex flex-col h-full justify-between select-none">
          <div className="flex justify-between items-start">
            <div>
                <h3 className="font-black text-3xl tracking-tighter italic text-black">Crumella<span className="text-white">.</span></h3>
                <p className="text-[10px] font-bold text-black/60 uppercase tracking-[0.2em] mt-1">Exclusive Rewards</p>
            </div>
          </div>

          <div className="flex items-center gap-4 opacity-90">
             {/* Contactless Icon */}
             <svg className="w-8 h-8 text-black/30" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><circle cx="12" cy="12" r="3"/><path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/></svg>
          </div>

          <div>
             <p className="font-mono text-xl md:text-2xl tracking-widest text-black/80 mb-3 drop-shadow-sm" style={{ wordSpacing: '0.2em' }}>
                {user.unique_id ? user.unique_id.match(/.{1,3}/g)?.join(' ') : '000 000 000'}
             </p>
             <div className="flex justify-between items-end">
                <div>
                    <p className="text-[9px] text-black/50 font-bold uppercase tracking-widest mb-0.5">Card Holder</p>
                    <p className="font-bold text-sm md:text-base uppercase tracking-wide truncate max-w-[200px] text-black">{user.first_name} {user.last_name}</p>
                </div>
                <div className="text-right">
                    <p className="text-[9px] text-black/50 font-bold uppercase tracking-widest mb-0.5">Expires</p>
                    <p className="font-mono text-sm text-black">
                      {user.expires_at 
                        ? new Date(user.expires_at).toLocaleDateString('en-US', { month: '2-digit', year: '2-digit' })
                        : 'N/A'
                      }
                    </p>
                </div>
             </div>
          </div>
       </div>
       
       {/* Shine */}
       <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/40 to-white/0 pointer-events-none mix-blend-soft-light opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </div>
  );
}

function RedeemableCard({ item, userPoints, onSelect, isSelected }: { item: any; userPoints: number; onSelect: (item: any) => void; isSelected: boolean; }) {
  const hasEnoughPoints = userPoints >= item.points;

  const handleClick = () => {
    if (hasEnoughPoints) {
      onSelect(item);
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={`relative flex flex-col h-[24rem] w-full rounded-[2rem] bg-white overflow-hidden group transition-all duration-500 ease-out
        ${hasEnoughPoints ? 'cursor-pointer hover:-translate-y-2 hover:shadow-2xl' : 'cursor-not-allowed opacity-70 grayscale-[0.5]'}
        ${isSelected ? 'ring-4 ring-[#a6dff6] ring-offset-4 ring-offset-[#fffdf7] shadow-2xl scale-[1.02]' : 'shadow-lg border border-gray-100'}
      `}
    >
        {/* Image Area */}
        <div className="relative h-3/5 w-full overflow-hidden bg-gray-50">
           <Image 
             src={item.src} 
             alt={item.name} 
             fill 
             className={`object-cover transition-transform duration-700 ease-in-out ${hasEnoughPoints ? 'group-hover:scale-110' : ''}`} 
           />
           
           {/* Points Badge - Floating */}
           <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-white/50 z-10">
              <span className="text-sm font-black text-black">{item.points} PTS</span>
           </div>
        </div>

        {/* Content Area */}
        <div className="relative z-10 p-6 flex flex-col flex-grow justify-between bg-white">
            <div>
              <h3 className="text-xl font-bold text-black leading-tight mb-2 group-hover:text-[#a6dff6] transition-colors">{item.name}</h3>
              <p className="text-xs text-gray-400 font-medium line-clamp-2">{item.terms}</p>
            </div>
            
            <div className="mt-4">
                {hasEnoughPoints ? (
                    <div className={`w-full py-3 rounded-xl text-center text-sm font-bold transition-all duration-300
                        ${isSelected ? 'bg-black text-white' : 'bg-gray-100 text-gray-900 group-hover:bg-black group-hover:text-white'}
                    `}>
                        {isSelected ? 'Selected' : 'Redeem Reward'}
                    </div>
                ) : (
                    <div className="w-full py-3 rounded-xl text-center text-xs font-bold bg-gray-100 text-gray-400 border border-gray-200">
                        Need {item.points - userPoints} more pts
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="max-w-5xl w-full animate-pulse">
      <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-start">
        
        {/* Left Column: Card & Balance */}
        <div className="w-full md:w-5/12 flex flex-col gap-8">
            {/* Card Placeholder */}
            <div className="w-full aspect-[1.586/1] rounded-3xl bg-black/5 shadow-sm"></div>
            
            <div className="px-4 space-y-4">
                {/* Label */}
                <div className="h-3 w-24 bg-black/5 rounded"></div>
                {/* Big Number */}
                <div className="h-16 md:h-24 w-40 bg-black/5 rounded"></div>
                {/* Label */}
                <div className="h-5 w-32 bg-black/5 rounded"></div>
            </div>

            {/* Button */}
            <div className="h-14 w-32 bg-black/5 rounded-full"></div>
        </div>

        {/* Right Column: Redeemables */}
        <div className="w-full md:w-7/12">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
                {/* Header */}
                <div className="h-8 w-48 bg-black/5 rounded mb-6"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-64 w-full rounded-[2rem] bg-black/5"></div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

function AnimatedCounter({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const startValueRef = useRef(0);

  useEffect(() => {
    const startValue = startValueRef.current;
    const endValue = value;
    const duration = 1200; // Animation duration in ms
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);

      // Ease-out cubic function for a smoother end
      const easedPercentage = 1 - Math.pow(1 - percentage, 3);

      const current = Math.floor(startValue + (endValue - startValue) * easedPercentage);
      setDisplayValue(current);

      if (percentage < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        startValueRef.current = endValue; // Update start ref for next animation
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [value]);

  return <>{displayValue}</>;
}

// --- State Management Refactor ---
// By centralizing state logic into a reducer, we make state transitions
// more predictable and easier to debug, especially with multiple related states.

interface RewardsState {
  view: 'login' | 'activate' | 'dashboard' | 'loading';
  user: any | null;
  selectedRedeemable: any | null;
  error: string;
  loginUniqueId: string;
  loginLastName: string;
  activateUniqueId: string;
  activateFirstName: string;
  activateLastName: string;
  activatePhone: string;
  activateEmail: string;
}

const initialState: RewardsState = {
  view: 'login',
  user: null,
  selectedRedeemable: null,
  error: '',
  loginUniqueId: '',
  loginLastName: '',
  activateUniqueId: '',
  activateFirstName: '',
  activateLastName: '',
  activatePhone: '',
  activateEmail: '',
};

type RewardsAction =
  | { type: 'SET_FIELD'; field: keyof RewardsState; value: string }
  | { type: 'API_START' }
  | { type: 'LOGIN_SUCCESS'; payload: any }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'ACTIVATE_SUCCESS'; payload: any }
  | { type: 'ACTIVATE_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'SWITCH_VIEW'; view: 'login' | 'activate' }
  | { type: 'SELECT_REDEEMABLE'; payload: any | null }

function rewardsReducer(state: RewardsState, action: RewardsAction): RewardsState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'API_START':
      return { ...state, view: 'loading', error: '' };
    case 'LOGIN_SUCCESS':
    case 'ACTIVATE_SUCCESS':
      // On success, clear form fields and show dashboard
      return { ...initialState, view: 'dashboard', user: action.payload };
    case 'LOGIN_FAILURE':
      return { ...state, view: 'login', error: action.payload };
    case 'ACTIVATE_FAILURE':
      return { ...state, view: 'activate', error: action.payload };
    case 'LOGOUT':
      return { ...initialState };
    case 'SWITCH_VIEW':
      return { ...state, view: action.view, error: '' };
    case 'SELECT_REDEEMABLE':
      // Toggle selection: if same item is clicked, deselect it.
      return { ...state, selectedRedeemable: state.selectedRedeemable?.id === action.payload?.id ? null : action.payload };
    default:
      return state;
  }
}

export default function RewardsPage() {
  const [state, dispatch] = React.useReducer(rewardsReducer, initialState);
  const { view, user, selectedRedeemable, error, loginUniqueId, loginLastName, activateUniqueId, activateFirstName, activateLastName, activatePhone, activateEmail } = state;
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: 'API_START' });

    try {
      // Query Supabase for the user's card
      // Assumes a table 'loyalty_cards' exists with these columns
      const { data, error } = await supabase
        .from('loyalty_cards')
        .select('*')
        .eq('unique_id', loginUniqueId)
        .ilike('last_name', loginLastName) // Case-insensitive match for last name
        .single();

      if (error || !data) {
        console.error("Login query error:", error);
        dispatch({ type: 'LOGIN_FAILURE', payload: "Card not found. Please check your Unique ID and Last Name." });
      } else if (data.expires_at && new Date(data.expires_at) < new Date()) {
        // Check if the card has expired
        dispatch({ type: 'LOGIN_FAILURE', payload: "This rewards card has expired." });
      } else {
        dispatch({ type: 'LOGIN_SUCCESS', payload: data });
      }
    } catch (err) {
      console.error("An unexpected error occurred during login:", err);
      dispatch({ type: 'LOGIN_FAILURE', payload: "An unexpected error occurred. Please try again." });
    }
  };

  const handleActivateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: 'API_START' });

    try {
      // 1. Check if card exists and is not activated
      const { data: cardData, error: cardError } = await supabase
        .from('loyalty_cards')
        .select('is_activated')
        .eq('unique_id', activateUniqueId)
        .single();

      if (cardError || !cardData) {
        dispatch({ type: 'ACTIVATE_FAILURE', payload: "Invalid Unique ID. Please check the ID on your physical card." });
        return;
      }

      if (cardData.is_activated) {
        dispatch({ type: 'ACTIVATE_FAILURE', payload: "This card has already been activated. Please try checking your points instead." });
        return;
      }

      // 2. If it exists and is not activated, update it with user details
      // Set a fixed expiration date: March 31, 2028
      const expiryDate = new Date('2028-03-31T23:59:59Z');

      const { data, error: updateError } = await supabase
        .from('loyalty_cards')
        .update({
          first_name: activateFirstName,
          last_name: activateLastName,
          phone_number: activatePhone,
          email: activateEmail,
          is_activated: true,
          expires_at: expiryDate.toISOString(),
        })
        .eq('unique_id', activateUniqueId)
        .select()
        .single();

      if (updateError) {
        console.error("Card activation error:", updateError);
        if (updateError.message && updateError.message.includes('duplicate key')) {
            dispatch({ type: 'ACTIVATE_FAILURE', payload: "An account with this email or phone number may already exist. Please try checking your points instead." });
        } else {
            dispatch({ type: 'ACTIVATE_FAILURE', payload: "Could not activate card. Please check your details and try again." });
        }
      } else {
        dispatch({ type: 'ACTIVATE_SUCCESS', payload: data });
      }
    } catch (err) {
      console.error("An unexpected error occurred during card activation:", err);
      dispatch({ type: 'ACTIVATE_FAILURE', payload: "An unexpected error occurred during activation. Please try again." });
    }
  };

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const handleSelectRedeemable = (item: any) => {
    dispatch({ type: 'SELECT_REDEEMABLE', payload: item });
  };

  const handleRedeem = () => {
    if (!selectedRedeemable || !user) return;

    // Deselect item after starting redemption process, so user can't click again.
    dispatch({ type: 'SELECT_REDEEMABLE', payload: null });

    // 1. Get the existing cart (handle potential format errors)
    let cart: { [key: number]: number } = {};
    try {
      const cartData = localStorage.getItem('chewy_cart_items');
      if (cartData) {
        const parsed = JSON.parse(cartData);
        // If it's not an array (correct format), use it. If it is an array (old bad format), reset it.
        if (!Array.isArray(parsed)) {
          cart = parsed;
        }
      }
    } catch (error) {
      console.error("Error parsing cart:", error);
    }

    // Check for any existing pending redemptions and remove them from the cart
    // This enforces the "1 item per transaction" rule by replacing the old reward
    try {
      const existingRedemptionData = localStorage.getItem('pending_redemption');
      if (existingRedemptionData) {
        const parsedRedemption = JSON.parse(existingRedemptionData);
        // Handle both array (legacy multi-item) and object formats
        const previousRedemptions = Array.isArray(parsedRedemption) ? parsedRedemption : [parsedRedemption];
        
        previousRedemptions.forEach((redemption: any) => {
           if (redemption.redeemed_item_id) {
             const oldId = redemption.redeemed_item_id;
             if (cart[oldId]) {
               // Decrement the quantity. If it was 1, it becomes 0 and is removed.
               cart[oldId] = Math.max(0, cart[oldId] - 1);
               if (cart[oldId] === 0) {
                 delete cart[oldId];
               }
             }
           }
        });
      }
    } catch (e) {
      console.error("Error clearing previous redemptions:", e);
    }

    // 2. Add the redeemed item to the cart (increment quantity)
    const itemId = selectedRedeemable.id;
    cart[itemId] = (cart[itemId] || 0) + 1;

    // 3. Store details needed for point deduction and to identify the free item
    const pendingRedemption = {
      unique_id: user.unique_id,
      points_cost: selectedRedeemable.points,
      redeemed_item_id: itemId, // Store which item ID is the free one
    };

    // 4. Save updated cart and redemption info
    localStorage.setItem('chewy_cart_items', JSON.stringify(cart));
    // Overwrite pending_redemption with the single new object (enforcing 1 item limit)
    localStorage.setItem('pending_redemption', JSON.stringify(pendingRedemption));

    // 5. Redirect to the main order page to continue shopping or checkout
    router.push('/order?openCart=true');
  };

  return (
    <main className="min-h-screen bg-[#fffdf7] flex flex-col relative">
      <Navbar />
      
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#a7dff4] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 translate-x-1/2 translate-y-1/2"></div>
      </div>

      <div className="flex-grow flex items-center justify-center px-4 py-32 relative z-10">
        
        {view === 'loading' && <DashboardSkeleton />}

        {view === 'activate' && (
            <div className="max-w-md w-full bg-white/80 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] shadow-2xl border border-white/50 animate-in fade-in zoom-in duration-300">
              <div className="text-center mb-8">
                <span className="text-[#a6dff6] font-bold tracking-widest uppercase mb-2 block">Crumella Rewards</span>
                <h1 className="text-3xl md:text-4xl font-black text-black mb-2 tracking-tight">Activate Your Card</h1>
                <p className="text-gray-500 font-medium text-sm">Enter your details to unlock exclusive perks.</p>
              </div>

              <form onSubmit={handleActivateCard} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-black mb-2 ml-1">Unique Card ID</label>
                  <input type="text" value={activateUniqueId} onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'activateUniqueId', value: e.target.value.toUpperCase() })} className="w-full px-6 py-4 rounded-2xl bg-white border-2 border-gray-100 focus:border-black focus:bg-white outline-none transition-all font-bold text-black placeholder-gray-300 shadow-sm" placeholder="Located on your physical card" required />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-black mb-2 ml-1">First Name</label>
                  <input type="text" value={activateFirstName} onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'activateFirstName', value: e.target.value.toUpperCase() })} className="w-full px-6 py-4 rounded-2xl bg-white border-2 border-gray-100 focus:border-black focus:bg-white outline-none transition-all font-bold text-black placeholder-gray-300 shadow-sm" placeholder="e.g. Juan" required />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-black mb-2 ml-1">Last Name</label>
                  <input type="text" value={activateLastName} onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'activateLastName', value: e.target.value.toUpperCase() })} className="w-full px-6 py-4 rounded-2xl bg-white border-2 border-gray-100 focus:border-black focus:bg-white outline-none transition-all font-bold text-black placeholder-gray-300 shadow-sm" placeholder="e.g. Dela Cruz" required />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-black mb-2 ml-1">Phone Number</label>
                  <input type="tel" value={activatePhone} onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'activatePhone', value: e.target.value })} className="w-full px-6 py-4 rounded-2xl bg-white border-2 border-gray-100 focus:border-black focus:bg-white outline-none transition-all font-bold text-black placeholder-gray-300 shadow-sm" placeholder="e.g. 09171234567" required />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-black mb-2 ml-1">Email</label>
                  <input type="email" value={activateEmail} onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'activateEmail', value: e.target.value.toLowerCase() })} className="w-full px-6 py-4 rounded-2xl bg-white border-2 border-gray-100 focus:border-black focus:bg-white outline-none transition-all font-bold text-black placeholder-gray-300 shadow-sm" placeholder="e.g. juan@email.com" required />
                </div>

                {error && (
                  <div className="bg-red-50 text-red-500 text-sm font-bold p-4 rounded-xl text-center border border-red-100">
                    {error}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={view === 'loading'}
                  className="w-full bg-black text-white font-bold py-4 rounded-full hover:bg-[#a7dff4] hover:text-black hover:scale-[1.02] active:scale-95 transition-all duration-300 shadow-lg text-lg disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {view === 'loading' ? "Activating..." : "Activate & View Rewards"}
                </button>
              </form>
              
              <div className="mt-8 text-center">
                  <p className="text-gray-400 text-sm font-medium">
                      Already have a card?{" "}
                      <button onClick={() => dispatch({ type: 'SWITCH_VIEW', view: 'login' })} className="text-black font-bold hover:underline">
                        Check your points
                      </button>
                  </p>
              </div>
            </div>
        )}

        {view === 'login' && (
            <div className="max-w-md w-full bg-white/80 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] shadow-2xl border border-white/50 animate-in fade-in zoom-in duration-300">
            <div className="text-center mb-8">
              <span className="text-[#a6dff6] font-bold tracking-widest uppercase mb-2 block">Crumella Rewards</span>
              <h1 className="text-3xl md:text-4xl font-black text-black mb-2 tracking-tight">Check Points</h1>
              <p className="text-gray-500 font-medium text-sm">Access your exclusive rewards dashboard.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black mb-2 ml-1">Unique ID</label>
                <input 
                  type="text" 
                  value={loginUniqueId}
                  onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'loginUniqueId', value: e.target.value.toUpperCase() })}
                  className="w-full px-6 py-4 rounded-2xl bg-white border-2 border-gray-100 focus:border-black focus:bg-white outline-none transition-all font-bold text-black placeholder-gray-300 shadow-sm"
                  placeholder="e.g. 882910"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black mb-2 ml-1">Last Name</label>
                <input 
                  type="text" 
                  value={loginLastName}
                  onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'loginLastName', value: e.target.value.toUpperCase() })}
                  className="w-full px-6 py-4 rounded-2xl bg-white border-2 border-gray-100 focus:border-black focus:bg-white outline-none transition-all font-bold text-black placeholder-gray-300 shadow-sm"
                  placeholder="e.g. Dela Cruz"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-500 text-sm font-bold p-4 rounded-xl text-center border border-red-100">
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={view === 'loading'}
                className="w-full bg-black text-white font-bold py-4 rounded-full hover:bg-[#a7dff4] hover:text-black hover:scale-[1.02] active:scale-95 transition-all duration-300 shadow-lg text-lg disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {view === 'loading' ? "Verifying..." : "View Rewards"}
              </button>
            </form>

            <div className="mt-8 text-center">
                <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="flex-shrink mx-4 text-gray-400 text-sm">OR</span>
                    <div className="flex-grow border-t border-gray-200"></div>
                </div>
                <button 
                  onClick={() => dispatch({ type: 'SWITCH_VIEW', view: 'activate' })}
                  className="w-full bg-white border-2 border-gray-200 text-black font-bold py-4 mt-2 rounded-full hover:bg-gray-50 active:scale-95 transition-all duration-300 text-lg"
                >Activate Card</button>
            </div>
          </div>
        )}

        {view === 'dashboard' && user && (
            <div className="max-w-5xl w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-start">
                
                {/* Left Column: Card & Balance */}
                <div className="w-full md:w-5/12 flex flex-col gap-8 md:sticky md:top-32">
                    <LoyaltyCard user={user} />
                    
                    <div className="text-center md:text-left px-4 py-4">
                        <span className="text-gray-400 font-bold uppercase tracking-[0.2em] text-xs block mb-2">Current Balance</span>
                        <div className="text-7xl md:text-9xl font-black text-black tracking-tighter leading-none">
                            <AnimatedCounter value={user.points || 0} />
                        </div>
                        <span className="text-[#a7dff4] font-black text-xl uppercase tracking-widest mt-2 block">Points Available</span>
                    </div>

                    <button 
                        onClick={handleLogout}
                        className="w-full md:w-auto bg-white border-2 border-gray-100 text-black font-bold py-4 px-10 rounded-full hover:bg-black hover:text-white hover:border-black transition-all duration-300 shadow-sm text-sm uppercase tracking-widest"
                    >
                        Sign Out
                    </button>
                </div>

                {/* Right Column: Redeemables */}
                <div className="w-full md:w-7/12">
                    <div className="bg-white/60 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-white/50">
                        <h3 className="text-3xl font-black text-black mb-8 tracking-tight">Exclusive Rewards</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {REDEEMABLES.map((item) => (
                                <RedeemableCard 
                                  key={item.id} 
                                  item={item} 
                                  userPoints={user.points || 0}
                                  onSelect={handleSelectRedeemable}
                                  isSelected={selectedRedeemable?.id === item.id}
                                />
                            ))}
                        </div>
                        <div className="mt-8 pt-6 border-t border-gray-100">
                            {selectedRedeemable && (
                                <div className="bg-gray-50 p-3 rounded-xl text-sm text-gray-700 font-medium mb-4">
                                    <p className="font-bold text-black mb-1">Redemption Terms for "{selectedRedeemable.name}":</p>
                                    <p>{selectedRedeemable.terms}</p>
                                </div>
                            )}
                            <button
                                onClick={handleRedeem}
                                disabled={!selectedRedeemable}
                                className="w-full bg-black text-white font-bold py-4 rounded-full hover:bg-[#a7dff4] hover:text-black transition-all duration-300 shadow-lg text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >{selectedRedeemable ? "Redeem" : "Select an item to redeem"}</button>
                        </div>
                        <p className="text-xs text-gray-500 mt-4 text-center">
                            General terms and conditions apply. All redemptions are subject to availability.
                        </p>
                    </div>
                </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="relative z-10 mt-auto">
        <Footer />
      </div>
    </main>
  );
}