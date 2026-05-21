"use client";
import React, { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ORDER_ITEMS, MENU_ITEMS } from "../../../components/Menu";
import Navbar from "../../../components/Navbar";
import CartSidePanel from "../../../components/CartSidePanel";
import { BsCart } from "react-icons/bs";

const HIDDEN_NAMES = [
  "Free Exclusive Merch",
  "Free Chocolate Chunk Cookie",
  "Free Crumella Minis",
  "Free Classic Assorted Bundle",
];

const PREMIUM_FLAVOR_NAMES = [
  "Matcha Cookie",
  "Red Velvet Cookie",
  "Hazelnut Lava Cookie",
  "Biscoff® Cookie",
  "S'mores Cookie",
];
const PREMIUM_FLAVORS = MENU_ITEMS.filter(i => PREMIUM_FLAVOR_NAMES.includes(i.name));

const BOX_SIZE = 4;

const toSlug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const getTagIcon = (tag: string) => {
  const t = tag.toLowerCase();
  if (['lava', 'caramelized', 'spiced', 'rich'].some(k => t.includes(k)))
    return <><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.048 8.287 8.287 0 0 0 9 9.6a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.546 5.974 5.974 0 0 1-2.133-1A3.75 3.75 0 0 0 12 18z" /></>;
  if (['gooey', 'marshmallow'].some(k => t.includes(k)))
    return <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 1.332-7.257 3 3 0 0 0-3.758-3.848 5.25 5.25 0 0 0-10.233 2.33A4.502 4.502 0 0 0 2.25 15z" />;
  if (['indulgent', 'cream cheese', 'red velvet', 'sweet'].some(k => t.includes(k)))
    return <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />;
  if (['green tea', 'earthy'].some(k => t.includes(k)))
    return <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0z" />;
  if (['dark chocolate', 'chunks', 'double choco', 'chocolate', 'graham'].some(k => t.includes(k)))
    return <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />;
  if (t.includes('classic'))
    return <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />;
  if (t.includes('nutella'))
    return <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a8.25 8.25 0 0 0 7.891-10.857c-.55-1.61-1.477-3.066-2.679-4.252L12 1.5 6.788 5.891C5.586 7.077 4.659 8.533 4.109 10.143A8.25 8.25 0 0 0 12 21z" />;
  return <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />;
};


export default function CookieDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const item = ORDER_ITEMS.find(i => toSlug(i.name) === slug);
  const itemId = item?.id ?? -1;
  const isAssortedBundle = item?.name === "Premium Assorted Bundle";

  const photos = item?.photos && item.photos.length > 0 ? item.photos : item ? [item.src] : [];
  const [activePhoto, setActivePhoto] = useState(0);
  const [cart, setCart] = useState<{ [key: number]: number }>({});
  const [isCartLoaded, setIsCartLoaded] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [localQty, setLocalQty] = useState(1);
  const [boxQty, setBoxQty] = useState(1);
  const [editingComboKey, setEditingComboKey] = useState<string | null>(null);

  // Flavor builder state (assorted bundles only)
  const [flavorSelection, setFlavorSelection] = useState<{ [flavorId: number]: number }>({});
  const totalSelected = Object.values(flavorSelection).reduce((a, b) => a + b, 0);

  // Build the 4-slot array from selection (null = empty slot)
  const slotsArray: (typeof PREMIUM_FLAVORS[0] | null)[] = [];
  PREMIUM_FLAVORS.forEach(flavor => {
    const count = flavorSelection[flavor.id] || 0;
    for (let i = 0; i < count; i++) slotsArray.push(flavor);
  });
  while (slotsArray.length < BOX_SIZE) slotsArray.push(null);

  const addFlavor = (flavorId: number) => {
    if (totalSelected >= BOX_SIZE) return;
    if ((flavorSelection[flavorId] || 0) >= 2) return;
    setFlavorSelection(prev => ({ ...prev, [flavorId]: (prev[flavorId] || 0) + 1 }));
  };

  const removeFlavor = (flavorId: number) => {
    setFlavorSelection(prev => {
      const current = prev[flavorId] || 0;
      if (current <= 0) return prev;
      const next = { ...prev };
      if (current === 1) delete next[flavorId];
      else next[flavorId] = current - 1;
      return next;
    });
  };

  const relatedItems = ORDER_ITEMS.filter(
    i => i.id !== itemId && i.category === item?.category && !HIDDEN_NAMES.includes(i.name)
  );

  const qty = cart[itemId] || 0;
  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
  const itemsTotal = Object.entries(cart).reduce((total, [itemId, itemQty]) => {
    const o = ORDER_ITEMS.find(i => i.id === Number(itemId));
    return total + (o?.price || 0) * itemQty;
  }, 0);

  useEffect(() => {
    const saved = localStorage.getItem("chewy_cart_items");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed)) setCart(parsed);
      } catch {}
    }
    setIsCartLoaded(true);
  }, [slug, isAssortedBundle]);

  useEffect(() => {
    if (isCartLoaded) {
      localStorage.setItem("chewy_cart_items", JSON.stringify(cart));
    }
  }, [cart, isCartLoaded]);

  const updateQty = (delta: number) => {
    const newQty = Math.max(0, qty + delta);
    setCart(prev => {
      const next = { ...prev };
      if (newQty === 0) delete next[itemId];
      else next[itemId] = newQty;
      return next;
    });
  };

  const updateQuantity = (itemId: number, delta: number) => {
    setCart(prev => {
      const current = prev[itemId] || 0;
      const next = Math.max(0, current + delta);
      const newCart = { ...prev };
      if (next === 0) delete newCart[itemId];
      else newCart[itemId] = next;
      return newCart;
    });
  };

  const configKey = (cfg: Record<number, number>) =>
    JSON.stringify(Object.entries(cfg).sort((a, b) => Number(a[0]) - Number(b[0])));

  const existingBundleGroups: { config: Record<number, number>; count: number }[] = isAssortedBundle ? (() => {
    try {
      const allConfigs = JSON.parse(localStorage.getItem("crumella_bundle_configs") || "{}");
      const configs: Record<number, number>[] = Array.isArray(allConfigs[itemId]) ? allConfigs[itemId] : [];
      const groups = new Map<string, { config: Record<number, number>; count: number }>();
      configs.slice(0, qty).forEach(cfg => {
        const k = configKey(cfg);
        const existing = groups.get(k);
        if (existing) existing.count++;
        else groups.set(k, { config: cfg, count: 1 });
      });
      return Array.from(groups.values());
    } catch { return []; }
  })() : [];

  const addExistingCombo = (config: Record<number, number>) => {
    const allConfigs = JSON.parse(localStorage.getItem("crumella_bundle_configs") || "{}");
    if (!Array.isArray(allConfigs[itemId])) allConfigs[itemId] = [];
    allConfigs[itemId].push({ ...config });
    localStorage.setItem("crumella_bundle_configs", JSON.stringify(allConfigs));
    setCart(prev => {
      const next = { ...prev, [itemId]: (prev[itemId] || 0) + 1 };
      localStorage.setItem("chewy_cart_items", JSON.stringify(next));
      return next;
    });
  };

  const removeExistingCombo = (config: Record<number, number>) => {
    const allConfigs = JSON.parse(localStorage.getItem("crumella_bundle_configs") || "{}");
    if (!Array.isArray(allConfigs[itemId])) return;
    const k = configKey(config);
    const idx = (allConfigs[itemId] as Record<number, number>[]).findIndex(c => configKey(c) === k);
    if (idx === -1) return;
    allConfigs[itemId].splice(idx, 1);
    localStorage.setItem("crumella_bundle_configs", JSON.stringify(allConfigs));
    setCart(prev => {
      const newQty = Math.max(0, (prev[itemId] || 0) - 1);
      const next = { ...prev };
      if (newQty === 0) delete next[itemId];
      else next[itemId] = newQty;
      localStorage.setItem("chewy_cart_items", JSON.stringify(next));
      return next;
    });
  };

  const handleAddToCart = () => {
    if (isAssortedBundle && totalSelected < BOX_SIZE) return;

    if (isAssortedBundle) {
      const newCart = { ...cart, [itemId]: (cart[itemId] || 0) + boxQty };
      localStorage.setItem("chewy_cart_items", JSON.stringify(newCart));
      const configs = JSON.parse(localStorage.getItem("crumella_bundle_configs") || "{}");
      if (!Array.isArray(configs[itemId])) configs[itemId] = [];
      for (let i = 0; i < boxQty; i++) configs[itemId].push({ ...flavorSelection });
      localStorage.setItem("crumella_bundle_configs", JSON.stringify(configs));
      setFlavorSelection({});
      setBoxQty(1);
    } else {
      const newQty = (cart[itemId] || 0) + localQty;
      localStorage.setItem("chewy_cart_items", JSON.stringify({ ...cart, [itemId]: newQty }));
    }

    router.push("/order?openCart=true");
  };

  if (!item) {
    return (
      <div className="min-h-screen bg-[#fffdf7] flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 font-medium">Cookie not found.</p>
        <Link href="/order" className="text-sm font-bold underline">Back to Menu</Link>
      </div>
    );
  }

  const canAdd = !isAssortedBundle || totalSelected === BOX_SIZE;

  return (
    <div className="bg-[#fffdf7]">
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        @keyframes shimmer-slide {
          0% { transform: translateX(-150%); }
          100% { transform: translateX(150%); }
        }
        .cta-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.45) 50%, transparent 60%);
          transform: translateX(-150%);
          transition: none;
        }
        .cta-btn:hover::before {
          animation: shimmer-slide 0.55s ease-out forwards;
        }
      `}</style>

      <Navbar rightSlot={
        <button
          onClick={() => setIsCartOpen(true)}
          className="relative p-2 text-black hover:text-white transition-colors z-50"
        >
          <BsCart size={22} />
          {totalItems > 0 && (
            <span className="absolute top-0 right-0 bg-black text-white rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold">
              {totalItems}
            </span>
          )}
        </button>
      } />

      <div className="flex flex-col md:flex-row" style={{ paddingTop: 72 }}>

        {/* ── LEFT: sticky image gallery (desktop) ── */}
        <div className="hidden md:flex md:w-[56%] sticky top-[72px] h-[calc(100vh-72px)] self-start">
          {photos.length > 1 && (
            <div className="flex flex-col gap-2.5 p-4 justify-center shrink-0">
              {photos.map((p, i) => (
                <motion.button
                  key={i}
                  onClick={() => setActivePhoto(i)}
                  whileTap={{ scale: 0.88 }}
                  className={`relative w-[58px] h-[58px] rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                    i === activePhoto
                      ? "border-black shadow-md opacity-100"
                      : "border-transparent opacity-40 hover:opacity-80 hover:border-gray-300"
                  }`}
                >
                  <Image src={p} alt="" fill className="object-cover" />
                </motion.button>
              ))}
            </div>
          )}
          <div className={`flex-1 relative p-4 ${photos.length > 1 ? "pl-1" : ""}`}>
            <div className="relative h-full rounded-2xl overflow-hidden bg-gray-50 group">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activePhoto}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.28, ease: "easeInOut" }}
                  className="absolute inset-0"
                >
                  <Image
                    src={photos[activePhoto]}
                    alt={item.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    priority
                  />
                </motion.div>
              </AnimatePresence>
              {item.badge && (
                <span className="absolute top-4 left-4 z-10 bg-yellow-400 text-black text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow">
                  {item.badge}
                </span>
              )}
              {photos.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                  {photos.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActivePhoto(i)}
                      className={`rounded-full transition-all duration-300 ${
                        i === activePhoto ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── MOBILE image ── */}
        <div className="md:hidden w-full flex flex-col gap-3 p-4">
          <div className="relative w-full rounded-2xl overflow-hidden bg-gray-50" style={{ aspectRatio: "4/3" }}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={activePhoto} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.28 }} className="absolute inset-0">
                <Image src={photos[activePhoto]} alt={item.name} fill className="object-cover" priority />
              </motion.div>
            </AnimatePresence>
            {item.badge && (
              <span className="absolute top-4 left-4 z-10 bg-yellow-400 text-black text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow">
                {item.badge}
              </span>
            )}
          </div>
          {photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar" style={{ scrollbarWidth: "none" }}>
              {photos.map((p, i) => (
                <motion.button key={i} onClick={() => setActivePhoto(i)} whileTap={{ scale: 0.88 }}
                  className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all duration-300 ${i === activePhoto ? "border-black" : "border-transparent opacity-40"}`}
                >
                  <Image src={p} alt="" fill className="object-cover" />
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT: product info ── */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full md:w-[44%] px-6 md:px-12 py-8 md:py-12 border-l border-gray-100"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-gray-400 mb-3">
            {item.category}
          </p>

          <h1 className="text-4xl md:text-[2.75rem] font-black text-black tracking-tight leading-[1.05] mb-4">
            {item.name}
          </h1>

          <div className="flex items-baseline gap-2.5 mb-5">
            <span className="text-2xl font-black text-black">₱{item.price?.toFixed(2)}</span>
            <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">/ box of 4</span>
          </div>

          <div className="flex items-center gap-3 mb-5">
            <div className="h-[2px] w-10 bg-[#a6dff6] rounded-full" />
            <div className="h-[2px] w-3 bg-[#a6dff6]/40 rounded-full" />
          </div>

          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {item.tags.map(tag => (
                <span key={tag} className="bg-[#a6dff6]/15 border border-[#a6dff6]/60 text-[#2b8cac] text-[11px] font-semibold px-3 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {item.description && (
            <p className="text-gray-500 text-[13px] leading-relaxed mb-5">{item.description}</p>
          )}


          {/* ── FLAVOR BUILDER (assorted bundles only) ── */}
          {isAssortedBundle ? (
            <div className="mb-6">

              {/* ── Step 1: Build your box ── */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-black text-black uppercase tracking-wider">
                    {totalSelected === BOX_SIZE ? 'Your Box' : 'Build Your Box'}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {totalSelected === BOX_SIZE
                      ? 'Looking good! Choose quantity below.'
                      : `Pick ${BOX_SIZE - totalSelected} more cookie${BOX_SIZE - totalSelected !== 1 ? 's' : ''} to complete your box`}
                  </p>
                </div>
                {totalSelected > 0 && (
                  <button
                    onClick={() => { setFlavorSelection({}); setBoxQty(1); }}
                    className="text-[10px] font-bold text-gray-300 hover:text-red-400 uppercase tracking-wider transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* 4 slots */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {slotsArray.map((flavor, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <AnimatePresence mode="wait">
                      {flavor ? (
                        <motion.button
                          key={flavor.id + "-" + i}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 22 }}
                          onClick={() => removeFlavor(flavor.id)}
                          className="relative w-full aspect-square rounded-2xl overflow-hidden border-2 border-black shadow-md group"
                        >
                          <Image src={flavor.src} alt={flavor.name} fill className="object-cover" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-200 flex items-center justify-center">
                            <span className="text-white text-base font-black opacity-0 group-hover:opacity-100 transition-opacity">Remove</span>
                          </div>
                        </motion.button>
                      ) : (
                        <motion.div
                          key={"empty-" + i}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="w-full aspect-square rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-0.5"
                        >
                          <span className="text-[10px] font-black text-gray-300">{i + 1}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <p className="text-[9px] font-bold text-gray-500 text-center leading-tight line-clamp-1 w-full px-0.5 h-3">
                      {flavor ? flavor.name.replace(" Cookie", "").replace("®", "") : ""}
                    </p>
                  </div>
                ))}
              </div>

              {/* Flavor picker */}
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                {totalSelected < BOX_SIZE ? 'Choose your flavors' : 'Change your selection'}
              </p>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {PREMIUM_FLAVORS.map(flavor => {
                  const count = flavorSelection[flavor.id] || 0;
                  const atMax = totalSelected >= BOX_SIZE || count >= 2;
                  return (
                    <motion.div
                      key={flavor.id}
                      className="relative bg-white rounded-2xl border-2 overflow-hidden transition-shadow duration-200 hover:shadow-sm"
                      style={{ borderColor: count > 0 ? "#a6dff6" : "#f3f4f6" }}
                    >
                      <div className="relative w-full aspect-square">
                        <Image src={flavor.src} alt={flavor.name} fill className="object-cover" />
                        {count > 0 && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-1.5 right-1.5 bg-black text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow"
                          >
                            {count}
                          </motion.div>
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-black text-center px-1.5 pt-1.5 pb-1 leading-tight line-clamp-2">
                        {flavor.name.replace(" Cookie", "")}
                      </p>
                      <div className="flex items-center justify-between px-1.5 pb-2 gap-1">
                        <button
                          onClick={() => removeFlavor(flavor.id)}
                          disabled={count === 0}
                          className="flex-1 h-6 rounded-lg bg-gray-100 text-gray-500 text-sm font-bold flex items-center justify-center hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          −
                        </button>
                        <button
                          onClick={() => addFlavor(flavor.id)}
                          disabled={atMax}
                          className="flex-1 h-6 rounded-lg bg-[#a6dff6] text-black text-sm font-bold flex items-center justify-center hover:bg-[#8dd3ef] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    {totalSelected} / {BOX_SIZE} selected
                  </span>
                  {totalSelected === BOX_SIZE && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-[10px] font-black text-[#3a9dc0] uppercase tracking-wider"
                    >
                      Box complete ✓
                    </motion.span>
                  )}
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-[#a6dff6] rounded-full"
                    animate={{ width: `${(totalSelected / BOX_SIZE) * 100}%` }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                </div>
              </div>

              {/* ── Step 2: Quantity — only visible once the box is complete ── */}
              {totalSelected === BOX_SIZE && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-center justify-between px-4 py-3 bg-[#a6dff6]/10 rounded-2xl border border-[#a6dff6]/40"
                >
                  <div>
                    <p className="text-xs font-black text-black uppercase tracking-wider">How many boxes?</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {boxQty === 1 ? 'Ordering 1 box' : `Ordering ${boxQty} boxes`} · ₱{((item.price || 0) * boxQty).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center bg-white border border-[#a6dff6] rounded-full p-1">
                    <button
                      onClick={() => setBoxQty(q => Math.max(1, q - 1))}
                      disabled={boxQty === 1}
                      className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-black hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed font-bold text-lg"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-bold text-sm text-black">{boxQty}</span>
                    <button
                      onClick={() => setBoxQty(q => q + 1)}
                      className="w-8 h-8 flex items-center justify-center bg-black text-white rounded-full hover:bg-[#a6dff6] hover:text-black transition-colors font-bold text-lg"
                    >
                      +
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── Already in cart — secondary, shown at the bottom ── */}
              {qty > 0 && existingBundleGroups.length > 0 && (
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
                    Already in your cart · {qty} {qty === 1 ? 'box' : 'boxes'}
                  </p>
                  <div className="space-y-2">
                    {existingBundleGroups.map(({ config, count }) => {
                      const k = configKey(config);
                      const isEditing = editingComboKey === k;
                      return (
                        <div key={k} className="flex items-center justify-between gap-3">
                          <div className="text-[11px] text-gray-500 space-y-0.5 min-w-0">
                            {Object.entries(config).map(([fid, c]) => {
                              const name = MENU_ITEMS.find(m => m.id === Number(fid))?.name.replace(" Cookie", "") ?? "?";
                              return <div key={fid}>{c}× {name}</div>;
                            })}
                          </div>
                          {isEditing ? (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-full p-1">
                                <button
                                  onClick={() => removeExistingCombo(config)}
                                  className="w-7 h-7 flex items-center justify-center rounded-full text-gray-500 hover:bg-black hover:text-white transition-colors text-sm font-bold"
                                >
                                  −
                                </button>
                                <span className="w-7 text-center font-bold text-sm text-black">{count}</span>
                                <button
                                  onClick={() => addExistingCombo(config)}
                                  className="w-7 h-7 flex items-center justify-center bg-black text-white rounded-full hover:bg-[#a6dff6] hover:text-black transition-colors text-sm font-bold"
                                >
                                  +
                                </button>
                              </div>
                              <button
                                onClick={() => setEditingComboKey(null)}
                                className="text-[10px] font-bold text-gray-400 hover:text-black transition-colors uppercase tracking-wider"
                              >
                                Done
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setEditingComboKey(k)}
                              className="shrink-0 text-[10px] font-bold text-black bg-gray-100 hover:bg-black hover:text-white px-3 py-1.5 rounded-full transition-colors uppercase tracking-wider"
                            >
                              Edit qty
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          ) : (
            /* ── REGULAR: highlights + qty ── */
            <>
              {item.tags && item.tags.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-6 p-4 bg-white rounded-2xl border border-gray-100">
                  {item.tags.slice(0, 3).map((tag, i) => (
                    <div key={i} className={`flex flex-col items-center gap-1.5 text-center ${i < 2 ? "border-r border-gray-100" : ""}`}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-[#3a9dc0]">
                        {getTagIcon(tag)}
                      </svg>
                      <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 leading-tight">{tag}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-black text-black uppercase tracking-wider">Qty</span>
                <div className="flex items-center gap-3 bg-gray-50 rounded-full px-1.5 py-1.5 border border-gray-100">
                  <motion.button
                    onClick={() => setLocalQty(q => Math.max(1, q - 1))}
                    disabled={localQty === 1}
                    whileTap={{ scale: 0.82 }}
                    className="w-8 h-8 rounded-full bg-black text-white text-lg flex items-center justify-center font-bold transition-colors hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    −
                  </motion.button>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={localQty}
                      initial={{ scale: 1.45, opacity: 0.4 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.14, ease: "easeOut" }}
                      className="w-6 text-center font-black text-lg text-black tabular-nums"
                    >
                      {localQty}
                    </motion.span>
                  </AnimatePresence>
                  <motion.button
                    onClick={() => setLocalQty(q => q + 1)}
                    whileTap={{ scale: 0.82 }}
                    className="w-8 h-8 rounded-full bg-[#a6dff6] text-black text-lg flex items-center justify-center font-bold transition-colors hover:bg-[#8dd3ef]"
                  >
                    +
                  </motion.button>
                </div>
              </div>
            </>
          )}

          {/* CTA */}
          <motion.button
            onClick={handleAddToCart}
            disabled={!canAdd}
            whileHover={canAdd ? { scale: 1.015 } : {}}
            whileTap={canAdd ? { scale: 0.97 } : {}}
            className={`relative w-full py-4 rounded-full font-black text-sm uppercase tracking-[0.2em] overflow-hidden transition-all duration-300 cta-btn ${
              !canAdd
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-[#a6dff6] text-black hover:bg-black hover:text-white"
            }`}
          >
            {isAssortedBundle && totalSelected < BOX_SIZE
              ? `Choose ${BOX_SIZE - totalSelected} more cookie${BOX_SIZE - totalSelected !== 1 ? "s" : ""}`
              : isAssortedBundle && boxQty > 1
                ? `Add ${boxQty} boxes to Cart`
                : "Add to Cart"}
          </motion.button>

          <div className="mt-7 pt-6 border-t border-gray-100 flex items-center justify-between">
            <Link href="/order" className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-300 hover:text-black transition-colors">
              ← Back to Menu
            </Link>
            <span className="text-[10px] text-gray-200 font-medium">Crumella Cookies</span>
          </div>

          {relatedItems.length > 0 && (
            <div className="mt-10">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-400 mb-4">
                You May Also Like
              </p>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1" style={{ scrollbarWidth: "none" }}>
                {relatedItems.map((related, i) => (
                  <motion.div
                    key={related.id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: i * 0.06 }}
                    className="shrink-0 w-36"
                  >
                    <Link href={`/order/${toSlug(related.name)}`} className="block bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
                      <div className="relative h-28 w-full overflow-hidden">
                        <Image src={related.src} alt={related.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                        {related.badge && (
                          <span className="absolute top-2 left-2 bg-yellow-400 text-black text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                            {related.badge}
                          </span>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="font-bold text-[11px] text-black leading-tight mb-0.5 line-clamp-2">{related.name}</h3>
                        <p className="text-[11px] text-gray-500 font-semibold">₱{related.price?.toFixed(2)}</p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

        </motion.div>
      </div>

      <CartSidePanel
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        updateQuantity={updateQuantity}
        totalItems={totalItems}
        itemsTotal={itemsTotal}
        onProceedToCheckout={() => router.push("/checkout")}
      />
    </div>
  );
}
