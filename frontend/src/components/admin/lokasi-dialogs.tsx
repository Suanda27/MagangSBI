"use client";

import { useState } from "react";
import { Ban, CheckCircle2, Info, type LucideIcon } from "lucide-react";
import { Modal, ModalHeader } from "@/components/shared/overlay";
import { inputCls } from "@/components/admin/settings-ui";
import type { HasilAksi } from "@/lib/admin/lokasi";

const btnGhost = "px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors";

/* ---------- Form satu isian nama (plant / lantai, tambah / ubah) ---------- */

interface FormNamaProps {
  open: boolean;
  title: string;
  label: string;
  placeholder: string;
  icon: LucideIcon;
  initial?: string;
  submitLabel: string;
  /** Mengembalikan galat seperti respons 422 server; sukses menutup dialog. */
  onSubmit: (nilai: string) => HasilAksi;
  onClose: () => void;
}

export function FormNamaModal({ open, ...props }: FormNamaProps) {
  // Isi hanya dipasang saat terbuka, sehingga isian dan galat selalu mulai bersih.
  if (!open) return null;
  return <IsiFormNama {...props} />;
}

function IsiFormNama({ title, label, placeholder, icon, initial = "", submitLabel, onSubmit, onClose }: Omit<FormNamaProps, "open">) {
  const [nilai, setNilai] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  const kirim = (e: React.FormEvent) => {
    e.preventDefault();
    const hasil = onSubmit(nilai);
    if (hasil.ok) onClose();
    else setError(hasil.error);
  };

  return (
    <Modal open onClose={onClose}>
      <ModalHeader icon={icon} tone="blue" title={title} onClose={onClose} />
      <form onSubmit={kirim} noValidate>
        <div className="p-5 flex flex-col gap-1.5">
          <label htmlFor="lokasi-nama" className="text-xs font-semibold text-slate-700">
            {label} <span className="text-rose-500">*</span>
          </label>
          <input
            id="lokasi-nama"
            autoFocus
            value={nilai}
            maxLength={255}
            onChange={(e) => {
              setNilai(e.target.value);
              setError(null);
            }}
            placeholder={placeholder}
            aria-invalid={error ? true : undefined}
            className={`${inputCls} ${error ? "!border-rose-400 !ring-4 !ring-rose-100" : ""}`}
          />
          {error && <span className="text-[11px] text-rose-600 fx-reveal">{error}</span>}
        </div>
        <div className="p-4 border-t border-slate-100 flex justify-end gap-2.5">
          <button type="button" className={btnGhost} onClick={onClose}>Batal</button>
          <button type="submit" className="px-4 py-2 text-xs font-semibold bg-blue-700 hover:bg-blue-800 text-white rounded-lg shadow-sm transition-colors">{submitLabel}</button>
        </div>
      </form>
    </Modal>
  );
}

/* ---------- Konfirmasi nonaktifkan / aktifkan ---------- */

export interface TargetStatus {
  jenis: "plant" | "lantai";
  nama: string;
  /** Nama plant induk, hanya untuk lantai. */
  induk?: string;
  ke: "aktif" | "nonaktif";
}

export function KonfirmasiStatusModal({ target, onClose, onKonfirmasi }: { target: TargetStatus | null; onClose: () => void; onKonfirmasi: () => void }) {
  if (!target) return null;
  const nonaktif = target.ke === "nonaktif";
  const nama = target.jenis === "plant" ? `Plant “${target.nama}”` : `Lantai “${target.nama}” (${target.induk})`;

  return (
    <Modal open onClose={onClose}>
      <ModalHeader icon={nonaktif ? Ban : CheckCircle2} tone={nonaktif ? "rose" : "emerald"} title={nonaktif ? "Nonaktifkan Lokasi?" : "Aktifkan Kembali?"} onClose={onClose} />
      <div className="p-5 flex flex-col gap-3">
        <p className="text-xs text-slate-600 leading-relaxed">
          <span className="font-semibold text-slate-900">{nama}</span> akan {nonaktif ? "dinonaktifkan" : "diaktifkan kembali"}.
        </p>
        <div className={`rounded-lg p-3 border text-[11px] leading-relaxed flex items-start gap-2 ${nonaktif ? "bg-amber-50 border-amber-200/70 text-amber-800" : "bg-emerald-50 border-emerald-200/70 text-emerald-800"}`}>
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            {nonaktif
              ? `${target.jenis === "plant" ? "Plant ini beserta seluruh lantainya" : "Lantai ini"} tidak akan tampil lagi pada form pengajuan. Tiket yang sudah ada tetap menyimpan lokasinya. Data tidak dihapus dan dapat diaktifkan kembali kapan saja.`
              : `${target.jenis === "plant" ? "Plant ini" : "Lantai ini"} akan tampil kembali pada form pengajuan.`}
          </span>
        </div>
      </div>
      <div className="p-4 border-t border-slate-100 flex justify-end gap-2.5">
        <button className={btnGhost} onClick={onClose}>Batal</button>
        <button
          className={`px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-sm transition-colors ${nonaktif ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"}`}
          onClick={() => {
            onKonfirmasi();
            onClose();
          }}
        >
          {nonaktif ? "Ya, Nonaktifkan" : "Ya, Aktifkan"}
        </button>
      </div>
    </Modal>
  );
}
