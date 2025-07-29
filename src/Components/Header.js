import React from 'react';
import { Phone, MapPin } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-[#FF9B57] h-12 flex items-center px-4 sm:px-6 md:px-12 lg:px-20">
      <div className="flex items-center justify-end w-full space-x-6 text-black text-xs sm:text-sm md:text-base">
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          <span>UAE</span>
        </div>
        <div className="flex items-center space-x-2">
          <Phone className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          <span>+971 56 418 0500</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
