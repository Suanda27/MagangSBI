"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import AdminSidebar from "./admin-sidebar";
import AdminHeader from "./admin-header";

export default function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="bg-slate-50 font-sans text-slate-900 antialiased min-h-screen">
      <AdminSidebar isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />

      <div className="lg:pl-64 flex flex-col min-h-screen">
        <AdminHeader onMenuClick={() => setIsMobileMenuOpen(true)} />

        <main className="w-full pt-16 flex-1">
          {/* key=pathname memicu transisi halus setiap pindah halaman; fx-auto = efek otomatis untuk isi halaman */}
          <div key={pathname} className="fx-page fx-auto max-w-[1440px] mx-auto px-4 md:px-8 py-6 md:py-8 flex flex-col gap-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
