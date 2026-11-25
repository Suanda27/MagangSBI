"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Printer, Link2, Eye, FileText, Image as ImageIcon, Download, MapPin, CalendarDays, CheckCircle2, User, Phone, FileSearch, RotateCcw, Ban } from "lucide-react";
import { Avatar } from "@/components/shared/display";
import { PrioritasTiketBadge, StatusTiketBadge } from "@/components/shared/status-badge";
import { getDetailTiketAdmin } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/errors";
import type { BerkasApi, PicDetailApi } from "@/lib/api/pic";
import { tanggalJam, ukuranFile } from "@/lib/shared/format";

function Berkas({ items, kosong }: { items: BerkasApi[]; kosong: string }) {
  if (items.length === 0) return <p className="text-sm text-slate-400">{kosong}</p>;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map((b) => {
        const gambar = b.tipe_file.startsWith("image/");
        return (
          <a key={b.id} href={b.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${gambar ? "bg-slate-200 text-slate-500" : "bg-rose-100 text-rose-600"}`}>
              {gambar ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900 truncate">{b.nama_file}</p>
              <p className="text-xs text-slate-400">{ukuranFile(b.ukuran_file)} • {gambar ? "Gambar" : "PDF"}</p>
            </div>
            <Download className="w-[18px] h-[18px] text-slate-400" />
          </a>
        );
      })}
    </div>
  );
}

export default function DetailPermintaanAdminPage() {
  const { id } = useParams<{ id: string }>();
  const [p, setP] = useState<PicDetailApi | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [tersalin, setTersalin] = useState(false);

  useEffect(() => {
    let batal = false;
    getDetailTiketAdmin(id)
      .then((d) => {
        if (!batal) setP(d);
      })
      .catch((e) => {
        if (!batal) setGalat(errorMessage(e, "Gagal memuat permintaan."));
      });
    return () => {
      batal = true;
    };
  }, [id]);

  const salinTautan = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setTersalin(true);
      setTimeout(() => setTersalin(false), 2000);
    } catch {
      /* clipboard diblokir browser: abaikan */
    }
  };

  if (!p) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 flex flex-col items-center text-center gap-3">
        <FileSearch className="w-10 h-10 text-slate-300" />
        <h1 className="text-lg font-semibold text-slate-900">{galat ? "Permintaan tidak dapat dibuka" : "Memuat permintaan..."}</h1>
        {galat && <p className="text-sm text-slate-500">{galat}</p>}
        <Link href="/admin/permintaan" className="text-sm font-medium text-blue-700 hover:text-blue-900 inline-flex items-center gap-1.5"><ArrowLeft className="w-4 h-4" /> Kembali ke Semua Permintaan</Link>
      </div>
    );
  }

  const putaran = p.hasil_kerja.putaran;
  const terakhirDiubah = p.riwayat.at(-1);

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Link href="/admin/permintaan" className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Semua Permintaan
        </Link>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Detail Permintaan</h1>
              <span className="text-sm text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">#{p.kode_tiket}</span>
              <StatusTiketBadge status={p.status} />
              <PrioritasTiketBadge prioritas={p.prioritas} />
              {p.jumlah_revisi > 0 && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border bg-amber-50 border-amber-200 text-amber-800">
                  <RotateCcw className="w-3.5 h-3.5" /> Revisi ke-{p.jumlah_revisi}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 flex items-center flex-wrap gap-2">
              <span>Dibuat pada {tanggalJam(p.dibuat_pada)} WIB</span>
              {terakhirDiubah && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                  <span>Terakhir: {terakhirDiubah.judul} oleh {terakhirDiubah.pelaku}</span>
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button onClick={() => window.print()} className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-medium rounded-lg transition-colors">
              <Printer className="w-[18px] h-[18px]" /> Cetak
            </button>
            <button onClick={salinTautan} className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-medium rounded-lg transition-colors">
              <Link2 className="w-[18px] h-[18px]" /> {tersalin ? "Tersalin" : "Salin Tautan"}
            </button>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3 px-4 py-3 bg-blue-50/60 rounded-lg text-blue-900">
          <Eye className="w-5 h-5 text-blue-700 shrink-0" />
          <p className="text-sm flex-1">
            <strong className="font-semibold">Mode Monitoring Admin:</strong> Hak operasional pemrosesan tiket dipegang oleh PIC penanggung jawab. Perubahan status hanya dapat dilakukan oleh PIC dan karyawan pengaju.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-200 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">Informasi Permintaan</h2>
              <span className="text-xs px-2.5 py-1 rounded bg-slate-100 text-slate-500">Kategori: {p.layanan?.kategori ?? "-"}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div>
                <span className="text-xs text-slate-400 block mb-1">Nomor Tiket</span>
                <span className="font-semibold text-slate-900">#{p.kode_tiket}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-1">Layanan</span>
                <span className="font-semibold text-blue-700">{p.layanan?.nama_layanan ?? "-"}</span>
              </div>
              <div className="md:col-span-2">
                <span className="text-xs text-slate-400 block mb-1">Judul Permintaan</span>
                <h3 className="text-base font-semibold text-slate-900">{p.judul}</h3>
              </div>
              <div className="md:col-span-2">
                <span className="text-xs text-slate-400 block mb-1">Deskripsi Lengkap</span>
                <div className="p-4 rounded-lg bg-slate-50 text-slate-800 leading-relaxed whitespace-pre-line">{p.deskripsi}</div>
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-1">Lokasi</span>
                <div className="flex items-center gap-1.5 text-slate-900">
                  <MapPin className="w-[18px] h-[18px] text-blue-700" />
                  {p.lokasi.plant ?? "-"} — {p.lokasi.lantai ?? "-"}{p.lokasi.detail ? ` (${p.lokasi.detail})` : ""}
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-1">Tanggal Pengajuan</span>
                <div className="flex items-center gap-1.5 text-slate-900"><CalendarDays className="w-[18px] h-[18px] text-slate-400" /> {tanggalJam(p.dibuat_pada)} WIB</div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-3">
              <span className="text-xs text-slate-500 block">Lampiran dari Pengaju ({p.lampiran.length} berkas)</span>
              <Berkas items={p.lampiran} kosong="Pengaju tidak melampirkan berkas." />
            </div>
          </div>

          {p.status === "rejected" && (
            <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-6">
              <h2 className="text-sm font-semibold text-rose-800 flex items-center gap-2"><Ban className="w-4 h-4" /> Permintaan Ditolak</h2>
              <p className="text-sm text-rose-900/80 mt-2 leading-relaxed">{p.alasan_tolak}</p>
            </div>
          )}

          {p.alasan_pending && p.status === "pending" && (
            <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-6">
              <h2 className="text-sm font-semibold text-violet-800">Alasan Ditunda (Pending)</h2>
              <p className="text-sm text-violet-900/80 mt-2 leading-relaxed">{p.alasan_pending}</p>
            </div>
          )}

          <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-200 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">Hasil Penyelesaian Layanan</h2>
              <StatusTiketBadge status={p.status} />
            </div>
            {putaran.length === 0 ? (
              <p className="text-sm text-slate-500">Catatan penyelesaian dan bukti kerja muncul di sini setelah PIC mengirim hasil untuk ditinjau.</p>
            ) : (
              <>
                {p.hasil_kerja.catatan && <p className="text-sm text-slate-700 leading-relaxed rounded-lg bg-emerald-50/60 border border-emerald-100 p-3.5">{p.hasil_kerja.catatan}</p>}
                {p.hasil_kerja.dikirim_pada && <p className="text-xs text-slate-400">Dikirim terakhir {tanggalJam(p.hasil_kerja.dikirim_pada)} WIB</p>}
                {[...putaran].reverse().map((r) => (
                  <div key={r.putaran} className="space-y-2">
                    <span className="text-xs font-semibold text-slate-600 block">Pengiriman ke-{r.putaran} ({r.berkas.length} berkas)</span>
                    <Berkas items={r.berkas} kosong="Tidak ada berkas." />
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2"><User className="w-[18px] h-[18px] text-blue-700" /> Informasi Pengaju</h3>
              <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500">Karyawan</span>
            </div>
            <div className="flex items-center gap-4">
              <Avatar nama={p.pengaju?.name ?? "-"} size="lg" />
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-slate-900 truncate">{p.pengaju?.name ?? "-"}</h4>
                <p className="text-xs text-slate-500">NIK: {p.pengaju?.nik ?? "-"}</p>
                {p.pengaju?.jabatan && <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">{p.pengaju.jabatan}</span>}
              </div>
            </div>
            <div className="space-y-2.5 pt-2 border-t border-slate-100 text-sm">
              <div className="flex justify-between gap-3"><span className="text-xs text-slate-400">Section</span><span className="font-medium text-slate-900 text-right">{p.pengaju?.bagian ?? "-"}</span></div>
              <div className="flex justify-between gap-3"><span className="text-xs text-slate-400">Telepon</span><span className="font-medium text-slate-900">{p.pengaju?.telepon ?? "-"}</span></div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2"><Phone className="w-[18px] h-[18px] text-blue-700" /> PIC Penanggung Jawab</h3>
            </div>
            {p.pic ? (
              <div className="flex items-center gap-4">
                <Avatar nama={p.pic.name} size="lg" />
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-slate-900 truncate">{p.pic.name}</h4>
                  <p className="text-xs text-blue-700 font-medium">Section {p.bagian?.nama_bagian ?? "-"}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Belum ada PIC yang mengambil tiket ini. Tiket menunggu di antrean section <span className="font-medium text-slate-700">{p.bagian?.nama_bagian ?? "-"}</span>.</p>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-5">
            <h3 className="text-base font-semibold text-slate-900 pb-3 border-b border-slate-100">Timeline Proses</h3>
            <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
              {[...p.riwayat].reverse().map((r, i) => (
                <div key={r.id} className="relative">
                  <div className={`absolute -left-6 top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-sm ${i === 0 ? "bg-blue-100 text-blue-700 ring-4 ring-blue-50" : "bg-blue-700 text-white"}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <p className={`text-sm font-semibold ${i === 0 ? "text-blue-700" : "text-slate-900"}`}>{r.judul}</p>
                  <p className="text-xs text-slate-500">{tanggalJam(r.waktu)} WIB · {r.pelaku}</p>
                  {r.keterangan && <p className="text-xs text-slate-400 mt-0.5">{r.keterangan}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
