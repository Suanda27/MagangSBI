"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, CheckCircle2, Clock3, Hourglass, Inbox, PauseCircle, History } from "lucide-react";
import { CountUp } from "@/components/fx/motion";
import { Avatar, EmptyState, delay } from "@/components/shared/display";
import { PrioritasBadge, StatusBadge } from "@/components/pic/primitives";
import { jam, kunciHari, tanggalJam, useNow } from "@/lib/shared/format";
import { usePicStore, useRingkasan } from "@/lib/pic/store";

export default function PicDashboard() {
  const { profil, permintaan, ready, galat } = usePicStore();
  const r = useRingkasan();
  const now = useNow(30_000);

  const sapaan = now === null ? "Halo" : (() => {
    const h = Number(jam(new Date(now).toISOString()).slice(0, 2));
    return h < 11 ? "Selamat pagi" : h < 15 ? "Selamat siang" : h < 18 ? "Selamat sore" : "Selamat malam";
  })();

  // Urutan antrean ditentukan server: prioritas Mendesak, Tinggi, Normal, lalu yang paling lama menunggu.
  const antrean = useMemo(() => permintaan.filter((p) => p.status === "menunggu").slice(0, 5), [permintaan]);

  // Aktivitas = tiket yang Anda tangani, yang terakhir berubah di atas.
  const aktivitas = useMemo(
    () =>
      permintaan
        .filter((p) => p.status !== "menunggu" && p.diperbaruiPada!)
        .sort((a, b) => new Date(b.diperbaruiPada!).getTime() - new Date(a.diperbaruiPada!).getTime())
        .slice(0, 6),
    [permintaan],
  );

  const baruHariIni = now === null ? 0 : permintaan.filter((p) => p.status === "menunggu" && kunciHari(p.diajukan) === kunciHari(new Date(now))).length;

  const kartu = [
    { label: "Permintaan Masuk", value: r.menunggu, sub: baruHariIni ? `+${baruHariIni} baru hari ini` : "Menunggu pemeriksaan awal", icon: Inbox, tone: "text-blue-700 bg-blue-50", href: "/pic/permintaan-masuk" },
    { label: "Sedang Diproses", value: r.diproses, sub: "Pengerjaan aktif", icon: Hourglass, tone: "text-sky-700 bg-sky-50", href: "/pic/sedang-diproses" },
    { label: "Pending", value: r.pending, sub: "Menunggu pihak lain", icon: PauseCircle, tone: "text-violet-700 bg-violet-50", href: "/pic/sedang-diproses" },
    { label: "Selesai", value: r.selesai, sub: "Disetujui pengaju", icon: CheckCircle2, tone: "text-emerald-700 bg-emerald-50", href: "/pic/selesai" },
  ];

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {sapaan}, <span className="bg-gradient-to-r from-blue-900 to-blue-600 bg-clip-text text-transparent">{profil.nama.split(" ")[0]}</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">Berikut ringkasan permintaan layanan yang perlu Anda tangani hari ini.</p>
        </div>
        {r.konfirmasi > 0 && (
          <Link href="/pic/sedang-diproses" className="inline-flex items-center gap-2 text-xs font-medium text-sky-800 bg-sky-50 border border-sky-200/70 rounded-lg px-3 py-2 hover:bg-sky-100 transition-colors">
            <Hourglass className="w-4 h-4" /> {r.konfirmasi} hasil menunggu konfirmasi pengaju
          </Link>
        )}
      </div>

      {galat && <div role="alert" className="text-xs text-rose-700 bg-rose-50 border border-rose-200/70 rounded-lg px-3 py-2">{galat}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kartu.map((k, i) => (
          <Link key={k.label} href={k.href} className="group bg-white border border-border-subtle rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{k.label}</span>
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6 ${k.tone}`}>
                <k.icon className="w-4 h-4" />
              </span>
            </div>
            <CountUp value={ready ? k.value : 0} delay={i * 90} className="text-3xl font-semibold tracking-tight text-slate-900" />
            <span className="text-xs text-slate-500">{k.sub}</span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-white border border-border-subtle rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Permintaan yang Perlu Ditangani</h2>
            <Link href="/pic/permintaan-masuk" className="group/l text-xs font-medium text-blue-700 hover:text-blue-900 inline-flex items-center gap-1">
              Lihat semua <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/l:translate-x-1" />
            </Link>
          </div>
          {antrean.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="Antrean kosong" desc="Semua permintaan masuk sudah Anda tindaklanjuti. Kerja bagus!" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {antrean.map((p, i) => {
                return (
                  <li key={p.id} className="fx-reveal" style={delay(200 + i * 70)}>
                    <Link href={`/pic/permintaan/${p.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-blue-50/40 transition-colors group/row">
                      <Avatar nama={p.pengaju.nama} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-medium text-slate-900 truncate group-hover/row:text-blue-800 transition-colors">{p.judul}</span>
                          {p.prioritas === "Mendesak" && <PrioritasBadge prioritas="Mendesak" />}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 truncate">#{p.kode} · {p.pengaju.nama} · {p.layanan}</p>
                      </div>
                      <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                        <span className="text-xs font-medium flex items-center gap-1 text-slate-600"><Clock3 className="w-3.5 h-3.5" />{tanggalJam(p.diajukan)}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover/row:text-blue-600 group-hover/row:translate-x-1 transition-all shrink-0" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="bg-white border border-border-subtle rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <History className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-900">Aktivitas Terbaru</h2>
          </div>
          <ol className="p-5 flex flex-col gap-4">
            {aktivitas.length === 0 && <li className="text-xs text-slate-500">Belum ada aktivitas. Terima permintaan untuk mulai.</li>}
            {aktivitas.map((a, i) => (
              <li key={a.id} className="fx-reveal-x relative pl-5" style={delay(250 + i * 70)}>
                <span className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-blue-500 ring-4 ring-blue-50" />
                <Link href={`/pic/permintaan/${a.id}`} className="text-[13px] font-medium text-slate-800 hover:text-blue-800 transition-colors line-clamp-1">{a.judul}</Link>
                <p className="mt-1 flex items-center gap-2 text-xs text-slate-500"><span>#{a.kode}</span><StatusBadge status={a.status} /></p>
                <p className="text-[11px] text-slate-400 mt-0.5">{tanggalJam(a.diperbaruiPada!)}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section className="bg-white border border-border-subtle rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Sedang Anda Kerjakan</h2>
          <Link href="/pic/sedang-diproses" className="text-xs font-medium text-blue-700 hover:text-blue-900">Kelola</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5">
          {permintaan
            .filter((p) => p.status === "diproses" || p.status === "pending" || p.status === "menunggu_konfirmasi")
            .slice(0, 3)
            .map((p) => (
              <Link key={p.id} href={`/pic/permintaan/${p.id}`} className="rounded-xl border border-slate-200 p-4 hover:border-blue-300 hover:shadow-md transition-all duration-300 flex flex-col gap-2.5 bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-800">#{p.kode}</span>
                  <StatusBadge status={p.status} />
                </div>
                <p className="text-[13px] font-medium text-slate-900 line-clamp-2">{p.judul}</p>
                <p className="text-xs text-slate-400">{p.pengaju.nama} · {p.plant}</p>
              </Link>
            ))}
          {r.aktif === 0 && <p className="text-xs text-slate-500 md:col-span-3 text-center py-4">Belum ada tiket yang sedang dikerjakan.</p>}
        </div>
      </section>
    </>
  );
}
