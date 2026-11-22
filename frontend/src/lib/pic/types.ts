/**
 * Tipe data modul PIC. Bentuknya mengikuti entitas ERD (permintaan, riwayat_permintaan, lampiran)
 * sehingga saat endpoint Laravel siap, cukup mengganti store (lib/pic/store.tsx) dengan pemanggilan API.
 */

export type StatusPermintaan = "menunggu" | "diproses" | "pending" | "selesai" | "ditolak";
export type Prioritas = "Mendesak" | "Tinggi" | "Normal";
export type KodeBagian = "ASM" | "HR" | "IS" | "PE" | "GA";

export interface Lampiran {
  id: string;
  nama: string;
  /** Ukuran dalam byte */
  ukuran: number;
  tipe: "gambar" | "dokumen";
  oleh: "pengaju" | "pic";
}

export interface RiwayatItem {
  id: string;
  /** ISO 8601 */
  waktu: string;
  judul: string;
  keterangan: string;
  oleh: string;
  status: StatusPermintaan | "dibuat" | "dialokasikan";
}

export interface Pengaju {
  nama: string;
  nik: string;
  email: string;
  telepon: string;
  jabatan: string;
  bagian: KodeBagian;
}

export interface Permintaan {
  id: string;
  judul: string;
  deskripsi: string;
  layanan: string;
  kategori: string;
  pengaju: Pengaju;
  plant: string;
  lantai: string;
  lokasiDetail: string;
  diajukan: string;
  slaDeadline: string;
  prioritas: Prioritas;
  status: StatusPermintaan;
  lampiran: Lampiran[];
  riwayat: RiwayatItem[];
  diterimaPada?: string;
  selesaiPada?: string;
  ditolakPada?: string;
  alasanTolak?: string;
  catatanTriage?: string;
  catatanSelesai?: string;
  alasanPending?: string;
  buktiSelesai?: Lampiran[];
}

export const NAMA_BAGIAN: Record<KodeBagian, string> = {
  ASM: "Assembly",
  HR: "Human Resource",
  IS: "Information System",
  PE: "Production Engineering",
  GA: "General Affairs",
};

export interface ProfilPic {
  nama: string;
  nik: string;
  email: string;
  telepon: string;
  seksi: string;
  jabatan: string;
}

export const PROFIL_PIC: ProfilPic = {
  nama: "Budi Santoso",
  nik: "21008841",
  email: "budi.santoso@sbi.co.id",
  telepon: "+62 812-7788-4521",
  seksi: "Information System",
  jabatan: "PIC IT & Automation",
};
