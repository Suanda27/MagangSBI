"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Hash, ShieldCheck, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { KotakGalat } from "@/components/admin/master-dialogs";
import { createSection } from "@/lib/api/admin";
import { toApiError } from "@/lib/api/errors";
import { setFlash } from "@/lib/admin/flash";

export default function TambahSectionPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [desc, setDesc] = useState("");
  const [status, setStatus] = useState<"aktif" | "nonaktif">("aktif");
  const [err, setErr] = useState<Record<string, string>>({});
  const [umum, setUmum] = useState<string | null>(null);
  const [proses, setProses] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (proses) return;
    setUmum(null);

    const lokal: Record<string, string> = {};
    if (!name.trim()) lokal.nama_bagian = "Nama section wajib diisi.";
    if (code.length < 2) lokal.kode_bagian = "Kode section 2–10 huruf, contoh: QA.";
    setErr(lokal);
    if (Object.keys(lokal).length) return;

    setProses(true);
    try {
      const baru = await createSection({ kode_bagian: code, nama_bagian: name.trim(), deskripsi: desc.trim() || null, status });
      setFlash({ title: "Section ditambahkan", desc: `${baru.nama_bagian} (${baru.kode_bagian})` });
      router.push("/admin/section");
    } catch (e2) {
      const apiErr = toApiError(e2);
      if (apiErr.isValidation) {
        setErr({
          ...(apiErr.errors.nama_bagian?.[0] ? { nama_bagian: apiErr.errors.nama_bagian[0] } : {}),
          ...(apiErr.errors.kode_bagian?.[0] ? { kode_bagian: apiErr.errors.kode_bagian[0] } : {}),
          ...(apiErr.errors.deskripsi?.[0] ? { deskripsi: apiErr.errors.deskripsi[0] } : {}),
        });
      } else {
        setUmum(apiErr.message);
      }
      setProses(false);
    }
  }

  const salah = (k: string) => (err[k] ? "!border-rose-400 !ring-4 !ring-rose-100" : "");

  return (
    <>
      <Link href="/admin/section" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Section
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tambah Section</h1>
        <p className="text-sm text-slate-500 mt-1">Tambahkan section baru untuk penataan struktur organisasi internal.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="max-w-3xl mx-auto w-full flex flex-col gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-blue-800 via-blue-600 to-blue-200"></div>
          <div className="p-6 md:p-8 flex flex-col gap-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700 shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-blue-700 font-bold">Informasi Section</span>
                <p className="text-xs text-slate-500 mt-0.5">Identitas utama section untuk pengelompokan layanan dan penempatan karyawan.</p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700">Nama Section <span className="text-rose-500">*</span></label>
                <span className="text-xs text-slate-400">Maks. 60 karakter</span>
              </div>
              <div className="relative flex items-center">
                <Building2 className="absolute left-3 w-[18px] h-[18px] text-slate-400" />
                <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Masukkan nama section (misal: Quality Assurance)" className={`w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${salah("nama_bagian")}`} />
              </div>
              {err.nama_bagian ? <span className="text-xs text-rose-600 fx-reveal">{err.nama_bagian}</span> : <span className="text-xs text-slate-400">Nama resmi unit atau departemen kerja internal.</span>}
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700">Kode Section <span className="text-rose-500">*</span></label>
                <span className="text-xs text-slate-400">{code.length}/10 Karakter Kapital</span>
              </div>
              <div className="relative flex items-center">
                <Hash className="absolute left-3 w-[18px] h-[18px] text-slate-400" />
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
                  maxLength={10}
                  placeholder="Contoh: QA / ASM"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 uppercase tracking-wider placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${salah("kode_bagian")}`}
                />
              </div>
              {err.kode_bagian ? <span className="text-xs text-rose-600 fx-reveal">{err.kode_bagian}</span> : <span className="text-xs text-slate-400">Kode unik section (2-10 huruf kapital). Dipakai pada nomor tiket, jadi tidak dapat diubah setelah dibuat.</span>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">Deskripsi <span className="text-xs font-normal text-slate-400">(opsional)</span></label>
              <textarea value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={1000} rows={3} placeholder="Ringkas tugas atau cakupan section ini..." className={`w-full p-3 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-y ${salah("deskripsi")}`} />
              {err.deskripsi && <span className="text-xs text-rose-600 fx-reveal">{err.deskripsi}</span>}
            </div>

            <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-slate-50">
              <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0" />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-900">Validasi Integritas Sistem</span>
                <p className="text-xs text-slate-500 mt-0.5">Kode dan nama section harus unik di seluruh sistem, baik yang aktif maupun nonaktif. Server memeriksanya saat Anda menyimpan.</p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">Status Section</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className={`flex flex-col p-4 rounded-xl cursor-pointer transition-all border ${status === "aktif" ? "border-blue-600 bg-blue-50/50 shadow-sm" : "border-slate-200 bg-slate-50 hover:bg-slate-100"}`}>
                  <input type="radio" name="status" value="aktif" checked={status === "aktif"} onChange={() => setStatus("aktif")} className="sr-only" />
                  <span className="text-sm font-semibold text-slate-900">Aktif</span>
                  <span className="text-xs text-slate-500 mt-1">Dapat digunakan untuk data karyawan dan layanan baru.</span>
                </label>
                <label className={`flex flex-col p-4 rounded-xl cursor-pointer transition-all border ${status === "nonaktif" ? "border-blue-600 bg-blue-50/50 shadow-sm" : "border-slate-200 bg-slate-50 hover:bg-slate-100"}`}>
                  <input type="radio" name="status" value="nonaktif" checked={status === "nonaktif"} onChange={() => setStatus("nonaktif")} className="sr-only" />
                  <span className="text-sm font-semibold text-slate-900">Nonaktif</span>
                  <span className="text-xs text-slate-500 mt-1">Disimpan sebagai draf, tidak tampil pada dropdown permohonan.</span>
                </label>
              </div>
            </div>

            <KotakGalat pesan={umum} />

            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
              <Link href="/admin/section" className="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium text-center">Batal</Link>
              <button type="submit" disabled={proses} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-60">
                {proses ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : <CheckCircle2 className="w-[18px] h-[18px]" />} {proses ? "Menyimpan..." : "Simpan Section"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}
