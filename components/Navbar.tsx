import Image from "next/image";

export default function Navbar() {
  return (
    <nav className="bg-[#a6dff6] px-5 py-4 shadow-md fixed top-0 left-0 w-full z-50 h-16">
      <div className="max-w-8xl mx-auto flex items-center ">
        
        {/* Logo */}
        <div>
          <a href="#home">
            <Image
                src={"/crumelladark.png"}
                alt="thechewyco logo"
                width={150}
                height={150}
                priority
                />
          </a>
        </div>

      </div>
    </nav>
  );
}
