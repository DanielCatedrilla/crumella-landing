"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";

export default function CTA() {
  return (
    <section className="py-24 bg-[#fffdf7] relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-40 right-0 w-96 h-96 bg-[#a6dff6] rounded-full mix-blend-multiply filter blur-[128px] opacity-30 translate-x-1/4"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 -translate-x-1/3 translate-y-1/3"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
            
            <div className="text-left order-2 lg:order-1">
                <span className="text-[#a6dff6] font-black tracking-widest uppercase mb-4 block">For Business & Events</span>
                <h2 className="text-4xl md:text-6xl font-black text-black tracking-tight mb-6 leading-tight">
                    Partner with <br/>
                    <span className="text-[#a6dff6]">Crumella</span>
                </h2>
                <p className="text-gray-600 text-lg md:text-xl mb-8 font-medium leading-relaxed max-w-xl">
                    Looking to supply your cafe with premium cookies? Planning a corporate event or a brand collaboration? We'd love to bake something special for you.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <Link href="/contact" className="bg-black text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:bg-[#a6dff6] hover:text-black hover:scale-105 transition-all duration-300 text-center">
                        Let's Collaborate
                    </Link>
                    <Link href="/contact" className="px-8 py-4 rounded-full font-bold text-lg text-black border-2 border-black hover:bg-black hover:text-white transition-all duration-300 text-center">
                        Bulk Orders
                    </Link>
                </div>
            </div>

            <div className="relative h-80 md:h-[500px] w-full rounded-[2.5rem] overflow-hidden shadow-2xl group order-1 lg:order-2">
                <Image 
                    src="/HS/HS4.png" 
                    alt="Crumella B2B"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <div className="absolute bottom-8 left-8 right-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse border border-white"></div>
                        <span className="text-white text-sm font-bold uppercase tracking-wider drop-shadow-md">Now Accepting Partners</span>
                    </div>
                </div>
            </div>

        </div>
      </div>
    </section>
  );
}