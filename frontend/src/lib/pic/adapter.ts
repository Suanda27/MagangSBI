/**
 * Penerjemah respons API PIC ke bentuk data UI (lib/pic/types.ts), supaya komponen tampilan
 * tidak perlu mengenal nama field API. Satu-satunya tempat yang tahu kedua bentuk.
 */

import type { BerkasApi, PicDetailApi, PicTiketApi, PrioritasApi, StatusApi } from "@/lib/api/pic";
import type { Lampiran, Permintaan, Prioritas, RiwayatItem, StatusPermintaan } from "./types";

const STATUS: Record<StatusApi, StatusPermintaan> = {
  submitted: "menunggu",
  in_progress: "diproses",
  pending: "pending",
  waiting_review: "menunggu_konfirmasi",
  completed: "selesai",
  rejected: "ditolak",
};

const PRIORITAS: Record<PrioritasApi, Prioritas> = { normal: "Normal", tinggi: "Tinggi", mendesak: "Mendesak" };

function berkas(b: BerkasApi, oleh: Lampiran["oleh"]): Lampiran {
  return {
    id: String(b.id),
    nama: b.nama_file,
    ukuran: b.ukuran_file,
    tipe: b.tipe_file.startsWith("image/") ? "gambar" : "dokumen",
    oleh,
    url: b.url,
  };
}

/** Tiket dari daftar atau dashboard (tanpa riwayat dan lampiran). */
export function dariDaftar(t: PicTiketApi): Permintaan {
  return {
    id: String(t.id),
    kode: t.kode_tiket,
    judul: t.judul,
    deskripsi: t.deskripsi,
    layanan: t.layanan?.nama_layanan ?? "-",
    kategori: t.layanan?.kategori ?? "-",
    pengaju: {
      nama: t.pengaju?.name ?? "-",
      nik: t.pengaju?.nik ?? "-",
      telepon: "",
      jabatan: t.pengaju?.jabatan ?? "-",
      bagian: t.pengaju?.bagian ?? "-",
    },
    plant: t.lokasi.plant ?? "-",
    lantai: t.lokasi.lantai ?? "-",
    lokasiDetail: t.lokasi.detail ?? "",
    diajukan: t.dibuat_pada,
    prioritas: PRIORITAS[t.prioritas],
    status: STATUS[t.status],
    lampiran: [],
    riwayat: [],
    diperbaruiPada: t.diperbarui_pada,
    diterimaPada: t.diterima_pada ?? undefined,
    selesaiPada: t.status === "completed" ? (t.selesai_pada ?? undefined) : undefined,
    jumlahRevisi: 0,
  };
}

function riwayat(r: PicDetailApi["riwayat"][number]): RiwayatItem {
  return {
    id: String(r.id),
    waktu: r.waktu,
    judul: r.judul,
    keterangan: r.keterangan ?? "",
    oleh: r.pelaku,
    status: r.aksi === "submitted" ? "dibuat" : r.aksi === "revision_requested" ? "revisi" : STATUS[r.status],
  };
}

/** Detail lengkap satu tiket. */
export function dariDetail(d: PicDetailApi): Permintaan {
  const dasar = dariDaftar({ ...d, pengaju: undefined });
  const putaranTerakhir = d.hasil_kerja.putaran.at(-1);

  return {
    ...dasar,
    pengaju: {
      nama: d.pengaju?.name ?? "-",
      nik: d.pengaju?.nik ?? "-",
      telepon: d.pengaju?.telepon ?? "-",
      jabatan: d.pengaju?.jabatan ?? "-",
      bagian: d.pengaju?.bagian ?? "-",
    },
    picNama: d.pic?.name,
    lampiran: d.lampiran.map((b) => berkas(b, "pengaju")),
    riwayat: d.riwayat.map(riwayat),
    dikirimPada: d.hasil_kerja.dikirim_pada ?? undefined,
    ditolakPada: d.ditolak_pada ?? undefined,
    alasanTolak: d.alasan_tolak ?? undefined,
    alasanPending: d.alasan_pending ?? undefined,
    alasanRevisi: d.alasan_revisi ?? undefined,
    catatanSelesai: d.hasil_kerja.catatan ?? undefined,
    jumlahRevisi: d.jumlah_revisi,
    // Bukti putaran terakhir yang tampil; putaran lama tetap tersimpan di server.
    buktiSelesai: putaranTerakhir?.berkas.map((b) => berkas(b, "pic")) ?? [],
  };
}
