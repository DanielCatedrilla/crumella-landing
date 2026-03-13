"use client";
import React, { useState, useEffect, use } from "react";
import { supabase } from "../../../../components/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Re-using the LoyaltyCard component from the points page for consistent UI
function LoyaltyCard({ user }: { user: any }) {
  if (!user) return null;

  return (
    <div
      className="relative w-full max-w-md mx-auto aspect-[1.586/1] rounded-3xl bg-gradient-to-br from-[#a6dff6] via-[#ccecf9] to-[#9adcf7] text-black shadow-[0_20px_40px_-10px_rgba(166,223,246,0.6)] overflow-hidden mb-10 border border-white/60 ring-1 ring-black/5 transform transition-transform hover:scale-[1.02] duration-500"
    >
       {/* Card Content */}
       <div className="absolute -top-32 -right-32 w-80 h-80 bg-white/40 rounded-full blur-3xl mix-blend-overlay"></div>
       <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-white/30 rounded-full blur-3xl mix-blend-overlay"></div>
       
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
    </div>
  );
}

export default function AdminCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [cardUser, setCardUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [purchaseAmount, setPurchaseAmount] = useState<string>("");
  const [redeemAmount, setRedeemAmount] = useState<string>("");
  const [transactionType, setTransactionType] = useState<'earn' | 'redeem'>('earn');
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const uniqueId = id;
  const router = useRouter();

  // Check for admin authentication
  useEffect(() => {
    const storedAuth = localStorage.getItem("adminAuthenticated");
    if (storedAuth === "true") {
      setIsAuthenticated(true);
    } else {
        setLoading(false);
    }
  }, []);

  // Fetch card data if authenticated
  useEffect(() => {
    if (isAuthenticated && uniqueId) {
      const fetchCardData = async () => {
        setLoading(true);
        setError(null);
        const { data, error } = await supabase
          .from('loyalty_cards')
          .select('*')
          .eq('unique_id', uniqueId)
          .single();

        if (error || !data) {
          setError(`Card with ID "${uniqueId}" not found.`);
        } else if (!data.is_activated) {
          setError(`This card has not been activated yet. Please guide the customer to complete the activation process first.`);
        } else {
          setCardUser(data);
        }
        setLoading(false);
      };
      fetchCardData();
    }
  }, [isAuthenticated, uniqueId]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const adminSecret = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
    if (adminSecret && password === adminSecret) {
      localStorage.setItem("adminAuthenticated", "true");
      setIsAuthenticated(true);
    } else {
      alert("Incorrect password");
    }
  };

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setSuccessMessage(null);
    setError(null);

    let pointsChange = 0;

    if (transactionType === 'earn') {
      if (!purchaseAmount || isNaN(Number(purchaseAmount)) || Number(purchaseAmount) <= 0) {
        alert("Please enter a valid purchase amount.");
        setProcessing(false);
        return;
      }
      const amount = Number(purchaseAmount);
      pointsChange = Math.floor(amount / 20);

      if (pointsChange <= 0) {
        setProcessing(false);
        setError("Purchase amount is too low to earn points.");
        return;
      }
    } else {
      if (!redeemAmount || isNaN(Number(redeemAmount)) || Number(redeemAmount) <= 0) {
        alert("Please enter a valid points amount to redeem.");
        setProcessing(false);
        return;
      }
      pointsChange = -Math.floor(Number(redeemAmount));
      
      if ((cardUser.points || 0) + pointsChange < 0) {
        setProcessing(false);
        setError("Insufficient points balance for this redemption.");
        return;
      }
    }

    try {
      const { error: rpcError } = await supabase.rpc('add_points', {
        points_to_add: pointsChange,
        card_id: uniqueId
      });

      if (rpcError) {
        throw rpcError;
      }

      // Update UI optimistically
      setCardUser((prev: any) => ({
        ...prev,
        points: (prev.points || 0) + pointsChange
      }));
      
      if (transactionType === 'earn') {
        setSuccessMessage(`Successfully added ${pointsChange} points!`);
        setPurchaseAmount("");
      } else {
        setSuccessMessage(`Successfully redeemed ${Math.abs(pointsChange)} points!`);
        setRedeemAmount("");
      }

    } catch (err: any) {
      console.error("Error updating points:", err);
      setError(`Failed to update points: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 w-full max-w-sm">
          <h1 className="text-2xl font-black text-center mb-6 text-gray-900">Admin Login Required</h1>
          <p className="text-center text-gray-600 mb-4 text-sm">You must be logged in as an admin to access this page.</p>
          <input
            type="password"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 mb-4 outline-none focus:border-black transition-all text-gray-900 placeholder-gray-500"
            placeholder="Enter Admin Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="w-full bg-black text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors cursor-pointer">
            Login
          </button>
          <Link href="/admin" className="block text-center text-sm text-gray-600 mt-4 hover:text-black">Back to Admin Dashboard</Link>
        </form>
      </div>
    );
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#fffdf7]">Loading card details...</div>;
  }

  return (
    <main className="min-h-screen bg-[#fffdf7] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative overflow-hidden font-sans selection:bg-black selection:text-white">
      {/* Decorative background elements */}
      <div className={`absolute top-0 left-0 w-[600px] h-[600px] bg-[#a7dff4] rounded-full mix-blend-multiply filter blur-[120px] opacity-30 -translate-x-1/3 -translate-y-1/3 pointer-events-none transition-colors duration-1000 ${transactionType === 'earn' ? 'bg-[#a7dff4]' : 'bg-rose-200'}`}></div>
      <div className={`absolute bottom-0 right-0 w-[600px] h-[600px] bg-pink-200 rounded-full mix-blend-multiply filter blur-[120px] opacity-30 translate-x-1/3 translate-y-1/3 pointer-events-none transition-colors duration-1000 ${transactionType === 'earn' ? 'bg-emerald-100' : 'bg-orange-100'}`}></div>

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">
                {transactionType === 'earn' ? 'Add Points' : 'Redeem Rewards'}
            </h1>
            <p className="text-slate-500 font-medium text-lg">
                {transactionType === 'earn' ? 'Scan successful. Enter purchase amount.' : 'Deduct points for customer reward.'}
            </p>
        </div>

        {error ? (
          <div className="bg-white/80 backdrop-blur-xl border border-red-100 text-red-600 p-8 rounded-3xl text-center shadow-xl">
            <h3 className="font-bold text-lg mb-2">Error</h3>
            <p className="text-sm mb-6">{error}</p>
            <Link href="/admin" className="mt-4 inline-block bg-black text-white font-bold py-2 px-4 rounded-full hover:bg-gray-800 transition-colors">
                Back to Admin
            </Link>
          </div>
        ) : cardUser && (
          <>
            <LoyaltyCard user={cardUser} />
            
            <div className="bg-white/80 backdrop-blur-2xl p-8 md:p-10 rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-white/60 ring-1 ring-black/5 transition-all duration-500">
                <div className="text-center mb-8">
                    <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs block mb-2">Available Balance</p>
                    <div className="text-7xl font-black text-slate-900 tracking-tighter leading-none mb-2">
                        {cardUser.points || 0}
                    </div>
                    <div className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${transactionType === 'earn' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'} transition-colors duration-300`}>
                        Crumella Points
                    </div>
                </div>

                {/* Transaction Type Toggle */}
                <div className="flex p-1.5 bg-slate-100/80 rounded-2xl mb-8 relative overflow-hidden">
                  <button
                    type="button"
                    onClick={() => { setTransactionType('earn'); setError(null); setSuccessMessage(null); }}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 relative z-10 ${transactionType === 'earn' ? 'bg-white text-emerald-600 shadow-md ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Earn Points
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTransactionType('redeem'); setError(null); setSuccessMessage(null); }}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 relative z-10 ${transactionType === 'redeem' ? 'bg-white text-rose-600 shadow-md ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Redeem Points
                  </button>
                </div>

                <form onSubmit={handleTransaction} className="space-y-6">
                  {transactionType === 'earn' ? (
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-900 mb-2 ml-1">Purchase Amount</label>
                        <div className="relative group">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl group-focus-within:text-emerald-500 transition-colors">₱</span>
                            <input 
                                type="number" 
                                step="0.01"
                                value={purchaseAmount}
                                onChange={(e) => setPurchaseAmount(e.target.value)}
                                className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-slate-900 placeholder-slate-300 shadow-sm text-xl" 
                                placeholder="0.00" 
                                required 
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-3 ml-1 font-medium">1 point is earned for every ₱20 spent.</p>
                    </div>
                  ) : (
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-900 mb-2 ml-1">Points to Redeem</label>
                        <input 
                            type="number" 
                            value={redeemAmount}
                            onChange={(e) => setRedeemAmount(e.target.value)}
                            className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-rose-500 focus:bg-white outline-none transition-all font-bold text-slate-900 placeholder-slate-300 shadow-sm text-xl" 
                            placeholder="0" 
                            required 
                        />
                        <p className="text-xs text-slate-500 mt-3 ml-1 font-medium">Deduct points for rewards.</p>
                    </div>
                  )}

                    {successMessage && (
                        <div className={`text-sm font-bold p-4 rounded-2xl text-center border animate-in fade-in slide-in-from-bottom-2 ${transactionType === 'earn' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                            {successMessage}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={processing}
                        className={`w-full text-white font-bold py-4 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-xl text-lg disabled:opacity-50 disabled:cursor-not-allowed mt-4 ${
                            transactionType === 'earn'
                                ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
                                : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'
                        }`}
                    >
                        {processing ? "Processing..." : (transactionType === 'earn' ? "Confirm & Add Points" : "Confirm Redemption")}
                    </button>
                </form>
            </div>
            <div className="text-center mt-10">
                <Link href="/admin" className="text-sm font-bold text-slate-400 hover:text-slate-800 transition-colors">
                    ← Back to Admin Dashboard
                </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
