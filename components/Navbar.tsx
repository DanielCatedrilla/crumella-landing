import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="bg-[#a6dff6] fixed top-0 left-0 w-full z-50 shadow-lg transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        
        {/* Logo */}
        <div className="hover:scale-105 transition-transform duration-300">
          <Link href="/">
            <Image
                src={"/crumelladark.png"}
                alt="thechewyco logo"
                width={150}
                height={150}
                priority
                className="w-32 md:w-40 h-auto object-contain"
                />
          </Link>

        </div>

        <Link href="/order" className="bg-black text-white px-8 py-3 rounded-full font-bold text-lg shadow-md hover:bg-gray-900 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
          Order Now
        </Link>

      </div>
    </nav>
  );
}
