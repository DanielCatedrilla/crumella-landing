"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 w-full z-50 transition-all duration-300">
      {/* Backdrop Blur Overlay */}
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-md transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
        style={{ zIndex: -1 }}
        aria-hidden="true"
      />

      <div className="bg-[#a6dff6] shadow-lg relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between relative">
        
        {/* Hamburger Menu Button (Left) */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="z-50 p-2 -ml-2 text-black hover:bg-white/20 rounded-lg transition-colors focus:outline-none"
          aria-label="Toggle Menu"
        >
          <div className="w-6 h-5 flex flex-col justify-between relative">
            <span className={`w-full h-0.5 bg-black rounded-full transition-all duration-300 ease-in-out ${isOpen ? 'rotate-45 translate-y-2.5' : ''}`} />
            <span className={`w-full h-0.5 bg-black rounded-full transition-all duration-300 ease-in-out ${isOpen ? 'opacity-0' : ''}`} />
            <span className={`w-full h-0.5 bg-black rounded-full transition-all duration-300 ease-in-out ${isOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </div>
        </button>

        {/* Logo (Center) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hover:scale-105 transition-transform duration-300">
          <Link href="/" onClick={() => setIsOpen(false)}>
            <Image
                src={"/crumelladark.png"}
                alt="thechewyco logo"
                width={150}
                height={150}
                priority
                className="w-28 md:w-36 h-auto object-contain"
                />
          </Link>
        </div>

        {/* Order Button (Right) */}
        <Link href="/order" className="bg-black text-white px-5 py-2 md:px-8 md:py-3 rounded-full font-bold text-sm md:text-lg shadow-md hover:bg-gray-900 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer z-50">
          Order Now
        </Link>

      </div>
      </div>

      {/* Collapsible Menu Overlay */}
      <div className={`absolute top-full left-0 w-full bg-[#a6dff6] shadow-xl border-t border-white/20 overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="flex flex-col items-center gap-6 py-8 pb-10">
          <Link href="/" onClick={() => setIsOpen(false)} className="text-xl font-black uppercase tracking-widest hover:text-white transition-colors">
            Home
          </Link>
          <Link href="/#menu" onClick={() => setIsOpen(false)} className="text-xl font-black uppercase tracking-widest hover:text-white transition-colors">
            Menu
          </Link>
          <Link href="/creators" onClick={() => setIsOpen(false)} className="text-xl font-black uppercase tracking-widest hover:text-white transition-colors">
            Creators
          </Link>
          <Link href="/contact" onClick={() => setIsOpen(false)} className="text-xl font-black uppercase tracking-widest hover:text-white transition-colors">
            Contact
          </Link>
        </div>
      </div>
    </nav>
  );
}
