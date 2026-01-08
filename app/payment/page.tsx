"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../components/supabase";

export default function PaymentPage() {
  const [order, setOrder] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherMessage, setVoucherMessage] = useState<{type: 'error' | 'success', text: string} | null>(null);
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Retrieve order data from local storage
    const data = localStorage.getItem("latestOrder");
    if (data) {
      setOrder(JSON.parse(data));
    } else {
      // If no order data found, redirect back to order page
      router.push("/order");
    }
  }, [router]);

  const handleApplyVoucher = () => {
    setVoucherMessage(null);
    setDiscount(0);

    // 1. Check Expiration
    const expirationDate = new Date('2026-01-31T23:59:59');
    const now = new Date();
    if (now > expirationDate) {
        setVoucherMessage({ type: 'error', text: "This voucher has expired." });
        return;
    }

    // 2. Check Format (2025-XX or 2025-XXX)
    const regex = /^2025-(\d{2,3})$/;
    const match = voucherCode.match(regex);

    if (!match) {
         setVoucherMessage({ type: 'error', text: "Invalid voucher code format." });
         return;
    }

    const suffix = match[1];
    const num = parseInt(suffix, 10);

    // Validate Range (1 to 100)
    if (num < 1 || num > 100) {
        setVoucherMessage({ type: 'error', text: "Invalid voucher code." });
        return;
    }

    // Validate Strict Formatting (01-09, 10-99, 100)
    let expectedSuffix = num.toString();
    if (num < 10) expectedSuffix = "0" + num;
    
    if (suffix !== expectedSuffix) {
         setVoucherMessage({ type: 'error', text: "Invalid voucher code format." });
         return;
    }

    // 3. Check if Used (Mock Data)
    const usedVouchers = ['2025-22', '2025-50']; // Example used vouchers
    if (usedVouchers.includes(voucherCode)) {
        setVoucherMessage({ type: 'error', text: "This voucher has already been used." });
        return;
    }

    // Success
    setDiscount(50.00); // Applying a flat $50 discount
    setVoucherMessage({ type: 'success', text: "Voucher applied! ₱50.00 off." });
  };

  const handleConfirmPayment = async () => {
    if ((paymentMethod === 'gcash' || paymentMethod === 'bank') && !proofFile) {
        alert("Please upload your proof of payment to continue.");
        return;
    }

    setLoading(true);

    try {
        let proofUrl = "";

        // 1. Upload Proof Image (if exists)
        if (proofFile) {
            const fileName = `${Date.now()}_${proofFile.name}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('proofs')
                .upload(fileName, proofFile);

            if (uploadError) throw uploadError;
            
            const { data: { publicUrl } } = supabase.storage.from('proofs').getPublicUrl(fileName);
            proofUrl = publicUrl;
        }

        // 2. Prepare Order Data
        const finalTotal = order.total - discount;
        const orderData = {
            ...order,
            paymentMethod,
            proofUrl,
            voucherCode: discount > 0 ? voucherCode : null,
            discount,
            finalTotal,
            status: "Pending",
            createdAt: new Date().toISOString(),
        };

        // 3. Save to Supabase Database
        const { error: insertError } = await supabase.from('orders').insert([orderData]);

        if (insertError) throw insertError;

        // 4. Cleanup & Redirect
        localStorage.removeItem("latestOrder");
        router.push("/success");

    } catch (error) {
        console.error("Error saving order:", error);
        alert("Something went wrong. Please try again.");
    } finally {
        setLoading(false);
    }
  };

  if (!order) return null;

  return (
    <main className="min-h-screen bg-[#fffdf7] py-8 md:py-12 px-4 md:px-8 relative overflow-hidden">
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
            Payment<span className="text-[#a7dff4]">.</span>
          </h1>
        </div>

        <div className="bg-white p-6 md:p-12 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl border border-gray-100">
          <div className="text-center mb-8 md:mb-10">
            <p className="text-gray-500 font-medium uppercase tracking-wider text-xs md:text-sm mb-2">Total Amount Due</p>
            <h2 className="text-4xl md:text-5xl font-black text-black">
                ₱{(order.total - discount).toFixed(2)}
                {discount > 0 && <span className="text-lg text-gray-400 line-through ml-3">₱{order.total.toFixed(2)}</span>}
            </h2>
          </div>

          {/* Voucher Section */}
          <div className="mb-8 md:mb-10 bg-gray-50 p-4 md:p-6 rounded-2xl border border-gray-100">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Have a Voucher?</label>
            <div className="flex flex-col sm:flex-row gap-3">
                <input 
                    type="text" 
                    placeholder="Enter voucher code" 
                    className="flex-1 px-4 md:px-5 py-3 rounded-xl bg-white border-2 border-transparent focus:border-black outline-none transition-all text-black placeholder:text-gray-400 font-medium"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                />
                <button 
                    onClick={handleApplyVoucher}
                    className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors w-full sm:w-auto"
                >
                    Apply
                </button>
            </div>
            {voucherMessage && (
                <p className={`text-sm mt-3 font-bold ${voucherMessage.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>
                    {voucherMessage.text}
                </p>
            )}
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-bold text-black">Select Payment Method</h3>
            
            {/* Payment Options */}
            <div className="grid gap-3 md:gap-4">
                {/* Cash Option */}
                <label className={`flex items-center p-4 md:p-6 rounded-2xl border-2 cursor-pointer transition-all bg-gray-50 group ${paymentMethod === 'cash' ? 'border-black' : 'border-gray-100 hover:border-gray-200'}`}>
                    <input 
                        type="radio" 
                        name="payment" 
                        className="w-6 h-6 accent-black" 
                        checked={paymentMethod === 'cash'}
                        onChange={() => setPaymentMethod('cash')}
                    />
                    <div className="ml-4">
                        <span className="block font-bold text-lg text-black">
                            {order.customer.orderType === 'pickup' ? 'Pay at Store' : 'Cash on Delivery/Pickup'}
                        </span>
                        <span className="block text-sm text-gray-500 mt-1">Pay in cash when you receive your order.</span>
                    </div>
                </label>

                {/* GCash Option */}
                <label className={`flex flex-col p-4 md:p-6 rounded-2xl border-2 cursor-pointer transition-all bg-gray-50 group ${paymentMethod === 'gcash' ? 'border-black' : 'border-gray-100 hover:border-gray-200'}`}>
                    <div className="flex items-center w-full">
                        <input 
                            type="radio" 
                            name="payment" 
                            className="w-6 h-6 accent-black" 
                            checked={paymentMethod === 'gcash'}
                            onChange={() => setPaymentMethod('gcash')}
                        />
                        <div className="ml-4">
                            <span className="block font-bold text-lg text-black">GCash</span>
                            <span className="block text-sm text-gray-500 mt-1">Scan QR code & upload proof.</span>
                        </div>
                    </div>
                    
                    {paymentMethod === 'gcash' && (
                        <div className="mt-6 pl-10 animate-in fade-in slide-in-from-top-2">
                            <div className="bg-white p-4 rounded-xl border border-gray-200 inline-block mb-4">
                                <div className="relative w-48 h-48 bg-gray-200 rounded-lg overflow-hidden">
                                    <Image 
                                        src="/QR/GCASH.png" 
                                        alt="GCash QR Code" 
                                        fill 
                                        className="object-cover"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-black mb-2">Upload Proof of Payment</label>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800 transition-all cursor-pointer" 
                                />
                            </div>
                        </div>
                    )}
                </label>

                {/* Bank Transfer Option */}
                <label className={`flex flex-col p-4 md:p-6 rounded-2xl border-2 cursor-pointer transition-all bg-gray-50 group ${paymentMethod === 'bank' ? 'border-black' : 'border-gray-100 hover:border-gray-200'}`}>
                    <div className="flex items-center w-full">
                        <input 
                            type="radio" 
                            name="payment" 
                            className="w-6 h-6 accent-black" 
                            checked={paymentMethod === 'bank'}
                            onChange={() => setPaymentMethod('bank')}
                        />
                        <div className="ml-4">
                            <span className="block font-bold text-lg text-black">Bank Transfer</span>
                            <span className="block text-sm text-gray-500 mt-1">Scan QR code & upload proof.</span>
                        </div>
                    </div>

                    {paymentMethod === 'bank' && (
                        <div className="mt-6 pl-10 animate-in fade-in slide-in-from-top-2">
                            <div className="bg-white p-4 rounded-xl border border-gray-200 inline-block mb-4">
                                <div className="relative w-48 h-48 bg-gray-200 rounded-lg overflow-hidden">
                                    <Image 
                                        src="/QR/PNB.png" 
                                        alt="Bank QR Code" 
                                        fill 
                                        className="object-cover"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-black mb-2">Upload Proof of Payment</label>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800 transition-all cursor-pointer" 
                                />
                            </div>
                        </div>
                    )}
                </label>
            </div>

            <div className="pt-8 border-t border-gray-100 mt-8">
                <h4 className="font-bold text-black mb-4">Order Summary</h4>
                <div className="space-y-2 mb-6">
                    {order.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm">
                            <span className="text-gray-600">{item.quantity}x {item.name}</span>
                        </div>
                    ))}
                </div>
                
                <div className="bg-gray-50 p-6 rounded-xl space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-500">Customer</span>
                        <span className="font-medium text-black">{order.customer.name}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Type</span>
                        <span className="font-medium text-black capitalize">{order.customer.orderType}</span>
                    </div>
                    {order.customer.orderType === 'delivery' ? (
                        <div className="flex justify-between">
                            <span className="text-gray-500">Address</span>
                            <span className="font-medium text-black text-right max-w-[200px] truncate">{order.customer.address}</span>
                        </div>
                    ) : (
                        <div className="flex justify-between">
                            <span className="text-gray-500">Pickup At</span>
                            <span className="font-medium text-black text-right">{order.customer.pickupLocation}</span>
                        </div>
                    )}
                </div>
            </div>

            <button 
                onClick={handleConfirmPayment}
                disabled={loading}
                className="w-full bg-black text-white font-bold py-5 rounded-full hover:bg-[#a7dff4] hover:text-black hover:scale-[1.02] active:scale-95 transition-all duration-300 shadow-xl text-lg mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? "Processing..." : "Confirm Payment"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
