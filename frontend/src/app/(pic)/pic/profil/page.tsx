"use client";

import { useState } from "react";
import { Briefcase, Building2, Mail, Phone, RotateCcw, Save, ShieldCheck } from "lucide-react";
import { Avatar, PageHeader } from "@/components/shared/display";
import { usePicStore, useRingkasan } from "@/lib/pic/store";

const input = "w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 hover:border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all";

export default function ProfilPage() {
  const { profil, setProfil, toast, resetDemo } = usePicStore();
  const r = useRingkasan();
  const [form, setForm] = useState({ nama: profil.nama, email: profil.email, telepon: profil.telepon });
  const [err, setErr] = useState<Record<string, string>>({});

  const simpan = (e: React.FormEvent) => {
    e.preventDefault();
    const x: Record<string, string> = {};
    if (form.nama.trim().length < 3) x.nama = "Nama minimal 3 karakter.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) x.email = "Format email tidak valid.";
    if (form.telepon.replace(/\D/g, "").length < 8) x.telepon = "Nomor telepon tidak valid.";
    setErr(x);
    if (Object.keys(x).length) return;
    setProfil(form);
    toast({ tone: "success", title: "Profil diperbarui", desc: "Perubahan profil Anda telah disimpan." });
  };

  const field = (k: "nama" | "email" | "telepon", label: string, type = "text") => (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-slate-700">{label}</span>
      <input type={type} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className={`${input} ${err[k] ? "!border-rose-400 !ring-4 !ring-rose-100" : ""}`} />
      {err[k] && <span className="text-[11px] text-rose-600">{err[k]}</span>}
    </label>
  );

  return (
    <>
      <PageHeader title="Profil & Pengaturan" desc="Kelola informasi akun PIC Anda." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <section className="bg-white border border-border-subtle rounded-xl p-6 flex flex-col items-center text-center gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <Avatar nama={profil.nama} size="lg" />
          <div>
            <h2 className="text-base font-semibold text-slate-900">{profil.nama}</h2>
            <p className="text-xs text-slate-500">{profil.jabatan}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full"><ShieldCheck className="w-3.5 h-3.5" /> PIC Aktif</span>
          <dl className="w-full mt-2 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
            {[["Aktif", r.aktif], ["Selesai", r.selesai], ["Masuk", r.menunggu]].map(([l, v]) => (
              <div key={l}>
                <dd className="text-lg font-semibold text-slate-900">{v}</dd>
                <dt className="text-[11px] text-slate-400">{l}</dt>
              </div>
            ))}
          </dl>
          <ul className="w-full text-left text-xs text-slate-600 flex flex-col gap-2.5 border-t border-slate-100 pt-4">
            <li className="flex items-center gap-2.5"><Building2 className="w-4 h-4 text-slate-400" />{profil.seksi}</li>
            <li className="flex items-center gap-2.5"><Briefcase className="w-4 h-4 text-slate-400" />NIK {profil.nik}</li>
            <li className="flex items-center gap-2.5"><Mail className="w-4 h-4 text-slate-400" /><span className="truncate">{profil.email}</span></li>
            <li className="flex items-center gap-2.5"><Phone className="w-4 h-4 text-slate-400" />{profil.telepon}</li>
          </ul>
        </section>

        <div className="lg:col-span-2 flex flex-col gap-6">
          <form onSubmit={simpan} className="bg-white border border-border-subtle rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">Informasi Kontak</h2>
              <p className="text-xs text-slate-400">NIK, seksi, dan jabatan dikelola oleh Administrator.</p>
            </div>
            <div className="p-5 grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">{field("nama", "Nama Lengkap")}</div>
              {field("email", "Email", "email")}
              {field("telepon", "Nomor Telepon")}
              <label className="flex flex-col gap-1.5"><span className="text-xs font-semibold text-slate-700">NIK</span><input disabled value={profil.nik} className={`${input} bg-slate-50 text-slate-500`} /></label>
              <label className="flex flex-col gap-1.5"><span className="text-xs font-semibold text-slate-700">Seksi</span><input disabled value={profil.seksi} className={`${input} bg-slate-50 text-slate-500`} /></label>
            </div>
            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button type="submit" className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-all hover:-translate-y-0.5"><Save className="w-4 h-4" /> Simpan Perubahan</button>
            </div>
          </form>

          <section className="bg-white border border-border-subtle rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Data Demo</h2>
              <p className="text-xs text-slate-500 mt-1 max-w-md">Antrean saat ini memakai data contoh yang tersimpan di browser. Kembalikan ke kondisi awal untuk mengulang alur terima, tolak, dan selesaikan.</p>
            </div>
            <button
              onClick={() => {
                resetDemo();
                toast({ tone: "info", title: "Data demo direset", desc: "Antrean dikembalikan ke kondisi awal." });
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:border-blue-200 hover:text-blue-800 transition-all shrink-0"
            >
              <RotateCcw className="w-4 h-4" /> Reset Data Demo
            </button>
          </section>
        </div>
      </div>
    </>
  );
}
