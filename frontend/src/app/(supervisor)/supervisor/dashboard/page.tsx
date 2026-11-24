"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Boxes,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  Info,
  Loader2,
  MailPlus,
  Pause,
  PauseCircle,
  Play,
  Plus,
  RefreshCw,
  Repeat2,
  X,
} from "lucide-react";
import { CountUp, FxCard } from "@/components/fx/motion";
import PageHeader from "@/components/supervisor/page-header";
import ReadOnlyBadge from "@/components/supervisor/read-only-badge";
import StatusTiketBadge from "@/components/employee/status-tiket-badge";
import { getDashboardSupervisor } from "@/lib/api/dashboard";
import { errorMessage } from "@/lib/api/errors";
import type { AksiRiwayat, DashboardSupervisor } from "@/lib/api/types";
import { formatDurasiJam, formatTanggal, formatTanggalWaktu } from "@/lib/auth/user-display";

const dl = (ms: number) => ({ "--delay": `${ms}ms` } as React.CSSProperties);

/** Ikon dan warna tiap jenis kejadian pada log aktivitas. */
const AKSI_TAMPIL: Record<AksiRiwayat, { icon: typeof Plus; tone: string }> = {
  submitted: { icon: Plus, tone: "bg-sky-50 text-sky-600" },
  accepted: { icon: Play, tone: "bg-blue-50 text-blue-600" },
  rejected: { icon: X, tone: "bg-rose-50 text-rose-600" },
  paused: { icon: Pause, tone: "bg-slate-100 text-slate-500" },
  resumed: { icon: Play, tone: "bg-blue-50 text-blue-600" },
  result_sent: { icon: Check, tone: "bg-violet-50 text-violet-600" },
  revision_requested: { icon: AlertTriangle, tone: "bg-amber-50 text-amber-600" },
  approved: { icon: BadgeCheck, tone: "bg-emerald-50 text-emerald-600" },
  auto_closed: { icon: Clock, tone: "bg-slate-100 text-slate-500" },
};

export default function SupervisorDashboard() {
  const [data, setData] = useState<DashboardSupervisor | null>(null);
  const [error, setError] = useState("");

  const muat = useCallback(() => {
    let dibatalkan = false;
    getDashboardSupervisor()
      .then((hasil) => {
        if (dibatalkan) return;
        setData(hasil);
        setError("");
      })
      .catch((err) => {
        if (!dibatalkan) setError(errorMessage(err, "Dashboard gagal dimuat."));
      });
    return () => {
      dibatalkan = true;
    };
  }, []);

  useEffect(() => muat(), [muat]);

  const ulangi = () => {
    setError("");
    muat();
  };

  const s = data?.per_status;
  const metrics = [
    { label: "Total Permintaan", value: data?.total ?? 0, sub: `Seluruh tiket ke ${data?.bagian?.nama_bagian ?? "section Anda"}`, chip: `${data?.baru_hari_ini ?? 0} hari ini`, icon: Boxes, tone: "text-blue-700 bg-blue-50", chipTone: "text-blue-700 bg-blue-50" },
    { label: "Permintaan Baru", value: s?.submitted ?? 0, sub: "Menunggu penerimaan PIC", chip: "Antrean", icon: MailPlus, tone: "text-sky-600 bg-sky-50", chipTone: "text-sky-700 bg-sky-50" },
    { label: "Sedang Diproses", value: s?.in_progress ?? 0, sub: "Sedang dikerjakan PIC", chip: "Aktif", icon: RefreshCw, tone: "text-indigo-600 bg-indigo-50", chipTone: "text-indigo-700 bg-indigo-50" },
    { label: "Selesai", value: s?.completed ?? 0, sub: "Disetujui atau ditutup otomatis", chip: data?.rasio_selesai != null ? `${String(data.rasio_selesai).replace(".", ",")}% dari total` : "Belum ada", icon: CheckCircle2, tone: "text-emerald-600 bg-emerald-50", chipTone: "text-emerald-700 bg-emerald-50" },
    { label: "Pending", value: s?.pending ?? 0, sub: "Ditunda oleh PIC", chip: "Perlu atensi", icon: PauseCircle, tone: "text-amber-600 bg-amber-50", chipTone: "text-amber-700 bg-amber-50" },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard Supervisor"
        description="Pantau dan tinjau aktivitas permintaan layanan internal pada bagian yang Anda supervisi."
      >
        {data && (
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[12px] font-medium text-slate-600">
            <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
            {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
          </span>
        )}
        <ReadOnlyBadge />
      </PageHeader>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between gap-3 text-xs text-red-700" role="alert">
          <span className="flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</span>
          <button type="button" onClick={ulangi} className="font-medium underline underline-offset-2 hover:text-red-900">Coba lagi</button>
        </div>
      )}

      {!data && !error && (
        <div className="flex items-center justify-center gap-2 py-24 text-sm text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Memuat dashboard...
        </div>
      )}

      {data && (
        <>
          {/* Banner arahan */}
          <section className="fx-reveal flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-white p-4" style={dl(60)}>
            <div className="flex items-start gap-3">
              <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0"><Info className="w-4 h-4" /></span>
              <p className="text-[13px] text-slate-600 leading-relaxed pt-1">
                Gunakan halaman <strong className="text-slate-900">Monitoring Permintaan</strong> untuk melihat rincian alur kerja, log audit, dan dokumen pendukung setiap tiket.
              </p>
            </div>
            <Link href="/supervisor/monitoring-permintaan" className="group inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-blue-200 text-[13px] font-medium text-blue-800 hover:bg-blue-50 shrink-0">
              Buka Monitoring
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </section>

          {/* Ringkasan */}
          <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {metrics.map(({ label, value, sub, chip, icon: Icon, tone, chipTone }, i) => (
              <FxCard key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${tone}`}><Icon className="w-[18px] h-[18px]" /></span>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${chipTone}`}>{chip}</span>
                </div>
                <div className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
                  <CountUp value={value} delay={200 + i * 90} />
                </div>
                <p className="mt-1 text-[13px] font-medium text-slate-700">{label}</p>
                <p className="text-xs text-slate-400">{sub}</p>
              </FxCard>
            ))}
          </section>
          {(data.per_status.waiting_review > 0 || data.per_status.rejected > 0) && (
            <p className="-mt-2 text-xs text-slate-400">
              Termasuk {data.per_status.waiting_review} Menunggu Konfirmasi karyawan dan {data.per_status.rejected} Ditolak yang tidak tampil pada kartu di atas.
            </p>
          )}

          {/* Tabel monitoring */}
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-[15px] font-semibold text-slate-900">Monitoring Permintaan</h2>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{data.terbaru.length} Terkini</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Tiket terbaru yang ditujukan ke {data.bagian?.nama_bagian ?? "section Anda"}.</p>
              </div>
              <Link href="/supervisor/monitoring-permintaan" className="group inline-flex items-center gap-1.5 text-[13px] font-medium text-blue-700 hover:text-blue-900">
                Lihat Semua Permintaan
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>

            {data.terbaru.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <p className="text-sm font-medium text-slate-700">Belum ada permintaan untuk section Anda</p>
                <p className="text-xs text-slate-400 mt-1">Tiket baru akan muncul di sini setelah karyawan mengajukannya.</p>
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
                      <th className="px-5 py-3 font-medium">Urgensi</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Tanggal</th>
                      <th className="px-5 py-3 font-medium text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.terbaru.map((t) => (
                      <tr key={t.id}>
                        <td className="px-5 py-3.5 font-medium text-slate-900">{t.kode_tiket}</td>
                        <td className="px-5 py-3.5 max-w-[260px]">
                          <p className="text-slate-800 truncate">{t.judul}</p>
                          <p className="text-xs text-slate-400 truncate">{t.layanan ?? "-"}</p>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">{t.pengaju ?? "-"}</td>
                        <td className="px-5 py-3.5 text-slate-600">{t.pic ?? <span className="text-slate-400">Belum ada</span>}</td>
                        <td className="px-5 py-3.5 text-slate-500">{t.prioritas_label}</td>
                        <td className="px-5 py-3.5"><StatusTiketBadge status={t.status} label={t.status_label} /></td>
                        <td className="px-5 py-3.5 text-slate-500">{formatTanggal(t.dibuat_pada)}</td>
                        <td className="px-5 py-3.5 text-right">
                          <Link href={`/supervisor/monitoring-permintaan/${t.id}`} className="inline-flex p-1.5 rounded-md text-slate-400 hover:text-blue-700 hover:bg-blue-50" aria-label={`Lihat ${t.kode_tiket}`}>
                            <Eye className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Kinerja penyelesaian (tanpa SLA, keputusan D1) */}
            <section className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm p-5 fx-reveal" style={dl(300)}>
              <div>
                <h2 className="text-[15px] font-semibold text-slate-900">Ringkasan Penyelesaian</h2>
                <p className="text-xs text-slate-400 mt-0.5">Berdasarkan seluruh tiket section Anda</p>
              </div>

              <div className="mt-5 flex items-baseline gap-2">
                <span className="text-4xl font-semibold tracking-tight text-emerald-600">
                  {data.rasio_selesai != null ? `${String(data.rasio_selesai).replace(".", ",")}%` : "-"}
                </span>
                <span className="text-[13px] text-slate-500">Tiket Selesai</span>
              </div>
              <div className="mt-3 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="fx-bar h-full bg-emerald-500" style={{ width: `${data.rasio_selesai ?? 0}%`, ...dl(400) }} />
              </div>

              <div className="mt-5 grid gap-3 text-[13px]">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-slate-600"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />Selesai</span>
                  <span className="font-medium text-slate-800">{data.per_status.completed} Tiket</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-slate-600"><span className="w-2.5 h-2.5 rounded-full bg-blue-400" />Masih Berjalan</span>
                  <span className="font-medium text-slate-800">{data.berjalan} Tiket</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="inline-flex items-center gap-2 text-slate-600"><Clock className="w-4 h-4 text-slate-400" />Rata-rata Durasi Penyelesaian</span>
                  <span className="font-semibold text-slate-900">{formatDurasiJam(data.rata_durasi_jam)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-slate-600"><Repeat2 className="w-4 h-4 text-slate-400" />Rata-rata Revisi per Tiket</span>
                  <span className="font-semibold text-slate-900">{data.rata_revisi != null ? String(data.rata_revisi).replace(".", ",") : "Belum ada data"}</span>
                </div>
              </div>
            </section>

            {/* Aktivitas */}
            <section className="lg:col-span-3 rounded-xl border border-slate-200 bg-white shadow-sm p-5 fx-reveal" style={dl(380)}>
              <div>
                <h2 className="text-[15px] font-semibold text-slate-900">Aktivitas Terbaru</h2>
                <p className="text-xs text-slate-400 mt-0.5">Log perubahan status tiket section Anda</p>
              </div>

              {data.aktivitas.length === 0 ? (
                <p className="mt-6 text-sm text-slate-400">Belum ada aktivitas.</p>
              ) : (
                <ol className="mt-5 grid gap-4">
                  {data.aktivitas.map((a, i) => {
                    const { icon: Icon, tone } = AKSI_TAMPIL[a.aksi] ?? AKSI_TAMPIL.submitted;
                    return (
                      <li key={a.id} className="fx-reveal-x flex items-start gap-3" style={dl(450 + i * 80)}>
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${tone}`}><Icon className="w-4 h-4" /></span>
                        <div className="min-w-0">
                          <p className="text-[13px] text-slate-700 leading-snug">
                            <span className="font-medium text-slate-900">{a.judul}</span>
                            {a.judul_tiket ? <> — {a.judul_tiket}</> : null}
                          </p>
                          <p className="mt-0.5 text-[11.5px] text-slate-400">
                            {a.kode_tiket ?? "-"} • oleh {a.pelaku} • {formatTanggalWaktu(a.waktu)}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>
          </div>
        </>
      )}
    </>
  );
}
