"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { SEED_PERMINTAAN, STORAGE_KEY } from "./seed";
import { PROFIL_PIC, type Lampiran, type Permintaan, type ProfilPic, type RiwayatItem, type StatusPermintaan } from "./types";

/**
 * Store sisi-klien untuk modul PIC.
 * Setiap aksi di sini sama dengan satu endpoint di PRD (B.5) — ganti isi fungsi dengan axios saat API Laravel siap:
 *   terima   -> POST  /api/pic/permintaan/{id}/accept
 *   tolak    -> POST  /api/pic/permintaan/{id}/reject
 *   ubahStatus -> PATCH /api/pic/permintaan/{id}/status
 *   selesaikan -> POST  /api/pic/permintaan/{id}/selesaikan
 * Data disimpan di localStorage agar perubahan tetap ada setelah refresh.
 */

export type ToastTone = "success" | "error" | "info";
interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  desc?: string;
}

interface PicStore {
  ready: boolean;
  profil: ProfilPic;
  permintaan: Permintaan[];
  ambil: (id: string) => Permintaan | undefined;
  terima: (id: string, catatan?: string) => void;
  tolak: (id: string, alasan: string) => void;
  ubahStatus: (id: string, status: Extract<StatusPermintaan, "diproses" | "pending">, catatan: string) => void;
  selesaikan: (id: string, data: { catatan: string; bukti: Lampiran[] }) => void;
  setProfil: (p: Partial<ProfilPic>) => void;
  resetDemo: () => void;
  toast: (t: Omit<Toast, "id">) => void;
  toasts: Toast[];
  dismissToast: (id: number) => void;
}

const Ctx = createContext<PicStore | null>(null);
const PROFIL_KEY = "ism.pic.profil.v1";

const uid = () => Math.random().toString(36).slice(2, 9);

function tambahRiwayat(p: Permintaan, item: Omit<RiwayatItem, "id" | "waktu">): Permintaan {
  return { ...p, riwayat: [...p.riwayat, { ...item, id: `rw-${uid()}`, waktu: new Date().toISOString() }] };
}

export function PicStoreProvider({ children }: { children: React.ReactNode }) {
  const [permintaan, setPermintaan] = useState<Permintaan[]>(SEED_PERMINTAAN);
  const [profil, setProfilState] = useState<ProfilPic>(PROFIL_PIC);
  const [ready, setReady] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  // Muat data tersimpan setelah mount (menghindari hydration mismatch)
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPermintaan(JSON.parse(raw));
      const pr = localStorage.getItem(PROFIL_KEY);
      if (pr) setProfilState({ ...PROFIL_PIC, ...JSON.parse(pr) });
    } catch {
      /* abaikan data rusak */
    }
    setReady(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(permintaan));
    } catch {
      /* storage penuh/terblokir */
    }
  }, [permintaan, ready]);

  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const toast = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = ++toastId.current;
      setToasts((cur) => [...cur, { ...t, id }]);
      setTimeout(() => dismissToast(id), 4200);
    },
    [dismissToast],
  );

  const ubah = useCallback((id: string, fn: (p: Permintaan) => Permintaan) => {
    setPermintaan((list) => list.map((p) => (p.id === id ? fn(p) : p)));
  }, []);

  const store = useMemo<PicStore>(() => {
    const nama = profil.nama;
    return {
      ready,
      profil,
      permintaan,
      toasts,
      dismissToast,
      toast,
      ambil: (id) => permintaan.find((p) => p.id === id),

      terima: (id, catatan) => {
        ubah(id, (p) =>
          tambahRiwayat(
            { ...p, status: "diproses", diterimaPada: new Date().toISOString(), catatanTriage: catatan?.trim() || undefined },
            { judul: "Permintaan Diterima", keterangan: `Diterima oleh ${nama}. Status berubah menjadi Sedang Diproses.${catatan?.trim() ? ` Catatan: ${catatan.trim()}` : ""}`, oleh: nama, status: "diproses" },
          ),
        );
      },

      tolak: (id, alasan) => {
        ubah(id, (p) =>
          tambahRiwayat(
            { ...p, status: "ditolak", ditolakPada: new Date().toISOString(), alasanTolak: alasan.trim() },
            { judul: "Permintaan Ditolak", keterangan: alasan.trim(), oleh: nama, status: "ditolak" },
          ),
        );
      },

      ubahStatus: (id, status, catatan) => {
        ubah(id, (p) =>
          tambahRiwayat(
            { ...p, status, alasanPending: status === "pending" ? catatan.trim() : undefined },
            status === "pending"
              ? { judul: "Pengerjaan Ditunda (Pending)", keterangan: catatan.trim(), oleh: nama, status }
              : { judul: "Pengerjaan Dilanjutkan", keterangan: catatan.trim() || "Pengerjaan dilanjutkan kembali oleh PIC.", oleh: nama, status },
          ),
        );
      },

      selesaikan: (id, { catatan, bukti }) => {
        ubah(id, (p) =>
          tambahRiwayat(
            { ...p, status: "selesai", selesaiPada: new Date().toISOString(), catatanSelesai: catatan.trim() || undefined, buktiSelesai: bukti, alasanPending: undefined },
            { judul: "Permintaan Selesai", keterangan: catatan.trim() || `Pengerjaan selesai dengan ${bukti.length} bukti terlampir.`, oleh: nama, status: "selesai" },
          ),
        );
      },

      setProfil: (p) => {
        setProfilState((cur) => {
          const next = { ...cur, ...p };
          try {
            localStorage.setItem(PROFIL_KEY, JSON.stringify(next));
          } catch {
            /* abaikan */
          }
          return next;
        });
      },

      resetDemo: () => setPermintaan(SEED_PERMINTAAN),
    };
  }, [permintaan, profil, ready, toasts, toast, dismissToast, ubah]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function usePicStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePicStore harus dipakai di dalam PicStoreProvider");
  return ctx;
}

/** Ringkasan angka per status, dipakai sidebar, dashboard, dan laporan. */
export function useRingkasan() {
  const { permintaan } = usePicStore();
  return useMemo(() => {
    const hitung = (s: StatusPermintaan) => permintaan.filter((p) => p.status === s).length;
    const menunggu = hitung("menunggu");
    const diproses = hitung("diproses");
    const pending = hitung("pending");
    const selesai = hitung("selesai");
    const ditolak = hitung("ditolak");
    return { total: permintaan.length, menunggu, diproses, pending, selesai, ditolak, aktif: diproses + pending };
  }, [permintaan]);
}
