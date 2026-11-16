"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Filter, PlusCircle, Users, Wrench, MoreVertical, Eye, Pencil, Ban, Layers } from "lucide-react";

type Section = {
  code: string;
  name: string;
  desc: string;
  employees: number;
  services: number;
  status: "Aktif" | "Nonaktif";
};

const sections: Section[] = [
  { code: "ASM", name: "Assembly", desc: "Lini Perakitan Utama", employees: 42, services: 8, status: "Aktif" },
  { code: "HR", name: "Human Resources", desc: "Pengembangan & Personalia", employees: 18, services: 5, status: "Aktif" },
  { code: "IS", name: "Information System", desc: "Infrastruktur & Aplikasi IT", employees: 24, services: 4, status: "Aktif" },
  { code: "PE", name: "Production Engineering", desc: "Rancang Bangun Proses Pabrik", employees: 27, services: 4, status: "Aktif" },
  { code: "GA", name: "General Affairs", desc: "Fasilitas & Logistik Umum", employees: 17, services: 6, status: "Aktif" },
];

export default function SectionPage() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Section</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">Master Data</span>
          </div>
          <p className="text-sm text-slate-500 mt-1">Kelola data section yang digunakan dalam pengelolaan layanan internal.</p>
        </div>
        <Link href="/admin/section/tambah" className="px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg flex items-center gap-2 shadow-sm transition-all">
          <PlusCircle className="w-4 h-4" />
          Tambah Section
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Section", value: 5, sub: "Terdaftar di sistem" },
          { label: "Section Aktif", value: 5, sub: "Siap digunakan operasional" },
          { label: "Section Nonaktif", value: 0, sub: "Arsip penugasan" },
          { label: "Total Karyawan", value: 128, sub: "Tersebar di 5 section" },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">{c.label}</span>
            <div className="mt-2 text-3xl font-bold text-slate-900">{c.value}</div>
            <div className="mt-3 flex items-center text-xs text-slate-500 gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-300"></span>
              <span>{c.sub}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[260px] flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 transition-all" placeholder="Cari nama atau kode section..." type="text" />
          </div>
          <select className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-3 py-2 focus:outline-none">
            <option value="">Semua Status</option>
            <option>Aktif</option>
            <option>Nonaktif</option>
          </select>
          <button className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors" title="Reset Filter">
            <Filter className="w-4 h-4" />
          </button>
        </div>
        <div className="text-xs text-slate-500 whitespace-nowrap">
          Kapasitas Rata-rata: <span className="font-semibold text-slate-800">25.6 Karyawan / Section</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-6">Section</th>
                <th className="py-3 px-4">Kode Section</th>
                <th className="py-3 px-4">Jumlah Karyawan</th>
                <th className="py-3 px-4">Jumlah Layanan</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sections.map((s) => (
                <tr key={s.code} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{s.name}</p>
                        <p className="text-[11px] text-slate-400">{s.desc}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 text-[11px] font-semibold tracking-wide bg-slate-100 text-slate-700 rounded-md border border-slate-200">{s.code}</span>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-700">
                    <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-slate-400" /> {s.employees} Karyawan</div>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-700">
                    <div className="flex items-center gap-1.5"><Wrench className="w-3.5 h-3.5 text-slate-400" /> {s.services} Layanan</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Aktif
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-right relative">
                    <button className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors" onClick={() => setOpenMenu(openMenu === s.code ? null : s.code)}>
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {openMenu === s.code && (
                      <div className="absolute right-6 top-10 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-30 text-left">
                        <button className="w-full px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"><Eye className="w-3.5 h-3.5 text-slate-400" /> Lihat Detail</button>
                        <button className="w-full px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"><Pencil className="w-3.5 h-3.5 text-slate-400" /> Edit Section</button>
                        <div className="border-t border-slate-100 my-1"></div>
                        <button className="w-full px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"><Ban className="w-3.5 h-3.5 text-rose-500" /> Nonaktifkan</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <span className="text-slate-500">Menampilkan <strong className="text-slate-800 font-semibold">1–5</strong> dari <strong className="text-slate-800 font-semibold">5</strong> section</span>
          <div className="flex items-center gap-1.5">
            <button className="w-7 h-7 rounded-md bg-blue-800 text-white font-medium flex items-center justify-center">1</button>
          </div>
        </div>
      </div>
    </>
  );
}
