import React from "react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Menu from "@/components/Menu";
import Highlight from "@/components/Highlight";
import Feedback from "@/components/Feedback";
import CTA from "@/components/CTA";
import ScrollToTop from "@/components/ScrollToTop";




export default function home(){
  return(
    <main className="min-h-screen relative bg-white flex flex-col">
      <Navbar/>
      <Hero/>
      <Highlight/>
      <Menu/>
      <Feedback/>
      <CTA/>
      <ScrollToTop/>
      <div className="relative z-10 mt-auto">
        <Footer/>
      </div>
    </main>
  );
}