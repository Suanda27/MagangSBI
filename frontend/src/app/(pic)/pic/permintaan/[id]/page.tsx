"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Ban, Check, CheckCircle2, Clock3, FileSearch, FileText, History, Image as ImageIcon, Mail, MapPin, PauseCircle, Phone, RefreshCw, User } from "lucide-react";
import { Avatar, PageHeader, delay } from "@/components/shared/display";
import { PrioritasBadge, StatusBadge } from "@/components/pic/primitives";
import { ProofUploadForm, StatusDialog, TerimaDialog, TolakDialog } from "@/components/pic/actions";
import { tanggalJam, ukuranFile, useNow } from "@/lib/shared/format";
import { infoSla, SLA_TONE } from "@/lib/pic/format";
import { usePicStore } from "@/lib/pic/store";
import { NAMA_BAGIAN, type Lampiran, type Permintaan } from "@/lib/pic/types";

const Kartu = ({ title, icon: Icon, right, children }: { title: string; icon: typeof User; right?: React.ReactNode; children: React.ReactNode }) => (
  <section className="bg-white border border-border-subtle rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
    <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
      <h2 className="text-[13px] font-semibold text-slate-900 flex items-center gap-2"><Icon className="w-4 h-4 text-slate-400" />{title}</h2>
      {right}
    </div>
    <div className="p-5">{children}</div>
  </section>
);

function DaftarLampiran({ items, kosong }: { items: Lampiran[]; kosong: string }) {
  if (items.length === 0) return <p className="text-xs text-slate-400">{kosong}</p>;
  return (
    <ul className="grid sm:grid-cols-2 gap-2.5">
      {items.map((l) => (
        <li key={l.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:border-blue-200 hover:bg-blue-50/30 transition-colors">
          <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${l.tipe === "gambar" ? "bg-blue-50 text-blue-600" : "bg-rose-50 text-rose-600"}`}>
            {l.tipe === "gambar" ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block text-xs font-medium text-slate-800 truncate">{l.nama}</span>
            <span className="text-[11px] text-slate-400">{ukuranFile(l.ukuran)}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Stepper alur kerja: Diajukan → Diterima → Diproses → Selesai */
type StepState = "done" | "current" | "rose" | "skip" | "todo";

function Alur({ p }: { p: Permintaan }) {
  const state = (n: number): StepState => {
    switch (p.status) {
      case "menunggu": return n === 1 ? "done" : n === 2 ? "current" : "todo";
      case "diproses":
      case "pending": return n <= 2 ? "done" : n === 3 ? "current" : "todo";
      case "selesai": return "done";
      case "ditolak": return n === 1 ? "done" : n === 2 ? "rose" : "skip";
    }
  };
  const steps = [
    { l: "Diajukan", s: tanggalJam(p.diajukan), n: 1 },
    { l: p.status === "ditolak" ? "Ditolak" : "Diterima", s: p.ditolakPada ? tanggalJam(p.ditolakPada) : p.diterimaPada ? tanggalJam(p.diterimaPada) : "Menunggu keputusan PIC", n: 2 },
    { l: p.status === "pending" ? "Pending" : "Sedang Diproses", s: "Pengerjaan oleh PIC", n: 3 },
    { l: "Selesai", s: p.selesaiPada ? tanggalJam(p.selesaiPada) : "Penyelesaian tiket", n: 4 },
  ];
  const box: Record<StepState, string> = {
    done: "border-blue-200 bg-blue-50/40",
    current: "border-blue-500 ring-4 ring-blue-50 bg-white",
    rose: "border-rose-300 bg-rose-50/50",
    skip: "opacity-40 border-slate-200",
    todo: "border-slate-200 bg-slate-50/40",
  };
  const dot: Record<StepState, string> = {
    done: "bg-blue-700 text-white",
    current: "bg-white text-blue-700 border-2 border-blue-600",
    rose: "bg-rose-600 text-white",
    skip: "bg-slate-200 text-slate-500",
    todo: "bg-slate-200 text-slate-500",
  };
  return (
    <ol className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {steps.map((s, i) => {
        const st = state(s.n);
        return (
          <li key={s.n} style={delay(i * 90)} className={`fx-reveal rounded-xl border p-3.5 flex gap-3 transition-colors duration-500 ${box[st]}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${dot[st]}`}>
              {st === "rose" ? <Ban className="w-3.5 h-3.5" /> : st === "done" ? <Check className="w-3.5 h-3.5 ui-check" /> : s.n}
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Langkah {s.n}</span>
              <span className="block text-[13px] font-semibold text-slate-900 mt-0.5">{s.l}</span>
              <span className="block text-[11px] text-slate-500 mt-0.5">{s.s}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default function DetailPermintaanPage() {
  const { id } = useParams<{ id: string }>();
  const { ambil, ready, profil } = usePicStore();
  const now = useNow(30_000);
  const [terima, setTerima] = useState(false);
  const [tolak, setTolak] = useState(false);
  const [status, setStatus] = useState(false);

  const p = ambil(id);

  if (!p) {
    return (
      <div className="bg-white border border-border-subtle rounded-xl p-12 flex flex-col items-center text-center gap-3">
        <FileSearch className="w-10 h-10 text-slate-300" />
        <h1 className="text-lg font-semibold text-slate-900">{ready ? "Permintaan tidak ditemukan" : "Memuat permintaan..."}</h1>
        {ready && <p className="text-sm text-slate-500">Tiket #{id} tidak ada di antrean Anda.</p>}
        <Link href="/pic/permintaan-masuk" className="text-sm font-medium text-blue-700 hover:text-blue-900 inline-flex items-center gap-1.5"><ArrowLeft className="w-4 h-4" /> Kembali ke Permintaan Masuk</Link>
      </div>
    );
  }

  const sla = infoSla(p, now);
  const kembali = p.status === "menunggu" ? { href: "/pic/permintaan-masuk", l: "Permintaan Masuk" } : p.status === "selesai" || p.status === "ditolak" ? { href: "/pic/selesai", l: "Selesai & Riwayat" } : { href: "/pic/sedang-diproses", l: "Sedang Diproses" };
  const aktif = p.status === "diproses" || p.status === "pending";

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Portal" }, { label: kembali.l, href: kembali.href }, { label: `#${p.id}` }]}
        title={p.judul}
        actions={
          <Link href={kembali.href} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-white hover:text-blue-800 hover:border-blue-200 transition-all">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-3 -mt-2">
        <span className="text-sm font-semibold text-blue-800">#{p.id}</span>
        <StatusBadge status={p.status} />
        <PrioritasBadge prioritas={p.prioritas} />
        <span className="text-xs text-slate-400 flex items-center gap-1"><Clock3 className="w-3.5 h-3.5" /> Diajukan {tanggalJam(p.diajukan)}</span>
        {sla.tone !== "none" && (
          <span className={`ml-auto text-xs font-semibold px-3 py-1.5 rounded-lg border ${sla.tone === "late" ? "bg-rose-50 border-rose-200" : sla.tone === "warn" ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-200"} ${SLA_TONE[sla.tone]}`}>
            SLA: {sla.label}
          </span>
        )}
      </div>

      <Alur p={p} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Kartu title="Informasi Pengaju" icon={User} right={<span className="text-[11px] text-slate-400">Karyawan Internal</span>}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <Avatar nama={p.pengaju.nama} size="lg" />
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-slate-900">{p.pengaju.nama}</p>
                <p className="text-xs text-slate-500">{p.pengaju.jabatan} · {NAMA_BAGIAN[p.pengaju.bagian]}</p>
                <p className="text-xs text-slate-400 mt-0.5">NIK {p.pengaju.nik}</p>
              </div>
              <div className="text-xs text-slate-600 flex flex-col gap-1.5">
                <a href={`mailto:${p.pengaju.email}`} className="inline-flex items-center gap-2 hover:text-blue-700 transition-colors"><Mail className="w-3.5 h-3.5 text-slate-400" />{p.pengaju.email}</a>
                <span className="inline-flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-400" />{p.pengaju.telepon}</span>
              </div>
            </div>
          </Kartu>

          <Kartu title="Ringkasan Permintaan" icon={FileText}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              {[
                ["Layanan", p.layanan],
                ["Kategori", p.kategori],
                ["Lokasi", `${p.plant} · ${p.lantai}`],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg bg-slate-50 border border-slate-100 p-3">
                  <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">{k}</p>
                  <p className="text-[13px] font-medium text-slate-800 mt-1">{v}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mb-3 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {p.lokasiDetail}</p>
            <h3 className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2">Deskripsi Lengkap</h3>
            <p className="text-[13px] text-slate-700 leading-relaxed whitespace-pre-line rounded-lg bg-slate-50/70 border border-slate-100 p-4">{p.deskripsi}</p>
          </Kartu>

          <Kartu title="Lampiran Pengaju" icon={ImageIcon} right={<span className="text-[11px] text-slate-400">{p.lampiran.length} berkas</span>}>
            <DaftarLampiran items={p.lampiran} kosong="Pengaju tidak melampirkan berkas." />
          </Kartu>

          {p.status === "selesai" && (
            <Kartu title="Bukti Penyelesaian" icon={CheckCircle2} right={p.selesaiPada && <span className="text-[11px] text-slate-400">Selesai {tanggalJam(p.selesaiPada)}</span>}>
              <DaftarLampiran items={p.buktiSelesai ?? []} kosong="Tidak ada bukti terlampir." />
              {p.catatanSelesai && <p className="mt-4 text-[13px] text-slate-700 leading-relaxed rounded-lg bg-emerald-50/60 border border-emerald-100 p-3.5">{p.catatanSelesai}</p>}
            </Kartu>
          )}

          {p.status === "ditolak" && (
            <section className="rounded-xl border border-rose-200 bg-rose-50/60 p-5">
              <h2 className="text-[13px] font-semibold text-rose-800 flex items-center gap-2"><Ban className="w-4 h-4" /> Permintaan Ditolak</h2>
              <p className="text-[13px] text-rose-900/80 mt-2 leading-relaxed">{p.alasanTolak}</p>
            </section>
          )}

          {aktif && <ProofUploadForm permintaan={p} />}
        </div>

        <div className="flex flex-col gap-6 lg:sticky lg:top-24">
          {p.status === "menunggu" && (
            <section className="bg-white border border-border-subtle rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <h2 className="text-sm font-semibold text-slate-900">Keputusan PIC</h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">Apakah permintaan ini dapat diterima dan dikerjakan oleh seksi Anda sesuai SLA?</p>
              <div className="mt-4 flex flex-col gap-2.5">
                <button onClick={() => setTerima(true)} className="w-full py-2.5 text-xs font-semibold bg-blue-700 hover:bg-blue-800 text-white rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5">
                  <Check className="w-4 h-4" /> Terima & Mulai Proses
                </button>
                <button onClick={() => setTolak(true)} className="w-full py-2.5 text-xs font-semibold bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-lg flex items-center justify-center gap-2 transition-colors">
                  <Ban className="w-4 h-4" /> Tolak Permintaan
                </button>
              </div>
            </section>
          )}

          {aktif && (
            <section className="bg-white border border-border-subtle rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <h2 className="text-sm font-semibold text-slate-900">Progres Pengerjaan</h2>
              <p className="text-xs text-slate-500 mt-1">PIC penanggung jawab: <span className="font-medium text-slate-700">{profil.nama}</span></p>
              {p.status === "pending" && p.alasanPending && (
                <div className="mt-3 text-xs text-violet-800 bg-violet-50 border border-violet-200/70 rounded-lg p-3 leading-relaxed flex gap-2"><PauseCircle className="w-4 h-4 shrink-0 mt-0.5" />{p.alasanPending}</div>
              )}
              <button onClick={() => setStatus(true)} className="mt-4 w-full py-2.5 text-xs font-semibold bg-white hover:bg-blue-50 text-blue-800 border border-blue-200 rounded-lg flex items-center justify-center gap-2 transition-colors">
                <RefreshCw className="w-4 h-4" /> Update Status Progres
              </button>
            </section>
          )}

          <Kartu title="Riwayat Aktivitas" icon={History} right={<span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-500">{p.riwayat.length} catatan</span>}>
            <ol className="relative flex flex-col gap-5 before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
              {[...p.riwayat].reverse().map((h, i) => (
                <li key={h.id} className="fx-reveal-x relative pl-6" style={delay(i * 70)}>
                  <span className={`absolute left-0 top-1.5 w-[11px] h-[11px] rounded-full ring-4 ring-white ${i === 0 ? "bg-blue-600" : "bg-slate-300"}`} />
                  <p className="text-[13px] font-medium text-slate-900">{h.judul}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{h.keterangan}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{tanggalJam(h.waktu)} · {h.oleh}</p>
                </li>
              ))}
            </ol>
          </Kartu>
        </div>
      </div>

      <TerimaDialog permintaan={terima ? p : null} onClose={() => setTerima(false)} />
      <TolakDialog permintaan={tolak ? p : null} onClose={() => setTolak(false)} />
      <StatusDialog permintaan={status ? p : null} onClose={() => setStatus(false)} />
    </>
  );
}
