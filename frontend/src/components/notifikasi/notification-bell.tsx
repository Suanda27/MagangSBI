"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Clock,
  Loader2,
  Pause,
  Play,
  PlusSquare,
  XCircle,
} from "lucide-react";
import { getNotifikasi, tandaiDibaca, tandaiSemuaDibaca, type Notifikasi } from "@/lib/api/notifikasi";
import type { AksiRiwayat } from "@/lib/api/types";
import { formatTanggal } from "@/lib/auth/user-display";

/** Berapa notifikasi terbaru yang ditampilkan di dropdown. */
const JUMLAH = 8;
/** Jeda pembaruan otomatis (ms) saat tab terlihat. */
const JEDA_POLLING = 30_000;

const IKON: Record<AksiRiwayat, { icon: typeof Check; tone: string }> = {
  submitted: { icon: PlusSquare, tone: "bg-amber-50 text-amber-600" },
  accepted: { icon: Play, tone: "bg-blue-50 text-blue-600" },
  rejected: { icon: XCircle, tone: "bg-rose-50 text-rose-600" },
  paused: { icon: Pause, tone: "bg-slate-100 text-slate-500" },
  resumed: { icon: Play, tone: "bg-blue-50 text-blue-600" },
  result_sent: { icon: Check, tone: "bg-violet-50 text-violet-600" },
  revision_requested: { icon: AlertTriangle, tone: "bg-amber-50 text-amber-600" },
  approved: { icon: BadgeCheck, tone: "bg-emerald-50 text-emerald-600" },
  auto_closed: { icon: Clock, tone: "bg-slate-100 text-slate-500" },
};

/** "baru saja", "5 menit lalu", "3 jam lalu", "2 hari lalu", atau tanggal untuk yang lebih lama. */
function waktuRelatif(iso: string | null): string {
  if (!iso) return "";
  const selisih = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(selisih)) return "";
  const menit = Math.floor(selisih / 60_000);
  if (menit < 1) return "baru saja";
  if (menit < 60) return `${menit} menit lalu`;
  const jam = Math.floor(menit / 60);
  if (jam < 24) return `${jam} jam lalu`;
  const hari = Math.floor(jam / 24);
  if (hari < 7) return `${hari} hari lalu`;
  return formatTanggal(iso);
}

/**
 * Lonceng notifikasi dalam aplikasi: lencana jumlah belum dibaca, dropdown daftar terbaru,
 * tandai dibaca, dan pembaruan berkala. Dipakai lintas peran; tujuan tautan tiket diberikan
 * lewat hrefTiket karena alamat detail tiket berbeda per peran.
 */
export default function NotificationBell({ hrefTiket }: { hrefTiket: (idPermintaan: number) => string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notifikasi[]>([]);
  const [belumDibaca, setBelumDibaca] = useState(0);
  const [siap, setSiap] = useState(false);
  const [error, setError] = useState(false);
  const [sibuk, setSibuk] = useState(false);
  const wadah = useRef<HTMLDivElement>(null);

  const muat = useCallback(() => {
    let dibatalkan = false;
    getNotifikasi({ per_page: JUMLAH })
      .then((hasil) => {
        if (dibatalkan) return;
        setItems(hasil.data);
        setBelumDibaca(hasil.belum_dibaca);
        setError(false);
        setSiap(true);
      })
      .catch(() => {
        if (!dibatalkan) setError(true);
      });
    return () => {
      dibatalkan = true;
    };
  }, []);

  // Muat saat tampil, lalu perbarui berkala selama tab terlihat.
  useEffect(() => {
    let batal = muat();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") {
        batal();
        batal = muat();
      }
    }, JEDA_POLLING);
    const saatTerlihat = () => {
      if (document.visibilityState === "visible") {
        batal();
        batal = muat();
      }
    };
    document.addEventListener("visibilitychange", saatTerlihat);
    return () => {
      batal();
      clearInterval(timer);
      document.removeEventListener("visibilitychange", saatTerlihat);
    };
  }, [muat]);

  // Tutup bila klik di luar atau menekan Escape.
  useEffect(() => {
    if (!open) return;
    const klikLuar = (e: MouseEvent) => {
      if (wadah.current && !wadah.current.contains(e.target as Node)) setOpen(false);
    };
    const tekan = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", klikLuar);
    document.addEventListener("keydown", tekan);
    return () => {
      document.removeEventListener("mousedown", klikLuar);
      document.removeEventListener("keydown", tekan);
    };
  }, [open]);

  const buka = () => {
    const akanBuka = !open;
    setOpen(akanBuka);
    if (akanBuka) muat(); // ambil yang terbaru setiap kali dibuka
  };

  const bacaSatu = (n: Notifikasi) => {
    setOpen(false);
    if (n.dibaca) return;
    // Tampilan diperbarui lebih dulu; server menyusul. Gagal tidak mengganggu navigasi.
    setItems((lama) => lama.map((x) => (x.id === n.id ? { ...x, dibaca: true } : x)));
    setBelumDibaca((j) => Math.max(0, j - 1));
    tandaiDibaca([n.id]).then((h) => setBelumDibaca(h.belum_dibaca)).catch(() => muat());
  };

  const bacaSemua = async () => {
    setSibuk(true);
    try {
      const hasil = await tandaiSemuaDibaca();
      setItems((lama) => lama.map((x) => ({ ...x, dibaca: true })));
      setBelumDibaca(hasil.belum_dibaca);
    } catch {
      setError(true);
    } finally {
      setSibuk(false);
    }
  };

  const lencana = belumDibaca > 99 ? "99+" : String(belumDibaca);

  return (
    <div ref={wadah} className="relative">
      <button
        type="button"
        onClick={buka}
        aria-label={belumDibaca > 0 ? `Notifikasi, ${belumDibaca} belum dibaca` : "Notifikasi"}
        aria-haspopup="true"
        aria-expanded={open}
        className="fx-bell relative p-2 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-all duration-300 active:scale-90"
      >
        <Bell className="w-5 h-5" />
        {belumDibaca > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-semibold leading-[18px] text-center ring-2 ring-white">
            {lencana}
          </span>
        )}
      </button>

      {open && (
        <div className="ui-modal absolute right-0 top-full mt-2 w-[22rem] max-w-[calc(100vw-1.5rem)] bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-2">
            <div>
              <span className="text-[13px] font-semibold text-slate-900">Notifikasi</span>
              <span className="ml-2 text-[11px] text-slate-400">{belumDibaca > 0 ? `${belumDibaca} belum dibaca` : "Semua sudah dibaca"}</span>
            </div>
            {belumDibaca > 0 && (
              <button
                type="button"
                onClick={bacaSemua}
                disabled={sibuk}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 hover:text-blue-900 disabled:opacity-60"
              >
                {sibuk ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
                Tandai semua dibaca
              </button>
            )}
          </div>

          {error && (
            <div className="px-4 py-2.5 bg-red-50 border-b border-red-100 text-[11px] text-red-700 flex items-center justify-between gap-2" role="alert">
              Notifikasi gagal dimuat.
              <button type="button" onClick={muat} className="font-medium underline underline-offset-2">Coba lagi</button>
            </div>
          )}

          {!siap && !error && (
            <div className="px-4 py-8 flex items-center justify-center gap-2 text-xs text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" />Memuat...
            </div>
          )}

          {siap && items.length === 0 && (
            <div className="px-4 py-8 flex flex-col items-center text-center">
              <span className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-300 mb-2"><BellOff className="w-5 h-5" /></span>
              <p className="text-xs font-medium text-slate-600">Belum ada notifikasi</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Perubahan status tiket Anda akan muncul di sini.</p>
            </div>
          )}

          {items.length > 0 && (
            <ul className="max-h-96 overflow-y-auto divide-y divide-slate-100">
              {items.map((n) => {
                const { icon: Ikon, tone } = (n.aksi && IKON[n.aksi]) || IKON.submitted;
                const tujuan = n.id_permintaan !== null ? hrefTiket(n.id_permintaan) : null;
                const isi = (
                  <>
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${tone}`}><Ikon className="w-4 h-4" /></span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-xs truncate ${n.dibaca ? "font-medium text-slate-700" : "font-semibold text-slate-900"}`}>{n.judul}</span>
                      <span className="block text-[11.5px] text-slate-500 leading-snug line-clamp-2">{n.pesan}</span>
                      <span className="block text-[11px] text-slate-400 mt-0.5">{waktuRelatif(n.dibuat_pada)}</span>
                    </span>
                    {!n.dibaca && <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-600 shrink-0" aria-label="Belum dibaca" />}
                  </>
                );
                const kelas = `flex gap-3 px-4 py-3 transition-colors hover:bg-blue-50/60 ${n.dibaca ? "" : "bg-blue-50/40"}`;
                return (
                  <li key={n.id}>
                    {tujuan ? (
                      <Link href={tujuan} onClick={() => bacaSatu(n)} className={kelas}>{isi}</Link>
                    ) : (
                      <button type="button" onClick={() => bacaSatu(n)} className={`${kelas} w-full text-left`}>{isi}</button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
