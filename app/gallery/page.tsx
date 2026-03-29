"use client";
import Image from "next/image";
import Link from "next/link";
import { useRef, useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const photos = [
  "/GL/GL1.JPG",
  "/GL/GL2.JPG",
  "/GL/GL3.JPG",
  "/GL/GL4.JPG",
  "/GL/GL5.JPG",
  "/GL/GL6.JPG",
  "/GL/GL7.JPG",
  "/GL/GL8.JPG",
  "/GL/GL9.JPG",
];

const quotes = [
  "To the ones who stayed soft in a world that tried to harden them.",
  "You are the warmth in every room you walk into.",
  "Thank you for choosing joy, even on the hardest days.",
  "Your strength is quiet, your love is loud.",
  "Every sweet thing we make is made with you in mind.",
  "Here's to the dreamers, the makers, the givers.",
  "You deserve every softness life has to offer.",
  "Beautiful, resilient, and endlessly inspiring.",
  "This one's for you. Always.",
];

const floatingPetals = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: `${(i * 23 + 7) % 100}%`,
  delay: `${(i * 0.7) % 8}s`,
  duration: `${8 + (i % 5)}s`,
  size: i % 3 === 0 ? "text-2xl" : i % 3 === 1 ? "text-lg" : "text-sm",
  symbol: ["🌸", "✿", "♡", "❀", "·"][i % 5],
}));


function useScrollReveal() {
  useEffect(() => {
    const run = () => {
      const els = document.querySelectorAll(".reveal");
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              (e.target as HTMLElement).style.opacity = "1";
              (e.target as HTMLElement).style.transform = "translateY(0) translateX(0) scale(1)";
              obs.unobserve(e.target);
            }
          });
        },
        { threshold: 0.12 }
      );
      els.forEach((el) => obs.observe(el));
      return () => obs.disconnect();
    };
    return run();
  }, []);
}

function ParallaxImage({ src, alt }: { src: string; alt: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const wh = window.innerHeight;
      const progress = (wh - rect.top) / (wh + rect.height);
      setOffset((progress - 0.5) * 80);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-[380px] md:h-[480px] overflow-hidden rounded-3xl shadow-2xl">
      <div
        className="absolute w-full"
        style={{ transform: `translateY(${offset}px)`, height: "130%", top: "-15%" }}
      >
        <Image src={src} alt={alt} fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
      </div>
    </div>
  );
}

export default function GalleryPage() {
  useScrollReveal();


  // Build layout: photo, quote between them, then next photo
  // Pattern: photo[0] LEFT, quote[0], photo[1] RIGHT, quote[1], photo[2] LEFT, ...
  const layoutItems: Array<
    | { type: "photo"; src: string; side: "left" | "right"; index: number }
    | { type: "quote"; text: string; index: number }
  > = [];

  photos.forEach((src, i) => {
    layoutItems.push({ type: "photo", src, side: i % 2 === 0 ? "left" : "right", index: i });
    layoutItems.push({ type: "quote", text: quotes[i], index: i });
  });

  return (
    <main className="min-h-screen bg-[#fdf6f0] overflow-x-hidden cursor-default">

      {/* Floating petals */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {floatingPetals.map((p) => (
          <span
            key={p.id}
            className={`absolute ${p.size} text-[#ddb5fe]/40 select-none`}
            style={{ left: p.left, top: "-2rem", animation: `floatDown ${p.duration} ${p.delay} linear infinite` }}
          >
            {p.symbol}
          </span>
        ))}
      </div>

      <style>{`
        @keyframes floatDown {
          0%   { transform: translateY(-40px) rotate(0deg); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 0.5; }
          100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          14% { transform: scale(1.2); }
          28% { transform: scale(1); }
          42% { transform: scale(1.1); }
          70% { transform: scale(1); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(40px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .shimmer-text {
          background: linear-gradient(90deg, #ddb5fe, #f9a8d4, #ddb5fe, #a78bfa);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear infinite;
        }
        .reveal {
          opacity: 0;
          transform: translateY(40px) scale(0.97);
          transition: opacity 0.85s ease, transform 0.85s ease;
        }
        .reveal-left {
          opacity: 0;
          transform: translateX(-60px) scale(0.97);
          transition: opacity 0.9s ease, transform 0.9s ease;
        }
        .reveal-right {
          opacity: 0;
          transform: translateX(60px) scale(0.97);
          transition: opacity 0.9s ease, transform 0.9s ease;
        }
      `}</style>

      <Navbar />

      {/* ── HERO ── */}
      <section className="relative w-full pt-36 pb-20 px-6 text-center overflow-hidden z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[#ddb5fe]/15 blur-[80px] pointer-events-none" />
        <div className="absolute top-20 left-10 w-48 h-48 rounded-full bg-pink-200/30 blur-3xl pointer-events-none" />
        <div className="absolute top-10 right-10 w-64 h-64 rounded-full bg-purple-200/20 blur-3xl pointer-events-none" />

        <div className="flex items-center justify-center gap-3 mb-6" style={{ animation: "fadeUp 0.8s ease forwards" }}>
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#ddb5fe]" />
          <span className="text-xs uppercase tracking-[0.4em] text-[#9333ea] font-semibold">A Love Letter</span>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#ddb5fe]" />
        </div>

        <h1 className="text-7xl md:text-9xl font-black text-black tracking-tight leading-none mb-4" style={{ animation: "fadeUp 0.9s 0.1s ease both" }}>
          For Every
        </h1>
        <h1 className="text-7xl md:text-9xl font-serif italic leading-none mb-8 shimmer-text" style={{ animation: "fadeUp 1s 0.2s ease both" }}>
          Woman
        </h1>
        <p className="text-lg md:text-xl text-gray-500 max-w-lg mx-auto leading-relaxed" style={{ animation: "fadeUp 1s 0.4s ease both" }}>
          To the ones who inspire us, who show up, who create beauty —{" "}
          <span className="text-black font-semibold">this is for you.</span>
        </p>
        <div className="mt-10 flex justify-center text-3xl text-[#ddb5fe]" style={{ animation: "heartbeat 2s 1s ease-in-out infinite" }}>
          ♡
        </div>
      </section>

      {/* ── GALLERY ── */}
      <section className="relative w-full px-6 pb-32 z-10">
        <div className="max-w-4xl mx-auto">
          {layoutItems.map((item, i) => {
            if (item.type === "photo") {
              const isLeft = item.side === "left";
              return (
                <div
                  key={`photo-${item.index}`}
                  className={`reveal ${isLeft ? "reveal-left" : "reveal-right"} mb-10 group`}
                  style={{
                    width: "65%",
                    marginLeft: isLeft ? "0" : "auto",
                    marginRight: isLeft ? "auto" : "0",
                    transitionDelay: "0.05s",
                  }}
                >
                  {/* Big number watermark */}
                  <div
                    className="absolute pointer-events-none select-none font-black text-[6rem] leading-none text-[#ddb5fe]/10 z-0"
                    style={{ [isLeft ? "left" : "right"]: "-1.5rem", marginTop: "-1rem" }}
                  >
                    {String(item.index + 1).padStart(2, "0")}
                  </div>
                  <div className="relative z-10 rounded-3xl overflow-hidden transition-transform duration-700 group-hover:scale-[1.02] shadow-2xl" style={{ boxShadow: "0 0 0 0 #ddb5fe44", animation: "pulseGlow 4s ease-in-out infinite" }}>
                    <ParallaxImage src={item.src} alt={`Celebrating Women ${item.index + 1}`} />
                  </div>
                </div>
              );
            }

            // Quote — centered between photos
            return (
              <div
                key={`quote-${item.index}`}
                className="reveal my-12 flex flex-col items-center text-center px-6"
                style={{ transitionDelay: "0.1s" }}
              >
                {/* Wavy line before */}
                <svg width="120" height="16" viewBox="0 0 120 16" fill="none" className="mb-4 opacity-50">
                  <path d="M0 8 Q15 0 30 8 Q45 16 60 8 Q75 0 90 8 Q105 16 120 8" stroke="#ddb5fe" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                </svg>

                <div className="bg-white/70 backdrop-blur-sm rounded-2xl px-8 py-6 shadow-lg border border-[#ddb5fe]/30 max-w-md">
                  <span className="text-4xl text-[#ddb5fe] font-serif leading-none block -mb-1">&ldquo;</span>
                  <p className="text-lg md:text-xl font-serif italic text-gray-700 leading-snug">
                    {item.text}
                  </p>
                  <div className="mt-3 flex justify-center gap-1.5">
                    {[1, 0.6, 0.3].map((op, j) => (
                      <div key={j} className="w-1.5 h-1.5 rounded-full bg-[#ddb5fe]" style={{ opacity: op }} />
                    ))}
                  </div>
                </div>

                {/* Wavy line after */}
                <svg width="120" height="16" viewBox="0 0 120 16" fill="none" className="mt-4 opacity-50">
                  <path d="M0 8 Q15 0 30 8 Q45 16 60 8 Q75 0 90 8 Q105 16 120 8" stroke="#ddb5fe" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                </svg>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── CLOSING ── */}
      <section className="relative w-full px-6 pb-32 text-center z-10 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[500px] h-[500px] rounded-full bg-[#ddb5fe]/10 blur-[100px]" />
        </div>
        <div className="reveal max-w-xl mx-auto relative">
          <div className="text-[7rem] font-serif text-[#ddb5fe]/20 leading-none select-none -mb-8">&ldquo;</div>
          <p className="text-3xl md:text-4xl font-serif italic text-gray-800 leading-relaxed mb-3">
            With love, from Crumella.
          </p>
          <p className="text-gray-400 text-sm mb-10">Every cookie we bake carries a little piece of this.</p>
          <div className="flex justify-center gap-3 text-[#ddb5fe] text-lg mb-10 select-none">
            {["♡", "✿", "♡", "✿", "♡"].map((s, i) => (
              <span key={i} style={{ animation: `heartbeat 2s ${i * 0.3}s ease-in-out infinite`, display: "inline-block" }}>
                {s}
              </span>
            ))}
          </div>
          <Link
            href="/"
            className="inline-block rounded-full bg-[#ddb5fe] px-10 py-3 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:bg-[#c084fc] hover:shadow-[0_0_30px_#ddb5fe88] hover:-translate-y-1"
          >
            &larr; Back to Home
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
