"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ChevronLeft, ChevronRight, Eye, Loader2, PlusCircle, Search, SearchX } from "lucide-react";
import PageHeader from "@/components/employee/page-header";
import StatusTiketBadge from "@/components/employee/status-tiket-badge";
import { getDashboardKaryawan } from "@/lib/api/dashboard";
import { errorMessage } from "@/lib/api/errors";
import { getDaftarPermintaan, type Halaman, type PermintaanItem } from "@/lib/api/permintaan";
import type { StatusTiket } from "@/lib/api/types";
import { formatTanggal } from "@/lib/auth/user-display";

const dl = (ms: number) => ({ "--delay": `${ms}ms` } as React.CSSProperties);

const PER_PAGE = 10;

type Tab = "" | StatusTiket;
const TABS: { value: Tab; label: string }[] = [
  { value: "", label: "Semua" },
  { value: "submitted", label: "Diajukan" },
  { value: "in_progress", label: "Diproses" },
  { value: "pending", label: "Pending" },
  { value: "waiting_review", label: "Menunggu Konfirmasi" },
  { value: "completed", label: "Selesai" },
  { value: "rejected", label: "Ditolak" },
];

/** Hasil satu permintaan, ditandai kunci filternya agar jawaban lama tidak menimpa yang baru. */
type Hasil = { kunci: string; halaman?: Halaman<PermintaanItem>; error?: string };

export default function PermintaanSayaPage() {
  const [tab, setTab] = useState<Tab>("");
  const [query, setQuery] = useState("");
  const [kataKunci, setKataKunci] = useState(""); // query yang sudah ditunda (debounce)
  const [page, setPage] = useState(1);
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const [hitung, setHitung] = useState<Record<string, number> | null>(null);
  const [ulang, setUlang] = useState(0);

  const kunci = `${tab}|${kataKunci}|${page}|${ulang}`;
  const memuat = hasil?.kunci !== kunci;

  // Tunda pencarian agar tidak memanggil API di setiap ketikan.
  useEffect(() => {
    const t = setTimeout(() => setKataKunci(query), 400);
    return () => clearTimeout(t);
  }, [query]);

  // Jumlah per status untuk lencana pada tab (dari dashboard).
  useEffect(() => {
    let dibatalkan = false;
    getDashboardKaryawan()
      .then((d) => {
        if (!dibatalkan) setHitung({ "": d.total, ...d.per_status });
      })
      .catch(() => {});
    return () => {
      dibatalkan = true;
    };
  }, []);

  useEffect(() => {
    let dibatalkan = false;
    getDaftarPermintaan({ status: tab, q: kataKunci, page, per_page: PER_PAGE })
      .then((halaman) => {
        if (!dibatalkan) setHasil({ kunci, halaman });
      })
      .catch((err) => {
        if (!dibatalkan) setHasil({ kunci, error: errorMessage(err, "Daftar permintaan gagal dimuat.") });
      });
    return () => {
      dibatalkan = true;
    };
  }, [kunci, tab, kataKunci, page]);

  const halaman = hasil?.halaman;
  const rows = halaman?.data ?? [];
  const meta = halaman?.meta;
  const adaFilter = tab !== "" || kataKunci.trim() !== "";

  const gantiTab = (t: Tab) => {
    setTab(t);
    setPage(1);
  };

  return (
    <>
      <PageHeader title="Permintaan Saya" description="Kelola dan pantau status permintaan layanan Anda.">
        <Link
          href="/employee/pengajuan-layanan"
          className="group fx-shine inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-gradient-to-r from-blue-800 to-blue-600 text-white text-[13px] font-medium shadow-sm shadow-blue-800/30 hover:shadow-lg hover:-translate-y-0.5"
        >
          <PlusCircle className="w-[17px] h-[17px] transition-transform duration-500 group-hover:rotate-90" />
          Buat Permintaan Baru
        </Link>
      </PageHeader>

      <section className="fx-reveal flex flex-col xl:flex-row xl:items-center justify-between gap-4" style={dl(80)}>
        <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-white border border-slate-200 shadow-sm w-fit">
          {TABS.map((t) => (
            <button
              key={t.value || "semua"}
              type="button"
              onClick={() => gantiTab(t.value)}
              className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-300 ${
                tab === t.value ? "bg-blue-700 text-white shadow-sm shadow-blue-700/30" : "text-slate-600 hover:bg-blue-50 hover:text-blue-900"
              }`}
            >
              {t.label}
              {hitung && <span className={`ml-1.5 text-[11px] ${tab === t.value ? "text-blue-100" : "text-slate-400"}`}>{hitung[t.value] ?? 0}</span>}
            </button>
          ))}
        </div>

        <div className="group/search relative w-full xl:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none transition-colors group-focus-within/search:text-blue-600" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Cari nomor tiket atau judul..."
            aria-label="Cari permintaan"
            className="w-full h-10 pl-9 pr-3 rounded-lg bg-white border border-slate-200 text-[13px] placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
          />
        </div>
      </section>

      {hasil?.error && !memuat && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between gap-3 text-xs text-red-700" role="alert">
          <span className="flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{hasil.error}</span>
          <button type="button" onClick={() => setUlang((n) => n + 1)} className="font-medium underline underline-offset-2 hover:text-red-900">Coba lagi</button>
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className={`overflow-x-auto transition-opacity duration-200 ${memuat && halaman ? "opacity-50" : ""}`}>
          <table className="w-full text-left text-[13px] min-w-[820px]">
            <thead className="bg-slate-50/70 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 font-medium">Nomor Tiket</th>
                <th className="px-5 py-3 font-medium">Judul</th>
                <th className="px-5 py-3 font-medium">Layanan</th>
                <th className="px-5 py-3 font-medium">Urgensi</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Diajukan</th>
                <th className="px-5 py-3 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((t) => (
                <tr key={t.id}>
                  <td className="px-5 py-3.5 font-medium text-slate-900">{t.kode_tiket}</td>
                  <td className="px-5 py-3.5 text-slate-800 max-w-[260px] truncate">{t.judul}</td>
                  <td className="px-5 py-3.5 text-slate-600">{t.layanan?.nama_layanan ?? "-"}</td>
                  <td className="px-5 py-3.5 text-slate-500">{t.prioritas_label}</td>
                  <td className="px-5 py-3.5"><StatusTiketBadge status={t.status} label={t.status_label} /></td>
                  <td className="px-5 py-3.5 text-slate-500">{formatTanggal(t.dibuat_pada)}</td>
                  <td className="px-5 py-3.5 text-right">
                    <Link href={`/employee/permintaan-saya/${t.id}`} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-medium text-slate-600 hover:text-blue-700 hover:bg-blue-50">
                      <Eye className="w-4 h-4" />Detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {memuat && !halaman && (
          <div className="py-14 flex items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Memuat permintaan...
          </div>
        )}

        {halaman && rows.length === 0 && (
          <div className="py-14 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-300 mb-3"><SearchX className="w-7 h-7" /></div>
            <p className="text-sm font-medium text-slate-700">
              {adaFilter ? "Tidak ada permintaan ditemukan" : "Anda belum pernah mengajukan permintaan"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {adaFilter ? "Coba ubah filter atau kata kunci pencarian." : "Buat permintaan baru untuk memulai."}
            </p>
          </div>
        )}

        {meta && meta.total > 0 && (
          <div className="px-5 py-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <span>
              Menampilkan {meta.from ?? 0} - {meta.to ?? 0} dari {meta.total} data
            </span>
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
