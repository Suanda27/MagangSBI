"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  BadgeCheck,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Pause,
  Play,
  PlusSquare,
  Search,
  SearchX,
  XCircle,
} from "lucide-react";
import PageHeader from "@/components/employee/page-header";
import { errorMessage } from "@/lib/api/errors";
import { getRiwayat, POLA_BULAN, type KejadianRiwayat } from "@/lib/api/riwayat";
import type { Halaman } from "@/lib/api/permintaan";
import type { AksiRiwayat, StatusTiket } from "@/lib/api/types";
import { formatTanggalWaktu } from "@/lib/auth/user-display";

const dl = (ms: number) => ({ "--delay": `${ms}ms` } as React.CSSProperties);

const PER_PAGE = 10;

/** Ikon dan warna tiap jenis kejadian. */
const TAMPIL: Record<AksiRiwayat, { icon: typeof Check; ring: string; badge: string }> = {
  submitted: { icon: PlusSquare, ring: "bg-amber-50 text-amber-600 border-amber-200", badge: "bg-amber-50 text-amber-700 border-amber-100" },
  accepted: { icon: Play, ring: "bg-blue-50 text-blue-600 border-blue-200", badge: "bg-blue-50 text-blue-700 border-blue-100" },
  rejected: { icon: XCircle, ring: "bg-rose-50 text-rose-600 border-rose-200", badge: "bg-rose-50 text-rose-700 border-rose-100" },
  paused: { icon: Pause, ring: "bg-slate-100 text-slate-500 border-slate-200", badge: "bg-slate-100 text-slate-600 border-slate-200" },
  resumed: { icon: Play, ring: "bg-blue-50 text-blue-600 border-blue-200", badge: "bg-blue-50 text-blue-700 border-blue-100" },
  result_sent: { icon: Check, ring: "bg-violet-50 text-violet-600 border-violet-200", badge: "bg-violet-50 text-violet-700 border-violet-100" },
  revision_requested: { icon: AlertTriangle, ring: "bg-amber-50 text-amber-600 border-amber-200", badge: "bg-amber-50 text-amber-700 border-amber-100" },
  approved: { icon: BadgeCheck, ring: "bg-emerald-50 text-emerald-600 border-emerald-200", badge: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  auto_closed: { icon: Clock, ring: "bg-slate-100 text-slate-500 border-slate-200", badge: "bg-slate-100 text-slate-600 border-slate-200" },
};

const STATUS_PILIHAN: { value: StatusTiket | ""; label: string }[] = [
  { value: "", label: "Semua Status" },
  { value: "submitted", label: "Diajukan" },
  { value: "in_progress", label: "Sedang Diproses" },
  { value: "pending", label: "Pending" },
  { value: "waiting_review", label: "Menunggu Konfirmasi" },
  { value: "completed", label: "Selesai" },
  { value: "rejected", label: "Ditolak" },
];

const selectCls =
  "appearance-none h-10 pl-3 pr-9 rounded-lg bg-white border border-slate-200 text-[13px] text-slate-700 hover:border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300";

/** Hasil satu permintaan, ditandai kunci filternya agar jawaban lama tidak menimpa yang baru. */
type Hasil = { kunci: string; halaman?: Halaman<KejadianRiwayat>; error?: string };

export default function RiwayatPage() {
  const [query, setQuery] = useState("");
  const [kataKunci, setKataKunci] = useState(""); // query yang sudah ditunda (debounce)
  const [status, setStatus] = useState<StatusTiket | "">("");
  const [bulan, setBulan] = useState("");
  const [page, setPage] = useState(1);
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const [ulang, setUlang] = useState(0);

  // Bulan yang belum utuh (sedang diketik) tidak dikirim ke server.
  const bulanSah = POLA_BULAN.test(bulan) ? bulan : "";
  const bulanSalah = bulan !== "" && bulanSah === "";

  const kunci = `${status}|${bulanSah}|${kataKunci}|${page}|${ulang}`;
  const memuat = hasil?.kunci !== kunci;

  // Tunda pencarian agar tidak memanggil API di setiap ketikan.
  useEffect(() => {
    const t = setTimeout(() => setKataKunci(query), 400);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    let dibatalkan = false;
    getRiwayat({ status, bulan: bulanSah, q: kataKunci, page, per_page: PER_PAGE })
      .then((halaman) => {
        if (!dibatalkan) setHasil({ kunci, halaman });
      })
      .catch((err) => {
        if (!dibatalkan) setHasil({ kunci, error: errorMessage(err, "Riwayat gagal dimuat.") });
      });
    return () => {
      dibatalkan = true;
    };
  }, [kunci, status, bulanSah, kataKunci, page]);

  const halaman = hasil?.halaman;
  const items = halaman?.data ?? [];
  const meta = halaman?.meta;
  const adaFilter = status !== "" || bulanSah !== "" || kataKunci.trim() !== "";

  return (
    <>
      <PageHeader title="Riwayat" description="Lacak semua aktivitas permintaan layanan Anda.">
        <div className="group/search relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none transition-colors group-focus-within/search:text-blue-600" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Cari nomor tiket atau judul..."
            aria-label="Cari riwayat"
            className="h-10 w-44 sm:w-56 focus:sm:w-64 pl-9 pr-3 rounded-lg bg-white border border-slate-200 text-[13px] placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-500"
          />
        </div>
        <div className="relative">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as StatusTiket | "");
              setPage(1);
            }}
            aria-label="Filter status"
            className={selectCls}
          >
            {STATUS_PILIHAN.map((s) => <option key={s.value || "semua"} value={s.value}>{s.label}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative">
          <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="month"
            value={bulan}
            onChange={(e) => {
              setBulan(e.target.value);
              setPage(1);
            }}
            aria-label="Filter bulan"
            placeholder="YYYY-MM"
            className={`h-10 w-44 pl-9 pr-3 rounded-lg bg-white border text-[13px] text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 ${bulanSalah ? "border-red-400" : "border-slate-200"}`}
          />
        </div>
      </PageHeader>

      {bulanSalah && <p className="-mt-3 text-xs text-red-600 font-medium">Format bulan harus YYYY-MM, misalnya 2026-11.</p>}

      {hasil?.error && !memuat && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between gap-3 text-xs text-red-700" role="alert">
          <span className="flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{hasil.error}</span>
          <button type="button" onClick={() => setUlang((n) => n + 1)} className="font-medium underline underline-offset-2 hover:text-red-900">Coba lagi</button>
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 sm:p-7">
        {memuat && !halaman && (
          <div className="py-12 flex items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Memuat riwayat...
          </div>
        )}

        {halaman && items.length === 0 && (
          <div className="py-12 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-300 mb-3"><SearchX className="w-7 h-7" /></div>
            <p className="text-sm font-medium text-slate-700">{adaFilter ? "Tidak ada aktivitas ditemukan" : "Belum ada aktivitas"}</p>
            <p className="text-xs text-slate-400 mt-1">{adaFilter ? "Coba ubah filter atau kata kunci." : "Aktivitas muncul setelah Anda mengajukan permintaan."}</p>
          </div>
        )}

        {items.length > 0 && (
          <ol className={`relative ml-5 border-l-2 border-slate-100 space-y-7 transition-opacity duration-200 ${memuat ? "opacity-50" : ""}`}>
            {items.map((h, i) => {
              const s = TAMPIL[h.aksi] ?? TAMPIL.submitted;
              const Icon = s.icon;
              return (
                <li key={h.id} className="fx-reveal-x relative pl-8" style={dl(80 + i * 60)}>
                  <span className={`absolute -left-[19px] top-0 w-9 h-9 rounded-full border-2 ring-4 ring-white flex items-center justify-center ${s.ring}`}>
                    <Icon className="w-[18px] h-[18px]" />
                  </span>
                  <Link
                    href={`/employee/permintaan-saya/${h.tiket.id}`}
                    className="group block rounded-xl border border-slate-200 p-4 hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3 text-xs">
                        <span className="font-medium text-slate-500">{h.tiket.kode_tiket}</span>
                        <span className="text-slate-400">{formatTanggalWaktu(h.waktu)}</span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full border text-[11.5px] font-medium ${s.badge}`}>{h.status_label}</span>
                    </div>
                    <h3 className="mt-2 text-sm font-semibold text-slate-900 group-hover:text-blue-900">{h.judul}</h3>
                    <p className="mt-0.5 text-[13px] text-slate-600">
                      {h.tiket.judul}
                      {h.tiket.layanan ? <span className="text-slate-400"> • {h.tiket.layanan}</span> : null}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">oleh {h.pelaku}</p>
                    {h.keterangan && <p className="mt-1.5 text-[13px] text-slate-500 italic leading-relaxed whitespace-pre-line">&ldquo;{h.keterangan}&rdquo;</p>}
                  </Link>
                </li>
              );
            })}
          </ol>
        )}

        {meta && meta.total > 0 && (
          <div className="mt-7 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <span>Menampilkan {meta.from ?? 0} - {meta.to ?? 0} dari {meta.total} aktivitas</span>
            <div className="flex items-center gap-1">
              <button type="button" disabled={meta.current_page <= 1} onClick={() => setPage(meta.current_page - 1)} className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed" aria-label="Sebelumnya"><ChevronLeft className="w-4 h-4" /></button>
              <span className="px-3 text-[12px] font-medium text-slate-600">Halaman {meta.current_page} dari {meta.last_page}</span>
              <button type="button" disabled={meta.current_page >= meta.last_page} onClick={() => setPage(meta.current_page + 1)} className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed" aria-label="Berikutnya"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
