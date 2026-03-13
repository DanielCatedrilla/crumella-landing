"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { Pagination, Navigation, Autoplay } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out transform ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export default function CreatorsPage() {
  const [showAll, setShowAll] = useState(false);
  const creators = [
    { 
      id: 1, 
      name: "Jairo", 
      handle: "@_theonly.jairo",
      role: "Influencer", 
      image: "/CC/Jairo(1).jpg",
      thumbnail: "/THMB/Jairo.png", // Add your thumbnail path here
      videoUrl: "https://www.instagram.com/reel/DSByKgYkpDh/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==", // Add your embed video link here (e.g., https://www.youtube.com/embed/...)
      caption: "Delightful Cookies from @eatcrumella 🤤😍 Thanks for sending these out!🫶🏻",
      videoColor: "bg-purple-200"
    },
    { 
      id: 2, 
      name: "Enrico Ramos", 
      handle: "@abcdenricooo",
      role: "Artist", 
      image: "/CC/Enrico.jpg",
      thumbnail: "/THMB/Enrico.png",
      videoUrl: "https://www.instagram.com/reel/DSRYmL6Er0e/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==",
      caption: "One bite and you’re hooked 🍪✨ Crumella hits different—soft, rich, and super crave-worthy. Trust me, this is your new cookie fave 🤎 @eatcrumella",
      videoColor: "bg-pink-200"
    },
    { 
      id: 3, 
      name: "Nikos Catanus", 
      handle: "@ncatanus",
      role: "Influencer", 
      image: "/CC/Nikos.jpg",
      thumbnail: "/THMB/Nikos.png",
      videoUrl: "https://www.instagram.com/reel/DSACb44k8Do/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==",
      caption: "It’s the szn of giving, and these cookies are giving ooey-gooey overload! 🤤🍪",
      videoColor: "bg-blue-200"
    },
    { 
      id: 4, 
      name: "Elisha Bueno", 
      handle: "@elisha.bueno",
      role: "Influencer", 
      image: "/CC/Elisha(1).jpg",
      thumbnail: "/THMB/Elisha.png",
      videoUrl: "https://www.instagram.com/reel/DSFZboQEj9c/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==",
      caption: "POV: You found your new fave cookies 🍪 The crumble. The chunks. The gooeyness. I’m obsessed. ✨",
      videoColor: "bg-blue-200"
    },
    { 
      id: 5, 
      name: "Alleiah", 
      handle: "@leybedano",
      role: "Influencer", 
      image: "/CC/Alleiah.jpg", // Replace with actual profile image
      // Add the 3 photos for the stack here
      photos: ["/FC/A2.jpg", "/FC/A3.jpg", "/FC/A1.jpg"],
      videoUrl: "https://www.instagram.com/p/DR_A4K3EksI/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==", // Link to the specific post
      caption: "THE CRUNCH. THE CHEW. THE GOOEY MELT.",
      videoColor: "bg-yellow-200"
    },
     { 
      id: 6, 
      name: "KL Estrada", 
      handle: "@jklestradaaa",
      role: "Artist", 
      image: "/CC/KL.jpg", // Replace with actual profile image
      // Add the 3 photos for the stack here
      thumbnail: "/THMB/KL.jpg",
      videoUrl: "https://www.instagram.com/reel/DVlYurEkzlk/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==", // Link to the specific post
      caption: "Thank you so much, Crumella! 🍪 Super sarap ng cookies ninyo definitely worth trying! Highly recommended for all cookie lovers.",
      videoColor: "bg-yellow-200"
    },
  ];


  const iconixCreators = [
    { 
      id: 7, 
      name: "KL Estrada", 
      handle: "@jklestradaaa",
      role: "Artist",
      image: "/CC/KL.jpg",
      thumbnail: "/THMB/KL.jpg",
      videoUrl: "https://www.facebook.com/share/r/1N3P94dXkm/",
      caption: "The first take from the Iconix crew! Absolutely loved these cookies.",
      videoColor: "bg-purple-200"
    },
    { 
      id: 8, 
      name: "Jacob Smith", 
      handle: "@ijacobsmithhh",
      role: "Artist",
      image: "/CC/Jacob.jpg",
      thumbnail: "/THMB/Jacob.jpg",
      videoUrl: "https://www.facebook.com/share/r/1Dbd3mwPxz/",
      videoColor: "bg-pink-200"
    },
    { 
      id: 9, 
      name: "JC Miguel", 
      handle: "@_.itsjcmiguel",
      role: "Artist",
      image: "/CC/JC.jpg",
      thumbnail: "/THMB/JC.jpg",
      videoUrl: "https://www.facebook.com/share/r/181ERTRMwy/",
      videoColor: "bg-yellow-200"
    },
  ];

  return (
    <main className="min-h-screen bg-[#fffdf7] relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Dot Pattern */}
        <div className="absolute inset-0 opacity-[0.15]" 
             style={{ backgroundImage: 'radial-gradient(#a1a1aa 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
        </div>
        
        {/* Soft Color Blobs */}
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-[#a6dff6]/20 rounded-full blur-[120px] mix-blend-multiply"></div>
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] bg-pink-200/20 rounded-full blur-[120px] mix-blend-multiply"></div>
        <div className="absolute -bottom-[10%] left-[20%] w-[40%] h-[40%] bg-yellow-200/20 rounded-full blur-[120px] mix-blend-multiply"></div>
      </div>

      <div className="relative z-10">
      <Navbar />
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <FadeIn>
            <div className="text-center mb-24">
              <h1 className="text-5xl md:text-7xl font-black text-black tracking-tight mb-4">
                The <span className="text-[#a6dff6]">Creators</span>
              </h1>
              <div className="w-24 h-2 bg-black mx-auto rounded-full mb-6"></div>
              <p className="text-xl text-gray-600 font-medium max-w-2xl mx-auto">
                Meet the brilliant minds and taste-makers behind our most iconic collaborations.
              </p>
            </div>
          </FadeIn>

          {/* Creators Sections */}
          <div className="flex flex-col mb-32">
            {creators.map((creator, index) => (
              <div key={creator.id} className={index < 3 ? "mb-32" : `grid transition-all duration-1000 ease-in-out ${showAll ? 'grid-rows-[1fr] opacity-100 mb-32' : 'grid-rows-[0fr] opacity-0 mb-0'}`}>
                <div className="overflow-hidden">
              <FadeIn className="w-full">
                <div 
                  className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-12 md:gap-24`}
                >
                {/* Video/Visual Side */}
                <div className="w-full md:w-1/2 flex justify-center">
                  {creator.photos && creator.photos.length > 0 ? (
                    <a href={creator.videoUrl} target="_blank" rel="noopener noreferrer" className="relative w-72 md:w-80 aspect-[9/16] group perspective-1000 cursor-pointer">
                        {/* Bottom Photo */}
                        <div className="absolute top-12 left-2 w-56 h-72 bg-white p-2 shadow-xl transform -rotate-6 transition-all duration-500 group-hover:-translate-x-12 group-hover:-rotate-12 z-10 rounded-xl">
                            <div className="relative w-full h-full overflow-hidden rounded-lg">
                                <Image src={creator.photos[0]} alt={`${creator.name} photo 1`} fill className="object-cover" />
                            </div>
                        </div>
                        {/* Middle Photo */}
                        <div className="absolute top-24 right-2 w-56 h-72 bg-white p-2 shadow-xl transform rotate-6 transition-all duration-500 group-hover:translate-x-12 group-hover:rotate-12 z-20 rounded-xl">
                            <div className="relative w-full h-full overflow-hidden rounded-lg">
                                <Image src={creator.photos[1]} alt={`${creator.name} photo 2`} fill className="object-cover" />
                            </div>
                        </div>
                        {/* Top Photo */}
                        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-60 h-80 bg-white p-2 shadow-2xl transform -rotate-2 transition-all duration-500 group-hover:scale-110 group-hover:rotate-0 z-30 rounded-xl">
                            <div className="relative w-full h-full overflow-hidden rounded-lg">
                                <Image src={creator.photos[2]} alt={`${creator.name} photo 3`} fill className="object-cover" />
                            </div>
                        </div>
                        <div className="absolute bottom-4 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-40">
                            <span className="bg-black text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg">View Post</span>
                        </div>
                    </a>
                  ) : (
                    <div className="relative w-72 md:w-80 aspect-[9/16] bg-black rounded-[3rem] shadow-xl overflow-hidden border-4 border-white transform transition-transform duration-500 hover:scale-105 hover:rotate-2">
                        <a href={creator.videoUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-full relative group">
                            {creator.thumbnail ? (
                                <Image src={creator.thumbnail} alt={`${creator.name} thumbnail`} fill className="object-cover" />
                            ) : (
                                <div className={`absolute inset-0 ${creator.videoColor || 'bg-gray-800'} opacity-80`}></div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center transition-transform group-hover:scale-110">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white ml-1">
                                        <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                        </a>
                    </div>
                  )}
                </div>

                {/* Content Side */}
                <div className="w-full md:w-1/2 text-center md:text-left">
                  <div className={`flex items-center gap-4 mb-6 ${index % 2 === 0 ? 'md:justify-start' : 'md:justify-end flex-row-reverse'} justify-center`}>
                    <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-[#a6dff6] shadow-md">
                        <Image src={creator.image} alt={creator.name} fill className="object-cover" />
                    </div>
                    <div className={`text-left ${index % 2 !== 0 ? 'md:text-right' : ''}`}>
                        <h3 className="text-xl font-bold text-black leading-tight">{creator.name}</h3>
                        <p className="text-[#a6dff6] font-bold text-sm">{creator.handle}</p>
                    </div>
                  </div>

                  <div className={`relative bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100 ${index % 2 !== 0 ? 'md:text-right' : ''}`}>
                    <div className={`absolute -top-6 ${index % 2 === 0 ? 'left-8' : 'right-8'} w-12 h-12 bg-black text-[#a6dff6] flex items-center justify-center rounded-full text-2xl font-serif`}>
                        &quot;
                    </div>
                    
                    <p className="text-2xl md:text-3xl font-black text-gray-900 leading-tight mb-4">
                        {creator.caption}
                    </p>
                    <span className="inline-block bg-[#a6dff6] text-black text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                        {creator.role}
                    </span>
                  </div>
                </div>
              </div>
              </FadeIn>
              </div>
              </div>
            ))}
            {!showAll && creators.length > 3 && (
              <FadeIn>
                <div className="flex justify-center pt-8">
                  <button 
                    onClick={() => setShowAll(true)}
                    className="bg-black text-white text-lg font-bold py-4 px-12 rounded-full hover:bg-[#a6dff6] hover:text-black transition-all duration-300 shadow-xl hover:scale-105 active:scale-95"
                  >
                    See More Creators
                  </button>
                </div>
              </FadeIn>
            )}
            {showAll && creators.length > 3 && (
              <FadeIn>
                <div className="flex justify-center pt-8">
                  <button 
                    onClick={() => setShowAll(false)}
                    className="bg-black text-white text-lg font-bold py-4 px-12 rounded-full hover:bg-[#a6dff6] hover:text-black transition-all duration-300 shadow-xl hover:scale-105 active:scale-95"
                  >
                    Show Less
                  </button>
                </div>
              </FadeIn>
            )}
          </div>

           {/* Iconix Section */}
          <FadeIn className="pt-16 border-t-2 border-dashed border-gray-200">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-black text-black tracking-tight mb-4">
                <span className="text-pink-400">ICONIX.PH</span>
              </h2>
              <div className="w-20 h-1.5 bg-black mx-auto rounded-full mb-6"></div>
              <p className="text-lg text-gray-600 font-medium max-w-2xl mx-auto">
                A powerhouse trio of artists, each with their own unique and delicious take on Crumella cookies.
              </p>
            </div>
          </FadeIn>

          <FadeIn className="w-full">
            <style>{`
              .swiper-button-next, .swiper-button-prev { 
                color: black !important; 
                display: none !important;
              }
              @media (min-width: 768px) {
                .swiper-button-next, .swiper-button-prev { display: flex !important; }
              }
              .swiper-pagination-bullet-active { background: black !important; }
              .swiper-pagination { bottom: -5px !important; }
            `}</style>
            <Swiper
              modules={[Pagination, Navigation, Autoplay]}
              spaceBetween={32}
              slidesPerView={1}
              navigation
              pagination={{ clickable: true }}
              autoplay={{ delay: 6000, disableOnInteraction: false }}
              loop={true}
              breakpoints={{
                640: { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
              }}
              className="w-full pb-32 md:pb-16"
            >
              {iconixCreators.map((creator) => (
                <SwiperSlide key={creator.id} className="h-auto">
                  <div className="flex flex-col gap-4 group h-full justify-start w-72 md:w-80 mx-auto">
                    {/* Video Visual - Card Style */}
                    <div className="relative w-full aspect-[9/16] bg-black rounded-[2rem] shadow-lg overflow-hidden border-2 border-white transform transition-transform duration-500 group-hover:scale-[1.02] group-hover:-rotate-1">
                      <a href={creator.videoUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-full relative">
                        <Image src={creator.thumbnail} alt={`${creator.name} thumbnail`} fill className="object-cover" />
                        
                        {/* Overlay Icon */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center transition-transform group-hover:scale-110">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-white ml-1">
                              <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      </a>
                    </div>
                    
                    {/* Content */}
                    <div className="px-2">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[#a6dff6] flex-shrink-0">
                          <Image src={creator.image} alt={creator.name} fill className="object-cover" />
                        </div>
                        <div>
                          <h3 className="text-md font-bold text-black leading-tight">{creator.name}</h3>
                          <p className="text-[#a6dff6] font-bold text-xs">{creator.handle}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </FadeIn>
        </div>
      </section>

   

      {/* Footer */}
      <Footer />
      </div>
    </main>
  );
}