"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Ban, CheckCircle2, Layers, Loader2, Pencil, PlusCircle, RotateCcw, Search, TriangleAlert, Wrench } from "lucide-react";
import { CountUp } from "@/components/fx/motion";
import { Field, Toasts, inputCls, useToasts } from "@/components/admin/settings-ui";
import { FormDialog, KonfirmasiStatusMaster, type HasilAksi, type TargetStatusMaster } from "@/components/admin/master-dialogs";
import { EmptyState, StatCard } from "@/components/shared/display";
import { SelectField } from "@/components/shared/form-controls";
import { Pagination } from "@/components/shared/pagination";
import {
  getKategoriLayanan,
  getLayananAdmin,
  getSectionsAdmin,
  updateLayanan,
  type Halaman,
  type LayananAdminApi,
  type PayloadLayanan,
  type SectionAdminApi,
  type StatusMaster,
} from "@/lib/api/admin";
import { errorMessage, toApiError } from "@/lib/api/errors";
import { takeFlash } from "@/lib/admin/flash";

const PER_HALAMAN = 10;

const BADGE: Record<StatusMaster, string> = {
  aktif: "bg-emerald-50 text-emerald-700 border-emerald-200/50",
  nonaktif: "bg-slate-100 text-slate-600 border-slate-200",
};

function StatusBadge({ status }: { status: StatusMaster }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-medium ${BADGE[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === "aktif" ? "bg-emerald-500" : "bg-slate-400"}`} />
      {status === "aktif" ? "Aktif" : "Nonaktif"}
    </span>
  );
}

/** Pesan galat pertama per field bila 422, selain itu pesan umum. */
function keHasil(error: unknown): HasilAksi {
  const e = toApiError(error);
  return { ok: false, error: Object.values(e.errors)[0]?.[0] ?? e.message };
}

/** Hasil satu permintaan daftar; "memuat" bila kunci hasil berbeda dari kunci permintaan sekarang. */
type Muat = { kunci: string; data: Halaman<LayananAdminApi> | null; error: string | null };

export default function LayananPage() {
  const toast = useToasts();

  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [idBagian, setIdBagian] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [halaman, setHalaman] = useState(1);
  const [segar, setSegar] = useState(0); // naik setiap perubahan agar daftar dan angka dimuat ulang

  const [muat, setMuat] = useState<Muat>({ kunci: "", data: null, error: null });
  const [sections, setSections] = useState<SectionAdminApi[]>([]);
  const [kategori, setKategori] = useState<string[]>([]);
  const [angka, setAngka] = useState<{ total: number; aktif: number; nonaktif: number } | null>(null);

  const [ubah, setUbah] = useState<LayananAdminApi | null>(null);
  const [konfirmasi, setKonfirmasi] = useState<TargetStatusMaster | null>(null);

  // Pencarian ditunda sebentar supaya tidak memanggil server di setiap ketukan.
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(qInput.trim());
      setHalaman(1);
    }, 400);
    return () => clearTimeout(t);
  }, [qInput]);

  const kunci = JSON.stringify({ q, idBagian, filterStatus, halaman, segar });

  useEffect(() => {
    let batal = false;
    getLayananAdmin({
      q: q || undefined,
      id_bagian: idBagian ? Number(idBagian) : undefined,
      status: (filterStatus || undefined) as StatusMaster | undefined,
      per_page: PER_HALAMAN,
      page: halaman,
    })
      .then((data) => {
        if (!batal) setMuat({ kunci, data, error: null });
      })
      .catch((e) => {
        if (!batal) setMuat({ kunci, data: null, error: errorMessage(e, "Gagal memuat data layanan.") });
      });
    return () => {
      batal = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kunci]);

  // Daftar section (filter dan form) sekali saja; angka ringkasan dimuat ulang setelah perubahan.
  useEffect(() => {
    getSectionsAdmin().then(setSections).catch(() => undefined);
    getKategoriLayanan().then(setKategori).catch(() => undefined);
    const flash = takeFlash();
    if (flash) toast.push({ tone: "success", title: flash.title, desc: flash.desc });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let batal = false;
    Promise.all([getLayananAdmin({ per_page: 1 }), getLayananAdmin({ per_page: 1, status: "aktif" }), getLayananAdmin({ per_page: 1, status: "nonaktif" })])
      .then(([a, b, c]) => {
        if (!batal) setAngka({ total: a.meta.total, aktif: b.meta.total, nonaktif: c.meta.total });
      })
      .catch(() => undefined);
    return () => {
      batal = true;
    };
  }, [segar]);

  const memuat = muat.kunci !== kunci;
  const data = muat.data;
  const filterAktif = qInput !== "" || idBagian !== "" || filterStatus !== "";
  const sectionAktif = useMemo(() => sections.filter((s) => s.status === "aktif"), [sections]);

  const mintaStatus = (l: LayananAdminApi, ke: StatusMaster) =>
    setKonfirmasi({
      jenis: "Layanan",
      nama: l.nama_layanan,
      ke,
      dampakNonaktif: "Layanan ini tidak muncul lagi pada form pengajuan karyawan. Tiket yang sedang berjalan tidak terpengaruh, dan layanan dapat diaktifkan kembali kapan saja. Layanan tidak dihapus.",
      dampakAktif: "Layanan ini muncul kembali pada form pengajuan karyawan.",
      jalankan: async () => {
        try {
          await updateLayanan(l.id, { status: ke });
          setSegar((n) => n + 1);
          toast.push({ tone: "success", title: ke === "nonaktif" ? "Layanan dinonaktifkan" : "Layanan diaktifkan", desc: `${l.nama_layanan} (${l.kode_layanan})` });
          return { ok: true };
        } catch (e) {
          return keHasil(e);
        }
      },
    });

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 tracking-wider uppercase mb-1">
            <span>Master Data</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 font-medium">Konfigurasi Katalog Layanan</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Semua Layanan</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola seluruh layanan internal untuk karyawan dan konfigurasi penugasan operasional.</p>
        </div>
        <Link href="/admin/layanan/tambah" className="px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg flex items-center gap-2 shadow-sm transition-all hover:-translate-y-0.5 shrink-0">
          <PlusCircle className="w-4 h-4" />
          Tambah Layanan
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Layanan" value={<CountUp value={angka?.total ?? 0} />} hint={`Tersebar di ${sections.length} section`} icon={Wrench} tone="blue" />
        <StatCard label="Layanan Aktif" value={<CountUp value={angka?.aktif ?? 0} delay={80} />} hint="Tampil di formulir pengajuan" icon={CheckCircle2} tone="emerald" />
        <StatCard label="Layanan Nonaktif" value={<CountUp value={angka?.nonaktif ?? 0} delay={160} />} hint="Arsip, tidak tampil di formulir" icon={Ban} tone="slate" />
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="Cari nama atau kode layanan..."
            aria-label="Cari layanan"
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
          />
        </div>
        <SelectField
          label="Section"
          value={idBagian}
          onChange={(v) => {
            setIdBagian(v);
            setHalaman(1);
          }}
          options={[{ value: "", label: "Semua Section" }, ...sections.map((s) => ({ value: String(s.id), label: `${s.kode_bagian} · ${s.nama_bagian}` }))]}
        />
        <SelectField
          label="Status"
          value={filterStatus}
          onChange={(v) => {
            setFilterStatus(v);
            setHalaman(1);
          }}
          options={[{ value: "", label: "Semua Status" }, { value: "aktif", label: "Aktif" }, { value: "nonaktif", label: "Nonaktif" }]}
        />
        <button
          onClick={() => {
            setQInput("");
            setQ("");
            setIdBagian("");
            setFilterStatus("");
            setHalaman(1);
          }}
          disabled={!filterAktif}
          className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium text-slate-500 hover:text-blue-700 disabled:opacity-40 disabled:hover:text-slate-500 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {muat.error && !memuat ? (
          <div className="py-14 px-6 flex flex-col items-center text-center gap-3" role="alert">
            <span className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center"><TriangleAlert className="w-6 h-6" /></span>
            <h3 className="text-sm font-semibold text-slate-900">Data layanan tidak dapat dimuat</h3>
            <p className="text-xs text-slate-500 max-w-sm">{muat.error}</p>
            <button onClick={() => setSegar((n) => n + 1)} className="px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-colors">Coba Lagi</button>
          </div>
        ) : data === null ? (
          <div className="py-20 flex items-center justify-center gap-3 text-sm text-slate-500" role="status" aria-live="polite">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> Memuat data layanan...
          </div>
        ) : data.data.length === 0 ? (
          <EmptyState icon={Wrench} title={filterAktif ? "Tidak ada hasil" : "Belum ada layanan"} desc={filterAktif ? "Coba ubah kata kunci atau reset filter." : "Tambahkan layanan pertama untuk mengisi katalog."} />
        ) : (
          <div className={`overflow-x-auto transition-opacity duration-300 ${memuat ? "opacity-50" : ""}`} aria-busy={memuat}>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                <tr>
                  <th className="py-3.5 px-5">Nama Layanan</th>
                  <th className="py-3.5 px-4">Kategori</th>
                  <th className="py-3.5 px-4 text-center">Section</th>
                  <th className="py-3.5 px-4 max-w-xs">Deskripsi</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {data.data.map((l) => (
                  <tr key={l.id} className={`hover:bg-slate-50 transition-colors ${l.status === "nonaktif" ? "opacity-70" : ""}`}>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${l.status === "aktif" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
                          <Wrench className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{l.nama_layanan}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{l.kode_layanan}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{l.kategori}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/60" title={l.bagian?.nama_bagian}>
                        <Layers className="w-3 h-3 text-slate-400" /> {l.bagian?.kode_bagian ?? "-"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-500" title={l.deskripsi ?? undefined}>{l.deskripsi || "—"}</td>
                    <td className="py-3.5 px-4 text-center"><StatusBadge status={l.status} /></td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => setUbah(l)} className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors" title="Ubah layanan" aria-label={`Ubah ${l.nama_layanan}`}>
                          <Pencil className="w-4 h-4" />
                        </button>
                        {l.status === "aktif" ? (
                          <button onClick={() => mintaStatus(l, "nonaktif")} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors" title="Nonaktifkan" aria-label={`Nonaktifkan ${l.nama_layanan}`}>
                            <Ban className="w-4 h-4" />
                          </button>
                        ) : (
                          <button onClick={() => mintaStatus(l, "aktif")} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors" title="Aktifkan" aria-label={`Aktifkan ${l.nama_layanan}`}>
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && data.data.length > 0 && <Pagination page={data.meta.current_page} perPage={data.meta.per_page} total={data.meta.total} onPage={setHalaman} noun="layanan" />}
      </div>

      <FormUbahLayanan
        layanan={ubah}
        sectionAktif={sectionAktif}
        kategori={kategori}
        onClose={() => setUbah(null)}
        onSimpan={async (id, payload) => {
          try {
            await updateLayanan(id, payload);
            setSegar((n) => n + 1);
            toast.push({ tone: "success", title: "Layanan diperbarui", desc: payload.nama_layanan });
            return { ok: true };
          } catch (e) {
            return keHasil(e);
          }
        }}
      />
      <KonfirmasiStatusMaster target={konfirmasi} onClose={() => setKonfirmasi(null)} />

      <Toasts items={toast.items} dismiss={toast.dismiss} />
    </>
  );
}

interface FormUbahProps {
  layanan: LayananAdminApi | null;
  sectionAktif: SectionAdminApi[];
  kategori: string[];
  onClose: () => void;
  onSimpan: (id: number, payload: PayloadLayanan) => Promise<HasilAksi>;
}

function FormUbahLayanan({ layanan, ...rest }: FormUbahProps) {
  // Dipasang ulang per layanan (key) agar isian selalu mulai dari data terbaru.
  if (!layanan) return null;
  return <IsiFormUbah key={layanan.id} layanan={layanan} {...rest} />;
}

function IsiFormUbah({ layanan, sectionAktif, kategori, onClose, onSimpan }: Omit<FormUbahProps, "layanan"> & { layanan: LayananAdminApi }) {
  const [kode, setKode] = useState(layanan.kode_layanan);
  const [nama, setNama] = useState(layanan.nama_layanan);
  const [kat, setKat] = useState(layanan.kategori);
  const [deskripsi, setDeskripsi] = useState(layanan.deskripsi ?? "");
  const [idBagian, setIdBagian] = useState(String(layanan.bagian?.id ?? ""));

  // Section saat ini tetap tampil walau sudah nonaktif; pilihan lain hanya section aktif.
  const opsiSection = useMemo(() => {
    const saatIni = layanan.bagian && !sectionAktif.some((s) => s.id === layanan.bagian!.id) ? [{ id: layanan.bagian.id, label: `${layanan.bagian.kode_bagian} · ${layanan.bagian.nama_bagian} (nonaktif)` }] : [];
    return [...saatIni, ...sectionAktif.map((s) => ({ id: s.id, label: `${s.kode_bagian} · ${s.nama_bagian}` }))];
  }, [layanan.bagian, sectionAktif]);

  return (
    <FormDialog
      open
      icon={Pencil}
      title="Ubah Layanan"
      submitLabel="Simpan Perubahan"
      onClose={onClose}
      maxWidth="max-w-xl"
      onSubmit={async () => {
        if (!nama.trim() || !kat.trim() || !kode.trim()) return { ok: false, error: "Kode, nama, dan kategori layanan wajib diisi." };
        return onSimpan(layanan.id, { kode_layanan: kode.trim(), nama_layanan: nama.trim(), kategori: kat.trim(), deskripsi: deskripsi.trim() || null, id_bagian: Number(idBagian) });
      }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Kode Layanan" required hint="Huruf besar, angka, tanda hubung.">
          <input value={kode} onChange={(e) => setKode(e.target.value.toUpperCase())} maxLength={20} className={`${inputCls} font-mono`} />
        </Field>
        <Field label="Section" required hint="Menentukan section tujuan tiket baru.">
          <select value={idBagian} onChange={(e) => setIdBagian(e.target.value)} className={`${inputCls} cursor-pointer`}>
            {opsiSection.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </Field>
        <Field label="Nama Layanan" required className="sm:col-span-2">
          <input value={nama} onChange={(e) => setNama(e.target.value)} maxLength={255} autoFocus className={inputCls} />
        </Field>
        <Field label="Kategori" required className="sm:col-span-2" hint="Pilih dari saran atau ketik kategori baru.">
          <input value={kat} onChange={(e) => setKat(e.target.value)} maxLength={255} list="saran-kategori-ubah" className={inputCls} />
          <datalist id="saran-kategori-ubah">{kategori.map((k) => <option key={k} value={k} />)}</datalist>
        </Field>
        <Field label="Deskripsi" className="sm:col-span-2" hint="Opsional.">
          <textarea value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} maxLength={1000} rows={3} className={`${inputCls} resize-y`} />
        </Field>
      </div>
    </FormDialog>
  );
}
