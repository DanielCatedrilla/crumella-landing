"use client";
import React from "react";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "./supabase";

export type MenuItem = {
    id: number;
    name: string;
    description?: string;
    src: string;
    badge?: string;
    logoSrc?: string;
    category?: string;
    price?: number;
};

export const MENU_ITEMS: MenuItem[] = [
    {
        id: 1,
        name: "Biscoff® Cookie",
        description: "Made with Lotus Biscoff®, this cookie delivers a rich caramelized flavor with warm, spiced notes in every bite.",
        src: "/MENU2/BC.png",
        badge: "New Flavor",
        logoSrc: "/BiscoffLogo2.jpg",
        category: "Single Flavors",
    },
    {
        id: 2,
        name: "Matcha Cookie",
        description: "A refined balance of earthy matcha and subtle sweetness, baked into a soft, flavorful cookie that’s calm, elegant, and deeply satisfying.",
        src: "/MENU2/MC.png",
        badge: "New Flavor",
        category: "Single Flavors",
    },
    {
        id: 3,
        name: "Chocolate Chunk Cookie",
        description: "Classic and timeless, this cookie features generous chunks of premium chocolate baked into a soft, chewy base.",
        src: "/MENU2/CCH.png",
        badge: "All time favorite",
        category: "Single Flavors",
    },
    {
        id: 4,
        name: "Double Chocolate Cookie",
        description: "For those who love it rich, this cookie blends a chocolate base with melted chocolate pieces for a deep, indulgent bite that doesn’t hold back.",
        src: "/MENU2/DCH.png",
        category: "Single Flavors",
    },
    {
        id: 5,
        name: "S'mores Cookie",
        description: "Inspired by the classic treat, this cookie combines chocolate, a soft marshmallow center, and a golden base.",
        src: "/MENU2/SM.png",
        category: "Single Flavors",
    },
    {
        id: 6,
        name: "Red Velvet Cookie",
        description: "A soft red velvet cookie with a creamy cream cheese filling inside.",
        src: "/MENU2/RV.png",
        badge: "Best Seller",
        category: "Single Flavors",
    },
];

export const ORDER_ITEMS: MenuItem[] = [
    {
        id: 1,
        name: "Biscoff® Cookie",
        badge: "New flavor",
        src: "/CS/Biscoff.png",
        category: "Box of 4 - Single Flavor Bundles",
        price: 350.00,
    },
    {
        id: 2,
        name: "Matcha Cookie",
        badge: "New flavor",
        src: "/CS/Matcha.png",
        category: "Box of 4 - Single Flavor Bundles",
        price: 350.00,
    },
    {
        id: 3,
        name: "Chocolate Chunk Cookie",
        badge: "All time favorite",
        src: "/CS/CCH.png",
        category: "Box of 4 - Single Flavor Bundles",
        price: 300.00,
    },
    {
        id: 4,
        name: "Double Chocolate Cookie",
        src: "/CS/DCH.png",
        category: "Box of 4 - Single Flavor Bundles",
        price: 320.00,
    },
    {
        id: 5,
        name: "S'mores Cookie",
        src: "/CS/SM.png",
        category: "Box of 4 - Single Flavor Bundles",
        price: 320.00,
    },
    {
        id: 6,
        name: "Red Velvet Cookie",
        badge: "Best seller",
        src: "/CS/RV.png",
        category: "Box of 4 - Single Flavor Bundles",
        price: 380.00,
    },
    {
        id: 7,
        name: "Classic Assorted Bundle",
        badge: "Best seller",
        src: "/CS/CA.png",
        category: "Box of 4 - Assorted Bundles",
        price: 350.00,
    },
    {
        id: 8,
        name: "Premium Assorted Bundle",
        badge: "New bundle",
        src: "/CS/PA.png",
        category: "Box of 4 - Assorted Bundles",
        price: 380.00,
    },
];

export default function Menu(){
    const [cookieRatings, setCookieRatings] = useState<Record<string, { average: number; count: number }>>({});

    useEffect(() => {
        const fetchRatings = async () => {
            const { data } = await supabase.from('feedbacks').select('ratings');
            if (data) {
                const map: Record<string, { total: number; count: number }> = {};
                data.forEach((fb: any) => {
                    if (fb.ratings) {
                        Object.entries(fb.ratings).forEach(([name, scores]: [string, any]) => {
                            if (!map[name]) map[name] = { total: 0, count: 0 };
                            const taste = Number(scores.taste) || 0;
                            const texture = Number(scores.texture) || 0;
                            const smell = Number(scores.smell) || 0;
                            const aftertaste = Number(scores.aftertaste) || 0;
                            
                            const avg = (taste + texture + smell + aftertaste) / 4;
                            map[name].total += avg;
                            map[name].count += 1;
                        });
                    }
                });

                const finalMap: Record<string, { average: number; count: number }> = {};
                Object.keys(map).forEach(key => {
                    finalMap[key] = {
                        average: map[key].total / map[key].count,
                        count: map[key].count
                    };
                });
                setCookieRatings(finalMap);
            }
        };
        fetchRatings();
    }, []);

    return(
        <section id="menu" className="py-24 bg-[#fffdf7] relative overflow-hidden scroll-mt-40 md:scroll-mt-48">
            {/* Decorative background elements */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-[#a7dff4] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 translate-x-1/2 translate-y-1/2"></div>

            <div className="max-w-6xl mx-auto px-4 relative z-10">
                <div className="flex flex-col items-center justify-center mb-20 text-center">
                    <span className="text-gray-500 font-bold tracking-widest uppercase mb-3">Freshly Baked</span>
                    <h1 className="text-black text-6xl md:text-7xl font-extrabold tracking-tight mb-6">
                        Our Menu<span className="text-[#a7dff4]">.</span>
                    </h1>
                    <div className="w-24 h-2 bg-black rounded-full"></div>
                </div>

                <div className="flex flex-col gap-12">
                    {MENU_ITEMS.map((item, index) => (
                        <div 
                            key={item.id} 
                            id={`cookie-flavor-${item.id}`}
                            className={`group flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center bg-white rounded-[3rem] p-6 md:p-10 gap-6 md:gap-10 shadow-xl border border-gray-100 transition-all duration-500 hover:bg-[#a7dff4] hover:shadow-2xl hover:-translate-y-2 scroll-mt-28 relative`}
                        >
                            {item.logoSrc && (
                                <div className="absolute top-8 right-8 w-24 h-12 md:w-32 md:h-16 z-30 transform rotate-6 hover:rotate-0 transition-transform duration-300">
                                    <Image 
                                        src={item.logoSrc} 
                                        alt="Brand Logo" 
                                        fill 
                                        className="object-contain drop-shadow-md"
                                    />
                                </div>
                            )}
                            {/* Image Side */}
                            <div className="w-full md:w-1/2">
                                <div className="aspect-square w-full max-w-sm mx-auto flex items-center justify-center relative transition-transform duration-500 ease-out scale-110 group-hover:scale-125 group-hover:rotate-6">
                                    <Image 
                                        src={item.src} 
                                        alt={item.name}
                                        fill
                                        className="object-contain drop-shadow-2xl"
                                        sizes="(max-width: 768px) 100vw, 384px"
                                    />
                                </div>
                            </div>

                            {/* Content Side */}
                            <div className="w-full md:w-1/2 text-center md:text-left">
                                {item.badge && (
                                    <span className="inline-block bg-yellow-400 text-black text-xs font-bold px-4 py-2 rounded-full mb-4 uppercase tracking-wider shadow-lg transform transition-transform group-hover:scale-105">
                                        {item.badge}
                                    </span>
                                )}
                                <h3 className="text-5xl md:text-6xl font-black italic tracking-tighter mb-4 text-black">{item.name}</h3>
                                {cookieRatings[item.name] && (
                                    <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                                        <div className="flex text-yellow-400">
                                            {[1, 2, 3, 4, 5].map((star) => {
                                                const rating = cookieRatings[item.name].average;
                                                const fillPercentage = Math.max(0, Math.min(100, (rating - (star - 1)) * 100));
                                                
                                                return (
                                                    <div key={star} className="relative w-6 h-6">
                                                        {/* Background Star (Outline) */}
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-full h-full absolute top-0 left-0">
                                                            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                                                        </svg>
                                                        
                                                        {/* Foreground Star (Filled) - Clipped */}
                                                        <div style={{ width: `${fillPercentage}%` }} className="absolute top-0 left-0 h-full overflow-hidden">
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="w-6 h-6 max-w-none">
                                                                <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <span className="text-sm font-bold text-gray-500">({cookieRatings[item.name].average.toFixed(1)} • {cookieRatings[item.name].count} reviews)</span>
                                    </div>
                                )}
                                <p className="text-gray-800 text-lg mb-8 leading-relaxed group-hover:text-gray-900 font-medium transition-colors duration-300">
                                    {item.description}
                                </p>
                                <div className="flex flex-col md:flex-row items-center gap-6">
                                    <Link href="/order" className="bg-black text-white px-10 py-4 rounded-full font-bold text-lg shadow-lg hover:bg-white hover:text-black hover:scale-105 transition-all duration-300 cursor-pointer">
                                        Order Now
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}