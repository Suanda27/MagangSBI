"use client";

import { useEffect, useState } from "react";
import type { Halaman } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/errors";

/** Nilai yang "menyusul" setelah jeda, supaya kotak pencarian tidak memanggil server di setiap ketukan. */
export function useDebounced<T>(nilai: T, ms = 400): T {
  const [v, setV] = useState(nilai);
  useEffect(() => {
    const t = setTimeout(() => setV(nilai), ms);
    return () => clearTimeout(t);
  }, [nilai, ms]);
  return v;
}

type Muat<H> = { kunci: string; data: H | null; error: string | null };

/**
 * Memuat satu halaman daftar dari API. `kunci` mewakili semua parameter (filter, halaman, penyegar):
 * saat berubah, permintaan baru dikirim dan `memuat` bernilai true sampai hasilnya tiba.
 * Data lama tetap tersedia selama memuat supaya tabel tidak berkedip.
 * Tipe respons dipertahankan utuh, sehingga field tambahan (mis. `ringkasan`) tetap bertipe.
 */
export function useDaftar<H extends Halaman<unknown>>(ambil: () => Promise<H>, kunci: string, pesanGalat = "Gagal memuat data.") {
  const [muat, setMuat] = useState<Muat<H>>({ kunci: "", data: null, error: null });

  useEffect(() => {
    let batal = false;
    ambil()
      .then((data) => {
        if (!batal) setMuat({ kunci, data, error: null });
      })
      .catch((e) => {
        if (!batal) setMuat({ kunci, data: null, error: errorMessage(e, pesanGalat) });
      });
    return () => {
      batal = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kunci]);

  const memuat = muat.kunci !== kunci;
  return { data: muat.data, error: memuat ? null : muat.error, memuat };
}
