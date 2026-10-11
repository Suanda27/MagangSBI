"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  Loader2
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [nikEmail, setNikEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // Modal state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Check demonstration error condition
    if (nikEmail === "error" || password === "salah") {
      setErrorMsg("NIK/Email atau kata sandi tidak valid.");
      return;
    }

    setIsLoading(true);

    // Simulate network delay
    setTimeout(() => {
      setIsLoading(false);
      // Untuk sementara, diarahkan ke dashboard admin.
      router.push("/admin/dashboard"); 
    }, 1000);
  };

  const fillQuickCredentials = () => {
    setNikEmail("EMP-2023-0842");
    setPassword("Password123!");
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
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white text-slate-900 font-sans antialiased">
      {/* LEFT SIDE: BRANDING AREA */}
      <div className="w-full md:w-1/2 bg-[#102046] border-b md:border-b-0 md:border-r border-white/10 flex flex-col justify-between p-8 sm:p-12 lg:p-16 relative overflow-hidden shadow-2xl text-white">
        
        {/* Ambient background glow elements */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/3 -right-24 w-80 h-80 bg-indigo-400/25 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-28 left-1/4 w-[420px] h-[420px] bg-blue-400/20 rounded-full blur-3xl pointer-events-none"></div>
        
        {/* Subtle technological grid / node overlay */}
        <div className="absolute inset-0 opacity-[0.1] pointer-events-none bg-[radial-gradient(#93c5fd_1px,transparent_1px)] [background-size:24px_24px]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-blue-700/20 via-transparent to-[#0a142e]/80 pointer-events-none"></div>
        
        {/* Center Branding / Value Proposition */}
        <div className="my-auto py-10 md:py-0 relative z-10 max-w-lg">
          <img alt="Logo" className="h-16 sm:h-20 w-auto mb-6 sm:mb-8 object-contain drop-shadow-2xl filter brightness-110" src="/LOGOSBI.PNG" />
          
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight drop-shadow-sm">
            Sederhanakan layanan permintaan internal Anda.
          </h1>
          <p className="mt-4 text-blue-100/80 text-base leading-relaxed font-normal">
            Ajukan, pantau, dan kelola permintaan layanan internal melalui satu platform terpusat. Solusi cepat untuk dukungan IT, fasilitas, dan administrasi.
          </p>
          
          {/* Feature highlights */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-6 border-t border-white/15">
            <div className="flex items-center gap-3 text-sm text-blue-100 font-medium">
              <span className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0 text-blue-300 shadow-sm">
                <BadgeCheck className="w-[18px] h-[18px]" />
              </span>
              <span>Pelacakan langsung (Real-time)</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-blue-100 font-medium">
              <span className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0 text-blue-300 shadow-sm">
                <Clock className="w-[18px] h-[18px]" />
              </span>
              <span>Respons SLA terukur</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-blue-100 font-medium">
              <span className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0 text-blue-300 shadow-sm">
                <Shield className="w-[18px] h-[18px]" />
              </span>
              <span>Akses masuk tunggal terpusat</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-blue-100 font-medium">
              <span className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0 text-blue-300 shadow-sm">
                <Headset className="w-[18px] h-[18px]" />
              </span>
              <span>Dukungan khusus dari PIC</span>
            </div>
          </div>
        </div>

        {/* Bottom copyright / metadata */}
        <div className="relative z-10 text-xs text-blue-200/60 flex items-center justify-between pt-6">
          <span>© 2026 PT Solusi Bangun Indonesia Tbk</span>
          <div className="flex gap-4 font-medium text-blue-200/70">
            <a href="#" className="hover:text-white transition-colors">Privasi</a>
            <a href="#" className="hover:text-white transition-colors">Ketentuan</a>
            <a href="#" className="hover:text-white transition-colors">Bantuan</a>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: AUTHENTICATION FORM */}
      <div className="w-full md:w-1/2 bg-white flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-[440px]">
          
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Selamat Datang</h2>
            <p className="text-sm text-slate-500 mt-2">Masuk ke akun Anda untuk mengakses layanan internal.</p>
          </div>
          
          {/* Alert Notification */}
          {errorMsg && (
            <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-sm text-red-700 animate-in fade-in zoom-in-95 duration-200">
              <AlertCircle className="text-red-600 w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Autentikasi Gagal</p>
                <p className="text-xs text-red-600 mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form className="space-y-5" onSubmit={handleLogin}>
            
            {/* Field 1: NIK / Email */}
            <div className="space-y-1.5">
              <Label htmlFor="nikEmail" className="text-slate-700 font-semibold">NIK / Email</Label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                  <IdCard className="w-5 h-5" />
                </span>
                <Input 
                  id="nikEmail"
                  type="text"
                  placeholder="Masukkan NIK atau email Anda"
                  value={nikEmail}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNikEmail(e.target.value)}
                  required
                  className="pl-10 h-12 bg-white border-slate-300 rounded-lg text-sm focus-visible:ring-blue-600 focus-visible:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Field 2: Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-700 font-semibold">Kata Sandi</Label>
                
                {/* Forgot Password Modal Trigger */}
                <Dialog open={isForgotModalOpen} onOpenChange={setIsForgotModalOpen}>
                  <DialogTrigger className="text-sm font-semibold text-blue-700 hover:text-blue-800 hover:underline transition-all">
                    Lupa kata sandi?
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
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
                        <div className="p-3 bg-green-50 text-green-700 text-xs rounded-lg border border-green-200 animate-in fade-in slide-in-from-top-2">
                          Instruksi pemulihan kata sandi telah dikirimkan ke email terdaftar Anda.
                        </div>
                      )}
                      
                      <div className="flex justify-end pt-2">
                        <Button 
                          type="button" 
                          className="bg-blue-700 hover:bg-blue-800 text-white transition-all" 
                          onClick={sendResetRequest}
                        >
                          Kirim Instruksi
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

              </div>
              
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                  <Lock className="w-5 h-5" />
                </span>
                <Input 
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan kata sandi Anda"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  required
                  className="pl-10 pr-11 h-12 bg-white border-slate-300 rounded-lg text-sm focus-visible:ring-blue-600 focus-visible:border-transparent transition-all"
                />
                <button 
                  type="button" 
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember me & Quick Test Links */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" className="border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600" />
                <label htmlFor="remember" className="text-sm text-slate-600 font-medium cursor-pointer">
                  Ingat sesi saya
                </label>
              </div>
              <button type="button" className="text-xs font-semibold text-slate-400 hover:text-blue-600 transition-colors" onClick={fillQuickCredentials}>
                Isi otomatis (Uji Coba)
              </button>
            </div>

            {/* Primary Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-12 bg-blue-700 hover:bg-blue-800 text-white font-medium rounded-lg shadow-sm focus-visible:ring-blue-600 transition-all text-base mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Sedang Mengautentikasi...
                </>
              ) : "Masuk ke Sistem"}
            </Button>
          </form>

          {/* Prototype Navigations */}
          <div className="mt-8 text-center text-sm text-slate-600 pt-6 border-t border-slate-100">
            Belum memiliki akun? <a href="#" className="font-semibold text-blue-700 hover:text-blue-800 hover:underline">Hubungi Tim IT Internal</a>
          </div>

          <div className="mt-6 pt-4 text-center">
            <span className="text-xs text-slate-400 block mb-3 font-medium">Pintasan Navigasi Prototipe:</span>
            <div className="flex justify-center flex-wrap gap-2 text-xs font-semibold">
              <button onClick={() => router.push('/admin/dashboard')} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors border border-slate-200 shadow-sm">Dashboard Faiz (Admin)</button>
              <button onClick={() => router.push('/employee/dashboard')} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors border border-slate-200 shadow-sm">Dashboard Syifa (Karyawan)</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
