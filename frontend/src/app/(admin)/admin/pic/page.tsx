"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, RefreshCw, PlusCircle, MoreVertical, Eye, Pencil, Ban, CheckCircle2, Wrench, BarChart3 } from "lucide-react";

type Pic = {
  id: string;
  nik: string;
  name: string;
  section: string;
  services: number;
  status: "Aktif" | "Nonaktif";
  avatarClass: string;
};

const picList: Pic[] = [
  { id: "EMP-001", nik: "EMP-001", name: "Budi Santoso", section: "Assembly", services: 4, status: "Aktif", avatarClass: "bg-blue-700 text-white" },
  { id: "EMP-002", nik: "EMP-002", name: "Doni Prasetyo", section: "PE", services: 3, status: "Aktif", avatarClass: "bg-slate-600 text-white" },
  { id: "EMP-003", nik: "EMP-003", name: "Hendra Wijaya", section: "HR", services: 5, status: "Aktif", avatarClass: "bg-blue-100 text-blue-700" },
  { id: "EMP-004", nik: "EMP-004", name: "Rina Wulandari", section: "GA", services: 4, status: "Aktif", avatarClass: "bg-purple-100 text-purple-700" },
  { id: "EMP-005", nik: "EMP-005", name: "Ahmad Fauzi", section: "Assembly", services: 2, status: "Nonaktif", avatarClass: "bg-slate-200 text-slate-500" },
];

export default function PicPage() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider mb-1">
            <span>Master Data</span><span>/</span><span className="text-blue-700 font-bold">PIC</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">PIC</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola data PIC yang bertanggung jawab menangani layanan internal.</p>
        </div>
        <Link href="/admin/pic/tambah" className="px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg flex items-center gap-2 shadow-sm transition-all shrink-0">
          <PlusCircle className="w-4 h-4" /> Tambah PIC
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total PIC", value: 14, sub: "Terdaftar di sistem" },
          { label: "PIC Aktif", value: 13, sub: "92.8% siap bertugas operasional" },
          { label: "PIC Nonaktif", value: 1, sub: "Nonaktif sementara" },
          { label: "Section dengan PIC", value: 5, sub: "Tersebar di 5 section" },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <span className="text-xs uppercase text-slate-500 font-semibold">{c.label}</span>
            <div className="mt-2 text-2xl font-bold text-slate-900">{c.value}</div>
            <div className="mt-1 text-xs text-slate-500">{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative min-w-[260px] flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700/20" placeholder="Cari nama PIC atau NIK..." type="text" />
          </div>
          <select className="bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-lg px-3 py-2 focus:outline-none">
            <option>Semua Section</option>
            <option>Assembly</option>
            <option>PE</option>
            <option>HR</option>
            <option>GA</option>
            <option>IS</option>
          </select>
          <select className="bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-lg px-3 py-2 focus:outline-none">
            <option>Semua Status</option>
            <option>Aktif</option>
            <option>Nonaktif</option>
          </select>
          <button className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors" title="Reset Filter">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 self-start lg:self-auto">
          <BarChart3 className="w-4 h-4 text-blue-700" />
          <span className="text-xs text-slate-500">Rasio Penugasan:</span>
          <span className="text-xs font-bold text-slate-900">2.8 PIC / Section</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-visible">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider">
                <th className="py-3 px-6 font-semibold">Nama PIC</th>
                <th className="py-3 px-4 font-semibold">NIK</th>
                <th className="py-3 px-4 font-semibold">Section</th>
                <th className="py-3 px-4 font-semibold">Layanan Ditangani</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-6 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {picList.map((p) => (
                <tr key={p.id} className={`hover:bg-slate-50/60 transition-colors ${p.status === "Nonaktif" ? "opacity-80" : ""}`}>
                  <td className="py-3.5 px-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-xs ${p.avatarClass}`}>
                        {p.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-slate-900 truncate">{p.name}</span>
                        <span className="text-xs text-slate-400">Person in Charge</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-semibold"><span className="px-2 py-1 bg-slate-100 text-slate-600 rounded">{p.nik}</span></td>
                  <td className="py-3.5 px-4"><span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-semibold">{p.section}</span></td>
                  <td className="py-3.5 px-4">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                      <Wrench className="w-3.5 h-3.5 text-blue-700" /> {p.services} Layanan
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    {p.status === "Aktif" ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-50 text-slate-900 text-xs font-semibold">
                        <span className="w-2 h-2 rounded-full bg-blue-700"></span> Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold">
                        <span className="w-2 h-2 rounded-full bg-slate-400"></span> Nonaktif
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-6 text-right relative">
                    <button className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors" onClick={() => setOpenMenu(openMenu === p.id ? null : p.id)}>
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    {openMenu === p.id && (
                      <div className="absolute right-6 top-12 w-48 bg-white rounded-xl shadow-xl p-1 z-30 flex flex-col text-left border border-slate-200">
                        <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-800 text-sm"><Eye className="w-4 h-4 text-slate-400" /> Lihat Detail</button>
                        <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-800 text-sm"><Pencil className="w-4 h-4 text-slate-400" /> Edit PIC</button>
                        {p.status === "Aktif" ? (
                          <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-rose-50 text-rose-600 text-sm"><Ban className="w-4 h-4" /> Nonaktifkan</button>
                        ) : (
                          <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-emerald-50 text-emerald-600 text-sm"><CheckCircle2 className="w-4 h-4" /> Aktifkan</button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
          <span className="text-xs text-slate-500">Menampilkan <span className="font-semibold text-slate-900">1-5</span> dari <span className="font-semibold text-slate-900">14</span> PIC</span>
          <div className="flex items-center gap-1.5">
            <button className="w-8 h-8 rounded-lg bg-blue-700 text-white font-semibold flex items-center justify-center shadow-xs">1</button>
            <button className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-colors">2</button>
            <button className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-colors">3</button>
          </div>
        </div>
      </div>
    </>
  );
}
