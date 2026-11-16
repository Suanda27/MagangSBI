"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Printer, Share2, Eye, FileText, Image as ImageIcon, Download, MapPin, CalendarDays, CheckCircle2, User, Phone } from "lucide-react";

export default function DetailPermintaanAdminPage() {
  const params = useParams<{ id: string }>();

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Link href="/admin/permintaan" className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Semua Permintaan
        </Link>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Detail Permintaan</h1>
              <span className="text-sm text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">#{params.id}</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span> Sedang Diproses
              </span>
            </div>
            <p className="text-sm text-slate-500 flex items-center flex-wrap gap-2">
              <span>Dibuat pada 20 Agustus 2026, 08:42 WIB</span>
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              <span>Terakhir diperbarui oleh Budi Santoso (PIC Assembly)</span>
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-medium rounded-lg transition-colors">
              <Printer className="w-[18px] h-[18px]" /> Cetak
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-medium rounded-lg transition-colors">
              <Share2 className="w-[18px] h-[18px]" /> Salin Tautan
            </button>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3 px-4 py-3 bg-blue-50/60 rounded-lg text-blue-900">
          <Eye className="w-5 h-5 text-blue-700 shrink-0" />
          <p className="text-sm flex-1">
            <strong className="font-semibold">Mode Monitoring Admin:</strong> Hak operasional pemrosesan tiket dipegang oleh PIC penanggung jawab. Perubahan status hanya dapat dilakukan oleh PIC terkait.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-200 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">Informasi Permintaan</h2>
              <span className="text-xs px-2.5 py-1 rounded bg-slate-100 text-slate-500">Kategori: Fasilitas</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div>
                <span className="text-xs text-slate-400 block mb-1">ID Permintaan</span>
                <span className="font-semibold text-slate-900">#{params.id}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-1">Kategori Layanan</span>
                <span className="font-semibold text-blue-700">Perbaikan Fasilitas Produksi</span>
              </div>
              <div className="md:col-span-2">
                <span className="text-xs text-slate-400 block mb-1">Judul Permintaan</span>
                <h3 className="text-base font-semibold text-slate-900">Perbaikan AC Ruang Assembly</h3>
              </div>
              <div className="md:col-span-2">
                <span className="text-xs text-slate-400 block mb-1">Deskripsi Lengkap</span>
                <div className="p-4 rounded-lg bg-slate-50 text-slate-800 leading-relaxed">
                  AC di ruang Assembly tidak berfungsi dengan baik dan mengeluarkan suara yang tidak normal, menyebabkan suhu ruangan meningkat drastis hingga 29°C saat jam kerja shift pagi.
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-1">Lokasi Detail</span>
                <div className="flex items-center gap-1.5 text-slate-900"><MapPin className="w-[18px] h-[18px] text-blue-700" /> Plant 1 — Lantai 2 (Area Produksi Barat)</div>
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-1">Tanggal Pengajuan</span>
                <div className="flex items-center gap-1.5 text-slate-900"><CalendarDays className="w-[18px] h-[18px] text-slate-400" /> 20 Agustus 2026, 08:42 WIB</div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-3">
              <span className="text-xs text-slate-500 block">Lampiran dari Pengaju (2 Berkas)</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center shrink-0 text-slate-500"><ImageIcon className="w-5 h-5" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">Foto_AC_Bocor_dan_Bising.jpg</p>
                    <p className="text-xs text-slate-400">1.8 MB • JPG</p>
                  </div>
                  <Download className="w-[18px] h-[18px] text-slate-400" />
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="w-12 h-12 rounded-lg bg-rose-100 flex items-center justify-center shrink-0 text-rose-600"><FileText className="w-5 h-5" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">Form_Kerusakan_Lini.pdf</p>
                    <p className="text-xs text-slate-400">340 KB • PDF</p>
                  </div>
                  <Download className="w-[18px] h-[18px] text-slate-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-200 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">Hasil Penyelesaian Layanan</h2>
              <span className="text-xs px-2.5 py-1 rounded bg-blue-50 text-blue-700 font-medium">Sedang Dikerjakan</span>
            </div>
            <p className="text-sm text-slate-500">Catatan penyelesaian dan bukti fisik akan muncul di sini setelah PIC menyelesaikan tiket ini.</p>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2"><User className="w-[18px] h-[18px] text-blue-700" /> Informasi Pengaju</h3>
              <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500">Karyawan</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-700 text-white font-bold text-lg flex items-center justify-center shrink-0 shadow-sm">AP</div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-slate-900 truncate">Andi Pratama</h4>
                <p className="text-xs text-slate-500">NIK: 22010456</p>
                <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">Operator Assembly Senior</span>
              </div>
            </div>
            <div className="space-y-2.5 pt-2 border-t border-slate-100 text-sm">
              <div className="flex justify-between"><span className="text-xs text-slate-400">Email</span><span className="font-medium text-slate-900 truncate max-w-[180px]">andi.pratama@company.com</span></div>
              <div className="flex justify-between"><span className="text-xs text-slate-400">Section</span><span className="font-medium text-slate-900">Assembly (Lini Utama)</span></div>
              <div className="flex justify-between"><span className="text-xs text-slate-400">Kontak</span><span className="font-medium text-slate-900">Ext. 4102</span></div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2"><Phone className="w-[18px] h-[18px] text-blue-700" /> PIC Penanggung Jawab</h3>
              <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span> Aktif
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-slate-700 text-white font-bold text-lg flex items-center justify-center shrink-0 shadow-sm">BS</div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-slate-900 truncate">Budi Santoso</h4>
                <p className="text-xs text-slate-500">NIK: 22010321</p>
                <p className="text-xs text-blue-700 font-medium">Section Assembly &amp; Fasilitas</p>
              </div>
            </div>
            <div className="space-y-2.5 pt-2 border-t border-slate-100 text-sm">
              <div className="flex justify-between"><span className="text-xs text-slate-400">Cakupan Wilayah</span><span className="font-medium text-slate-900">Plant 1 &amp; Plant 2</span></div>
              <div className="flex justify-between"><span className="text-xs text-slate-400">Total Tiket Aktif</span><span className="font-medium text-slate-900">3 Permintaan</span></div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-5">
            <h3 className="text-base font-semibold text-slate-900 pb-3 border-b border-slate-100">Timeline Proses</h3>
            <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
              {[
                { title: "Permintaan Dibuat", time: "20 Agt 2026, 08:42 WIB", sub: "Oleh Andi Pratama (Pengaju)", done: true },
                { title: "Permintaan Diterima", time: "20 Agt 2026, 09:15 WIB", sub: "Oleh Budi Santoso (PIC)", done: true },
                { title: "Sedang Diproses", time: "20 Agt 2026, 10:30 WIB", sub: "Pemeriksaan komponen AC di lokasi", done: true, active: true },
                { title: "Permintaan Selesai", time: "Menunggu konfirmasi penyelesaian PIC", sub: "", done: false },
              ].map((s, i) => (
                <div key={i} className="relative">
                  <div className={`absolute -left-6 top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-sm ${s.done ? (s.active ? "bg-blue-100 text-blue-700 ring-4 ring-blue-50 animate-pulse" : "bg-blue-700 text-white") : "bg-slate-100 text-slate-400"}`}>
                    {s.done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />}
                  </div>
                  <p className={`text-sm font-semibold ${s.active ? "text-blue-700" : s.done ? "text-slate-900" : "text-slate-400"}`}>{s.title}</p>
                  <p className="text-xs text-slate-500">{s.time}</p>
                  {s.sub && <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
