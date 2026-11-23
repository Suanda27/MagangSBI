"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { User as UserIcon, Hash, AtSign, Briefcase, Building2, ShieldCheck, ArrowLeft, CheckCircle2, KeyRound, Phone, Loader2, TriangleAlert, UserSearch } from "lucide-react";
import { KotakGalat } from "@/components/admin/master-dialogs";
import { getSectionsAdmin, getUser, updateUser, type PayloadPengguna, type SectionAdminApi } from "@/lib/api/admin";
import { errorMessage, toApiError } from "@/lib/api/errors";
import type { Role, User } from "@/lib/api/types";
import { setFlash } from "@/lib/admin/flash";
import { butuhSection, ROLE_OPSI } from "@/lib/admin/pengguna";
import { useAuth } from "@/lib/auth/auth-context";

const inputDasar = "w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400";
const salahCls = "!border-rose-400 !ring-4 !ring-rose-100";

/** Pesan galat per isian (tingkat atas berkas supaya bukan komponen yang dibuat saat render). */
function Galat({ pesan }: { pesan?: string }) {
  return pesan ? <span className="text-[11px] text-rose-600 fx-reveal">{pesan}</span> : null;
}

type Muat = { status: "loading" } | { status: "error"; pesan: string; tidakAda: boolean } | { status: "ready"; user: User };

export default function EditPenggunaPage() {
  const params = useParams<{ id: string }>();
  const [muat, setMuat] = useState<Muat>({ status: "loading" });
  const [sections, setSections] = useState<SectionAdminApi[]>([]);
  const [percobaan, setPercobaan] = useState(0);

  useEffect(() => {
    let batal = false;
    Promise.all([getUser(params.id), getSectionsAdmin()])
      .then(([u, s]) => {
        if (batal) return;
        setSections(s);
        setMuat({ status: "ready", user: u });
      })
      .catch((e) => {
        if (!batal) setMuat({ status: "error", pesan: errorMessage(e, "Gagal memuat data pengguna."), tidakAda: toApiError(e).status === 404 });
      });
    return () => {
      batal = true;
    };
  }, [params.id, percobaan]);

  if (muat.status === "loading") {
    return (
      <div className="py-24 flex items-center justify-center gap-3 text-sm text-slate-500" role="status" aria-live="polite">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> Memuat data pengguna...
      </div>
    );
  }

  if (muat.status === "error") {
    return (
      <>
        <Link href="/admin/pengguna" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Pengguna
        </Link>
        <div className="bg-white rounded-xl border border-slate-200 py-14 px-6 flex flex-col items-center text-center gap-3" role="alert">
          <span className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">{muat.tidakAda ? <UserSearch className="w-6 h-6" /> : <TriangleAlert className="w-6 h-6" />}</span>
          <h1 className="text-sm font-semibold text-slate-900">{muat.tidakAda ? "Pengguna tidak ditemukan" : "Data pengguna tidak dapat dimuat"}</h1>
          <p className="text-xs text-slate-500 max-w-sm">{muat.pesan}</p>
          {!muat.tidakAda && <button onClick={() => { setMuat({ status: "loading" }); setPercobaan((n) => n + 1); }} className="px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-colors">Coba Lagi</button>}
        </div>
      </>
    );
  }

  return <FormEdit user={muat.user} sections={sections} />;
}

function FormEdit({ user, sections }: { user: User; sections: SectionAdminApi[] }) {
  const router = useRouter();
  const { user: saya, setUser } = useAuth();
  const dirisendiri = saya?.id === user.id;

  const [name, setName] = useState(user.name);
  const [nik, setNik] = useState(user.nik ?? "");
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState<Role>(user.role);
  const [section, setSection] = useState(user.bagian ? String(user.bagian.id) : "");
  const [jabatan, setJabatan] = useState(user.jabatan ?? "");
  const [telepon, setTelepon] = useState(user.telepon ?? "");
  const [status, setStatus] = useState<"aktif" | "nonaktif">(user.status);
  const [password, setPassword] = useState("");
  const [ulang, setUlang] = useState("");

  const [err, setErr] = useState<Record<string, string>>({});
  const [umum, setUmum] = useState<string | null>(null);
  const [proses, setProses] = useState(false);

  const perluSection = butuhSection(role);
  // Section akun ini tetap tampil walau sudah nonaktif; pilihan lain hanya section aktif.
  const opsiSection = [
    ...(user.bagian && !sections.some((s) => s.id === user.bagian!.id && s.status === "aktif") ? [{ id: user.bagian.id, label: `${user.bagian.kode_bagian} · ${user.bagian.nama_bagian} (nonaktif)` }] : []),
    ...sections.filter((s) => s.status === "aktif").map((s) => ({ id: s.id, label: `${s.kode_bagian} · ${s.nama_bagian}` })),
  ];
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
    if (password && password !== ulang) lokal.password_confirmation = "Konfirmasi kata sandi tidak cocok.";
    setErr(lokal);
    if (Object.keys(lokal).length) return;

    const payload: PayloadPengguna = {
      name: name.trim(),
      nik: nik.trim(),
      email: email.trim(),
      role,
      jabatan: jabatan.trim() || null,
      telepon: telepon.trim() || null,
      status,
      // Admin tidak terikat section; untuk peran lain section wajib dikirim.
      ...(perluSection ? { id_bagian: Number(section) } : {}),
      // Kata sandi hanya dikirim bila Admin sengaja mengisi (reset).
      ...(password ? { password, password_confirmation: ulang } : {}),
    };

    setProses(true);
    try {
      const baru = await updateUser(user.id, payload);
      if (dirisendiri) setUser(baru); // header ikut berubah bila yang diubah akun sendiri
      setFlash({ title: "Pengguna diperbarui", desc: baru.name });
      router.push(`/admin/pengguna/${user.id}`);
    } catch (e2) {
      const apiErr = toApiError(e2);
      if (apiErr.isValidation) {
        const ambil = (k: string) => (apiErr.errors[k]?.[0] ? { [k]: apiErr.errors[k][0] } : {});
        const sandi = apiErr.errors.password ?? [];
        const konfirmasi = sandi.find((m) => /konfirmasi/i.test(m));
        const aturan = sandi.find((m) => !/konfirmasi/i.test(m));
        setErr({
          ...ambil("name"), ...ambil("nik"), ...ambil("email"), ...ambil("role"), ...ambil("id_bagian"), ...ambil("jabatan"), ...ambil("telepon"), ...ambil("status"),
          ...(aturan ? { password: aturan } : {}),
          ...(konfirmasi ? { password_confirmation: konfirmasi } : {}),
        });
      } else {
        // 409: PIC masih memegang tiket berjalan, dan sejenisnya.
        setUmum(apiErr.message);
      }
      setProses(false);
    }
  }

  return (
    <>
      <Link href={`/admin/pengguna/${user.id}`} className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Detail Pengguna
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Edit Pengguna</h1>
        <p className="text-sm text-slate-500 mt-1">Perbarui data identitas, section, dan role akun pengguna.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="max-w-3xl flex flex-col gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 pb-4 mb-5 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700"><UserIcon className="w-5 h-5" /></div>
            <h2 className="text-base font-semibold text-slate-900">Identitas Akun Pengguna</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Nama Lengkap <span className="text-rose-500">*</span></label>
              <div className="relative flex items-center"><UserIcon className="absolute left-3 w-[18px] h-[18px] text-slate-400" /><input value={name} onChange={(e) => setName(e.target.value)} className={`${inputDasar} ${salah("name")}`} /></div>
              <Galat pesan={err.name} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">NIK <span className="text-rose-500">*</span></label>
              <div className="relative flex items-center"><Hash className="absolute left-3 w-[18px] h-[18px] text-slate-400" /><input value={nik} onChange={(e) => setNik(e.target.value)} className={`${inputDasar} font-mono ${salah("nik")}`} /></div>
              <Galat pesan={err.nik} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Email Perusahaan <span className="text-rose-500">*</span></label>
              <div className="relative flex items-center"><AtSign className="absolute left-3 w-[18px] h-[18px] text-slate-400" /><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className={`${inputDasar} ${salah("email")}`} /></div>
              <Galat pesan={err.email} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Role Pengguna</label>
              <div className="relative flex items-center">
                <ShieldCheck className="absolute left-3 w-[18px] h-[18px] text-slate-400 pointer-events-none" />
                <select value={role} onChange={(e) => setRole(e.target.value as Role)} disabled={dirisendiri} className={`${inputDasar} appearance-none cursor-pointer ${salah("role")}`}>
                  {ROLE_OPSI.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              {dirisendiri ? <span className="text-[11px] text-slate-400">Anda tidak dapat mengubah peran akun Anda sendiri.</span> : <Galat pesan={err.role} />}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Section Unit {perluSection && <span className="text-rose-500">*</span>}</label>
              <div className="relative flex items-center">
                <Building2 className="absolute left-3 w-[18px] h-[18px] text-slate-400 pointer-events-none" />
                <select value={perluSection ? section : ""} onChange={(e) => setSection(e.target.value)} disabled={!perluSection} className={`${inputDasar} appearance-none cursor-pointer ${salah("id_bagian")}`}>
                  <option value="" disabled={perluSection}>{perluSection ? "Pilih Section Unit..." : "Admin tidak terikat section"}</option>
                  {opsiSection.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </div>
              <Galat pesan={err.id_bagian} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Jabatan</label>
              <div className="relative flex items-center"><Briefcase className="absolute left-3 w-[18px] h-[18px] text-slate-400" /><input value={jabatan} onChange={(e) => setJabatan(e.target.value)} className={`${inputDasar} ${salah("jabatan")}`} /></div>
              <Galat pesan={err.jabatan} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Nomor Telepon</label>
              <div className="relative flex items-center"><Phone className="absolute left-3 w-[18px] h-[18px] text-slate-400" /><input value={telepon} onChange={(e) => setTelepon(e.target.value)} className={`${inputDasar} ${salah("telepon")}`} /></div>
              <Galat pesan={err.telepon} />
            </div>
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-slate-700">Status Akun</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg max-w-sm">
                <button type="button" onClick={() => setStatus("aktif")} className={`py-2 rounded text-xs font-semibold transition-colors ${status === "aktif" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}>Aktif</button>
                <button type="button" onClick={() => setStatus("nonaktif")} disabled={dirisendiri} className={`py-2 rounded text-xs font-semibold transition-colors disabled:opacity-40 ${status === "nonaktif" ? "bg-white text-slate-700 shadow-sm" : "text-slate-500"}`}>Nonaktif</button>
              </div>
              {dirisendiri ? <span className="text-[11px] text-slate-400">Anda tidak dapat menonaktifkan akun Anda sendiri.</span> : <Galat pesan={err.status} />}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 pb-4 mb-5 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700"><KeyRound className="w-5 h-5" /></div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Atur Ulang Kata Sandi</h2>
              <p className="text-xs text-slate-500">Kosongkan bila kata sandi tidak ingin diubah</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Kata Sandi Baru</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" placeholder="Minimal 8 karakter" className={`w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${salah("password")}`} />
              <Galat pesan={err.password} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Konfirmasi Kata Sandi Baru</label>
              <input type="password" value={ulang} onChange={(e) => setUlang(e.target.value)} autoComplete="new-password" className={`w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${salah("password_confirmation")}`} />
              <Galat pesan={err.password_confirmation} />
            </div>
          </div>
        </div>

        <KotakGalat pesan={umum} />

        <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <Link href={`/admin/pengguna/${user.id}`} className="px-5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors">Batal</Link>
          <button type="submit" disabled={proses} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-60">
            {proses ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : <CheckCircle2 className="w-[18px] h-[18px]" />} {proses ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </form>
    </>
  );
}
