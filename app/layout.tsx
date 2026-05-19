import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Crumella",
  description: "Made to remember",
  icons:{
    icon: "/favicon2.png"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-white overscroll-none">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden bg-white overscroll-none`}
      >
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}