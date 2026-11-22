"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Bell, Menu, ChevronRight } from "lucide-react";
import { SUPERVISOR } from "@/lib/supervisor-data";

interface SupervisorHeaderProps {
  onMenuClick: () => void;
}

const breadcrumbLabels: Record<string, string> = {
  dashboard: "Dashboard",
  "monitoring-permintaan": "Monitoring Permintaan",
  laporan: "Laporan",
  pengaturan: "Pengaturan",
};

export default function SupervisorHeader({ onMenuClick }: SupervisorHeaderProps) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter((s) => s && s !== "supervisor");

  // Navbar menjadi lebih "solid" + berbayang saat halaman di-scroll
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fx-slide-down fixed top-0 left-0 lg:left-64 right-0 h-16 backdrop-blur-xl border-b z-30 transition-all duration-500 ${
        scrolled
          ? "bg-white/80 border-slate-200 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.18)]"
          : "bg-white/60 border-slate-200/60"
      }`}
    >
      {/* Garis gradien tipis yang muncul saat scroll */}
      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-blue-500/60 to-transparent transition-opacity duration-500 ${
          scrolled ? "opacity-100" : "opacity-0"
        }`}
      />

      <div className="h-16 px-4 md:px-8 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <button
            className="lg:hidden text-slate-500 hover:text-blue-700 hover:bg-blue-50 p-1.5 rounded-lg shrink-0 transition-all duration-300 active:scale-90"
            onClick={onMenuClick}
            aria-label="Buka menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb — dianimasikan ulang setiap pergantian halaman */}
          <div key={pathname} className="hidden sm:flex items-center gap-2 text-[13px] text-slate-500 min-w-0 truncate">
            <span className="fx-reveal-x" style={{ "--delay": "0ms" } as React.CSSProperties}>Portal</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="fx-reveal-x" style={{ "--delay": "60ms" } as React.CSSProperties}>Supervisor</span>
            {segments.map((seg, i) => (
              <span
                key={i}
                className="fx-reveal-x flex items-center gap-2"
                style={{ "--delay": `${120 + i * 60}ms` } as React.CSSProperties}
              >
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <span
                  className={
                    i === segments.length - 1
                      ? "text-slate-900 font-medium bg-gradient-to-r from-blue-900 to-blue-600 bg-clip-text text-transparent"
                      : "hover:text-slate-800 transition-colors"
                  }
                >
                  {breadcrumbLabels[seg] ?? seg}
                </span>
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          <div className="group/search relative hidden md:flex items-center">
            <Search className="absolute left-3 text-slate-400 w-[18px] h-[18px] pointer-events-none transition-all duration-300 group-focus-within/search:text-blue-600 group-focus-within/search:scale-110" />
            <input
              className="w-56 lg:w-64 focus:w-64 lg:focus:w-80 pl-9 pr-3.5 py-1.5 rounded-lg bg-slate-50/80 border border-slate-200 text-[13px] text-slate-800 placeholder:text-slate-400 hover:border-slate-300 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:shadow-md transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
              placeholder="Cari ID, judul, atau pengaju..."
              type="text"
            />
          </div>

          <button
            aria-label="Notifikasi"
            className="fx-bell relative p-2 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-all duration-300 active:scale-90"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 flex w-2 h-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75 animate-ping"></span>
              <span className="relative inline-flex w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
            </span>
          </button>

          <div className="hidden sm:block h-6 w-px bg-gradient-to-b from-transparent via-slate-300 to-transparent"></div>

          <Link
            href="/supervisor/pengaturan"
            className="group/profile flex items-center gap-2.5 pl-0 sm:pl-1 pr-2 py-1 rounded-xl hover:bg-slate-100/70 transition-all duration-300"
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-700 to-blue-950 text-white flex items-center justify-center font-medium text-xs shrink-0 ring-2 ring-white shadow-sm transition-all duration-300 group-hover/profile:ring-blue-200 group-hover/profile:scale-105">
                {SUPERVISOR.initials}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-[13px] font-medium text-slate-800 leading-tight transition-colors group-hover/profile:text-blue-900">{SUPERVISOR.name}</span>
              <span className="text-[11px] text-slate-400">{SUPERVISOR.role}</span>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
