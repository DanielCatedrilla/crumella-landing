"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Highlight() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentCreatorIndex, setCurrentCreatorIndex] = useState(0);
  const images = [
    "/HS/HS13.JPG",
    "/HS/HS14.JPG",
    "/HS/HS15.JPG"
  ];
  
  const creatorImages = [
    "/FC/A1.jpg", // ENTER YOUR PHOTO SRC HERE
    "/FC/A2.jpg",  // ENTER YOUR PHOTO SRC HERE
    "/FC/FCC.png",
    "/FC/A5.jpg"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCreatorIndex((prev) => (prev + 1) % creatorImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.preventDefault();
    const element = document.getElementById("menu");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="whats-new" className="w-full py-12 px-6 relative z-10 scroll-mt-24">
      <div className="max-w-7xl mx-auto mb-12 text-center">
        <h2 className="text-5xl md:text-6xl font-black text-black tracking-tight mb-4">
          What's New in <span className="text-[#a6dff6]">Crumella</span>
        </h2>
        <div className="w-24 h-2 bg-black mx-auto rounded-full"></div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Rewards Card */}
        <div className="relative h-80 md:h-96 w-full overflow-hidden rounded-3xl bg-gradient-to-br from-[#a6dff6] via-[#ccecf9] to-[#9adcf7] p-8 shadow-md md:col-span-2 cursor-pointer group transition-all duration-500 hover:shadow-xl hover:-translate-y-1">
          {/* Background blobs */}
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/40 blur-3xl mix-blend-overlay pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-white/30 blur-3xl mix-blend-overlay pointer-events-none" />

          <div className="relative z-10 flex h-full flex-col md:flex-row items-center justify-between gap-8">

            {/* Text side */}
            <div className="flex flex-col justify-center md:max-w-sm">
              <span className="inline-flex items-center gap-1.5 mb-3 text-xs font-bold uppercase tracking-[0.2em] text-white bg-black/20 px-3 py-1 rounded-full self-start">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                Crumella Rewards
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-black tracking-tight">
                Earn Points,<br />Get Rewarded.
              </h2>
              <p className="mt-3 text-base font-medium text-black/60">
                Every ₱20 spent earns 1 point. Redeem for free cookies and exclusive perks.
              </p>
              <Link href="/points" className="mt-6 self-start rounded-full bg-black px-6 py-2.5 text-sm font-bold text-white transition-colors duration-300 group-hover:bg-gray-800">
                Get Your Card &rarr;
              </Link>
            </div>

            {/* Card visual */}
            <div className="hidden md:block shrink-0 w-72 aspect-[1.586/1] rounded-2xl bg-gradient-to-br from-[#7acfee] via-[#a6dff6] to-[#c8eaf8] shadow-[0_20px_40px_-10px_rgba(100,180,220,0.5)] border border-white/60 ring-1 ring-black/5 relative overflow-hidden transition-transform duration-500 group-hover:scale-[1.03] select-none">
              <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/40 rounded-full blur-2xl mix-blend-overlay" />
              <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-white/30 rounded-full blur-2xl mix-blend-overlay" />
              <div className="relative z-10 p-6 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-black text-2xl tracking-tighter italic text-black">Crumella<span className="text-white">.</span></h3>
                    <p className="text-[9px] font-bold text-black/60 uppercase tracking-[0.2em] mt-0.5">Exclusive Rewards</p>
                  </div>
                  <svg className="w-6 h-6 text-black/20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-mono text-base tracking-widest text-black/70 mb-2">000 000 000</p>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[8px] text-black/40 font-bold uppercase tracking-widest mb-0.5">Card Holder</p>
                      <p className="font-bold text-xs uppercase tracking-wide text-black">Your Name Here</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] text-black/40 font-bold uppercase tracking-widest mb-0.5">Points</p>
                      <p className="font-mono text-xs text-black font-bold">0 pts</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Featured Creators Card */}
        <div className="group relative h-80 w-full overflow-hidden rounded-3xl bg-[#a6dff6] p-8 shadow-md transition-all duration-500 hover:shadow-xl hover:-translate-y-1 cursor-pointer">
          {/* Background Slideshow */}
          {creatorImages.map((src, index) => (
            <div
              key={src}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === currentCreatorIndex ? "opacity-100" : "opacity-0"
              }`}
            >
              <Image src={src} alt="Featured Creator" fill className="object-cover" />
              <div className="absolute inset-0 bg-black/50"></div>
            </div>
          ))}
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <h2 className="text-3xl font-black text-white transition-transform duration-300 group-hover:scale-105 origin-left">
                Featured Creators
              </h2>
              <p className="mt-2 text-lg font-medium text-gray-200">
                Collaborations with your favorites.
              </p>
            </div>
            <Link href="/creators" className="self-start rounded-full bg-white px-6 py-2 text-sm font-bold text-black transition-colors duration-300 group-hover:bg-gray-200">
              View Profiles &rarr;
            </Link>
          </div>
          {/* Decorative Blur */}
          <div className="absolute -bottom-12 -right-12 h-48 w-48 rounded-full bg-white opacity-30 blur-2xl transition-transform duration-700 group-hover:scale-150" />
        </div>

        {/* New Cookie Flavors Card */}
        <div className="group relative h-80 w-full overflow-hidden rounded-3xl bg-black p-8 shadow-md transition-all duration-500 hover:shadow-xl hover:-translate-y-1 cursor-pointer">
          {/* Background Slideshow */}
          {images.map((src, index) => (
            <div
              key={src}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === currentImageIndex ? "opacity-100" : "opacity-0"
              }`}
            >
              <Image src={src} alt="New Flavor" fill className="object-cover" />
              <div className="absolute inset-0 bg-black/60"></div>
            </div>
          ))}
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <h2 className="text-3xl font-black text-[#a6dff6] transition-transform duration-300 group-hover:scale-105 origin-left">
                New Cookie Flavor!
              </h2>
              <p className="mt-2 text-lg font-medium text-gray-300">
                Freshly baked, limited edition drops.
              </p>
            </div>
            <a href="#menu" onClick={handleScroll} className="self-start rounded-full bg-[#a6dff6] px-6 py-2 text-sm font-bold text-black transition-colors duration-300 group-hover:bg-white">
              Learn More &rarr;
            </a>
          </div>
          {/* Decorative Blur */}
          <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-[#a6dff6] opacity-20 blur-2xl transition-transform duration-700 group-hover:scale-150" />
        </div>

      </div>
    </section>
  );
}