"use client";

import { Download, Eye, FileText, Image as ImageIcon } from "lucide-react";
import type { BerkasLampiran } from "@/lib/api/permintaan";

function fmtSize(b: number) {
  return b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`;
}

/** Satu berkas lampiran dengan tombol pratinjau (gambar atau PDF) dan unduh. Hanya baca. */
export default function BarisBerkas({ berkas, onAmbil }: { berkas: BerkasLampiran; onAmbil: (b: BerkasLampiran, mode: "unduh" | "buka") => void }) {
  const gambar = berkas.tipe_file.startsWith("image/");
  const bisaDibuka = gambar || berkas.tipe_file === "application/pdf";
  const Ikon = gambar ? ImageIcon : FileText;

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 hover:border-blue-200 hover:bg-blue-50/30">
      <div className="flex items-center gap-3 min-w-0">
        <span className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 ${gambar ? "bg-sky-50 text-sky-600" : "bg-rose-50 text-rose-600"}`}>
          <Ikon className="w-5 h-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-slate-800 truncate">{berkas.nama_file}</p>
          <p className="text-[11px] text-slate-400">{gambar ? "Gambar" : "Dokumen"} • {fmtSize(berkas.ukuran_file)}</p>
        </div>
      </div>
      <div className="flex gap-1.5 shrink-0">
        {bisaDibuka && (
          <button type="button" onClick={() => onAmbil(berkas, "buka")} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-medium text-slate-600 hover:text-blue-700 hover:bg-blue-50" aria-label={`Pratinjau ${berkas.nama_file}`}>
            <Eye className="w-4 h-4" /><span className="hidden sm:inline">Pratinjau</span>
          </button>
        )}
        <button type="button" onClick={() => onAmbil(berkas, "unduh")} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-medium text-slate-600 hover:text-blue-700 hover:bg-blue-50" aria-label={`Unduh ${berkas.nama_file}`}>
          <Download className="w-4 h-4" /><span className="hidden sm:inline">Unduh</span>
        </button>
      </div>
    </div>
  );
}
