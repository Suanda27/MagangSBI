"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRightLeft, Ban, BarChart3, CheckCircle2, Eye, Layers, Loader2, PlusCircle, RotateCcw, Search, ShieldCheck, TriangleAlert, UserMinus, Users } from "lucide-react";
import { CountUp } from "@/components/fx/motion";
import { Field, Toasts, inputCls, useToasts } from "@/components/admin/settings-ui";
import { FormDialog, KonfirmasiAksi, KonfirmasiStatusMaster, type TargetAksi, type TargetStatusMaster } from "@/components/admin/master-dialogs";
import { EmptyState, StatCard } from "@/components/shared/display";
import { SelectField } from "@/components/shared/form-controls";
import { Pagination } from "@/components/shared/pagination";
import { deletePicMapping, getPicMapping, getSectionsAdmin, updatePicMapping, updateUser, type PicMappingApi, type SectionAdminApi, type StatusMaster } from "@/lib/api/admin";
import { initialsOf } from "@/lib/auth/user-display";
import { takeFlash } from "@/lib/admin/flash";
import { keHasil } from "@/lib/admin/pengguna";
import { useDaftar, useDebounced } from "@/lib/admin/use-daftar";

const PER_HALAMAN = 10;

export default function PicPage() {
  const toast = useToasts();

  const [qInput, setQInput] = useState("");
  const q = useDebounced(qInput.trim());
  const [idBagian, setIdBagian] = useState("");
  const [status, setStatus] = useState("");
  const [halaman, setHalaman] = useState(1);
  const [segar, setSegar] = useState(0); // naik setiap perubahan agar daftar dan angka dimuat ulang

  const [sections, setSections] = useState<SectionAdminApi[]>([]);
  const [angka, setAngka] = useState<{ total: number; aktif: number; nonaktif: number } | null>(null);
  const [pindah, setPindah] = useState<PicMappingApi | null>(null);
  const [konfirmasiStatus, setKonfirmasiStatus] = useState<TargetStatusMaster | null>(null);
  const [konfirmasiAksi, setKonfirmasiAksi] = useState<TargetAksi | null>(null);

  const kunci = JSON.stringify({ q, idBagian, status, halaman, segar });
  const { data, error, memuat } = useDaftar(
    () => getPicMapping({ q: q || undefined, id_bagian: idBagian ? Number(idBagian) : undefined, status: (status || undefined) as StatusMaster | undefined, per_page: PER_HALAMAN, page: halaman }),
    kunci,
    "Gagal memuat data PIC.",
  );

  useEffect(() => {
    const flash = takeFlash();
    if (flash) toast.push({ tone: "success", title: flash.title, desc: flash.desc });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Angka ringkasan tidak ikut filter; dimuat ulang setelah perubahan.
  useEffect(() => {
    let batal = false;
    Promise.all([getPicMapping({ per_page: 1 }), getPicMapping({ per_page: 1, status: "aktif" }), getPicMapping({ per_page: 1, status: "nonaktif" }), getSectionsAdmin()])
      .then(([a, b, c, s]) => {
        if (batal) return;
        setAngka({ total: a.meta.total, aktif: b.meta.total, nonaktif: c.meta.total });
        setSections(s);
      })
      .catch(() => undefined);
    return () => {
      batal = true;
    };
  }, [segar]);

  const sectionAktif = useMemo(() => sections.filter((s) => s.status === "aktif"), [sections]);
  const sectionDenganPic = useMemo(() => sections.filter((s) => (s.jumlah_pic ?? 0) > 0).length, [sections]);
  const rasio = sectionAktif.length > 0 && angka ? (angka.aktif / sectionAktif.length).toFixed(1) : "0";

  const ubahFilter = (fn: () => void) => {
    fn();
    setHalaman(1);
  };
  const filterAktif = qInput !== "" || idBagian !== "" || status !== "";

  const mintaStatus = (p: PicMappingApi, ke: StatusMaster) =>
    setKonfirmasiStatus({
      jenis: "Akun PIC",
      nama: p.name,
      ke,
      dampakNonaktif: "PIC ini tidak dapat masuk dan tidak lagi dapat menerima tiket dari antrean section. Tiket yang masih ia pegang harus diselesaikan atau dialihkan lebih dulu; bila masih ada, server menolak penonaktifan.",
      dampakAktif: "PIC ini dapat kembali masuk dan menerima tiket dari antrean section-nya.",
      jalankan: async () => {
        try {
          await updateUser(p.id, { status: ke });
          setSegar((n) => n + 1);
          toast.push({ tone: "success", title: ke === "nonaktif" ? "PIC dinonaktifkan" : "PIC diaktifkan", desc: p.name });
          return { ok: true };
        } catch (e) {
          return keHasil(e);
        }
      },
    });

  const mintaKembalikan = (p: PicMappingApi) =>
    setKonfirmasiAksi({
      judul: "Kembalikan ke Karyawan?",
      icon: UserMinus,
      tone: "rose",
      labelYa: "Ya, Kembalikan",
      isi: <><strong className="text-slate-900">{p.name}</strong> tidak lagi menjadi PIC dan kembali menjadi karyawan di section {p.bagian?.kode_bagian ?? "-"}.</>,
      dampak: "Akun tidak dihapus. PIC tidak lagi dapat menerima tiket dari antrean. PIC yang masih memegang tiket berjalan tidak dapat dikembalikan sebelum tiketnya selesai.",
      jalankan: async () => {
        try {
          await deletePicMapping(p.id);
          setSegar((n) => n + 1);
          toast.push({ tone: "success", title: "PIC dikembalikan menjadi karyawan", desc: p.name });
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
          <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider mb-1">
            <span>Master Data</span><span>/</span><span className="text-blue-700 font-bold">PIC</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">PIC</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola PIC dan pemetaannya ke section. Satu section boleh punya banyak PIC; satu PIC hanya satu section.</p>
        </div>
        <Link href="/admin/pic/tambah" className="px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg flex items-center gap-2 shadow-sm transition-all hover:-translate-y-0.5 shrink-0">
          <PlusCircle className="w-4 h-4" /> Tambah PIC
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total PIC" value={<CountUp value={angka?.total ?? 0} />} hint="Terdaftar di sistem" icon={ShieldCheck} tone="blue" />
        <StatCard label="PIC Aktif" value={<CountUp value={angka?.aktif ?? 0} delay={80} />} hint={angka && angka.total > 0 ? `${Math.round((angka.aktif / angka.total) * 100)}% siap bertugas` : "Siap bertugas"} icon={CheckCircle2} tone="emerald" />
        <StatCard label="PIC Nonaktif" value={<CountUp value={angka?.nonaktif ?? 0} delay={160} />} hint="Tidak menerima tiket" icon={Ban} tone="slate" />
        <StatCard label="Section dengan PIC" value={<CountUp value={sectionDenganPic} delay={240} />} hint={`Dari ${sectionAktif.length} section aktif`} icon={Layers} tone="violet" />
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative min-w-[260px] flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={qInput}
              onChange={(e) => ubahFilter(() => setQInput(e.target.value))}
              placeholder="Cari nama, NIK, atau email PIC..."
              aria-label="Cari PIC"
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
            />
          </div>
          <SelectField label="Section" value={idBagian} onChange={(v) => ubahFilter(() => setIdBagian(v))} options={[{ value: "", label: "Semua Section" }, ...sections.map((s) => ({ value: String(s.id), label: `${s.kode_bagian} · ${s.nama_bagian}` }))]} />
          <SelectField label="Status" value={status} onChange={(v) => ubahFilter(() => setStatus(v))} options={[{ value: "", label: "Semua Status" }, { value: "aktif", label: "Aktif" }, { value: "nonaktif", label: "Nonaktif" }]} />
          <button
            onClick={() => {
              setQInput("");
              setIdBagian("");
              setStatus("");
              setHalaman(1);
            }}
            disabled={!filterAktif}
            className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium text-slate-500 hover:text-blue-700 disabled:opacity-40 disabled:hover:text-slate-500 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 self-start lg:self-auto">
          <BarChart3 className="w-4 h-4 text-blue-700" />
          <span className="text-xs text-slate-500">Rasio Penugasan:</span>
          <span className="text-xs font-bold text-slate-900">{rasio} PIC aktif / Section</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {error ? (
          <div className="py-14 px-6 flex flex-col items-center text-center gap-3" role="alert">
            <span className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center"><TriangleAlert className="w-6 h-6" /></span>
            <h3 className="text-sm font-semibold text-slate-900">Data PIC tidak dapat dimuat</h3>
            <p className="text-xs text-slate-500 max-w-sm">{error}</p>
            <button onClick={() => setSegar((n) => n + 1)} className="px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-colors">Coba Lagi</button>
          </div>
        ) : data === null ? (
          <div className="py-20 flex items-center justify-center gap-3 text-sm text-slate-500" role="status" aria-live="polite">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> Memuat data PIC...
          </div>
        ) : data.data.length === 0 ? (
          <EmptyState icon={Users} title={filterAktif ? "Tidak ada hasil" : "Belum ada PIC"} desc={filterAktif ? "Coba ubah kata kunci atau reset filter." : "Tetapkan karyawan sebagai PIC untuk mulai menerima tiket."} />
        ) : (
          <div className={`overflow-x-auto transition-opacity duration-300 ${memuat ? "opacity-50" : ""}`} aria-busy={memuat}>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-6 font-semibold">Nama PIC</th>
                  <th className="py-3 px-4 font-semibold">NIK</th>
                  <th className="py-3 px-4 font-semibold">Section</th>
                  <th className="py-3 px-4 font-semibold">Tiket Dipegang</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-6 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.data.map((p) => (
                  <tr key={p.id} className={`hover:bg-slate-50/60 transition-colors ${p.status === "nonaktif" ? "opacity-80" : ""}`}>
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-xs ${p.status === "aktif" ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-500"}`}>{initialsOf(p.name)}</div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-slate-900 truncate">{p.name}</span>
                          <span className="text-xs text-slate-400 truncate">{p.jabatan || p.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold"><span className="px-2 py-1 bg-slate-100 text-slate-600 rounded font-mono">{p.nik ?? "—"}</span></td>
                    <td className="py-3.5 px-4"><span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-semibold" title={p.bagian?.nama_bagian}>{p.bagian?.kode_bagian ?? "—"}</span></td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${(p.tiket_aktif ?? 0) > 0 ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-600"}`}>
                        {p.tiket_aktif ?? 0} tiket
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {p.status === "aktif" ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Aktif</span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold"><span className="w-2 h-2 rounded-full bg-slate-400"></span> Nonaktif</span>
                      )}
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/admin/pengguna/${p.id}`} className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors" title="Lihat detail" aria-label={`Lihat detail ${p.name}`}><Eye className="w-4 h-4" /></Link>
                        <button onClick={() => setPindah(p)} className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors" title="Pindah section" aria-label={`Pindah section ${p.name}`}><ArrowRightLeft className="w-4 h-4" /></button>
                        {p.status === "aktif" ? (
                          <button onClick={() => mintaStatus(p, "nonaktif")} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors" title="Nonaktifkan" aria-label={`Nonaktifkan ${p.name}`}><Ban className="w-4 h-4" /></button>
                        ) : (
                          <button onClick={() => mintaStatus(p, "aktif")} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors" title="Aktifkan" aria-label={`Aktifkan ${p.name}`}><CheckCircle2 className="w-4 h-4" /></button>
                        )}
                        <button onClick={() => mintaKembalikan(p)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors" title="Kembalikan ke karyawan" aria-label={`Kembalikan ${p.name} ke karyawan`}><UserMinus className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && data.data.length > 0 && <Pagination page={data.meta.current_page} perPage={data.meta.per_page} total={data.meta.total} onPage={setHalaman} noun="PIC" />}
      </div>

      <FormPindah
        pic={pindah}
        sectionAktif={sectionAktif}
        onClose={() => setPindah(null)}
        onSimpan={async (p, idTujuan) => {
          try {
            const baru = await updatePicMapping(p.id, idTujuan);
            setSegar((n) => n + 1);
            toast.push({ tone: "success", title: "Section PIC dipindahkan", desc: `${p.name} → ${baru.bagian?.kode_bagian ?? ""}` });
            return { ok: true };
          } catch (e) {
            return keHasil(e);
          }
        }}
      />
      <KonfirmasiStatusMaster target={konfirmasiStatus} onClose={() => setKonfirmasiStatus(null)} />
      <KonfirmasiAksi target={konfirmasiAksi} onClose={() => setKonfirmasiAksi(null)} />
      <Toasts items={toast.items} dismiss={toast.dismiss} />
    </>
  );
}

type SimpanPindah = (p: PicMappingApi, idTujuan: number) => Promise<{ ok: true } | { ok: false; error: string }>;

function FormPindah({ pic, sectionAktif, onClose, onSimpan }: { pic: PicMappingApi | null; sectionAktif: SectionAdminApi[]; onClose: () => void; onSimpan: SimpanPindah }) {
  // Dipasang ulang per PIC (key) agar pilihan awal selalu section saat ini.
  if (!pic) return null;
  return <IsiFormPindah key={pic.id} pic={pic} sectionAktif={sectionAktif} onClose={onClose} onSimpan={onSimpan} />;
}

function IsiFormPindah({ pic, sectionAktif, onClose, onSimpan }: { pic: PicMappingApi; sectionAktif: SectionAdminApi[]; onClose: () => void; onSimpan: SimpanPindah }) {
  const [tujuan, setTujuan] = useState(String(pic.bagian?.id ?? ""));

  return (
    <FormDialog
      open
      icon={ArrowRightLeft}
      title="Pindah Section PIC"
      submitLabel="Pindahkan"
      onClose={onClose}
      onSubmit={async () => {
        if (!tujuan) return { ok: false, error: "Section tujuan wajib dipilih." };
        return onSimpan(pic, Number(tujuan));
      }}
    >
      <p className="text-xs text-slate-600 leading-relaxed">
        Pindahkan <strong className="text-slate-900">{pic.name}</strong> dari section <strong className="text-slate-900">{pic.bagian?.kode_bagian ?? "-"}</strong> ke section lain. PIC yang masih memegang tiket berjalan tidak dapat dipindahkan.
      </p>
      <Field label="Section Tujuan" required>
        <select value={tujuan} onChange={(e) => setTujuan(e.target.value)} className={`${inputCls} cursor-pointer`}>
          {sectionAktif.map((s) => <option key={s.id} value={s.id}>{s.kode_bagian} · {s.nama_bagian}</option>)}
        </select>
      </Field>
    </FormDialog>
  );
}
