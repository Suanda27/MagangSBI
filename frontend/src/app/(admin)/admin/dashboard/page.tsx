"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserPlus, PlusCircle, Share2, User, Building2, Wrench, ShieldCheck, PieChart, ArrowRight } from "lucide-react";
import { CountUp, FxCard } from "@/components/fx/motion";
import { Avatar } from "@/components/shared/display";
import { StatusTiketBadge } from "@/components/shared/status-badge";
import { getDashboardAdmin, type DashboardAdminApi } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/errors";
import { tanggalJam } from "@/lib/shared/format";

// Helper delay animasi bertahap
const dl = (ms: number) => ({ "--delay": `${ms}ms` }) as React.CSSProperties;

const quickLinks = [
  { href: "/admin/dashboard", label: "Dashboard", active: true },
  { href: "/admin/pengguna", label: "Pengguna" },
  { href: "/admin/section", label: "Section" },
  { href: "/admin/layanan", label: "Layanan" },
  { href: "/admin/pic", label: "PIC" },
  { href: "/admin/permintaan", label: "Permintaan" },
  { href: "/admin/laporan", label: "Laporan" },
  { href: "/admin/settings", label: "Settings" },
];

/** Warna batang beban section, dari yang terbanyak ke yang tersedikit. */
const WARNA_BEBAN = ["bg-blue-800", "bg-blue-600", "bg-sky-500", "bg-slate-400", "bg-slate-300"];

const persen = (n: number, total: number) => (total > 0 ? (n / total) * 100 : 0);

export default function AdminDashboard() {
  const [d, setD] = useState<DashboardAdminApi | null>(null);
  const [galat, setGalat] = useState<string | null>(null);

  useEffect(() => {
    let batal = false;
    getDashboardAdmin()
      .then((hasil) => {
        if (!batal) setD(hasil);
      })
      .catch((e) => {
        if (!batal) setGalat(errorMessage(e, "Gagal memuat dashboard."));
      });
    return () => {
      batal = true;
    };
  }, []);

  const metrics = [
    { label: "Total Pengguna", value: d?.pengguna.total ?? 0, sub: d ? `${d.pengguna.aktif} Aktif • ${d.pengguna.nonaktif} Nonaktif` : "Memuat...", icon: User },
    { label: "Total Section", value: d?.section.total ?? 0, sub: d ? `${d.section.aktif} Aktif • ${d.section.nonaktif} Nonaktif` : "Memuat...", icon: Building2 },
    { label: "Total Layanan", value: d?.layanan.total ?? 0, sub: d ? `${d.layanan.aktif} Aktif • ${d.layanan.nonaktif} Nonaktif` : "Memuat...", icon: Wrench },
    { label: "Total PIC", value: d?.pic.total ?? 0, sub: d ? `${d.pic.aktif} Bertugas • ${d.pic.nonaktif} Nonaktif` : "Memuat...", icon: ShieldCheck },
  ];

  const total = d?.tiket.total ?? 0;
  const s = d?.tiket.per_status;
  const status = [
    { label: "Menunggu Pemeriksaan", value: s?.submitted ?? 0, color: "bg-amber-500", hex: "#f59e0b" },
    { label: "Sedang Diproses", value: (s?.in_progress ?? 0) + (s?.pending ?? 0), color: "bg-blue-500", hex: "#3b82f6" },
    { label: "Menunggu Konfirmasi", value: s?.waiting_review ?? 0, color: "bg-sky-300", hex: "#7dd3fc" },
    { label: "Selesai", value: s?.completed ?? 0, color: "bg-blue-800", hex: "#1e40af" },
    { label: "Ditolak", value: s?.rejected ?? 0, color: "bg-rose-500", hex: "#f43f5e" },
  ];

  let awal = 0;
  const donut =
    total > 0
      ? `conic-gradient(${status
          .filter((x) => x.value > 0)
          .map((x) => {
            const dari = awal;
            awal += persen(x.value, total);
            return `${x.hex} ${dari}% ${awal}%`;
          })
          .join(", ")})`
      : "conic-gradient(#e2e8f0 0% 100%)";

  const beban = d?.beban_section.filter((b) => b.jumlah > 0) ?? [];
  const bebanTertinggi = beban[0];

  return (
    <>
      <div className="fx-reveal flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={dl(0)}>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-blue-700 bg-clip-text text-transparent">Dashboard</h1>
          <p className="text-[13.5px] text-slate-500 mt-0.5">Kelola data dan pantau aktivitas layanan internal.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link href="/admin/pengguna/tambah" className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-slate-200 hover:border-blue-200 hover:bg-blue-50/50 text-[13px] font-medium text-slate-700 transition-all duration-300 hover:-translate-y-0.5">
            <UserPlus className="w-[17px] h-[17px] text-slate-500 transition-all duration-300 group-hover:text-blue-700 group-hover:scale-110" />
            <span>Tambah Pengguna</span>
          </Link>
          <Link href="/admin/layanan/tambah" className="group fx-shine inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-gradient-to-r from-blue-800 to-blue-600 text-white text-[13px] font-medium transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-800/25">
            <PlusCircle className="w-[17px] h-[17px] transition-transform duration-500 group-hover:rotate-90" />
            <span>Tambah Layanan</span>
          </Link>
        </div>
      </div>

      <div className="fx-reveal bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-blue-50/90 border border-blue-100 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3" style={dl(80)}>
        <div className="flex items-center gap-2.5">
          <Share2 className="w-5 h-5 text-blue-700" />
          <div className="text-[12.5px]">
            <span className="font-semibold text-blue-900">Navigasi Cepat Master &amp; Sistem:</span>
            <span className="text-blue-800 ml-1">Pilih modul untuk langsung menuju halaman terkait</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-[12px]">
          {quickLinks.map((q, i) => (
            <Link
              key={q.href}
              href={q.href}
              style={dl(200 + i * 40)}
              className={`fx-reveal px-2.5 py-1 rounded font-medium transition-all duration-300 hover:-translate-y-0.5 ${
                q.active ? "bg-blue-800 text-white hover:bg-blue-900 shadow-sm shadow-blue-800/30" : "bg-white text-slate-700 border border-blue-200 hover:bg-blue-50 hover:border-blue-300 hover:shadow-sm"
              }`}
            >
              {q.label}
            </Link>
          ))}
        </div>
      </div>

      {galat && <div role="alert" className="text-xs text-rose-700 bg-rose-50 border border-rose-200/70 rounded-lg px-3 py-2">{galat}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {metrics.map(({ label, value, sub, icon: Icon }, i) => (
          <div key={label} className="fx-reveal" style={dl(150 + i * 80)}>
            <FxCard className="group h-full p-4 rounded-xl bg-white border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider transition-colors duration-300 group-hover:text-blue-700">{label}</span>
                <span className="w-8 h-8 -m-1 rounded-lg flex items-center justify-center bg-slate-50 transition-all duration-500 group-hover:bg-blue-600 group-hover:rotate-[10deg] group-hover:scale-110">
                  <Icon className="w-[18px] h-[18px] text-slate-400 transition-colors duration-300 group-hover:text-white" />
                </span>
              </div>
              <div>
                <CountUp value={value} delay={300 + i * 80} className="block text-[25px] font-semibold text-slate-900 leading-none tracking-tight tabular-nums" />
                <p className="text-[11.5px] text-slate-500 mt-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 transition-colors duration-300 group-hover:bg-blue-500"></span>
                  <span>{sub}</span>
                </p>
              </div>
              <span className="absolute left-0 bottom-0 h-0.5 w-full origin-left scale-x-0 bg-gradient-to-r from-blue-600 to-indigo-500 transition-transform duration-500 group-hover:scale-x-100" />
            </FxCard>
          </div>
        ))}
      </div>

      <div className="fx-reveal" style={dl(450)}>
        <FxCard className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-[14.5px] font-semibold text-slate-900">Ringkasan Permintaan &amp; Beban Unit</h2>
              <PieChart className="w-[18px] h-[18px] text-slate-400" />
            </div>
            <p className="text-[12px] text-slate-400 mb-5">Distribusi status tiket dan jumlah tiket per section, dihitung dari seluruh tiket yang pernah masuk.</p>

            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-5 border-b border-slate-100">
              <div className="fx-donut relative w-32 h-32 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-transform duration-500 hover:scale-105" style={{ background: donut }}>
                <div className="w-[86px] h-[86px] rounded-full bg-white flex flex-col items-center justify-center shadow-inner">
                  <CountUp value={total} delay={700} className="text-[20px] font-bold text-slate-900 leading-tight tabular-nums" />
                  <span className="text-[10.5px] text-slate-400 font-medium">Total Tiket</span>
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2.5 text-[12.5px] flex-1 w-full">
                {status.map((x, i) => (
                  <div key={x.label} className="fx-reveal group/stat flex items-center gap-2 p-2 rounded-lg bg-slate-50/60 border border-slate-100 transition-all duration-300 hover:bg-white" style={dl(700 + i * 70)}>
                    <span className={`w-2.5 h-2.5 rounded-full ${x.color} shrink-0 transition-transform duration-300 group-hover/stat:scale-150`}></span>
                    <div className="flex flex-col">
                      <span className="text-slate-500 text-[11px]">{x.label}</span>
                      <span className="text-slate-900 font-semibold">
                        <CountUp value={x.value} delay={700 + i * 70} className="tabular-nums" />{" "}
                        <span className="text-slate-400 font-normal text-[10.5px]">({persen(x.value, total).toFixed(1)}%)</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] font-semibold text-slate-700 uppercase tracking-wider">Tiket per Section</span>
                <span className="text-[11.5px] text-slate-400">Menurut section tujuan</span>
              </div>
              {beban.length === 0 ? (
                <p className="text-[12.5px] text-slate-400 py-3">{d ? "Belum ada tiket masuk." : "Memuat..."}</p>
              ) : (
                <div className="space-y-3">
                  {beban.map((b, i) => {
                    const pct = persen(b.jumlah, total);
                    return (
                      <div key={b.id} className="group/bar">
                        <div className="flex justify-between text-[12.5px] mb-1">
                          <span className="text-slate-700 font-medium transition-colors duration-300 group-hover/bar:text-blue-900">{b.nama_bagian} ({b.kode_bagian})</span>
                          <span className="text-slate-900 font-semibold">{b.jumlah} <span className="text-slate-400 font-normal text-[11px]">({pct.toFixed(1)}%)</span></span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden transition-[height] duration-300 group-hover/bar:h-2.5">
                          <div className="h-full" style={{ width: `${pct}%` }}>
                            <div className={`fx-bar h-full w-full ${WARNA_BEBAN[Math.min(i, WARNA_BEBAN.length - 1)]} rounded-full`} style={dl(800 + i * 110)}></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          {bebanTertinggi && (
            <div className="pt-3.5 mt-4 border-t border-slate-100 text-[11.5px] text-slate-500">
              Tiket terbanyak: <strong className="text-slate-800 font-semibold">{bebanTertinggi.nama_bagian}</strong> ({bebanTertinggi.jumlah} tiket)
            </div>
          )}
        </FxCard>
      </div>

      <div className="fx-reveal rounded-xl bg-white border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden" style={dl(650)}>
        <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-900">Permintaan Terbaru</h2>
            <p className="text-[12.5px] text-slate-400 mt-0.5">Lima tiket layanan internal yang paling baru masuk.</p>
          </div>
          <Link href="/admin/permintaan" className="group inline-flex items-center gap-1 text-[12.5px] font-medium text-blue-700 hover:text-blue-800 transition-colors">
            Lihat Semua
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-400 text-[11px] font-medium uppercase tracking-wider">
                <th className="py-3 px-6">Nomor Tiket</th>
                <th className="py-3 px-4">Judul</th>
                <th className="py-3 px-4">Pengaju</th>
                <th className="py-3 px-4">Section</th>
                <th className="py-3 px-4">PIC</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(d?.tiket_terbaru ?? []).map((t, i) => (
                <tr key={t.id} className="fx-reveal group/row relative hover:bg-blue-50/40 transition-colors duration-300" style={dl(800 + i * 70)}>
                  <td className="py-3.5 px-6 font-medium text-blue-800 whitespace-nowrap">#{t.kode_tiket}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-800">{t.judul}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <Avatar nama={t.pengaju?.name ?? "-"} />
                      <span className="text-slate-800">{t.pengaju?.name ?? "-"}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex px-2 py-0.5 rounded text-[11.5px] font-medium bg-slate-100 text-slate-600">{t.bagian?.kode_bagian ?? "-"}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 text-[12.5px]">{t.pic?.name ?? <span className="text-slate-400">Belum diambil</span>}</td>
                  <td className="py-3.5 px-4 whitespace-nowrap"><StatusTiketBadge status={t.status} /></td>
                  <td className="py-3.5 px-4 text-slate-400 text-[12px] whitespace-nowrap">{tanggalJam(t.dibuat_pada)}</td>
                  <td className="py-3.5 px-6 text-right">
                    <Link href={`/admin/permintaan/${t.id}`} className="inline-flex items-center gap-1 text-[12px] font-medium text-blue-700 hover:text-blue-800 transition-all duration-300">
                      Lihat Detail
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
              {d && d.tiket_terbaru.length === 0 && (
                <tr><td colSpan={8} className="py-10 text-center text-[12.5px] text-slate-400">Belum ada permintaan masuk.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3.5 bg-white border-t border-slate-100 text-[12px] text-slate-500">
          Menampilkan {d?.tiket_terbaru.length ?? 0} dari {total} tiket permintaan internal
        </div>
      </div>
    </>
  );
}
