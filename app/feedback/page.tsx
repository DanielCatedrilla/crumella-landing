"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { MENU_ITEMS } from "../../components/Menu";
import { supabase } from "../../components/supabase";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const Confetti = dynamic(() => import("react-confetti"), { ssr: false });

export default function FeedbackPage() {
  const [step, setStep] = useState(1); // 1: Info, 2: Ratings
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Step 1: Personal Info
  const [userInfo, setUserInfo] = useState({
    fullName: "",
    facebookName: "",
    email: "",
  });

  // Step 2: Ratings & General Feedback
  const [ratings, setRatings] = useState<Record<string, { taste: number; texture: number; smell: number; aftertaste: number }>>({});
  const [generalFeedback, setGeneralFeedback] = useState({
    favoriteCookie: "",
    finalThoughts: "",
  });

  // Modal State
  const [selectedCookie, setSelectedCookie] = useState<typeof MENU_ITEMS[0] | null>(null);
  const [currentRating, setCurrentRating] = useState({ taste: 0, texture: 0, smell: 0, aftertaste: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
    window.scrollTo(0, 0);
  };

  const openRatingModal = (cookie: typeof MENU_ITEMS[0]) => {
    setSelectedCookie(cookie);
    // Load existing rating or default
    if (ratings[cookie.name]) {
      setCurrentRating(ratings[cookie.name]);
    } else {
      setCurrentRating({ taste: 0, texture: 0, smell: 0, aftertaste: 0 });
    }
  };

  const saveRating = () => {
    if (selectedCookie) {
      setRatings((prev) => ({
        ...prev,
        [selectedCookie.name]: currentRating,
      }));
      setSelectedCookie(null);
    }
  };

  const handleFinalSubmit = async () => {
    if (Object.keys(ratings).length === 0) {
      alert("Please rate at least one cookie before submitting.");
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.from('feedbacks').insert({
      full_name: userInfo.fullName,
      facebook_name: userInfo.facebookName,
      email: userInfo.email,
      favorite_cookie: generalFeedback.favoriteCookie,
      final_thoughts: generalFeedback.finalThoughts,
      ratings: ratings
    });

    setIsSubmitting(false);

    if (error) {
      console.error("Error submitting feedback:", error);
      alert("There was an error submitting your feedback. Please try again.");
    } else {
      setIsSubmitted(true);
      window.scrollTo(0, 0);
    }
  };

  if (isSubmitted) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-[#fffdf7] flex items-center justify-center px-4 relative overflow-hidden">
           {windowSize.width > 0 && (
             <div className="fixed inset-0 z-0 pointer-events-none">
               <Confetti
                 width={windowSize.width}
                 height={windowSize.height}
                 recycle={false}
                 numberOfPieces={600}
                 gravity={0.1}
                 colors={['#a6dff6', '#000000', '#fbbf24', '#ffffff']}
                 confettiSource={{ x: windowSize.width / 2, y: windowSize.height / 2, w: 0, h: 0 }}
                 initialVelocityX={20}
                 initialVelocityY={20}
               />
             </div>
           )}
           {/* Texture & Blobs */}
           <div className="absolute inset-0 z-0 opacity-30 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }}></div>
           <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 -translate-x-1/3 translate-y-1/3 z-0"></div>

           <div className="max-w-md w-full bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-gray-100 text-center relative z-10">
              <div className="w-20 h-20 bg-[#a6dff6] rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10 text-black">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-black mb-4">Thank You!</h1>
              <p className="text-gray-500 font-medium mb-8">
                  Your feedback helps us bake better cookies. We appreciate your time!
              </p>
              <Link href="/" className="block w-full bg-black text-white font-bold py-4 rounded-full hover:bg-[#a7dff4] hover:text-black transition-all duration-300 shadow-lg">
                  Back to Home
              </Link>
           </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#fffdf7] py-24 px-4 relative">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-[#a6dff6] rounded-b-[3rem] z-0"></div>
      
      {/* Texture & Blobs */}
      <div className="absolute inset-0 z-0 opacity-30 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }}></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-pink-200 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 translate-x-1/3 translate-y-1/3 z-0"></div>
      <div className="absolute top-1/3 left-0 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-[96px] opacity-30 -translate-x-1/2 z-0"></div>
      
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-12 border border-gray-100 relative">
          
          {step === 2 && (
            <button 
              onClick={() => {
                setStep(1);
                window.scrollTo(0, 0);
              }}
              className="absolute top-6 left-6 md:top-10 md:left-10 p-2 bg-gray-50 rounded-full text-gray-500 hover:bg-black hover:text-white transition-colors z-20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </button>
          )}

          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-black text-black mb-4 tracking-tight">
              Cookie <span className="text-[#a6dff6]">Feedback</span>
            </h1>
            <p className="text-gray-500 font-medium text-lg">
              {step === 1 ? "Tell us a bit about yourself first." : `Hi ${userInfo.fullName.split(' ')[0]}! Rate your favorites.`}
            </p>
            
            {/* Progress Indicator */}
            <div className="flex items-center justify-center gap-2 mt-6">
              <div className={`h-2 rounded-full transition-all duration-500 ${step >= 1 ? "w-8 bg-black" : "w-2 bg-gray-200"}`}></div>
              <div className={`h-2 rounded-full transition-all duration-500 ${step >= 2 ? "w-8 bg-black" : "w-2 bg-gray-200"}`}></div>
            </div>
          </div>

          {step === 1 ? (
            <form onSubmit={handleInfoSubmit} className="space-y-6 max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black mb-2">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input 
                    required
                    type="text"
                    className="w-full pl-12 pr-5 py-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-black focus:ring-0 outline-none transition-all font-medium text-black focus:bg-white focus:shadow-lg"
                    placeholder="Jane Doe"
                    value={userInfo.fullName}
                    onChange={(e) => setUserInfo({...userInfo, fullName: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black mb-2">Facebook Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path d="M12 2.04c-5.5 0-10 4.49-10 10.02c0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.78-3.89c1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 008.44-9.9c0-5.53-4.5-10.02-10-10.02z" />
                    </svg>
                  </div>
                  <input 
                    required
                    type="text"
                    className="w-full pl-12 pr-5 py-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-black focus:ring-0 outline-none transition-all font-medium text-black focus:bg-white focus:shadow-lg"
                    placeholder="Jane Doe FB"
                    value={userInfo.facebookName}
                    onChange={(e) => setUserInfo({...userInfo, facebookName: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black mb-2">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
                      <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
                    </svg>
                  </div>
                  <input 
                    required
                    type="email"
                    className="w-full pl-12 pr-5 py-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-black focus:ring-0 outline-none transition-all font-medium text-black focus:bg-white focus:shadow-lg"
                    placeholder="jane@example.com"
                    value={userInfo.email}
                    onChange={(e) => setUserInfo({...userInfo, email: e.target.value})}
                  />
                </div>
              </div>
              <button type="submit" className="w-full bg-black text-white font-bold py-5 rounded-full hover:bg-[#a7dff4] hover:text-black hover:scale-[1.01] active:scale-95 transition-all duration-300 shadow-xl text-lg mt-4">
                Continue to Ratings
              </button>
            </form>
          ) : (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
              {/* Cookie Grid */}
              <div>
                <h3 className="text-xl font-bold text-black mb-6 text-center uppercase tracking-widest">Tap a cookie to rate</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                  {MENU_ITEMS.map((item) => (
                    <button 
                      key={item.id}
                      onClick={() => openRatingModal(item)}
                      className={`relative group rounded-[2rem] p-6 transition-all duration-300 border-2 text-left overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 ${ratings[item.name] ? 'bg-[#f0fdf4] border-green-400' : 'bg-[#a6dff6] border-transparent hover:border-black'}`}
                    >
                      {/* Texture Pattern */}
                      {!ratings[item.name] && (
                        <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 2px, transparent 2px)', backgroundSize: '16px 16px' }}></div>
                      )}

                      <div className="aspect-square relative mb-4 z-10">
                        <Image src={item.src} alt={item.name} fill className="object-contain drop-shadow-xl group-hover:scale-110 transition-transform duration-500 ease-out" />
                      </div>
                      <p className="font-bold text-sm md:text-base leading-tight text-black relative z-10">{item.name}</p>
                      {ratings[item.name] && (
                        <div className="absolute top-3 right-3 bg-green-500 text-white p-1.5 rounded-full shadow-md z-10 animate-in zoom-in duration-300">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* General Questions */}
              <div className="bg-white rounded-[2rem] p-6 md:p-10 shadow-xl border border-gray-100 space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gray-50 rounded-full -translate-y-1/2 translate-x-1/2 z-0"></div>
                <div className="relative z-10">
                <h3 className="text-xl font-bold text-black uppercase tracking-widest">Final Thoughts</h3>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-black mb-2 mt-4">What's your favorite cookie?</label>
                  <input 
                    type="text"
                    className="w-full px-5 py-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-black focus:ring-0 outline-none transition-all font-medium text-black focus:bg-white"
                    placeholder="e.g. Red Velvet"
                    value={generalFeedback.favoriteCookie}
                    onChange={(e) => setGeneralFeedback({...generalFeedback, favoriteCookie: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-black mb-2">Any suggestions or final thoughts?</label>
                  <textarea 
                    rows={3}
                    className="w-full px-5 py-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-black focus:ring-0 outline-none transition-all font-medium resize-none text-black focus:bg-white"
                    placeholder="We'd love to hear more..."
                    value={generalFeedback.finalThoughts}
                    onChange={(e) => setGeneralFeedback({...generalFeedback, finalThoughts: e.target.value})}
                  />
                </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="relative group">
                  <button 
                    onClick={handleFinalSubmit} 
                    disabled={isSubmitting || Object.keys(ratings).length === 0}
                    className="w-full bg-black text-white font-bold py-5 rounded-full hover:bg-[#a7dff4] hover:text-black hover:scale-[1.01] active:scale-95 transition-all duration-300 shadow-xl text-lg disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Submitting..." : "Submit All Feedback"}
                  </button>
                  {Object.keys(ratings).length === 0 && !isSubmitting && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-4 py-2 bg-gray-900 text-white text-sm font-bold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl whitespace-nowrap z-20">
                      Please rate at least one cookie to submit
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rating Modal */}
      {selectedCookie && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] p-6 md:p-8 max-w-sm w-full shadow-2xl relative overflow-hidden border border-gray-100 animate-in zoom-in-90 slide-in-from-bottom-4 duration-300">
            <button 
                onClick={() => setSelectedCookie(null)} 
                className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-black hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="text-center mb-6">
              <div className="w-24 h-24 mx-auto relative mb-4">
                <Image src={selectedCookie.src} alt={selectedCookie.name} fill className="object-contain" />
              </div>
              <h3 className="text-xl font-black text-black leading-tight">Rate {selectedCookie.name}</h3>
            </div>

            <div className="space-y-4">
              <StarRating label="Taste" value={currentRating.taste} onChange={(v) => setCurrentRating({...currentRating, taste: v})} />
              <StarRating label="Texture" value={currentRating.texture} onChange={(v) => setCurrentRating({...currentRating, texture: v})} />
              <StarRating label="Smell" value={currentRating.smell} onChange={(v) => setCurrentRating({...currentRating, smell: v})} />
              <StarRating label="Aftertaste" value={currentRating.aftertaste} onChange={(v) => setCurrentRating({...currentRating, aftertaste: v})} />
            </div>

            <button onClick={saveRating} className="w-full bg-black text-white font-bold py-3 rounded-full hover:bg-[#a7dff4] hover:text-black transition-all duration-300 shadow-lg mt-6">
              Save Rating
            </button>
          </div>
        </div>
      )}
    </main>
    <Footer />
    </>
  );
}

const StarRating = ({ value, onChange, label }: { value: number, onChange: (val: number) => void, label: string }) => {
  const [hover, setHover] = useState(0);

  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider text-black mb-2">{label}</label>
      <div className="flex gap-2" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            className="focus:outline-none transition-transform duration-200 hover:scale-110 active:scale-125"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={star <= (hover || value) ? "#fbbf24" : "#e5e7eb"} className="w-8 h-8 transition-colors">
              <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
};