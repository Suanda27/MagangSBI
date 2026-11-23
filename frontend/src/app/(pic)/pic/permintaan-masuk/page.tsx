"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Ban, Check, ExternalLink, FileText, Image as ImageIcon, X } from "lucide-react";
import { Avatar, PageHeader } from "@/components/shared/display";
import { Drawer } from "@/components/shared/overlay";
import { PrioritasBadge, StatusBadge } from "@/components/pic/primitives";
import { FilterBar, RequestTable, useFilter } from "@/components/pic/request-list";
import { TerimaDialog, TolakDialog } from "@/components/pic/actions";
import { tanggalJam, ukuranFile } from "@/lib/shared/format";
import { usePicStore } from "@/lib/pic/store";
import { NAMA_BAGIAN, type Permintaan } from "@/lib/pic/types";

export default function PermintaanMasukPage() {
  const { permintaan } = usePicStore();

  // Antrean bersama per section: tiket yang belum diterima PIC mana pun, yang terlama di atas
  const antrean = useMemo(
    () => permintaan.filter((p) => p.status === "menunggu").sort((a, b) => new Date(a.diajukan).getTime() - new Date(b.diajukan).getTime()),
    [permintaan],
  );
  const filter = useFilter(antrean);

  const [reviewId, setReviewId] = useState<string | null>(null);
  const [terima, setTerima] = useState<Permintaan | null>(null);
  const [tolak, setTolak] = useState<Permintaan | null>(null);

  // Drawer tetap menyimpan tiket terakhir agar animasi keluar tidak "kosong"
  const [terakhir, setTerakhir] = useState<Permintaan | null>(null);
  const aktif = reviewId ? permintaan.find((p) => p.id === reviewId) ?? terakhir : terakhir;
  const buka = (p: Permintaan) => {
    setTerakhir(p);
    setReviewId(p.id);
  };


  return (
    <>
      <PageHeader
        title="Permintaan Masuk"
        desc="Tinjau dan putuskan permintaan layanan yang ditugaskan ke seksi Anda."
        actions={
          <span className="flex items-center gap-2 text-xs text-slate-500">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Antrean aktif
          </span>
        }
      />

      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 -mb-2">
        <span className="text-slate-800 font-semibold">{antrean.length} permintaan</span> menunggu tindakan
      </div>

      <FilterBar data={antrean} filter={filter} />

      <RequestTable
        data={filter.hasil}
        mode="masuk"
        onReview={buka}
        onTerima={setTerima}
        onTolak={setTolak}
        emptyTitle={antrean.length === 0 ? "Antrean kosong" : "Tidak ada hasil"}
        emptyDesc={antrean.length === 0 ? "Belum ada permintaan baru yang menunggu pemeriksaan Anda." : "Coba ubah kata kunci atau reset filter."}
      />

      {/* Drawer pemeriksaan cepat */}
      <Drawer open={!!reviewId} onClose={() => setReviewId(null)}>
        {aktif && (
          <>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-base font-semibold text-slate-900">#{aktif.id}</span>
                <PrioritasBadge prioritas={aktif.prioritas} />
              </div>
              <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 hover:rotate-90 transition-all duration-300" onClick={() => setReviewId(null)} aria-label="Tutup">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 leading-snug">{aktif.judul}</h3>
                <div className="mt-2 flex items-center gap-2"><StatusBadge status={aktif.status} /><span className="text-xs text-slate-400">{tanggalJam(aktif.diajukan)}</span></div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <Avatar nama={aktif.pengaju.nama} size="md" />
                <div className="leading-tight">
                  <p className="text-[13px] font-semibold text-slate-900">{aktif.pengaju.nama}</p>
                  <p className="text-xs text-slate-500">{NAMA_BAGIAN[aktif.pengaju.bagian]} · NIK {aktif.pengaju.nik}</p>
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-3 text-xs">
                {[
                  ["Layanan", aktif.layanan],
                  ["Kategori", aktif.kategori],
                  ["Lokasi", `${aktif.plant} · ${aktif.lantai}`],
                  ["Diajukan", tanggalJam(aktif.diajukan)],
                ].map(([k, v]) => (
                  <div key={String(k)} className="rounded-lg border border-slate-100 p-3">
                    <dt className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">{k}</dt>
                    <dd className="text-slate-800 mt-1 font-medium">{v}</dd>
                  </div>
                ))}
              </dl>

              <div>
                <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Deskripsi</h4>
                <p className="text-[13px] text-slate-700 leading-relaxed whitespace-pre-line">{aktif.deskripsi}</p>
              </div>

              <div>
                <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Lampiran ({aktif.lampiran.length})</h4>
                {aktif.lampiran.length === 0 ? (
                  <p className="text-xs text-slate-400">Tidak ada lampiran.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {aktif.lampiran.map((l) => (
                      <li key={l.id} className="flex items-center gap-3 p-2.5 border border-slate-200 rounded-lg text-xs">
                        {l.tipe === "gambar" ? <ImageIcon className="w-4 h-4 text-blue-500" /> : <FileText className="w-4 h-4 text-rose-500" />}
                        <span className="truncate font-medium text-slate-800">{l.nama}</span>
                        <span className="text-slate-400 ml-auto shrink-0">{ukuranFile(l.ukuran)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <Link href={`/pic/permintaan/${aktif.id}`} className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:text-blue-900 self-start">
                Buka halaman detail lengkap <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                disabled={aktif.status !== "menunggu"}
                className="px-3.5 py-2 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-40"
                onClick={() => setTolak(aktif)}
              >
                <Ban className="w-4 h-4" /> Tolak
              </button>
              <button
                disabled={aktif.status !== "menunggu"}
                className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-40"
                onClick={() => setTerima(aktif)}
              >
                <Check className="w-4 h-4" /> Terima Permintaan
              </button>
            </div>
          </>
        )}
      </Drawer>

      <TerimaDialog permintaan={terima} onClose={() => setTerima(null)} onDone={() => setReviewId(null)} />
      <TolakDialog permintaan={tolak} onClose={() => setTolak(null)} onDone={() => setReviewId(null)} />
    </>
  );
}
