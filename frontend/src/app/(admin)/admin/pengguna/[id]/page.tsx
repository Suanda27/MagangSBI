"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Pencil, UserX, CheckCircle2, Mail, Building2, Factory, Clock, ShieldCheck, Wrench, AlertTriangle } from "lucide-react";

const layananDitangani = [
  { name: "Sensor & Otomasi", code: "SRV-ASY-001", category: "Peralatan & Otomasi", section: "Assembly", plant: "Plant 2" },
  { name: "Perbaikan Fasilitas", code: "SRV-ASY-004", category: "Maintenance & Perbaikan", section: "Assembly", plant: "Plant 2" },
  { name: "Troubleshooting PLC", code: "SRV-ASY-009", category: "Maintenance & Perbaikan", section: "Assembly", plant: "Plant 2" },
  { name: "Pelaporan Kerusakan", code: "SRV-ASY-012", category: "Pelaporan Masalah", section: "Assembly", plant: "Plant 2" },
];

export default function DetailPenggunaPage() {
  const params = useParams<{ id: string }>();
  const [isActive, setIsActive] = useState(true);
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <Link href="/admin/pengguna" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Pengguna
        </Link>
        <span className="text-xs text-slate-400">Record ID: <span className="font-mono text-slate-700 font-medium">USR-{params.id}</span></span>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Detail Pengguna</h1>
            {isActive ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Aktif
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Nonaktif
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">Informasi lengkap akun dan otorisasi pengguna dalam sistem ISM.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/admin/pengguna/${params.id}/edit`} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-blue-700 font-semibold text-sm shadow-sm hover:bg-slate-50 transition-all">
            <Pencil className="w-4 h-4" /> Edit Pengguna
          </Link>
          <button onClick={() => setShowModal(true)} className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${isActive ? "bg-rose-50 text-rose-600 hover:bg-rose-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"}`}>
            {isActive ? <UserX className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            {isActive ? "Nonaktifkan" : "Aktifkan"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-20 h-20 rounded-xl bg-blue-700 text-white flex items-center justify-center font-bold text-3xl shadow-sm shrink-0">BS</div>
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">Budi Santoso</h2>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-600">NIK: {params.id === "1" ? "22010456" : "22010321"}</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-700 text-white text-[11px]"><ShieldCheck className="w-3 h-3" /> PIC</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
              <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> Section: <strong className="font-semibold text-slate-800">Assembly</strong></span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> budi.santoso@company.com</span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1"><Factory className="w-3.5 h-3.5" /> Plant 2 Scope</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-lg self-start md:self-auto">
          <Clock className="w-5 h-5 text-slate-400" />
          <div className="flex flex-col text-left">
            <span className="text-[10px] uppercase text-slate-400">Login Terakhir</span>
            <span className="text-xs font-semibold text-slate-800">Hari ini, 08:42 WIB</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <ShieldCheck className="w-5 h-5 text-blue-700" />
            <h3 className="text-base font-semibold text-slate-900">Identitas Karyawan</h3>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 flex flex-col gap-1">
            <span className="text-[11px] uppercase text-slate-400">Nama Lengkap</span>
            <span className="text-sm font-semibold text-slate-900">Budi Santoso</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-lg p-3 flex flex-col gap-1">
              <span className="text-[11px] uppercase text-slate-400">NIK</span>
              <span className="text-sm font-mono font-semibold text-slate-900">22010321</span>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 flex flex-col gap-1">
              <span className="text-[11px] uppercase text-slate-400">Role Sistem</span>
              <span className="text-sm font-semibold text-blue-700">PIC</span>
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 flex flex-col gap-1">
            <span className="text-[11px] uppercase text-slate-400">Email Perusahaan</span>
            <span className="text-sm font-mono font-medium text-slate-900">budi.santoso@company.com</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-lg p-3 flex flex-col gap-1">
              <span className="text-[11px] uppercase text-slate-400">Unit Section</span>
              <span className="text-sm font-semibold text-slate-900">Assembly</span>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 flex flex-col gap-1">
              <span className="text-[11px] uppercase text-slate-400">Status Akun</span>
              <span className={`text-sm font-semibold ${isActive ? "text-blue-700" : "text-rose-600"}`}>{isActive ? "Aktif" : "Nonaktif"}</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-6 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-blue-700" />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-slate-900">Layanan yang Ditangani</h3>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[11px] text-slate-500 font-semibold">{layananDitangani.length} Layanan</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Penugasan tanggung jawab operasional PIC pada katalog ISM</p>
              </div>
            </div>
          </div>
          <div className="mx-6 mb-4 px-3 py-2 rounded-lg bg-blue-50 flex items-center gap-2 text-xs text-blue-900">
            Pengguna ini terdaftar sebagai <strong>PIC Aktif</strong>. Tiket yang sesuai layanan di bawah diarahkan otomatis ke antrean PIC ini.
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs">
                  <th className="py-2 px-6 font-semibold uppercase">Nama Layanan</th>
                  <th className="py-2 px-4 font-semibold uppercase">Kategori</th>
                  <th className="py-2 px-4 font-semibold uppercase">Section</th>
                  <th className="py-2 px-6 font-semibold uppercase text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {layananDitangani.map((l) => (
                  <tr key={l.code} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-6">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">{l.name}</span>
                        <span className="text-xs text-slate-400 font-mono">{l.code}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">{l.category}</td>
                    <td className="py-3 px-4"><span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">{l.section}</span></td>
                    <td className="py-3 px-6 text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Aktif
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isActive ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
              {isActive ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mt-3">{isActive ? "Nonaktifkan Pengguna?" : "Aktifkan Pengguna?"}</h3>
            <p className="text-sm text-slate-500 mt-1">
              {isActive
                ? "Pengguna ini tidak dapat menggunakan sistem sampai akunnya diaktifkan kembali."
                : "Pengguna ini akan dapat kembali menggunakan sistem dan menerima penugasan tiket ISM."}
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium">Batal</button>
              <button
                onClick={() => { setIsActive(!isActive); setShowModal(false); }}
                className={`px-4 py-2 rounded-lg text-white text-sm font-medium shadow-sm ${isActive ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"}`}
              >
                {isActive ? "Nonaktifkan" : "Aktifkan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
