"use client";
import React, { useState } from "react";
import { supabase } from "./supabase";

// Payment proofs live in a private bucket. Older orders stored a full public
// URL; newer orders store the file path. Either way, admins open a
// short-lived signed link (valid 5 minutes).
function proofPath(proofUrl: string): string | null {
  if (!proofUrl) return null;
  const marker = "/proofs/";
  if (/^https?:\/\//i.test(proofUrl)) {
    const i = proofUrl.indexOf(marker);
    if (i === -1) return null;
    return decodeURIComponent(proofUrl.slice(i + marker.length).split("?")[0]);
  }
  return proofUrl;
}

export default function ProofLink({
  proofUrl,
  className,
  children,
}: {
  proofUrl: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [busy, setBusy] = useState(false);

  const open = async (e: React.MouseEvent) => {
    e.preventDefault();
    const path = proofPath(proofUrl);
    if (!path || busy) return;
    // Open the tab right away (so pop-up blockers allow it), then point it at the signed link.
    const win = window.open("", "_blank");
    setBusy(true);
    const { data, error } = await supabase.storage.from("proofs").createSignedUrl(path, 300);
    setBusy(false);
    if (error || !data?.signedUrl) {
      win?.close();
      const msg = (error?.message || "").toLowerCase();
      if (msg.includes("not found")) {
        alert("This proof image can't be found in storage. It may have been deleted.");
      } else if (msg.includes("jwt") || msg.includes("unauthorized") || msg.includes("permission")) {
        alert("Your admin session has expired. Please log out, log in again, and retry.");
      } else {
        alert("Couldn't open this proof right now. Please try again.");
      }
      return;
    }
    if (win) win.location.href = data.signedUrl;
    else window.location.href = data.signedUrl;
  };

  return (
    <a href="#" onClick={open} className={className} aria-busy={busy}>
      {busy ? "Opening…" : children}
    </a>
  );
}
