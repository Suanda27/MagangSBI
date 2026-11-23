"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Hash, AtSign, Briefcase, Building2, ShieldCheck, KeyRound, Phone, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { KotakGalat } from "@/components/admin/master-dialogs";
import { createUser, getSectionsAdmin, type SectionAdminApi } from "@/lib/api/admin";
import { toApiError } from "@/lib/api/errors";
import type { Role } from "@/lib/api/types";
import { setFlash } from "@/lib/admin/flash";
import { butuhSection, ROLE_OPSI } from "@/lib/admin/pengguna";
import { initialsOf } from "@/lib/auth/user-display";

const inputDasar = "w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const salahCls = "!border-rose-400 !ring-4 !ring-rose-100";

/** Pesan galat per isian (tingkat atas berkas supaya bukan komponen yang dibuat saat render). */
function Galat({ pesan }: { pesan?: string }) {
  return pesan ? <span className="text-[11px] text-rose-600 fx-reveal">{pesan}</span> : null;
}

export default function TambahPenggunaPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [nik, setNik] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("employee");
  const [section, setSection] = useState("");
  const [jabatan, setJabatan] = useState("");
  const [telepon, setTelepon] = useState("");
  const [password, setPassword] = useState("");
  const [ulang, setUlang] = useState("");

  const [sections, setSections] = useState<SectionAdminApi[]>([]);
  const [err, setErr] = useState<Record<string, string>>({});
  const [umum, setUmum] = useState<string | null>(null);
  const [proses, setProses] = useState(false);

  useEffect(() => {
    getSectionsAdmin().then((d) => setSections(d.filter((s) => s.status === "aktif"))).catch(() => undefined);
  }, []);

  const opsiRole = ROLE_OPSI.find((r) => r.value === role)!;
  const sectionDipilih = sections.find((s) => String(s.id) === section);
  const perluSection = butuhSection(role);
  const salah = (k: string) => (err[k] ? salahCls : "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (proses) return;
    setUmum(null);

    const lokal: Record<string, string> = {};
    if (!name.trim()) lokal.name = "Nama lengkap wajib diisi.";
    if (!nik.trim()) lokal.nik = "NIK wajib diisi.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) lokal.email = "Masukkan alamat email yang valid.";
    if (perluSection && !section) lokal.id_bagian = "Section wajib dipilih untuk peran ini.";
    if (!password) lokal.password = "Kata sandi wajib diisi.";
    else if (password !== ulang) lokal.password_confirmation = "Konfirmasi kata sandi tidak cocok.";
    setErr(lokal);
    if (Object.keys(lokal).length) return;

    setProses(true);
    try {
      const baru = await createUser({
        name: name.trim(),
        nik: nik.trim(),
        email: email.trim(),
        role,
        ...(perluSection ? { id_bagian: Number(section) } : {}),
        jabatan: jabatan.trim() || null,
        telepon: telepon.trim() || null,
        password,
        password_confirmation: ulang,
      });
      setFlash({ title: "Pengguna ditambahkan", desc: `${baru.name} (${baru.role_label})` });
      router.push("/admin/pengguna");
    } catch (e2) {
      const apiErr = toApiError(e2);
      if (apiErr.isValidation) {
        const ambil = (k: string) => (apiErr.errors[k]?.[0] ? { [k]: apiErr.errors[k][0] } : {});
        // Backend memakai satu field "password" untuk aturan sandi dan konfirmasi.
        const sandi = apiErr.errors.password ?? [];
        const konfirmasi = sandi.find((m) => /konfirmasi/i.test(m));
        const aturan = sandi.find((m) => !/konfirmasi/i.test(m));
        setErr({
          ...ambil("name"), ...ambil("nik"), ...ambil("email"), ...ambil("role"), ...ambil("id_bagian"), ...ambil("jabatan"), ...ambil("telepon"),
          ...(aturan ? { password: aturan } : {}),
          ...(konfirmasi ? { password_confirmation: konfirmasi } : {}),
        });
      } else {
        setUmum(apiErr.message);
      }
      setProses(false);
    }
  }


  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <Link href="/admin/pengguna" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Pengguna
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tambah Pengguna</h1>
        <p className="text-sm text-slate-500 mt-1">Tambahkan akun pengguna baru ke dalam sistem direktori internal.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-8 flex flex-col gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 pb-4 mb-5 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700"><User className="w-5 h-5" /></div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Identitas Akun Pengguna</h2>
                <p className="text-xs text-slate-500">Data identifikasi karyawan &amp; pemetaan unit organisasi</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">Nama Lengkap <span className="text-rose-500">*</span></label>
                <div className="relative flex items-center">
                  <User className="absolute left-3 w-[18px] h-[18px] text-slate-400" />
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Masukkan nama lengkap karyawan" className={`${inputDasar} ${salah("name")}`} />
                </div>
                <Galat pesan={err.name} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">Nomor Induk Karyawan (NIK) <span className="text-rose-500">*</span></label>
                <div className="relative flex items-center">
                  <Hash className="absolute left-3 w-[18px] h-[18px] text-slate-400" />
                  <input value={nik} onChange={(e) => setNik(e.target.value)} placeholder="Contoh: 22010456" className={`${inputDasar} font-mono ${salah("nik")}`} />
                </div>
                {err.nik ? <Galat pesan={err.nik} /> : <span className="text-[11px] text-slate-400">NIK harus unik di seluruh sistem.</span>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">Email Perusahaan <span className="text-rose-500">*</span></label>
                <div className="relative flex items-center">
                  <AtSign className="absolute left-3 w-[18px] h-[18px] text-slate-400" />
                  <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="nama@sbi.co.id" className={`${inputDasar} ${salah("email")}`} />
                </div>
                <Galat pesan={err.email} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">Role Pengguna <span className="text-rose-500">*</span></label>
                <div className="relative flex items-center">
                  <ShieldCheck className="absolute left-3 w-[18px] h-[18px] text-slate-400 pointer-events-none" />
                  <select
                    value={role}
                    onChange={(e) => {
                      setRole(e.target.value as Role);
                      setErr((c) => ({ ...c, id_bagian: "" }));
                    }}
                    className={`${inputDasar} appearance-none cursor-pointer ${salah("role")}`}
                  >
                    {ROLE_OPSI.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <Galat pesan={err.role} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">Section Unit {perluSection && <span className="text-rose-500">*</span>}</label>
                <div className="relative flex items-center">
                  <Building2 className="absolute left-3 w-[18px] h-[18px] text-slate-400 pointer-events-none" />
                  <select value={perluSection ? section : ""} onChange={(e) => setSection(e.target.value)} disabled={!perluSection} className={`${inputDasar} appearance-none cursor-pointer disabled:bg-slate-50 disabled:text-slate-400 ${salah("id_bagian")}`}>
                    <option value="" disabled={perluSection}>{perluSection ? "Pilih Section Unit..." : "Admin tidak terikat section"}</option>
                    {sections.map((s) => <option key={s.id} value={s.id}>{s.kode_bagian} · {s.nama_bagian}</option>)}
                  </select>
                </div>
                <Galat pesan={err.id_bagian} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">Jabatan <span className="text-[11px] font-normal text-slate-400">(opsional)</span></label>
                <div className="relative flex items-center">
                  <Briefcase className="absolute left-3 w-[18px] h-[18px] text-slate-400" />
                  <input value={jabatan} onChange={(e) => setJabatan(e.target.value)} placeholder="Contoh: Line Leader" className={`${inputDasar} ${salah("jabatan")}`} />
                </div>
                <Galat pesan={err.jabatan} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">Nomor Telepon <span className="text-[11px] font-normal text-slate-400">(opsional)</span></label>
                <div className="relative flex items-center">
                  <Phone className="absolute left-3 w-[18px] h-[18px] text-slate-400" />
                  <input value={telepon} onChange={(e) => setTelepon(e.target.value)} placeholder="+62 812-0000-0000" className={`${inputDasar} ${salah("telepon")}`} />
                </div>
                <Galat pesan={err.telepon} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 pb-4 mb-5 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700"><KeyRound className="w-5 h-5" /></div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Keamanan Akun</h2>
                <p className="text-xs text-slate-500">Kredensial login awal untuk akun ini</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">Kata Sandi <span className="text-rose-500">*</span></label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" placeholder="Minimal 8 karakter" className={`w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${salah("password")}`} />
                <Galat pesan={err.password} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">Konfirmasi Kata Sandi <span className="text-rose-500">*</span></label>
                <input type="password" value={ulang} onChange={(e) => setUlang(e.target.value)} autoComplete="new-password" placeholder="Ulangi kata sandi" className={`w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${salah("password_confirmation")}`} />
                <Galat pesan={err.password_confirmation} />
              </div>
            </div>
            <p className="mt-4 text-[11px] text-slate-400">Sampaikan kata sandi awal ini langsung kepada pengguna. Pengguna dapat menggantinya sendiri dari halaman profilnya.</p>
          </div>

          <KotakGalat pesan={umum} />

          <div className="flex items-center justify-between pt-2 bg-white p-4 rounded-xl shadow-sm border border-slate-200 gap-3">
            <Link href="/admin/pengguna" className="px-5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors">Batal</Link>
            <button type="submit" disabled={proses} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-60">
              {proses ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : <CheckCircle2 className="w-[18px] h-[18px]" />} {proses ? "Menyimpan..." : "Simpan Pengguna"}
            </button>
          </div>
        </div>

        <div className="xl:col-span-4 flex flex-col gap-6 sticky top-20">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-700"></span> Pratinjau ID Card
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700">Aktif</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-2xl shadow-inner mb-2">{name.trim() ? initialsOf(name) : "--"}</div>
              <h3 className="text-base font-semibold text-slate-900 truncate w-full">{name || "Nama Pengguna"}</h3>
              <p className="text-xs text-slate-400 font-mono mt-1">NIK: {nik || "2201XXXX"}</p>
              <span className="text-xs text-blue-700 font-medium mt-1 break-all">{email || "user@sbi.co.id"}</span>
              <div className="flex items-center gap-2 mt-3">
                <div className="px-2 py-1 rounded bg-white shadow-sm flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-800">{perluSection ? sectionDipilih?.kode_bagian ?? "Belum Ada Section" : "Tanpa Section"}</span>
                </div>
                <div className="px-2 py-1 rounded bg-white shadow-sm flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-800">{opsiRole.label}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 rounded-lg bg-slate-100 flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Cakupan Hak Akses Role</span>
              <p className="text-xs text-slate-500 leading-relaxed">{opsiRole.deskripsi}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-blue-700" />
              <h4 className="text-sm font-semibold text-slate-900">Ketentuan Pendaftaran</h4>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-500">
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" /> NIK dan email wajib unik; server memeriksanya saat Anda menyimpan.</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" /> Kata sandi minimal 8 karakter.</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" /> Karyawan, PIC, dan Supervisor wajib terikat ke satu section aktif; Admin tidak punya section.</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" /> Akun dapat dinonaktifkan kapan saja, tetapi tidak dihapus.</li>
            </ul>
          </div>
        </div>
      </form>
    </>
  );
}
