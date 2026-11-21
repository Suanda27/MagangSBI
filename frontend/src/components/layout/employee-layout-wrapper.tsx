"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import EmployeeSidebar from "./employee-sidebar";
import EmployeeHeader from "./employee-header";

export default function EmployeeLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="bg-slate-50 font-sans text-slate-900 antialiased min-h-screen">
      <EmployeeSidebar isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />

      <div className="lg:pl-64 flex flex-col min-h-screen">
        <EmployeeHeader onMenuClick={() => setIsMobileMenuOpen(true)} />

        <main className="w-full pt-16 flex-1">
          {/* key=pathname memicu transisi halus setiap pindah halaman; fx-auto = efek otomatis untuk isi halaman */}
          <div key={pathname} className="fx-page fx-auto max-w-[1280px] mx-auto px-4 md:px-8 py-6 md:py-8 flex flex-col gap-6">
            {children}
          </div>
        </main>

        <footer className="w-full border-t border-slate-200 bg-white py-4 px-4 md:px-8">
          <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-slate-400">
            <p>© 2026 PT Solusi Bangun Indonesia Tbk — Portal Layanan Internal</p>
            <div className="flex items-center gap-5">
              <a className="hover:text-slate-600 transition-colors" href="#">Privasi</a>
              <a className="hover:text-slate-600 transition-colors" href="#">Ketentuan</a>
              <a className="hover:text-slate-600 transition-colors" href="#">Bantuan</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
