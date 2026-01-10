"use client";
import React, { useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { SiFacebook, SiInstagram, SiTiktok } from 'react-icons/si';
import emailjs from '@emailjs/browser';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    // Replace these with your actual EmailJS credentials
    const serviceID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "";
    const templateID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || "";
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "";

    if (!serviceID || !templateID || !publicKey) {
      alert("Configuration Error: EmailJS environment variables are missing. Please check your deployment settings.");
      setLoading(false);
      return;
    }

    const templateParams = {
      from_name: formData.name,
      from_email: formData.email,
      reply_to: formData.email,
      subject: formData.subject,
      message: formData.message,
    };

    emailjs.send(serviceID, templateID, templateParams, publicKey)
      .then(() => {
        setShowSuccess(true);
        setFormData({ name: "", email: "", subject: "", message: "" });
      })
      .catch((error: any) => {
        console.error('FAILED...', error);
        alert(`Failed to send message: ${error.text || "Please check your internet connection or try again later."}`);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <main className="min-h-screen bg-[#fffdf7] relative flex flex-col overflow-hidden">
      <Navbar />
      
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#a7dff4] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

      <div className="flex-grow pt-32 pb-24 px-4 md:px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-black mb-4">
              Get in Touch<span className="text-[#a7dff4]">.</span>
            </h1>
            <p className="text-gray-500 font-medium text-lg max-w-2xl mx-auto">
              Have a question about our cookies, bulk orders, or collaborations? We'd love to hear from you!
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-start">
            
            {/* Contact Info Side */}
            <div className="space-y-10">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
                <h3 className="text-2xl font-black text-black mb-6">Contact Information</h3>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-[#a7dff4] p-3 rounded-full text-black">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Email Us</p>
                      <a href="mailto:eatcrumella@gmail.com" className="text-lg font-bold text-black hover:text-[#a7dff4] transition-colors">
                        eatcrumella@gmail.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-[#a7dff4] p-3 rounded-full text-black">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Location</p>
                      <p className="text-lg font-bold text-black">
                        Pavia Iloilo, Philippines
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-10 pt-8 border-t border-gray-100">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">Follow Us</p>
                  <div className="flex gap-4">
                    <a href="https://www.facebook.com/eatcrumella" target="_blank" rel="noopener noreferrer" className="bg-black text-white p-4 rounded-full hover:bg-[#a7dff4] hover:text-black transition-all duration-300 hover:scale-110 shadow-lg">
                        <SiFacebook size={24} />
                    </a>
                    <a href="https://www.instagram.com/eatcrumella/" target="_blank" rel="noopener noreferrer" className="bg-black text-white p-4 rounded-full hover:bg-[#a7dff4] hover:text-black transition-all duration-300 hover:scale-110 shadow-lg">
                        <SiInstagram size={24} />
                    </a>
                    <a href="https://www.tiktok.com/@eatcrumella" target="_blank" rel="noopener noreferrer" className="bg-black text-white p-4 rounded-full hover:bg-[#a7dff4] hover:text-black transition-all duration-300 hover:scale-110 shadow-lg">
                        <SiTiktok size={24} />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Side */}
            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl border border-gray-100">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Your Name</label>
                  <input required type="text" placeholder="Jane Doe" className="w-full px-5 py-4 rounded-xl bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white outline-none transition-all text-black placeholder:text-gray-400 font-medium"
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Email Address</label>
                  <input required type="email" placeholder="jane@example.com" className={`w-full px-5 py-4 rounded-xl border-2 outline-none transition-all text-black placeholder:text-gray-400 font-medium ${emailError ? 'bg-red-50 border-red-500 focus:border-red-500' : 'bg-gray-50 border-transparent focus:border-black focus:bg-white'}`}
                    value={formData.email} onChange={e => {
                      setFormData({...formData, email: e.target.value});
                      if (emailError) setEmailError("");
                    }} />
                  {emailError && <p className="text-red-500 text-xs font-bold mt-2 ml-1">{emailError}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Subject</label>
                  <select className="w-full px-5 py-4 rounded-xl bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white outline-none transition-all text-black font-medium appearance-none cursor-pointer"
                    value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})}>
                    <option value="">Select a topic...</option>
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Bulk Order">Bulk Order / Events</option>
                    <option value="Collaboration">Collaboration</option>
                    <option value="Feedback">Feedback</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Message</label>
                  <textarea required rows={5} placeholder="How can we help you?" className="w-full px-5 py-4 rounded-xl bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white outline-none transition-all resize-none text-black placeholder:text-gray-400 font-medium"
                    value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} />
                </div>

                <button type="submit" disabled={loading} className="w-full bg-black text-white font-bold py-5 rounded-full hover:bg-[#a7dff4] hover:text-black hover:scale-[1.02] active:scale-95 transition-all duration-300 shadow-xl text-lg mt-4 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3">
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Sending...</span>
                    </>
                  ) : (
                    "Send Message"
                  )}
                </button>
              </form>
            </div>

          </div>
        </div>
      </div>
      
      <Footer />

      {/* Success Popup */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl text-center relative overflow-hidden border border-gray-100">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-green-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-black mb-2">Message Sent!</h3>
            <p className="text-gray-500 font-medium mb-6">
              Thank you for reaching out. We have received your message and will get back to you shortly!
            </p>
            <button 
              onClick={() => setShowSuccess(false)}
              className="w-full bg-black text-white font-bold py-3 rounded-xl hover:bg-[#a7dff4] hover:text-black transition-all duration-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}