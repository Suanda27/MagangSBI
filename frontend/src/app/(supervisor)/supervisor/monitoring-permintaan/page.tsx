"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  SearchX,
  UserRound,
} from "lucide-react";
import { CountUp, FxCard } from "@/components/fx/motion";
import PageHeader from "@/components/supervisor/page-header";
import ReadOnlyBadge from "@/components/supervisor/read-only-badge";
import StatusTiketBadge from "@/components/employee/status-tiket-badge";
import { getDashboardSupervisor } from "@/lib/api/dashboard";
import { errorMessage } from "@/lib/api/errors";
import { getMonitoring, type TiketMonitoring } from "@/lib/api/monitoring";
import type { Halaman } from "@/lib/api/permintaan";
import { getLayanan } from "@/lib/api/pengajuan";
import type { DashboardSupervisor, KategoriLayanan, StatusTiket } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";
import { formatTanggal } from "@/lib/auth/user-display";

const dl = (ms: number) => ({ "--delay": `${ms}ms` } as React.CSSProperties);

const PER_PAGE = 10;
const POLA_TANGGAL = /^\d{4}-\d{2}-\d{2}$/;

const STATUS_PILIHAN: { value: StatusTiket | ""; label: string }[] = [
  { value: "", label: "Semua Status" },
  { value: "submitted", label: "Menunggu Pemeriksaan" },
  { value: "in_progress", label: "Sedang Diproses" },
  { value: "pending", label: "Pending" },
  { value: "waiting_review", label: "Menunggu Konfirmasi" },
  { value: "completed", label: "Selesai" },
  { value: "rejected", label: "Ditolak" },
];

const inputCls =
  "w-full h-10 px-3 rounded-lg bg-white border text-[13px] text-slate-700 hover:border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300";
const labelCls = "block text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5";

/** Hasil satu permintaan, ditandai kunci filternya agar jawaban lama tidak menimpa yang baru. */
type Hasil = { kunci: string; halaman?: Halaman<TiketMonitoring>; error?: string };

export default function MonitoringPage() {
  const { user } = useAuth();
  const idBagian = user?.bagian?.id ?? null;

  const [q, setQ] = useState("");
  const [kataKunci, setKataKunci] = useState(""); // q yang sudah ditunda (debounce)
  const [status, setStatus] = useState<StatusTiket | "">("");
  const [layanan, setLayanan] = useState<number | "">("");
  const [dari, setDari] = useState("");
  const [sampai, setSampai] = useState("");
  const [page, setPage] = useState(1);
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const [ulang, setUlang] = useState(0);
  const [kategori, setKategori] = useState<KategoriLayanan[]>([]);
  const [ringkas, setRingkas] = useState<DashboardSupervisor | null>(null);

  // Tanggal yang belum utuh atau terbalik tidak dikirim ke server.
  const dariSah = POLA_TANGGAL.test(dari) ? dari : "";
  const sampaiSah = POLA_TANGGAL.test(sampai) ? sampai : "";
  const rentangTerbalik = dariSah !== "" && sampaiSah !== "" && dariSah > sampaiSah;
  const dariKirim = rentangTerbalik ? "" : dariSah;
  const sampaiKirim = rentangTerbalik ? "" : sampaiSah;

  const kunci = `${status}|${layanan}|${dariKirim}|${sampaiKirim}|${kataKunci}|${page}|${ulang}`;
  const memuat = hasil?.kunci !== kunci;

  // Tunda pencarian agar tidak memanggil API di setiap ketikan.
  useEffect(() => {
    const t = setTimeout(() => setKataKunci(q), 400);
    return () => clearTimeout(t);
  }, [q]);

  // Kartu ringkasan section (tidak terpengaruh filter).
  useEffect(() => {
    let dibatalkan = false;
    getDashboardSupervisor()
      .then((d) => {
        if (!dibatalkan) setRingkas(d);
      })
      .catch(() => {});
    return () => {
      dibatalkan = true;
    };
  }, [ulang]);

  // Pilihan layanan dari section supervisor.
  useEffect(() => {
    if (idBagian === null) return;
    let dibatalkan = false;
    getLayanan(idBagian)
      .then((k) => {
        if (!dibatalkan) setKategori(k);
      })
      .catch(() => {});
    return () => {
      dibatalkan = true;
    };
  }, [idBagian]);

  useEffect(() => {
    let dibatalkan = false;
    getMonitoring({ status, layanan, dari: dariKirim, sampai: sampaiKirim, q: kataKunci, page, per_page: PER_PAGE })
      .then((halaman) => {
        if (!dibatalkan) setHasil({ kunci, halaman });
      })
      .catch((err) => {
        if (!dibatalkan) setHasil({ kunci, error: errorMessage(err, "Daftar tiket gagal dimuat.") });
      });
    return () => {
      dibatalkan = true;
    };
  }, [kunci, status, layanan, dariKirim, sampaiKirim, kataKunci, page]);

  const reset = () => {
    setQ("");
    setKataKunci("");
    setStatus("");
    setLayanan("");
    setDari("");
    setSampai("");
    setPage(1);
  };

  const halaman = hasil?.halaman;
  const rows = halaman?.data ?? [];
  const meta = halaman?.meta;
  const adaFilter = status !== "" || layanan !== "" || dariKirim !== "" || sampaiKirim !== "" || kataKunci.trim() !== "";
  const s = ringkas?.per_status;

  const stats = [
    { label: "Total Dipantau", value: ringkas?.total ?? 0, dot: "bg-blue-500" },
    { label: "Menunggu Pemeriksaan", value: s?.submitted ?? 0, dot: "bg-sky-500" },
    { label: "Sedang Diproses", value: s?.in_progress ?? 0, dot: "bg-indigo-500" },
    { label: "Selesai", value: s?.completed ?? 0, dot: "bg-emerald-500" },
    { label: "Pending", value: s?.pending ?? 0, dot: "bg-amber-500" },
  ];

  return (
    <>
      <PageHeader title="Monitoring Permintaan" description="Pantau status dan perkembangan seluruh permintaan layanan yang ditujukan ke section Anda.">
        <ReadOnlyBadge label="Supervisor (Read-Only)" />
      </PageHeader>

      <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((st, i) => (
          <FxCard key={st.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[12px] font-medium text-slate-500">{st.label}</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-2xl font-semibold tracking-tight text-slate-900"><CountUp value={st.value} delay={150 + i * 80} /></span>
              <span className={`w-2.5 h-2.5 rounded-full ${st.dot} ring-4 ring-white`} />
            </div>
          </FxCard>
        ))}
      </section>

      {/* Filter */}
      <section className="fx-reveal rounded-xl border border-slate-200 bg-white shadow-sm" style={dl(120)}>
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[14px] font-semibold text-slate-900"><Filter className="w-4 h-4 text-blue-700" />Filter Pengawasan Permintaan</div>
          <span className="text-xs text-slate-400 hidden sm:block">Cakupan: {user?.bagian?.nama_bagian ?? "section Anda"}</span>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <label htmlFor="cari" className={labelCls}>Pencarian</label>
            <div className="group/search relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none transition-colors group-focus-within/search:text-blue-600" />
              <input
                id="cari"
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(1); }}
                placeholder="Nomor, judul, atau pengaju..."
                className={`${inputCls} pl-9 border-slate-200 placeholder:text-slate-400`}
              />
            </div>
          </div>
          <div>
            <label htmlFor="status" className={labelCls}>Status</label>
            <div className="relative">
              <select id="status" value={status} onChange={(e) => { setStatus(e.target.value as StatusTiket | ""); setPage(1); }} className={`${inputCls} appearance-none pr-9 border-slate-200`}>
                {STATUS_PILIHAN.map((o) => <option key={o.value || "semua"} value={o.value}>{o.label}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label htmlFor="layanan" className={labelCls}>Layanan</label>
            <div className="relative">
              <select id="layanan" value={layanan} onChange={(e) => { setLayanan(e.target.value ? Number(e.target.value) : ""); setPage(1); }} className={`${inputCls} appearance-none pr-9 border-slate-200`}>
                <option value="">Semua Layanan</option>
                {kategori.map((k) => (
                  <optgroup key={k.kategori} label={k.kategori}>
                    {k.layanan.map((l) => <option key={l.id} value={l.id}>{l.nama_layanan}</option>)}
                  </optgroup>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label htmlFor="dari" className={labelCls}>Dari Tanggal</label>
            <input id="dari" type="date" value={dari} max={sampaiSah || undefined} onChange={(e) => { setDari(e.target.value); setPage(1); }} className={`${inputCls} ${rentangTerbalik ? "border-red-400" : "border-slate-200"}`} />
          </div>
          <div>
            <label htmlFor="sampai" className={labelCls}>Sampai Tanggal</label>
            <input id="sampai" type="date" value={sampai} min={dariSah || undefined} onChange={(e) => { setSampai(e.target.value); setPage(1); }} className={`${inputCls} ${rentangTerbalik ? "border-red-400" : "border-slate-200"}`} />
          </div>
        </div>
        <div className="px-5 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-red-600 font-medium min-h-4">{rentangTerbalik ? "Tanggal akhir tidak boleh sebelum tanggal awal." : ""}</p>
          <button type="button" onClick={reset} className="group inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-[13px] font-medium text-slate-700 hover:border-blue-200 hover:text-blue-900">
            <RotateCcw className="w-4 h-4 transition-transform duration-500 group-hover:-rotate-180" />Reset Filter
          </button>
        </div>
      </section>

      {hasil?.error && !memuat && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between gap-3 text-xs text-red-700" role="alert">
          <span className="flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{hasil.error}</span>
          <button type="button" onClick={() => setUlang((n) => n + 1)} className="font-medium underline underline-offset-2 hover:text-red-900">Coba lagi</button>
        </div>
      )}

      {/* Tabel */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <h2 className="text-[15px] font-semibold text-slate-900">Daftar Tiket Permintaan</h2>
            {meta && <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{meta.total} Tiket Terdata</span>}
          </div>
          <button type="button" onClick={() => setUlang((n) => n + 1)} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-700">
            <RefreshCw className={`w-3.5 h-3.5 ${memuat ? "animate-spin" : ""}`} />Muat ulang
          </button>
        </div>

        {(rows.length > 0 || (memuat && halaman)) && (
          <div className={`overflow-x-auto transition-opacity duration-200 ${memuat ? "opacity-50" : ""}`}>
            <table className="w-full text-left text-[13px] min-w-[960px]">
              <thead className="bg-slate-50/70 text-slate-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-3 font-medium">Nomor Tiket</th>
                  <th className="px-5 py-3 font-medium">Judul &amp; Layanan</th>
                  <th className="px-5 py-3 font-medium">Pengaju</th>
                  <th className="px-5 py-3 font-medium">PIC</th>
                  <th className="px-5 py-3 font-medium">Urgensi</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Diajukan</th>
                  <th className="px-5 py-3 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((t) => (
                  <tr key={t.id}>
                    <td className="px-5 py-3.5">
                      <Link href={`/supervisor/monitoring-permintaan/${t.id}`} className="font-medium text-blue-700 hover:text-blue-900 hover:underline underline-offset-4">{t.kode_tiket}</Link>
                    </td>
                    <td className="px-5 py-3.5 max-w-[260px]">
                      <p className="font-medium text-slate-800 truncate">{t.judul}</p>
                      <p className="text-xs text-slate-400 truncate">{t.layanan?.nama_layanan ?? "-"}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">{t.pengaju ?? "-"}</td>
                    <td className="px-5 py-3.5">
                      {t.pic ? (
                        <span className="inline-flex items-center gap-1.5 text-slate-700"><UserRound className="w-3.5 h-3.5 text-slate-400" />{t.pic}</span>
                      ) : (
                        <span className="text-xs italic text-slate-400">Menunggu alokasi</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{t.prioritas_label}</td>
                    <td className="px-5 py-3.5"><StatusTiketBadge status={t.status} label={t.status_label} /></td>
                    <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">{formatTanggal(t.dibuat_pada)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <Link href={`/supervisor/monitoring-permintaan/${t.id}`} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-medium text-slate-600 hover:text-blue-700 hover:bg-blue-50">
                        <Eye className="w-4 h-4" />Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {memuat && !halaman && (
          <div className="py-14 flex items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" />Memuat tiket...
          </div>
        )}

        {halaman && rows.length === 0 && (
          <div className="py-14 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-300 mb-3"><SearchX className="w-7 h-7" /></div>
            <p className="text-sm font-medium text-slate-700">{adaFilter ? "Tidak ada tiket yang sesuai" : "Belum ada tiket untuk section Anda"}</p>
            <p className="text-xs text-slate-400 mt-1">{adaFilter ? "Coba ubah atau reset filter pencarian." : "Tiket akan muncul setelah karyawan mengajukannya."}</p>
          </div>
        )}

        {meta && meta.total > 0 && (
          <div className="px-5 py-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <span>Menampilkan {meta.from ?? 0} - {meta.to ?? 0} dari {meta.total} tiket</span>
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
