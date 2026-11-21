"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ClipboardList,
  Download,
  Eye,
  FileText,
  History,
  Image as ImageIcon,
  Info,
  MapPin,
  Paperclip,
  Timer,
  UsersRound,
  Mail,
  Clock,
} from "lucide-react";
import ReadOnlyBadge from "@/components/supervisor/read-only-badge";
import SupStatusBadge from "@/components/supervisor/status-badge";
import { DETAIL_TIMELINE, getSupTicket } from "@/lib/supervisor-data";

const dl = (ms: number) => ({ "--delay": `${ms}ms` } as React.CSSProperties);
const initials = (n: string) => n.split(" ").map((w) => w[0]).slice(0, 2).join("");

export default function DetailMonitoringPage() {
  const params = useParams<{ id: string }>();
  const t = getSupTicket(params.id);

  if (!t) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <p className="text-sm font-medium text-slate-800">Permintaan {params.id} tidak ditemukan.</p>
        <Link href="/supervisor/monitoring-permintaan" className="mt-3 inline-block text-[13px] font-medium text-blue-700 hover:text-blue-900">
          Kembali ke Monitoring
        </Link>
      </div>
    );
  }

  // Timeline menyesuaikan status tiket
  const steps = [...DETAIL_TIMELINE];
  if (t.status === "Selesai") steps.push({ title: "Selesai Ditangani", at: "Hari ini", note: "PIC menyelesaikan penanganan dan mengunggah bukti." });
  if (t.status === "Pending") steps.push({ title: "Ditunda (Pending)", at: "Hari ini", note: "Menunggu suku cadang atau konfirmasi vendor." });
  if (t.status === "Ditolak") steps.push({ title: "Ditolak", at: "Hari ini", note: "Dokumen kelengkapan otorisasi belum valid." });
  if (t.status === "Baru") steps.splice(1);

  const info = [
    { label: "Kategori", value: t.category },
    { label: "Jenis Layanan", value: t.service },
    { label: "Section", value: t.section },
    { label: "Waktu Diajukan", value: `${t.date}, ${t.time} WIB` },
  ];

  return (
    <>
      <div className="fx-reveal flex flex-col lg:flex-row lg:items-start justify-between gap-4" style={dl(0)}>
        <div className="grid gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/supervisor/monitoring-permintaan" className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-[13px] font-medium text-slate-700 hover:border-blue-200 hover:text-blue-900">
              <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" />Kembali ke Monitoring
            </Link>
            <SupStatusBadge status={t.status} />
            <ReadOnlyBadge />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-blue-700 bg-clip-text text-transparent">{t.title}</h1>
            <p className="text-[13.5px] text-slate-500 mt-0.5">Detail Permintaan #{t.id} • Informasi lengkap, riwayat tahapan, dan status penanganan.</p>
          </div>
        </div>

        {/* SLA */}
        <div className={`flex items-center gap-3 rounded-xl border p-4 shrink-0 ${t.slaOk ? "border-emerald-100 bg-emerald-50/60" : "border-rose-100 bg-rose-50/60"}`}>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Service Level Agreement</p>
            <p className={`text-[13px] font-semibold ${t.slaOk ? "text-emerald-800" : "text-rose-700"}`}>Target: {t.slaTarget}</p>
            <p className="text-xs text-slate-500">{t.slaOk ? "Masih dalam batas SLA" : "Melewati batas SLA"}</p>
          </div>
          <span className={`w-10 h-10 rounded-full flex items-center justify-center ${t.slaOk ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-600"}`}><Timer className="w-5 h-5" /></span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid gap-6 content-start">
          {/* Informasi */}
          <section className="fx-reveal rounded-xl border border-slate-200 bg-white shadow-sm" style={dl(100)}>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5"><span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center"><ClipboardList className="w-4 h-4" /></span><h2 className="text-[15px] font-semibold text-slate-900">Informasi Permintaan</h2></div>
              <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-100 text-slate-600">ID: {t.id}</span>
            </div>
            <div className="p-5 grid gap-5">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                {info.map((i) => (
                  <div key={i.label}><dt className="text-xs text-slate-400">{i.label}</dt><dd className="text-[13.5px] font-medium text-slate-800 mt-0.5">{i.value}</dd></div>
                ))}
                <div className="sm:col-span-2">
                  <dt className="text-xs text-slate-400">Lokasi Fasilitas</dt>
                  <dd className="text-[13.5px] font-medium text-slate-800 mt-0.5 inline-flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400" />{t.location}</dd>
                </div>
              </dl>
              <div>
                <h3 className="text-xs text-slate-400 mb-1.5">Deskripsi Masalah Lengkap</h3>
                <div className="rounded-lg bg-slate-50 border border-slate-100 p-4 text-[13.5px] text-slate-700 leading-relaxed">{t.description}</div>
              </div>
            </div>
          </section>

          {/* Lampiran */}
          <section className="fx-reveal rounded-xl border border-slate-200 bg-white shadow-sm" style={dl(180)}>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5"><span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center"><Paperclip className="w-4 h-4" /></span><h2 className="text-[15px] font-semibold text-slate-900">Lampiran Berkas Pendukung</h2></div>
              <span className="text-xs text-slate-400">2 Berkas Tersedia</span>
            </div>
            <div className="p-5 grid gap-3">
              {[
                { name: "foto_kondisi_lokasi.jpg", meta: "Gambar • JPG • 1.8 MB", icon: ImageIcon, tone: "bg-sky-50 text-sky-600" },
                { name: "log_laporan_teknis.pdf", meta: "Dokumen • PDF • 640 KB", icon: FileText, tone: "bg-rose-50 text-rose-600" },
              ].map((f) => (
                <div key={f.name} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 hover:border-blue-200 hover:bg-blue-50/30">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 ${f.tone}`}><f.icon className="w-5 h-5" /></span>
                    <div className="min-w-0"><p className="text-[13px] font-medium text-slate-800 truncate">{f.name}</p><p className="text-[11px] text-slate-400">{f.meta}</p></div>
                  </div>
                  <div className="flex gap-1.5">
                    <button className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-medium text-slate-600 hover:text-blue-700 hover:bg-blue-50"><Eye className="w-4 h-4" /><span className="hidden sm:inline">Pratinjau</span></button>
                    <button className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-medium text-slate-600 hover:text-blue-700 hover:bg-blue-50"><Download className="w-4 h-4" /><span className="hidden sm:inline">Download</span></button>
                  </div>
                </div>
              ))}
              <div className="flex items-start gap-2 text-xs text-slate-500 mt-1"><Info className="w-4 h-4 shrink-0 text-blue-600" />Supervisor hanya memiliki hak akses unduh dan pratinjau dokumen arsip.</div>
            </div>
          </section>
        </div>

        <div className="grid gap-6 content-start">
          {/* Pihak terkait */}
          <section className="fx-reveal rounded-xl border border-slate-200 bg-white shadow-sm" style={dl(240)}>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5"><span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center"><UsersRound className="w-4 h-4" /></span><h2 className="text-[15px] font-semibold text-slate-900">Pihak Terkait</h2></div>
            <div className="p-5 grid gap-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-2">Pemohon (Karyawan)</p>
                <div className="flex items-start gap-3">
                  <span className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-700 to-blue-950 text-white text-xs font-semibold flex items-center justify-center shrink-0">{initials(t.requester)}</span>
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-semibold text-slate-900">{t.requester}</p>
                    <p className="text-xs text-slate-500">NIK: {t.requesterNik} • Divisi: {t.section}</p>
                    <p className="text-xs text-slate-400 mt-1 inline-flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{t.requester.split(" ")[0].toLowerCase()}@company.com</p>
                  </div>
                </div>
              </div>
              <div className="pt-5 border-t border-slate-100">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-2">Penanggung Jawab (PIC)</p>
                {t.pic ? (
                  <div className="flex items-start gap-3">
                    <span className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center justify-center shrink-0">{initials(t.pic)}</span>
                    <div>
                      <p className="text-[13.5px] font-semibold text-slate-900">{t.pic}</p>
                      <p className="text-xs text-slate-500">Teknisi bertugas • {t.section}</p>
                      <p className="text-xs text-slate-400 mt-1 inline-flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />Diterima: {t.date}, 09:10 WIB</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-[13px] italic text-slate-400">Belum ada PIC yang ditugaskan.</p>
                )}
              </div>
            </div>
          </section>

          {/* Timeline */}
          <section className="fx-reveal rounded-xl border border-slate-200 bg-white shadow-sm" style={dl(320)}>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5"><span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center"><History className="w-4 h-4" /></span><h2 className="text-[15px] font-semibold text-slate-900">Timeline Penanganan</h2></div>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Audit Trail</span>
            </div>
            <ol className="p-5 relative ml-4 border-l-2 border-slate-100 space-y-5">
              {steps.slice().reverse().map((s, i) => (
                <li key={s.title} className="fx-reveal-x relative pl-5" style={dl(400 + i * 100)}>
                  <span className={`absolute -left-[7px] top-1 w-3 h-3 rounded-full ring-4 ring-white ${i === 0 ? "bg-blue-600" : "bg-slate-300"}`} />
                  <p className="text-[13px] font-semibold text-slate-900">{s.title}</p>
                  <p className="text-[11px] text-slate-400">{s.at}</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{s.note}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </>
  );
}
