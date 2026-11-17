"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Inbox, Hourglass, CheckCircle2, BarChart3, User, LogOut, X, Wrench, type LucideIcon } from "lucide-react";
import { useRingkasan } from "@/lib/pic/store";

interface PicSidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

type NavItem = { href: string; label: string; icon: LucideIcon; badge?: number };

const delay = (ms: number) => ({ "--delay": `${ms}ms` }) as React.CSSProperties;

export default function PicSidebar({ isOpen, setIsOpen }: PicSidebarProps) {
  const pathname = usePathname();
  const r = useRingkasan();

  const groups: { title: string; links: NavItem[] }[] = [
    {
      title: "Workspace",
      links: [
        { href: "/pic/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/pic/permintaan-masuk", label: "Permintaan Masuk", icon: Inbox, badge: r.menunggu },
        { href: "/pic/sedang-diproses", label: "Sedang Diproses", icon: Hourglass, badge: r.aktif },
        { href: "/pic/selesai", label: "Selesai & Riwayat", icon: CheckCircle2 },
      ],
    },
    { title: "Analisis", links: [{ href: "/pic/laporan", label: "Laporan", icon: BarChart3 }] },
    { title: "Akun", links: [{ href: "/pic/profil", label: "Profil & Pengaturan", icon: User }] },
  ];

  // Halaman detail permintaan mengikuti menu asal berdasarkan status tiket.
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  let order = 0;

  return (
    <>
      <div
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-white/95 backdrop-blur-xl border-r border-slate-200 z-50 flex flex-col justify-between select-none transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-blue-50/70 to-transparent" />

        <div className="relative flex flex-col flex-1 overflow-y-auto">
          <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-100 relative">
            <div className="fx-shine w-9 h-9 rounded-lg bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center text-white shadow-md shadow-blue-900/20 shrink-0 transition-transform duration-500 hover:rotate-[8deg] hover:scale-110">
              <Wrench className="w-5 h-5" />
            </div>
            <div className="fx-reveal-x flex flex-col min-w-0" style={delay(100)}>
              <span className="text-[15px] font-semibold text-slate-900 leading-tight tracking-tight truncate">ISM System</span>
              <span className="text-xs text-slate-400">PIC Operations</span>
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
            {groups.map((g) => (
              <div key={g.title} className="space-y-1">
                <div className="fx-reveal-x px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider" style={delay(150 + order++ * 45)}>
                  {g.title}
                </div>
                {g.links.map(({ href, label, icon: Icon, badge }) => {
                  const active = isActive(href);
                  return (
                    <div key={href} className="fx-reveal-x" style={delay(150 + order++ * 45)}>
                      <Link
                        href={href}
                        onClick={() => setIsOpen(false)}
                        className={`fx-nav-link flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${active ? "is-active text-white" : "text-slate-600 hover:bg-blue-50/70 hover:text-blue-900"}`}
                      >
                        <Icon className={`w-[18px] h-[18px] ${active ? "text-white" : "text-slate-400"}`} />
                        <span>{label}</span>
                        {badge !== undefined && badge > 0 && (
                          <span className={`ml-auto min-w-5 text-center text-[11px] font-semibold px-1.5 py-0.5 rounded-md transition-colors ${active ? "bg-white/20 text-white" : "bg-blue-100 text-blue-700"}`}>{badge}</span>
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
          <Link
            href="/login"
            className="group/logout w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-300"
          >
            <LogOut className="w-[18px] h-[18px] text-slate-400 transition-all duration-300 group-hover/logout:text-red-500 group-hover/logout:translate-x-1" />
            <span>Logout</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
