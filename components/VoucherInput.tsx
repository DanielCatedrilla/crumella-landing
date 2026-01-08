"use client";
import React, { useState } from "react";
import { supabase } from "./supabase";

interface VoucherInputProps {
  cartTotal: number;
  onApply: (discount: number, code: string) => void;
}

export default function VoucherInput({ cartTotal, onApply }: VoucherInputProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleApply = async () => {
    if (!code) return;
    setLoading(true);
    setMessage("");
    setStatus('idle');

    try {
      // 1. Fetch voucher
      const { data: voucher, error } = await supabase
        .from('vouchers')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .single();

      if (error || !voucher) {
        setStatus('error');
        setMessage("Invalid or inactive code");
        return;
      }

      // 2. Check Expiration
      if (voucher.expires_at && new Date(voucher.expires_at) < new Date()) {
        setStatus('error');
        setMessage(`Expired on ${new Date(voucher.expires_at).toLocaleDateString()}`);
        return;
      }

      // 3. Check Usage Limit
      if (voucher.max_uses && voucher.used_count >= voucher.max_uses) {
        setStatus('error');
        setMessage("Voucher fully redeemed");
        return;
      }

      // 4. Check Min Spend
      if (cartTotal < voucher.min_spend) {
        setStatus('error');
        setMessage(`Minimum spend of ₱${voucher.min_spend} required`);
        return;
      }

      // 5. Calculate Discount
      let discountAmount = 0;
      if (voucher.type === 'fixed') {
        discountAmount = voucher.value;
      } else {
        // Percentage
        discountAmount = (cartTotal * voucher.value) / 100;
      }

      // Cap discount at cart total
      if (discountAmount > cartTotal) discountAmount = cartTotal;

      setStatus('success');
      setMessage(`Applied! ₱${discountAmount.toFixed(2)} off`);
      onApply(discountAmount, code);

    } catch (err) {
      console.error(err);
      setStatus('error');
      setMessage("Error validating voucher");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter voucher code"
          className={`flex-1 bg-gray-50 border px-4 py-3 rounded-xl outline-none transition-all font-bold uppercase placeholder-gray-400 ${
            status === 'error' ? 'border-red-300 focus:border-red-500 text-red-600' : 
            status === 'success' ? 'border-green-300 focus:border-green-500 text-green-700' : 
            'border-gray-200 focus:border-black text-gray-900'
          }`}
          disabled={status === 'success'}
        />
        <button
          onClick={handleApply}
          disabled={loading || !code || status === 'success'}
          className={`px-6 py-3 rounded-xl font-bold transition-all ${
            status === 'success' 
              ? 'bg-green-100 text-green-700 cursor-default'
              : 'bg-black text-white hover:bg-gray-800 active:scale-95'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {loading ? "..." : status === 'success' ? "✓" : "Apply"}
        </button>
      </div>
      {message && (
        <p className={`text-xs font-bold mt-2 ml-1 ${
          status === 'error' ? 'text-red-500' : 
          status === 'success' ? 'text-green-600' : 'text-gray-500'
        }`}>
          {message}
        </p>
      )}
    </div>
  );
}