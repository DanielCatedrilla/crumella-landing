"use client";
import React, { useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function SuccessContent() {
  const searchParams = useSearchParams();
  const trackingNumber = searchParams.get("trackingNumber");
  const pointsEarned = searchParams.get("pointsEarned");

  useEffect(() => {
    // Clear saved cart and checkout details on success
    localStorage.removeItem("chewy_cart_items");
    localStorage.removeItem("chewy_checkout_details");
  }, []);

  return (
    <main className="min-h-screen bg-[#fffdf7] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#a7dff4] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

      <div className="max-w-md w-full bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-gray-100 text-center relative z-10">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10 text-green-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-black text-black mb-4">
          Order Confirmed!
        </h1>
        <p className="text-gray-500 font-medium mb-6">
          Thank you for your purchase. We've sent a confirmation to your email and will process your order shortly.
        </p>

        {trackingNumber && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 mb-8">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Tracking Number</p>
            <p className="text-lg font-mono font-bold text-black tracking-widest">{trackingNumber}</p>
          </div>
        )}

        {pointsEarned && Number(pointsEarned) > 0 && (
          <div className="bg-blue-50 border-2 border-blue-100 p-4 rounded-2xl mb-8 animate-in fade-in zoom-in-95 duration-300">
            <p className="text-sm font-bold text-blue-900">You've earned</p>
            <p className="text-4xl font-black text-[#a6dff6] my-1">{pointsEarned} points!</p>
            <p className="text-xs text-blue-800/70 font-medium">They have been added to your Crumella Rewards card.</p>
          </div>
        )}

        <Link href="/" className="block w-full bg-black text-white font-bold py-4 rounded-full hover:bg-[#a7dff4] hover:text-black hover:scale-[1.02] active:scale-95 transition-all duration-300 shadow-lg">
          Back to Home
        </Link>
      </div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}