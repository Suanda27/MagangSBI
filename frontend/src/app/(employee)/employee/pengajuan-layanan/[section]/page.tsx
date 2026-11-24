"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  FileText,
  Loader2,
  MapPin,
  Send,
  Trash2,
  UploadCloud,
} from "lucide-react";
import PageHeader from "@/components/employee/page-header";
import SectionIcon from "@/components/employee/section-icon";
import { getSections } from "@/lib/api/auth";
import { toApiError } from "@/lib/api/errors";
import { buatPermintaan, getAturanLampiran, getLayanan, getLokasi } from "@/lib/api/pengajuan";
import type { AturanLampiran, KategoriLayanan, Plant, Prioritas, Section } from "@/lib/api/types";
import { ikonSection } from "@/lib/section-meta";

const dl = (ms: number) => ({ "--delay": `${ms}ms` } as React.CSSProperties);

const fieldCls =
  "w-full h-11 px-3.5 bg-white border rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-all duration-300 hover:border-slate-400";
const labelCls = "block text-[13px] font-semibold text-slate-700 mb-1.5";

const URGENSI: { value: Prioritas; label: string; hint: string }[] = [
  { value: "normal", label: "Normal", hint: "Kebutuhan biasa" },
  { value: "tinggi", label: "Tinggi", hint: "Perlu segera" },
  { value: "mendesak", label: "Mendesak", hint: "Mengganggu pekerjaan" },
];

function fmtSize(b: number) {
  return b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`;
}

interface Referensi {
  section: Section;
  kategori: KategoriLayanan[];
  plants: Plant[];
  aturan: AturanLampiran;
}

const FORM_AWAL = { category: "", service: "", plant: "", floor: "", detail: "", priority: "normal" as Prioritas, title: "", description: "" };

export default function FormPermintaanPage() {
  const router = useRouter();
  const params = useParams<{ section: string }>();
  const kode = (params.section ?? "").toUpperCase();

  const [ref, setRef] = useState<Referensi | null>(null);
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState(FORM_AWAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [kodeTiket, setKodeTiket] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Muat section, layanan, lokasi, dan aturan lampiran dari server.
  useEffect(() => {
    let dibatalkan = false;
    (async () => {
      try {
        const sections = await getSections();
        const section = sections.find((s) => s.kode_bagian.toUpperCase() === kode);
        if (!section) {
          if (!dibatalkan) setLoadError("Departemen tidak ditemukan.");
          return;
        }
        const [kategori, plants, aturan] = await Promise.all([getLayanan(section.id), getLokasi(), getAturanLampiran()]);
        if (!dibatalkan) setRef({ section, kategori, plants, aturan });
      } catch (err) {
        if (!dibatalkan) setLoadError(toApiError(err).message);
      }
    })();
    return () => {
      dibatalkan = true;
    };
  }, [kode]);

  if (loadError) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <p className="text-sm font-medium text-slate-800">{loadError}</p>
        <Link href="/employee/pengajuan-layanan" className="mt-3 inline-block text-[13px] font-medium text-blue-700 hover:text-blue-900">
          Kembali memilih departemen
        </Link>
      </div>
    );
  }

  if (!ref) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        Memuat formulir...
      </div>
    );
  }

  const { section, kategori, plants, aturan } = ref;
  const layananDipilih = kategori.find((k) => k.kategori === form.category)?.layanan ?? [];
  const lantaiDipilih = plants.find((p) => String(p.id) === form.plant)?.lantais ?? [];
  const namaPlant = plants.find((p) => String(p.id) === form.plant)?.nama_plant;
  const namaLantai = lantaiDipilih.find((l) => String(l.id) === form.floor)?.nama_lantai;
  const formatLabel = aturan.format.map((f) => f.toUpperCase()).join(", ");

  const set = (k: string, v: string) => {
    setForm((p) => ({
      ...p,
      [k]: v,
      ...(k === "category" ? { service: "" } : {}),
      ...(k === "plant" ? { floor: "" } : {}),
    }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: "" }));
  };

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const next = [...files];
    const batasByte = aturan.maks_ukuran_mb * 1024 * 1024;
    let pesan = "";

    for (const f of Array.from(list)) {
      const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
      const diizinkan = aturan.format.includes(ext) || (ext === "jpeg" && aturan.format.includes("jpg"));
      if (!diizinkan) {
        pesan = `"${f.name}" tidak didukung. Format yang diizinkan: ${formatLabel}.`;
      } else if (f.size > batasByte) {
        pesan = `"${f.name}" melebihi batas ${aturan.maks_ukuran_mb} MB.`;
      } else if (next.some((x) => x.name === f.name && x.size === f.size)) {
        pesan = `"${f.name}" sudah ditambahkan.`;
      } else if (next.length >= aturan.maks_berkas) {
        pesan = `Maksimal ${aturan.maks_berkas} berkas per permintaan.`;
      } else {
        next.push(f);
      }
    }

    setFiles(next);
    setFileError(pesan);
    if (fileRef.current) fileRef.current.value = ""; // izinkan memilih berkas yang sama lagi
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.category) e.category = "Silakan pilih kategori layanan.";
    if (!form.service) e.service = "Silakan pilih layanan.";
    if (!form.plant) e.plant = "Silakan pilih plant.";
    if (!form.floor) e.floor = "Silakan pilih lantai.";
    if (!form.title.trim()) e.title = "Judul permintaan wajib diisi.";
    else if (form.title.trim().length > 150) e.title = "Judul maksimal 150 karakter.";
    if (!form.description.trim()) e.description = "Deskripsi kebutuhan wajib diisi.";
    else if (form.description.trim().length < 10) e.description = "Deskripsi minimal 10 karakter.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setGeneralError("");
    if (!validate()) {
      setGeneralError("Mohon periksa kembali kolom formulir yang belum sesuai.");
      return;
    }

    setIsLoading(true);
    try {
      const tiket = await buatPermintaan({
        id_layanan: Number(form.service),
        id_plant: Number(form.plant),
        id_lantai: Number(form.floor),
        lokasi_detail: form.detail,
        judul: form.title,
        deskripsi: form.description,
        prioritas: form.priority,
        lampiran: files,
      });
      setKodeTiket(tiket.kode_tiket);
      setTimeout(() => router.push("/employee/permintaan-saya"), 2200);
    } catch (err) {
      const e = toApiError(err);
      if (e.isValidation) {
        const peta: Record<string, string> = {};
        const pesan = e.errors;
        if (pesan.id_layanan?.[0]) peta.service = pesan.id_layanan[0];
        if (pesan.id_plant?.[0]) peta.plant = pesan.id_plant[0];
        if (pesan.id_lantai?.[0]) peta.floor = pesan.id_lantai[0];
        if (pesan.judul?.[0]) peta.title = pesan.judul[0];
        if (pesan.deskripsi?.[0]) peta.description = pesan.deskripsi[0];
        if (pesan.prioritas?.[0]) peta.priority = pesan.prioritas[0];
        const lampiran = Object.entries(pesan).find(([k]) => k.startsWith("lampiran"));
        if (lampiran?.[1]?.[0]) setFileError(lampiran[1][0]);
        setErrors(peta);
        setGeneralError("Mohon periksa kembali kolom formulir yang belum sesuai.");
      } else {
        setGeneralError(e.message);
      }
      setIsLoading(false);
    }
  };

  const err = (k: string) =>
    errors[k] ? (
      <p className="mt-1.5 text-xs text-red-600 font-medium animate-in fade-in slide-in-from-top-2 duration-300">{errors[k]}</p>
    ) : null;

  const isSuccess = kodeTiket !== "";

  return (
    <>
      <PageHeader title={`Buat Permintaan - ${section.nama_bagian}`} description="Langkah 2 dari 2: isi detail permintaan layanan sesuai kebutuhan Anda.">
        <Link
          href="/employee/pengajuan-layanan"
          className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-[13px] font-medium text-slate-700 hover:border-blue-200 hover:text-blue-900"
        >
          <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" />
          Ganti Departemen
        </Link>
      </PageHeader>

      {isSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 animate-in fade-in zoom-in-95 duration-300" role="status">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">Permintaan berhasil diajukan</p>
            <p className="text-xs text-emerald-700 mt-0.5">
              Nomor tiket Anda: <span className="font-semibold">{kodeTiket}</span>. Mengalihkan ke daftar permintaan...
            </p>
          </div>
        </div>
      )}

      {generalError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700 animate-in fade-in slide-in-from-top-2 duration-300" role="alert">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {generalError}
        </div>
      )}

      <form onSubmit={submit} className="grid gap-6" noValidate>
        {/* Informasi permintaan */}
        <section className="fx-reveal rounded-xl border border-slate-200 bg-white shadow-sm" style={dl(80)}>
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                <SectionIcon name={ikonSection(section.kode_bagian)} className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-[15px] font-semibold text-slate-900">Informasi Permintaan</h2>
                <p className="text-xs text-slate-500">Lengkapi kategori layanan dan rincian kebutuhan {section.kode_bagian}.</p>
              </div>
            </div>
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-100">Wajib Diisi</span>
          </div>

          <div className="p-5 grid gap-5">
            {kategori.length === 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                Belum ada layanan aktif untuk departemen ini. Silakan pilih departemen lain atau hubungi Admin.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="category" className={labelCls}>Kategori Layanan <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select id="category" value={form.category} onChange={(e) => set("category", e.target.value)} className={`${fieldCls} appearance-none pr-10 ${errors.category ? "border-red-500" : "border-slate-300"}`}>
                    <option value="" disabled>Pilih kategori layanan...</option>
                    {kategori.map((k) => <option key={k.kategori} value={k.kategori}>{k.kategori}</option>)}
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
                    {layananDipilih.map((s) => <option key={s.id} value={s.id}>{s.nama_layanan}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                {err("service")}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[13px] font-semibold text-slate-700">Lokasi (Plant &amp; Lantai) <span className="text-red-500">*</span></span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <div className="relative">
                    <select aria-label="Plant" value={form.plant} onChange={(e) => set("plant", e.target.value)} className={`${fieldCls} appearance-none pr-10 ${errors.plant ? "border-red-500" : "border-slate-300"}`}>
                      <option value="" disabled>Pilih Plant</option>
                      {plants.map((p) => <option key={p.id} value={p.id}>{p.nama_plant}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                  {err("plant")}
                </div>
                <div>
                  <div className="relative">
                    <select aria-label="Lantai" value={form.floor} disabled={!form.plant} onChange={(e) => set("floor", e.target.value)} className={`${fieldCls} appearance-none pr-10 disabled:bg-slate-50 disabled:cursor-not-allowed ${errors.floor ? "border-red-500" : "border-slate-300"}`}>
                      <option value="" disabled>{form.plant ? "Pilih Lantai" : "Pilih plant terlebih dahulu"}</option>
                      {lantaiDipilih.map((l) => <option key={l.id} value={l.id}>{l.nama_lantai}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                  {err("floor")}
                </div>
              </div>
              {(namaPlant || namaLantai) && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 text-xs font-medium animate-in fade-in zoom-in-95 duration-300">
                  <MapPin className="w-3.5 h-3.5" />
                  Lokasi terpilih: {[namaPlant, namaLantai].filter(Boolean).join(" • ")}
                </div>
              )}
              <div className="mt-4">
                <label htmlFor="detail" className={labelCls}>Detail Lokasi <span className="text-[11px] font-normal text-slate-400">(opsional)</span></label>
                <input id="detail" type="text" maxLength={255} value={form.detail} onChange={(e) => set("detail", e.target.value)} placeholder="Contoh: Dekat pantry, ruang meeting B" className={`${fieldCls} border-slate-300`} />
              </div>
            </div>

            <div>
              <span className={labelCls}>Urgensi <span className="text-red-500">*</span></span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" role="radiogroup" aria-label="Urgensi">
                {URGENSI.map((u) => {
                  const aktif = form.priority === u.value;
                  return (
                    <button
                      key={u.value}
                      type="button"
                      role="radio"
                      aria-checked={aktif}
                      onClick={() => set("priority", u.value)}
                      className={`text-left rounded-lg border px-3.5 py-2.5 transition-all duration-300 hover:-translate-y-0.5 ${
                        aktif ? "border-blue-600 bg-blue-50/60 ring-4 ring-blue-100" : "border-slate-300 bg-white hover:border-blue-300"
                      }`}
                    >
                      <span className="block text-[13px] font-semibold text-slate-900">{u.label}</span>
                      <span className="block text-[11px] text-slate-500">{u.hint}</span>
                    </button>
                  );
                })}
              </div>
              {err("priority")}
            </div>

            <div>
              <label htmlFor="title" className={labelCls}>Judul Permintaan <span className="text-red-500">*</span></label>
              <input id="title" type="text" maxLength={150} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Contoh: Permintaan perbaikan peralatan" className={`${fieldCls} ${errors.title ? "border-red-500" : "border-slate-300"}`} />
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

          <div className="p-5 grid gap-4">
            <input
              ref={fileRef}
              type="file"
              multiple
              accept={aturan.format.map((f) => `.${f}`).join(",")}
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
            <button
              type="button"
              disabled={files.length >= aturan.maks_berkas}
              onClick={() => fileRef.current?.click()}
              className="group w-full rounded-lg border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/40 p-6 flex flex-col items-center text-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UploadCloud className="w-8 h-8 text-slate-300 group-hover:text-blue-500 group-hover:-translate-y-1 transition-all duration-300" />
              <p className="mt-2 text-[13px] text-slate-600"><span className="font-medium text-blue-700">Klik untuk memilih berkas</span></p>
              <p className="text-[11px] text-slate-400 mt-1">
                {formatLabel} • Maks. {aturan.maks_ukuran_mb} MB per berkas • Maks. {aturan.maks_berkas} berkas
              </p>
            </button>

            {files.length > 0 && (
              <ul className="grid gap-2">
                {files.map((f) => (
                  <li key={`${f.name}-${f.size}`} className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{f.name}</p>
                        <p className="text-xs text-slate-500">{fmtSize(f.size)} • Siap diunggah</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setFiles(files.filter((x) => x !== f))} className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50" aria-label={`Hapus ${f.name}`}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
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
            disabled={isLoading || isSuccess || kategori.length === 0}
            className={`group fx-shine inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-white text-[13px] font-medium shadow-sm transition-all duration-300 disabled:cursor-not-allowed ${
              isSuccess ? "bg-emerald-600" : "bg-gradient-to-r from-blue-800 to-blue-600 shadow-blue-800/30 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60"
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
