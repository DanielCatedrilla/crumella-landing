import React from "react";
import { SiFacebook, SiInstagram, SiTiktok } from 'react-icons/si';

export default function Footer(){
    return(
        <footer className="fixed bottom-0 left-0 w-full bg-[#a6dff6]">
        <div className="h-25 flex flex-col justify-center items-center">
        <div className="flex justify-center gap-6">
            <a href="https://www.facebook.com/eatcrumella" target="_blank" rel="noopener noreferrer">
                <SiFacebook size={30} color="#251e17"/>
            </a>
            
            <a href="https://www.instagram.com/eatcrumella/" target="_blank" rel="noopener noreferrer">
                <SiInstagram size={30} color="#251e17"/>
            </a>
                

            <a href="https://www.tiktok.com/@eatcrumella" target="_blank" rel="noopener noreferrer">
                <SiTiktok size={30} color="#251e17"/>
            </a>
        </div>
             <p className="text-[#251e17] text-xs md:text-sm mt-5">© 2025 Crumella All rights reserved.</p>
        </div>
        </footer>
    );
}