"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Download, Eye, FileText, Image as ImageIcon, Paperclip, ReceiptText } from "lucide-react";
import PageHeader from "@/components/employee/page-header";
import StatusBadge from "@/components/employee/status-badge";
import StatusTimeline from "@/components/employee/status-timeline";
import { ACTIVITIES, getTicket } from "@/lib/employee-data";

const dl = (ms: number) => ({ "--delay": `${ms}ms` } as React.CSSProperties);

export default function DetailPermintaanPage() {
  const params = useParams<{ id: string }>();
  const ticket = getTicket(params.id);

  if (!ticket) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <p className="text-sm font-medium text-slate-800">Permintaan {params.id} tidak ditemukan.</p>
        <Link href="/employee/permintaan-saya" className="mt-3 inline-block text-[13px] font-medium text-blue-700 hover:text-blue-900">
          Kembali ke Permintaan Saya
        </Link>
      </div>
    );
  }

  const info = [
    { label: "Kategori Layanan", value: ticket.category },
    { label: "Layanan", value: ticket.service },
    { label: "Departemen", value: ticket.section },
    { label: "PIC", value: ticket.pic },
    { label: "Plant", value: ticket.plant },
    { label: "Lantai", value: ticket.floor },
  ];

  return (
    <>
      <PageHeader title={ticket.title} description={`Ref: ${ticket.id} • Diajukan pada ${ticket.createdAt.split(",")[0]}`}>
        <StatusBadge status={ticket.status} />
        <Link
          href="/employee/permintaan-saya"
          className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-[13px] font-medium text-slate-700 hover:border-blue-200 hover:text-blue-900"
        >
          <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" />
          Kembali
        </Link>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid gap-6 content-start">
          <section className="fx-reveal rounded-xl border border-slate-200 bg-white shadow-sm p-5" style={dl(80)}>
            <h2 className="text-[15px] font-semibold text-slate-900 mb-4">Status Timeline</h2>
            <StatusTimeline status={ticket.status} />
          </section>

          <section className="fx-reveal rounded-xl border border-slate-200 bg-white shadow-sm" style={dl(160)}>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center"><ReceiptText className="w-5 h-5" /></span>
                <div>
                  <h2 className="text-[15px] font-semibold text-slate-900">Ringkasan Permintaan</h2>
                  <p className="text-xs text-slate-500">Informasi lengkap detail pengajuan layanan</p>
                </div>
              </div>
              <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-100 text-slate-600">{ticket.id}</span>
            </div>

            <div className="p-5 grid gap-5">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                {info.map((i) => (
                  <div key={i.label}>
                    <dt className="text-xs text-slate-400">{i.label}</dt>
                    <dd className="text-[13.5px] font-medium text-slate-800 mt-0.5">{i.value}</dd>
                  </div>
                ))}
              </dl>

              <div>
                <h3 className="text-xs text-slate-400 mb-1.5">Deskripsi</h3>
                <div className="rounded-lg bg-slate-50 border border-slate-100 p-4 text-[13.5px] text-slate-700 leading-relaxed whitespace-pre-line">
                  {ticket.description}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xs text-slate-400 mb-1.5 inline-flex items-center gap-1.5"><Paperclip className="w-3.5 h-3.5" />File Pendukung</h3>
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 hover:border-blue-200 hover:bg-blue-50/30">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-9 h-9 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center shrink-0"><FileText className="w-4 h-4" /></span>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-slate-800 truncate">Form_Approval.pdf</p>
                        <p className="text-[11px] text-slate-400">1.2 MB • Dokumen</p>
                      </div>
                    </div>
                    <button className="p-1.5 rounded-md text-slate-400 hover:text-blue-700 hover:bg-blue-50" aria-label="Unduh"><Download className="w-4 h-4" /></button>
                  </div>
                </div>
                <div>
                  <h3 className="text-xs text-slate-400 mb-1.5 inline-flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5" />Foto Pendukung</h3>
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 hover:border-blue-200 hover:bg-blue-50/30">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-9 h-9 rounded-md bg-sky-50 text-sky-600 flex items-center justify-center shrink-0"><ImageIcon className="w-4 h-4" /></span>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-slate-800 truncate">foto_kondisi.jpg</p>
                        <p className="text-[11px] text-slate-400">840 KB • Lampiran gambar</p>
                      </div>
                    </div>
                    <div className="flex">
                      <button className="p-1.5 rounded-md text-slate-400 hover:text-blue-700 hover:bg-blue-50" aria-label="Lihat"><Eye className="w-4 h-4" /></button>
                      <button className="p-1.5 rounded-md text-slate-400 hover:text-blue-700 hover:bg-blue-50" aria-label="Unduh"><Download className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Riwayat aktivitas */}
        <section className="fx-reveal rounded-xl border border-slate-200 bg-white shadow-sm p-5 h-fit" style={dl(240)}>
          <h2 className="text-[15px] font-semibold text-slate-900 mb-5">Riwayat Aktivitas</h2>
          <ol className="relative border-l-2 border-slate-100 ml-2 space-y-6">
            {ACTIVITIES.default.map((a, i) => (
              <li key={a.title} className="fx-reveal-x pl-5 relative" style={dl(320 + i * 110)}>
                <span className={`absolute -left-[7px] top-1 w-3 h-3 rounded-full ring-4 ring-white ${i === 0 ? "bg-blue-600" : "bg-slate-300"}`} />
                <p className="text-[13px] font-medium text-slate-900">{a.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{a.by}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{a.at}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </>
  );
}
