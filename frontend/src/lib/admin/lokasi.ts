"use client";

/**
 * Data Lokasi (plant dan lantai) untuk halaman Admin. Bentuknya mengikuti kontrak API
 * (docs/api-admin.md bagian 4) sehingga saat disambungkan, cukup mengganti isi aksi di hook
 * `useLokasi` dengan pemanggilan axios:
 *   tambahPlant    -> POST  /api/admin/plants
 *   ubahPlant      -> PATCH /api/admin/plants/{id}      (nama_plant)
 *   setStatusPlant -> PATCH /api/admin/plants/{id}      (status)
 *   tambahLantai   -> POST  /api/admin/lantais
 *   ubahLantai     -> PATCH /api/admin/lantais/{id}     (nama_lantai)
 *   setStatusLantai-> PATCH /api/admin/lantais/{id}     (status)
 * Selama endpoint belum tersambung, data disimpan di localStorage.
 *
 * Aturan yang sama dengan backend: nama plant unik; nama lantai unik di dalam satu plant; lantai hanya
 * dapat ditambah pada plant aktif; lantai tidak dapat dipindah antar plant; data dinonaktifkan, tidak dihapus.
 */

import { useEffect, useState } from "react";

export type StatusLokasi = "aktif" | "nonaktif";

export interface Lantai {
  id: number;
  nama_lantai: string;
  id_plant: number;
  status: StatusLokasi;
}

export interface Plant {
  id: number;
  nama_plant: string;
  status: StatusLokasi;
  lantais: Lantai[];
}

/** Hasil aksi: sukses, atau pesan galat seperti respons 422 dari server. */
export type HasilAksi = { ok: true } | { ok: false; error: string };

const lantai = (id: number, id_plant: number, nama_lantai: string): Lantai => ({ id, nama_lantai, id_plant, status: "aktif" });

/** Data awal sama dengan LokasiSeeder di backend. */
export const SEED_LOKASI: Plant[] = [
  { id: 1, nama_plant: "Plant 1", status: "aktif", lantais: [lantai(1, 1, "Lantai 1"), lantai(2, 1, "Lantai 2"), lantai(3, 1, "Lantai 3")] },
  { id: 2, nama_plant: "Plant 2", status: "aktif", lantais: [lantai(4, 2, "Lantai 1"), lantai(5, 2, "Lantai 2"), lantai(6, 2, "Lantai 3")] },
  { id: 3, nama_plant: "Plant 3", status: "aktif", lantais: [lantai(7, 3, "Lantai 1"), lantai(8, 3, "Lantai 2")] },
];

const STORAGE_KEY = "ism.admin.lokasi.v1";
const MAKS_NAMA = 255;

const rapikan = (s: string) => s.trim().replace(/\s+/g, " ");
const sama = (a: string, b: string) => rapikan(a).toLowerCase() === rapikan(b).toLowerCase();

const gagal = (error: string): HasilAksi => ({ ok: false, error });
const sukses: HasilAksi = { ok: true };

function validasiNama(nama: string, jenis: "plant" | "lantai"): string | null {
  const n = rapikan(nama);
  if (n === "") return `Nama ${jenis} wajib diisi.`;
  if (n.length > MAKS_NAMA) return `Nama ${jenis} maksimal ${MAKS_NAMA} karakter.`;
  return null;
}

export function useLokasi() {
  const [plants, setPlants] = useState<Plant[]>(SEED_LOKASI);
  const [ready, setReady] = useState(false);

  // Muat data tersimpan setelah mount (menghindari hydration mismatch)
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPlants(JSON.parse(raw) as Plant[]);
    } catch {
      /* abaikan data rusak */
    }
    setReady(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plants));
    } catch {
      /* storage penuh/terblokir */
    }
  }, [plants, ready]);

  const ubahPlants = (fn: (list: Plant[]) => Plant[]) => setPlants((cur) => fn(cur));

  const tambahPlant = (nama: string): HasilAksi => {
    const salah = validasiNama(nama, "plant");
    if (salah) return gagal(salah);
    if (plants.some((p) => sama(p.nama_plant, nama))) return gagal("Nama plant ini sudah dipakai.");
    const id = Math.max(0, ...plants.map((p) => p.id)) + 1;
    ubahPlants((l) => [...l, { id, nama_plant: rapikan(nama), status: "aktif", lantais: [] }]);
    return sukses;
  };

  const ubahPlant = (id: number, nama: string): HasilAksi => {
    const salah = validasiNama(nama, "plant");
    if (salah) return gagal(salah);
    if (plants.some((p) => p.id !== id && sama(p.nama_plant, nama))) return gagal("Nama plant ini sudah dipakai.");
    ubahPlants((l) => l.map((p) => (p.id === id ? { ...p, nama_plant: rapikan(nama) } : p)));
    return sukses;
  };

  const setStatusPlant = (id: number, status: StatusLokasi) => {
    ubahPlants((l) => l.map((p) => (p.id === id ? { ...p, status } : p)));
  };

  const tambahLantai = (idPlant: number, nama: string): HasilAksi => {
    const plant = plants.find((p) => p.id === idPlant);
    if (!plant || plant.status !== "aktif") return gagal("Plant yang dipilih tidak tersedia atau tidak aktif.");
    const salah = validasiNama(nama, "lantai");
    if (salah) return gagal(salah);
    if (plant.lantais.some((x) => sama(x.nama_lantai, nama))) return gagal("Lantai dengan nama ini sudah ada pada plant tersebut.");
    const id = Math.max(0, ...plants.flatMap((p) => p.lantais.map((x) => x.id))) + 1;
    ubahPlants((l) => l.map((p) => (p.id === idPlant ? { ...p, lantais: [...p.lantais, { id, nama_lantai: rapikan(nama), id_plant: idPlant, status: "aktif" }] } : p)));
    return sukses;
  };

  const ubahLantai = (idPlant: number, idLantai: number, nama: string): HasilAksi => {
    const plant = plants.find((p) => p.id === idPlant);
    if (!plant) return gagal("Plant tidak ditemukan.");
    const salah = validasiNama(nama, "lantai");
    if (salah) return gagal(salah);
    if (plant.lantais.some((x) => x.id !== idLantai && sama(x.nama_lantai, nama))) return gagal("Lantai dengan nama ini sudah ada pada plant tersebut.");
    ubahPlants((l) => l.map((p) => (p.id === idPlant ? { ...p, lantais: p.lantais.map((x) => (x.id === idLantai ? { ...x, nama_lantai: rapikan(nama) } : x)) } : p)));
    return sukses;
  };

  const setStatusLantai = (idPlant: number, idLantai: number, status: StatusLokasi) => {
    ubahPlants((l) => l.map((p) => (p.id === idPlant ? { ...p, lantais: p.lantais.map((x) => (x.id === idLantai ? { ...x, status } : x)) } : p)));
  };

  return { plants, ready, tambahPlant, ubahPlant, setStatusPlant, tambahLantai, ubahLantai, setStatusLantai, reset: () => setPlants(SEED_LOKASI) };
}
