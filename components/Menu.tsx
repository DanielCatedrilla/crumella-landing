import React from "react";
import Image from "next/image";

type MenuItem = {
    id: number;
    name: string;
    description: string;
    src: string;
    badge?: string;
    logoSrc?: string;
};

const MENU_ITEMS: MenuItem[] = [
    {
        id: 1,
        name: "Biscoff Cookie",
        description: "Made with Lotus Biscoff, this cookie delivers a rich caramelized flavor with warm, spiced notes in every bite.",
        src: "/MENU2/BC.png", // ENTER YOUR PHOTO PATH HERE
        badge: "New Flavor",
        logoSrc: "/BiscoffLogo2.jpg", // ENTER LOGO PATH HERE
    },
    {
        id: 2,
        name: "Matcha Cookie",
        description: "A refined balance of earthy matcha and subtle sweetness, baked into a soft, flavorful cookie that’s calm, elegant, and deeply satisfying.",
        src: "/MENU2/MC.png",
        badge: "New Flavor",
    },
    {
        id: 3,
        name: "Chocolate Chunk Cookie",
        description: "Classic and timeless, this cookie features generous chunks of premium chocolate baked into a soft, chewy base.",
        src: "/MENU2/CCH.png",
    },
    {
        id: 4,
        name: "Double Chocolate Cookie",
        description: "For those who love it rich, this cookie blends a chocolate base with melted chocolate pieces for a deep, indulgent bite that doesn’t hold back.",
        src: "/MENU2/DCH.png",
        badge: "Best Seller",
    },
    {
        id: 5,
        name: "S'mores Cookie",
        description: "Inspired by the classic treat, this cookie combines chocolate, a soft marshmallow center, and a golden base.",
        src: "/MENU2/SM.png",
    },
    {
        id: 6,
        name: "Red Velvet Cookie",
        description: "A soft red velvet cookie with a creamy cream cheese filling inside.",
        src: "/MENU2/RV.png",
    },
];

export default function Menu(){
    return(
        <section id="menu" className="py-24 bg-[#fffdf7] relative overflow-hidden scroll-mt-40 md:scroll-mt-48">
            {/* Decorative background elements */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-[#a7dff4] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 translate-x-1/2 translate-y-1/2"></div>

            <div className="max-w-6xl mx-auto px-4 relative z-10">
                <div className="flex flex-col items-center justify-center mb-20 text-center">
                    <span className="text-[#a7dff4] font-bold tracking-widest uppercase mb-3">Freshly Baked</span>
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
                                <p className="text-gray-600 text-lg mb-8 leading-relaxed group-hover:text-gray-900 font-medium transition-colors duration-300">
                                    {item.description}
                                </p>
                                <div className="flex flex-col md:flex-row items-center gap-6">
                                    <a href="https://tally.so/r/Npq8o0" target="_blank" rel="noopener noreferrer">
                                    <button className="bg-black text-white px-10 py-4 rounded-full font-bold text-lg shadow-lg hover:bg-white hover:text-black hover:scale-105 transition-all duration-300 cursor-pointer">
                                        Order Now
                                    </button>
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}