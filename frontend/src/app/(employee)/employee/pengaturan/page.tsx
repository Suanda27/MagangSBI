"use client";

import { useState } from "react";
import { Bell, CheckCircle2, ChevronDown, Eye, EyeOff, Info, Loader2, Lock, Palette, User as UserIcon } from "lucide-react";
import PageHeader from "@/components/employee/page-header";
import { useAuth } from "@/lib/auth/auth-context";
import { changePassword, updateProfile } from "@/lib/api/auth";
import { toApiError } from "@/lib/api/errors";
import type { User } from "@/lib/api/types";

const dl = (ms: number) => ({ "--delay": `${ms}ms` } as React.CSSProperties);

const inputCls =
  "w-full h-11 px-3.5 bg-white border rounded-lg text-sm placeholder:text-slate-400 hover:border-slate-400 focus:outline-none focus:border-blue-500 transition-all duration-300 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed";
const labelCls = "block text-[13px] font-semibold text-slate-700 mb-1.5";

const batas = (ada: boolean) => (ada ? "border-red-500" : "border-slate-300");

function FieldError({ pesan }: { pesan?: string }) {
  if (!pesan) return null;
  return <p className="mt-1.5 text-xs text-red-600 font-medium animate-in fade-in slide-in-from-top-2 duration-300">{pesan}</p>;
}

function Segera() {
  return <span className="ml-auto text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Segera hadir</span>;
}

function Toggle({ checked, label, disabled = false }: { checked: boolean; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={`relative w-11 h-6 rounded-full transition-colors duration-300 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${checked ? "bg-blue-600" : "bg-slate-300"}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${checked ? "translate-x-5" : ""}`} />
    </button>
  );
}

/** Tombol kirim dengan keadaan memuat dan tersimpan. */
function TombolSimpan({ saving, saved, label, loadingLabel }: { saving: boolean; saved: boolean; label: string; loadingLabel: string }) {
  return (
    <button
      type="submit"
      disabled={saving}
      className={`group fx-shine inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-white text-[13px] font-medium shadow-sm transition-all duration-300 disabled:opacity-80 ${
        saved ? "bg-emerald-600" : "bg-gradient-to-r from-blue-800 to-blue-600 shadow-blue-800/30 hover:shadow-lg hover:-translate-y-0.5"
      }`}
    >
      {saved ? (
        <><CheckCircle2 className="w-4 h-4" />Tersimpan</>
      ) : saving ? (
        <><Loader2 className="w-4 h-4 animate-spin" />{loadingLabel}</>
      ) : (
        label
      )}
    </button>
  );
}

/** Ubah nama, email, dan telepon (PATCH /api/auth/me). */
function ProfilForm({ user }: { user: User }) {
  const { setUser } = useAuth();
  const [form, setForm] = useState({ name: user.name, email: user.email, telepon: user.telepon ?? "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [umum, setUmum] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const ubah = (k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };

  const kirim = async (e: React.FormEvent) => {
    e.preventDefault();
    setUmum("");
    setErrors({});

    const lokal: Record<string, string> = {};
    if (!form.name.trim()) lokal.name = "Nama lengkap wajib diisi.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) lokal.email = "Masukkan alamat email yang valid.";
    if (Object.keys(lokal).length) return setErrors(lokal);

    setSaving(true);
    try {
      const akun = await updateProfile({ name: form.name.trim(), email: form.email.trim(), telepon: form.telepon.trim() || null });
      setUser(akun); // header, sapaan, dan profil langsung ikut berubah
      setForm({ name: akun.name, email: akun.email, telepon: akun.telepon ?? "" });
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } catch (err) {
      const apiErr = toApiError(err);
      if (apiErr.isValidation) {
        const peta: Record<string, string> = {};
        for (const k of ["name", "email", "telepon"]) if (apiErr.errors[k]?.[0]) peta[k] = apiErr.errors[k][0];
        setErrors(peta);
      } else {
        setUmum(apiErr.message);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="fx-reveal rounded-xl border border-slate-200 bg-white shadow-sm" style={dl(80)}>
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center"><UserIcon className="w-4 h-4" /></span>
        <div>
          <h2 className="text-[15px] font-semibold text-slate-900">Informasi Profil</h2>
          <p className="text-xs text-slate-400">NIK, section, dan peran dikelola oleh Administrator.</p>
        </div>
      </div>
      <form onSubmit={kirim} className="p-5 grid gap-5 max-w-2xl" noValidate>
        {umum && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 animate-in fade-in slide-in-from-top-2 duration-300">{umum}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={labelCls}>NIK</label>
            <input disabled value={user.nik ?? "-"} className={`${inputCls} border-slate-200`} />
          </div>
          <div>
            <label className={labelCls}>Section</label>
            <input disabled value={user.bagian?.nama_bagian ?? "-"} className={`${inputCls} border-slate-200`} />
          </div>
        </div>
        <div>
          <label htmlFor="profil-nama" className={labelCls}>Nama Lengkap</label>
          <input id="profil-nama" value={form.name} onChange={(e) => ubah("name", e.target.value)} className={`${inputCls} ${batas(!!errors.name)}`} />
          <FieldError pesan={errors.name} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="profil-email" className={labelCls}>Email</label>
            <input id="profil-email" type="email" value={form.email} onChange={(e) => ubah("email", e.target.value)} className={`${inputCls} ${batas(!!errors.email)}`} />
            <FieldError pesan={errors.email} />
          </div>
          <div>
            <label htmlFor="profil-telepon" className={labelCls}>Nomor Telepon</label>
            <input id="profil-telepon" value={form.telepon} onChange={(e) => ubah("telepon", e.target.value)} placeholder="+62 812 0000 0000" className={`${inputCls} ${batas(!!errors.telepon)}`} />
            <FieldError pesan={errors.telepon} />
          </div>
        </div>
        <div className="flex justify-end">
          <TombolSimpan saving={saving} saved={saved} label="Simpan Profil" loadingLabel="Menyimpan..." />
        </div>
      </form>
    </section>
  );
}

/** Ganti kata sandi (PATCH /api/auth/password). */
function SandiForm() {
  const [show, setShow] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [umum, setUmum] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const ubah = (k: keyof typeof pw, v: string) => {
    setPw((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };

  const kirim = async (e: React.FormEvent) => {
    e.preventDefault();
    setUmum("");
    setErrors({});

    const lokal: Record<string, string> = {};
    if (!pw.current) lokal.current = "Masukkan kata sandi saat ini.";
    if (pw.next.length < 8) lokal.next = "Kata sandi baru minimal 8 karakter.";
    if (pw.next !== pw.confirm) lokal.confirm = "Konfirmasi kata sandi tidak cocok.";
    if (Object.keys(lokal).length) return setErrors(lokal);

    setSaving(true);
    try {
      await changePassword({ current_password: pw.current, password: pw.next, password_confirmation: pw.confirm });
      setPw({ current: "", next: "", confirm: "" });
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } catch (err) {
      const apiErr = toApiError(err);
      if (apiErr.isValidation) {
        const peta: Record<string, string> = {};
        if (apiErr.errors.current_password?.[0]) peta.current = apiErr.errors.current_password[0];
        // Backend memakai satu field "password" untuk aturan sandi dan konfirmasi.
        const sandi = apiErr.errors.password ?? [];
        const konfirmasi = sandi.find((m) => /konfirmasi/i.test(m));
        const aturan = sandi.find((m) => !/konfirmasi/i.test(m));
        if (aturan) peta.next = aturan;
        if (konfirmasi) peta.confirm = konfirmasi;
        setErrors(peta);
      } else {
        setUmum(apiErr.message);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="fx-reveal rounded-xl border border-slate-200 bg-white shadow-sm" style={dl(160)}>
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center"><Lock className="w-4 h-4" /></span>
        <h2 className="text-[15px] font-semibold text-slate-900">Akun & Keamanan</h2>
      </div>
      <form onSubmit={kirim} className="p-5 grid gap-5 max-w-2xl" noValidate>
        {umum && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 animate-in fade-in slide-in-from-top-2 duration-300">{umum}</div>}
        <div>
          <label htmlFor="sandi-lama" className={labelCls}>Kata Sandi Saat Ini</label>
          <input id="sandi-lama" type={show ? "text" : "password"} value={pw.current} onChange={(e) => ubah("current", e.target.value)} placeholder="••••••••" className={`${inputCls} ${batas(!!errors.current)}`} autoComplete="current-password" />
          <FieldError pesan={errors.current} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="sandi-baru" className={labelCls}>Kata Sandi Baru</label>
            <input id="sandi-baru" type={show ? "text" : "password"} value={pw.next} onChange={(e) => ubah("next", e.target.value)} placeholder="Min. 8 karakter" className={`${inputCls} ${batas(!!errors.next)}`} autoComplete="new-password" />
            <FieldError pesan={errors.next} />
          </div>
          <div>
            <label htmlFor="sandi-konfirmasi" className={labelCls}>Konfirmasi Kata Sandi Baru</label>
            <input id="sandi-konfirmasi" type={show ? "text" : "password"} value={pw.confirm} onChange={(e) => ubah("confirm", e.target.value)} placeholder="Ketik ulang" className={`${inputCls} ${batas(!!errors.confirm)}`} autoComplete="new-password" />
            <FieldError pesan={errors.confirm} />
          </div>
        </div>
        <button type="button" onClick={() => setShow(!show)} className="inline-flex items-center gap-2 text-[13px] font-medium text-slate-500 hover:text-blue-700 w-fit">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {show ? "Sembunyikan" : "Tampilkan"} kata sandi
        </button>
        <div className="flex justify-end">
          <TombolSimpan saving={saving} saved={saved} label="Ubah Kata Sandi" loadingLabel="Memproses..." />
        </div>
      </form>
    </section>
  );
}

export default function PengaturanPage() {
  const { user } = useAuth();
  if (!user) return null; // RoleGuard memastikan akun sudah dimuat sebelum halaman ini tampil

  return (
    <>
      <PageHeader title="Pengaturan" description="Kelola profil, keamanan, dan preferensi akun Anda." />

      <div className="grid gap-6">
        <ProfilForm user={user} />
        <SandiForm />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="fx-reveal rounded-xl border border-slate-200 bg-white shadow-sm" style={dl(240)}>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center"><Bell className="w-4 h-4" /></span>
              <h2 className="text-[15px] font-semibold text-slate-900">Notifikasi</h2>
              <Segera />
            </div>
            <div className="p-5 grid gap-5">
              <div className="flex items-start gap-2.5 rounded-lg bg-blue-50/60 border border-blue-100 p-3 text-xs text-slate-600 leading-relaxed">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                Pemberitahuan permintaan Anda tampil di dalam aplikasi lewat ikon lonceng di bagian atas. Tidak ada notifikasi email.
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[13.5px] font-medium text-slate-800">Notifikasi Browser</p>
                  <p className="text-xs text-slate-400">Tampilkan peringatan di browser Anda.</p>
                </div>
                <Toggle checked={false} disabled label="Notifikasi Browser" />
              </div>
            </div>
          </section>

          <section className="fx-reveal rounded-xl border border-slate-200 bg-white shadow-sm" style={dl(320)}>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center"><Palette className="w-4 h-4" /></span>
              <h2 className="text-[15px] font-semibold text-slate-900">Tampilan & Bahasa</h2>
              <Segera />
            </div>
            <div className="p-5 grid gap-5">
              {[
                { label: "Tema", nilai: "Terang" },
                { label: "Bahasa", nilai: "Bahasa Indonesia" },
              ].map((f) => (
                <div key={f.label}>
                  <label className={labelCls}>{f.label}</label>
                  <div className="relative">
                    <select disabled defaultValue={f.nilai} className={`${inputCls} border-slate-200 appearance-none pr-10`}>
                      <option>{f.nilai}</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-slate-300 pointer-events-none" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
