"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, BellOff, CheckCheck } from "lucide-react";
import { getNotifikasi, tandaiDibaca, type NotifikasiApi } from "@/lib/api/notifikasi";
import { tanggalJam } from "@/lib/shared/format";

/**
 * Lonceng notifikasi dalam aplikasi, dipakai semua peran.
 * Data dari GET /api/notifikasi dan disegarkan tiap 30 detik serta saat tab aktif kembali.
 * `hrefTiket` menentukan halaman detail tiket menurut peran, mis. (id) => `/pic/permintaan/${id}`.
 */
export default function NotifikasiBell({ hrefTiket }: { hrefTiket: (idPermintaan: number) => string }) {
  const [buka, setBuka] = useState(false);
  const [daftar, setDaftar] = useState<NotifikasiApi[]>([]);
  const [belumDibaca, setBelumDibaca] = useState(0);
  const [siap, setSiap] = useState(false);
  const [galat, setGalat] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  const muat = useCallback(async () => {
    try {
      const hasil = await getNotifikasi(10);
      setDaftar(hasil.data);
      setBelumDibaca(hasil.belum_dibaca);
      setGalat(false);
    } catch {
      setGalat(true); // lonceng tidak boleh mengganggu halaman bila server tidak terjangkau
    } finally {
      setSiap(true);
    }
  }, []);

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

  // Tutup saat klik di luar atau tekan Escape.
  useEffect(() => {
    if (!buka) return;
    const diKlik = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setBuka(false);
    };
    const diTombol = (e: KeyboardEvent) => {
      if (e.key === "Escape") setBuka(false);
    };
    document.addEventListener("mousedown", diKlik);
    document.addEventListener("keydown", diTombol);
    return () => {
      document.removeEventListener("mousedown", diKlik);
      document.removeEventListener("keydown", diTombol);
    };
  }, [buka]);

  const bukaNotifikasi = async (n: NotifikasiApi) => {
    setBuka(false);
    if (n.dibaca) return;
    // Tampil terbaca seketika; bila server gagal, hitungan dikembalikan oleh muat() berikutnya.
    setDaftar((cur) => cur.map((x) => (x.id === n.id ? { ...x, dibaca: true } : x)));
    setBelumDibaca((c) => Math.max(0, c - 1));
    try {
      setBelumDibaca(await tandaiDibaca({ ids: [n.id] }));
    } catch {
      void muat();
    }
  };

  const bacaSemua = async () => {
    setDaftar((cur) => cur.map((x) => ({ ...x, dibaca: true })));
    setBelumDibaca(0);
    try {
      setBelumDibaca(await tandaiDibaca({ semua: true }));
    } catch {
      void muat();
    }
  };

  return (
    <div ref={wrap} className="relative">
      <button
        type="button"
        aria-label={belumDibaca > 0 ? `Notifikasi, ${belumDibaca} belum dibaca` : "Notifikasi"}
        aria-expanded={buka}
        onClick={() => setBuka((v) => !v)}
        className="fx-bell relative p-2 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-all duration-300 active:scale-90"
      >
        <Bell className="w-5 h-5" />
        {belumDibaca > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-semibold flex items-center justify-center ring-2 ring-white tabular-nums">
            {belumDibaca > 9 ? "9+" : belumDibaca}
          </span>
        )}
      </button>

      {buka && (
        <div className="ui-modal absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-2">
            <span className="text-[13px] font-semibold text-slate-900">Notifikasi</span>
            {belumDibaca > 0 ? (
              <button onClick={bacaSemua} className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 hover:text-blue-900">
                <CheckCheck className="w-3.5 h-3.5" /> Tandai semua dibaca
              </button>
            ) : (
              <span className="text-[11px] text-slate-400">Semua sudah dibaca</span>
            )}
          </div>

          {galat && daftar.length === 0 ? (
            <p className="px-4 py-6 text-xs text-rose-600 text-center">Notifikasi tidak dapat dimuat. Coba lagi nanti.</p>
          ) : !siap ? (
            <p className="px-4 py-6 text-xs text-slate-500 text-center">Memuat...</p>
          ) : daftar.length === 0 ? (
            <div className="px-4 py-8 flex flex-col items-center gap-2 text-center">
              <BellOff className="w-6 h-6 text-slate-300" />
              <p className="text-xs text-slate-500">Belum ada notifikasi.</p>
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {daftar.map((n) => {
                const isi = (
                  <>
                    <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.dibaca ? "bg-transparent" : "bg-blue-600"}`} />
                    <span className="min-w-0">
                      <span className={`block text-xs ${n.dibaca ? "font-medium text-slate-600" : "font-semibold text-slate-900"}`}>{n.judul}</span>
                      <span className="block text-[11.5px] text-slate-500 leading-snug mt-0.5">{n.pesan}</span>
                      <span className="block text-[10.5px] text-slate-400 mt-1">{tanggalJam(n.dibuat_pada)}</span>
                    </span>
                  </>
                );
                const kelas = `flex gap-3 px-4 py-3 text-left w-full transition-colors hover:bg-blue-50/50 ${n.dibaca ? "" : "bg-blue-50/30"}`;
                return (
                  <li key={n.id}>
                    {n.id_permintaan ? (
                      <Link href={hrefTiket(n.id_permintaan)} onClick={() => void bukaNotifikasi(n)} className={kelas}>
                        {isi}
                      </Link>
                    ) : (
                      <button type="button" onClick={() => void bukaNotifikasi(n)} className={kelas}>
                        {isi}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
