"use client";
import React from "react";
import Image from "next/image";
import { Pagination, Autoplay } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/autoplay';
import 'swiper/css/navigation';

const SLIDES = [
  {
    id: 1,
    src: "/DS/DS1.png",
    mobileSrc: "/MS/MS1.png",
    alt: "Hero Slide 1",
  },
  {
    id: 2,
    src: "/DS/DS2.png",
    mobileSrc: "/MS/MS2.png",
    alt: "Hero Slide 2",
  },
  {
    id: 3,
    src: "/DS/DS3.png",
    mobileSrc: "/MS/MS3.png",
    alt: "Hero Slide 3",
  },
  {
    id: 4,
    src: "/DS/DS4.png",
    mobileSrc: "/MS/MS4.png",
    alt: "Hero Slide 4",
  },
  {
    id: 5,
    src: "/DS/DS5.png",
    mobileSrc: "/MS/MS5.png",
    alt: "Hero Slide 5",
  },
];

const Slider = () => {
  const scrollToMenu = () => {
    const menuSection = document.getElementById('menu');
    if (menuSection) {
      menuSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="bg-[#fffdf7]">
    <div className="h-[60vh] md:h-[85vh] w-full pt-16 relative">
      <Swiper
        className="h-full w-full"
        spaceBetween={0}
        modules={[Pagination, Autoplay]}
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
                  priority={index === 0}
                />
              </div>

              {/* Mobile Image - Hidden on Desktop */}
              <div className="block md:hidden w-full h-full relative">
                <Image
                  src={slide.mobileSrc || slide.src} // Fallback to desktop image if no mobileSrc
                  alt={slide.alt}
                  fill
                  sizes="100vw"
                  className="object-cover"
                  priority={index === 0}
                />
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Smooth Wave Transition to Menu Section */}
      <div className="absolute bottom-0 left-0 w-full z-10 leading-[0]">
        <svg 
            className="w-full h-16 md:h-32" 
            viewBox="0 0 1440 320" 
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path 
                fill="#fffdf7" 
                fillOpacity="1" 
                d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,261.3C960,256,1056,224,1152,208C1248,192,1344,192,1392,192L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            ></path>
        </svg>
      </div>
    </div>
    <div className="relative z-20 flex justify-center items-center -mt-12 md:-mt-20 pb-12">
        <button
          onClick={scrollToMenu}
          className="bg-[#a7dff4] text-black font-bold text-lg px-8 py-4 rounded-full shadow-lg hover:bg-white transition-all duration-300 transform hover:scale-105 animate-bounce cursor-pointer"
          aria-label="Explore Crumella"
        >
          Explore Crumella
        </button>
      </div>
    </section>
  );
};

export default Slider;
