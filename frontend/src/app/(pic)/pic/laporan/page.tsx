"use client";

import { useMemo, useState } from "react";
import { BarChart3, CheckCircle2, Download, Gauge, Printer, Timer, Inbox } from "lucide-react";
import { CountUp } from "@/components/fx/motion";
import { PageHeader, SelectField, StatCard, delay } from "@/components/pic/primitives";
import { kunciHari, tanggalJam, useNow } from "@/lib/pic/format";
import { usePicStore } from "@/lib/pic/store";
import { NAMA_BAGIAN, type KodeBagian } from "@/lib/pic/types";

const WARNA = ["#1e40af", "#3b82f6", "#93c5fd", "#64748b", "#cbd5e1"];

function Donut({ data }: { data: { label: string; value: number }[] }) {
  const total = data.reduce((a, d) => a + d.value, 0) || 1;
  const R = 62;
  const C = 2 * Math.PI * R;
  const offsets = data.reduce<number[]>((o, d, i) => [...o, (o[i - 1] ?? 0) + (i > 0 ? (data[i - 1].value / total) * C : 0)], []);
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative w-44 h-44 fx-donut">
        <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
          <circle cx="80" cy="80" r={R} fill="none" stroke="#f1f5f9" strokeWidth="18" />
          {data.map((d, i) => {
            const len = (d.value / total) * C;
            return <circle key={d.label} cx="80" cy="80" r={R} fill="none" stroke={WARNA[i % WARNA.length]} strokeWidth="18" strokeDasharray={`${Math.max(len - 2, 0)} ${C}`} strokeDashoffset={-offsets[i]} className="transition-all duration-700" />;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold text-slate-900">{total === 1 && data.length === 0 ? 0 : data.reduce((a, d) => a + d.value, 0)}</span>
          <span className="text-[11px] text-slate-400 uppercase tracking-wider">Tiket</span>
        </div>
      </div>
      <ul className="w-full flex flex-col gap-2">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center gap-2.5 text-xs">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: WARNA[i % WARNA.length] }} />
            <span className="text-slate-700 truncate">{d.label}</span>
            <span className="ml-auto font-semibold text-slate-900">{d.value}</span>
            <span className="text-slate-400 w-10 text-right">{Math.round((d.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Bar({ label, value, max, color, right }: { label: string; value: number; max: number; color: string; right?: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-slate-700 font-medium">{label}</span>
        <span className="text-slate-500">{right ?? value}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className={`fx-bar h-full rounded-full ${color}`} style={{ width: `${max ? (value / max) * 100 : 0}%`, ...delay(150) }} />
      </div>
    </div>
  );
}

export default function LaporanPage() {
  const { permintaan, toast } = usePicStore();
  const now = useNow(60_000);
  const [periode, setPeriode] = useState("semua");
  const [bagian, setBagian] = useState("");

  const data = useMemo(() => {
    const ref = now;
    return permintaan.filter((p) => {
      if (bagian && p.pengaju.bagian !== bagian) return false;
      if (ref === null) return true;
      if (periode === "bulan") return kunciHari(p.diajukan).slice(0, 7) === kunciHari(new Date(ref)).slice(0, 7);
      if (periode === "minggu") return ref - new Date(p.diajukan).getTime() <= 7 * 86400_000;
      return true;
    });
  }, [permintaan, periode, bagian, now]);

  const stat = useMemo(() => {
    const selesai = data.filter((p) => p.status === "selesai");
    const ditolak = data.filter((p) => p.status === "ditolak");
    const aktif = data.filter((p) => p.status === "diproses" || p.status === "pending");
    const menunggu = data.filter((p) => p.status === "menunggu");
    const ditangani = selesai.length + ditolak.length + aktif.length;
    const rata = selesai.length ? selesai.reduce((a, p) => a + (new Date(p.selesaiPada!).getTime() - new Date(p.diajukan).getTime()), 0) / selesai.length / 3600_000 : 0;
    const sesuai = selesai.filter((p) => new Date(p.selesaiPada!).getTime() <= new Date(p.slaDeadline).getTime()).length;
    const layanan = Object.entries(data.reduce<Record<string, number>>((m, p) => ((m[p.kategori] = (m[p.kategori] ?? 0) + 1), m), {})).sort((a, b) => b[1] - a[1]);
    const perBagian = (Object.keys(NAMA_BAGIAN) as KodeBagian[]).map((k) => ({ k, n: data.filter((p) => p.pengaju.bagian === k).length })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n);
    const berulang = Object.entries(data.reduce<Record<string, { n: number; jam: number; s: number }>>((m, p) => {
      const e = (m[p.layanan] ??= { n: 0, jam: 0, s: 0 });
      e.n++;
      if (p.status === "selesai") { e.jam += (new Date(p.selesaiPada!).getTime() - new Date(p.diajukan).getTime()) / 3600_000; e.s++; }
      return m;
    }, {})).sort((a, b) => b[1].n - a[1].n).slice(0, 5);
    return {
      selesai: selesai.length, ditolak: ditolak.length, aktif: aktif.length, menunggu: menunggu.length, ditangani,
      rata, sla: selesai.length ? Math.round((sesuai / selesai.length) * 100) : 0, sesuai,
      tuntas: data.length ? Math.round((selesai.length / data.length) * 100) : 0,
      layanan: layanan.slice(0, 5).map(([label, value]) => ({ label, value })), perBagian, berulang,
    };
  }, [data]);

  const exportCsv = () => {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = [["ID", "Judul", "Layanan", "Pengaju", "Bagian", "Lokasi", "Diajukan", "Status", "Selesai/Ditolak"].map(esc).join(",")];
    for (const p of data) rows.push([p.id, p.judul, p.layanan, p.pengaju.nama, NAMA_BAGIAN[p.pengaju.bagian], `${p.plant} ${p.lantai}`, tanggalJam(p.diajukan), p.status, p.selesaiPada ? tanggalJam(p.selesaiPada) : p.ditolakPada ? tanggalJam(p.ditolakPada) : ""].map((v) => esc(String(v))).join(","));
    const url = URL.createObjectURL(new Blob(["﻿" + rows.join("\n")], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-pic-${kunciHari(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ tone: "success", title: "Laporan diekspor", desc: `${data.length} baris disimpan sebagai CSV.` });
  };

  const maxStatus = Math.max(stat.selesai, stat.aktif, stat.menunggu, stat.ditolak, 1);
  const rataLabel = stat.rata < 24 ? `${stat.rata.toFixed(1)} jam` : `${(stat.rata / 24).toFixed(1)} hari`;

  return (
    <>
      <PageHeader
        title="Laporan Operasional"
        desc="Performa penanganan, tingkat penyelesaian, dan kepatuhan SLA untuk tiket yang Anda tangani."
        actions={
          <>
            <button onClick={() => window.print()} className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:border-blue-200 hover:text-blue-800 transition-all"><Printer className="w-4 h-4" /> Cetak</button>
            <button onClick={exportCsv} className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-all"><Download className="w-4 h-4" /> Ekspor CSV</button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <SelectField label="Periode" value={periode} onChange={setPeriode} options={[{ value: "semua", label: "Semua Periode" }, { value: "bulan", label: "Bulan Ini" }, { value: "minggu", label: "7 Hari Terakhir" }]} />
        <SelectField label="Bagian pengaju" value={bagian} onChange={setBagian} options={[{ value: "", label: "Semua Bagian" }, ...(Object.keys(NAMA_BAGIAN) as KodeBagian[]).map((k) => ({ value: k, label: NAMA_BAGIAN[k] }))]} />
        <span className="text-xs text-slate-400 ml-auto">{data.length} tiket dalam laporan</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Ditangani" value={<CountUp value={stat.ditangani} />} hint={`${stat.menunggu} masih menunggu keputusan`} icon={Inbox} tone="blue" />
        <StatCard label="Rata-rata Penyelesaian" value={stat.selesai ? rataLabel : "—"} hint="Sejak diajukan hingga selesai" icon={Timer} tone="slate" />
        <StatCard label="Kepatuhan SLA" value={<><CountUp value={stat.sla} />%</>} hint={`${stat.sesuai} dari ${stat.selesai} selesai tepat waktu`} icon={Gauge} tone="emerald" />
        <StatCard label="Tingkat Penyelesaian" value={<><CountUp value={stat.tuntas} />%</>} hint={`${stat.selesai} dari ${data.length} tiket`} icon={CheckCircle2} tone="violet" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="bg-white border border-border-subtle rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <h2 className="text-sm font-semibold text-slate-900">Volume per Kategori</h2>
          <p className="text-xs text-slate-400 mb-5">Distribusi tiket masuk</p>
          {stat.layanan.length ? <Donut data={stat.layanan} /> : <p className="text-xs text-slate-400 py-10 text-center">Belum ada data.</p>}
        </section>

        <section className="bg-white border border-border-subtle rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-slate-400" /> Status Tiket</h2>
          <p className="text-xs text-slate-400 mb-5">Posisi alur penanganan</p>
          <div className="flex flex-col gap-5">
            <Bar label="Selesai" value={stat.selesai} max={maxStatus} color="bg-emerald-500" />
            <Bar label="Sedang diproses / pending" value={stat.aktif} max={maxStatus} color="bg-blue-600" />
            <Bar label="Menunggu keputusan" value={stat.menunggu} max={maxStatus} color="bg-amber-500" />
            <Bar label="Ditolak" value={stat.ditolak} max={maxStatus} color="bg-rose-500" />
          </div>
        </section>

        <section className="bg-white border border-border-subtle rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <h2 className="text-sm font-semibold text-slate-900">Permintaan per Bagian</h2>
          <p className="text-xs text-slate-400 mb-5">Asal pengaju</p>
          <div className="flex flex-col gap-5">
            {stat.perBagian.length === 0 && <p className="text-xs text-slate-400 py-10 text-center">Belum ada data.</p>}
            {stat.perBagian.map((b) => (
              <Bar key={b.k} label={NAMA_BAGIAN[b.k]} value={b.n} max={stat.perBagian[0].n} color="bg-blue-700" right={`${b.n} tiket`} />
            ))}
          </div>
        </section>
      </div>

      <section className="bg-white border border-border-subtle rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Layanan Paling Sering Diminta</h2>
          <p className="text-xs text-slate-400">Diurutkan berdasarkan jumlah tiket</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[520px]">
            <thead>
              <tr className="bg-slate-50/60 text-[11px] uppercase tracking-wider text-slate-500 border-b border-border-subtle">
                <th className="py-3 px-5 font-semibold">Layanan</th>
                <th className="py-3 px-5 font-semibold">Jumlah Tiket</th>
                <th className="py-3 px-5 font-semibold">Rata-rata Penyelesaian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-slate-700">
              {stat.berulang.map(([nama, v]) => (
                <tr key={nama}>
                  <td className="py-3 px-5 font-medium text-slate-900">{nama}</td>
                  <td className="py-3 px-5">{v.n} tiket</td>
                  <td className="py-3 px-5">{v.s ? `${(v.jam / v.s).toFixed(1)} jam` : "—"}</td>
                </tr>
              ))}
              {stat.berulang.length === 0 && <tr><td colSpan={3} className="py-8 text-center text-slate-400">Belum ada data.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
