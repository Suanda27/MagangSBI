"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Hash, ShieldCheck, CheckCircle2, Lightbulb, Loader2 } from "lucide-react";
import { KotakGalat } from "@/components/admin/master-dialogs";
import { createLayanan, getKategoriLayanan, getSectionsAdmin, type SectionAdminApi } from "@/lib/api/admin";
import { toApiError } from "@/lib/api/errors";
import { setFlash } from "@/lib/admin/flash";

export default function TambahLayananPage() {
  const router = useRouter();
  const [kode, setKode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [section, setSection] = useState("");
  const [desc, setDesc] = useState("");
  const [status, setStatus] = useState<"Aktif" | "Nonaktif">("Aktif");
  const [sections, setSections] = useState<SectionAdminApi[]>([]);
  const [kategori, setKategori] = useState<string[]>([]);
  const [err, setErr] = useState<Record<string, string>>({});
  const [umum, setUmum] = useState<string | null>(null);
  const [proses, setProses] = useState(false);

  // Section aktif untuk pilihan tujuan, dan kategori yang sudah dipakai sebagai saran.
  useEffect(() => {
    getSectionsAdmin().then((d) => setSections(d.filter((x) => x.status === "aktif"))).catch(() => undefined);
    getKategoriLayanan().then(setKategori).catch(() => undefined);
  }, []);

  const sectionDipilih = sections.find((x) => String(x.id) === section);
  const salah = (k: string) => (err[k] ? "!border-rose-400 !ring-4 !ring-rose-100" : "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (proses) return;
    setUmum(null);

    const lokal: Record<string, string> = {};
    if (!kode.trim()) lokal.kode_layanan = "Kode layanan wajib diisi.";
    if (!name.trim()) lokal.nama_layanan = "Nama layanan wajib diisi.";
    if (!category.trim()) lokal.kategori = "Kategori wajib diisi.";
    if (!section) lokal.id_bagian = "Section tujuan wajib dipilih.";
    setErr(lokal);
    if (Object.keys(lokal).length) return;

    setProses(true);
    try {
      const baru = await createLayanan({
        kode_layanan: kode.trim(),
        nama_layanan: name.trim(),
        kategori: category.trim(),
        deskripsi: desc.trim() || null,
        id_bagian: Number(section),
        status: status === "Aktif" ? "aktif" : "nonaktif",
      });
      setFlash({ title: "Layanan ditambahkan", desc: `${baru.nama_layanan} (${baru.kode_layanan})` });
      router.push("/admin/layanan");
    } catch (e2) {
      const apiErr = toApiError(e2);
      if (apiErr.isValidation) {
        const ambil = (k: string) => (apiErr.errors[k]?.[0] ? { [k]: apiErr.errors[k][0] } : {});
        setErr({ ...ambil("kode_layanan"), ...ambil("nama_layanan"), ...ambil("kategori"), ...ambil("id_bagian"), ...ambil("deskripsi") });
      } else {
        setUmum(apiErr.message);
      }
      setProses(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <Link href="/admin/layanan" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Layanan
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tambah Layanan</h1>
        <p className="text-sm text-slate-500 mt-1">Tambahkan layanan baru yang dapat digunakan oleh karyawan.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Informasi Layanan</h2>
            <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">Draft Baru</span>
          </div>
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase">Kode Layanan <span className="text-rose-500">*</span></label>
                <div className="relative flex items-center">
                  <Hash className="absolute left-3 w-[18px] h-[18px] text-slate-400" />
                  <input value={kode} onChange={(e) => setKode(e.target.value.toUpperCase())} maxLength={20} placeholder="Contoh: GA-07" className={`w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 font-mono placeholder:text-slate-400 placeholder:font-sans focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${salah("kode_layanan")}`} />
                </div>
                {err.kode_layanan ? <span className="text-xs text-rose-600 fx-reveal">{err.kode_layanan}</span> : <span className="text-xs text-slate-400">Unik; huruf besar, angka, dan tanda hubung.</span>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase">Nama Layanan <span className="text-rose-500">*</span></label>
                <input value={name} onChange={(e) => setName(e.target.value)} maxLength={255} placeholder="Masukkan nama layanan" className={`w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${salah("nama_layanan")}`} />
                {err.nama_layanan && <span className="text-xs text-rose-600 fx-reveal">{err.nama_layanan}</span>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase">Kategori <span className="text-rose-500">*</span></label>
                <input value={category} onChange={(e) => setCategory(e.target.value)} maxLength={255} list="saran-kategori" placeholder="Pilih atau ketik kategori" className={`w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${salah("kategori")}`} />
                <datalist id="saran-kategori">{kategori.map((k) => <option key={k} value={k} />)}</datalist>
                {err.kategori && <span className="text-xs text-rose-600 fx-reveal">{err.kategori}</span>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase">Section <span className="text-rose-500">*</span></label>
                <select value={section} onChange={(e) => setSection(e.target.value)} className={`w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 appearance-none focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 cursor-pointer ${salah("id_bagian")}`}>
                  <option value="" disabled>-- Pilih Section PIC --</option>
                  {sections.map((x) => <option key={x.id} value={x.id}>{x.kode_bagian} · {x.nama_bagian}</option>)}
                </select>
                {err.id_bagian && <span className="text-xs text-rose-600 fx-reveal">{err.id_bagian}</span>}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-700 uppercase">Status Layanan <span className="text-rose-500">*</span></label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
                <button type="button" onClick={() => setStatus("Aktif")} className={`py-2 rounded flex items-center justify-center gap-2 text-xs font-semibold transition-colors ${status === "Aktif" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}>
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Aktif
                </button>
                <button type="button" onClick={() => setStatus("Nonaktif")} className={`py-2 rounded flex items-center justify-center gap-2 text-xs font-semibold transition-colors ${status === "Nonaktif" ? "bg-white text-slate-700 shadow-sm" : "text-slate-500"}`}>
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span> Nonaktif
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase">Deskripsi Layanan <span className="text-[11px] font-normal normal-case text-slate-400">(opsional)</span></label>
              <textarea value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={500} rows={4} placeholder="Masukkan deskripsi layanan secara lengkap..." className="w-full p-4 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-y" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Jelaskan cakupan servis, batasan wewenang, atau instruksi umum bagi pemohon.</span>
                <span className="text-xs text-slate-400">{desc.length} / 500 karakter</span>
              </div>
            </div>
          </div>
          {umum && <div className="px-6 pb-4"><KotakGalat pesan={umum} /></div>}
          <div className="px-6 py-4 bg-slate-50 flex items-center justify-between flex-wrap gap-3">
            <span className="text-xs text-slate-500 flex items-center gap-1"><span className="text-rose-500 font-bold">*</span> Bidang wajib diisi</span>
            <div className="flex items-center gap-3">
              <Link href="/admin/layanan" className="px-5 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium transition-all">Batal</Link>
              <button type="submit" disabled={proses} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-60">
                {proses ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : <CheckCircle2 className="w-[18px] h-[18px]" />} {proses ? "Menyimpan..." : "Simpan Layanan"}
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Preview Card</span>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${status === "Aktif" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status === "Aktif" ? "bg-emerald-500" : "bg-slate-400"}`}></span> {status}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="bg-slate-100 px-2 py-0.5 rounded font-mono text-slate-900 font-medium">{kode || "KODE"}</span>
              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold">{sectionDipilih?.kode_bagian ?? "-"}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 leading-tight">{name || "Nama Layanan"}</h3>
            <span className="text-xs text-slate-500 block mt-0.5">{category || "Kategori belum dipilih"}</span>
            <p className="text-sm text-slate-500 italic mt-2 line-clamp-3">{desc || "Deskripsi layanan akan tertera di sini saat Anda mengetik..."}</p>
          </div>

          <div className="bg-slate-50 rounded-xl p-5">
            <div className="flex items-center gap-2 text-slate-900 mb-3">
              <Lightbulb className="w-5 h-5 text-blue-700" />
              <h4 className="text-xs font-bold uppercase tracking-wider">Panduan Penamaan</h4>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-500">
              <li className="flex items-start gap-2"><ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" /> Gunakan kata kerja operasional spesifik, seperti Penggantian, Instalasi, Peminjaman.</li>
              <li className="flex items-start gap-2"><ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" /> Pastikan Section yang dipilih selaras dengan PIC spesialis terdaftar.</li>
              <li className="flex items-start gap-2"><ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" /> Layanan nonaktif tidak akan muncul pada dropdown formulir pengguna.</li>
            </ul>
          </div>
        </div>
      </form>
    </>
  );
}
