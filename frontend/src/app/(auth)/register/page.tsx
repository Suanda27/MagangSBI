"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { getSections, register as apiRegister } from "@/lib/api/auth";
import { toApiError } from "@/lib/api/errors";
import type { Section } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  IdCard,
  Mail,
  Lock,
  User,
  ChevronDown,
  ArrowRight,
} from "lucide-react";

// Helper untuk delay animasi bertahap (stagger) — sama dengan halaman login
const d = (ms: number, extra: Record<string, string> = {}) =>
  ({ "--delay": `${ms}ms`, ...extra } as React.CSSProperties);

// Partikel latar dengan posisi deterministik (aman untuk SSR/hydration)
const PARTICLES = [
  { left: "8%", size: 3, dur: 16, delay: 0 },
  { left: "18%", size: 2, dur: 20, delay: 4 },
  { left: "29%", size: 4, dur: 18, delay: 8 },
  { left: "41%", size: 2, dur: 22, delay: 2 },
  { left: "53%", size: 3, dur: 17, delay: 10 },
  { left: "64%", size: 2, dur: 21, delay: 6 },
  { left: "76%", size: 4, dur: 19, delay: 12 },
  { left: "88%", size: 2, dur: 15, delay: 3 },
  { left: "95%", size: 3, dur: 23, delay: 9 },
];

const REQUIREMENTS = [
  "Alamat email resmi perusahaan (@sbi.co.id / @company.com)",
  "Nomor Induk Karyawan (NIK) yang masih aktif",
  "Verifikasi departemen / section penempatan kerja",
];

const iconCls =
  "absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 group-focus-within:scale-110 transition-all duration-300 z-10";

const inputCls = (hasError: boolean, withToggle = false) =>
  `${withToggle ? "pl-10 pr-11" : "pl-10"} h-12 bg-white rounded-lg text-sm transition-all duration-300 ${
    hasError
      ? "border-red-500 hover:border-red-500 focus-visible:ring-0 focus-visible:border-red-500"
      : "border-slate-300 hover:border-slate-400 focus-visible:ring-0 focus-visible:border-blue-500"
  }`;

const submitCls =
  "group/btn relative overflow-hidden w-full h-12 text-white font-medium rounded-lg shadow-md focus-visible:ring-blue-600 text-base transition-all duration-300 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 bg-[length:200%_100%] bg-left hover:bg-right hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-700/30 active:translate-y-0 active:scale-[0.99]";

/** Cadangan bila GET /api/referensi/sections gagal; kode sama dengan bagians.kode_bagian. */
const SECTION_CADANGAN: Pick<Section, "kode_bagian" | "nama_bagian">[] = [
  { kode_bagian: "ASM", nama_bagian: "Assembly" },
  { kode_bagian: "HR", nama_bagian: "HR (Human Resources)" },
  { kode_bagian: "IS", nama_bagian: "IS (Information Systems)" },
  { kode_bagian: "PE", nama_bagian: "PE (Production Engineering)" },
  { kode_bagian: "GA", nama_bagian: "GA (General Affairs)" },
];

export default function RegisterPage() {
  const router = useRouter();
  const { user, status } = useAuth();
  const [sections, setSections] = useState<Pick<Section, "kode_bagian" | "nama_bagian">[]>(SECTION_CADANGAN);

  // Form states
  const [formData, setFormData] = useState({
    fullName: "",
    nik: "",
    email: "",
    section: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");
  const [shakeKey, setShakeKey] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Daftar section dari server (sumber kebenaran); gagal -> tetap memakai daftar cadangan.
  useEffect(() => {
    let dibatalkan = false;
    getSections()
      .then((data) => {
        if (!dibatalkan && data.length > 0) setSections(data);
      })
      .catch(() => {});
    return () => {
      dibatalkan = true;
    };
  }, []);

  // Sudah punya sesi aktif: tidak perlu mendaftar lagi.
  useEffect(() => {
    if (status === "authenticated" && user && !isSuccess) router.replace(user.home);
  }, [status, user, isSuccess, router]);

  // Efek spotlight mengikuti kursor di panel branding (tanpa re-render)
  const brandRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const handleBrandMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = brandRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear specific error on change
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    if (generalError) setGeneralError("");
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Nama lengkap wajib diisi.";
    }

    if (!formData.nik.trim()) {
      newErrors.nik = "NIK Karyawan wajib diisi.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email)) {
      newErrors.email = "Masukkan alamat email yang valid.";
    }

    if (!formData.section) {
      newErrors.section = "Silakan pilih section penugasan Anda.";
    }

    if (!formData.password || formData.password.length < 8) {
      newErrors.password = "Kata sandi minimal 8 karakter.";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Konfirmasi kata sandi tidak cocok.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /** Animasi getar pada form (re-trigger tanpa me-remount), sama seperti login. */
  const goyangForm = () => {
    setShakeKey((k) => k + 1);
    const form = formRef.current;
    if (form) {
      form.classList.remove("login-shake");
      void form.offsetWidth;
      form.classList.add("login-shake");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");

    if (!validate()) {
      setGeneralError("Mohon periksa kembali kolom formulir yang belum sesuai.");
      goyangForm();
      return;
    }

    setIsLoading(true);

    try {
      await apiRegister({
        name: formData.fullName.trim(),
        nik: formData.nik.trim(),
        email: formData.email.trim(),
        section: formData.section,
        password: formData.password,
        password_confirmation: formData.confirmPassword,
      });
      setIsSuccess(true);
    } catch (err) {
      const e = toApiError(err);

      if (e.isValidation) {
        // Pesan server -> kolom form (nama field backend berbeda: name -> fullName).
        const pesan = e.errors;
        const peta: Record<string, string> = {};
        if (pesan.name?.[0]) peta.fullName = pesan.name[0];
        if (pesan.nik?.[0]) peta.nik = pesan.nik[0];
        if (pesan.email?.[0]) peta.email = pesan.email[0];
        const bagian = pesan.section?.[0] ?? pesan.id_bagian?.[0];
        if (bagian) peta.section = bagian;
        // Backend memakai satu field "password" untuk aturan sandi dan konfirmasi.
        const sandi = pesan.password ?? [];
        const konfirmasi = sandi.find((m) => /konfirmasi/i.test(m));
        const aturan = sandi.find((m) => !/konfirmasi/i.test(m));
        if (aturan) peta.password = aturan;
        if (konfirmasi) peta.confirmPassword = konfirmasi;

        setErrors(peta);
        setGeneralError("Mohon periksa kembali kolom formulir yang belum sesuai.");
      } else {
        // 429 (terlalu sering), server mati, dan sebagainya: pesan dari API.
        setGeneralError(e.message);
      }
      goyangForm();
    } finally {
      setIsLoading(false);
    }
  };

  const fillSampleData = () => {
    setFormData({
      fullName: "Tes Pendaftaran",
      nik: `TES-${Date.now().toString().slice(-6)}`,
      email: `tes.${Date.now().toString().slice(-6)}@sbi.test`,
      section: "IS",
      password: "Enterprise@2026",
      confirmPassword: "Enterprise@2026",
    });
    setErrors({});
    setGeneralError("");
  };

  const fieldError = (key: string) =>
    errors[key] ? (
      <p className="text-xs text-red-600 font-medium animate-in fade-in slide-in-from-top-2 duration-300">
        {errors[key]}
      </p>
    ) : null;

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white text-slate-900 font-sans antialiased overflow-hidden">
      {/* LEFT SIDE: BRANDING AREA (sama dengan Login) */}
      <div
        ref={brandRef}
        onMouseMove={handleBrandMouseMove}
        className="group/brand w-full md:w-1/2 bg-[#102046] border-b md:border-b-0 md:border-r border-white/10 flex flex-col justify-between p-8 sm:p-12 lg:p-16 relative overflow-hidden shadow-2xl text-white"
      >
        {/* Ambient background glow elements (animated) */}
        <div className="login-blob absolute -top-32 -left-32 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl pointer-events-none" style={d(0, { "--dur": "20s" })}></div>
        <div className="login-blob absolute top-1/3 -right-24 w-80 h-80 bg-indigo-400/25 rounded-full blur-3xl pointer-events-none" style={d(0, { "--dur": "24s", "--delay": "-6s" })}></div>
        <div className="login-blob absolute -bottom-28 left-1/4 w-[420px] h-[420px] bg-blue-400/20 rounded-full blur-3xl pointer-events-none" style={d(0, { "--dur": "28s", "--delay": "-12s" })}></div>

        {/* Subtle technological grid / node overlay (drifting) */}
        <div className="login-grid absolute inset-0 opacity-[0.1] pointer-events-none bg-[radial-gradient(#93c5fd_1px,transparent_1px)] [background-size:24px_24px]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-blue-700/20 via-transparent to-[#0a142e]/80 pointer-events-none"></div>

        {/* Cursor spotlight */}
        <div className="login-spotlight absolute inset-0 pointer-events-none opacity-0 group-hover/brand:opacity-100"></div>

        {/* Floating particles */}
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="login-particle"
            style={{
              left: p.left,
              width: p.size,
              height: p.size,
              ...d(0, { "--dur": `${p.dur}s`, "--delay": `-${p.delay}s` }),
            }}
          />
        ))}

        {/* Center Branding / Value Proposition */}
        <div className="my-auto py-10 md:py-0 relative z-10 max-w-lg">
          <img
            alt="Logo"
            className="login-logo h-16 sm:h-20 w-auto mb-6 sm:mb-8 object-contain drop-shadow-2xl filter brightness-110"
            src="/LogoSBI.png"
          />

          <h1 className="login-reveal text-3xl sm:text-4xl font-bold tracking-tight leading-tight drop-shadow-sm" style={d(200)}>
            <span className="login-gradient-text">Sederhanakan layanan permintaan internal Anda.</span>
          </h1>
          <p className="login-reveal mt-4 text-blue-100/80 text-base leading-relaxed font-normal" style={d(350)}>
            Ajukan, pantau, dan kelola permintaan layanan internal melalui satu platform terpusat. Daftarkan akun korporat Anda untuk memulai.
          </p>

          {/* Requirements */}
          <div className="mt-8 pt-6 border-t border-white/15 space-y-3.5">
            <div className="login-reveal text-xs font-semibold text-white/90 uppercase tracking-wider flex items-center gap-2" style={d(450)}>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              Persyaratan Registrasi Karyawan
            </div>
            {REQUIREMENTS.map((label, i) => (
              <div
                key={label}
                className="login-reveal-x group/feat flex items-center gap-3 text-sm text-blue-100 font-medium rounded-xl p-1.5 -m-1.5 transition-all duration-300 hover:bg-white/5 hover:translate-x-1 cursor-default"
                style={d(550 + i * 110)}
              >
                <span className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0 text-blue-300 shadow-sm transition-all duration-300 group-hover/feat:bg-blue-500/30 group-hover/feat:text-white group-hover/feat:scale-110 group-hover/feat:rotate-6 group-hover/feat:shadow-[0_0_16px_rgba(96,165,250,0.6)]">
                  <CheckCircle2 className="w-[18px] h-[18px]" />
                </span>
                <span className="transition-colors duration-300 group-hover/feat:text-white">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom copyright / metadata */}
        <div className="login-reveal relative z-10 text-xs text-blue-200/60 flex items-center justify-between pt-6" style={d(1000)}>
          <span>© 2026 PT Solusi Bangun Indonesia Tbk</span>
          <div className="flex gap-4 font-medium text-blue-200/70">
            <a href="#" className="hover:text-white transition-colors">Privasi</a>
            <a href="#" className="hover:text-white transition-colors">Ketentuan</a>
            <a href="#" className="hover:text-white transition-colors">Bantuan</a>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: REGISTRATION FORM / SUCCESS STATE */}
      <div className="w-full md:w-1/2 bg-white flex flex-col justify-center items-center p-6 sm:p-12 lg:p-14 relative">
        {/* Soft decorative background on form side */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-blue-100/50 rounded-full blur-3xl pointer-events-none login-blob" style={d(0, { "--dur": "26s" })}></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-100/40 rounded-full blur-3xl pointer-events-none login-blob" style={d(0, { "--dur": "30s", "--delay": "-10s" })}></div>

        <div className="w-full max-w-[500px] relative z-10">
          {!isSuccess ? (
            /* FORM VIEW */
            <div>
              {/* Header */}
              <div className="mb-8">
                <h2 className="login-reveal text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight" style={d(150)}>
                  Buat Akun Baru
                </h2>
                <p className="login-reveal text-sm text-slate-500 mt-2" style={d(250)}>
                  Daftarkan akun karyawan Anda untuk mengakses layanan internal ISM.
                </p>
              </div>

              {/* General Alert Box */}
              {generalError && (
                <div
                  key={`err-${shakeKey}`}
                  className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-sm text-red-700 animate-in fade-in slide-in-from-top-2 duration-300"
                >
                  <AlertCircle className="text-red-600 w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800">Pendaftaran Gagal</p>
                    <p className="text-xs text-red-600 mt-0.5">{generalError}</p>
                  </div>
                </div>
              )}

              {/* Form */}
              <form ref={formRef} onSubmit={handleRegister} className="space-y-5">
                {/* Row 1: Full Name & Employee NIK */}
                <div className="login-reveal grid grid-cols-1 sm:grid-cols-2 gap-4" style={d(350)}>
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName" className="text-slate-700 font-semibold">
                      Nama Lengkap <span className="text-red-500">*</span>
                    </Label>
                    <div className="login-input-wrap group">
                      <span className={iconCls}>
                        <User className="w-5 h-5" />
                      </span>
                      <Input
                        id="fullName"
                        name="fullName"
                        type="text"
                        placeholder="Masukkan nama lengkap"
                        value={formData.fullName}
                        onChange={handleChange}
                        className={inputCls(!!errors.fullName)}
                      />
                    </div>
                    {fieldError("fullName")}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="nik" className="text-slate-700 font-semibold">
                      NIK Karyawan <span className="text-red-500">*</span>
                    </Label>
                    <div className="login-input-wrap group">
                      <span className={iconCls}>
                        <IdCard className="w-5 h-5" />
                      </span>
                      <Input
                        id="nik"
                        name="nik"
                        type="text"
                        placeholder="contoh: EMP-2023-0842"
                        value={formData.nik}
                        onChange={handleChange}
                        className={inputCls(!!errors.nik)}
                      />
                    </div>
                    {fieldError("nik")}
                  </div>
                </div>

                {/* Row 2: Email & Section */}
                <div className="login-reveal grid grid-cols-1 sm:grid-cols-2 gap-4" style={d(450)}>
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-slate-700 font-semibold">
                      Email Perusahaan <span className="text-red-500">*</span>
                    </Label>
                    <div className="login-input-wrap group">
                      <span className={iconCls}>
                        <Mail className="w-5 h-5" />
                      </span>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="nama@sbi.co.id"
                        value={formData.email}
                        onChange={handleChange}
                        className={inputCls(!!errors.email)}
                      />
                    </div>
                    {fieldError("email")}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="section" className="text-slate-700 font-semibold">
                      Section / Unit <span className="text-red-500">*</span>
                    </Label>
                    <div className="login-input-wrap group">
                      <select
                        id="section"
                        name="section"
                        value={formData.section}
                        onChange={handleChange}
                        className={`w-full h-12 px-3.5 pr-9 bg-white border rounded-lg text-sm text-slate-900 focus:outline-none appearance-none transition-all duration-300 ${
                          errors.section
                            ? "border-red-500 hover:border-red-500 focus:border-red-500"
                            : "border-slate-300 hover:border-slate-400 focus:border-blue-500"
                        }`}
                      >
                        <option value="" disabled>Pilih section</option>
                        {sections.map((sec) => (
                          <option key={sec.kode_bagian} value={sec.kode_bagian}>{sec.nama_bagian}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-5 h-5 absolute right-3 top-3.5 text-slate-400 pointer-events-none transition-colors duration-300 group-focus-within:text-blue-600" />
                    </div>
                    {fieldError("section")}
                  </div>
                </div>

                {/* Password */}
                <div className="login-reveal space-y-1.5" style={d(550)}>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-slate-700 font-semibold">
                      Kata Sandi <span className="text-red-500">*</span>
                    </Label>
                    <span className="text-xs text-slate-400">Min. 8 karakter</span>
                  </div>
                  <div className="login-input-wrap group">
                    <span className={iconCls}>
                      <Lock className="w-5 h-5" />
                    </span>
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Masukkan kata sandi baru"
                      value={formData.password}
                      onChange={handleChange}
                      className={inputCls(!!errors.password, true)}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-blue-600 focus:outline-none z-10 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <span key={showPassword ? "off" : "on"} className="animate-in fade-in zoom-in-50 spin-in-45 duration-300">
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </span>
                    </button>
                  </div>
                  {fieldError("password")}
                </div>

                {/* Confirm Password */}
                <div className="login-reveal space-y-1.5" style={d(650)}>
                  <Label htmlFor="confirmPassword" className="text-slate-700 font-semibold">
                    Konfirmasi Kata Sandi <span className="text-red-500">*</span>
                  </Label>
                  <div className="login-input-wrap group">
                    <span className={iconCls}>
                      <Lock className="w-5 h-5" />
                    </span>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Ketik ulang kata sandi"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={inputCls(!!errors.confirmPassword, true)}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-blue-600 focus:outline-none z-10 transition-colors"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <span key={showConfirmPassword ? "off" : "on"} className="animate-in fade-in zoom-in-50 spin-in-45 duration-300">
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </span>
                    </button>
                  </div>
                  {fieldError("confirmPassword")}
                </div>

                {/* Quick Demo Autofill */}
                <div className="login-reveal flex justify-end pt-1" style={d(700)}>
                  {process.env.NODE_ENV === "development" && (
                    <button
                      type="button"
                      onClick={fillSampleData}
                      className="text-xs font-semibold text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      Isi otomatis (Uji Coba)
                    </button>
                  )}
                </div>

                {/* Submit Button */}
                <div className="login-reveal" style={d(750)}>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className={`${submitCls} mt-2 ${!isLoading ? "login-shimmer" : ""}`}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center animate-in fade-in duration-200">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Sedang Mendaftarkan Akun...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        Daftar Akun
                        <ArrowRight className="w-5 h-5 ml-2 transition-transform duration-300 group-hover/btn:translate-x-1" />
                      </span>
                    )}
                  </Button>
                </div>
              </form>

              {/* Secondary CTA: Back to Login */}
              <div className="login-reveal mt-8 text-center text-sm text-slate-600 pt-6 border-t border-slate-100" style={d(850)}>
                Sudah memiliki akun?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-blue-700 hover:text-blue-800 hover:underline underline-offset-4"
                >
                  Masuk ke Sistem
                </Link>
              </div>
            </div>
          ) : (
            /* SUCCESS STATE VIEW */
            <div className="text-center py-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-green-50 text-emerald-600 border border-green-200 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm">
                <CheckCircle2 className="login-pop w-9 h-9" />
              </div>

              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Registrasi Berhasil</h2>
              <p className="text-sm text-slate-600 mt-2 max-w-sm mx-auto leading-relaxed">
                Akun karyawan Anda telah berhasil dibuat. Silakan masuk menggunakan NIK atau email dan kata sandi yang telah Anda daftarkan.
              </p>

              {/* Summary Card */}
              <div className="my-6 p-4 bg-slate-50 border border-slate-200 rounded-xl text-left max-w-sm mx-auto text-xs space-y-2">
                <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                  <span className="text-slate-500">Nama Lengkap:</span>
                  <span className="font-semibold text-slate-800">{formData.fullName}</span>
                </div>
                <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                  <span className="text-slate-500">NIK Karyawan:</span>
                  <span className="font-semibold text-slate-800">{formData.nik}</span>
                </div>
                <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                  <span className="text-slate-500">Email:</span>
                  <span className="font-semibold text-slate-800">{formData.email}</span>
                </div>
                <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                  <span className="text-slate-500">Section:</span>
                  <span className="font-semibold text-slate-800">{formData.section}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-slate-500">Status Akun:</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                    Aktif
                  </span>
                </div>
              </div>

              <Button
                type="button"
                onClick={() => router.push("/login")}
                className={`${submitCls} login-shimmer max-w-sm mx-auto`}
              >
                <span className="flex items-center justify-center">
                  Masuk Sekarang
                  <ArrowRight className="w-5 h-5 ml-2 transition-transform duration-300 group-hover/btn:translate-x-1" />
                </span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
