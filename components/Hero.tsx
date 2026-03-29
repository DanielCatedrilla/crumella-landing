"use client";
import React from "react";
import Image from "next/image";
import { Pagination, Autoplay, EffectFade } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/autoplay';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';

const SLIDES = [
  {
    id: 1,
    src: "/DS/DS22.png",
    mobileSrc: "/MS/MS16.png",
    alt: "Hero Slide 1",
  },
  {
    id: 2,
    src: "/DS/DS18.png",
    mobileSrc: "/MS/MS17.png",
    alt: "Hero Slide 2",
  },
  {
    id: 3,
    src: "/DS/DS19.png",
    mobileSrc: "/MS/MS18.png",
    alt: "Hero Slide 3",
  },
    {
    id: 4,
    src: "/DS/DS20.png",
    mobileSrc: "/MS/MS19.png",
    alt: "Hero Slide 4",
  },
  {
    id: 5,
    src: "/DS/DS21.png",
    mobileSrc: "/MS/MS20.png",
    alt: "Hero Slide 5",
  },
    {
    id: 6,
    src: "/DS/DS17.png",
    mobileSrc: "/MS/MS21.png",
    alt: "Hero Slide 6",
  },

];

const Slider = () => {
  const scrollToHighlight = () => {
    const highlightSection = document.getElementById('whats-new');
    if (highlightSection) {
      highlightSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="bg-[#fffdf7]">
    <div className="h-[60vh] md:h-screen w-full relative z-0">
      <Swiper
        className="h-full w-full"
        spaceBetween={0}
        modules={[Pagination, Autoplay, EffectFade]}
        effect="fade"
        pagination={{ clickable: true }}
        loop={true}
        autoplay={{ delay: 10000 }}
        navigation
        slidesPerView={1}
      >
        {SLIDES.map((slide, index) => (
          <SwiperSlide key={slide.id}>
            <div className="relative w-full h-full">
              {/* Desktop Image - Hidden on Mobile */}
              <div className="hidden md:block w-full h-full relative">
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  sizes="100vw"
                  className="object-cover"
                  quality={90}
                  priority={index === 0}
                />
              </div>

              {/* Mobile Image - Hidden on Desktop */}
              <div className="block md:hidden w-full h-full relative">
                <Image
                  src={slide.mobileSrc || slide.src}
                  alt={slide.alt}
                  fill
                  sizes="(max-width: 768px) 100vw"
                  className="object-cover object-center"
                  quality={90}
                  priority={index === 0}
                />
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

    </div>
    <div className="relative z-20 flex justify-center items-center -mt-24 md:-mt-32 pb-12 pointer-events-none">
        <button
          onClick={scrollToHighlight}
          className="pointer-events-auto group relative overflow-hidden bg-white/80 backdrop-blur-md border border-white/60 text-black font-black text-lg md:text-xl px-10 py-5 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_50px_rgba(166,223,246,0.8)] transition-all duration-500 ease-out transform hover:-translate-y-2 hover:scale-105 active:scale-95 cursor-pointer"
          aria-label="Explore Crumella"
        >
          <span className="relative z-10 flex items-center gap-3">
            Explore Crumella
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={3} 
              stroke="currentColor" 
              className="w-5 h-5 transition-transform duration-300 group-hover:translate-y-1"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </span>
          {/* Subtle gradient sweep on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#a6dff6]/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
        </button>
      </div>
    </section>
  );
};

export default Slider;