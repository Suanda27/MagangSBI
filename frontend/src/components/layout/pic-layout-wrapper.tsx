"use client";

import { useState } from "react";
import PicSidebar from "./pic-sidebar";
import PicHeader from "./pic-header";
import PicFooter from "./pic-footer";

export default function PicLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="bg-surface font-sans text-on-surface antialiased min-h-screen flex flex-col">
      <PicSidebar isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />
      
      <div className="pl-0 md:pl-60 flex flex-col min-h-screen transition-all duration-300">
        <PicHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
        
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10">
          {children}
        </main>

        <PicFooter />
      </div>
    </div>
  );
}
