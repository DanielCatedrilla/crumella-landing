import Image from "next/image";
import React from "react";
import Footer from "@/components/Footer";
import Videobg from "@/components/Videobg";


export default function home(){
  return(
    <main className="h-screen relative overflow-hidden">
      <Videobg/>

      <div className="relative z-10 flex flex-col min-h-screen">
      
      <section className="flex flex-col items-center justify-center min-h-screen px-4">
        <Image
          src={"/crumellalight.png"}
          alt="the chewy co logo"
          width={600}
          height={600}
          className="w-[320px] h-auto md:w-[600px] md:h-auto"
          
         />
         <h1 className="text-lg text-center w-80 md:w-[800px] md:text-2xl mt-5">We’ve been baking something special. And it’s finally ready to meet you.</h1>
         <h1 className="text-lg  md:text-2xl mt-3">Launching this <span className="underline">December.</span></h1>
         <a href="https://tally.so/r/QK2eZA" target="_blank" rel="noopener noreferrer"><button className="w-40 h-12 bg-black text-white font-semibold mt-8 md:mt-10 rounded-xl cursor-pointer">Get Early Access</button></a>
      </section>
      <Footer/>
      </div>
    </main>
  );
}