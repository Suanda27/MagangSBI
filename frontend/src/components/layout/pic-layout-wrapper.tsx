"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import PicSidebar from "./pic-sidebar";
import PicHeader from "./pic-header";
import PicFooter from "./pic-footer";
import { PicStoreProvider } from "@/lib/pic/store";
import { Toaster } from "@/components/pic/primitives";

export default function PicLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <PicStoreProvider>
      <div className="bg-slate-50 font-sans text-slate-900 antialiased min-h-screen">
        <PicSidebar isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />

        <div className="lg:pl-64 flex flex-col min-h-screen">
          <PicHeader onMenuClick={() => setIsMobileMenuOpen(true)} />

          <main className="w-full pt-16 flex-1">
            {/* key=pathname memicu transisi halus setiap pindah halaman; fx-auto = efek otomatis isi halaman */}
            <div key={pathname} className="fx-page fx-auto max-w-[1280px] mx-auto px-4 md:px-8 py-6 md:py-8 flex flex-col gap-6">
              {children}
            </div>
          </main>

          <PicFooter />
        </div>
      </div>
      <Toaster />
    </PicStoreProvider>
  );
}
