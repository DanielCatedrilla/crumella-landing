"use client";
import React, { useState } from "react";
import VoucherInput from "../../components/VoucherInput";
import { supabase } from "../../components/supabase";
import Link from "next/link";

export default function TestVoucherPage() {
  const [cartTotal] = useState(500); // Simulating a ₱500 cart
  const [discount, setDiscount] = useState(0);
  const [voucherCode, setVoucherCode] = useState("");
  const [checkoutStatus, setCheckoutStatus] = useState("");

  const handleSimulateCheckout = async () => {
    if (!voucherCode) return alert("No voucher applied to test.");
    setCheckoutStatus("Processing...");

    // 1. Get the current voucher data to find its ID and current count
    const { data: voucher, error: fetchError } = await supabase
      .from('vouchers')
      .select('id, used_count')
      .eq('code', voucherCode)
      .single();

    if (fetchError || !voucher) {
      setCheckoutStatus("Error: Could not find voucher in DB.");
      return;
    }

    // 2. Increment the usage count
    const { error: updateError } = await supabase
      .from('vouchers')
      .update({ used_count: voucher.used_count + 1 })
      .eq('id', voucher.id);

    if (updateError) {
      setCheckoutStatus("Error: Failed to update usage count.");
      console.error(updateError);
    } else {
      setCheckoutStatus("Success! Usage count incremented. Check Admin Dashboard.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
        <h1 className="text-2xl font-black mb-6">Voucher System Test</h1>
        
        <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Cart Subtotal</span>
            <span className="font-bold">₱{cartTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-2 text-green-600">
            <span className="">Discount</span>
            <span className="font-bold">-₱{discount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-200 text-lg font-black">
            <span>Total</span>
            <span>₱{(cartTotal - discount).toFixed(2)}</span>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Test a Code</label>
          <VoucherInput 
            cartTotal={cartTotal} 
            onApply={(amount, code) => {
              setDiscount(amount);
              setVoucherCode(code);
            }} 
          />
        </div>

        <button 
          onClick={handleSimulateCheckout}
          disabled={!voucherCode}
          className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
        >
          Simulate Checkout & Increment Usage
        </button>

        {checkoutStatus && (
          <div className={`p-3 rounded-lg text-sm font-bold text-center ${checkoutStatus.includes("Success") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {checkoutStatus}
          </div>
        )}

        <Link href="/admin" className="block text-center text-sm text-gray-500 mt-4 hover:underline">
          Go to Admin Dashboard to Verify
        </Link>
      </div>
    </div>
  );
}
