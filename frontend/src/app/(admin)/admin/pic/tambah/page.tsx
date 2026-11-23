"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Badge, Factory, Phone, ShieldCheck, Mail, Lock, CheckCircle2 } from "lucide-react";

const karyawanOptions = [
  { id: "EMP-001", label: "Budi Santoso — EMP-001 (Assembly)", section: "Assembly", email: "budi@company.com", role: "Senior Operator" },
  { id: "EMP-002", label: "Siti Rahmawati — EMP-002 (Quality Control)", section: "Quality Control", email: "siti@company.com", role: "QC Staff" },
  { id: "EMP-003", label: "Dimas Anggara — EMP-003 (Warehouse)", section: "Warehouse", email: "dimas@company.com", role: "Logistics Staff" },
];

export default function TambahPicPage() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(karyawanOptions[0].id);
  const [section, setSection] = useState("Information System");
  const [status, setStatus] = useState<"active" | "inactive">("active");

  const selected = karyawanOptions.find((k) => k.id === selectedId)!;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push("/admin/pic");
  }

  return (
    <>
      <Link href="/admin/pic" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" /> Kembali ke PIC
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tambah PIC</h1>
        <p className="text-sm text-slate-500 mt-1">Tambahkan karyawan sebagai PIC untuk menangani layanan internal dan alokasi tiket sistem.</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto w-full flex flex-col gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8 flex flex-col gap-8">
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-1">
              <span className="w-1.5 h-4 rounded-full bg-blue-700"></span>
              <h2 className="text-sm font-bold uppercase tracking-tight text-blue-700">1. Pilih Karyawan</h2>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">Karyawan Terdaftar <span className="text-rose-500">*</span></label>
              <div className="relative flex items-center">
                <Badge className="absolute left-3.5 w-5 h-5 text-slate-400" />
                <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-slate-50 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-700/20 appearance-none cursor-pointer">
                  {karyawanOptions.map((k) => (
                    <option key={k.id} value={k.id}>{k.label}</option>
                  ))}
                </select>
              </div>
              <span className="text-xs text-slate-500">Pilih karyawan terdaftar yang akan ditunjuk sebagai Person in Charge (PIC).</span>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-700" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900">Data Identitas Karyawan Terverifikasi</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex flex-col justify-center bg-white p-3 rounded-lg shadow-sm sm:col-span-2">
                  <span className="text-xs text-slate-500">Nama Lengkap</span>
                  <span className="text-sm font-bold text-slate-900">{selected.label.split(" — ")[0]}</span>
                  <span className="text-xs text-slate-500">Role: {selected.role}</span>
                </div>
                <div className="flex flex-col justify-center bg-white p-3 rounded-lg shadow-sm">
                  <span className="text-xs text-slate-500">Nomor Induk (NIK)</span>
                  <div className="flex items-center gap-1 text-slate-900 font-semibold text-sm mt-0.5">{selected.id} <Lock className="w-3.5 h-3.5 text-slate-400" /></div>
                </div>
                <div className="flex flex-col justify-center bg-white p-3 rounded-lg shadow-sm">
                  <span className="text-xs text-slate-500">Section Asal</span>
                  <span className="text-sm font-semibold text-slate-900">{selected.section}</span>
                </div>
                <div className="flex flex-col justify-center bg-white p-3 rounded-lg shadow-sm sm:col-span-2">
                  <span className="text-xs text-slate-500">Email Korporat</span>
                  <div className="flex items-center gap-1.5 text-slate-900 font-medium text-sm mt-0.5"><Mail className="w-4 h-4 text-slate-400" /> {selected.email}</div>
                </div>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-4 pt-1">
            <div className="flex items-center gap-2 pb-1">
              <span className="w-1.5 h-4 rounded-full bg-blue-700"></span>
              <h2 className="text-sm font-bold uppercase tracking-tight text-blue-700">2. Informasi &amp; Penugasan PIC</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Section Penanggung Jawab <span className="text-rose-500">*</span></label>
                <div className="relative flex items-center">
                  <Factory className="absolute left-3.5 w-5 h-5 text-slate-400" />
                  <select value={section} onChange={(e) => setSection(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-slate-50 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-700/20 appearance-none cursor-pointer">
                    <option>Assembly</option>
                    <option>General Affairs</option>
                    <option>Human Resource</option>
                    <option>Information System</option>
                    <option>Production Engineering</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Nomor Telepon / Extension</label>
                <div className="relative flex items-center">
                  <Phone className="absolute left-3.5 w-5 h-5 text-slate-400" />
                  <input defaultValue="+62 21 8934 001 (Ext. 402)" placeholder="Contoh: Ext 402" className="w-full pl-11 pr-4 py-2.5 bg-slate-50 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-700/20" />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <label className="text-sm font-semibold text-slate-700">Status PIC</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className={`flex flex-col p-4 rounded-xl cursor-pointer shadow-sm transition-all ${status === "active" ? "bg-blue-50" : "bg-slate-50 hover:bg-slate-100"}`}>
                  <div className="flex items-center justify-between w-full mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-blue-700"></span>
                      <span className="text-sm font-bold text-blue-700">Aktif</span>
                    </div>
                    <input type="radio" checked={status === "active"} onChange={() => setStatus("active")} className="accent-blue-700" />
                  </div>
                  <span className="text-xs text-slate-600 leading-relaxed">PIC aktif dapat menerima penugasan layanan baru dan notifikasi eskalasi harian.</span>
                </label>
                <label className={`flex flex-col p-4 rounded-xl cursor-pointer shadow-sm transition-all ${status === "inactive" ? "bg-slate-200" : "bg-slate-50 hover:bg-slate-100"}`}>
                  <div className="flex items-center justify-between w-full mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-slate-500"></span>
                      <span className="text-sm font-bold text-slate-900">Nonaktif</span>
                    </div>
                    <input type="radio" checked={status === "inactive"} onChange={() => setStatus("inactive")} className="accent-blue-700" />
                  </div>
                  <span className="text-xs text-slate-500 leading-relaxed">PIC disimpan sebagai draft, cocok untuk masa pelatihan atau transisi shift.</span>
                </label>
              </div>
            </div>
          </section>

          <div className="bg-blue-50/60 rounded-xl p-4 flex items-start gap-3">
            <ShieldCheck className="w-8 h-8 text-blue-700 bg-blue-700/10 rounded-full p-1.5 shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Integritas Sistem Terverifikasi</span>
              <p className="text-sm text-slate-900">Karyawan ini belum terdaftar sebagai PIC aktif di departemen lain. Penugasan ke section <strong>{section}</strong> aman diproses.</p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between flex-wrap gap-4">
            <Link href="/admin/pic" className="px-5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium flex items-center gap-1.5">
              <ArrowLeft className="w-[18px] h-[18px]" /> Batal
            </Link>
            <button type="submit" className="px-6 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold flex items-center gap-2 shadow-sm">
              Selesai &amp; Tugaskan <CheckCircle2 className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
