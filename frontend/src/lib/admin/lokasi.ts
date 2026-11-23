"use client";

/**
 * Data Lokasi (plant dan lantai) untuk halaman Admin, diambil dari API (docs/api-admin.md bagian 4).
 * Server adalah satu-satunya sumber kebenaran: setiap aksi dikirim ke API, lalu daftar dimuat ulang
 * agar angka dan status selalu sama dengan database. Aturan (nama unik, lantai hanya pada plant
 * aktif, tidak dapat dipindah plant) ditegakkan backend dan galatnya ditampilkan apa adanya.
 */

import { useCallback, useEffect, useState } from "react";
import { createLantai, createPlant, getPlants, updateLantai, updatePlant, type LantaiApi, type PlantApi, type StatusMaster } from "@/lib/api/admin";
import { errorMessage, toApiError } from "@/lib/api/errors";

export type StatusLokasi = StatusMaster;
export type Lantai = LantaiApi;
export type Plant = PlantApi;

/** Hasil aksi: sukses, atau pesan galat dari server (422 dan sebagainya). */
export type HasilAksi = { ok: true } | { ok: false; error: string };

export type StatusMuat = "loading" | "ready" | "error";

const sukses: HasilAksi = { ok: true };

/** Pesan galat pertama per field bila 422, selain itu pesan umum. */
function keHasil(error: unknown): HasilAksi {
  const e = toApiError(error);
  const pertama = Object.values(e.errors)[0]?.[0];
  return { ok: false, error: pertama ?? e.message };
}

export function useLokasi() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [status, setStatus] = useState<StatusMuat>("loading");
  const [error, setError] = useState<string | null>(null);
  const [percobaan, setPercobaan] = useState(0);

  // Muat saat dibuka, dan setiap kali "Coba lagi" ditekan.
  useEffect(() => {
    let batal = false;
    getPlants()
      .then((data) => {
        if (batal) return;
        setPlants(data);
        setError(null);
        setStatus("ready");
      })
      .catch((e) => {
        if (batal) return;
        setError(errorMessage(e, "Gagal memuat data lokasi."));
        setStatus("error");
      });
    return () => {
      batal = true;
    };
  }, [percobaan]);

  /** Muat ulang diam-diam setelah perubahan (tanpa layar "memuat"). */
  const segarkan = useCallback(async () => {
    try {
      setPlants(await getPlants());
    } catch {
      /* data lama tetap tampil; perubahan sudah tersimpan di server */
    }
  }, []);

  const jalankan = async (aksi: () => Promise<unknown>): Promise<HasilAksi> => {
    try {
      await aksi();
      await segarkan();
      return sukses;
    } catch (e) {
      return keHasil(e);
    }
  };

  return {
    plants,
    status,
    error,
    coba: () => {
      setStatus("loading");
      setPercobaan((n) => n + 1);
    },
    tambahPlant: (nama: string) => jalankan(() => createPlant(nama.trim())),
    ubahPlant: (id: number, nama: string) => jalankan(() => updatePlant(id, { nama_plant: nama.trim() })),
    setStatusPlant: (id: number, s: StatusLokasi) => jalankan(() => updatePlant(id, { status: s })),
    tambahLantai: (idPlant: number, nama: string) => jalankan(() => createLantai(idPlant, nama.trim())),
    ubahLantai: (idLantai: number, nama: string) => jalankan(() => updateLantai(idLantai, { nama_lantai: nama.trim() })),
    setStatusLantai: (idLantai: number, s: StatusLokasi) => jalankan(() => updateLantai(idLantai, { status: s })),
  };
}
