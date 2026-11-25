"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  getDaftarPic,
  getDashboardPic,
  kirimHasilTiket,
  terimaTiket,
  tolakTiket,
  ubahStatusTiket,
  type DashboardPicApi,
  type PicDetailApi,
} from "@/lib/api/pic";
import { errorMessage } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth/auth-context";
import { dariDaftar, dariDetail } from "./adapter";
import type { Permintaan, ProfilPic } from "./types";

/**
 * Store modul PIC, didukung API Laravel (docs/api-pic.md).
 *
 * - Hitungan kartu (antrean, diproses, selesai, ...) dari GET /api/pic/dashboard, selalu akurat.
 * - Daftar tiket dari GET /api/pic/permintaan untuk tiga tab, masing-masing dimuat sampai 50 tiket terbaru.
 * - Setiap aksi memanggil endpoint lalu memuat ulang; kegagalan (403/409/422) dilempar ke pemanggil
 *   agar dialog bisa menampilkan pesan server apa adanya.
 * - Data dimuat ulang tiap 30 detik dan saat tab browser aktif kembali (antrean dipakai bersama PIC lain).
 */

export type ToastTone = "success" | "error" | "info";
interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  desc?: string;
}

export interface Ringkasan {
  total: number;
  menunggu: number;
  diproses: number;
  pending: number;
  konfirmasi: number;
  selesai: number;
  ditolak: number;
  aktif: number;
}

const RINGKASAN_AWAL: Ringkasan = { total: 0, menunggu: 0, diproses: 0, pending: 0, konfirmasi: 0, selesai: 0, ditolak: 0, aktif: 0 };

interface PicStore {
  /** true setelah pemuatan pertama selesai (berhasil atau gagal). */
  ready: boolean;
  /** Pesan galat pemuatan terakhir; null bila lancar. */
  galat: string | null;
  profil: ProfilPic;
  ringkasan: Ringkasan;
  permintaan: Permintaan[];
  muat: () => Promise<void>;
  ambil: (id: string) => Permintaan | undefined;
  /** Aksi di bawah mengembalikan detail terbaru; melempar ApiError bila gagal. */
  terima: (id: string, catatan?: string) => Promise<Permintaan>;
  tolak: (id: string, alasan: string) => Promise<Permintaan>;
  ubahStatus: (id: string, status: "diproses" | "pending", catatan: string) => Promise<Permintaan>;
  kirimHasil: (id: string, data: { catatan: string; bukti: File[] }) => Promise<Permintaan>;
  toast: (t: Omit<Toast, "id">) => void;
  toasts: Toast[];
  dismissToast: (id: number) => void;
}

const Ctx = createContext<PicStore | null>(null);

const hitung = (d: DashboardPicApi): Ringkasan => {
  const aktif = d.sedang_diproses + d.pending + d.menunggu_konfirmasi;
  return {
    menunggu: d.antrean,
    diproses: d.sedang_diproses,
    pending: d.pending,
    konfirmasi: d.menunggu_konfirmasi,
    selesai: d.selesai,
    ditolak: d.ditolak,
    aktif,
    total: d.antrean + aktif + d.selesai + d.ditolak,
  };
};

export function PicStoreProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [permintaan, setPermintaan] = useState<Permintaan[]>([]);
  const [ringkasan, setRingkasan] = useState<Ringkasan>(RINGKASAN_AWAL);
  const [ready, setReady] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const toast = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = ++toastId.current;
      setToasts((cur) => [...cur, { ...t, id }]);
      setTimeout(() => dismissToast(id), 4200);
    },
    [dismissToast],
  );

  const muat = useCallback(async () => {
    try {
      const [dash, masuk, proses, selesai] = await Promise.all([
        getDashboardPic(),
        getDaftarPic("masuk"),
        getDaftarPic("diproses"),
        getDaftarPic("selesai"),
      ]);
      setRingkasan(hitung(dash));
      setPermintaan([...masuk.data, ...proses.data, ...selesai.data].map(dariDaftar));
      setGalat(null);
    } catch (e) {
      setGalat(errorMessage(e, "Gagal memuat permintaan."));
    } finally {
      setReady(true);
    }
  }, []);

  // Muat saat masuk, lalu segarkan berkala dan saat tab aktif kembali.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- muat() mengubah state hanya setelah respons API
    void muat();
    const tiap = setInterval(() => {
      if (document.visibilityState === "visible") void muat();
    }, 30_000);
    const saatAktif = () => {
      if (document.visibilityState === "visible") void muat();
    };
    document.addEventListener("visibilitychange", saatAktif);
    return () => {
      clearInterval(tiap);
      document.removeEventListener("visibilitychange", saatAktif);
    };
  }, [muat]);

  const setelahAksi = useCallback(
    async (detail: PicDetailApi) => {
      await muat();
      return dariDetail(detail);
    },
    [muat],
  );

  const profil = useMemo<ProfilPic>(
    () => ({
      nama: user?.name ?? "PIC",
      nik: user?.nik ?? "-",
      email: user?.email ?? "-",
      telepon: user?.telepon ?? "-",
      seksi: user?.bagian?.nama_bagian ?? "-",
      jabatan: user?.jabatan ?? "PIC",
    }),
    [user],
  );

  const store = useMemo<PicStore>(
    () => ({
      ready,
      galat,
      profil,
      ringkasan,
      permintaan,
      toasts,
      dismissToast,
      toast,
      muat,
      ambil: (id) => permintaan.find((p) => p.id === id),
      terima: async (id, catatan) => setelahAksi(await terimaTiket(id, catatan)),
      tolak: async (id, alasan) => setelahAksi(await tolakTiket(id, alasan)),
      ubahStatus: async (id, status, catatan) => setelahAksi(await ubahStatusTiket(id, status === "pending" ? "pending" : "in_progress", catatan)),
      kirimHasil: async (id, { catatan, bukti }) => setelahAksi(await kirimHasilTiket(id, bukti, catatan)),
    }),
    [ready, galat, profil, ringkasan, permintaan, toasts, toast, dismissToast, muat, setelahAksi],
  );

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function usePicStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePicStore harus dipakai di dalam PicStoreProvider");
  return ctx;
}

/** Ringkasan angka per status (dari server), dipakai sidebar, dashboard, dan profil. */
export function useRingkasan(): Ringkasan {
  return usePicStore().ringkasan;
}
