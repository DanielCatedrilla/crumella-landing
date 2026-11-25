"use client";
// Live menu prices. The Business Hub sets prices in the database
// (public.menu_items); checkout charges those. The prices written in
// Menu.tsx are only the starting values shown until the database answers.
//
// loadLivePrices() copies the database prices into ORDER_ITEMS, so every
// page that reads ORDER_ITEMS shows them. useLivePrices() re-renders a page
// when they arrive.

import { useEffect, useState } from "react";
import { ORDER_ITEMS } from "./Menu";
import { supabase } from "./supabase";

let version = 0;
let loadedAt = 0;
let inFlight: Promise<void> | null = null;
const listeners = new Set<(v: number) => void>();

const FRESH_MS = 60_000;

export function applyPrices(rows: { id: number; price: number | string }[]): boolean {
  let changed = false;
  for (const r of rows) {
    const item = ORDER_ITEMS.find((i) => i.id === Number(r.id));
    const price = Number(r.price);
    if (item && Number.isFinite(price) && item.price !== price) {
      item.price = price;
      changed = true;
    }
  }
  return changed;
}

/** Fetch prices (at most once a minute unless forced). Never throws. */
export function loadLivePrices(force = false): Promise<void> {
  if (inFlight) return inFlight;
  if (!force && Date.now() - loadedAt < FRESH_MS) return Promise.resolve();
  inFlight = (async () => {
    try {
      const { data, error } = await supabase.from("menu_items").select("id, price");
      if (!error && Array.isArray(data)) {
        loadedAt = Date.now();
        if (applyPrices(data)) {
          version++;
          listeners.forEach((l) => l(version));
        }
      }
    } catch {
      // Offline: keep the prices we have. Checkout still checks on the server.
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

/** Re-render when live prices arrive. `fresh` = always ask the database (checkout). */
export function useLivePrices(fresh = false): number {
  const [v, setV] = useState(version);
  useEffect(() => {
    listeners.add(setV);
    setV(version);
    void loadLivePrices(fresh);
    return () => {
      listeners.delete(setV);
    };
  }, [fresh]);
  return v;
}
