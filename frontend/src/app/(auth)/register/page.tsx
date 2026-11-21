"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  Building2, 
  ChevronDown,
  ArrowRight
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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
    } else if (formData.nik.toLowerCase() === "duplicate" || formData.nik === "EMP-9999") {
      newErrors.nik = "NIK ini sudah terdaftar di sistem.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email)) {
      newErrors.email = "Masukkan alamat email yang valid.";
    } else if (formData.email.includes("taken@")) {
      newErrors.email = "Email ini sudah digunakan.";
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

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");

    if (!validate()) {
      setGeneralError("Mohon periksa kembali kolom formulir yang belum sesuai.");
      return;
    }

    setIsLoading(true);

    // Simulasi request pendaftaran ke backend
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
    }, 1000);
  };

  const fillSampleData = () => {
    setFormData({
      fullName: "Muhammad Faiz Difa Suanda",
      nik: "EMP-2023-0842",
      email: "faiz.suanda@sbi.co.id",
      section: "IS",
      password: "Enterprise@2026",
      confirmPassword: "Enterprise@2026",
    });
    setErrors({});
    setGeneralError("");
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white text-slate-900 font-sans antialiased">
      {/* LEFT SIDE: BRANDING AREA (Harmonized with Login Page) */}
      <div className="w-full md:w-1/2 bg-[#102046] border-b md:border-b-0 md:border-r border-white/10 flex flex-col justify-between p-8 sm:p-12 lg:p-16 relative overflow-hidden shadow-2xl text-white">
        
        {/* Ambient Glowing Background Elements */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/3 -right-24 w-80 h-80 bg-indigo-400/25 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-28 left-1/4 w-[420px] h-[420px] bg-blue-400/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Subtle Technological Grid Overlay */}
        <div className="absolute inset-0 opacity-[0.1] pointer-events-none bg-[radial-gradient(#93c5fd_1px,transparent_1px)] [background-size:24px_24px]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-blue-700/20 via-transparent to-[#0a142e]/80 pointer-events-none"></div>

        {/* Center Branding / Value Proposition */}
        <div className="my-auto py-10 md:py-0 relative z-10 max-w-lg">
          <img 
            alt="Logo" 
            className="h-16 sm:h-20 w-auto mb-6 sm:mb-8 object-contain drop-shadow-2xl filter brightness-110" 
            src="/LogoSBI.png" 
          />

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight drop-shadow-sm">
            Sederhanakan layanan permintaan internal Anda.
          </h1>
          <p className="mt-4 text-blue-100/80 text-base leading-relaxed font-normal">
            Ajukan, pantau, dan kelola permintaan layanan internal melalui satu platform terpusat. Daftarkan akun korporat Anda untuk memulai.
          </p>

          {/* Frosted Glass Requirements Card */}
          <div className="mt-8 p-5 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl space-y-3 shadow-lg">
            <div className="text-xs font-semibold text-white/90 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              Persyaratan Registrasi Karyawan
            </div>
            <div className="flex items-center gap-2.5 text-xs text-blue-100/90 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Alamat email resmi perusahaan (@sbi.co.id / @company.com)</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-blue-100/90 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Nomor Induk Karyawan (NIK) yang masih aktif</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-blue-100/90 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Verifikasi departemen / section penempatan kerja</span>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="relative z-10 text-xs text-blue-200/60 flex items-center justify-between pt-6">
          <span>© 2026 PT Solusi Bangun Indonesia Tbk</span>
          <div className="flex gap-4 font-medium text-blue-200/70">
            <a href="#" className="hover:text-white transition-colors">Privasi</a>
            <a href="#" className="hover:text-white transition-colors">Ketentuan</a>
            <a href="#" className="hover:text-white transition-colors">Bantuan</a>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: REGISTRATION FORM / SUCCESS STATE */}
      <div className="w-full md:w-1/2 bg-white flex flex-col justify-center items-center p-6 sm:p-12 lg:p-14 overflow-y-auto">
        <div className="w-full max-w-[500px]">
          {!isSuccess ? (
            /* FORM VIEW */
            <div>
              {/* Header */}
              <div className="mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Buat Akun Baru</h2>
                <p className="text-sm text-slate-500 mt-1.5">
                  Daftarkan akun karyawan Anda untuk mengakses layanan internal ISM.
                </p>
              </div>

              {/* General Alert Box */}
              {generalError && (
                <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-sm text-red-700 animate-in fade-in duration-200">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs font-medium text-red-800">{generalError}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleRegister} className="space-y-4">
                {/* Row 1: Full Name & Employee NIK */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Field 1: Full Name */}
                  <div className="space-y-1">
                    <Label htmlFor="fullName" className="text-xs font-semibold text-slate-700">
                      Nama Lengkap <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                        <User className="w-4 h-4" />
                      </span>
                      <Input
                        id="fullName"
                        name="fullName"
                        type="text"
                        placeholder="Masukkan nama lengkap"
                        value={formData.fullName}
                        onChange={handleChange}
                        className={`pl-9 h-10 text-sm ${errors.fullName ? "border-red-500 focus-visible:ring-red-400" : ""}`}
                      />
                    </div>
                    {errors.fullName && (
                      <p className="text-[11px] text-red-600 font-medium">{errors.fullName}</p>
                    )}
                  </div>

                  {/* Field 2: Employee NIK */}
                  <div className="space-y-1">
                    <Label htmlFor="nik" className="text-xs font-semibold text-slate-700">
                      NIK Karyawan <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                        <IdCard className="w-4 h-4" />
                      </span>
                      <Input
                        id="nik"
                        name="nik"
                        type="text"
                        placeholder="contoh: EMP-2023-0842"
                        value={formData.nik}
                        onChange={handleChange}
                        className={`pl-9 h-10 text-sm ${errors.nik ? "border-red-500 focus-visible:ring-red-400" : ""}`}
                      />
                    </div>
                    {errors.nik && (
                      <p className="text-[11px] text-red-600 font-medium">{errors.nik}</p>
                    )}
                  </div>
                </div>

                {/* Row 2: Email & Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Field 3: Email */}
                  <div className="space-y-1">
                    <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
                      Email Perusahaan <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                        <Mail className="w-4 h-4" />
                      </span>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="nama@sbi.co.id"
                        value={formData.email}
                        onChange={handleChange}
                        className={`pl-9 h-10 text-sm ${errors.email ? "border-red-500 focus-visible:ring-red-400" : ""}`}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-[11px] text-red-600 font-medium">{errors.email}</p>
                    )}
                  </div>

                  {/* Field 4: Section */}
                  <div className="space-y-1">
                    <Label htmlFor="section" className="text-xs font-semibold text-slate-700">
                      Section / Unit <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <select
                        id="section"
                        name="section"
                        value={formData.section}
                        onChange={handleChange}
                        className={`w-full h-10 px-3 bg-white border rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all appearance-none pr-8 ${
                          errors.section ? "border-red-500 focus:ring-red-400" : "border-slate-300"
                        }`}
                      >
                        <option value="" disabled>Pilih section</option>
                        <option value="Assembly">Assembly</option>
                        <option value="HR">HR (Human Resources)</option>
                        <option value="IS">IS (Information Systems)</option>
                        <option value="PE">PE (Plant Engineering)</option>
                        <option value="GA">GA (General Affairs)</option>
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-2.5 top-3 text-slate-400 pointer-events-none" />
                    </div>
                    {errors.section && (
                      <p className="text-[11px] text-red-600 font-medium">{errors.section}</p>
                    )}
                  </div>
                </div>

                {/* Field 5: Password */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-semibold text-slate-700">
                      Kata Sandi <span className="text-red-500">*</span>
                    </Label>
                    <span className="text-[11px] text-slate-400">Min. 8 karakter</span>
                  </div>
                  <div className="relative group">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                      <Lock className="w-4 h-4" />
                    </span>
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Masukkan kata sandi baru"
                      value={formData.password}
                      onChange={handleChange}
                      className={`pl-9 pr-10 h-10 text-sm ${errors.password ? "border-red-500 focus-visible:ring-red-400" : ""}`}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-[11px] text-red-600 font-medium">{errors.password}</p>
                  )}
                </div>

                {/* Field 6: Confirm Password */}
                <div className="space-y-1">
                  <Label htmlFor="confirmPassword" className="text-xs font-semibold text-slate-700">
                    Konfirmasi Kata Sandi <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative group">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                      <Lock className="w-4 h-4" />
                    </span>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Ketik ulang kata sandi"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`pl-9 pr-10 h-10 text-sm ${errors.confirmPassword ? "border-red-500 focus-visible:ring-red-400" : ""}`}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-[11px] text-red-600 font-medium">{errors.confirmPassword}</p>
                  )}
                </div>

                {/* Quick Demo Autofill */}
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={fillSampleData}
                    className="text-xs text-blue-700 hover:text-blue-800 font-medium hover:underline transition-colors"
                  >
                    Isi otomatis (Uji Coba)
                  </button>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-blue-700 hover:bg-blue-800 text-white font-medium rounded-lg shadow-sm transition-all text-sm mt-3 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sedang Mendaftarkan Akun...</span>
                    </>
                  ) : (
                    <span>Daftar Akun</span>
                  )}
                </Button>
              </form>

              {/* Secondary CTA: Back to Login */}
              <div className="mt-6 text-center text-sm text-slate-600 pt-5 border-t border-slate-100">
                Sudah memiliki akun?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-blue-700 hover:text-blue-800 hover:underline transition-all"
                >
                  Masuk ke Sistem
                </Link>
              </div>
            </div>
          ) : (
            /* SUCCESS STATE VIEW */
            <div className="text-center py-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-green-50 text-emerald-600 border border-green-200 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
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
                className="w-full max-w-sm h-11 bg-blue-700 hover:bg-blue-800 text-white font-medium rounded-lg shadow-sm transition-all text-sm flex items-center justify-center gap-2 mx-auto"
              >
                <span>Masuk Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
