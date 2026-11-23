"use client";

import { useMemo, useState } from "react";
import { Ban, Building2, CheckCircle2, Info, Layers, Loader2, MapPin, Pencil, PlusCircle, RotateCcw, Search, TriangleAlert } from "lucide-react";
import { CountUp } from "@/components/fx/motion";
import { Toasts, useToasts } from "@/components/admin/settings-ui";
import { FormNamaModal, KonfirmasiStatusModal, type TargetStatus } from "@/components/admin/lokasi-dialogs";
import { EmptyState, PageHeader, StatCard, delay } from "@/components/shared/display";
import { SelectField } from "@/components/shared/form-controls";
import { useLokasi, type Plant, type StatusLokasi } from "@/lib/admin/lokasi";

const BADGE: Record<StatusLokasi, string> = {
  aktif: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
  nonaktif: "bg-slate-100 text-slate-500 border-slate-200",
};
const DOT: Record<StatusLokasi, string> = { aktif: "bg-emerald-500", nonaktif: "bg-slate-400" };

function StatusBadge({ status }: { status: StatusLokasi }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-medium whitespace-nowrap ${BADGE[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${DOT[status]}`} />
      {status === "aktif" ? "Aktif" : "Nonaktif"}
    </span>
  );
}

/** Dialog yang sedang terbuka: tidak ada, atau salah satu form. */
type Dialog =
  | { jenis: "tambah-plant" }
  | { jenis: "ubah-plant"; plant: Plant }
  | { jenis: "tambah-lantai"; plant: Plant }
  | { jenis: "ubah-lantai"; plant: Plant; idLantai: number; nama: string }
  | null;

export default function LokasiPage() {
  const lokasi = useLokasi();
  const toast = useToasts();
  const { plants, status: statusMuat } = lokasi;
  const ready = statusMuat === "ready";

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [dipilih, setDipilih] = useState<number | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [konfirmasi, setKonfirmasi] = useState<(TargetStatus & { jalankan: () => void }) | null>(null);

  const ringkas = useMemo(() => {
    const semuaLantai = plants.flatMap((p) => p.lantais);
    return {
      plant: plants.length,
      plantAktif: plants.filter((p) => p.status === "aktif").length,
      lantai: semuaLantai.length,
      // Hanya lantai aktif pada plant aktif yang dapat dipilih karyawan.
      lantaiAktif: plants.filter((p) => p.status === "aktif").flatMap((p) => p.lantais).filter((l) => l.status === "aktif").length,
    };
  }, [plants]);

  const terfilter = useMemo(() => {
    const kata = q.trim().toLowerCase();
    return plants.filter((p) => {
      if (status && p.status !== status) return false;
      if (!kata) return true;
      return p.nama_plant.toLowerCase().includes(kata) || p.lantais.some((l) => l.nama_lantai.toLowerCase().includes(kata));
    });
  }, [plants, q, status]);

  const aktif = terfilter.find((p) => p.id === dipilih) ?? terfilter[0] ?? null;
  const filterAktif = q.trim() !== "" || status !== "";

  const berhasil = (title: string, desc?: string) => toast.push({ tone: "success", title, desc });
  /** Jalankan perubahan status; galat dari server tampil sebagai toast. */
  const ubahStatus = async (aksi: Promise<{ ok: true } | { ok: false; error: string }>, judul: string, desc: string) => {
    const h = await aksi;
    if (h.ok) berhasil(judul, desc);
    else toast.push({ tone: "error", title: "Perubahan gagal", desc: h.error });
  };

  const mintaStatus = (target: TargetStatus, jalankan: () => void) => setKonfirmasi({ ...target, jalankan });

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Master Data" }, { label: "Lokasi" }]}
        title="Lokasi"
        desc="Kelola plant dan lantai yang dipilih karyawan pada form pengajuan layanan."
        actions={
          <button onClick={() => setDialog({ jenis: "tambah-plant" })} className="px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg flex items-center gap-2 shadow-sm transition-all hover:-translate-y-0.5">
            <PlusCircle className="w-4 h-4" /> Tambah Plant
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Plant" value={<CountUp value={ready ? ringkas.plant : 0} />} hint="Terdaftar di sistem" icon={Building2} tone="blue" />
        <StatCard label="Plant Aktif" value={<CountUp value={ready ? ringkas.plantAktif : 0} delay={80} />} hint="Tampil di form pengajuan" icon={CheckCircle2} tone="emerald" />
        <StatCard label="Total Lantai" value={<CountUp value={ready ? ringkas.lantai : 0} delay={160} />} hint="Seluruh plant" icon={Layers} tone="slate" />
        <StatCard label="Lantai Aktif" value={<CountUp value={ready ? ringkas.lantaiAktif : 0} delay={240} />} hint="Dapat dipilih karyawan" icon={MapPin} tone="violet" />
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative min-w-[240px] flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama plant atau lantai..."
            aria-label="Cari lokasi"
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
          />
        </div>
        <SelectField label="Status plant" value={status} onChange={setStatus} options={[{ value: "", label: "Semua Status" }, { value: "aktif", label: "Aktif" }, { value: "nonaktif", label: "Nonaktif" }]} />
        <button
          onClick={() => {
            setQ("");
            setStatus("");
          }}
          disabled={!filterAktif}
          className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium text-slate-500 hover:text-blue-700 disabled:opacity-40 disabled:hover:text-slate-500 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
        <span className="ml-auto text-xs text-slate-400">{terfilter.length} plant ditampilkan</span>
      </div>

      {statusMuat === "loading" ? (
        <div className="bg-white rounded-xl border border-slate-200 py-20 flex items-center justify-center gap-3 text-sm text-slate-500" role="status" aria-live="polite">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> Memuat data lokasi...
        </div>
      ) : statusMuat === "error" ? (
        <div className="bg-white rounded-xl border border-rose-200 py-14 px-6 flex flex-col items-center text-center gap-3" role="alert">
          <span className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center"><TriangleAlert className="w-6 h-6" /></span>
          <h3 className="text-sm font-semibold text-slate-900">Data lokasi tidak dapat dimuat</h3>
          <p className="text-xs text-slate-500 max-w-sm">{lokasi.error}</p>
          <button onClick={lokasi.coba} className="px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-colors">Coba Lagi</button>
        </div>
      ) : terfilter.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200">
          <EmptyState icon={Building2} title={plants.length === 0 ? "Belum ada plant" : "Tidak ada hasil"} desc={plants.length === 0 ? "Tambahkan plant pertama untuk mulai mengatur lokasi." : "Coba ubah kata kunci atau reset filter."} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Daftar plant */}
          <ul className="flex flex-col gap-3" aria-label="Daftar plant">
            {terfilter.map((p, i) => {
              const dipakai = p.id === aktif?.id;
              const lantaiAktif = p.lantais.filter((l) => l.status === "aktif").length;
              return (
                <li key={p.id} className="fx-reveal" style={delay(i * 70)}>
                  <button
                    onClick={() => setDipilih(p.id)}
                    aria-pressed={dipakai}
                    className={`w-full text-left rounded-xl border p-4 flex items-center gap-3.5 transition-all duration-300 ${dipakai ? "border-blue-500 bg-blue-50/50 ring-4 ring-blue-50 shadow-sm" : "border-slate-200 bg-white hover:border-blue-200 hover:shadow-sm"} ${p.status === "nonaktif" ? "opacity-70" : ""}`}
                  >
                    <span className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${dipakai ? "bg-blue-700 text-white border-blue-700" : "bg-blue-50 text-blue-700 border-blue-100"}`}>
                      <Building2 className="w-5 h-5" />
                    </span>
                    <span className="min-w-0 flex-1 leading-tight">
                      <span className="block text-sm font-semibold text-slate-900 truncate">{p.nama_plant}</span>
                      <span className="block text-[11px] text-slate-400 mt-0.5">{p.status === "aktif" ? `${lantaiAktif} dari ${p.lantais.length} lantai aktif` : `${p.lantais.length} lantai · plant nonaktif`}</span>
                    </span>
                    <StatusBadge status={p.status} />
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Rincian plant terpilih */}
          {aktif && (
            <section key={aktif.id} className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden fx-reveal">
              <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-slate-900 truncate">{aktif.nama_plant}</h2>
                    <div className="mt-1"><StatusBadge status={aktif.status} /></div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => setDialog({ jenis: "ubah-plant", plant: aktif })} className="px-3 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-blue-800 hover:border-blue-200 transition-all flex items-center gap-1.5">
                    <Pencil className="w-3.5 h-3.5" /> Ubah Nama
                  </button>
                  {aktif.status === "aktif" ? (
                    <button
                      onClick={() => mintaStatus({ jenis: "plant", nama: aktif.nama_plant, ke: "nonaktif" }, () => ubahStatus(lokasi.setStatusPlant(aktif.id, "nonaktif"), "Plant dinonaktifkan", `${aktif.nama_plant} tidak tampil lagi di form pengajuan.`))}
                      className="px-3 py-2 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors flex items-center gap-1.5"
                    >
                      <Ban className="w-3.5 h-3.5" /> Nonaktifkan
                    </button>
                  ) : (
                    <button
                      onClick={() => mintaStatus({ jenis: "plant", nama: aktif.nama_plant, ke: "aktif" }, () => ubahStatus(lokasi.setStatusPlant(aktif.id, "aktif"), "Plant diaktifkan", `${aktif.nama_plant} tampil kembali di form pengajuan.`))}
                      className="px-3 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Aktifkan
                    </button>
                  )}
                </div>
              </div>

              {aktif.status === "nonaktif" && (
                <div className="mx-6 mt-5 rounded-lg bg-amber-50 border border-amber-200/70 text-amber-800 text-xs p-3 flex items-start gap-2 leading-relaxed">
                  <Info className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>Plant ini nonaktif: tidak tampil di form pengajuan beserta seluruh lantainya, dan lantai baru tidak dapat ditambahkan. Tiket lama tetap menyimpan lokasinya.</span>
                </div>
              )}

              <div className="px-6 py-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Lantai <span className="text-slate-400 font-normal">({aktif.lantais.length})</span></h3>
                <button
                  onClick={() => setDialog({ jenis: "tambah-lantai", plant: aktif })}
                  disabled={aktif.status !== "aktif"}
                  title={aktif.status !== "aktif" ? "Aktifkan plant terlebih dahulu" : undefined}
                  className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:hover:bg-blue-50"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Tambah Lantai
                </button>
              </div>

              {aktif.lantais.length === 0 ? (
                <EmptyState icon={Layers} title="Belum ada lantai" desc="Tambahkan lantai agar plant ini dapat dipilih pada form pengajuan." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50/80 border-y border-slate-200 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-6">Nama Lantai</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-6 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {aktif.lantais.map((l) => (
                        <tr key={l.id} className={`hover:bg-slate-50/70 transition-colors ${l.status === "nonaktif" ? "opacity-70" : ""}`}>
                          <td className="py-3 px-6">
                            <span className="flex items-center gap-2.5 font-medium text-slate-800 text-[13px]">
                              <Layers className="w-4 h-4 text-slate-400" /> {l.nama_lantai}
                            </span>
                          </td>
                          <td className="py-3 px-4"><StatusBadge status={l.status} /></td>
                          <td className="py-3 px-6">
                            <div className="flex items-center justify-end gap-1.5">
                              <button onClick={() => setDialog({ jenis: "ubah-lantai", plant: aktif, idLantai: l.id, nama: l.nama_lantai })} className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors" title="Ubah nama" aria-label={`Ubah nama ${l.nama_lantai}`}>
                                <Pencil className="w-4 h-4" />
                              </button>
                              {l.status === "aktif" ? (
                                <button
                                  onClick={() => mintaStatus({ jenis: "lantai", nama: l.nama_lantai, induk: aktif.nama_plant, ke: "nonaktif" }, () => ubahStatus(lokasi.setStatusLantai(l.id, "nonaktif"), "Lantai dinonaktifkan", `${l.nama_lantai} (${aktif.nama_plant}) tidak tampil lagi di form pengajuan.`))}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors" title="Nonaktifkan" aria-label={`Nonaktifkan ${l.nama_lantai}`}
                                >
                                  <Ban className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => mintaStatus({ jenis: "lantai", nama: l.nama_lantai, induk: aktif.nama_plant, ke: "aktif" }, () => ubahStatus(lokasi.setStatusLantai(l.id, "aktif"), "Lantai diaktifkan", `${l.nama_lantai} (${aktif.nama_plant}) tampil kembali di form pengajuan.`))}
                                  className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors" title="Aktifkan" aria-label={`Aktifkan ${l.nama_lantai}`}
                                >
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
              <p className="px-6 py-4 border-t border-slate-100 text-[11px] text-slate-400 leading-relaxed">
                Lokasi tidak dihapus, hanya dinonaktifkan. Lantai tidak dapat dipindah ke plant lain; buat lantai baru di plant tujuan bila diperlukan.
              </p>
            </section>
          )}
        </div>
      )}

      {/* Dialog */}
      <FormNamaModal
        open={dialog?.jenis === "tambah-plant"}
        icon={Building2}
        title="Tambah Plant"
        label="Nama Plant"
        placeholder="Contoh: Plant 4"
        submitLabel="Simpan Plant"
        onSubmit={async (nama) => {
          const h = await lokasi.tambahPlant(nama);
          if (h.ok) berhasil("Plant ditambahkan", nama.trim());
          return h;
        }}
        onClose={() => setDialog(null)}
      />
      <FormNamaModal
        open={dialog?.jenis === "ubah-plant"}
        icon={Pencil}
        title="Ubah Nama Plant"
        label="Nama Plant"
        placeholder="Nama plant"
        initial={dialog?.jenis === "ubah-plant" ? dialog.plant.nama_plant : ""}
        submitLabel="Simpan Perubahan"
        onSubmit={async (nama) => {
          if (dialog?.jenis !== "ubah-plant") return { ok: false, error: "Plant tidak ditemukan." };
          const h = await lokasi.ubahPlant(dialog.plant.id, nama);
          if (h.ok) berhasil("Nama plant diperbarui", nama.trim());
          return h;
        }}
        onClose={() => setDialog(null)}
      />
      <FormNamaModal
        open={dialog?.jenis === "tambah-lantai"}
        icon={Layers}
        title={dialog?.jenis === "tambah-lantai" ? `Tambah Lantai di ${dialog.plant.nama_plant}` : "Tambah Lantai"}
        label="Nama Lantai"
        placeholder="Contoh: Lantai 4"
        submitLabel="Simpan Lantai"
        onSubmit={async (nama) => {
          if (dialog?.jenis !== "tambah-lantai") return { ok: false, error: "Plant tidak ditemukan." };
          const h = await lokasi.tambahLantai(dialog.plant.id, nama);
          if (h.ok) berhasil("Lantai ditambahkan", `${nama.trim()} di ${dialog.plant.nama_plant}`);
          return h;
        }}
        onClose={() => setDialog(null)}
      />
      <FormNamaModal
        open={dialog?.jenis === "ubah-lantai"}
        icon={Pencil}
        title="Ubah Nama Lantai"
        label="Nama Lantai"
        placeholder="Nama lantai"
        initial={dialog?.jenis === "ubah-lantai" ? dialog.nama : ""}
        submitLabel="Simpan Perubahan"
        onSubmit={async (nama) => {
          if (dialog?.jenis !== "ubah-lantai") return { ok: false, error: "Lantai tidak ditemukan." };
          const h = await lokasi.ubahLantai(dialog.idLantai, nama);
          if (h.ok) berhasil("Nama lantai diperbarui", nama.trim());
          return h;
        }}
        onClose={() => setDialog(null)}
      />
      <KonfirmasiStatusModal target={konfirmasi} onClose={() => setKonfirmasi(null)} onKonfirmasi={() => konfirmasi?.jalankan()} />

      <Toasts items={toast.items} dismiss={toast.dismiss} />
    </>
  );
}
