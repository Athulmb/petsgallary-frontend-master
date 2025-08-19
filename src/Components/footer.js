import { Instagram, Facebook } from "lucide-react";
import { FaPinterest } from "react-icons/fa";
import { SiTiktok } from "react-icons/si";

export default function Footer() {
  return (
    <footer className="w-full py-8 bg-[#F5F5EB]">
      <div className="container mx-auto px-4 flex flex-col items-center space-y-6">
        {/* Logo */}
        <img
          src="/logopng2.png"
          alt="Logo"
          className="h-16 w-16 md:h-[120px] md:w-[120px]"
        />

        {/* Description */}
        <p className="text-sm text-gray-600 text-center">
          The Best Pet Shop in Dubai Where Happy Pets Come First
        </p>

        {/* Social Links */}
        <div className="flex items-center space-x-6">
          <a 
            href="https://www.instagram.com/petsgallerydubai.ae?igsh=MWhicWVwZW90cXFxag==" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Instagram className="w-5 h-5" />
            <span className="sr-only">Instagram</span>
          </a>
          <a 
            href="https://www.facebook.com/share/1AVJ4GibQ5/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Facebook className="w-5 h-5" />
            <span className="sr-only">Facebook</span>
          </a>
          <a 
            href="https://in.pinterest.com/petsgallery033/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <FaPinterest className="w-5 h-5" />
            <span className="sr-only">Pinterest</span>
          </a>
          <a 
            href="https://www.tiktok.com/@pets.gallery.dubai?_t=ZS-8z0uokhF00Q&_r=1" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <SiTiktok className="w-5 h-5" />
            <span className="sr-only">TikTok</span>
          </a>
        </div>

        {/* Underline */}
        <div className="w-full border-t border-gray-700"></div>

        {/* Copyright */}
        <p className="text-xs text-gray-500 text-center">
          Copyright © {new Date().getFullYear()} Beyond. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}
