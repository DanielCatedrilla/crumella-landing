"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Highlight() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentCreatorIndex, setCurrentCreatorIndex] = useState(0);
  const images = [
    "/HS/HS4.png", // ENTER YOUR PHOTO SRC HERE
    "/HS/HS3.png" // ENTER YOUR PHOTO SRC HERE
  ];
  
  const creatorImages = [
    "/FC/A1.jpg", // ENTER YOUR PHOTO SRC HERE
    "/FC/A2.jpg",  // ENTER YOUR PHOTO SRC HERE
    "/FC/FCC.png"
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
    <section className="w-full py-12 px-6">
      <div className="max-w-7xl mx-auto mb-12 text-center">
        <h2 className="text-5xl md:text-6xl font-black text-black tracking-tight mb-4">
          What's New in <span className="text-[#a6dff6]">Crumella</span>
        </h2>
        <div className="w-24 h-2 bg-black mx-auto rounded-full"></div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        
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
                New Cookie Flavors!
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