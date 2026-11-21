"use client";

import { useState } from "react";
import { Bell, CheckCircle2, ChevronDown, Eye, EyeOff, Loader2, Lock, Palette } from "lucide-react";
import PageHeader from "@/components/employee/page-header";

const dl = (ms: number) => ({ "--delay": `${ms}ms` } as React.CSSProperties);

const inputCls =
  "w-full h-11 px-3.5 bg-white border border-slate-300 rounded-lg text-sm placeholder:text-slate-400 hover:border-slate-400 focus:outline-none focus:border-blue-500 transition-all duration-300";

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-300 shrink-0 ${checked ? "bg-blue-600" : "bg-slate-300"}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${checked ? "translate-x-5" : ""}`} />
    </button>
  );
}

export default function PengaturanPage() {
  const [show, setShow] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [error, setError] = useState("");
  const [email, setEmail] = useState(true);
  const [push, setPush] = useState(false);
  const [theme, setTheme] = useState("Terang");
  const [lang, setLang] = useState("Bahasa Indonesia");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (pw.next || pw.confirm) {
      if (pw.next.length < 8) return setError("Kata sandi baru minimal 8 karakter.");
      if (pw.next !== pw.confirm) return setError("Konfirmasi kata sandi tidak cocok.");
      if (!pw.current) return setError("Masukkan kata sandi saat ini.");
    }
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setPw({ current: "", next: "", confirm: "" });
      setTimeout(() => setSaved(false), 2200);
    }, 900);
  };

  return (
    <>
      <PageHeader title="Pengaturan" description="Kelola preferensi akun dan notifikasi Anda." />

      <form onSubmit={save} className="grid gap-6">
        <section className="fx-reveal rounded-xl border border-slate-200 bg-white shadow-sm" style={dl(80)}>
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center"><Lock className="w-4 h-4" /></span>
            <h2 className="text-[15px] font-semibold text-slate-900">Akun & Keamanan</h2>
          </div>
          <div className="p-5 grid gap-5 max-w-2xl">
            {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 animate-in fade-in slide-in-from-top-2 duration-300">{error}</div>}
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Kata Sandi Saat Ini</label>
              <input type={show ? "text" : "password"} value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} placeholder="••••••••" className={inputCls} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Kata Sandi Baru</label>
                <input type={show ? "text" : "password"} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} placeholder="Min. 8 karakter" className={inputCls} />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Konfirmasi Kata Sandi Baru</label>
                <input type={show ? "text" : "password"} value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} placeholder="Ketik ulang" className={inputCls} />
              </div>
            </div>
            <button type="button" onClick={() => setShow(!show)} className="inline-flex items-center gap-2 text-[13px] font-medium text-slate-500 hover:text-blue-700 w-fit">
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {show ? "Sembunyikan" : "Tampilkan"} kata sandi
            </button>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="fx-reveal rounded-xl border border-slate-200 bg-white shadow-sm" style={dl(160)}>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center"><Bell className="w-4 h-4" /></span>
              <h2 className="text-[15px] font-semibold text-slate-900">Notifikasi</h2>
            </div>
            <div className="p-5 grid gap-5">
              {[
                { label: "Notifikasi Email", desc: "Terima pembaruan status permintaan lewat email.", v: email, s: setEmail },
                { label: "Notifikasi Browser", desc: "Tampilkan peringatan di browser Anda.", v: push, s: setPush },
              ].map((n) => (
                <div key={n.label} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[13.5px] font-medium text-slate-800">{n.label}</p>
                    <p className="text-xs text-slate-400">{n.desc}</p>
                  </div>
                  <Toggle checked={n.v} onChange={n.s} label={n.label} />
                </div>
              ))}
            </div>
          </section>

          <section className="fx-reveal rounded-xl border border-slate-200 bg-white shadow-sm" style={dl(240)}>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center"><Palette className="w-4 h-4" /></span>
              <h2 className="text-[15px] font-semibold text-slate-900">Tampilan & Bahasa</h2>
            </div>
            <div className="p-5 grid gap-5">
              {[
                { label: "Tema", v: theme, s: setTheme, opts: ["Terang", "Gelap", "Ikuti Sistem"] },
                { label: "Bahasa", v: lang, s: setLang, opts: ["Bahasa Indonesia", "English"] },
              ].map((f) => (
                <div key={f.label}>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">{f.label}</label>
                  <div className="relative">
                    <select value={f.v} onChange={(e) => f.s(e.target.value)} className={`${inputCls} appearance-none pr-10`}>
                      {f.opts.map((o) => <option key={o}>{o}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="fx-reveal flex flex-col-reverse sm:flex-row sm:justify-end gap-3" style={dl(320)}>
          <button type="button" onClick={() => { setPw({ current: "", next: "", confirm: "" }); setError(""); }} className="px-5 py-2.5 rounded-lg bg-white border border-slate-200 text-[13px] font-medium text-slate-700 hover:bg-slate-50">
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className={`group fx-shine inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-white text-[13px] font-medium shadow-sm transition-all duration-300 ${
              saved ? "bg-emerald-600" : "bg-gradient-to-r from-blue-800 to-blue-600 shadow-blue-800/30 hover:shadow-lg hover:-translate-y-0.5"
            }`}
          >
            {saved ? <><CheckCircle2 className="w-4 h-4" />Tersimpan</> : saving ? <><Loader2 className="w-4 h-4 animate-spin" />Menyimpan...</> : "Simpan Perubahan"}
          </button>
        </div>
      </form>
    </>
  );
}
