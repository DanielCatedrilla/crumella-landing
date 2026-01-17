"use client";
import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const trackingNumber = searchParams.get('trackingNumber');
  const displayId = trackingNumber || orderId;
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Clear saved cart and checkout details on success
    localStorage.removeItem("chewy_cart_items");
    localStorage.removeItem("chewy_checkout_details");
  }, []);

  const handleCopy = () => {
    if (displayId) {
      navigator.clipboard.writeText(displayId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <main className="min-h-screen bg-blue-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Background Blobs */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>

      <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-blue-100 max-w-md w-full text-center relative z-10">
        {/* Success Icon */}
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce shadow-lg shadow-blue-100/50">
          <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        
        <h1 className="text-4xl font-black text-gray-900 mb-3 tracking-tight">Sweet Success!</h1>
        <p className="text-gray-500 mb-8 text-lg font-medium leading-relaxed">
          Your Crumella order is confirmed. 
        </p>

        <div className="bg-blue-50 p-4 rounded-xl mb-8 flex items-center justify-between border border-blue-100">
          <div className="text-left">
            <div className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">{trackingNumber ? 'Tracking Number' : 'Order ID'}</div>
            <div className="font-black text-xl text-gray-900">
              {displayId || <span className="text-gray-400 text-lg">No ID Found</span>}
            </div>
          </div>
          {displayId && (
            <button 
              onClick={handleCopy}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-bold text-sm shadow-sm border border-blue-100 hover:bg-blue-50 transition-colors"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          )}
        </div>

        <Link 
          href="/" 
          className="block w-full bg-blue-600 text-white font-black text-lg py-4 rounded-2xl hover:bg-blue-700 transition-all transform hover:-translate-y-1 hover:shadow-xl active:scale-95"
        >
          Back to Home
        </Link>
      </div>

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

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-blue-50">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}