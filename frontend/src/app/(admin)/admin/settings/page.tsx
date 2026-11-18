"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AtSign, Bell, Briefcase, Building2, Clock, FileCheck2, Globe2, Hammer, Hash, KeyRound, Laptop, LogOut, MonitorSmartphone,
  Phone, RotateCcw, Save, ShieldCheck, Smartphone, Ticket, Timer, User, UserCog, Wrench, Eye, EyeOff, TriangleAlert, type LucideIcon,
} from "lucide-react";
import { Field, SectionCard, Switch, ToggleRow, Toasts, inputCls, useToasts } from "@/components/admin/settings-ui";
import {
  DEFAULT_SETTINGS, NOTIF_LABEL, contohNomorTiket, kekuatanPassword, loadSettings, saveSettings,
  type AdminSettings, type NotifKey,
} from "@/lib/admin/settings";

type TabKey = "profil" | "keamanan" | "sistem" | "tiket" | "notifikasi";

const TABS: { key: TabKey; label: string; desc: string; icon: LucideIcon }[] = [
  { key: "profil", label: "Profil", desc: "Identitas akun admin", icon: UserCog },
  { key: "keamanan", label: "Keamanan", desc: "Kata sandi & sesi", icon: ShieldCheck },
  { key: "sistem", label: "Sistem", desc: "Aplikasi, zona waktu", icon: Wrench },
  { key: "tiket", label: "Tiket & SLA", desc: "Nomor tiket, SLA, unggah", icon: Ticket },
  { key: "notifikasi", label: "Notifikasi", desc: "Peristiwa & kanal", icon: Bell },
];

const SESI_AWAL = [
  { id: "s1", perangkat: "Chrome — Windows 11", lokasi: "Batam, ID", terakhir: "Sekarang", ikon: Laptop, saatIni: true },
  { id: "s2", perangkat: "Edge — Windows 10", lokasi: "Batam, ID", terakhir: "2 jam lalu", ikon: MonitorSmartphone, saatIni: false },
  { id: "s3", perangkat: "Safari — iPhone", lokasi: "Batam, ID", terakhir: "Kemarin, 17:42", ikon: Smartphone, saatIni: false },
];

const initials = (n: string) => n.trim().split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("") || "--";

export default function SettingsPage() {
  const [tab, setTab] = useState<TabKey>("profil");
  const [saved, setSaved] = useState<AdminSettings>(DEFAULT_SETTINGS);
  const [draft, setDraft] = useState<AdminSettings>(DEFAULT_SETTINGS);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const toast = useToasts();

  // Muat pengaturan tersimpan setelah mount (hindari hydration mismatch)
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const s = loadSettings();
    setSaved(s);
    setDraft(s);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const dirty = useMemo(() => JSON.stringify(saved) !== JSON.stringify(draft), [saved, draft]);

  const set = <K extends keyof AdminSettings>(k: K, v: Partial<AdminSettings[K]>) => setDraft((d) => ({ ...d, [k]: { ...d[k], ...v } }));

  const validasi = () => {
    const e: Record<string, string> = {};
    const { profil, sistem, tiket } = draft;
    if (profil.nama.trim().length < 3) e.nama = "Nama minimal 3 karakter.";
    if (!/^\S+@\S+\.\S+$/.test(profil.email)) e.email = "Format email tidak valid.";
    if (profil.telepon.replace(/\D/g, "").length < 8) e.telepon = "Nomor telepon tidak valid.";
    if (!sistem.namaAplikasi.trim()) e.namaAplikasi = "Nama aplikasi wajib diisi.";
    if (!sistem.namaPerusahaan.trim()) e.namaPerusahaan = "Nama perusahaan wajib diisi.";
    if (!/^[A-Za-z]{2,6}$/.test(tiket.prefix)) e.prefix = "Prefix 2–6 huruf tanpa spasi atau angka.";
    if (!(tiket.slaMendesak > 0 && tiket.slaTinggi >= tiket.slaMendesak && tiket.slaNormal >= tiket.slaTinggi)) e.sla = "Urutan SLA harus: Mendesak ≤ Tinggi ≤ Normal (jam, lebih dari 0).";
    if (tiket.maksUploadMb < 1 || tiket.maksUploadMb > 5) e.maksUploadMb = "Ukuran unggah 1–5 MB (batas sistem 5 MB).";
    if (!tiket.format.jpg && !tiket.format.png && !tiket.format.pdf) e.format = "Pilih minimal satu format berkas.";
    setErrors(e);
    return e;
  };

  const simpan = () => {
    const e = validasi();
    const keys = Object.keys(e);
    if (keys.length) {
      // Arahkan ke tab pertama yang bermasalah
      const peta: Record<string, TabKey> = { nama: "profil", email: "profil", telepon: "profil", namaAplikasi: "sistem", namaPerusahaan: "sistem", prefix: "tiket", sla: "tiket", maksUploadMb: "tiket", format: "tiket" };
      setTab(peta[keys[0]] ?? tab);
      toast.push({ tone: "error", title: "Periksa kembali isian", desc: e[keys[0]] });
      return;
    }
    saveSettings(draft);
    setSaved(draft);
    toast.push({ tone: "success", title: "Pengaturan disimpan", desc: "Perubahan berhasil diterapkan." });
  };

  const batal = () => {
    setDraft(saved);
    setErrors({});
  };

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Kelola profil administrator, keamanan, konfigurasi sistem, aturan tiket, dan notifikasi.</p>
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
        <div key={tab} className="fx-tab-panel lg:col-span-9 flex flex-col gap-6 pb-20">
          {tab === "profil" && <ProfilTab draft={draft} set={set} errors={errors} />}
          {tab === "keamanan" && <KeamananTab draft={draft} set={set} toast={toast.push} />}
          {tab === "sistem" && <SistemTab draft={draft} set={set} errors={errors} />}
          {tab === "tiket" && <TiketTab draft={draft} set={set} errors={errors} />}
          {tab === "notifikasi" && <NotifikasiTab draft={draft} setDraft={setDraft} />}
        </div>
      </div>

      {/* Bar simpan melayang — muncul saat ada perubahan */}
      <div
        className={`fixed bottom-5 left-1/2 -translate-x-1/2 lg:left-[calc(50%+8rem)] z-40 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${dirty ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0 pointer-events-none"}`}
        aria-hidden={!dirty}
      >
        <div className="flex items-center gap-4 bg-slate-900 text-white rounded-xl shadow-2xl pl-4 pr-2 py-2">
          <span className="flex items-center gap-2 text-sm">
            <span className="relative flex w-2 h-2"><span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 animate-ping" /><span className="relative inline-flex w-2 h-2 rounded-full bg-amber-400" /></span>
            Ada perubahan belum disimpan
          </span>
          <button onClick={batal} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"><RotateCcw className="w-3.5 h-3.5" /> Batalkan</button>
          <button onClick={simpan} className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 rounded-lg transition-all hover:-translate-y-0.5"><Save className="w-3.5 h-3.5" /> Simpan</button>
        </div>
      </div>

      <Toasts items={toast.items} dismiss={toast.dismiss} />
    </>
  );
}

/* ================= Tab: Profil ================= */

type SetFn = <K extends keyof AdminSettings>(k: K, v: Partial<AdminSettings[K]>) => void;

function Icon({ icon: I }: { icon: LucideIcon }) {
  return <I className="absolute left-3 w-[18px] h-[18px] text-slate-400 pointer-events-none" />;
}

function ProfilTab({ draft, set, errors }: { draft: AdminSettings; set: SetFn; errors: Record<string, string> }) {
  const p = draft.profil;
  return (
    <>
      <div className="bg-gradient-to-br from-blue-800 to-blue-950 rounded-xl p-6 text-white flex flex-col sm:flex-row sm:items-center gap-5 shadow-md relative overflow-hidden">
        <div className="pointer-events-none absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/5" />
        <div className="w-16 h-16 rounded-full bg-white/15 backdrop-blur ring-4 ring-white/20 flex items-center justify-center text-xl font-semibold shrink-0 transition-transform duration-500 hover:scale-105">{initials(p.nama)}</div>
        <div className="min-w-0">
          <p className="text-lg font-semibold truncate">{p.nama || "—"}</p>
          <p className="text-sm text-blue-100/80">{p.jabatan || "—"}</p>
          <span className="inline-flex items-center gap-1.5 mt-2 text-[11px] font-medium bg-white/15 rounded-full px-2.5 py-1"><ShieldCheck className="w-3.5 h-3.5" /> Administrator · Akses Penuh</span>
        </div>
      </div>

      <SectionCard icon={User} title="Informasi Profil" desc="Data kontak administrator">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Nama Lengkap" required error={errors.nama} className="md:col-span-2">
            <div className="relative flex items-center"><Icon icon={User} /><input value={p.nama} onChange={(e) => set("profil", { nama: e.target.value })} className={`${inputCls} pl-10 ${errors.nama ? "!border-rose-400 !ring-4 !ring-rose-100" : ""}`} /></div>
          </Field>
          <Field label="Email Perusahaan" required error={errors.email}>
            <div className="relative flex items-center"><Icon icon={AtSign} /><input type="email" value={p.email} onChange={(e) => set("profil", { email: e.target.value })} className={`${inputCls} pl-10 ${errors.email ? "!border-rose-400 !ring-4 !ring-rose-100" : ""}`} /></div>
          </Field>
          <Field label="Nomor Telepon" required error={errors.telepon}>
            <div className="relative flex items-center"><Icon icon={Phone} /><input value={p.telepon} onChange={(e) => set("profil", { telepon: e.target.value })} className={`${inputCls} pl-10 ${errors.telepon ? "!border-rose-400 !ring-4 !ring-rose-100" : ""}`} /></div>
          </Field>
          <Field label="Jabatan">
            <div className="relative flex items-center"><Icon icon={Briefcase} /><input value={p.jabatan} onChange={(e) => set("profil", { jabatan: e.target.value })} className={`${inputCls} pl-10`} /></div>
          </Field>
          <Field label="Role" hint="Role hanya dapat diubah dari menu Pengguna.">
            <div className="relative flex items-center"><Icon icon={ShieldCheck} /><input disabled value="Administrator" className={`${inputCls} pl-10`} /></div>
          </Field>
        </div>
      </SectionCard>
    </>
  );
}

/* ================= Tab: Keamanan ================= */

function KeamananTab({ draft, set, toast }: { draft: AdminSettings; set: SetFn; toast: (t: { tone: "success" | "error"; title: string; desc?: string }) => void }) {
  const [lama, setLama] = useState("");
  const [baru, setBaru] = useState("");
  const [ulang, setUlang] = useState("");
  const [lihat, setLihat] = useState(false);
  const [err, setErr] = useState<Record<string, string>>({});
  const [sesi, setSesi] = useState(SESI_AWAL);

  const skor = kekuatanPassword(baru);
  const label = ["Terlalu lemah", "Lemah", "Cukup", "Kuat", "Sangat kuat"][skor];
  const warna = ["bg-slate-200", "bg-rose-500", "bg-amber-500", "bg-blue-500", "bg-emerald-500"][skor];

  const ganti = (e: React.FormEvent) => {
    e.preventDefault();
    const x: Record<string, string> = {};
    if (!lama) x.lama = "Masukkan kata sandi saat ini.";
    if (baru.length < draft.keamanan.minPassword) x.baru = `Minimal ${draft.keamanan.minPassword} karakter.`;
    else if (skor < 2) x.baru = "Kata sandi terlalu lemah — kombinasikan huruf besar/kecil dan angka.";
    if (baru && baru === lama) x.baru = "Kata sandi baru harus berbeda dari yang lama.";
    if (ulang !== baru) x.ulang = "Konfirmasi tidak cocok.";
    setErr(x);
    if (Object.keys(x).length) return;
    setLama(""); setBaru(""); setUlang("");
    toast({ tone: "success", title: "Kata sandi diperbarui", desc: "Gunakan kata sandi baru saat login berikutnya." });
  };

  return (
    <>
      <form onSubmit={ganti}>
        <SectionCard
          icon={KeyRound}
          title="Ganti Kata Sandi"
          desc="Gunakan kata sandi unik yang tidak dipakai di layanan lain"
          footer={<button type="submit" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold shadow-sm transition-all hover:-translate-y-0.5"><KeyRound className="w-4 h-4" /> Perbarui Kata Sandi</button>}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Kata Sandi Saat Ini" required error={err.lama} className="md:col-span-2">
              <input type="password" value={lama} onChange={(e) => setLama(e.target.value)} autoComplete="current-password" className={`${inputCls} md:max-w-sm ${err.lama ? "!border-rose-400" : ""}`} />
            </Field>
            <Field label="Kata Sandi Baru" required error={err.baru}>
              <div className="relative">
                <input type={lihat ? "text" : "password"} value={baru} onChange={(e) => setBaru(e.target.value)} autoComplete="new-password" placeholder={`Minimal ${draft.keamanan.minPassword} karakter`} className={`${inputCls} pr-11 ${err.baru ? "!border-rose-400" : ""}`} />
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
              <input type={lihat ? "text" : "password"} value={ulang} onChange={(e) => setUlang(e.target.value)} autoComplete="new-password" className={`${inputCls} ${err.ulang ? "!border-rose-400" : ""}`} />
            </Field>
          </div>
        </SectionCard>
      </form>

      <SectionCard icon={ShieldCheck} title="Kebijakan Keamanan" desc="Berlaku untuk seluruh pengguna sistem">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          <Field label="Panjang Minimal Kata Sandi">
            <select value={draft.keamanan.minPassword} onChange={(e) => set("keamanan", { minPassword: Number(e.target.value) })} className={`${inputCls} cursor-pointer`}>
              {[8, 10, 12, 14].map((n) => <option key={n} value={n}>{n} karakter</option>)}
            </select>
          </Field>
          <Field label="Batas Waktu Sesi Tidak Aktif">
            <div className="relative flex items-center"><Icon icon={Timer} />
              <select value={draft.keamanan.timeoutMenit} onChange={(e) => set("keamanan", { timeoutMenit: Number(e.target.value) })} className={`${inputCls} pl-10 cursor-pointer`}>
                {[15, 30, 60, 120].map((n) => <option key={n} value={n}>{n} menit</option>)}
              </select>
            </div>
          </Field>
        </div>
        <ToggleRow title="Wajibkan verifikasi dua langkah (2FA)" desc="Seluruh akun Administrator dan Supervisor harus memverifikasi login dengan kode." checked={draft.keamanan.wajib2fa} onChange={(v) => set("keamanan", { wajib2fa: v })} />
      </SectionCard>

      <SectionCard icon={MonitorSmartphone} title="Sesi Aktif" desc="Perangkat yang sedang masuk dengan akun Anda">
        <ul className="flex flex-col gap-2.5">
          {sesi.map((s) => (
            <li key={s.id} className="flex items-center gap-4 p-3.5 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
              <span className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0"><s.ikon className="w-4 h-4" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900 flex items-center gap-2">{s.perangkat}{s.saatIni && <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">Sesi ini</span>}</p>
                <p className="text-xs text-slate-400 mt-0.5">{s.lokasi} · {s.terakhir}</p>
              </div>
              {!s.saatIni && (
                <button
                  onClick={() => { setSesi((c) => c.filter((x) => x.id !== s.id)); toast({ tone: "success", title: "Sesi diakhiri", desc: s.perangkat }); }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                ><LogOut className="w-3.5 h-3.5" /> Akhiri</button>
              )}
            </li>
          ))}
        </ul>
      </SectionCard>
    </>
  );
}

/* ================= Tab: Sistem ================= */

function SistemTab({ draft, set, errors }: { draft: AdminSettings; set: SetFn; errors: Record<string, string> }) {
  const s = draft.sistem;
  return (
    <>
      <SectionCard icon={Building2} title="Identitas Aplikasi" desc="Tampil pada sidebar, email, dan laporan">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Nama Aplikasi" required error={errors.namaAplikasi}>
            <input value={s.namaAplikasi} onChange={(e) => set("sistem", { namaAplikasi: e.target.value })} className={`${inputCls} ${errors.namaAplikasi ? "!border-rose-400" : ""}`} />
          </Field>
          <Field label="Nama Perusahaan" required error={errors.namaPerusahaan}>
            <input value={s.namaPerusahaan} onChange={(e) => set("sistem", { namaPerusahaan: e.target.value })} className={`${inputCls} ${errors.namaPerusahaan ? "!border-rose-400" : ""}`} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard icon={Globe2} title="Regional & Tampilan" desc="Zona waktu, format tanggal, dan bahasa antarmuka">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="Zona Waktu">
            <div className="relative flex items-center"><Icon icon={Clock} />
              <select value={s.zonaWaktu} onChange={(e) => set("sistem", { zonaWaktu: e.target.value as typeof s.zonaWaktu })} className={`${inputCls} pl-10 cursor-pointer`}>
                <option value="Asia/Jakarta">WIB (UTC+7)</option>
                <option value="Asia/Makassar">WITA (UTC+8)</option>
                <option value="Asia/Jayapura">WIT (UTC+9)</option>
              </select>
            </div>
          </Field>
          <Field label="Format Tanggal">
            <select value={s.formatTanggal} onChange={(e) => set("sistem", { formatTanggal: e.target.value as typeof s.formatTanggal })} className={`${inputCls} cursor-pointer`}>
              <option value="DD MMM YYYY">18 Nov 2026</option>
              <option value="DD/MM/YYYY">18/11/2026</option>
              <option value="YYYY-MM-DD">2026-11-18</option>
            </select>
          </Field>
          <Field label="Bahasa">
            <select value={s.bahasa} onChange={(e) => set("sistem", { bahasa: e.target.value as typeof s.bahasa })} className={`${inputCls} cursor-pointer`}>
              <option value="id">Bahasa Indonesia</option>
              <option value="en">English</option>
            </select>
          </Field>
        </div>
      </SectionCard>

      <SectionCard icon={Hammer} title="Pemeliharaan Sistem" desc="Batasi akses sementara saat pembaruan atau perbaikan">
        <ToggleRow title="Mode pemeliharaan" desc="Karyawan, PIC, dan Supervisor tidak dapat masuk. Hanya Administrator yang tetap memiliki akses." checked={s.maintenance} onChange={(v) => set("sistem", { maintenance: v })} tone="warn" />
        {s.maintenance && (
          <div className="mt-3 flex items-start gap-2.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3 fx-reveal">
            <TriangleAlert className="w-4 h-4 shrink-0 mt-0.5" />
            Mode pemeliharaan aktif setelah Anda menyimpan perubahan. Pengguna yang sedang login akan diminta keluar.
          </div>
        )}
      </SectionCard>
    </>
  );
}

/* ================= Tab: Tiket & SLA ================= */

function TiketTab({ draft, set, errors }: { draft: AdminSettings; set: SetFn; errors: Record<string, string> }) {
  const t = draft.tiket;
  const num = (k: keyof typeof t, v: string) => set("tiket", { [k]: v === "" ? 0 : Number(v) } as Partial<typeof t>);
  const contoh = contohNomorTiket(t);
  const jam = (k: "slaMendesak" | "slaTinggi" | "slaNormal", label: string, dot: string) => (
    <Field label={label}>
      <div className="relative">
        <span className={`absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${dot}`} />
        <input type="number" min={1} value={t[k] || ""} onChange={(e) => num(k, e.target.value)} className={`${inputCls} pl-8 pr-14 ${errors.sla ? "!border-rose-400" : ""}`} />
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">jam</span>
      </div>
    </Field>
  );
  return (
    <>
      <SectionCard icon={Hash} title="Format Nomor Tiket" desc="Dibuat otomatis oleh sistem saat tiket diajukan">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="Prefix" required error={errors.prefix} hint="Contoh: SRV, ISM, TKT">
            <input value={t.prefix} maxLength={6} onChange={(e) => set("tiket", { prefix: e.target.value.toUpperCase() })} className={`${inputCls} font-mono uppercase ${errors.prefix ? "!border-rose-400" : ""}`} />
          </Field>
          <Field label="Digit Nomor Urut">
            <select value={t.panjangNomor} onChange={(e) => set("tiket", { panjangNomor: Number(e.target.value) })} className={`${inputCls} cursor-pointer`}>
              {[3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} digit</option>)}
            </select>
          </Field>
          <Field label="Sertakan Tahun">
            <div className="h-[42px] flex items-center gap-3"><Switch checked={t.sertakanTahun} onChange={(v) => set("tiket", { sertakanTahun: v })} label="Sertakan tahun" /><span className="text-sm text-slate-600">{t.sertakanTahun ? "Ya" : "Tidak"}</span></div>
          </Field>
        </div>
        <div className="mt-5 rounded-lg bg-slate-50 border border-slate-200 p-4 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-500">Pratinjau nomor tiket</span>
          <span key={contoh} className="fx-reveal font-mono text-base font-semibold text-blue-800 tracking-wide">#{contoh}</span>
        </div>
      </SectionCard>

      <SectionCard icon={Timer} title="Target SLA Default" desc="Batas waktu penyelesaian berdasarkan prioritas tiket">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {jam("slaMendesak", "Mendesak", "bg-rose-500")}
          {jam("slaTinggi", "Tinggi", "bg-orange-500")}
          {jam("slaNormal", "Normal", "bg-slate-400")}
        </div>
        {errors.sla && <p className="text-[11px] text-rose-600 mt-2 fx-reveal">{errors.sla}</p>}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-700">Peringatan SLA pada</label>
            <span className="text-sm font-semibold text-blue-800">{t.peringatanSla}% dari target</span>
          </div>
          <input type="range" min={50} max={95} step={5} value={t.peringatanSla} onChange={(e) => set("tiket", { peringatanSla: Number(e.target.value) })} className="w-full accent-blue-700 cursor-pointer" />
          <p className="text-[11px] text-slate-400 mt-1">Notifikasi dikirim ke PIC dan Supervisor ketika waktu terpakai mencapai persentase ini.</p>
        </div>
      </SectionCard>

      <SectionCard icon={FileCheck2} title="Lampiran" desc="Aturan unggah berkas pada tiket dan bukti penyelesaian">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Ukuran Maksimal per Berkas" error={errors.maksUploadMb} hint="Batas sistem 5 MB.">
            <div className="relative">
              <input type="number" min={1} max={5} value={t.maksUploadMb || ""} onChange={(e) => num("maksUploadMb", e.target.value)} className={`${inputCls} pr-12 ${errors.maksUploadMb ? "!border-rose-400" : ""}`} />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">MB</span>
            </div>
          </Field>
          <Field label="Format Diizinkan" error={errors.format}>
            <div className="flex gap-2 h-[42px] items-center">
              {(["jpg", "png", "pdf"] as const).map((f) => {
                const on = t.format[f];
                return (
                  <button key={f} type="button" onClick={() => set("tiket", { format: { ...t.format, [f]: !on } })}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase border transition-all duration-300 ${on ? "bg-blue-700 text-white border-blue-700 shadow-sm" : "bg-white text-slate-500 border-slate-200 hover:border-blue-200 hover:text-blue-700"}`}>
                    {f}
                  </button>
                );
              })}
            </div>
          </Field>
        </div>
      </SectionCard>
    </>
  );
}

/* ================= Tab: Notifikasi ================= */

function NotifikasiTab({ draft, setDraft }: { draft: AdminSettings; setDraft: React.Dispatch<React.SetStateAction<AdminSettings>> }) {
  const n = draft.notifikasi;
  const ubah = (k: NotifKey, kanal: "inapp" | "email", v: boolean) => setDraft((d) => ({ ...d, notifikasi: { ...d.notifikasi, [k]: { ...d.notifikasi[k], [kanal]: v } } }));
  return (
    <>
      <SectionCard icon={Bell} title="Peristiwa & Kanal" desc="Pilih peristiwa yang memicu notifikasi untuk Administrator">
        <div className="overflow-x-auto -mx-2">
          <table className="w-full min-w-[460px] text-left">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-slate-400">
                <th className="px-2 pb-3 font-semibold">Peristiwa</th>
                <th className="px-2 pb-3 font-semibold text-center w-24">Di aplikasi</th>
                <th className="px-2 pb-3 font-semibold text-center w-24">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(Object.keys(NOTIF_LABEL) as NotifKey[]).map((k) => (
                <tr key={k} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-2 py-3.5">
                    <p className="text-sm font-medium text-slate-900">{NOTIF_LABEL[k].judul}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{NOTIF_LABEL[k].desc}</p>
                  </td>
                  <td className="px-2 py-3.5"><div className="flex justify-center"><Switch checked={n[k].inapp} onChange={(v) => ubah(k, "inapp", v)} label={`${NOTIF_LABEL[k].judul} di aplikasi`} /></div></td>
                  <td className="px-2 py-3.5"><div className="flex justify-center"><Switch checked={n[k].email} onChange={(v) => ubah(k, "email", v)} label={`${NOTIF_LABEL[k].judul} lewat email`} /></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard icon={AtSign} title="Ringkasan Email" desc="Rekap berkala ke email administrator">
        <ToggleRow title="Ringkasan harian" desc="Kirim rekap tiket masuk, selesai, dan melewati SLA setiap hari pukul 07:00." checked={n.ringkasanHarian} onChange={(v) => setDraft((d) => ({ ...d, notifikasi: { ...d.notifikasi, ringkasanHarian: v } }))} />
      </SectionCard>
    </>
  );
}
