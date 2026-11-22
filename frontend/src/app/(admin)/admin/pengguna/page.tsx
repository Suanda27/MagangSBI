"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Filter, UserPlus, Upload, MoreHorizontal, Eye, Pencil, UserX, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";

type User = {
  id: string;
  nik: string;
  name: string;
  jobTitle: string;
  email: string;
  section: string;
  role: "Karyawan" | "PIC" | "Supervisor" | "Admin";
  status: "Aktif" | "Nonaktif";
  initials: string;
  avatarClass: string;
};

const users: User[] = [
  { id: "1", nik: "22010456", name: "Andi Pratama", jobTitle: "Assembly Line 2", email: "andi.pratama@company.com", section: "Assembly", role: "Karyawan", status: "Aktif", initials: "AP", avatarClass: "bg-slate-100 text-slate-600 border border-slate-200" },
  { id: "2", nik: "22010321", name: "Budi Santoso", jobTitle: "PIC Section Support", email: "budi.santoso@company.com", section: "Assembly", role: "PIC", status: "Aktif", initials: "BS", avatarClass: "bg-blue-100 text-blue-700 border border-blue-200" },
  { id: "3", nik: "22010214", name: "Siti Rahma", jobTitle: "Talent & Operations", email: "siti.rahma@company.com", section: "HR", role: "PIC", status: "Aktif", initials: "SR", avatarClass: "bg-blue-100 text-blue-700 border border-blue-200" },
  { id: "4", nik: "22010190", name: "Dimas Saputra", jobTitle: "Lead Infrastructure", email: "dimas.saputra@company.com", section: "IS", role: "Supervisor", status: "Aktif", initials: "DS", avatarClass: "bg-purple-100 text-purple-800 border border-purple-200" },
  { id: "5", nik: "22010155", name: "Doni Prasetyo", jobTitle: "Equipment Tech", email: "doni.prasetyo@company.com", section: "PE", role: "PIC", status: "Aktif", initials: "DP", avatarClass: "bg-blue-100 text-blue-700 border border-blue-200" },
  { id: "6", nik: "22010102", name: "Hendra Wijaya", jobTitle: "Facilities Officer", email: "hendra.wijaya@company.com", section: "GA", role: "Admin", status: "Aktif", initials: "HW", avatarClass: "bg-slate-800 text-white" },
  { id: "7", nik: "22010388", name: "Ahmad Fauzi", jobTitle: "Assembly Line 1", email: "ahmad.fauzi@company.com", section: "Assembly", role: "Karyawan", status: "Nonaktif", initials: "AF", avatarClass: "bg-slate-200 text-slate-500" },
];

const roleBadge: Record<User["role"], string> = {
  Karyawan: "bg-slate-100 text-slate-700",
  PIC: "bg-blue-50 text-blue-700",
  Supervisor: "bg-purple-50 text-purple-700",
  Admin: "bg-slate-900 text-white",
};

export default function PenggunaPage() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pengguna</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">Master Data</span>
          </div>
          <p className="text-sm text-slate-500 mt-1">Kelola data pengguna yang menggunakan sistem layanan internal.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2 shadow-sm">
            <Upload className="w-4 h-4 text-slate-500" />
            Import CSV
          </button>
          <Link href="/admin/pengguna/tambah" className="px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg flex items-center gap-2 shadow-sm transition-all">
            <UserPlus className="w-4 h-4" />
            Tambah Pengguna
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Pengguna", value: 128, sub: "Tersimpan di database" },
          { label: "Pengguna Aktif", value: 124, sub: "Akun memiliki akses aktif" },
          { label: "Pengguna Nonaktif", value: 4, sub: "Akses dinonaktifkan" },
          { label: "Total PIC", value: 14, sub: "Bertugas menangani tiket" },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">{c.label}</span>
            </div>
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
            <input className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 transition-all" placeholder="Cari nama, NIK, atau email..." type="text" />
          </div>
          <select className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-700/20 cursor-pointer">
            <option value="">Semua Section</option>
            <option>Assembly</option>
            <option>HR</option>
            <option>IS</option>
            <option>PE</option>
            <option>GA</option>
          </select>
          <select className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-700/20 cursor-pointer">
            <option value="">Semua Role</option>
            <option>Karyawan</option>
            <option>PIC</option>
            <option>Supervisor</option>
            <option>Admin</option>
          </select>
          <select className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-700/20 cursor-pointer">
            <option value="">Semua Status</option>
            <option>Aktif</option>
            <option>Nonaktif</option>
          </select>
          <button className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors" title="Reset Filter">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-6">Nama</th>
                <th className="py-3 px-4">NIK</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Section</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className={`hover:bg-slate-50/70 transition-colors ${u.status === "Nonaktif" ? "bg-slate-50/30 opacity-80" : ""}`}>
                  <td className="py-3.5 px-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${u.avatarClass}`}>{u.initials}</div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-slate-900 truncate">{u.name}</span>
                        <span className="text-[11px] text-slate-400 truncate">{u.jobTitle}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-700">{u.nik}</td>
                  <td className="py-3.5 px-4 text-slate-500">{u.email}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-700">{u.section}</td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${roleBadge[u.role]}`}>{u.role}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    {u.status === "Aktif" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-[11px] font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>Nonaktif
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-6 text-right relative">
                    <button
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                      onClick={() => setOpenMenu(openMenu === u.id ? null : u.id)}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    {openMenu === u.id && (
                      <div className="absolute right-6 top-10 w-44 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-30 text-left">
                        <Link href={`/admin/pengguna/${u.id}`} className="w-full px-3.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                          <Eye className="w-3.5 h-3.5 text-slate-400" /> Lihat Detail
                        </Link>
                        <Link href={`/admin/pengguna/${u.id}/edit`} className="w-full px-3.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                          <Pencil className="w-3.5 h-3.5 text-slate-400" /> Edit Profil
                        </Link>
                        <div className="border-t border-slate-100 my-1"></div>
                        {u.status === "Aktif" ? (
                          <button className="w-full px-3.5 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2">
                            <UserX className="w-3.5 h-3.5" /> Nonaktifkan
                          </button>
                        ) : (
                          <button className="w-full px-3.5 py-2 text-left text-xs text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Aktifkan
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <span className="text-slate-500">Menampilkan <strong className="text-slate-800 font-semibold">1–7</strong> dari <strong className="text-slate-800 font-semibold">128</strong> pengguna</span>
          <div className="flex items-center gap-1.5">
            <button className="px-2.5 py-1.5 text-slate-400 hover:text-slate-600 font-medium disabled:opacity-40 flex items-center gap-1" disabled>
              <ChevronLeft className="w-3.5 h-3.5" /> Sebelumnya
            </button>
            <button className="w-7 h-7 rounded-md bg-blue-800 text-white font-medium flex items-center justify-center">1</button>
            <button className="px-2.5 py-1.5 text-slate-600 hover:text-slate-800 font-medium flex items-center gap-1">
              Selanjutnya <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
