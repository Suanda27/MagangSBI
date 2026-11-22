"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, Inbox, RefreshCw, Search, X } from "lucide-react";
import { Avatar, EmptyState } from "@/components/shared/display";
import { Pagination } from "@/components/shared/pagination";
import { SelectField } from "@/components/shared/form-controls";
import { PrioritasBadge, StatusBadge } from "./primitives";
import { kunciHari, tanggalJam, useNow } from "@/lib/shared/format";
import { infoSla, SLA_TONE } from "@/lib/pic/format";
import { NAMA_BAGIAN, type KodeBagian, type Permintaan, type StatusPermintaan } from "@/lib/pic/types";

/* ---------- Filter ---------- */

export type Rentang = "semua" | "hari" | "minggu" | "bulan";

export interface FilterState {
  q: string;
  status: string;
  layanan: string;
  bagian: string;
  plant: string;
  rentang: Rentang;
}

const AWAL: FilterState = { q: "", status: "", layanan: "", bagian: "", plant: "", rentang: "semua" };

export function useFilter(data: Permintaan[]) {
  const [f, setF] = useState<FilterState>(AWAL);
  const now = useNow(60_000);
  const set = <K extends keyof FilterState>(k: K, v: FilterState[K]) => setF((c) => ({ ...c, [k]: v }));

  const hasil = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    const ref = now;
    return data.filter((p) => {
      if (q && !`${p.id} ${p.judul} ${p.pengaju.nama} ${p.pengaju.nik} ${p.layanan}`.toLowerCase().includes(q)) return false;
      if (f.status && p.status !== f.status) return false;
      if (f.layanan && p.layanan !== f.layanan) return false;
      if (f.bagian && p.pengaju.bagian !== f.bagian) return false;
      if (f.plant && p.plant !== f.plant) return false;
      if (f.rentang !== "semua" && ref !== null) {
        const diff = ref - new Date(p.diajukan).getTime();
        const batas = f.rentang === "hari" ? 1 : f.rentang === "minggu" ? 7 : 31;
        if (f.rentang === "hari" ? kunciHari(p.diajukan) !== kunciHari(new Date(ref)) : diff > batas * 86400_000) return false;
      }
      return true;
    });
  }, [data, f, now]);

  return { f, set, reset: () => setF(AWAL), hasil, aktif: JSON.stringify(f) !== JSON.stringify(AWAL) };
}

const uniq = (a: string[]) => Array.from(new Set(a)).sort();

export function FilterBar({
  data,
  filter,
  statusOptions,
  placeholder = "Cari ID, judul, atau nama pengaju...",
}: {
  data: Permintaan[];
  filter: ReturnType<typeof useFilter>;
  statusOptions?: StatusPermintaan[];
  placeholder?: string;
}) {
  const { f, set, reset, aktif } = filter;
  const labelStatus: Record<StatusPermintaan, string> = { menunggu: "Menunggu Pemeriksaan", diproses: "Sedang Diproses", pending: "Pending", selesai: "Selesai", ditolak: "Ditolak" };
  return (
    <div className="bg-white border border-border-subtle rounded-xl p-3 md:p-4 flex flex-col gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      <div className="flex flex-wrap items-center gap-2">
        {([["semua", "Semua Tanggal"], ["hari", "Hari Ini"], ["minggu", "7 Hari"], ["bulan", "Bulan Ini"]] as [Rentang, string][]).map(([k, l]) => (
          <button
            key={k}
            onClick={() => set("rentang", k)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-300 ${f.rentang === k ? "bg-blue-700 text-white border-blue-700 shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:border-blue-200 hover:text-blue-700"}`}
          >
            {l}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            value={f.q}
            onChange={(e) => set("q", e.target.value)}
            placeholder={placeholder}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 hover:border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
          />
        </div>
        {statusOptions && (
          <SelectField label="Status" value={f.status} onChange={(v) => set("status", v)} options={[{ value: "", label: "Semua Status" }, ...statusOptions.map((s) => ({ value: s, label: labelStatus[s] }))]} />
        )}
        <SelectField label="Layanan" value={f.layanan} onChange={(v) => set("layanan", v)} options={[{ value: "", label: "Semua Layanan" }, ...uniq(data.map((d) => d.layanan)).map((v) => ({ value: v, label: v }))]} />
        <SelectField label="Bagian" value={f.bagian} onChange={(v) => set("bagian", v)} options={[{ value: "", label: "Semua Bagian" }, ...(Object.keys(NAMA_BAGIAN) as KodeBagian[]).map((k) => ({ value: k, label: NAMA_BAGIAN[k] }))]} />
        <SelectField label="Plant" value={f.plant} onChange={(v) => set("plant", v)} options={[{ value: "", label: "Semua Plant" }, ...uniq(data.map((d) => d.plant)).map((v) => ({ value: v, label: v }))]} />
        <button
          onClick={reset}
          disabled={!aktif}
          className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium text-slate-500 hover:text-blue-700 disabled:opacity-40 disabled:hover:text-slate-500 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 transition-transform duration-500 ${aktif ? "" : "rotate-180"}`} /> Reset
        </button>
      </div>
    </div>
  );
}

/* ---------- Tabel ---------- */

export type ModeTabel = "masuk" | "proses" | "riwayat";

export function RequestTable({
  data,
  mode,
  onReview,
  onTerima,
  onTolak,
  perPage = 8,
  emptyTitle = "Tidak ada permintaan",
  emptyDesc = "Tidak ada data yang cocok dengan filter saat ini.",
}: {
  data: Permintaan[];
  mode: ModeTabel;
  onReview?: (p: Permintaan) => void;
  onTerima?: (p: Permintaan) => void;
  onTolak?: (p: Permintaan) => void;
  perPage?: number;
  emptyTitle?: string;
  emptyDesc?: string;
}) {
  const [page, setPage] = useState(1);
  const now = useNow(30_000);
  const pages = Math.max(1, Math.ceil(data.length / perPage));
  const cur = Math.min(page, pages);
  const rows = data.slice((cur - 1) * perPage, cur * perPage);

  return (
    <div className="bg-white rounded-xl border border-border-subtle shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
      {data.length === 0 ? (
        <EmptyState icon={Inbox} title={emptyTitle} desc={emptyDesc} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[980px]">
            <thead>
              <tr className="border-b border-border-subtle bg-slate-50/60 text-slate-500 text-[11px] uppercase tracking-wider">
                <th className="py-3.5 px-4 font-semibold">ID</th>
                <th className="py-3.5 px-4 font-semibold">Permintaan</th>
                <th className="py-3.5 px-4 font-semibold">Pengaju</th>
                <th className="py-3.5 px-4 font-semibold">Lokasi</th>
                <th className="py-3.5 px-4 font-semibold">Diajukan</th>
                <th className="py-3.5 px-4 font-semibold">{mode === "riwayat" ? "Selesai / Ditolak" : "SLA"}</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-xs text-slate-700">
              {rows.map((p) => {
                const sla = infoSla(p, now);
                const akhir = p.selesaiPada ?? p.ditolakPada;
                return (
                  <tr key={p.id} className="group">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Link href={`/pic/permintaan/${p.id}`} className="font-semibold text-blue-800 hover:underline">#{p.id}</Link>
                    </td>
                    <td className="py-3 px-4 max-w-[260px]">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900 truncate" title={p.judul}>{p.judul}</span>
                        {p.prioritas === "Mendesak" && p.status !== "selesai" && p.status !== "ditolak" && <PrioritasBadge prioritas="Mendesak" />}
                      </div>
                      <span className="text-[11px] text-slate-400">{p.layanan}</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Avatar nama={p.pengaju.nama} />
                        <div className="leading-tight">
                          <div className="font-medium text-slate-800">{p.pengaju.nama}</div>
                          <div className="text-[11px] text-slate-400">{NAMA_BAGIAN[p.pengaju.bagian]}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600">{p.plant} · {p.lantai}</td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-700">{tanggalJam(p.diajukan)}</td>
                    <td className={`py-3 px-4 whitespace-nowrap font-medium ${mode === "riwayat" ? "text-slate-700" : SLA_TONE[sla.tone]}`}>
                      {mode === "riwayat" ? (akhir ? tanggalJam(akhir) : "—") : sla.label}
                    </td>
                    <td className="py-3 px-4"><StatusBadge status={p.status} /></td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {mode === "masuk" && p.status === "menunggu" ? (
                          <>
                            <button className="px-3 py-1.5 text-[11px] font-semibold bg-blue-700 text-white rounded-md hover:bg-blue-800 shadow-sm" onClick={() => onReview?.(p)}>Periksa</button>
                            <button title="Terima" aria-label="Terima" className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md" onClick={() => onTerima?.(p)}><Check className="w-3.5 h-3.5" /></button>
                            <button title="Tolak" aria-label="Tolak" className="p-1.5 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md" onClick={() => onTolak?.(p)}><X className="w-3.5 h-3.5" /></button>
                          </>
                        ) : (
                          <Link href={`/pic/permintaan/${p.id}`} className="px-3.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-800 text-[11px] font-medium rounded-md border border-slate-200/70">
                            {mode === "proses" ? "Kerjakan" : "Lihat Detail"}
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {data.length > 0 && <Pagination page={cur} perPage={perPage} total={data.length} onPage={setPage} />}
    </div>
  );
}
