"use client";

import { useEffect, useState } from "react";
import { AtSign, Briefcase, FileCheck2, Hash, KeyRound, Eye, EyeOff, Loader2, Phone, Save, ShieldCheck, Ticket, TriangleAlert, User, UserCog, type LucideIcon } from "lucide-react";
import { Field, SectionCard, Toasts, inputCls, useToasts } from "@/components/admin/settings-ui";
import { getPengaturan, updatePengaturan, type FormatLampiran, type PengaturanApi } from "@/lib/api/admin";
import { changePassword, updateProfile } from "@/lib/api/auth";
import { errorMessage, toApiError } from "@/lib/api/errors";
import type { User as Akun } from "@/lib/api/types";
import { CONTOH_NOMOR_TIKET, kekuatanPassword } from "@/lib/admin/settings";
import { useAuth } from "@/lib/auth/auth-context";
import { initialsOf } from "@/lib/auth/user-display";

/**
 * Settings Admin sesuai PRD (D11): profil, ganti kata sandi, dan batas lampiran.
 * Setiap tab menyimpan sendiri ke API-nya; tidak ada pengaturan lokal yang berpura-pura tersimpan.
 */

type TabKey = "profil" | "keamanan" | "tiket";
type Notifikasi = (t: { tone: "success" | "error"; title: string; desc?: string }) => void;

const TABS: { key: TabKey; label: string; desc: string; icon: LucideIcon }[] = [
  { key: "profil", label: "Profil", desc: "Identitas akun admin", icon: UserCog },
  { key: "keamanan", label: "Keamanan", desc: "Ganti kata sandi", icon: ShieldCheck },
  { key: "tiket", label: "Tiket & Lampiran", desc: "Nomor tiket, batas unggah", icon: Ticket },
];

const btnSimpan = "inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold shadow-sm transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-blue-700";

export default function SettingsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<TabKey>("profil");
  const toast = useToasts();

  if (!user) return null; // RoleGuard memastikan akun sudah dimuat sebelum halaman ini tampil

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Kelola profil administrator, kata sandi, dan aturan lampiran tiket.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Navigasi tab */}
        <nav className="lg:col-span-3 lg:sticky lg:top-20 bg-white rounded-xl border border-slate-200 shadow-sm p-2 flex lg:flex-col gap-1 overflow-x-auto" aria-label="Kategori pengaturan">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                aria-current={active ? "page" : undefined}
                className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-left shrink-0 lg:shrink transition-all duration-300 ${active ? "bg-blue-50 text-blue-800" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
              >
                <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r bg-blue-700 transition-all duration-300 ${active ? "h-6 opacity-100" : "h-0 opacity-0"}`} />
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${active ? "bg-blue-700 text-white shadow-md shadow-blue-900/20" : "bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-700"}`}>
                  <t.icon className="w-4 h-4" />
                </span>
                <span className="leading-tight whitespace-nowrap">
                  <span className="block text-sm font-medium">{t.label}</span>
                  <span className="hidden lg:block text-[11px] text-slate-400 font-normal">{t.desc}</span>
                </span>
              </button>
            );
          })}
        </nav>

        {/* Panel */}
        <div key={tab} className="fx-tab-panel lg:col-span-9 flex flex-col gap-6 pb-10">
          {tab === "profil" && <ProfilTab user={user} toast={toast.push} />}
          {tab === "keamanan" && <KeamananTab toast={toast.push} />}
          {tab === "tiket" && <TiketTab toast={toast.push} />}
        </div>
      </div>

      <Toasts items={toast.items} dismiss={toast.dismiss} />
    </>
  );
}

function Ikon({ icon: I }: { icon: LucideIcon }) {
  return <I className="absolute left-3 w-[18px] h-[18px] text-slate-400 pointer-events-none" />;
}

const Memuat = () => <Loader2 className="w-4 h-4 animate-spin" />;

/* ================= Tab: Profil ================= */

function ProfilTab({ user, toast }: { user: Akun; toast: Notifikasi }) {
  const { setUser } = useAuth();
  const [nama, setNama] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [telepon, setTelepon] = useState(user.telepon ?? "");
  const [err, setErr] = useState<Record<string, string>>({});
  const [umum, setUmum] = useState("");
  const [simpan, setSimpan] = useState(false);

  const berubah = nama.trim() !== user.name || email.trim() !== user.email || telepon.trim() !== (user.telepon ?? "");

  const kirim = async (e: React.FormEvent) => {
    e.preventDefault();
    setUmum("");
    const lokal: Record<string, string> = {};
    if (!nama.trim()) lokal.name = "Nama lengkap wajib diisi.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) lokal.email = "Masukkan alamat email yang valid.";
    setErr(lokal);
    if (Object.keys(lokal).length) return;

    setSimpan(true);
    try {
      const akun = await updateProfile({ name: nama.trim(), email: email.trim(), telepon: telepon.trim() || null });
      setUser(akun); // header ikut berubah
      setNama(akun.name);
      setEmail(akun.email);
      setTelepon(akun.telepon ?? "");
      toast({ tone: "success", title: "Profil disimpan", desc: "Perubahan berhasil diterapkan." });
    } catch (e2) {
      const apiErr = toApiError(e2);
      if (apiErr.isValidation) {
        setErr({
          ...(apiErr.errors.name?.[0] ? { name: apiErr.errors.name[0] } : {}),
          ...(apiErr.errors.email?.[0] ? { email: apiErr.errors.email[0] } : {}),
          ...(apiErr.errors.telepon?.[0] ? { telepon: apiErr.errors.telepon[0] } : {}),
        });
      } else {
        setUmum(apiErr.message);
      }
    } finally {
      setSimpan(false);
    }
  };

  const salah = (k: string) => (err[k] ? "!border-rose-400 !ring-4 !ring-rose-100" : "");

  return (
    <>
      <div className="bg-gradient-to-br from-blue-800 to-blue-950 rounded-xl p-6 text-white flex flex-col sm:flex-row sm:items-center gap-5 shadow-md relative overflow-hidden">
        <div className="pointer-events-none absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/5" />
        <div className="w-16 h-16 rounded-full bg-white/15 backdrop-blur ring-4 ring-white/20 flex items-center justify-center text-xl font-semibold shrink-0 transition-transform duration-500 hover:scale-105">{initialsOf(user.name)}</div>
        <div className="min-w-0">
          <p className="text-lg font-semibold truncate">{user.name}</p>
          <p className="text-sm text-blue-100/80">{user.jabatan || "—"}</p>
          <span className="inline-flex items-center gap-1.5 mt-2 text-[11px] font-medium bg-white/15 rounded-full px-2.5 py-1"><ShieldCheck className="w-3.5 h-3.5" /> {user.role_label} · Akses Penuh</span>
        </div>
      </div>

      <form onSubmit={kirim} noValidate>
        <SectionCard
          icon={User}
          title="Informasi Profil"
          desc="Data kontak administrator"
          footer={<button type="submit" disabled={simpan || !berubah} className={btnSimpan}>{simpan ? <Memuat /> : <Save className="w-4 h-4" />} {simpan ? "Menyimpan..." : "Simpan Profil"}</button>}
        >
          {umum && (
            <div className="mb-5 flex items-start gap-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3 fx-reveal" role="alert">
              <TriangleAlert className="w-4 h-4 shrink-0 mt-0.5" /> {umum}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Nama Lengkap" required error={err.name} className="md:col-span-2">
              <div className="relative flex items-center"><Ikon icon={User} /><input value={nama} onChange={(e) => setNama(e.target.value)} className={`${inputCls} pl-10 ${salah("name")}`} /></div>
            </Field>
            <Field label="Email Perusahaan" required error={err.email}>
              <div className="relative flex items-center"><Ikon icon={AtSign} /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputCls} pl-10 ${salah("email")}`} /></div>
            </Field>
            <Field label="Nomor Telepon" error={err.telepon}>
              <div className="relative flex items-center"><Ikon icon={Phone} /><input value={telepon} onChange={(e) => setTelepon(e.target.value)} className={`${inputCls} pl-10 ${salah("telepon")}`} /></div>
            </Field>
            <Field label="Jabatan" hint="Jabatan diatur dari menu Pengguna.">
              <div className="relative flex items-center"><Ikon icon={Briefcase} /><input disabled value={user.jabatan ?? "—"} className={`${inputCls} pl-10`} /></div>
            </Field>
            <Field label="Role" hint="Role hanya dapat diubah dari menu Pengguna.">
              <div className="relative flex items-center"><Ikon icon={ShieldCheck} /><input disabled value={user.role_label} className={`${inputCls} pl-10`} /></div>
            </Field>
          </div>
        </SectionCard>
      </form>
    </>
  );
}

/* ================= Tab: Keamanan ================= */

function KeamananTab({ toast }: { toast: Notifikasi }) {
  const [lama, setLama] = useState("");
  const [baru, setBaru] = useState("");
  const [ulang, setUlang] = useState("");
  const [lihat, setLihat] = useState(false);
  const [err, setErr] = useState<Record<string, string>>({});
  const [umum, setUmum] = useState("");
  const [simpan, setSimpan] = useState(false);

  const skor = kekuatanPassword(baru);
  const label = ["Terlalu lemah", "Lemah", "Cukup", "Kuat", "Sangat kuat"][skor];
  const warna = ["bg-slate-200", "bg-rose-500", "bg-amber-500", "bg-blue-500", "bg-emerald-500"][skor];

  const ganti = async (e: React.FormEvent) => {
    e.preventDefault();
    setUmum("");
    const lokal: Record<string, string> = {};
    if (!lama) lokal.lama = "Masukkan kata sandi saat ini.";
    if (!baru) lokal.baru = "Masukkan kata sandi baru.";
    else if (baru === lama) lokal.baru = "Kata sandi baru harus berbeda dari yang lama.";
    if (ulang !== baru) lokal.ulang = "Konfirmasi tidak cocok.";
    setErr(lokal);
    if (Object.keys(lokal).length) return;

    setSimpan(true);
    try {
      await changePassword({ current_password: lama, password: baru, password_confirmation: ulang });
      setLama("");
      setBaru("");
      setUlang("");
      toast({ tone: "success", title: "Kata sandi diperbarui", desc: "Gunakan kata sandi baru saat login berikutnya." });
    } catch (e2) {
      const apiErr = toApiError(e2);
      if (apiErr.isValidation) {
        // Backend memakai satu field "password" untuk aturan sandi dan konfirmasi.
        const sandi = apiErr.errors.password ?? [];
        const aturan = sandi.find((m) => !/konfirmasi/i.test(m));
        const konfirmasi = sandi.find((m) => /konfirmasi/i.test(m));
        setErr({
          ...(apiErr.errors.current_password?.[0] ? { lama: apiErr.errors.current_password[0] } : {}),
          ...(aturan ? { baru: aturan } : {}),
          ...(konfirmasi ? { ulang: konfirmasi } : {}),
        });
      } else {
        setUmum(apiErr.message);
      }
    } finally {
      setSimpan(false);
    }
  };

  const salah = (k: string) => (err[k] ? "!border-rose-400" : "");

  return (
    <form onSubmit={ganti} noValidate>
      <SectionCard
        icon={KeyRound}
        title="Ganti Kata Sandi"
        desc="Gunakan kata sandi unik yang tidak dipakai di layanan lain"
        footer={<button type="submit" disabled={simpan} className={btnSimpan}>{simpan ? <Memuat /> : <KeyRound className="w-4 h-4" />} {simpan ? "Memperbarui..." : "Perbarui Kata Sandi"}</button>}
      >
        {umum && (
          <div className="mb-5 flex items-start gap-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3 fx-reveal" role="alert">
            <TriangleAlert className="w-4 h-4 shrink-0 mt-0.5" /> {umum}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Kata Sandi Saat Ini" required error={err.lama} className="md:col-span-2">
            <input type="password" value={lama} onChange={(e) => setLama(e.target.value)} autoComplete="current-password" className={`${inputCls} md:max-w-sm ${salah("lama")}`} />
          </Field>
          <Field label="Kata Sandi Baru" required error={err.baru}>
            <div className="relative">
              <input type={lihat ? "text" : "password"} value={baru} onChange={(e) => setBaru(e.target.value)} autoComplete="new-password" placeholder="Minimal 8 karakter" className={`${inputCls} pr-11 ${salah("baru")}`} />
              <button type="button" onClick={() => setLihat((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors" aria-label={lihat ? "Sembunyikan" : "Tampilkan"}>
                {lihat ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 grid grid-cols-4 gap-1.5">
                {[1, 2, 3, 4].map((i) => <span key={i} className={`h-1.5 rounded-full transition-all duration-500 ${skor >= i ? warna : "bg-slate-200"}`} />)}
              </div>
              <span className="text-[11px] text-slate-500 w-20 text-right">{baru ? label : ""}</span>
            </div>
          </Field>
          <Field label="Konfirmasi Kata Sandi Baru" required error={err.ulang}>
            <input type={lihat ? "text" : "password"} value={ulang} onChange={(e) => setUlang(e.target.value)} autoComplete="new-password" className={`${inputCls} ${salah("ulang")}`} />
          </Field>
        </div>
      </SectionCard>
    </form>
  );
}

/* ================= Tab: Tiket & Lampiran ================= */

const SEMUA_FORMAT: FormatLampiran[] = ["jpg", "png", "pdf"];

function TiketTab({ toast }: { toast: Notifikasi }) {
  const [tersimpan, setTersimpan] = useState<PengaturanApi | null>(null);
  const [galatMuat, setGalatMuat] = useState<string | null>(null);
  const [percobaan, setPercobaan] = useState(0);

  const [ukuran, setUkuran] = useState("5");
  const [format, setFormat] = useState<FormatLampiran[]>(SEMUA_FORMAT);
  const [err, setErr] = useState<Record<string, string>>({});
  const [umum, setUmum] = useState("");
  const [simpan, setSimpan] = useState(false);

  useEffect(() => {
    let batal = false;
    getPengaturan()
      .then((p) => {
        if (batal) return;
        setTersimpan(p);
        setUkuran(String(p.max_upload_mb));
        setFormat(p.format_lampiran);
        setGalatMuat(null);
      })
      .catch((e) => {
        if (!batal) setGalatMuat(errorMessage(e, "Gagal memuat pengaturan."));
      });
    return () => {
      batal = true;
    };
  }, [percobaan]);

  const urut = (f: FormatLampiran[]) => SEMUA_FORMAT.filter((x) => f.includes(x));
  const berubah = tersimpan !== null && (Number(ukuran) !== tersimpan.max_upload_mb || urut(format).join() !== tersimpan.format_lampiran.join());

  const kirim = async (e: React.FormEvent) => {
    e.preventDefault();
    setUmum("");
    const lokal: Record<string, string> = {};
    const mb = Number(ukuran);
    if (!Number.isInteger(mb) || mb < 1 || mb > 5) lokal.max_upload_mb = "Ukuran 1–5 MB (batas sistem 5 MB).";
    if (format.length === 0) lokal.format_lampiran = "Pilih minimal satu format berkas.";
    setErr(lokal);
    if (Object.keys(lokal).length) return;

    setSimpan(true);
    try {
      const p = await updatePengaturan({ max_upload_mb: mb, format_lampiran: urut(format) });
      setTersimpan(p);
      setUkuran(String(p.max_upload_mb));
      setFormat(p.format_lampiran);
      toast({ tone: "success", title: "Pengaturan disimpan", desc: "Form pengajuan langsung memakai aturan baru." });
    } catch (e2) {
      const apiErr = toApiError(e2);
      if (apiErr.isValidation) {
        const galatFormat = Object.entries(apiErr.errors).find(([k]) => k.startsWith("format_lampiran"));
        setErr({
          ...(apiErr.errors.max_upload_mb?.[0] ? { max_upload_mb: apiErr.errors.max_upload_mb[0] } : {}),
          ...(galatFormat ? { format_lampiran: galatFormat[1][0] } : {}),
        });
      } else {
        setUmum(apiErr.message);
      }
    } finally {
      setSimpan(false);
    }
  };

  return (
    <>
      <SectionCard icon={Hash} title="Format Nomor Tiket" desc="Dibuat otomatis oleh sistem per section saat tiket diajukan">
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-slate-500">Format</span>
          <span className="font-mono text-sm font-semibold text-blue-800 tracking-wide">{"{KODE SECTION}-{TAHUN}-{URUTAN}"}</span>
        </div>
        <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {CONTOH_NOMOR_TIKET.map((c) => (
            <li key={c.kode} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3.5 py-2.5">
              <span className="text-xs text-slate-600">{c.section}</span>
              <span className="font-mono text-[13px] font-semibold text-slate-900">#{c.contoh}</span>
            </li>
          ))}
        </ul>
        <p className="text-[11px] text-slate-400 mt-3">Urutan dihitung terpisah untuk tiap section dan mulai dari 0001 setiap pergantian tahun. Format ini tetap dan tidak dapat diubah dari sini.</p>
      </SectionCard>

      {galatMuat ? (
        <div className="bg-white rounded-xl border border-rose-200 py-12 px-6 flex flex-col items-center text-center gap-3" role="alert">
          <span className="w-11 h-11 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center"><TriangleAlert className="w-5 h-5" /></span>
          <p className="text-sm font-semibold text-slate-900">Pengaturan lampiran tidak dapat dimuat</p>
          <p className="text-xs text-slate-500 max-w-sm">{galatMuat}</p>
          <button onClick={() => { setGalatMuat(null); setPercobaan((n) => n + 1); }} className="px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-colors">Coba Lagi</button>
        </div>
      ) : tersimpan === null ? (
        <div className="bg-white rounded-xl border border-slate-200 py-14 flex items-center justify-center gap-3 text-sm text-slate-500" role="status" aria-live="polite">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> Memuat pengaturan...
        </div>
      ) : (
        <form onSubmit={kirim} noValidate>
          <SectionCard
            icon={FileCheck2}
            title="Lampiran"
            desc={`Aturan unggah berkas pada tiket dan hasil pengerjaan (maksimal ${tersimpan.maks_berkas} berkas per kategori)`}
            footer={<button type="submit" disabled={simpan || !berubah} className={btnSimpan}>{simpan ? <Memuat /> : <Save className="w-4 h-4" />} {simpan ? "Menyimpan..." : "Simpan Pengaturan"}</button>}
          >
            {umum && (
              <div className="mb-5 flex items-start gap-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3 fx-reveal" role="alert">
                <TriangleAlert className="w-4 h-4 shrink-0 mt-0.5" /> {umum}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Ukuran Maksimal per Berkas" error={err.max_upload_mb} hint="Batas sistem 5 MB.">
                <div className="relative">
                  <input type="number" min={1} max={5} value={ukuran} onChange={(e) => setUkuran(e.target.value)} className={`${inputCls} pr-12 ${err.max_upload_mb ? "!border-rose-400" : ""}`} />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">MB</span>
                </div>
              </Field>
              <Field label="Format Diizinkan" error={err.format_lampiran}>
                <div className="flex gap-2 h-[42px] items-center">
                  {SEMUA_FORMAT.map((f) => {
                    const on = format.includes(f);
                    return (
                      <button
                        key={f}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setFormat((cur) => (on ? cur.filter((x) => x !== f) : [...cur, f]))}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase border transition-all duration-300 ${on ? "bg-blue-700 text-white border-blue-700 shadow-sm" : "bg-white text-slate-500 border-slate-200 hover:border-blue-200 hover:text-blue-700"}`}
                      >
                        {f}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </div>
          </SectionCard>
        </form>
      )}
    </>
  );
}
