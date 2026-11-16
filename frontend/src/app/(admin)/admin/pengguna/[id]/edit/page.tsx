"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { User, Hash, AtSign, Building2, ShieldCheck, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function EditPenggunaPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [name, setName] = useState("Budi Santoso");
  const [nik, setNik] = useState("22010321");
  const [email, setEmail] = useState("budi.santoso@company.com");
  const [section, setSection] = useState("Assembly");
  const [role, setRole] = useState("PIC");
  const [status, setStatus] = useState("Aktif");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/admin/pengguna/${params.id}`);
  }

  return (
    <>
      <Link href={`/admin/pengguna/${params.id}`} className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Detail Pengguna
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Edit Pengguna</h1>
        <p className="text-sm text-slate-500 mt-1">Perbarui data identitas, section, dan role akun pengguna.</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl flex flex-col gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 pb-4 mb-5 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700">
              <User className="w-5 h-5" />
            </div>
            <h2 className="text-base font-semibold text-slate-900">Identitas Akun Pengguna</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Nama Lengkap</label>
              <div className="relative flex items-center">
                <User className="absolute left-3 w-[18px] h-[18px] text-slate-400" />
                <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">NIK</label>
              <div className="relative flex items-center">
                <Hash className="absolute left-3 w-[18px] h-[18px] text-slate-400" />
                <input value={nik} onChange={(e) => setNik(e.target.value)} required className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Email Perusahaan</label>
              <div className="relative flex items-center">
                <AtSign className="absolute left-3 w-[18px] h-[18px] text-slate-400" />
                <input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Section Unit</label>
              <div className="relative flex items-center">
                <Building2 className="absolute left-3 w-[18px] h-[18px] text-slate-400 pointer-events-none" />
                <select value={section} onChange={(e) => setSection(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 appearance-none focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 cursor-pointer">
                  <option>Assembly</option>
                  <option>HR</option>
                  <option>IS</option>
                  <option>PE</option>
                  <option>GA</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Role Pengguna</label>
              <div className="relative flex items-center">
                <ShieldCheck className="absolute left-3 w-[18px] h-[18px] text-slate-400 pointer-events-none" />
                <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 appearance-none focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 cursor-pointer">
                  <option>Karyawan</option>
                  <option>PIC</option>
                  <option>Supervisor</option>
                  <option>Admin</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Status Akun</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
                <button type="button" onClick={() => setStatus("Aktif")} className={`py-2 rounded text-xs font-semibold transition-colors ${status === "Aktif" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}>Aktif</button>
                <button type="button" onClick={() => setStatus("Nonaktif")} className={`py-2 rounded text-xs font-semibold transition-colors ${status === "Nonaktif" ? "bg-white text-slate-700 shadow-sm" : "text-slate-500"}`}>Nonaktif</button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <Link href={`/admin/pengguna/${params.id}`} className="px-5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium">Batal</Link>
          <button type="submit" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold shadow-sm">
            <CheckCircle2 className="w-[18px] h-[18px]" /> Simpan Perubahan
          </button>
        </div>
      </form>
    </>
  );
}
