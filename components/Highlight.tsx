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
        
        {/* Under Maintenance Card */}
        <div className="relative h-80 md:h-96 w-full overflow-hidden rounded-3xl bg-black p-8 shadow-md md:col-span-2 cursor-default select-none">
          {/* Animated diagonal stripe background */}
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "repeating-linear-gradient(45deg, #a6dff6 0px, #a6dff6 2px, transparent 2px, transparent 28px)" }} />
          {/* Glowing orbs */}
          <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-[#a6dff6] opacity-10 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-[#a6dff6] opacity-10 blur-3xl" />

          <div className="relative z-10 flex h-full flex-col justify-between">
            <div className="flex items-start gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 mb-3 text-xs font-bold uppercase tracking-[0.2em] text-black bg-[#a6dff6] px-3 py-1 rounded-full">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-black animate-pulse" />
                  Under Maintenance
                </span>
                <h2 className="text-3xl font-black text-white">
                  Something Sweet is Coming
                </h2>
                <p className="mt-2 text-base font-medium text-white/50">
                  We&apos;re putting the finishing touches on this. Check back soon.
                </p>
              </div>
              {/* Big wrench icon */}
              <svg className="shrink-0 ml-auto w-16 h-16 text-[#a6dff6] opacity-30 hidden md:block" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l5.654-4.654m5.65-5.65 3.314 3.314m-6.064-1.336a3.25 3.25 0 0 1 4.5 4.5" />
              </svg>
            </div>
            <span className="self-start rounded-full border border-white/20 px-6 py-2 text-sm font-bold text-white/40 cursor-not-allowed">
              Coming Soon
            </span>
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