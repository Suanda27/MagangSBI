"use client";

import { useState } from "react";
import { Ban, CheckCircle2, Info, Loader2, TriangleAlert, type LucideIcon } from "lucide-react";
import { Modal, ModalHeader } from "@/components/shared/overlay";

/** Hasil aksi: sukses, atau pesan galat dari server (422, 409, dan sebagainya). */
export type HasilAksi = { ok: true } | { ok: false; error: string };

export const btnGhost = "px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-60";

/** Kotak galat umum di dalam dialog atau formulir. */
export function KotakGalat({ pesan }: { pesan: string | null }) {
  if (!pesan) return null;
  return (
    <div className="flex items-start gap-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3 fx-reveal" role="alert">
      <TriangleAlert className="w-4 h-4 shrink-0 mt-0.5" /> <span>{pesan}</span>
    </div>
  );
}

/* ---------- Bingkai dialog formulir ---------- */

/**
 * Dialog formulir generik: isi dipasang hanya saat terbuka (isian mulai bersih), tombol simpan
 * menampilkan proses, dan galat dari server tampil di dalam dialog tanpa menutupnya.
 */
export function FormDialog({
  open,
  title,
  icon,
  submitLabel,
  children,
  onSubmit,
  onClose,
  maxWidth = "max-w-lg",
}: {
  open: boolean;
  title: string;
  icon: LucideIcon;
  submitLabel: string;
  children: React.ReactNode;
  /** Mengembalikan galat dari server; sukses menutup dialog. */
  onSubmit: () => Promise<HasilAksi>;
  onClose: () => void;
  maxWidth?: string;
}) {
  if (!open) return null;
  return (
    <IsiFormDialog title={title} icon={icon} submitLabel={submitLabel} onSubmit={onSubmit} onClose={onClose} maxWidth={maxWidth}>
      {children}
    </IsiFormDialog>
  );
}

function IsiFormDialog({ title, icon, submitLabel, children, onSubmit, onClose, maxWidth }: Omit<Parameters<typeof FormDialog>[0], "open"> & { maxWidth: string }) {
  const [error, setError] = useState<string | null>(null);
  const [proses, setProses] = useState(false);

  const kirim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (proses) return;
    setError(null);
    setProses(true);
    const hasil = await onSubmit();
    setProses(false);
    if (hasil.ok) onClose();
    else setError(hasil.error);
  };

  return (
    <Modal open onClose={onClose} maxWidth={maxWidth}>
      <ModalHeader icon={icon} tone="blue" title={title} onClose={onClose} />
      <form onSubmit={kirim} noValidate className="flex flex-col min-h-0">
        <div className="p-5 flex flex-col gap-4 overflow-y-auto">
          {children}
          <KotakGalat pesan={error} />
        </div>
        <div className="p-4 border-t border-slate-100 flex justify-end gap-2.5">
          <button type="button" className={btnGhost} onClick={onClose} disabled={proses}>Batal</button>
          <button type="submit" disabled={proses} className="px-4 py-2 text-xs font-semibold bg-blue-700 hover:bg-blue-800 text-white rounded-lg shadow-sm transition-colors disabled:opacity-60 flex items-center gap-1.5">
            {proses && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {proses ? "Menyimpan..." : submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ---------- Konfirmasi nonaktifkan / aktifkan ---------- */

export interface TargetStatusMaster {
  /** Contoh: "Section", "Layanan". */
  jenis: string;
  nama: string;
  ke: "aktif" | "nonaktif";
  /** Penjelasan dampak saat dinonaktifkan. */
  dampakNonaktif: string;
  /** Penjelasan saat diaktifkan kembali. */
  dampakAktif: string;
  /** Menjalankan perubahan; galat dari server (mis. 409) tampil di dialog. */
  jalankan: () => Promise<HasilAksi>;
}

export function KonfirmasiStatusMaster({ target, onClose }: { target: TargetStatusMaster | null; onClose: () => void }) {
  if (!target) return null;
  return <IsiKonfirmasi target={target} onClose={onClose} />;
}

function IsiKonfirmasi({ target, onClose }: { target: TargetStatusMaster; onClose: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [proses, setProses] = useState(false);
  const nonaktif = target.ke === "nonaktif";

  const ya = async () => {
    if (proses) return;
    setError(null);
    setProses(true);
    const hasil = await target.jalankan();
    setProses(false);
    if (hasil.ok) onClose();
    else setError(hasil.error);
  };

  return (
    <Modal open onClose={onClose}>
      <ModalHeader icon={nonaktif ? Ban : CheckCircle2} tone={nonaktif ? "rose" : "emerald"} title={nonaktif ? `Nonaktifkan ${target.jenis}?` : `Aktifkan ${target.jenis}?`} onClose={onClose} />
      <div className="p-5 flex flex-col gap-3">
        <p className="text-xs text-slate-600 leading-relaxed">
          {target.jenis} <span className="font-semibold text-slate-900">“{target.nama}”</span> akan {nonaktif ? "dinonaktifkan" : "diaktifkan kembali"}.
        </p>
        <div className={`rounded-lg p-3 border text-[11px] leading-relaxed flex items-start gap-2 ${nonaktif ? "bg-amber-50 border-amber-200/70 text-amber-800" : "bg-emerald-50 border-emerald-200/70 text-emerald-800"}`}>
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{nonaktif ? target.dampakNonaktif : target.dampakAktif}</span>
        </div>
        <KotakGalat pesan={error} />
      </div>
      <div className="p-4 border-t border-slate-100 flex justify-end gap-2.5">
        <button className={btnGhost} onClick={onClose} disabled={proses}>Batal</button>
        <button
          onClick={ya}
          disabled={proses}
          className={`px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-sm transition-colors disabled:opacity-60 flex items-center gap-1.5 ${nonaktif ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"}`}
        >
          {proses && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {nonaktif ? "Ya, Nonaktifkan" : "Ya, Aktifkan"}
        </button>
      </div>
    </Modal>
  );
}

/* ---------- Konfirmasi aksi umum (bukan nonaktifkan/aktifkan) ---------- */

export interface TargetAksi {
  judul: string;
  /** Kalimat utama, boleh memuat nama yang ditebalkan lewat <strong>. */
  isi: React.ReactNode;
  /** Penjelasan dampak dan batasan. */
  dampak: string;
  labelYa: string;
  /** Warna tombol utama. */
  tone?: "rose" | "blue";
  icon?: LucideIcon;
  /** Menjalankan aksi; galat dari server (mis. 409) tampil di dialog. */
  jalankan: () => Promise<HasilAksi>;
}

export function KonfirmasiAksi({ target, onClose }: { target: TargetAksi | null; onClose: () => void }) {
  if (!target) return null;
  return <IsiKonfirmasiAksi target={target} onClose={onClose} />;
}

function IsiKonfirmasiAksi({ target, onClose }: { target: TargetAksi; onClose: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [proses, setProses] = useState(false);
  const rose = (target.tone ?? "blue") === "rose";

  const ya = async () => {
    if (proses) return;
    setError(null);
    setProses(true);
    const hasil = await target.jalankan();
    setProses(false);
    if (hasil.ok) onClose();
    else setError(hasil.error);
  };

  return (
    <Modal open onClose={onClose}>
      <ModalHeader icon={target.icon ?? Info} tone={rose ? "rose" : "blue"} title={target.judul} onClose={onClose} />
      <div className="p-5 flex flex-col gap-3">
        <p className="text-xs text-slate-600 leading-relaxed">{target.isi}</p>
        <div className={`rounded-lg p-3 border text-[11px] leading-relaxed flex items-start gap-2 ${rose ? "bg-amber-50 border-amber-200/70 text-amber-800" : "bg-blue-50 border-blue-200/70 text-blue-800"}`}>
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{target.dampak}</span>
        </div>
        <KotakGalat pesan={error} />
      </div>
      <div className="p-4 border-t border-slate-100 flex justify-end gap-2.5">
        <button className={btnGhost} onClick={onClose} disabled={proses}>Batal</button>
        <button
          onClick={ya}
          disabled={proses}
          className={`px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-sm transition-colors disabled:opacity-60 flex items-center gap-1.5 ${rose ? "bg-rose-600 hover:bg-rose-700" : "bg-blue-700 hover:bg-blue-800"}`}
        >
          {proses && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {target.labelYa}
        </button>
      </div>
    </Modal>
  );
}
