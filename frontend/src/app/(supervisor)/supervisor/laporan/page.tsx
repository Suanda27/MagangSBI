"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  BarChart3,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Filter,
  FolderOpen,
  Loader2,
  Printer,
  Repeat2,
  RotateCcw,
  SearchX,
  ThumbsUp,
} from "lucide-react";
import { CountUp, FxCard } from "@/components/fx/motion";
import PageHeader from "@/components/supervisor/page-header";
import ReadOnlyBadge from "@/components/supervisor/read-only-badge";
import { DonutChart, HBarList, TrendBars } from "@/components/supervisor/charts";
import StatusTiketBadge from "@/components/employee/status-tiket-badge";
import { errorMessage } from "@/lib/api/errors";
import { getLaporanSupervisor, type LaporanSupervisor } from "@/lib/api/laporan";
import { getLayanan } from "@/lib/api/pengajuan";
import type { KategoriLayanan, StatusTiket } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";
import { formatDurasiJam, formatTanggal } from "@/lib/auth/user-display";

const dl = (ms: number) => ({ "--delay": `${ms}ms` } as React.CSSProperties);

const PER_PAGE = 15;
const POLA_TANGGAL = /^\d{4}-\d{2}-\d{2}$/;

const STATUS: { value: StatusTiket; label: string; warna: string }[] = [
  { value: "submitted", label: "Menunggu Pemeriksaan", warna: "#38bdf8" },
  { value: "in_progress", label: "Sedang Diproses", warna: "#6366f1" },
  { value: "pending", label: "Pending", warna: "#f59e0b" },
  { value: "waiting_review", label: "Menunggu Konfirmasi", warna: "#8b5cf6" },
  { value: "completed", label: "Selesai", warna: "#10b981" },
  { value: "rejected", label: "Ditolak", warna: "#f43f5e" },
];

const GRANULARITAS = { hari: "Harian", minggu: "Mingguan", bulan: "Bulanan" } as const;

const inputCls =
  "w-full h-10 px-3 rounded-lg bg-white border text-[13px] text-slate-700 hover:border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300";
const labelCls = "block text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5";

const dua = (n: number) => String(n).padStart(2, "0");
/** Tanggal lokal browser sebagai YYYY-MM-DD. */
const iso = (d: Date) => `${d.getFullYear()}-${dua(d.getMonth() + 1)}-${dua(d.getDate())}`;

/** Hasil satu permintaan, ditandai kunci filternya agar jawaban lama tidak menimpa yang baru. */
type Hasil = { kunci: string; laporan?: LaporanSupervisor; error?: string };

export default function LaporanPage() {
  const { user } = useAuth();
  const idBagian = user?.bagian?.id ?? null;

  const [dari, setDari] = useState("");
  const [sampai, setSampai] = useState("");
  const [status, setStatus] = useState<StatusTiket | "">("");
  const [layanan, setLayanan] = useState<number | "">("");
  const [page, setPage] = useState(1);
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const [ulang, setUlang] = useState(0);
  const [kategori, setKategori] = useState<KategoriLayanan[]>([]);

  // Tanggal yang belum utuh atau terbalik tidak dikirim ke server.
  const dariSah = POLA_TANGGAL.test(dari) ? dari : "";
  const sampaiSah = POLA_TANGGAL.test(sampai) ? sampai : "";
  const terbalik = dariSah !== "" && sampaiSah !== "" && dariSah > sampaiSah;
  const dariKirim = terbalik ? "" : dariSah;
  const sampaiKirim = terbalik ? "" : sampaiSah;

  const kunci = `${status}|${layanan}|${dariKirim}|${sampaiKirim}|${page}|${ulang}`;
  const memuat = hasil?.kunci !== kunci;

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
    getLaporanSupervisor({ status, layanan, dari: dariKirim, sampai: sampaiKirim, page, per_page: PER_PAGE })
      .then((laporan) => {
        if (!dibatalkan) setHasil({ kunci, laporan });
      })
      .catch((err) => {
        if (!dibatalkan) setHasil({ kunci, error: errorMessage(err, "Laporan gagal dimuat.") });
      });
    return () => {
      dibatalkan = true;
    };
  }, [kunci, status, layanan, dariKirim, sampaiKirim, page]);

  const atur = (d: string, s: string) => {
    setDari(d);
    setSampai(s);
    setPage(1);
  };
  const bulanIni = () => {
    const n = new Date();
    atur(iso(new Date(n.getFullYear(), n.getMonth(), 1)), iso(n));
  };
  const tigaPuluhHari = () => {
    const n = new Date();
    atur(iso(new Date(n.getFullYear(), n.getMonth(), n.getDate() - 29)), iso(n));
  };
  const tahunIni = () => {
    const n = new Date();
    atur(iso(new Date(n.getFullYear(), 0, 1)), iso(n));
  };
  const reset = () => {
    setDari("");
    setSampai("");
    setStatus("");
    setLayanan("");
    setPage(1);
  };

  const laporan = hasil?.laporan;
  const r = laporan?.ringkasan;
  const rows = laporan?.data ?? [];
  const meta = laporan?.meta;
  const adaFilter = status !== "" || layanan !== "" || dariKirim !== "" || sampaiKirim !== "";

  const periode =
    dariKirim || sampaiKirim
      ? `${dariKirim ? formatTanggal(`${dariKirim}T00:00:00`) : "Awal"} - ${sampaiKirim ? formatTanggal(`${sampaiKirim}T00:00:00`) : "Sekarang"}`
      : "Seluruh periode";

  const donut = STATUS.map((s) => ({ label: s.label, value: r?.per_status[s.value] ?? 0, color: s.warna })).filter((d) => d.value > 0);
  const persenSelesai = r && r.total > 0 ? Math.round((r.per_status.completed / r.total) * 1000) / 10 : null;
  const koma = (n: number) => String(n).replace(".", ",");

  const cards = [
    { label: "Total Permintaan", value: r?.total ?? 0, teks: null, note: `Seluruh tiket • ${periode}`, icon: FolderOpen, tone: "text-blue-700 bg-blue-50" },
    { label: "Selesai", value: r?.per_status.completed ?? 0, teks: null, note: persenSelesai !== null ? `${koma(persenSelesai)}% dari total tiket` : "Belum ada tiket", icon: CheckCircle2, tone: "text-emerald-600 bg-emerald-50" },
    { label: "Rata-rata Durasi", value: 0, teks: r ? formatDurasiJam(r.selesai.rata_rata_jam) : "-", note: "Diajukan sampai selesai", icon: Clock, tone: "text-sky-600 bg-sky-50" },
    { label: "Rata-rata Revisi", value: 0, teks: r?.rata_revisi != null ? koma(r.rata_revisi) : r ? "Belum ada data" : "-", note: "Per tiket", icon: Repeat2, tone: "text-amber-600 bg-amber-50" },
    { label: "Tanpa Revisi", value: 0, teks: r?.selesai.tanpa_revisi_persen != null ? `${r.selesai.tanpa_revisi_persen}%` : r ? "Belum ada data" : "-", note: "Dari tiket yang selesai", icon: ThumbsUp, tone: "text-violet-600 bg-violet-50" },
    { label: "Ditutup Otomatis", value: r?.ditutup_otomatis ?? 0, teks: null, note: "Tanpa tanggapan karyawan", icon: Bot, tone: "text-slate-600 bg-slate-100" },
  ];

  return (
    <>
      <PageHeader title="Laporan & Rekapitulasi Layanan" description="Analisis volume dan penyelesaian tiket pada section yang Anda supervisi.">
        <ReadOnlyBadge label="Supervisor (Read-Only)" />
        <button
          type="button"
          onClick={() => window.print()}
          className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-[13px] font-medium text-slate-700 hover:border-blue-200 hover:text-blue-900 print:hidden"
        >
          <Printer className="w-4 h-4" />Cetak
        </button>
      </PageHeader>

      {/* Filter */}
      <section className="fx-reveal rounded-xl border border-slate-200 bg-white shadow-sm print:hidden" style={dl(60)}>
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[14px] font-semibold text-slate-900"><Filter className="w-4 h-4 text-blue-700" />Filter Parameter Laporan</div>
          <span className="text-xs text-slate-400 hidden sm:block">Cakupan: {user?.bagian?.nama_bagian ?? "section Anda"}</span>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="dari" className={labelCls}>Dari Tanggal</label>
            <input id="dari" type="date" value={dari} max={sampaiSah || undefined} onChange={(e) => { setDari(e.target.value); setPage(1); }} className={`${inputCls} ${terbalik ? "border-red-400" : "border-slate-200"}`} />
          </div>
          <div>
            <label htmlFor="sampai" className={labelCls}>Sampai Tanggal</label>
            <input id="sampai" type="date" value={sampai} min={dariSah || undefined} onChange={(e) => { setSampai(e.target.value); setPage(1); }} className={`${inputCls} ${terbalik ? "border-red-400" : "border-slate-200"}`} />
          </div>
          <div>
            <label htmlFor="status" className={labelCls}>Status</label>
            <div className="relative">
              <select id="status" value={status} onChange={(e) => { setStatus(e.target.value as StatusTiket | ""); setPage(1); }} className={`${inputCls} appearance-none pr-9 border-slate-200`}>
                <option value="">Semua Status</option>
                {STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
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
        </div>
        <div className="px-5 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 mr-1">Pintasan:</span>
            {[
              { l: "Bulan Ini", f: bulanIni },
              { l: "30 Hari Terakhir", f: tigaPuluhHari },
              { l: "Tahun Ini", f: tahunIni },
            ].map((p) => (
              <button key={p.l} type="button" onClick={p.f} className="px-2.5 py-1 rounded-md bg-slate-100 text-[12px] font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-800 transition-colors">{p.l}</button>
            ))}
            {terbalik && <span className="text-xs text-red-600 font-medium ml-1">Tanggal akhir tidak boleh sebelum tanggal awal.</span>}
          </div>
          <button type="button" onClick={reset} className="group inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-[13px] font-medium text-slate-700 hover:border-blue-200 hover:text-blue-900">
            <RotateCcw className="w-4 h-4 transition-transform duration-500 group-hover:-rotate-180" />Reset
          </button>
        </div>
      </section>

      {hasil?.error && !memuat && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between gap-3 text-xs text-red-700 print:hidden" role="alert">
          <span className="flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{hasil.error}</span>
          <button type="button" onClick={() => setUlang((n) => n + 1)} className="font-medium underline underline-offset-2 hover:text-red-900">Coba lagi</button>
        </div>
      )}

      {memuat && !laporan && (
        <div className="py-20 flex items-center justify-center gap-2 text-sm text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" />Memuat laporan...
        </div>
      )}

      {laporan && r && (
        <div className={`grid gap-6 transition-opacity duration-200 ${memuat ? "opacity-50" : ""}`}>
          {/* Kartu */}
          <section className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((c, i) => (
              <FxCard key={c.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-medium text-slate-500">{c.label}</span>
                  <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${c.tone}`}><c.icon className="w-[18px] h-[18px]" /></span>
                </div>
                <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                  {c.teks !== null ? <span className={c.teks === "Belum ada data" ? "text-lg text-slate-400" : "text-2xl"}>{c.teks}</span> : <CountUp value={c.value} delay={200 + i * 90} />}
                </div>
                <p className="mt-1 text-xs text-slate-400 truncate">{c.note}</p>
              </FxCard>
            ))}
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribusi status */}
            <section className="fx-reveal rounded-xl border border-slate-200 bg-white shadow-sm p-5" style={dl(200)}>
              <div className="flex items-start justify-between gap-2">
                <div><h2 className="text-[15px] font-semibold text-slate-900">Permintaan Berdasarkan Status</h2><p className="text-xs text-slate-400 mt-0.5">Distribusi proporsi pengerjaan tiket</p></div>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 shrink-0">{periode}</span>
              </div>
              {r.total === 0 ? (
                <p className="mt-10 mb-6 text-center text-sm text-slate-400">Belum ada tiket pada periode ini.</p>
              ) : (
                <div className="mt-6 flex flex-col xl:flex-row items-center gap-6 xl:gap-8">
                  <DonutChart key={kunci} data={donut} centerLabel="Total Tiket" />
                  <ul className="flex-1 w-full min-w-0 grid gap-3">
                    {STATUS.map((s) => {
                      const n = r.per_status[s.value];
                      return (
                        <li key={s.value} className={`flex items-center justify-between gap-2 text-[13px] ${n === 0 ? "opacity-50" : ""}`}>
                          <span className="inline-flex items-center gap-2 min-w-0 text-slate-600"><span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.warna }} /><span className="truncate">{s.label}</span></span>
                          <span className="font-medium text-slate-800 shrink-0 whitespace-nowrap">{n} <span className="text-slate-400 font-normal">({koma(Math.round((n / r.total) * 1000) / 10)}%)</span></span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </section>

            {/* Per kategori */}
            <section className="fx-reveal rounded-xl border border-slate-200 bg-white shadow-sm p-5" style={dl(280)}>
              <div className="flex items-start justify-between">
                <div><h2 className="text-[15px] font-semibold text-slate-900">Volume Permintaan per Kategori</h2><p className="text-xs text-slate-400 mt-0.5">Perbandingan beban antar kategori layanan</p></div>
                <BarChart3 className="w-5 h-5 text-slate-300" />
              </div>
              {r.per_kategori.length === 0 ? (
                <p className="mt-10 mb-6 text-center text-sm text-slate-400">Belum ada data.</p>
              ) : (
                <div className="mt-6" key={kunci}>
                  <HBarList data={r.per_kategori.map((k) => ({ label: k.kategori, value: k.jumlah }))} />
                </div>
              )}
            </section>
          </div>

          {/* Tren */}
          <section className="fx-reveal rounded-xl border border-slate-200 bg-white shadow-sm p-5" style={dl(340)}>
            <div className="flex items-start justify-between mb-6 gap-2">
              <div><h2 className="text-[15px] font-semibold text-slate-900">Tren Permintaan {GRANULARITAS[r.granularitas]}</h2><p className="text-xs text-slate-400 mt-0.5">Tiket yang diajukan pada periode itu, dan berapa yang sudah selesai</p></div>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 shrink-0">{periode}</span>
            </div>
            {r.tren.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-400">Belum ada data tren.</p>
            ) : (
              <TrendBars key={kunci} data={r.tren.map((t) => ({ label: t.label, masuk: t.diajukan, selesai: t.selesai }))} />
            )}
          </section>

          {/* Rekap per layanan */}
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div><h2 className="text-[15px] font-semibold text-slate-900">Rekapitulasi per Layanan</h2><p className="text-xs text-slate-400 mt-0.5">Volume tiket tiap layanan</p></div>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{r.per_layanan.length} layanan</span>
            </div>
            {r.per_layanan.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-400">Belum ada data.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px] min-w-[560px]">
                  <thead className="bg-slate-50/70 text-slate-500 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="px-5 py-3 font-medium">Layanan</th>
                      <th className="px-5 py-3 font-medium">Kategori</th>
                      <th className="px-5 py-3 font-medium text-right">Total</th>
                      <th className="px-5 py-3 font-medium w-56">Porsi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {r.per_layanan.map((l) => {
                      const pct = r.total > 0 ? Math.round((l.jumlah / r.total) * 100) : 0;
                      return (
                        <tr key={l.id}>
                          <td className="px-5 py-3.5 font-medium text-slate-800">{l.nama_layanan}</td>
                          <td className="px-5 py-3.5"><span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">{l.kategori}</span></td>
                          <td className="px-5 py-3.5 text-right text-slate-700">{l.jumlah}</td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className="fx-bar h-full rounded-full bg-gradient-to-r from-blue-700 to-emerald-500" style={{ width: `${pct}%`, ...dl(300) }} /></div>
                              <span className="text-xs font-medium text-slate-600 w-9 text-right">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Daftar tiket */}
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div><h2 className="text-[15px] font-semibold text-slate-900">Daftar Tiket pada Laporan</h2><p className="text-xs text-slate-400 mt-0.5">Seluruh tiket yang masuk dalam filter di atas</p></div>
              {meta && <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{meta.total} tiket</span>}
            </div>

            {rows.length === 0 ? (
              <div className="py-14 flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-300 mb-3"><SearchX className="w-7 h-7" /></div>
                <p className="text-sm font-medium text-slate-700">{adaFilter ? "Tidak ada tiket yang sesuai" : "Belum ada tiket untuk section Anda"}</p>
                <p className="text-xs text-slate-400 mt-1">{adaFilter ? "Coba ubah atau reset filter laporan." : "Tiket akan muncul setelah karyawan mengajukannya."}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px] min-w-[900px]">
                  <thead className="bg-slate-50/70 text-slate-500 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="px-5 py-3 font-medium">Nomor Tiket</th>
                      <th className="px-5 py-3 font-medium">Judul &amp; Layanan</th>
                      <th className="px-5 py-3 font-medium">Pengaju</th>
                      <th className="px-5 py-3 font-medium">PIC</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Diajukan</th>
                      <th className="px-5 py-3 font-medium text-right print:hidden">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((t) => (
                      <tr key={t.id}>
                        <td className="px-5 py-3.5 font-medium text-slate-900">{t.kode_tiket}</td>
                        <td className="px-5 py-3.5 max-w-[260px]">
                          <p className="text-slate-800 truncate">{t.judul}</p>
                          <p className="text-xs text-slate-400 truncate">{t.layanan?.nama_layanan ?? "-"}</p>
                        </td>
                        <td className="px-5 py-3.5 text-slate-700">{t.pengaju ?? "-"}</td>
                        <td className="px-5 py-3.5 text-slate-700">{t.pic ?? <span className="text-xs italic text-slate-400">Belum ada</span>}</td>
                        <td className="px-5 py-3.5"><StatusTiketBadge status={t.status} label={t.status_label} /></td>
                        <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">{formatTanggal(t.dibuat_pada)}</td>
                        <td className="px-5 py-3.5 text-right print:hidden">
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

            {meta && meta.total > 0 && (
              <div className="px-5 py-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 print:hidden">
                <span>Menampilkan {meta.from ?? 0} - {meta.to ?? 0} dari {meta.total} tiket</span>
                <div className="flex items-center gap-1">
                  <button type="button" disabled={meta.current_page <= 1} onClick={() => setPage(meta.current_page - 1)} className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed" aria-label="Sebelumnya"><ChevronLeft className="w-4 h-4" /></button>
                  <span className="px-3 text-[12px] font-medium text-slate-600">Halaman {meta.current_page} dari {meta.last_page}</span>
                  <button type="button" disabled={meta.current_page >= meta.last_page} onClick={() => setPage(meta.current_page + 1)} className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed" aria-label="Berikutnya"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
