/**
 * Tipe data tampilan modul PIC. Respons API diterjemahkan ke bentuk ini oleh lib/pic/adapter.ts,
 * sehingga komponen tidak perlu mengenal nama field API.
 */

/** menunggu_konfirmasi = hasil sudah dikirim PIC, menunggu peninjauan karyawan (waiting_review di API). */
export type StatusPermintaan = "menunggu" | "diproses" | "pending" | "menunggu_konfirmasi" | "selesai" | "ditolak";
export type Prioritas = "Mendesak" | "Tinggi" | "Normal";

export interface Lampiran {
  id: string;
  nama: string;
  /** Ukuran dalam byte */
  ukuran: number;
  tipe: "gambar" | "dokumen";
  oleh: "pengaju" | "pic";
  /** Alamat unduh (GET /api/lampiran/{id}); kosong untuk berkas yang belum dikirim. */
  url?: string;
}

export interface RiwayatItem {
  id: string;
  /** ISO 8601 */
  waktu: string;
  judul: string;
  keterangan: string;
  oleh: string;
  status: StatusPermintaan | "dibuat" | "dialokasikan" | "revisi";
}

export interface Pengaju {
  nama: string;
  nik: string;
  telepon: string;
  jabatan: string;
  /** Nama section pengaju, mis. "Assembly". */
  bagian: string;
}

export interface Permintaan {
  /** id numerik dari server (dipakai untuk alamat halaman dan pemanggilan API). */
  id: string;
  /** Nomor tiket untuk ditampilkan, mis. IS-2026-0001. */
  kode: string;
  judul: string;
  deskripsi: string;
  layanan: string;
  kategori: string;
  pengaju: Pengaju;
  plant: string;
  lantai: string;
  lokasiDetail: string;
  diajukan: string;
  prioritas: Prioritas;
  status: StatusPermintaan;
  lampiran: Lampiran[];
  riwayat: RiwayatItem[];
  /** PIC penanggung jawab (hanya ada di detail). */
  picNama?: string;
  /** Terakhir diubah di server. */
  diperbaruiPada?: string;
  diterimaPada?: string;
  /** Waktu PIC mengirim hasil untuk ditinjau (terakhir). */
  dikirimPada?: string;
  /** Waktu karyawan menyetujui atau tiket ditutup otomatis. */
  selesaiPada?: string;
  ditolakPada?: string;
  alasanTolak?: string;
  catatanSelesai?: string;
  alasanPending?: string;
  /** Berapa kali karyawan meminta revisi (tanpa batas). */
  jumlahRevisi: number;
  /** Alasan revisi terakhir dari karyawan (teks, minimal 10 karakter). */
  alasanRevisi?: string;
  /** Berkas hasil kerja putaran terakhir yang dikirim PIC. */
  buktiSelesai?: Lampiran[];
}

export interface ProfilPic {
  nama: string;
  nik: string;
  email: string;
  telepon: string;
  seksi: string;
  jabatan: string;
}
