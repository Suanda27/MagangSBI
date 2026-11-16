"use client";

import { useState } from "react";
import Link from "next/link";
import { RefreshCw, Download, Search, Filter, ArrowRight, FolderOpen, Hourglass, Clock3, CheckCircle2, XCircle } from "lucide-react";

type Row = {
  id: string;
  title: string;
  desc: string;
  layanan: string;
  kategori: string;
  requester: string;
  requesterInitials: string;
  nik: string;
  section: string;
  pic: string;
  picDept: string;
  lokasi: string;
  date: string;
  status: "Sedang Diproses" | "Menunggu Pemeriksaan" | "Selesai" | "Ditolak";
};

const rows: Row[] = [
  { id: "ISM-00124", title: "Perbaikan AC Ruang Assembly", desc: "Unit pendingin mengeluarkan tetesan air dan hembusan panas", layanan: "Perbaikan Fasilitas", kategori: "Fasilitas & Gedung", requester: "Andi Pratama", requesterInitials: "AP", nik: "22010456", section: "ASM", pic: "Budi Santoso", picDept: "Plant Engineering", lokasi: "Plant 1, Lt. 2", date: "20 Agt 2026, 08:42", status: "Sedang Diproses" },
  { id: "ISM-00123", title: "Permintaan Surat Keterangan Magang", desc: "Keperluan administrasi kampus semester genap 3 mahasiswa", layanan: "Dokumen & Surat", kategori: "Admin Karyawan", requester: "Muhammad Rizky", requesterInitials: "MR", nik: "22010512", section: "HR", pic: "Siti Rahma", picDept: "HR Services", lokasi: "Plant 2, Lt. 1", date: "20 Agt 2026, 08:15", status: "Menunggu Pemeriksaan" },
  { id: "ISM-00122", title: "Permintaan Akses Sistem SAP Produksi", desc: "Penambahan otorisasi modul MM & PP untuk supervisor baru", layanan: "Permintaan Akses Sistem", kategori: "Dukungan IT", requester: "Dimas Saputra", requesterInitials: "DS", nik: "22010204", section: "IS", pic: "Agus Setiawan", picDept: "IT Infrastructure", lokasi: "Plant 2, Lt. 3", date: "19 Agt 2026, 16:30", status: "Selesai" },
  { id: "ISM-00121", title: "Penggantian Kursi Operator Line 3", desc: "Hidrolik kursi kerja patah, butuh 2 unit ergonomis pengganti", layanan: "Permintaan Alat Kerja", kategori: "Inventaris", requester: "Siti Nurhaliza", requesterInitials: "SN", nik: "22010389", section: "GA", pic: "Hendra Wijaya", picDept: "General Affairs", lokasi: "Plant 3, Lt. 1", date: "19 Agt 2026, 14:10", status: "Sedang Diproses" },
  { id: "ISM-00120", title: "Kalibrasi Mesin Press Hidrolik", desc: "Deviasi tekanan lebih dari 8 bar pada cycle produksi pagi", layanan: "Perbaikan Fasilitas", kategori: "Maintenance Mesin", requester: "Rudi Hartono", requesterInitials: "RH", nik: "22010115", section: "PE", pic: "Doni Prasetyo", picDept: "Plant Engineering", lokasi: "Plant 1, Lt. 1", date: "18 Agt 2026, 11:20", status: "Ditolak" },
  { id: "ISM-00119", title: "Pemasangan Lampu LED Workstation", desc: "Pencahayaan redup di area perakitan wiring harness line B", layanan: "Perbaikan Fasilitas", kategori: "Listrik & Cahaya", requester: "Agus Kurnia", requesterInitials: "AK", nik: "22010642", section: "ASM", pic: "Budi Santoso", picDept: "Plant Engineering", lokasi: "Plant 2, Lt. 2", date: "18 Agt 2026, 09:05", status: "Selesai" },
];

const statusStyle: Record<Row["status"], string> = {
  "Sedang Diproses": "bg-blue-50 text-blue-700",
  "Menunggu Pemeriksaan": "bg-amber-50 text-amber-700",
  Selesai: "bg-emerald-50 text-emerald-700",
  Ditolak: "bg-rose-50 text-rose-700",
};

const statusDot: Record<Row["status"], string> = {
  "Sedang Diproses": "bg-blue-500",
  "Menunggu Pemeriksaan": "bg-amber-500",
  Selesai: "bg-emerald-500",
  Ditolak: "bg-rose-500",
};

export default function SemuaPermintaanPage() {
  const [search, setSearch] = useState("");

  const filtered = rows.filter((r) => `${r.id} ${r.title} ${r.requester} ${r.nik}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Semua Permintaan</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">Live Monitor</span>
          </div>
          <p className="text-sm text-slate-500 mt-1">Pantau seluruh permintaan layanan internal dari semua section secara terpadu dan real-time.</p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-sm" title="Refresh Data">
            <RefreshCw className="w-[18px] h-[18px]" />
          </button>
          <button className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-white border border-slate-200 text-blue-700 text-sm font-semibold hover:bg-blue-50 transition-all shadow-sm">
            <Download className="w-[18px] h-[18px]" /> Ekspor Data
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {[
          { label: "Total Tiket", value: 128, sub: "Semua tiket masuk", icon: FolderOpen, valClass: "text-slate-900" },
          { label: "Menunggu", value: 12, sub: "Belum ditinjau PIC", icon: Hourglass, valClass: "text-slate-900" },
          { label: "Diproses", value: 34, sub: "Dalam penanganan aktif", icon: Clock3, valClass: "text-blue-700" },
          { label: "Selesai", value: 68, sub: "Terselesaikan tuntas", icon: CheckCircle2, valClass: "text-slate-900" },
          { label: "Ditolak", value: 14, sub: "Dibatalkan / tidak valid", icon: XCircle, valClass: "text-rose-600" },
        ].map((c) => (
          <div key={c.label} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase text-slate-500 tracking-wider font-semibold">{c.label}</span>
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500">
                <c.icon className="w-[18px] h-[18px]" />
              </div>
            </div>
            <div className="mt-3">
              <span className={`text-[28px] font-bold leading-none ${c.valClass}`}>{c.value}</span>
              <p className="text-xs text-slate-500 mt-1">{c.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-3.5">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-2.5 rounded-lg bg-slate-50 text-slate-900 placeholder:text-slate-400 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700/20 transition-all" placeholder="Cari ID tiket, judul masalah, NIK, atau nama pengaju..." />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 items-center">
          <select className="w-full px-3 py-2 rounded-lg bg-slate-50 text-slate-700 text-xs cursor-pointer focus:outline-none">
            <option>Semua Status</option>
            <option>Menunggu Pemeriksaan</option>
            <option>Sedang Diproses</option>
            <option>Selesai</option>
            <option>Ditolak</option>
          </select>
          <select className="w-full px-3 py-2 rounded-lg bg-slate-50 text-slate-700 text-xs cursor-pointer focus:outline-none">
            <option>Semua Section</option>
            <option>Assembly (ASM)</option>
            <option>Human Resources (HR)</option>
            <option>Information System (IS)</option>
            <option>Plant Engineering (PE)</option>
            <option>General Affairs (GA)</option>
          </select>
          <select className="w-full px-3 py-2 rounded-lg bg-slate-50 text-slate-700 text-xs cursor-pointer focus:outline-none">
            <option>Semua Plant</option>
            <option>Plant 1</option>
            <option>Plant 2</option>
            <option>Plant 3</option>
          </select>
          <button className="h-9 px-2.5 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors flex items-center justify-center gap-1.5 col-span-2 md:col-span-1" title="Reset Semua Filter">
            <Filter className="w-[18px] h-[18px]" /> <span className="text-xs">Reset</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">ID Permintaan</th>
                <th className="py-3 px-4 font-semibold min-w-[220px]">Judul Permintaan</th>
                <th className="py-3 px-4 font-semibold min-w-[170px]">Layanan</th>
                <th className="py-3 px-4 font-semibold min-w-[180px]">Pengaju</th>
                <th className="py-3 px-3 font-semibold text-center">Section</th>
                <th className="py-3 px-4 font-semibold min-w-[150px]">PIC Petugas</th>
                <th className="py-3 px-4 font-semibold min-w-[140px]">Tanggal</th>
                <th className="py-3 px-3 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/60 transition-colors group">
                  <td className="py-3.5 px-4 font-mono text-xs font-semibold text-blue-700">#{r.id}</td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">{r.title}</div>
                    <div className="text-xs text-slate-500 truncate max-w-xs">{r.desc}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-900">{r.layanan}</div>
                    <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-xs font-medium mt-0.5">{r.kategori}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-semibold text-xs shrink-0">{r.requesterInitials}</div>
                      <div className="min-w-0">
                        <div className="font-medium text-slate-900 truncate">{r.requester}</div>
                        <div className="text-xs text-slate-400">NIK: {r.nik}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-center"><span className="inline-flex px-2 py-0.5 rounded bg-slate-100 text-xs font-bold text-slate-900">{r.section}</span></td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-900">{r.pic}</div>
                    <div className="text-xs text-slate-400">{r.picDept}</div>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500">{r.date}</td>
                  <td className="py-3.5 px-3 text-center whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyle[r.status]}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusDot[r.status]}`}></span> {r.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link href={`/admin/permintaan/${r.id}`} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-700 hover:text-white text-blue-700 text-xs font-semibold transition-all">
                      Detail <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-slate-50/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500">
          <div className="text-xs">Menampilkan <span className="font-semibold text-slate-900">1–6</span> dari <span className="font-semibold text-slate-900">128</span> permintaan</div>
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 rounded-lg bg-blue-700 text-white text-xs font-semibold shadow-sm">1</button>
            <button className="w-8 h-8 rounded-lg hover:bg-slate-100 text-xs font-medium transition-colors">2</button>
            <button className="w-8 h-8 rounded-lg hover:bg-slate-100 text-xs font-medium transition-colors">3</button>
          </div>
        </div>
      </div>
    </>
  );
}
