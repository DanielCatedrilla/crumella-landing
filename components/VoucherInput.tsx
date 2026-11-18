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
      // The server checks the code (active, expiry, usage limit, min spend)
      // and works out the discount. The final check happens again at checkout.
      const { data: result, error } = await supabase.rpc('check_voucher', {
        p_code: code,
        p_cart_total: cartTotal,
      });

      if (error || !result) {
        setStatus('error');
        setMessage("Error validating voucher");
        return;
      }

      if (!result.valid) {
        setStatus('error');
        setMessage(result.message || "Invalid or inactive code");
        return;
      }

      const discountAmount = Number(result.discount) || 0;

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