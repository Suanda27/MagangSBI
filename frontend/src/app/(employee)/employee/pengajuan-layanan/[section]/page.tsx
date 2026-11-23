"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  FileText,
  ImagePlus,
  Loader2,
  MapPin,
  Send,
  Trash2,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import PageHeader from "@/components/employee/page-header";
import SectionIcon from "@/components/employee/section-icon";
import { FLOORS, PLANTS, getSection } from "@/lib/employee-data";

const dl = (ms: number) => ({ "--delay": `${ms}ms` } as React.CSSProperties);

const MAX_DOC = 10 * 1024 * 1024;
const MAX_IMG = 5 * 1024 * 1024;
const DOC_EXT = ["pdf", "doc", "docx", "xls", "xlsx"];
const IMG_EXT = ["jpg", "jpeg", "png"];

const fieldCls =
  "w-full h-11 px-3.5 bg-white border rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-all duration-300 hover:border-slate-400";
const labelCls = "block text-[13px] font-semibold text-slate-700 mb-1.5";

function fmtSize(b: number) {
  return b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`;
}

export default function FormPermintaanPage() {
  const router = useRouter();
  const params = useParams<{ section: string }>();
  const section = getSection(params.section);

  const [form, setForm] = useState({ category: "", service: "", plant: "", floor: "", title: "", description: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photo, setPhoto] = useState<File | null>(null);
  const [doc, setDoc] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);

  if (!section) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <p className="text-sm font-medium text-slate-800">Departemen tidak ditemukan.</p>
        <Link href="/employee/pengajuan-layanan" className="mt-3 inline-block text-[13px] font-medium text-blue-700 hover:text-blue-900">
          Kembali memilih departemen
        </Link>
      </div>
    );
  }

  const services = section.categories.find((c) => c.name === form.category)?.services ?? [];

  const set = (k: string, v: string) => {
    setForm((p) => ({ ...p, [k]: v, ...(k === "category" ? { service: "" } : {}) }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: "" }));
  };

  const pickFile = (kind: "photo" | "doc", f?: File | null) => {
    if (!f) return;
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    const okExt = kind === "photo" ? IMG_EXT : DOC_EXT;
    const max = kind === "photo" ? MAX_IMG : MAX_DOC;
    if (!okExt.includes(ext)) {
      setFileError(`Format tidak didukung. Gunakan: ${okExt.join(", ").toUpperCase()}.`);
      return;
    }
    if (f.size > max) {
      setFileError(`Ukuran file melebihi batas ${kind === "photo" ? "5MB" : "10MB"}.`);
      return;
    }
    setFileError("");
    if (kind === "photo") setPhoto(f);
    else setDoc(f);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.category) e.category = "Silakan pilih kategori layanan.";
    if (!form.service) e.service = "Silakan pilih layanan.";
    if (!form.title.trim()) e.title = "Judul permintaan wajib diisi.";
    if (!form.description.trim()) e.description = "Deskripsi kebutuhan wajib diisi.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    // Simulasi POST /api/employee/permintaan
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => router.push("/employee/permintaan-saya"), 1400);
    }, 1000);
  };

  const err = (k: string) =>
    errors[k] ? (
      <p className="mt-1.5 text-xs text-red-600 font-medium animate-in fade-in slide-in-from-top-2 duration-300">{errors[k]}</p>
    ) : null;

  return (
    <>
      <PageHeader title={`Buat Permintaan - ${section.name}`} description="Langkah 2 dari 2: isi detail permintaan layanan sesuai kebutuhan Anda.">
        <Link
          href="/employee/pengajuan-layanan"
          className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-[13px] font-medium text-slate-700 hover:border-blue-200 hover:text-blue-900"
        >
          <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" />
          Ganti Departemen
        </Link>
      </PageHeader>

      <form onSubmit={submit} className="grid gap-6" noValidate>
        {/* Informasi permintaan */}
        <section className="fx-reveal rounded-xl border border-slate-200 bg-white shadow-sm" style={dl(80)}>
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                <SectionIcon name={section.icon} className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-[15px] font-semibold text-slate-900">Informasi Permintaan</h2>
                <p className="text-xs text-slate-500">Lengkapi kategori layanan dan rincian kebutuhan {section.short}.</p>
              </div>
            </div>
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-100">Wajib Diisi</span>
          </div>

          <div className="p-5 grid gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="category" className={labelCls}>Kategori Layanan <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select id="category" value={form.category} onChange={(e) => set("category", e.target.value)} className={`${fieldCls} appearance-none pr-10 ${errors.category ? "border-red-500" : "border-slate-300"}`}>
                    <option value="" disabled>Pilih kategori layanan...</option>
                    {section.categories.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                {err("category")}
              </div>
              <div>
                <label htmlFor="service" className={labelCls}>Layanan <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select id="service" value={form.service} disabled={!form.category} onChange={(e) => set("service", e.target.value)} className={`${fieldCls} appearance-none pr-10 disabled:bg-slate-50 disabled:cursor-not-allowed ${errors.service ? "border-red-500" : "border-slate-300"}`}>
                    <option value="" disabled>{form.category ? "Pilih jenis layanan..." : "Pilih kategori terlebih dahulu"}</option>
                    {services.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                {err("service")}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[13px] font-semibold text-slate-700">Lokasi (Plant &amp; Lantai)</span>
                <span className="text-[11px] text-slate-400">Opsional</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[
                  { k: "plant", label: "Plant", opts: PLANTS },
                  { k: "floor", label: "Lantai", opts: FLOORS },
                ].map(({ k, label, opts }) => (
                  <div className="relative" key={k}>
                    <select aria-label={label} value={form[k as "plant" | "floor"]} onChange={(e) => set(k, e.target.value)} className={`${fieldCls} appearance-none pr-10 border-slate-300`}>
                      <option value="">Pilih {label}</option>
                      {opts.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                ))}
              </div>
              {(form.plant || form.floor) && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 text-xs font-medium animate-in fade-in zoom-in-95 duration-300">
                  <MapPin className="w-3.5 h-3.5" />
                  Lokasi terpilih: {[form.plant, form.floor].filter(Boolean).join(" • ")}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="title" className={labelCls}>Judul Permintaan <span className="text-red-500">*</span></label>
              <input id="title" type="text" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Contoh: Permintaan perbaikan peralatan" className={`${fieldCls} ${errors.title ? "border-red-500" : "border-slate-300"}`} />
              {err("title")}
            </div>

            <div>
              <label htmlFor="description" className={labelCls}>Deskripsi Detail <span className="text-red-500">*</span></label>
              <textarea id="description" rows={5} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Jelaskan kebutuhan atau masalah yang Anda alami secara detail..." className={`${fieldCls} h-auto py-3 resize-y ${errors.description ? "border-red-500" : "border-slate-300"}`} />
              {err("description")}
            </div>
          </div>
        </section>

        {/* Lampiran */}
        <section className="fx-reveal rounded-xl border border-slate-200 bg-white shadow-sm" style={dl(180)}>
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900">Lampiran Pendukung</h2>
              <p className="text-xs text-slate-500">Lampirkan dokumen atau foto bukti kondisi untuk mempercepat penanganan.</p>
            </div>
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">Opsional</span>
          </div>

          <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Dokumen */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-semibold text-slate-700 inline-flex items-center gap-1.5"><FileText className="w-4 h-4 text-slate-400" />Unggah Dokumen</span>
                <span className="text-[11px] text-slate-400">Maks. 10MB</span>
              </div>
              <input ref={docRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" className="hidden" onChange={(e) => pickFile("doc", e.target.files?.[0])} />
              {doc ? (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 animate-in fade-in zoom-in-95 duration-300">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{doc.name}</p>
                    <p className="text-xs text-slate-500">{fmtSize(doc.size)} • Siap diunggah</p>
                  </div>
                  <button type="button" onClick={() => setDoc(null)} className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50" aria-label="Hapus dokumen"><Trash2 className="w-4 h-4" /></button>
                </div>
              ) : (
                <button type="button" onClick={() => docRef.current?.click()} className="group w-full rounded-lg border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/40 p-6 flex flex-col items-center text-center transition-all duration-300">
                  <UploadCloud className="w-8 h-8 text-slate-300 group-hover:text-blue-500 group-hover:-translate-y-1 transition-all duration-300" />
                  <p className="mt-2 text-[13px] text-slate-600"><span className="font-medium text-blue-700">Klik untuk mengunggah</span> dokumen</p>
                  <p className="text-[11px] text-slate-400 mt-1">PDF, DOC, DOCX, XLS, XLSX</p>
                </button>
              )}
            </div>

            {/* Foto */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-semibold text-slate-700 inline-flex items-center gap-1.5"><ImagePlus className="w-4 h-4 text-slate-400" />Unggah Foto / Bukti Kondisi</span>
                <span className="text-[11px] text-slate-400">JPG, PNG • Maks. 5MB</span>
              </div>
              <input ref={photoRef} type="file" accept=".jpg,.jpeg,.png" className="hidden" onChange={(e) => pickFile("photo", e.target.files?.[0])} />
              {photo ? (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={URL.createObjectURL(photo)} alt="Pratinjau foto" className="w-12 h-12 rounded-md object-cover border border-slate-200" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{photo.name}</p>
                      <p className="text-xs text-slate-500">{fmtSize(photo.size)} • Siap diunggah</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setPhoto(null)} className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50" aria-label="Hapus foto"><Trash2 className="w-4 h-4" /></button>
                </div>
              ) : (
                <button type="button" onClick={() => photoRef.current?.click()} className="group w-full rounded-lg border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/40 p-6 flex flex-col items-center text-center transition-all duration-300">
                  <ImagePlus className="w-8 h-8 text-slate-300 group-hover:text-blue-500 group-hover:-translate-y-1 transition-all duration-300" />
                  <p className="mt-2 text-[13px] text-slate-600"><span className="font-medium text-blue-700">Klik untuk menambah foto</span></p>
                  <p className="text-[11px] text-slate-400 mt-1">Disarankan untuk keluhan fasilitas atau kerusakan alat</p>
                </button>
              )}
            </div>
          </div>

          {fileError && (
            <div className="mx-5 mb-5 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="w-4 h-4 shrink-0" />{fileError}
            </div>
          )}
        </section>

        {/* Aksi */}
        <div className="fx-reveal flex flex-col-reverse sm:flex-row sm:justify-end gap-3" style={dl(280)}>
          <button type="button" onClick={() => router.push("/employee/pengajuan-layanan")} className="px-5 py-2.5 rounded-lg bg-white border border-slate-200 text-[13px] font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50">
            Batal
          </button>
          <button
            type="submit"
            disabled={isLoading || isSuccess}
            className={`group fx-shine inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-white text-[13px] font-medium shadow-sm transition-all duration-300 disabled:cursor-not-allowed ${
              isSuccess ? "bg-emerald-600" : "bg-gradient-to-r from-blue-800 to-blue-600 shadow-blue-800/30 hover:shadow-lg hover:-translate-y-0.5"
            }`}
          >
            {isSuccess ? (
              <><CheckCircle2 className="w-4 h-4" />Berhasil! Mengalihkan...</>
            ) : isLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Mengirim...</>
            ) : (
              <><Send className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />Ajukan Permintaan</>
            )}
          </button>
        </div>
      </form>
    </>
  );
}
