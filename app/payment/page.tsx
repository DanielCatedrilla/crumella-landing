"use client";
import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import VoucherInput from "../../components/VoucherInput";
import { supabase } from "../../components/supabase";
import emailjs from '@emailjs/browser';

export default function PaymentPage() {
  const [order, setOrder] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [voucherCode, setVoucherCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [rewardsId, setRewardsId] = useState("");
  const [isRewardsIdValid, setIsRewardsIdValid] = useState<boolean | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
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

  // Auto-fill Rewards ID if a redemption is pending so the user earns points on the paid portion
  useEffect(() => {
    const autoFillRewards = async () => {
      const pendingRedemptionRaw = localStorage.getItem("pending_redemption");
      if (pendingRedemptionRaw) {
        try {
          const parsed = JSON.parse(pendingRedemptionRaw);
          // Handle both array (legacy) and object formats
          const redemption = Array.isArray(parsed) ? parsed[0] : parsed;
          
          if (redemption?.unique_id) {
            setRewardsId(redemption.unique_id);
            setIsValidating(true);
            
            const { data } = await supabase
              .from('loyalty_cards')
              .select('is_activated, first_name')
              .eq('unique_id', redemption.unique_id)
              .single();

            if (data && data.is_activated) {
              setIsRewardsIdValid(true);
              setValidationMessage(`Card linked: ${data.first_name}`);
            }
            setIsValidating(false);
          }
        } catch (e) {
          console.error("Error auto-filling rewards ID:", e);
        }
      }
    };
    
    autoFillRewards();
  }, []);

  // Recalculate total on the client-side to ensure data integrity,
  // avoiding issues like NaN from corrupted localStorage data.
  const calculatedTotal = useMemo(() => {
    if (!order || !Array.isArray(order.items)) {
      return 0;
    }
    const itemsTotal = order.items.reduce((acc: number, item: any) => {
      // Safely access price and quantity, providing defaults if they are not numbers.
      const price = typeof item.price === 'number' ? item.price : 0;
      const quantity = typeof item.quantity === 'number' ? item.quantity : 1;
      return acc + price * quantity;
    }, 0);
    // Get delivery fee from the nested customer object
    return itemsTotal + (order.customer?.deliveryFee || 0);
  }, [order]);

  const handleValidateRewardsId = async () => {
    if (!rewardsId) {
      setValidationMessage("Please enter a Unique ID.");
      setIsRewardsIdValid(false);
      return;
    }

    setIsValidating(true);
    setValidationMessage("");
    setIsRewardsIdValid(null);

    try {
      const { data, error } = await supabase
        .from('loyalty_cards')
        .select('is_activated, first_name')
        .eq('unique_id', rewardsId)
        .single();

      if (error || !data) {
        setValidationMessage("Invalid Unique ID. Please check and try again.");
        setIsRewardsIdValid(false);
      } else if (!data.is_activated) {
        setValidationMessage("This card is not activated yet. Please activate it on the Rewards page.");
        setIsRewardsIdValid(false);
      } else {
        setValidationMessage(`Card validated for ${data.first_name}! Points will be added on confirmation.`);
        setIsRewardsIdValid(true);
      }
    } catch (err) {
      setValidationMessage("An error occurred during validation. Please try again.");
      setIsRewardsIdValid(false);
    } finally {
      setIsValidating(false);
    }
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
        const finalTotal = calculatedTotal - discount;
        // Explicitly construct the final order data to prevent stale or unexpected properties
        // from localStorage from being sent to the database. This is safer than spreading `...order`.
        const orderData = {
            customer: order.customer,
            items: order.items,
            total: calculatedTotal,
            tracking_number: order.tracking_number,
            paymentMethod,
            proofUrl,
            voucherCode: discount > 0 ? voucherCode : null,
            discount,
            finalTotal,
            status: "New",
            createdAt: new Date().toISOString(),
        };

        // 3. Save to Supabase Database
        const { error: insertError } = await supabase.from('orders').insert([orderData]);

        if (insertError) throw insertError;

        // 4. Increment Voucher Usage
        if (discount > 0 && voucherCode) {
          const { data: v } = await supabase.from('vouchers').select('id, used_count').eq('code', voucherCode).single();
          if (v) {
            await supabase.from('vouchers').update({ used_count: v.used_count + 1 }).eq('id', v.id);
          }
        }

        // 5a. Deduct points for redeemed item (if any)
        const pendingRedemptionRaw = localStorage.getItem('pending_redemption');
        if (pendingRedemptionRaw) {
          // Handle both array (new) and object (legacy) formats
          const parsed = JSON.parse(pendingRedemptionRaw);
          const pendingRedemptions = Array.isArray(parsed) ? parsed : [parsed];

          for (const pendingRedemption of pendingRedemptions) {
            if (pendingRedemption.unique_id && pendingRedemption.points_cost > 0) {
            try {
              const { error: deductError } = await supabase.rpc('deduct_points', {
                card_id: pendingRedemption.unique_id,
                points_to_deduct: Number(pendingRedemption.points_cost)
              });

              if (deductError) {
                // Log error for manual correction, but don't block the user.
                // The order is already placed.
                console.error('CRITICAL: Failed to deduct points for redemption:', deductError.message || deductError);
              }
            } catch (redemptionError) {
              console.error('CRITICAL: An unexpected error occurred during point deduction:', redemptionError);
            }
          }
          }
        }

        // 5. Add points to loyalty card (if provided)
        let pointsToAdd = 0;
        if (rewardsId && isRewardsIdValid) {
          try {
            pointsToAdd = Math.floor(finalTotal / 20);
            if (pointsToAdd > 0) {
              const { error: rewardsError } = await supabase.rpc('add_points', {
                points_to_add: pointsToAdd,
                card_id: rewardsId
              });

              if (rewardsError) {
                // Log error but don't block the user flow
                console.error('Failed to add points to rewards card:', rewardsError);
              }
            }
          } catch (rewardsError) {
            // Log error but don't block the user flow
            console.error('An unexpected error occurred while adding points:', rewardsError);
          }
        }

        // 6. Cleanup & Redirect
        localStorage.removeItem("latestOrder");
        localStorage.removeItem("pending_redemption"); // Clean up redemption data
        let redirectUrl = `/success?trackingNumber=${order.tracking_number}`;
        if (pointsToAdd > 0) {
          redirectUrl += `&pointsEarned=${pointsToAdd}`;
        }
        router.push(redirectUrl);

        // 7. Send Email Confirmation (non-critical, done after redirect is queued)
        try {
          const emailPayload = {
            to_name: order.customer.name,
            to_email: order.customer.email,
            tracking_number: order.tracking_number,
            total: finalTotal.toFixed(2),
            order_items: order.items
              .filter((item: any) => item.quantity > 0)
              .map((item: any) => `${item.quantity}x ${item.name}`)
              .join('\n')
              + (order.customer?.deliveryFee > 0 ? `\n\nDelivery Fee: ₱${order.customer.deliveryFee.toFixed(2)}` : ''),
          };
          await emailjs.send(
            process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "",
            process.env.NEXT_PUBLIC_EMAILJS_ORDER_TEMPLATE_ID || "", // Note: Ensure your EmailJS template can display this multi-line string.
            emailPayload,
            process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || ""
          );
        } catch (emailError) {
          console.error("Failed to send confirmation email:", emailError);
        }

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
                ₱{(calculatedTotal - discount).toFixed(2)}
                {discount > 0 && <span className="text-lg text-gray-400 line-through ml-3">₱{calculatedTotal.toFixed(2)}</span>}
            </h2>
          </div>

          {/* Voucher Section */}
          <div className="mb-8 md:mb-10 bg-gray-50 p-4 md:p-6 rounded-2xl border border-gray-100">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Have a Voucher?</label>
            <VoucherInput 
              cartTotal={calculatedTotal} 
              onApply={(amount, code) => {
                setDiscount(amount);
                setVoucherCode(code);
              }} 
            />
          </div>

          {/* Rewards Section */}
          <div className="mb-8 md:mb-10 bg-gray-50 p-4 md:p-6 rounded-2xl border border-gray-100">
            <label htmlFor="rewards-id" className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Have a Crumella Rewards Card?</label>
            <p className="text-sm text-gray-500 mb-3">Enter your Unique ID to earn points from this purchase.</p>
            <div className="flex items-start gap-2">
              <input
                id="rewards-id"
                type="text"
                value={rewardsId}
                onChange={(e) => {
                  setRewardsId(e.target.value);
                  setIsRewardsIdValid(null);
                  setValidationMessage("");
                }}
                className="w-full px-5 py-3 rounded-xl bg-white border-2 border-gray-200 focus:border-black focus:bg-white outline-none transition-all font-bold text-black placeholder-gray-300 disabled:bg-gray-100"
                placeholder="Enter your Unique ID"
                disabled={isRewardsIdValid === true}
              />
              <button
                onClick={handleValidateRewardsId}
                disabled={isValidating || !rewardsId || isRewardsIdValid === true}
                className="px-6 py-3 rounded-xl bg-black text-white font-bold hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isValidating ? "..." : "Validate"}
              </button>
            </div>
            {validationMessage && <p className={`text-sm mt-2 font-medium ${isRewardsIdValid === false ? 'text-red-600' : 'text-green-600'}`}>{validationMessage}</p>}
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
                            {order.customer.orderType === 'pickup' ? 'Cash on Pickup' : 'Cash on Delivery'}
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
                    {order.items.map((item: any, idx: number) => {
                        const isRedeemed = item.price === 0 || item.isRedeemed;
                        return (
                            <div key={idx} className="flex justify-between items-center text-sm">
                                <div>
                                    <span className="text-gray-600">
                                        {typeof item.quantity === 'number' ? item.quantity : 1}x {typeof item.name === 'string' ? item.name : 'Item'}
                                    </span>
                                    {isRedeemed && (
                                        <span className="ml-2 text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-green-100 text-green-700">
                                            Redeemed
                                        </span>
                                    )}
                                </div>
                                <span className="font-medium text-gray-800">
                                    {isRedeemed ? 'FREE' : `₱${(item.price * item.quantity).toFixed(2)}`}
                                </span>
                            </div>
                        );
                    })}
                    {order.customer?.deliveryFee > 0 && (
                        <div className="flex justify-between items-center text-sm border-t border-dashed border-gray-200 pt-2 mt-2">
                             <span className="text-gray-600">Delivery Fee</span>
                             <span className="font-medium text-gray-800">₱{order.customer.deliveryFee.toFixed(2)}</span>
                        </div>
                    )}
                </div>
                
                <div className="bg-gray-50 p-6 rounded-xl space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-500">Customer</span>
                        <span className="font-medium text-black">
                            {typeof order.customer.name === 'string' ? order.customer.name : '[Invalid Name]'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Type</span>
                        <span className="font-medium text-black capitalize">
                            {typeof order.customer.orderType === 'string' ? order.customer.orderType : 'Order'}
                        </span>
                    </div>
                    {order.customer.orderType === 'delivery' ? (
                        <div className="flex justify-between">
                            <span className="text-gray-500">Address</span>
                            <span className="font-medium text-black text-right max-w-[200px] truncate">
                                {typeof order.customer.address === 'string' ? order.customer.address : '[Invalid Address]'}
                            </span>
                        </div>
                    ) : (
                        <div className="flex justify-between">
                            <span className="text-gray-500">Pickup At</span>
                            <span className="font-medium text-black text-right">
                                {typeof order.customer.pickupLocation === 'string' ? order.customer.pickupLocation : '[Invalid Location]'}
                            </span>
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
