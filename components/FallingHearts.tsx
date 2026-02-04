"use client";
import React, { useEffect, useState } from "react";

export default function FallingHearts() {
  const [hearts, setHearts] = useState<
    { id: number; left: number; delay: number; duration: number; scale: number }[]
  >([]);

  useEffect(() => {
    // Generate hearts on the client side to avoid hydration mismatch
    const count = 20;
    const newHearts = Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 100, // Random horizontal position
      delay: Math.random() * 10, // Random start delay
      duration: 10 + Math.random() * 10, // Random fall duration (10-20s)
      scale: 0.5 + Math.random() * 0.5, // Random size
    }));
    setHearts(newHearts);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden" aria-hidden="true">
      {hearts.map((heart) => (
        <div
          key={heart.id}
          className="absolute -top-10"
          style={{
            left: `${heart.left}%`,
            animation: `fall ${heart.duration}s linear infinite`,
            animationDelay: `-${heart.delay}s`,
            ["--scale" as any]: heart.scale,
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-8 h-8 text-pink-300/40"
          >
            <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
          </svg>
        </div>
      ))}
      <style jsx global>{`
        @keyframes fall {
          0% {
            transform: translateY(-10vh) rotate(0deg) scale(var(--scale));
            opacity: 0;
          }
          10% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(110vh) rotate(360deg) scale(var(--scale));
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
