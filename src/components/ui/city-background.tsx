
"use client";

import Image from "next/image";

export default function CityBackground() {
  return (
    <div className="fixed inset-0 z-5 pointer-events-none overflow-hidden opacity-40">
      <div className="relative w-full h-full">
        <Image
          src="https://res.cloudinary.com/det1qnlrh/image/upload/v1779151417/city_background_uyzhca.png"
          alt="City Background"
          fill
          className="object-cover object-center select-none"
          priority
          quality={85}
        />
      </div>
    </div>
  );
}
