"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, CheckCircle2, Loader2, Mail, Search, ShieldCheck, UserCheck, Users } from "lucide-react";
import { KotakGalat } from "@/components/admin/master-dialogs";
import { createPicMapping, getSectionsAdmin, getUsers, type SectionAdminApi } from "@/lib/api/admin";
import { toApiError } from "@/lib/api/errors";
import type { User } from "@/lib/api/types";
import { setFlash } from "@/lib/admin/flash";
import { useDaftar, useDebounced } from "@/lib/admin/use-daftar";
import { initialsOf } from "@/lib/auth/user-display";

export default function TambahPicPage() {
  const router = useRouter();
  const [qInput, setQInput] = useState("");
  const q = useDebounced(qInput.trim());
  const [dipilih, setDipilih] = useState<User | null>(null);
  const [section, setSection] = useState("");
  const [sections, setSections] = useState<SectionAdminApi[]>([]);
  const [err, setErr] = useState<Record<string, string>>({});
  const [umum, setUmum] = useState<string | null>(null);
  const [proses, setProses] = useState(false);

  // Hanya karyawan aktif yang dapat dijadikan PIC (aturan server).
  const { data, error, memuat } = useDaftar(() => getUsers({ q: q || undefined, role: "employee", status: "aktif", per_page: 8 }), JSON.stringify({ q }), "Gagal memuat daftar karyawan.");

  useEffect(() => {
    getSectionsAdmin().then((d) => setSections(d.filter((s) => s.status === "aktif"))).catch(() => undefined);
  }, []);

  const pilih = (u: User) => {
    setDipilih(u);
    // Bawaan: section asal karyawan, bila masih aktif.
    setSection(u.bagian && sections.some((s) => s.id === u.bagian!.id) ? String(u.bagian.id) : "");
    setErr({});
    setUmum(null);
  };

  const tujuan = sections.find((s) => String(s.id) === section);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (proses) return;
    setUmum(null);

    const lokal: Record<string, string> = {};
    if (!dipilih) lokal.user_id = "Pilih karyawan yang akan dijadikan PIC.";
    if (!section) lokal.id_bagian = "Section penugasan wajib dipilih.";
    setErr(lokal);
    if (Object.keys(lokal).length || !dipilih) return;

    setProses(true);
    try {
      await createPicMapping(dipilih.id, Number(section));
      setFlash({ title: "PIC ditetapkan", desc: `${dipilih.name} → ${tujuan?.kode_bagian ?? ""}` });
      router.push("/admin/pic");
    } catch (e2) {
      const apiErr = toApiError(e2);
      if (apiErr.isValidation) {
        setErr({
          ...(apiErr.errors.user_id?.[0] ? { user_id: apiErr.errors.user_id[0] } : {}),
          ...(apiErr.errors.id_bagian?.[0] ? { id_bagian: apiErr.errors.id_bagian[0] } : {}),
        });
      } else {
        setUmum(apiErr.message);
      }
      setProses(false);
    }
  }

  return (
    <>
      <Link href="/admin/pic" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" /> Kembali ke PIC
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tambah PIC</h1>
        <p className="text-sm text-slate-500 mt-1">Tetapkan karyawan sebagai PIC di satu section agar dapat menerima tiket dari antrean section tersebut.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="max-w-4xl mx-auto w-full flex flex-col gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8 flex flex-col gap-8">
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-1">
              <span className="w-1.5 h-4 rounded-full bg-blue-700"></span>
              <h2 className="text-sm font-bold uppercase tracking-tight text-blue-700">1. Pilih Karyawan</h2>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="cari-karyawan" className="text-sm font-semibold text-slate-700">Cari Karyawan <span className="text-rose-500">*</span></label>
              <div className="relative flex items-center">
                <Search className="absolute left-3.5 w-5 h-5 text-slate-400" />
                <input
                  id="cari-karyawan"
                  value={qInput}
                  onChange={(e) => setQInput(e.target.value)}
                  placeholder="Ketik nama, NIK, atau email karyawan..."
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 border border-slate-200 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
                />
              </div>
              {err.user_id ? <span className="text-xs text-rose-600 fx-reveal">{err.user_id}</span> : <span className="text-xs text-slate-500">Hanya karyawan aktif yang dapat dijadikan PIC. Karyawan yang sudah menjadi PIC tidak ditampilkan.</span>}
            </div>

            <div className={`rounded-xl border border-slate-200 overflow-hidden transition-opacity duration-300 ${memuat ? "opacity-60" : ""}`} aria-busy={memuat}>
              {error ? (
                <p className="p-4 text-xs text-rose-700 bg-rose-50" role="alert">{error}</p>
              ) : data === null ? (
                <div className="p-6 flex items-center justify-center gap-2 text-xs text-slate-500" role="status"><Loader2 className="w-4 h-4 animate-spin text-blue-600" /> Memuat karyawan...</div>
              ) : data.data.length === 0 ? (
                <div className="p-6 flex flex-col items-center gap-1 text-center"><Users className="w-6 h-6 text-slate-300" /><p className="text-xs text-slate-500">Tidak ada karyawan aktif yang cocok.</p></div>
              ) : (
                <ul className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {data.data.map((u) => {
                    const aktif = dipilih?.id === u.id;
                    return (
                      <li key={u.id}>
                        <button type="button" onClick={() => pilih(u)} aria-pressed={aktif} className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${aktif ? "bg-blue-50" : "hover:bg-slate-50"}`}>
                          <span className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${aktif ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-600"}`}>{aktif ? <UserCheck className="w-4 h-4" /> : initialsOf(u.name)}</span>
                          <span className="min-w-0 flex-1 leading-tight">
                            <span className="block text-sm font-semibold text-slate-900 truncate">{u.name}</span>
                            <span className="block text-xs text-slate-400 truncate">{u.nik ?? "—"} · {u.email}</span>
                          </span>
                          <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 rounded px-2 py-0.5 shrink-0">{u.bagian?.kode_bagian ?? "—"}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {dipilih && (
              <div className="bg-slate-50 rounded-xl p-4 flex flex-col gap-4 fx-reveal">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-700" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900">Data Karyawan Terpilih</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex flex-col justify-center bg-white p-3 rounded-lg shadow-sm sm:col-span-2">
                    <span className="text-xs text-slate-500">Nama Lengkap</span>
                    <span className="text-sm font-bold text-slate-900">{dipilih.name}</span>
                    <span className="text-xs text-slate-500">{dipilih.jabatan || "Karyawan"}</span>
                  </div>
                  <div className="flex flex-col justify-center bg-white p-3 rounded-lg shadow-sm">
                    <span className="text-xs text-slate-500">Nomor Induk (NIK)</span>
                    <span className="text-sm font-semibold text-slate-900 font-mono mt-0.5">{dipilih.nik ?? "—"}</span>
                  </div>
                  <div className="flex flex-col justify-center bg-white p-3 rounded-lg shadow-sm">
                    <span className="text-xs text-slate-500">Section Asal</span>
                    <span className="text-sm font-semibold text-slate-900">{dipilih.bagian?.nama_bagian ?? "—"}</span>
                  </div>
                  <div className="flex flex-col justify-center bg-white p-3 rounded-lg shadow-sm sm:col-span-2">
                    <span className="text-xs text-slate-500">Email Korporat</span>
                    <div className="flex items-center gap-1.5 text-slate-900 font-medium text-sm mt-0.5"><Mail className="w-4 h-4 text-slate-400" /> {dipilih.email}</div>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="flex flex-col gap-4 pt-1">
            <div className="flex items-center gap-2 pb-1">
              <span className="w-1.5 h-4 rounded-full bg-blue-700"></span>
              <h2 className="text-sm font-bold uppercase tracking-tight text-blue-700">2. Penugasan PIC</h2>
            </div>
            <div className="flex flex-col gap-1.5 max-w-md">
              <label htmlFor="section-pic" className="text-sm font-semibold text-slate-700">Section Penanggung Jawab <span className="text-rose-500">*</span></label>
              <div className="relative flex items-center">
                <Building2 className="absolute left-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
                <select
                  id="section-pic"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className={`w-full pl-11 pr-4 py-2.5 bg-slate-50 rounded-lg text-sm text-slate-900 border border-slate-200 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 appearance-none cursor-pointer ${err.id_bagian ? "!border-rose-400 !ring-4 !ring-rose-100" : ""}`}
                >
                  <option value="" disabled>Pilih section...</option>
                  {sections.map((s) => <option key={s.id} value={s.id}>{s.kode_bagian} · {s.nama_bagian}</option>)}
                </select>
              </div>
              {err.id_bagian ? <span className="text-xs text-rose-600 fx-reveal">{err.id_bagian}</span> : <span className="text-xs text-slate-500">PIC hanya menerima tiket yang ditujukan ke section ini. Satu PIC hanya satu section.</span>}
            </div>
          </section>

          <div className="bg-blue-50/60 rounded-xl p-4 flex items-start gap-3">
            <ShieldCheck className="w-8 h-8 text-blue-700 bg-blue-700/10 rounded-full p-1.5 shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Cara Kerja Antrean</span>
              <p className="text-sm text-slate-900">
                {dipilih && tujuan
                  ? <><strong>{dipilih.name}</strong> akan menjadi PIC di section <strong>{tujuan.nama_bagian}</strong> dan berbagi antrean dengan {tujuan.jumlah_pic ?? 0} PIC aktif lainnya. PIC pertama yang menerima tiket menjadi penanggung jawab.</>
                  : "Satu section boleh punya banyak PIC. Tiket baru masuk ke antrean bersama section, dan PIC pertama yang menerimanya menjadi penanggung jawab."}
              </p>
            </div>
          </div>

          <KotakGalat pesan={umum} />

          <div className="pt-2 flex items-center justify-between flex-wrap gap-4">
            <Link href="/admin/pic" className="px-5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium flex items-center gap-1.5 transition-colors">
              <ArrowLeft className="w-[18px] h-[18px]" /> Batal
            </Link>
            <button type="submit" disabled={proses} className="px-6 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold flex items-center gap-2 shadow-sm transition-all disabled:opacity-60">
              {proses ? "Menugaskan..." : "Simpan & Tugaskan"} {proses ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : <CheckCircle2 className="w-[18px] h-[18px]" />}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
