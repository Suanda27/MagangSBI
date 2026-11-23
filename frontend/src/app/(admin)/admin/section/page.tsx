"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Ban, Building2, CheckCircle2, Layers, Loader2, Pencil, PlusCircle, RotateCcw, Search, ShieldCheck, TriangleAlert, Users, Wrench } from "lucide-react";
import { CountUp } from "@/components/fx/motion";
import { Field, Toasts, inputCls, useToasts } from "@/components/admin/settings-ui";
import { FormDialog, KonfirmasiStatusMaster, type HasilAksi, type TargetStatusMaster } from "@/components/admin/master-dialogs";
import { EmptyState, StatCard } from "@/components/shared/display";
import { SelectField } from "@/components/shared/form-controls";
import { getSectionsAdmin, updateSection, type SectionAdminApi, type StatusMaster } from "@/lib/api/admin";
import { errorMessage, toApiError } from "@/lib/api/errors";
import { takeFlash } from "@/lib/admin/flash";

const BADGE: Record<StatusMaster, string> = {
  aktif: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
  nonaktif: "bg-slate-100 text-slate-500 border-slate-200",
};

function StatusBadge({ status }: { status: StatusMaster }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-medium whitespace-nowrap ${BADGE[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === "aktif" ? "bg-emerald-500" : "bg-slate-400"}`} />
      {status === "aktif" ? "Aktif" : "Nonaktif"}
    </span>
  );
}

/** Pesan galat pertama per field bila 422, selain itu pesan umum (termasuk 409). */
function keHasil(error: unknown): HasilAksi {
  const e = toApiError(error);
  return { ok: false, error: Object.values(e.errors)[0]?.[0] ?? e.message };
}

export default function SectionPage() {
  const toast = useToasts();
  const [sections, setSections] = useState<SectionAdminApi[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [galat, setGalat] = useState<string | null>(null);
  const [percobaan, setPercobaan] = useState(0);

  const [q, setQ] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [ubah, setUbah] = useState<SectionAdminApi | null>(null);
  const [konfirmasi, setKonfirmasi] = useState<TargetStatusMaster | null>(null);

  // Muat saat dibuka, dan setiap kali "Coba lagi" ditekan.
  useEffect(() => {
    let batal = false;
    getSectionsAdmin()
      .then((data) => {
        if (batal) return;
        setSections(data);
        setGalat(null);
        setStatus("ready");
      })
      .catch((e) => {
        if (batal) return;
        setGalat(errorMessage(e, "Gagal memuat data section."));
        setStatus("error");
      });
    return () => {
      batal = true;
    };
  }, [percobaan]);

  // Pesan dari halaman Tambah Section (sekali baca).
  useEffect(() => {
    const flash = takeFlash();
    if (flash) toast.push({ tone: "success", title: flash.title, desc: flash.desc });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const segarkan = async () => {
    try {
      setSections(await getSectionsAdmin());
    } catch {
      /* data lama tetap tampil; perubahan sudah tersimpan di server */
    }
  };

  const ringkas = useMemo(
    () => ({
      total: sections.length,
      aktif: sections.filter((s) => s.status === "aktif").length,
      nonaktif: sections.filter((s) => s.status === "nonaktif").length,
      pengguna: sections.reduce((n, s) => n + (s.jumlah_pengguna ?? 0), 0),
    }),
    [sections],
  );

  const terfilter = useMemo(() => {
    const kata = q.trim().toLowerCase();
    return sections.filter((s) => {
      if (filterStatus && s.status !== filterStatus) return false;
      if (!kata) return true;
      return s.nama_bagian.toLowerCase().includes(kata) || s.kode_bagian.toLowerCase().includes(kata);
    });
  }, [sections, q, filterStatus]);

  const ready = status === "ready";

  const mintaStatus = (s: SectionAdminApi, ke: StatusMaster) =>
    setKonfirmasi({
      jenis: "Section",
      nama: s.nama_bagian,
      ke,
      dampakNonaktif: "Section ini tidak muncul lagi pada pilihan section di pendaftaran dan formulir. Data, layanan, dan tiket lama tetap tersimpan, dan dapat diaktifkan kembali kapan saja. Section yang masih punya tiket berjalan tidak dapat dinonaktifkan.",
      dampakAktif: "Section ini muncul kembali pada pilihan section di pendaftaran dan formulir.",
      jalankan: async () => {
        try {
          await updateSection(s.id, { status: ke });
          await segarkan();
          toast.push({ tone: "success", title: ke === "nonaktif" ? "Section dinonaktifkan" : "Section diaktifkan", desc: `${s.nama_bagian} (${s.kode_bagian})` });
          return { ok: true };
        } catch (e) {
          return keHasil(e);
        }
      },
    });

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Section</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">Master Data</span>
          </div>
          <p className="text-sm text-slate-500 mt-1">Kelola data section yang digunakan dalam pengelolaan layanan internal.</p>
        </div>
        <Link href="/admin/section/tambah" className="px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg flex items-center gap-2 shadow-sm transition-all hover:-translate-y-0.5">
          <PlusCircle className="w-4 h-4" />
          Tambah Section
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Section" value={<CountUp value={ready ? ringkas.total : 0} />} hint="Terdaftar di sistem" icon={Building2} tone="blue" />
        <StatCard label="Section Aktif" value={<CountUp value={ready ? ringkas.aktif : 0} delay={80} />} hint="Siap digunakan operasional" icon={CheckCircle2} tone="emerald" />
        <StatCard label="Section Nonaktif" value={<CountUp value={ready ? ringkas.nonaktif : 0} delay={160} />} hint="Arsip penugasan" icon={Ban} tone="slate" />
        <StatCard label="Total Pengguna" value={<CountUp value={ready ? ringkas.pengguna : 0} delay={240} />} hint={`Tersebar di ${ringkas.total} section`} icon={Users} tone="violet" />
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative min-w-[240px] flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama atau kode section..."
            aria-label="Cari section"
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
          />
        </div>
        <SelectField label="Status" value={filterStatus} onChange={setFilterStatus} options={[{ value: "", label: "Semua Status" }, { value: "aktif", label: "Aktif" }, { value: "nonaktif", label: "Nonaktif" }]} />
        <button
          onClick={() => {
            setQ("");
            setFilterStatus("");
          }}
          disabled={q === "" && filterStatus === ""}
          className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium text-slate-500 hover:text-blue-700 disabled:opacity-40 disabled:hover:text-slate-500 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
        <span className="ml-auto text-xs text-slate-400">{terfilter.length} section ditampilkan</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {status === "loading" ? (
          <div className="py-20 flex items-center justify-center gap-3 text-sm text-slate-500" role="status" aria-live="polite">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> Memuat data section...
          </div>
        ) : status === "error" ? (
          <div className="py-14 px-6 flex flex-col items-center text-center gap-3" role="alert">
            <span className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center"><TriangleAlert className="w-6 h-6" /></span>
            <h3 className="text-sm font-semibold text-slate-900">Data section tidak dapat dimuat</h3>
            <p className="text-xs text-slate-500 max-w-sm">{galat}</p>
            <button
              onClick={() => {
                setStatus("loading");
                setPercobaan((n) => n + 1);
              }}
              className="px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        ) : terfilter.length === 0 ? (
          <EmptyState icon={Building2} title={sections.length === 0 ? "Belum ada section" : "Tidak ada hasil"} desc={sections.length === 0 ? "Tambahkan section pertama untuk mulai menata layanan." : "Coba ubah kata kunci atau reset filter."} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-6">Section</th>
                  <th className="py-3 px-4">Kode</th>
                  <th className="py-3 px-4">PIC Aktif</th>
                  <th className="py-3 px-4">Pengguna</th>
                  <th className="py-3 px-4">Layanan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {terfilter.map((s) => (
                  <tr key={s.id} className={`hover:bg-slate-50/70 transition-colors ${s.status === "nonaktif" ? "opacity-70" : ""}`}>
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 text-sm">{s.nama_bagian}</p>
                          <p className="text-[11px] text-slate-400 truncate max-w-xs" title={s.deskripsi ?? undefined}>{s.deskripsi || "Tanpa deskripsi"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 text-[11px] font-semibold tracking-wide bg-slate-100 text-slate-700 rounded-md border border-slate-200">{s.kode_bagian}</span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700"><span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> {s.jumlah_pic ?? 0}</span></td>
                    <td className="py-3.5 px-4 font-medium text-slate-700"><span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-slate-400" /> {s.jumlah_pengguna ?? 0}</span></td>
                    <td className="py-3.5 px-4 font-medium text-slate-700"><span className="flex items-center gap-1.5"><Wrench className="w-3.5 h-3.5 text-slate-400" /> {s.jumlah_layanan ?? 0}</span></td>
                    <td className="py-3.5 px-4"><StatusBadge status={s.status} /></td>
                    <td className="py-3.5 px-6">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => setUbah(s)} className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors" title="Ubah section" aria-label={`Ubah ${s.nama_bagian}`}>
                          <Pencil className="w-4 h-4" />
                        </button>
                        {s.status === "aktif" ? (
                          <button onClick={() => mintaStatus(s, "nonaktif")} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors" title="Nonaktifkan" aria-label={`Nonaktifkan ${s.nama_bagian}`}>
                            <Ban className="w-4 h-4" />
                          </button>
                        ) : (
                          <button onClick={() => mintaStatus(s, "aktif")} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors" title="Aktifkan" aria-label={`Aktifkan ${s.nama_bagian}`}>
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
          Section tidak dihapus, hanya dinonaktifkan. Kode section sudah tertulis pada nomor tiket, jadi tidak dapat diubah setelah dibuat.
        </p>
      </div>

      <FormUbahSection section={ubah} onClose={() => setUbah(null)} onSimpan={async (id, payload) => {
        try {
          await updateSection(id, payload);
          await segarkan();
          toast.push({ tone: "success", title: "Section diperbarui", desc: payload.nama_bagian });
          return { ok: true };
        } catch (e) {
          return keHasil(e);
        }
      }} />
      <KonfirmasiStatusMaster target={konfirmasi} onClose={() => setKonfirmasi(null)} />

      <Toasts items={toast.items} dismiss={toast.dismiss} />
    </>
  );
}

function FormUbahSection({ section, onClose, onSimpan }: { section: SectionAdminApi | null; onClose: () => void; onSimpan: (id: number, payload: { nama_bagian: string; deskripsi: string | null }) => Promise<HasilAksi> }) {
  // Dipasang ulang per section (key) agar isian selalu mulai dari data terbaru.
  if (!section) return null;
  return <IsiFormUbah key={section.id} section={section} onClose={onClose} onSimpan={onSimpan} />;
}

function IsiFormUbah({ section, onClose, onSimpan }: { section: SectionAdminApi; onClose: () => void; onSimpan: (id: number, payload: { nama_bagian: string; deskripsi: string | null }) => Promise<HasilAksi> }) {
  const [nama, setNama] = useState(section.nama_bagian);
  const [deskripsi, setDeskripsi] = useState(section.deskripsi ?? "");

  return (
    <FormDialog
      open
      icon={Pencil}
      title="Ubah Section"
      submitLabel="Simpan Perubahan"
      onClose={onClose}
      onSubmit={async () => {
        if (!nama.trim()) return { ok: false, error: "Nama section wajib diisi." };
        return onSimpan(section.id, { nama_bagian: nama.trim(), deskripsi: deskripsi.trim() || null });
      }}
    >
      <Field label="Kode Section" hint="Kode tidak dapat diubah karena sudah dipakai pada nomor tiket.">
        <input value={section.kode_bagian} disabled className={`${inputCls} font-mono tracking-wider`} />
      </Field>
      <Field label="Nama Section" required>
        <input value={nama} onChange={(e) => setNama(e.target.value)} maxLength={255} autoFocus className={inputCls} />
      </Field>
      <Field label="Deskripsi" hint="Opsional.">
        <textarea value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} maxLength={1000} rows={3} className={`${inputCls} resize-y`} />
      </Field>
    </FormDialog>
  );
}
