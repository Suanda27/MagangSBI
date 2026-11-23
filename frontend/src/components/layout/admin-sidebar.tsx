"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  Wrench,
  ShieldCheck,
  MapPin,
  Inbox,
  BarChart3,
  Settings,
  LogOut,
  X,
  type LucideIcon,
} from "lucide-react";

interface AdminSidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

type NavItem = { href: string; label: string; icon: LucideIcon };

const navGroups: { title: string; links: NavItem[] }[] = [
  { title: "Main", links: [{ href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard }] },
  {
    title: "Master Data",
    links: [
      { href: "/admin/pengguna", label: "Pengguna", icon: Users },
      { href: "/admin/section", label: "Section", icon: Building2 },
      { href: "/admin/layanan", label: "Layanan", icon: Wrench },
      { href: "/admin/pic", label: "PIC", icon: ShieldCheck },
      { href: "/admin/lokasi", label: "Lokasi", icon: MapPin },
    ],
  },
  { title: "Permintaan", links: [{ href: "/admin/permintaan", label: "Semua Permintaan", icon: Inbox }] },
  { title: "Analisis", links: [{ href: "/admin/laporan", label: "Laporan", icon: BarChart3 }] },
  { title: "System", links: [{ href: "/admin/settings", label: "Settings", icon: Settings }] },
];

const delay = (ms: number) => ({ "--delay": `${ms}ms` } as React.CSSProperties);

export default function AdminSidebar({ isOpen, setIsOpen }: AdminSidebarProps) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/");

  // Hitung urutan item untuk animasi masuk bertahap
  let order = 0;

  return (
    <>
      {/* Overlay mobile dengan transisi fade + blur */}
      <div
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-white/95 backdrop-blur-xl border-r border-slate-200 z-50 flex flex-col justify-between select-none transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Aksen gradien halus di bagian atas */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-blue-50/70 to-transparent" />

        <div className="relative flex flex-col flex-1 overflow-y-auto">
          <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-100 relative">
            <div className="group/logo fx-shine w-9 h-9 rounded-lg bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center text-white shadow-md shadow-blue-900/20 shrink-0 transition-transform duration-500 hover:rotate-[8deg] hover:scale-110">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="fx-reveal-x flex flex-col min-w-0" style={delay(100)}>
              <span className="text-[15px] font-semibold text-slate-900 leading-tight tracking-tight truncate">ISM System</span>
              <span className="text-xs text-slate-400">Internal Service</span>
            </div>
            <button
              className="lg:hidden absolute right-4 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-1 rounded-md transition-all duration-300 hover:rotate-90"
              onClick={() => setIsOpen(false)}
              aria-label="Tutup menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="px-4 py-4 space-y-6 text-sm">
            {navGroups.map((group) => (
              <div key={group.title} className="space-y-1">
                <div
                  className="fx-reveal-x px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider"
                  style={delay(150 + order++ * 45)}
                >
                  {group.title}
                </div>
                {group.links.map(({ href, label, icon: Icon }) => {
                  const active = isActive(href);
                  return (
                    <div key={href} className="fx-reveal-x" style={delay(150 + order++ * 45)}>
                      <Link
                        href={href}
                        onClick={() => setIsOpen(false)}
                        className={`fx-nav-link flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                          active ? "is-active text-white" : "text-slate-600 hover:bg-blue-50/70 hover:text-blue-900"
                        }`}
                      >
                        <Icon className={`w-[18px] h-[18px] ${active ? "text-white" : "text-slate-400"}`} />
                        <span>{label}</span>
                        {active && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/90 shadow-[0_0_8px_rgba(255,255,255,0.9)] animate-pulse" />
                        )}
                      </Link>
                    </div>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        <div className="relative p-4 border-t border-slate-100">
          <button className="group/logout w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-300">
            <LogOut className="w-[18px] h-[18px] text-slate-400 transition-all duration-300 group-hover/logout:text-red-500 group-hover/logout:translate-x-1" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
