"use client";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useRef, useState, useEffect } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  useSpring,
} from "framer-motion";

// ─── brand ease (expo out) ────────────────────────────────────────────────────
const E = [0.22, 1, 0.36, 1] as const;


// ─── data ────────────────────────────────────────────────────────────────────
const steps = [
  { number: "01", title: "Get Your Card",    description: "Pick up a physical Crumella Rewards card with your next order or at any pickup event." },
  { number: "02", title: "Activate Online",  description: "Register your card at crumella.com/points with your Unique Card ID and personal details." },
  { number: "03", title: "Earn Points",      description: "Every purchase earns you points. The more you order, the more you earn." },
  { number: "04", title: "Redeem Rewards",   description: "Use your points to claim free cookies, bundles, merch, and more — straight from the rewards portal." },
];

const benefits = [
  { icon: "🍪", title: "Free Cookies",      description: "Redeem points for free Classic or Specialty cookies.",          detail: "Available from 75 pts. Choose any classic or specialty flavor.",  featured: true },
  { icon: "🎁", title: "Free Bundles",      description: "Unlock full assorted bundles with enough points.",              detail: "250 pts unlocks a Classic Assorted Bundle. Delivery fee applies.", featured: false },
  { icon: "👕", title: "Exclusive Merch",   description: "Get your hands on limited Crumella merch.",                    detail: "400 pts redeemable for limited-run Crumella merchandise.",         featured: false },
  { icon: "⚡", title: "Early Access",      description: "Be the first to know about new flavors and limited drops.",    detail: "24-hour early access to new releases before the public.",        featured: false },
  { icon: "✨", title: "Member-Only Perks", description: "Access deals and promotions exclusive to Rewards members.",    detail: "Flash offers, exclusive codes, and member appreciation deals.",   featured: false },
];


const redeemSteps = [
  { step: "1", text: "Log in at crumella.com/points using your Unique Card ID and last name." },
  { step: "2", text: "Check your point balance and browse available rewards." },
  { step: "3", text: "Select a reward and hit Redeem — it's added to your cart automatically." },
  { step: "4", text: "Complete checkout and your reward is applied. Points are deducted upon confirmation." },
];

// ─── helpers ─────────────────────────────────────────────────────────────────
function Divider() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} className="flex items-center gap-4 px-6 my-2 relative z-10">
      <motion.div
        initial={{ scaleX: 0 }} animate={inView ? { scaleX: 1 } : {}}
        transition={{ duration: 1.1, ease: E }}
        style={{ originX: 0 }}
        className="flex-1 h-px bg-gradient-to-r from-[#a6dff6]/50 via-gray-200 to-transparent"
      />
      <motion.div
        initial={{ scale: 0, opacity: 0 }} animate={inView ? { scale: 1, opacity: 1 } : {}}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="w-1.5 h-1.5 rounded-full bg-[#a6dff6] shrink-0"
      />
      <motion.div
        initial={{ scaleX: 0 }} animate={inView ? { scaleX: 1 } : {}}
        transition={{ duration: 1.1, ease: E, delay: 0.1 }}
        style={{ originX: 1 }}
        className="flex-1 h-px bg-gradient-to-l from-[#a6dff6]/50 via-gray-200 to-transparent"
      />
    </div>
  );
}

function BenefitCard({ b, i, className = "" }: { b: typeof benefits[0]; i: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const tilt = i % 2 === 0 ? 2.5 : -2.5;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, rotate: tilt, y: 35 }}
      animate={inView ? { opacity: 1, rotate: 0, y: 0 } : {}}
      transition={{ duration: 0.85, ease: E, delay: i * 0.07 }}
      className={`relative overflow-hidden rounded-[2rem] border border-white/60 shadow-lg cursor-default bg-white/70 backdrop-blur-xl ${b.featured ? "p-9" : "p-7"} ${className}`}
    >
      <div className="relative z-10">
        <span className={`block mb-4 ${b.featured ? "text-5xl" : "text-3xl"}`}>
          {b.icon}
        </span>
        <h3 className={`font-black text-black tracking-tight mb-2 ${b.featured ? "text-2xl" : "text-base"}`}>
          {b.title}
        </h3>
        <p className="text-sm text-gray-500 leading-relaxed">{b.description}</p>
        {b.featured && (
          <span className="inline-block mt-5 text-[10px] font-bold uppercase tracking-[0.25em] text-[#a6dff6] border border-[#a6dff6]/40 px-3 py-1.5 rounded-full">
            Most Popular
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ─── earn section ────────────────────────────────────────────────────────────
function EarnSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      className="relative z-10 w-full overflow-hidden"
      style={{ minHeight: "600px" }}
    >
      {/* Background — brand blue gradient, full bleed */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#a6dff6] via-[#c8ecf9] to-[#e8f7fd]" />

      {/* Layered depth rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        {[700, 520, 360].map((s) => (
          <div
            key={s}
            className="absolute rounded-full border border-white/20"
            style={{ width: s, height: s }}
          />
        ))}
        {/* Soft white glow center */}
        <div className="absolute w-[400px] h-[400px] rounded-full bg-white/20 blur-[80px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-16 md:py-28">

        {/* Label */}
        <motion.span
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: E }}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.4em] text-black/60 mb-6 md:mb-10"
        >
          <span className="w-6 h-px bg-black/30" />
          Earning Points
          <span className="w-6 h-px bg-black/30" />
        </motion.span>

        {/* Icon animation: bag → star */}
        <motion.div
          className="mb-6 md:mb-10 relative flex items-center justify-center"
          style={{ height: 80 }}
        >
          {/* Bag */}
          <motion.div
            initial={{ opacity: 1, scale: 1, y: 0 }}
            animate={inView ? { opacity: 0, scale: 0.5, y: -30 } : { opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.55, ease: E, delay: 0.7 }}
            className="absolute"
          >
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
          </motion.div>

          {/* Star — enters after bag exits */}
          <motion.div
            initial={{ opacity: 0, scale: 0.3, rotate: -30 }}
            animate={inView ? { opacity: 1, scale: 1, rotate: 0 } : { opacity: 0, scale: 0.3, rotate: -30 }}
            transition={{ duration: 0.65, ease: E, delay: 1.1 }}
            className="absolute"
          >
            <svg width="56" height="56" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </motion.div>

          {/* Ripple ring on star entry */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={inView ? { scale: 2.2, opacity: 0 } : {}}
            transition={{ duration: 0.9, ease: "easeOut", delay: 1.1 }}
            className="absolute w-14 h-14 rounded-full border-2 border-white/60"
          />
        </motion.div>

        {/* Main statement */}
        <div className="overflow-hidden mb-2 md:mb-4">
          <motion.h2
            initial={{ y: 70, opacity: 0 }}
            animate={inView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.85, ease: E, delay: 0.25 }}
            className="text-4xl md:text-7xl lg:text-8xl font-black text-black tracking-tight leading-[0.9]"
          >
            Every order.
          </motion.h2>
        </div>
        <div className="overflow-hidden mb-8 md:mb-10">
          <motion.h2
            initial={{ y: 70, opacity: 0 }}
            animate={inView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.85, ease: E, delay: 0.38 }}
            className="text-4xl md:text-7xl lg:text-8xl font-black text-black/50 tracking-tight leading-[0.9]"
          >
            Every point.
          </motion.h2>
        </div>

        {/* Conversion card */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.8, ease: E, delay: 0.6 }}
          className="bg-white/90 backdrop-blur-xl rounded-3xl px-8 py-6 md:px-10 md:py-8 shadow-2xl border border-white/60 flex flex-row items-center gap-8 md:gap-10"
        >
          {/* Spend */}
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/50 mb-1">You spend</p>
            <p className="text-4xl md:text-5xl font-black text-black tracking-tight">₱20</p>
          </div>

          {/* Arrow — points right on desktop, down on mobile */}
          <motion.div
            animate={{ x: [0, 6, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            className="text-[#a6dff6] shrink-0"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </motion.div>

          {/* Earn */}
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/50 mb-1">You earn</p>
            <p className="text-4xl md:text-5xl font-black text-[#a6dff6] tracking-tight">
              1 <span className="text-2xl md:text-3xl">pt</span>
            </p>
          </div>
        </motion.div>

        {/* Fine print */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, ease: E, delay: 0.9 }}
          className="mt-6 text-xs text-black/50 font-medium tracking-wide"
        >
          Points are automatically credited after each confirmed order.
        </motion.p>
      </div>
    </section>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────
export default function RewardsPage() {
  // Global scroll progress bar
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  // Hero parallax
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroSP } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroRingY = useTransform(heroSP, [0, 1], ["0%", "28%"]);
  const heroContentOpacity = useTransform(heroSP, [0, 0.7], [1, 0]);

  // Staircase SVG draw
  const stepsRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: stepsSP } = useScroll({ target: stepsRef, offset: ["start 0.85", "end 0.4"] });
  const pathLength = useSpring(stepsSP, { stiffness: 55, damping: 22 });

  // CTA background shift
  const ctaRef = useRef<HTMLDivElement>(null);
  const ctaInView = useInView(ctaRef, { once: false, margin: "-120px" });

  // Hero words
  const wordsA = ["Every", "Cookie"];

  return (
    <>
      {/* ── Scroll progress bar ── */}
      <motion.div
        style={{ scaleX, originX: 0 }}
        className="fixed top-0 left-0 right-0 h-[3px] bg-[#a6dff6] z-[200]"
        aria-hidden
      />

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.55, ease: E }}
        className="min-h-screen bg-[#fffdf7] overflow-x-hidden"
      >
        <Navbar />

        {/* Ambient fixed blobs */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <motion.div
            animate={{ y: [0, -22, 0], x: [0, 14, 0] }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-48 -left-48 w-[600px] h-[600px] rounded-full bg-[#a6dff6]/10 blur-[140px]"
          />
          <motion.div
            animate={{ y: [0, 18, 0], x: [0, -12, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 5 }}
            className="absolute -bottom-48 -right-48 w-[700px] h-[700px] rounded-full bg-pink-100/15 blur-[160px]"
          />
        </div>

        {/* ════════════════════════════════════════════════════
            HERO
        ════════════════════════════════════════════════════ */}
        <section
          ref={heroRef}
          className="relative z-10 w-full overflow-hidden"
        >
          {/* Desktop: full-screen photo */}
          <div className="hidden md:block relative h-screen">
            <Image
              src="/DS/DS23.png"
              alt="Crumella Rewards"
              fill
              className="object-cover"
              quality={90}
              priority
            />
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
              <button
                onClick={() => {
                  document.getElementById("rewards-content")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="group relative overflow-hidden bg-white/80 backdrop-blur-md border border-white/60 text-black font-black text-lg px-10 py-5 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_50px_rgba(166,223,246,0.8)] transition-all duration-500 hover:-translate-y-2 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span className="relative z-10 flex items-center gap-3">
                  Explore Rewards
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5 transition-transform duration-300 group-hover:translate-y-1">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-[#a6dff6]/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
              </button>
            </div>
          </div>

          {/* Mobile: text-only hero */}
          <div className="md:hidden flex flex-col justify-center px-6 pt-32 pb-16" style={{ background: "linear-gradient(160deg, #e8f7fd 0%, #fffdf7 60%)" }}>
            <motion.span
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: E }}
              className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#5bb8e8] mb-4 block"
            >
              Crumella Rewards
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, ease: E, delay: 0.1 }}
              className="text-5xl font-black text-black tracking-tight leading-[1.05] mb-4"
            >
              Cookies taste<br />better with<br />
              <span className="text-[#a6dff6]">rewards.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: E, delay: 0.2 }}
              className="text-sm text-gray-500 leading-relaxed mb-8 max-w-xs"
            >
              Earn points with every order. Redeem for free cookies, bundles, merch &amp; more.
            </motion.p>
            <motion.button
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: E, delay: 0.3 }}
              onClick={() => {
                document.getElementById("rewards-content")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="self-start rounded-full bg-black text-white font-bold px-7 py-3 text-sm"
            >
              Explore Rewards ↓
            </motion.button>
          </div>
        </section>

        <Divider />

        {/* ════════════════════════════════════════════════════
            WHAT IS IT — luxury dark, full bleed
        ════════════════════════════════════════════════════ */}
        <section id="rewards-content" className="relative z-10 w-full bg-[#a6dff6]/20 py-16 md:py-28 px-6 overflow-hidden">
          {/* Subtle glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[260px] bg-white/40 blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-[#a6dff6]/20 blur-[120px] pointer-events-none" />

          <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8 md:gap-16 items-center">
            {/* Left — enters from left */}
            <motion.div
              className="flex-1"
              initial={{ opacity: 0, x: -55 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.95, ease: E }}
            >
              <span className="text-xs font-bold uppercase tracking-[0.35em] text-[#5bb8e8] mb-4 block">What is it?</span>
              <h2 className="text-3xl md:text-5xl font-black text-black tracking-tight mb-4 md:mb-6 leading-tight">
                A loyalty program built for cookie lovers.
              </h2>
              <p className="text-gray-600 text-base md:text-lg leading-relaxed">
                Crumella Rewards is our way of saying thank you. Every time you order, you earn points. Stack them up and redeem them for free goodies — from a single cookie to a full bundle or exclusive merch. It's that simple.
              </p>
            </motion.div>

            {/* Right — card enters from right */}
            <motion.div
              initial={{ opacity: 0, x: 55 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.95, ease: E, delay: 0.15 }}
              whileHover={{ rotateY: 9, rotateX: -5, scale: 1.04 }}
              style={{ perspective: 1000 }}
              className="relative hidden md:flex w-full md:w-72 shrink-0 aspect-[1.586/1] rounded-3xl bg-gradient-to-br from-[#a6dff6] via-[#ccecf9] to-[#9adcf7] shadow-2xl flex-col justify-between p-7 border border-white/20 overflow-hidden cursor-pointer"
            >
              <div>
                <h3 className="font-black text-2xl tracking-tighter italic text-black">Crumella<span className="text-white">.</span></h3>
                <p className="text-[9px] font-bold text-black/60 uppercase tracking-[0.2em] mt-1">Exclusive Rewards</p>
              </div>
              <div className="flex justify-between items-end">
                <p className="font-mono text-base tracking-widest text-black/70">000 000 000</p>
                <div className="text-right">
                  <p className="text-[8px] text-black/50 font-bold uppercase tracking-widest mb-0.5">Expires</p>
                  <p className="font-mono text-xs text-black">03/28</p>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/25 to-white/0 pointer-events-none" />
            </motion.div>
          </div>
        </section>

        <Divider />

        {/* ════════════════════════════════════════════════════
            HOW IT WORKS — diagonal staircase
        ════════════════════════════════════════════════════ */}
        <section className="relative z-10 w-full px-6 py-14 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: E }}
            className="max-w-5xl mx-auto text-center mb-10 md:mb-16"
          >
            <span className="text-xs font-bold uppercase tracking-[0.35em] text-[#a6dff6] mb-3 block">How it works</span>
            <h2 className="text-3xl md:text-5xl font-black text-black tracking-tight">Four simple steps.</h2>
          </motion.div>

          <div ref={stepsRef} className="max-w-5xl mx-auto">
            {/* ── Mobile: vertical list ── */}
            <div className="md:hidden space-y-5">
              {steps.map((step, i) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.75, ease: E, delay: i * 0.1 }}
                  className="relative bg-white/70 backdrop-blur-xl rounded-2xl p-5 border border-white/60 shadow-lg overflow-hidden"
                >
                  <span className="text-sm font-black text-[#a6dff6] tracking-widest block mb-2">{step.number}</span>
                  <h3 className="text-lg font-black text-black mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
                </motion.div>
              ))}
            </div>

            {/* ── Desktop: diagonal staircase ── */}
            <div className="hidden md:block relative" style={{ height: 460 }}>
              {/* SVG connecting line */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none z-0"
                viewBox="0 0 1000 460"
                preserveAspectRatio="none"
              >
                {/* Static guide */}
                <path
                  d="M 110 105 C 210 140 295 158 370 178 C 470 205 540 228 625 252 C 718 278 790 298 882 322"
                  fill="none" stroke="#a6dff6" strokeWidth="1.5" opacity="0.12" strokeDasharray="6 6"
                />
                {/* Animated draw — pathLength 0→1 driven by scroll */}
                <motion.path
                  d="M 110 105 C 210 140 295 158 370 178 C 470 205 540 228 625 252 C 718 278 790 298 882 322"
                  fill="none" stroke="#a6dff6" strokeWidth="2.5" strokeLinecap="round"
                  style={{ pathLength }}
                  opacity={0.7}
                />
                {/* Dot at end of line */}
                <motion.circle cx="882" cy="322" r="4" fill="#a6dff6" style={{ opacity: pathLength }} />
              </svg>

              {steps.map((step, i) => (
                <motion.div
                  key={step.number}
                  className="absolute w-[220px] bg-white/70 backdrop-blur-xl rounded-[2rem] p-7 border border-white/60 shadow-lg overflow-hidden cursor-default"
                  style={{ left: i * 254, top: i * 72 }}
                  initial={{ opacity: 0, y: 35, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.8, ease: E, delay: i * 0.14 }}
                  whileHover={{ y: -7, boxShadow: "0 24px 55px rgba(166,223,246,0.28)" }}
                >
                  <div className="relative z-10">
                    <span className="text-sm font-black text-[#a6dff6] tracking-widest block mb-3">{step.number}</span>
                    <h3 className="text-lg font-black text-black mb-2 tracking-tight">{step.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <Divider />

        {/* ════════════════════════════════════════════════════
            BENEFITS — asymmetric masonry, tilt-correct, clip reveal
        ════════════════════════════════════════════════════ */}
        <section className="relative z-10 w-full px-6 py-14 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: E }}
            className="max-w-5xl mx-auto text-center mb-10 md:mb-16"
          >
            <span className="text-xs font-bold uppercase tracking-[0.35em] text-[#a6dff6] mb-3 block">Perks</span>
            <h2 className="text-3xl md:text-5xl font-black text-black tracking-tight">What you get.</h2>
          </motion.div>

          {/* Asymmetric grid:
              Col 1 (featured, row-span-2) | Col 2       | Col 3
              ─────────────────────────────┼─────────────┼──────
              [Free Cookies — tall]        │ Free Bundles│ Merch
                                           │ Early Access (col-span-2)
              ─────────────────────────────┴─────────────┴──────
              [Member Perks — col-span-3, full width]        */}
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-5">
            <BenefitCard b={benefits[0]} i={0} className="md:row-span-2" />
            <BenefitCard b={benefits[1]} i={1} />
            <BenefitCard b={benefits[2]} i={2} />
            <BenefitCard b={benefits[3]} i={3} className="md:col-span-2" />
            {/* Last card spans full width */}
            <motion.div
              className="md:col-span-3 relative overflow-hidden rounded-[2rem] border border-white/60 shadow-lg bg-white/70 backdrop-blur-xl p-7"
              initial={{ opacity: 0, rotate: -1.5, y: 30 }}
              whileInView={{ opacity: 1, rotate: 0, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.85, ease: E, delay: 0.35 }}
              whileHover={{ y: -5 }}
            >
              <div className="flex flex-col md:flex-row md:items-center gap-5">
                <span className="text-3xl shrink-0">✨</span>
                <div>
                  <h3 className="text-base font-black text-black mb-1">Member-Only Perks</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Access deals and promotions exclusive to Rewards members. Flash offers, exclusive codes, and member appreciation deals — reserved just for you.
                  </p>
                </div>
                <Link
                  href="/points"
                  className="shrink-0 self-start md:self-center rounded-full bg-black text-white font-bold px-6 py-2.5 text-sm hover:bg-[#a6dff6] hover:text-black transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  Join Now &rarr;
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        <Divider />

        {/* ════════════════════════════════════════════════════
            WAYS TO EARN — cinematic single truth
        ════════════════════════════════════════════════════ */}
        <EarnSection />

        <Divider />

        {/* ════════════════════════════════════════════════════
            HOW TO REDEEM
        ════════════════════════════════════════════════════ */}
        <section className="relative z-10 w-full px-6 py-14 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: E }}
            className="max-w-4xl mx-auto text-center mb-10 md:mb-16"
          >
            <span className="text-xs font-bold uppercase tracking-[0.35em] text-[#a6dff6] mb-3 block">Redemption</span>
            <h2 className="text-3xl md:text-5xl font-black text-black tracking-tight">How to redeem.</h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.85, ease: E }}
            className="max-w-4xl mx-auto bg-white/70 backdrop-blur-xl rounded-2xl md:rounded-[2.5rem] p-6 md:p-10 shadow-2xl border border-white/60 space-y-5 md:space-y-7"
          >
            {redeemSteps.map((r, i) => (
              <motion.div
                key={r.step}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.7, ease: E, delay: i * 0.1 }}
                className="flex items-start gap-6 group"
              >
                <motion.span
                  whileHover={{ scale: 1.15, backgroundColor: "#a6dff6", color: "#000" }}
                  transition={{ duration: 0.22 }}
                  className="shrink-0 w-10 h-10 rounded-full bg-black text-white font-black text-sm flex items-center justify-center shadow-md"
                >
                  {r.step}
                </motion.span>
                <p className="text-gray-600 text-base leading-relaxed pt-2 group-hover:text-black transition-colors duration-300">
                  {r.text}
                </p>
              </motion.div>
            ))}
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-xs text-gray-400 pt-4 border-t border-gray-100"
            >
              Minimum 75 points required to redeem. One reward per transaction. Terms and conditions apply.
            </motion.p>
          </motion.div>
        </section>

        <Divider />

        {/* ════════════════════════════════════════════════════
            CTA — shifts background, glow ring, floating element
        ════════════════════════════════════════════════════ */}
        <motion.div
          ref={ctaRef}
          animate={{ backgroundColor: ctaInView ? "rgba(166,223,246,0.07)" : "rgba(255,253,247,0)" }}
          transition={{ duration: 1.3, ease: E }}
          className="relative z-10 w-full px-6 py-16 md:py-28 overflow-hidden"
        >
          {/* Floating ambient ring */}
          <motion.div
            animate={{ y: [0, -18, 0], x: [0, 12, 0], rotate: [0, 360] }}
            transition={{ y: { duration: 7, repeat: Infinity, ease: "easeInOut" }, x: { duration: 9, repeat: Infinity, ease: "easeInOut" }, rotate: { duration: 30, repeat: Infinity, ease: "linear" } }}
            className="absolute top-12 right-[10%] w-36 h-36 rounded-full border-2 border-[#a6dff6]/20 pointer-events-none"
          />
          <motion.div
            animate={{ y: [0, 14, 0], x: [0, -10, 0], rotate: [0, -360] }}
            transition={{ y: { duration: 9, repeat: Infinity, ease: "easeInOut", delay: 2 }, x: { duration: 11, repeat: Infinity, ease: "easeInOut" }, rotate: { duration: 40, repeat: Infinity, ease: "linear" } }}
            className="absolute bottom-12 left-[8%] w-24 h-24 rounded-full border border-[#a6dff6]/15 pointer-events-none"
          />

          <div className="max-w-2xl mx-auto text-center relative">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, ease: E }}
              className="text-xs font-bold uppercase tracking-[0.35em] text-[#a6dff6] mb-4 block"
            >
              Ready?
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: E, delay: 0.08 }}
              className="text-3xl md:text-6xl font-black text-black tracking-tight mb-4 md:mb-5 leading-tight"
            >
              Ready to start earning?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.75, ease: E, delay: 0.16 }}
              className="text-gray-400 text-sm md:text-lg mb-8 md:mb-12 leading-relaxed"
            >
              Grab your Crumella Rewards card with your next order, then activate it online to start earning instantly.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: E, delay: 0.24 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              {/* Primary — glow ring pulse */}
              <div className="relative w-full sm:w-auto inline-flex items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.55, 1], opacity: [0.35, 0, 0.35] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
                  className="absolute inset-0 rounded-full bg-[#a6dff6]/40 pointer-events-none"
                />
                <Link
                  href="/points"
                  className="relative group w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-full bg-black text-white font-bold px-10 py-4 text-base shadow-xl overflow-hidden hover:shadow-[0_0_50px_rgba(166,223,246,0.55)] hover:scale-105 active:scale-95 transition-all duration-500"
                >
                  <span className="relative z-10">Check My Rewards</span>
                  <span className="relative z-10 group-hover:translate-x-1 transition-transform duration-300">&rarr;</span>
                  {/* Looping shimmer */}
                  <motion.span
                    className="absolute top-0 bottom-0 w-16 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent z-0"
                    animate={{ left: ["-20%", "130%"] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.4, ease: "easeInOut" }}
                  />
                  <span className="absolute inset-0 bg-gradient-to-r from-[#a6dff6] to-[#a6dff6]/80 translate-x-full group-hover:translate-x-0 transition-transform duration-500 rounded-full z-0" />
                </Link>
              </div>

              <Link
                href="/order"
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-white border-2 border-gray-200 text-black font-bold px-10 py-4 text-base transition-all duration-300 hover:border-black hover:shadow-lg hover:scale-105 active:scale-95"
              >
                Order Now
                <span className="group-hover:translate-x-1 transition-transform duration-300">&rarr;</span>
              </Link>
            </motion.div>
          </div>
        </motion.div>

        <div className="relative z-10">
          <Footer />
        </div>
      </motion.main>
    </>
  );
}
