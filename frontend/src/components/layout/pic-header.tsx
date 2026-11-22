"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Bell, Menu, Inbox, CornerDownLeft } from "lucide-react";
import { usePicStore, useRingkasan } from "@/lib/pic/store";
import { inisial, tanggalJam } from "@/lib/shared/format";

interface PicHeaderProps {
  onMenuClick: () => void;
}

export default function PicHeader({ onMenuClick }: PicHeaderProps) {
  const router = useRouter();
  const { profil, permintaan } = usePicStore();
  const { menunggu } = useRingkasan();

  const [scrolled, setScrolled] = useState(false);
  const [q, setQ] = useState("");
  const [fokus, setFokus] = useState(false);
  const [notif, setNotif] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const onClick = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setFokus(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotif(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  const hasil = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return permintaan.filter((p) => `${p.id} ${p.judul} ${p.pengaju.nama}`.toLowerCase().includes(s)).slice(0, 5);
  }, [q, permintaan]);

  const antrean = permintaan.filter((p) => p.status === "menunggu").slice(0, 4);

  return (
    <header
      className={`fx-slide-down fixed top-0 left-0 lg:left-64 right-0 h-16 backdrop-blur-xl border-b z-30 transition-all duration-500 ${scrolled ? "bg-white/80 border-slate-200 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.18)]" : "bg-white/60 border-slate-200/60"}`}
    >
      <div className={`pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-blue-500/60 to-transparent transition-opacity duration-500 ${scrolled ? "opacity-100" : "opacity-0"}`} />

      <div className="h-16 px-4 md:px-8 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button className="lg:hidden text-slate-500 hover:text-blue-700 hover:bg-blue-50 p-1.5 rounded-lg shrink-0 transition-all duration-300 active:scale-90" onClick={onMenuClick} aria-label="Buka menu">
            <Menu className="w-5 h-5" />
          </button>

          <div ref={wrap} className="group/search relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-[18px] h-[18px] pointer-events-none transition-all duration-300 group-focus-within/search:text-blue-600 group-focus-within/search:scale-110" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => setFokus(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && hasil[0]) {
                  router.push(`/pic/permintaan/${hasil[0].id}`);
                  setFokus(false);
                  setQ("");
                }
              }}
              className="w-full pl-9 pr-3.5 py-1.5 rounded-lg bg-slate-50/80 border border-slate-200 text-[13px] text-slate-800 placeholder:text-slate-400 hover:border-slate-300 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:shadow-md transition-all duration-500"
              placeholder="Cari ID tiket, judul, atau pengaju..."
              type="text"
            />
            {fokus && q.trim() && (
              <div className="ui-modal absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                {hasil.length === 0 ? (
                  <p className="px-4 py-3 text-xs text-slate-500">Tidak ada hasil untuk “{q}”.</p>
                ) : (
                  <ul>
                    {hasil.map((p) => (
                      <li key={p.id}>
                        <Link
                          href={`/pic/permintaan/${p.id}`}
                          onClick={() => {
                            setFokus(false);
                            setQ("");
                          }}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50/60 transition-colors"
                        >
                          <span className="text-xs font-semibold text-blue-800">#{p.id}</span>
                          <span className="text-xs text-slate-700 truncate">{p.judul}</span>
                          <CornerDownLeft className="w-3.5 h-3.5 text-slate-300 ml-auto shrink-0" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          <div ref={notifRef} className="relative">
            <button
              aria-label="Notifikasi"
              onClick={() => setNotif((v) => !v)}
              className="fx-bell relative p-2 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-all duration-300 active:scale-90"
            >
              <Bell className="w-5 h-5" />
              {menunggu > 0 && (
                <span className="absolute top-2 right-2 flex w-2 h-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75 animate-ping"></span>
                  <span className="relative inline-flex w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
                </span>
              )}
            </button>
            {notif && (
              <div className="ui-modal absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-slate-900">Notifikasi</span>
                  <span className="text-[11px] text-slate-400">{menunggu} menunggu</span>
                </div>
                {antrean.length === 0 ? (
                  <p className="px-4 py-6 text-xs text-slate-500 text-center">Tidak ada permintaan baru. 🎉</p>
                ) : (
                  <ul className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {antrean.map((p) => (
                      <li key={p.id}>
                        <Link href={`/pic/permintaan/${p.id}`} onClick={() => setNotif(false)} className="flex gap-3 px-4 py-3 hover:bg-blue-50/50 transition-colors">
                          <span className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><Inbox className="w-4 h-4" /></span>
                          <span className="min-w-0">
                            <span className="block text-xs font-medium text-slate-800 truncate">{p.judul}</span>
                            <span className="block text-[11px] text-slate-400">{p.pengaju.nama} · {tanggalJam(p.diajukan)}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                <Link href="/pic/permintaan-masuk" onClick={() => setNotif(false)} className="block text-center text-xs font-medium text-blue-700 hover:bg-blue-50 py-2.5 border-t border-slate-100 transition-colors">
                  Buka Permintaan Masuk
                </Link>
              </div>
            )}
          </div>

          <div className="hidden sm:block h-6 w-px bg-gradient-to-b from-transparent via-slate-300 to-transparent"></div>

          <Link href="/pic/profil" className="group/profile flex items-center gap-2.5 pr-2 py-1 pl-1 rounded-xl hover:bg-slate-100/70 transition-all duration-300">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-700 to-blue-950 text-white flex items-center justify-center font-medium text-xs shrink-0 ring-2 ring-white shadow-sm transition-all duration-300 group-hover/profile:ring-blue-200 group-hover/profile:scale-105">
                {inisial(profil.nama)}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-[13px] font-medium text-slate-800 leading-tight transition-colors group-hover/profile:text-blue-900">{profil.nama}</span>
              <span className="text-[11px] text-slate-400">PIC · {profil.seksi}</span>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
