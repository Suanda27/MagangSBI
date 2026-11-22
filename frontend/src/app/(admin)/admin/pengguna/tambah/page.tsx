"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Hash, AtSign, Building2, ShieldCheck, KeyRound, Info, ArrowLeft, CheckCircle2 } from "lucide-react";

const roleDescriptions: Record<string, string> = {
  Karyawan: "Karyawan dapat mengajukan tiket layanan ISM, melihat perkembangan permintaan mereka sendiri, dan memberikan penilaian kepuasan layanan.",
  PIC: "PIC (Person In Charge) ditugaskan untuk menerima penugasan tiket perbaikan/layanan di section terkait, memperbarui log tindakan, dan menyelesaikan kendala.",
  Supervisor: "Supervisor dapat meninjau semua permohonan yang masuk dari seksi terkait, melakukan eskalasi tugas, serta menandatangani persetujuan pengadaan.",
  Admin: "Administrator memiliki wewenang penuh atas konsol konfigurasi Master Data, audit log, perizinan pengguna, dan laporan analitik global ISM.",
};

export default function TambahPenggunaPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [nik, setNik] = useState("");
  const [email, setEmail] = useState("");
  const [section, setSection] = useState("");
  const [role, setRole] = useState("Karyawan");

  const initials = name.trim()
    ? name.trim().split(" ").length > 1
      ? (name.trim().split(" ")[0][0] + name.trim().split(" ")[1][0]).toUpperCase()
      : name.trim().slice(0, 2).toUpperCase()
    : "--";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push("/admin/pengguna");
  }

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <Link href="/admin/pengguna" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Pengguna
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tambah Pengguna</h1>
        <p className="text-sm text-slate-500 mt-1">Tambahkan akun pengguna baru ke dalam sistem direktori internal.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-8 flex flex-col gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 pb-4 mb-5 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Identitas Akun Pengguna</h2>
                <p className="text-xs text-slate-500">Data identifikasi karyawan &amp; pemetaan unit organisasi</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">Nama Lengkap <span className="text-rose-500">*</span></label>
                <div className="relative flex items-center">
                  <User className="absolute left-3 w-[18px] h-[18px] text-slate-400" />
                  <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Masukkan nama lengkap karyawan" className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">Nomor Induk Karyawan (NIK) <span className="text-rose-500">*</span></label>
                <div className="relative flex items-center">
                  <Hash className="absolute left-3 w-[18px] h-[18px] text-slate-400" />
                  <input value={nik} onChange={(e) => setNik(e.target.value)} required minLength={6} placeholder="Contoh: 22010456" className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                </div>
                <span className="text-[11px] text-slate-400">NIK harus unik dan terdaftar di database HR</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">Email Perusahaan <span className="text-rose-500">*</span></label>
                <div className="relative flex items-center">
                  <AtSign className="absolute left-3 w-[18px] h-[18px] text-slate-400" />
                  <input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" placeholder="nama@company.com" className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">Section Unit <span className="text-rose-500">*</span></label>
                <div className="relative flex items-center">
                  <Building2 className="absolute left-3 w-[18px] h-[18px] text-slate-400 pointer-events-none" />
                  <select value={section} onChange={(e) => setSection(e.target.value)} required className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 appearance-none focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 cursor-pointer">
                    <option value="" disabled>Pilih Section Unit...</option>
                    <option value="Assembly">Assembly - Produksi &amp; Manufaktur</option>
                    <option value="HR">HR - Human Resources</option>
                    <option value="IS">IS - Information Systems</option>
                    <option value="PE">PE - Production Engineering</option>
                    <option value="GA">GA - General Affairs</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">Role Pengguna <span className="text-rose-500">*</span></label>
                <div className="relative flex items-center">
                  <ShieldCheck className="absolute left-3 w-[18px] h-[18px] text-slate-400 pointer-events-none" />
                  <select value={role} onChange={(e) => setRole(e.target.value)} required className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 appearance-none focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 cursor-pointer">
                    <option value="Karyawan">Karyawan (Standard Requester)</option>
                    <option value="PIC">PIC (Service Executor / Solver)</option>
                    <option value="Supervisor">Supervisor (Approval &amp; Monitor)</option>
                    <option value="Admin">Admin (Full Access Console)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 pb-4 mb-5 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Keamanan Akun</h2>
                <p className="text-xs text-slate-500">Kredensial login awal untuk autentikasi pertama kali</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">Kata Sandi / Password <span className="text-rose-500">*</span></label>
                <input type="password" required minLength={8} placeholder="Minimal 8 karakter" className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">Konfirmasi Kata Sandi <span className="text-rose-500">*</span></label>
                <input type="password" required minLength={8} placeholder="Ulangi kata sandi" className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </div>
            </div>
            <div className="mt-4 p-3 rounded-lg bg-slate-50 flex items-center gap-2 text-xs text-slate-500">
              <Info className="w-4 h-4 shrink-0" />
              Karyawan akan diminta memperbarui kata sandi ini saat pertama kali login ke ISM System.
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 bg-white p-4 rounded-xl shadow-sm border border-slate-200 gap-3">
            <Link href="/admin/pengguna" className="px-5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors">Batal</Link>
            <button type="submit" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold shadow-sm transition-all">
              <CheckCircle2 className="w-[18px] h-[18px]" /> Selesai
            </button>
          </div>
        </div>

        <div className="xl:col-span-4 flex flex-col gap-6 sticky top-20">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-700"></span> Pratinjau ID Card
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700">Aktif</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-2xl shadow-inner mb-2">{initials}</div>
              <h3 className="text-base font-semibold text-slate-900 truncate w-full">{name || "Nama Pengguna"}</h3>
              <p className="text-xs text-slate-400 font-mono mt-1">NIK: {nik || "2201XXXX"}</p>
              <span className="text-xs text-blue-700 font-medium mt-1">{email || "user@company.com"}</span>
              <div className="flex items-center gap-2 mt-3">
                <div className="px-2 py-1 rounded bg-white shadow-sm flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-800">{section || "Belum Ada Section"}</span>
                </div>
                <div className="px-2 py-1 rounded bg-white shadow-sm flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-800">{role}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 rounded-lg bg-slate-100 flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Cakupan Hak Akses Role</span>
              <p className="text-xs text-slate-500 leading-relaxed">{roleDescriptions[role]}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-blue-700" />
              <h4 className="text-sm font-semibold text-slate-900">Ketentuan Pendaftaran</h4>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-500">
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" /> NIK wajib unik dan belum pernah didaftarkan dalam sistem.</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" /> Email harus berdomain korporat resmi dan aktif.</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" /> Kata sandi minimal 8 karakter dengan kombinasi alfanumerik.</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" /> Penetapan role Admin atau Supervisor memerlukan validasi Section Head.</li>
            </ul>
          </div>
        </div>
      </form>
    </>
  );
}
