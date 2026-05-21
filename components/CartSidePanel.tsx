import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ORDER_ITEMS, MENU_ITEMS } from './Menu';
import { BsCart } from 'react-icons/bs';

const PREMIUM_BUNDLE_ID = 9;

interface CartSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  cart: { [key: number]: number };
  updateQuantity: (id: number, delta: number) => void;
  totalItems: number;
  itemsTotal: number;
  onProceedToCheckout: () => void;
  redeemedItemIds?: number[];
}

type DisplayItem = {
  id: number;
  quantity: number;
  src: string;
  name: string;
  price: number;
  wasJustAdded: boolean;
  isBundleBox: boolean;
  boxConfig: Record<number, number> | null;
};

const configKey = (config: Record<number, number>) =>
  JSON.stringify(Object.entries(config).sort((a, b) => Number(a[0]) - Number(b[0])));

export default function CartSidePanel({
  isOpen,
  onClose,
  cart,
  updateQuantity,
  totalItems,
  itemsTotal,
  onProceedToCheckout,
  redeemedItemIds,
}: CartSidePanelProps) {
  const prevCartRef = useRef<{ [key: number]: number }>({});
  const prevTotalRef = useRef(totalItems);
  const [justAddedIds, setJustAddedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (prevTotalRef.current > 0 && totalItems === 0 && isOpen) {
      onClose();
    }
    prevTotalRef.current = totalItems;
  }, [totalItems, isOpen, onClose]);

  // Read fresh from localStorage every render so stale state never causes grouping bugs.
  let bundleConfigs: Record<number, Record<number, number>[]> = {};
  try {
    bundleConfigs = JSON.parse(localStorage.getItem("crumella_bundle_configs") || "{}");
  } catch {}

  useEffect(() => {
    const newlyAdded = new Set<number>();
    Object.entries(cart).forEach(([idStr, qty]) => {
      const id = Number(idStr);
      if (qty > (prevCartRef.current[id] || 0)) newlyAdded.add(id);
    });
    prevCartRef.current = cart;

    if (newlyAdded.size > 0) {
      const t1 = setTimeout(() => setJustAddedIds(newlyAdded), 0);
      const t2 = setTimeout(() => setJustAddedIds(new Set()), 800);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [cart]);

  const removeBundleConfig = (config: Record<number, number>) => {
    try {
      const raw = localStorage.getItem("crumella_bundle_configs");
      if (raw) {
        const all = JSON.parse(raw);
        if (Array.isArray(all[PREMIUM_BUNDLE_ID])) {
          const k = configKey(config);
          const idx = (all[PREMIUM_BUNDLE_ID] as Record<number, number>[])
            .findIndex(c => configKey(c) === k);
          if (idx !== -1) all[PREMIUM_BUNDLE_ID].splice(idx, 1);
          localStorage.setItem("crumella_bundle_configs", JSON.stringify(all));
        }
      }
    } catch {}
    updateQuantity(PREMIUM_BUNDLE_ID, -1);
  };


  const displayItems: DisplayItem[] = Object.entries(cart).flatMap(([idStr, quantity]): DisplayItem[] => {
    const id = Number(idStr);
    const item = ORDER_ITEMS.find(i => i.id === id);
    const base = {
      id,
      src: item?.src || '',
      name: item?.name || 'Unknown Item',
      price: item?.price || 0,
      wasJustAdded: justAddedIds.has(id),
    };

    if (id === PREMIUM_BUNDLE_ID) {
      const raw = bundleConfigs[PREMIUM_BUNDLE_ID];
      const configs: Record<number, number>[] = Array.isArray(raw) ? raw : [];
      const groups = new Map<string, { config: Record<number, number>; count: number }>();
      configs.slice(0, quantity).forEach(cfg => {
        const k = configKey(cfg);
        const existing = groups.get(k);
        if (existing) existing.count++;
        else groups.set(k, { config: cfg, count: 1 });
      });
      return Array.from(groups.values()).map(({ config, count }): DisplayItem => ({
        ...base, quantity: count, isBundleBox: true, boxConfig: config,
      }));
    }

    return [{ ...base, quantity, isBundleBox: false, boxConfig: null }];
  });

  // Rule: "Free Chocolate Chunk Cookie" requires another paid item to checkout.
  const CHOCO_CHUNK_REDEEM_ID = 100;
  const isChocoChunkOnlyRedemption =
    redeemedItemIds?.includes(CHOCO_CHUNK_REDEEM_ID) &&
    itemsTotal === 0 &&
    totalItems > 0;

  const trashIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  );

  return (
    <>
      <style>{`
        @keyframes highlight-item {
          50% { background-color: rgba(167, 223, 244, 0.2); }
        }
        .animate-highlight {
          animation: highlight-item 0.7s ease-out;
        }
      `}</style>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Side Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 shrink-0">
          <h2 className="text-2xl font-bold text-black">Your Cart ({totalItems})</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-black transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cart Items */}
        {totalItems > 0 ? (
          <div className="grow overflow-y-auto p-6 space-y-4">
            {displayItems.map((item) => {
              const key = item.isBundleBox
                ? `${item.id}_${item.boxConfig ? configKey(item.boxConfig) : 'empty'}`
                : `${item.id}`;
              const isRedeemed = redeemedItemIds?.includes(item.id);

              return (
                <div key={key} className={`flex items-start gap-4 p-2 -m-2 rounded-lg ${item.wasJustAdded ? 'animate-highlight' : ''}`}>
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                    <Image src={item.src} alt={item.name} fill className="object-cover" />
                  </div>

                  <div className="grow min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-bold text-black leading-tight">{item.name}</p>
                      {isRedeemed && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-green-100 text-green-700">
                          Redeemed
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">₱{item.price.toFixed(2)}</p>

                    {/* Bundle box: flavor list */}
                    {item.isBundleBox && item.boxConfig && (
                      <div className="mt-1.5 space-y-0.5">
                        {Object.entries(item.boxConfig).map(([fid, count]) => {
                          const name = MENU_ITEMS.find(m => m.id === Number(fid))?.name
                            .replace(" Cookie", "") ?? "Unknown";
                          return (
                            <div key={fid} className="text-[10px] text-gray-400">
                              {count}× {name}
                            </div>
                          );
                        })}
                        <Link
                          href="/order/premium-assorted-bundle"
                          onClick={onClose}
                          className="text-[9px] font-bold text-[#3a9dc0] hover:underline mt-1 block"
                        >
                          Add more or edit on the bundle page →
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Controls */}
                  {item.isBundleBox ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-bold text-black bg-gray-100 px-3 py-1 rounded-full">×{item.quantity}</span>
                      <button
                        onClick={() => item.boxConfig && removeBundleConfig(item.boxConfig)}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title="Remove one box"
                      >
                        {trashIcon}
                      </button>
                    </div>
                  ) : isRedeemed ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-bold text-black bg-gray-100 px-3 py-1 rounded-full">x{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, -item.quantity)}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title="Remove Item"
                      >
                        {trashIcon}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center bg-gray-100 rounded-full p-1 shrink-0">
                      <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm text-gray-600 hover:bg-black hover:text-white transition-colors">-</button>
                      <span className="w-8 text-center font-bold text-sm text-black">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center bg-black text-white rounded-full shadow-sm hover:bg-[#a7dff4] hover:text-black transition-colors">+</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grow flex flex-col items-center justify-center text-center p-6 text-gray-400">
            <BsCart size={80} className="mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-black mt-4">Your cart is empty</h3>
            <p className="text-gray-500 mt-2">Looks like you haven&apos;t added any cookies yet.</p>
          </div>
        )}

        {/* Footer */}
        {totalItems > 0 && (
          <div className="p-6 border-t border-gray-200 bg-gray-50 shrink-0">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-bold text-black">Subtotal</span>
              <span className="text-xl font-black text-black">₱{itemsTotal.toFixed(2)}</span>
            </div>
            {isChocoChunkOnlyRedemption && (
              <div className="bg-yellow-50 text-yellow-800 text-xs font-bold p-3 rounded-lg text-center border border-yellow-200 mb-3">
                The &quot;Free Chocolate Chunk Cookie&quot; reward requires at least one other purchased item to checkout.
              </div>
            )}
            <button
              onClick={onProceedToCheckout}
              disabled={isChocoChunkOnlyRedemption}
              className="w-full bg-black text-white font-bold py-4 rounded-full hover:bg-[#a7dff4] hover:text-black hover:scale-[1.02] active:scale-95 transition-all duration-300 shadow-lg text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
}
