"use client";

import { useState } from "react";
import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  Circle,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import PageHeader from "@/components/supervisor/page-header";
import ReadOnlyBadge from "@/components/supervisor/read-only-badge";
import { SUPERVISOR as u } from "@/lib/supervisor-data";

const dl = (ms: number) => ({ "--delay": `${ms}ms` } as React.CSSProperties);

const fieldCls =
  "w-full h-11 pl-10 pr-3.5 bg-white border border-slate-300 rounded-lg text-sm placeholder:text-slate-400 hover:border-slate-400 focus:outline-none focus:border-blue-500 transition-all duration-300";
const lockedCls = "w-full h-11 pl-3.5 pr-10 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500 cursor-not-allowed";
const labelCls = "block text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5";

function strength(pw: string) {
  const rules = [
    { ok: pw.length >= 8, label: "Minimal 8 karakter" },
    { ok: /[a-z]/.test(pw) && /[A-Z]/.test(pw), label: "Huruf besar & huruf kecil" },
    { ok: /\d/.test(pw), label: "Minimal 1 angka" },
    { ok: /[^A-Za-z0-9]/.test(pw), label: "Simbol unik (@$!%*?&)" },
  ];
  const score = rules.filter((r) => r.ok).length;
  const meta = [
    { t: "Belum Diisi", c: "text-slate-400" },
    { t: "Lemah", c: "text-rose-600" },
    { t: "Cukup", c: "text-amber-600" },
    { t: "Baik", c: "text-blue-600" },
    { t: "Kuat", c: "text-emerald-600" },
  ][pw ? Math.max(score, 1) : 0];
  return { rules, score: pw ? score : 0, meta };
}

export default function PengaturanPage() {
  const [profile, setProfile] = useState({ name: u.name, email: u.email, phone: u.phone });
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [saving, setSaving] = useState<"" | "profile" | "pw">("");
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  const s = strength(pw.next);
  const bars = ["bg-rose-500", "bg-amber-500", "bg-blue-500", "bg-emerald-500"];

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2600);
  };

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving("profile");
    setTimeout(() => { setSaving(""); notify("Perubahan profil berhasil disimpan."); }, 800);
  };

  const savePw = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!pw.current) return setError("Masukkan password saat ini.");
    if (s.score < 3) return setError("Password baru belum memenuhi kebijakan keamanan.");
    if (pw.next !== pw.confirm) return setError("Konfirmasi password tidak cocok.");
    setSaving("pw");
    setTimeout(() => {
      setSaving("");
      setPw({ current: "", next: "", confirm: "" });
      notify("Password berhasil diperbarui.");
    }, 900);
  };

  const pwField = (k: "current" | "next" | "confirm", label: string, placeholder: string, Icon: typeof Lock) => (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="relative">
        <Icon className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
        <input type={show[k] ? "text" : "password"} value={pw[k]} onChange={(e) => setPw({ ...pw, [k]: e.target.value })} placeholder={placeholder} className={`${fieldCls} pr-10`} />
        <button type="button" onClick={() => setShow({ ...show, [k]: !show[k] })} className="absolute right-3 top-3 text-slate-400 hover:text-blue-600 transition-colors" aria-label="Tampilkan password">
          {show[k] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <PageHeader title="Pengaturan Akun" description="Kelola informasi profil dan keamanan akun pengawasan Anda.">
        <ReadOnlyBadge label="Supervisor (Read-Only)" />
      </PageHeader>

      {toast && (
        <div className="fixed top-20 right-4 md:right-8 z-50 flex items-center gap-3 rounded-xl border border-emerald-200 bg-white pl-4 pr-3 py-3 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center"><CheckCircle2 className="w-4 h-4" /></span>
          <div><p className="text-[13px] font-semibold text-slate-900">Sinkronisasi Berhasil</p><p className="text-xs text-slate-500">{toast}</p></div>
          <button onClick={() => setToast("")} className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100" aria-label="Tutup"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Kartu profil */}
      <section className="fx-reveal relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" style={dl(60)}>
        <div className="h-20 bg-gradient-to-r from-blue-900 via-blue-700 to-indigo-600 relative">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:18px_18px]" />
        </div>
        <div className="px-5 pb-5 -mt-9 flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="relative">
            <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-blue-700 to-blue-950 text-white flex items-center justify-center text-2xl font-semibold ring-4 ring-white shadow-lg">{u.initials}</div>
            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 ring-2 ring-white text-white flex items-center justify-center"><ShieldCheck className="w-3.5 h-3.5" /></span>
          </div>
          <div className="flex-1 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold text-slate-900">{u.name}</h2>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">Aktif</span>
            </div>
            <p className="text-[13px] text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>NIK: {u.nik}</span>
              <span className="inline-flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" />{u.section}</span>
              <span className="inline-flex items-center gap-1 text-blue-700"><BadgeCheck className="w-3.5 h-3.5" />{u.unit}</span>
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100 text-center">
          {[
            { v: "142", l: "Tiket Diawasi" },
            { v: "98.4%", l: "SLA Tercapai" },
            { v: "36", l: "Laporan Dibuat" },
          ].map((x) => (
            <div key={x.l} className="py-4"><p className="text-lg font-semibold text-slate-900">{x.v}</p><p className="text-[11px] text-slate-400">{x.l} • 30 hari</p></div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profil */}
        <section className="fx-reveal rounded-xl border border-slate-200 bg-white shadow-sm" style={dl(140)}>
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5"><span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center"><User className="w-4 h-4" /></span><h2 className="text-[15px] font-semibold text-slate-900">Informasi Profil</h2></div>
            <p className="text-xs text-slate-400 mt-1.5">Perbarui informasi pribadi dan kontak yang terhubung dengan akun Anda.</p>
          </div>
          <form onSubmit={saveProfile} className="p-5 grid gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[
                { l: "NIK", v: u.nik },
                { l: "Role Otoritas", v: "Supervisor Operasional" },
              ].map((f) => (
                <div key={f.l}>
                  <label className={labelCls}>{f.l}</label>
                  <div className="relative"><input disabled value={f.v} className={lockedCls} /><Lock className="absolute right-3 top-3.5 w-4 h-4 text-slate-300" /></div>
                </div>
              ))}
              <div className="sm:col-span-2">
                <label className={labelCls}>Section / Bagian Pengawasan</label>
                <div className="relative"><input disabled value={u.section} className={lockedCls} /><Lock className="absolute right-3 top-3.5 w-4 h-4 text-slate-300" /></div>
                <p className="text-[11px] text-slate-400 mt-1.5">Data kepegawaian dikelola oleh Divisi SDM dan Administrator ISM.</p>
              </div>
            </div>
            <div>
              <label className={labelCls}>Nama Lengkap</label>
              <div className="relative"><User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" /><input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className={fieldCls} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>Email Korporat</label>
                <div className="relative"><Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" /><input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className={fieldCls} /></div>
              </div>
              <div>
                <label className={labelCls}>Nomor Telepon</label>
                <div className="relative"><Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" /><input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className={fieldCls} /></div>
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={saving === "profile"} className="group fx-shine inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-800 to-blue-600 text-white text-[13px] font-medium shadow-sm shadow-blue-800/30 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-70">
                {saving === "profile" ? <><Loader2 className="w-4 h-4 animate-spin" />Menyimpan...</> : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        </section>

        {/* Keamanan */}
        <section className="fx-reveal rounded-xl border border-slate-200 bg-white shadow-sm" style={dl(220)}>
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5"><span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center"><KeyRound className="w-4 h-4" /></span><h2 className="text-[15px] font-semibold text-slate-900">Keamanan Akun</h2></div>
            <p className="text-xs text-slate-400 mt-1.5">Perbarui kata sandi secara berkala untuk menjaga integritas data pengawasan.</p>
          </div>
          <form onSubmit={savePw} className="p-5 grid gap-5">
            {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 animate-in fade-in slide-in-from-top-2 duration-300">{error}</div>}
            {pwField("current", "Password Saat Ini", "Masukkan password saat ini", Lock)}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {pwField("next", "Password Baru", "Minimal 8 karakter", Lock)}
              {pwField("confirm", "Konfirmasi Password", "Ulangi password baru", CheckCircle2)}
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-4">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-slate-500">Kekuatan Password</span>
                <span className={`font-semibold transition-colors ${s.meta.c}`}>{s.meta.t}</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i < s.score ? bars[Math.max(s.score - 1, 0)] : "bg-slate-200"}`} />
                ))}
              </div>
              <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                {s.rules.map((r) => (
                  <li key={r.label} className={`flex items-center gap-2 text-xs transition-colors duration-300 ${r.ok ? "text-emerald-600" : "text-slate-400"}`}>
                    {r.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}{r.label}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={saving === "pw"} className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white border border-slate-200 text-[13px] font-medium text-slate-700 hover:border-blue-200 hover:text-blue-900 hover:-translate-y-0.5 disabled:opacity-70">
                {saving === "pw" ? <><Loader2 className="w-4 h-4 animate-spin" />Memproses...</> : <><KeyRound className="w-4 h-4" />Ubah Password</>}
              </button>
            </div>
          </form>
        </section>
      </div>
    </>
  );
}
