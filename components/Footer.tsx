import React from "react";
import Link from "next/link";
import Image from "next/image";
import { SiFacebook, SiInstagram, SiTiktok } from 'react-icons/si';

export default function Footer(){
    return(
        <footer className="w-full bg-[#a6dff6] text-black border-t border-white/50">
            <div className="max-w-7xl mx-auto px-6 py-16">
                <div className="flex flex-col md:flex-row justify-between items-center gap-10 md:gap-0">
                    
                    {/* Brand / Left */}
                    <div className="text-center md:text-left">
                        <div className="relative w-40 h-12 mb-4 mx-auto md:mx-0">
                            <Image 
                                src="/crumelladark.png" // Replace with your logo path
                                alt="Crumella Logo" 
                                fill
                                className="object-contain object-center md:object-left"
                            />
                        </div>
                        <p className="text-gray-800 text-sm font-medium">Made to Remember</p>
                    </div>

                    {/* Navigation / Center */}
                    <div className="flex flex-wrap justify-center gap-8 md:gap-12">
                        <Link href="/" className="text-sm font-bold uppercase tracking-widest hover:text-white transition-colors duration-300">
                            Home
                        </Link>
                        <Link href="/#menu" className="text-sm font-bold uppercase tracking-widest hover:text-white transition-colors duration-300">
                            Menu
                        </Link>
                        <Link href="/creators" className="text-sm font-bold uppercase tracking-widest hover:text-white transition-colors duration-300">
                            Creators
                        </Link>
                        <Link href="/track-order" className="text-sm font-bold uppercase tracking-widest hover:text-white transition-colors duration-300">
                            Track Order
                        </Link>
                        <Link href="/contact" className="text-sm font-bold uppercase tracking-widest hover:text-white transition-colors duration-300">
                            Contact
                        </Link>
                    </div>

                    {/* Socials / Right */}
                    <div className="flex gap-6">
                        <a href="https://www.facebook.com/eatcrumella" target="_blank" rel="noopener noreferrer" className="bg-black p-3 rounded-full text-white hover:bg-white hover:text-black transition-all duration-300 hover:scale-110">
                            <SiFacebook size={20} />
                        </a>
                        
                        <a href="https://www.instagram.com/eatcrumella/" target="_blank" rel="noopener noreferrer" className="bg-black p-3 rounded-full text-white hover:bg-white hover:text-black transition-all duration-300 hover:scale-110">
                            <SiInstagram size={20} />
                        </a>

                        <a href="https://www.tiktok.com/@eatcrumella" target="_blank" rel="noopener noreferrer" className="bg-black p-3 rounded-full text-white hover:bg-white hover:text-black transition-all duration-300 hover:scale-110">
                            <SiTiktok size={20} />
                        </a>
                    </div>
                </div>

                {/* Copyright */}
                <div className="mt-16 pt-8 border-t border-black/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-800 font-bold tracking-wider uppercase">
                    <p>© {new Date().getFullYear()} Crumella All rights reserved.</p>
                    <div className="flex gap-6">
                        <span className="cursor-pointer hover:text-white transition-colors">Privacy Policy</span>
                        <span className="cursor-pointer hover:text-white transition-colors">Terms of Service</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}