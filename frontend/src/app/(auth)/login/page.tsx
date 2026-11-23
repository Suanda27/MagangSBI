"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/lib/auth/auth-context";
import { ApiError, toApiError } from "@/lib/api/errors";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  BadgeCheck, 
  Clock, 
  Shield, 
  Headset, 
  IdCard, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle,
  Loader2,
  CheckCircle2,
  ArrowRight
} from "lucide-react";

// Helper untuk delay animasi bertahap (stagger)
const d = (ms: number, extra: Record<string, string> = {}) =>
  ({ "--delay": `${ms}ms`, ...extra } as React.CSSProperties);

// Partikel latar dengan posisi deterministik (aman untuk SSR/hydration)
const PARTICLES = [
  { left: "8%",  size: 3, dur: 16, delay: 0 },
  { left: "18%", size: 2, dur: 20, delay: 4 },
  { left: "29%", size: 4, dur: 18, delay: 8 },
  { left: "41%", size: 2, dur: 22, delay: 2 },
  { left: "53%", size: 3, dur: 17, delay: 10 },
  { left: "64%", size: 2, dur: 21, delay: 6 },
  { left: "76%", size: 4, dur: 19, delay: 12 },
  { left: "88%", size: 2, dur: 15, delay: 3 },
  { left: "95%", size: 3, dur: 23, delay: 9 },
];

const FEATURES = [
  { icon: BadgeCheck, label: "Pelacakan langsung (Real-time)" },
  { icon: Clock, label: "Respons SLA terukur" },
  { icon: Shield, label: "Akses masuk tunggal terpusat" },
  { icon: Headset, label: "Dukungan khusus dari PIC" },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, user, status } = useAuth();
  const [nikEmail, setNikEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [errorTitle, setErrorTitle] = useState("Autentikasi Gagal");
  const [remember, setRemember] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  
  // Modal state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

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

  // Sudah punya sesi aktif (mis. membuka /login lagi): langsung ke dashboard perannya.
  useEffect(() => {
    if (status === "authenticated" && user && !isLoading && !isSuccess) {
      router.replace(user.home);
    }
  }, [status, user, isLoading, isSuccess, router]);

  /** Pesan untuk kotak error: judul + isi, sesuai jenis kegagalan dari API. */
  const tampilkanError = (err: unknown) => {
    const e: ApiError = toApiError(err);
    if (e.status === 403) {
      setErrorTitle("Akun Dinonaktifkan");
      setErrorMsg(e.message);
    } else if (e.status === 429) {
      setErrorTitle("Terlalu Banyak Percobaan");
      setErrorMsg(e.retryAfter ? `Coba lagi dalam ${e.retryAfter} detik.` : e.message);
    } else if (e.isNetworkError) {
      setErrorTitle("Server Tidak Terjangkau");
      setErrorMsg(e.message);
    } else {
      setErrorTitle("Autentikasi Gagal");
      // 422: pesan ada di errors.login; selain itu pakai pesan umum.
      setErrorMsg(e.errors.login?.[0] ?? e.message);
    }

    setShakeKey((k) => k + 1);
    // Re-trigger animasi getar tanpa me-remount form
    const form = formRef.current;
    if (form) {
      form.classList.remove("login-shake");
      void form.offsetWidth;
      form.classList.add("login-shake");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    try {
      const akun = await login({ login: nikEmail.trim(), password, remember });
      setIsSuccess(true);
      // Jeda singkat agar animasi "Berhasil!" terlihat, lalu ke dashboard sesuai peran.
      setTimeout(() => router.push(akun.home), 700);
    } catch (err) {
      tampilkanError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fillQuickCredentials = () => {
    // Akun contoh dari PenggunaSeeder (hanya tersedia di mode pengembangan).
    setNikEmail("karyawan.is@sbi.test");
    setPassword("password");
    setErrorMsg("");
  };

  const sendResetRequest = () => {
    if (!resetEmail) {
      alert("Mohon masukkan NIK atau Email Anda");
      return;
    }
    setResetSuccess(true);
    setTimeout(() => {
      setIsForgotModalOpen(false);
      setResetSuccess(false);
      setResetEmail("");
    }, 2000);
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white text-slate-900 font-sans antialiased overflow-hidden">
      {/* LEFT SIDE: BRANDING AREA */}
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
          <img alt="Logo" className="login-logo h-16 sm:h-20 w-auto mb-6 sm:mb-8 object-contain drop-shadow-2xl filter brightness-110" src="/LOGOSBI.PNG" />
          
          <h1 className="login-reveal text-3xl sm:text-4xl font-bold tracking-tight leading-tight drop-shadow-sm" style={d(200)}>
            <span className="login-gradient-text">Sederhanakan layanan permintaan internal Anda.</span>
          </h1>
          <p className="login-reveal mt-4 text-blue-100/80 text-base leading-relaxed font-normal" style={d(350)}>
            Ajukan, pantau, dan kelola permintaan layanan internal melalui satu platform terpusat. Solusi cepat untuk dukungan IT, fasilitas, dan administrasi.
          </p>
          
          {/* Feature highlights */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-6 border-t border-white/15">
            {FEATURES.map(({ icon: Icon, label }, i) => (
              <div
                key={label}
                className="login-reveal-x group/feat flex items-center gap-3 text-sm text-blue-100 font-medium rounded-xl p-1.5 -m-1.5 transition-all duration-300 hover:bg-white/5 hover:translate-x-1 cursor-default"
                style={d(500 + i * 110)}
              >
                <span className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0 text-blue-300 shadow-sm transition-all duration-300 group-hover/feat:bg-blue-500/30 group-hover/feat:text-white group-hover/feat:scale-110 group-hover/feat:rotate-6 group-hover/feat:shadow-[0_0_16px_rgba(96,165,250,0.6)]">
                  <Icon className="w-[18px] h-[18px]" />
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

      {/* RIGHT SIDE: AUTHENTICATION FORM */}
      <div className="w-full md:w-1/2 bg-white flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16 relative">
        {/* Soft decorative background on form side */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-blue-100/50 rounded-full blur-3xl pointer-events-none login-blob" style={d(0, { "--dur": "26s" })}></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-100/40 rounded-full blur-3xl pointer-events-none login-blob" style={d(0, { "--dur": "30s", "--delay": "-10s" })}></div>

        <div className="w-full max-w-[440px] relative z-10">
          
          {/* Header */}
          <div className="mb-8">
            <h2 className="login-reveal text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight" style={d(150)}>
              Selamat Datang
            </h2>
            <p className="login-reveal text-sm text-slate-500 mt-2" style={d(250)}>Masuk ke akun Anda untuk mengakses layanan internal.</p>
          </div>
          
          {/* Alert Notification */}
          {errorMsg && (
            <div key={`err-${shakeKey}`} className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-sm text-red-700 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="text-red-600 w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">{errorTitle}</p>
                <p className="text-xs text-red-600 mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form ref={formRef} className="space-y-5" onSubmit={handleLogin}>
            
            {/* Field 1: NIK / Email */}
            <div className="login-reveal space-y-1.5" style={d(350)}>
              <Label htmlFor="nikEmail" className="text-slate-700 font-semibold">NIK / Email</Label>
              <div className="login-input-wrap group">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 group-focus-within:scale-110 transition-all duration-300 z-10">
                  <IdCard className="w-5 h-5" />
                </span>
                <Input 
                  id="nikEmail"
                  type="text"
                  placeholder="Masukkan NIK atau email Anda"
                  value={nikEmail}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNikEmail(e.target.value)}
                  required
                  className="pl-10 h-12 bg-white border-slate-300 rounded-lg text-sm hover:border-slate-400 focus-visible:ring-0 focus-visible:border-blue-500 transition-all duration-300"
                />
              </div>
            </div>

            {/* Field 2: Password */}
            <div className="login-reveal space-y-1.5" style={d(450)}>
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-700 font-semibold">Kata Sandi</Label>
                
                {/* Forgot Password Modal Trigger */}
                <Dialog open={isForgotModalOpen} onOpenChange={setIsForgotModalOpen}>
                  <DialogTrigger className="relative text-sm font-semibold text-blue-700 hover:text-blue-800 transition-colors after:absolute after:left-0 after:-bottom-0.5 after:h-[1.5px] after:w-full after:bg-current after:origin-right after:scale-x-0 hover:after:origin-left hover:after:scale-x-100 after:transition-transform after:duration-300">
                    Lupa kata sandi?
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <div className="login-pop w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                        <Lock className="w-6 h-6" />
                      </div>
                      <DialogTitle>Atur Ulang Kata Sandi</DialogTitle>
                      <DialogDescription>
                        Masukkan NIK karyawan atau email perusahaan yang terdaftar untuk menerima instruksi pemulihan.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <Label htmlFor="resetEmail">NIK atau Alamat Email</Label>
                        <Input 
                          id="resetEmail" 
                          placeholder="contoh: EMP-2023-0842 atau nama@sbi.co.id" 
                          value={resetEmail}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setResetEmail(e.target.value)}
                        />
                      </div>
                      
                      {resetSuccess && (
                        <div className="p-3 bg-green-50 text-green-700 text-xs rounded-lg border border-green-200 animate-in fade-in slide-in-from-top-2 flex items-center gap-2">
                          <CheckCircle2 className="login-pop w-4 h-4 flex-shrink-0" />
                          Instruksi pemulihan kata sandi telah dikirimkan ke email terdaftar Anda.
                        </div>
                      )}
                      
                      <div className="flex justify-end pt-2">
                        <Button 
                          type="button" 
                          className="bg-blue-700 hover:bg-blue-800 text-white transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-700/30 active:translate-y-0" 
                          onClick={sendResetRequest}
                        >
                          Kirim Instruksi
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

              </div>
              
              <div className="login-input-wrap group">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 group-focus-within:scale-110 transition-all duration-300 z-10">
                  <Lock className="w-5 h-5" />
                </span>
                <Input 
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan kata sandi Anda"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  required
                  className="pl-10 pr-11 h-12 bg-white border-slate-300 rounded-lg text-sm hover:border-slate-400 focus-visible:ring-0 focus-visible:border-blue-500 transition-all duration-300"
                />
                <button 
                  type="button" 
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-blue-600 focus:outline-none z-10 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span key={showPassword ? "off" : "on"} className="animate-in fade-in zoom-in-50 spin-in-45 duration-300">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </span>
                </button>
              </div>
            </div>

            {/* Remember me & Quick Test Links */}
            <div className="login-reveal flex items-center justify-between pt-1" style={d(550)}>
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" checked={remember} onCheckedChange={(v) => setRemember(v === true)} className="border-slate-300 transition-all duration-200 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:scale-110" />
                <label htmlFor="remember" className="text-sm text-slate-600 font-medium cursor-pointer select-none hover:text-slate-900 transition-colors">
                  Ingat sesi saya
                </label>
              </div>
              {process.env.NODE_ENV === "development" && (
                <button type="button" className="text-xs font-semibold text-slate-400 hover:text-blue-600 transition-colors" onClick={fillQuickCredentials}>
                  Isi otomatis (Uji Coba)
                </button>
              )}
            </div>

            {/* Primary Submit Button */}
            <div className="login-reveal" style={d(650)}>
              <Button 
                type="submit" 
                className={`group/btn relative overflow-hidden w-full h-12 text-white font-medium rounded-lg shadow-md focus-visible:ring-blue-600 text-base mt-2 transition-all duration-300 
                  ${isSuccess 
                    ? "bg-emerald-600 hover:bg-emerald-600 shadow-emerald-600/30" 
                    : "bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 bg-[length:200%_100%] bg-left hover:bg-right hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-700/30 active:translate-y-0 active:scale-[0.99]"}
                  ${!isLoading && !isSuccess ? "login-shimmer" : ""}`}
                disabled={isLoading || isSuccess}
              >
                {isSuccess ? (
                  <span className="flex items-center justify-center animate-in fade-in zoom-in-90 duration-300">
                    <CheckCircle2 className="login-pop w-5 h-5 mr-2" />
                    Berhasil! Mengalihkan...
                  </span>
                ) : isLoading ? (
                  <span className="flex items-center justify-center animate-in fade-in duration-200">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Sedang Mengautentikasi...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    Masuk ke Sistem
                    <ArrowRight className="w-5 h-5 ml-2 transition-transform duration-300 group-hover/btn:translate-x-1" />
                  </span>
                )}
              </Button>
            </div>
          </form>

          {/* Prototype Navigations */}
          <div className="login-reveal mt-8 text-center text-sm text-slate-600 pt-6 border-t border-slate-100" style={d(750)}>
            Belum memiliki akun?{" "}
            <Link href="/register" className="font-semibold text-blue-700 hover:text-blue-800 hover:underline underline-offset-4">
              Daftar Akun Baru
            </Link>
          </div>

          {process.env.NODE_ENV === "development" && (
            <div className="login-reveal mt-6 pt-4 text-center" style={d(850)}>
              <span className="text-xs text-slate-400 block mb-3 font-medium">Pintasan Navigasi Prototipe:</span>
              <div className="flex justify-center flex-wrap gap-2 text-xs font-semibold">
                <button onClick={() => router.push('/admin/dashboard')} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-all duration-200 border border-slate-200 shadow-sm hover:-translate-y-0.5 hover:shadow-md">Dashboard Faiz (Admin)</button>
                <button onClick={() => router.push('/employee/dashboard')} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-all duration-200 border border-slate-200 shadow-sm hover:-translate-y-0.5 hover:shadow-md">Dashboard Syifa (Karyawan)</button>
              </div>
            </div>

          )}

        </div>
      </div>
    </div>
  );
}
