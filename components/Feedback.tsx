"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";

const FEEDBACKS = [
  {
    id: 1,
    name: "Jaie Rendaje",
    comment: "Lovee this! Namit gid and very satisfying.10/10😙👌🏻",
    src: "/FB/Jaie.jpg", // Add your photo path here
  },
  {
    id: 2,
    name: "Nathan Licera",
    comment: "dabestttt. my go-to when craving something sweet. u guys should try (esp the red velvet flavor. saurr sarap)",
    src: "/FB/Nathan.jpg", // Add your photo path here
  },
  {
    id: 3,
    name: "Chrishelle Gicos Valenzuela",
    comment: "Highly recommended, namit2! My go-to cookies😍😋",
    src: "/FB/Chrishelle.jpg", // Add your photo path here
  },
  {
    id: 4,
    name: "Jeff Yron Cambas",
    comment: "Highly recommend this pastry—soft, flavorful, and absolutely worth a try! dabest!",
    src: "/FB/Jeff.jpg", // Add your photo path here
  },
  {
    id: 5,
    name: "Cape Madrona",
    comment: "the beeeest premium quality coookies!!! 😋😋😋",
    src: "/FB/Cape.jpg", // Add your photo path here
  },
  {
    id: 6,
    name: "Chloee Faith Lagunday",
    comment: "highly recommended, quality cookies and very namit!!!",
    src: "/FB/Chloe.jpg", // Add your photo path here
  },
];

export default function Feedback() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [itemsPerSlide, setItemsPerSlide] = useState(3);

  useEffect(() => {
    const handleResize = () => {
      setItemsPerSlide(window.innerWidth < 768 ? 1 : 3);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const slides = [];

  // Chunk feedbacks into groups of 3
  for (let i = 0; i < FEEDBACKS.length; i += itemsPerSlide) {
    slides.push(FEEDBACKS.slice(i, i + itemsPerSlide));
  }

  const totalSlides = slides.length;

  useEffect(() => {
    if (currentSlide >= totalSlides) {
      setCurrentSlide(0);
    }
  }, [totalSlides, currentSlide]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % totalSlides);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);

  return (
    <section className="pt-24 pb-0 bg-[#a6dff6] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-black text-black tracking-tight mb-4">
            Customer <span className="text-white">Love</span>
          </h2>
          <div className="w-24 h-2 bg-white mx-auto rounded-full"></div>
        </div>

        {/* Slider Container */}
        <div className="relative">
          {/* Navigation Arrows */}
          <button onClick={prevSlide} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 z-10 bg-white text-black p-3 rounded-full shadow-lg hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          
          <button onClick={nextSlide} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 z-10 bg-white text-black p-3 rounded-full shadow-lg hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          {/* Slides Track */}
          <div className="overflow-hidden">
            <div className="flex transition-transform duration-700 ease-in-out" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
              {slides.map((group, index) => (
                <div key={index} className="min-w-full grid grid-cols-1 md:grid-cols-3 gap-8 px-2">
                  {group.map((feedback) => (
                    <div key={feedback.id} className="bg-white p-8 rounded-[2rem] shadow-xl flex flex-col justify-between h-full transform hover:-translate-y-2 transition-transform duration-300">
                      <p className="text-gray-700 text-lg italic mb-6 leading-relaxed">"{feedback.comment}"</p>
                      <div className="flex items-center gap-4 mt-auto border-t border-gray-100 pt-4">
                        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                          {/* Placeholder for image - replace src in data above */}
                          <Image src={feedback.src} alt={feedback.name} fill className="object-cover" />
                        </div>
                        <div>
                          <h4 className="font-bold text-black text-lg leading-tight">{feedback.name}</h4>
                          <span className="text-xs text-blue-400 font-bold uppercase tracking-wider">Facebook Review</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pagination Dots */}
        <div className="flex justify-center gap-3 mt-12 mb-24 md:mb-32">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${currentSlide === idx ? "bg-white w-8" : "bg-white/40 hover:bg-white/60"}`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

      </div>

      {/* Wave Divider */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none rotate-180">
        <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-[calc(100%+1.3px)] h-[60px] md:h-[120px] fill-[#fffdf7]">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
        </svg>
      </div>
    </section>
  );
}