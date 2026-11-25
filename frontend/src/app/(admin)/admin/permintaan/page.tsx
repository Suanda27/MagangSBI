"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, Filter, FolderOpen, Hourglass, Inbox, RefreshCw, Search, XCircle } from "lucide-react";
import { Avatar, EmptyState } from "@/components/shared/display";
import { Pagination } from "@/components/shared/pagination";
import { StatusTiketBadge } from "@/components/shared/status-badge";
import { getPlants, getSectionsAdmin, getTiketAdmin, type PlantApi, type SectionAdminApi } from "@/lib/api/admin";
import { useDaftar, useDebounced } from "@/lib/admin/use-daftar";
import { tanggalJam } from "@/lib/shared/format";
import { STATUS_API, type StatusApi } from "@/lib/shared/status";

const PER_PAGE = 15;
const select = "w-full px-3 py-2 rounded-lg bg-slate-50 text-slate-700 text-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-700/20";

export default function SemuaPermintaanPage() {
  const [cari, setCari] = useState("");
  const [status, setStatus] = useState("");
  const [bagian, setBagian] = useState("");
  const [plant, setPlant] = useState("");
  const [halaman, setHalaman] = useState(1);
  const [segar, setSegar] = useState(0);
  const q = useDebounced(cari);

  // Pilihan filter diambil sekali dari server (section dan plant sesuai master data, bukan daftar karangan).
  const [sections, setSections] = useState<SectionAdminApi[]>([]);
  const [plants, setPlants] = useState<PlantApi[]>([]);
  useEffect(() => {
    getSectionsAdmin().then(setSections).catch(() => undefined);
    getPlants().then(setPlants).catch(() => undefined);
  }, []);

  const kunci = JSON.stringify([q, status, bagian, plant, halaman, segar]);
  const { data, error, memuat } = useDaftar(
    () =>
      getTiketAdmin({
        q: q.trim() || undefined,
        status: status || undefined,
        id_bagian: bagian ? Number(bagian) : undefined,
        id_plant: plant ? Number(plant) : undefined,
        per_page: PER_PAGE,
        page: halaman,
      }),
    kunci,
    "Gagal memuat daftar permintaan.",
  );

  const baris = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const ringkasan = data?.ringkasan;
  const s = ringkasan?.per_status;

  const ubah = (aksi: () => void) => {
    aksi();
    setHalaman(1);
  };
  const adaFilter = !!(cari || status || bagian || plant);
  const reset = () => {
    setCari("");
    setStatus("");
    setBagian("");
    setPlant("");
    setHalaman(1);
  };

  const kartu = [
    { label: "Total Tiket", value: ringkasan?.total, sub: "Semua tiket masuk", icon: FolderOpen, valClass: "text-slate-900" },
    { label: "Menunggu", value: s?.submitted, sub: "Belum diterima PIC", icon: Hourglass, valClass: "text-slate-900" },
    { label: "Diproses", value: s ? s.in_progress + s.pending + s.waiting_review : undefined, sub: "Dalam penanganan", icon: Clock3, valClass: "text-blue-700" },
    { label: "Selesai", value: s?.completed, sub: "Disetujui atau ditutup otomatis", icon: CheckCircle2, valClass: "text-slate-900" },
    { label: "Ditolak", value: s?.rejected, sub: "Ditolak oleh PIC", icon: XCircle, valClass: "text-rose-600" },
  ];

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Semua Permintaan</h1>
          <p className="text-sm text-slate-500 mt-1">Pantau seluruh permintaan layanan internal dari semua section. Perubahan status dilakukan PIC dan karyawan, bukan Admin.</p>
        </div>
        <button
          onClick={() => setSegar((n) => n + 1)}
          className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-sm shrink-0"
          title="Muat ulang data"
          aria-label="Muat ulang data"
        >
          <RefreshCw className={`w-[18px] h-[18px] ${memuat ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {kartu.map((c) => (
          <div key={c.label} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase text-slate-500 tracking-wider font-semibold">{c.label}</span>
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500">
                <c.icon className="w-[18px] h-[18px]" />
              </div>
            </div>
            <div className="mt-3">
              <span className={`text-[28px] font-bold leading-none tabular-nums ${c.valClass}`}>{c.value ?? "–"}</span>
              <p className="text-xs text-slate-500 mt-1">{c.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-3.5">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            value={cari}
            onChange={(e) => ubah(() => setCari(e.target.value))}
            className="w-full pl-11 pr-4 py-2.5 rounded-lg bg-slate-50 text-slate-900 placeholder:text-slate-400 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700/20 transition-all"
            placeholder="Cari nomor tiket, judul, NIK, atau nama pengaju..."
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 items-center">
          <select value={status} onChange={(e) => ubah(() => setStatus(e.target.value))} className={select} aria-label="Filter status">
            <option value="">Semua Status</option>
            {(Object.keys(STATUS_API) as StatusApi[]).map((k) => (
              <option key={k} value={k}>{STATUS_API[k].label}</option>
            ))}
          </select>
          <select value={bagian} onChange={(e) => ubah(() => setBagian(e.target.value))} className={select} aria-label="Filter section">
            <option value="">Semua Section</option>
            {sections.map((b) => (
              <option key={b.id} value={b.id}>{b.nama_bagian} ({b.kode_bagian})</option>
            ))}
          </select>
          <select value={plant} onChange={(e) => ubah(() => setPlant(e.target.value))} className={select} aria-label="Filter plant">
            <option value="">Semua Plant</option>
            {plants.map((p) => (
              <option key={p.id} value={p.id}>{p.nama_plant}</option>
            ))}
          </select>
          <button
            onClick={reset}
            disabled={!adaFilter}
            className="h-9 px-2.5 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 disabled:opacity-40 disabled:hover:bg-slate-50 disabled:hover:text-slate-500 transition-colors flex items-center justify-center gap-1.5"
            title="Reset semua filter"
          >
            <Filter className="w-[18px] h-[18px]" /> <span className="text-xs">Reset</span>
          </button>
        </div>
      </div>

      {error && <div role="alert" className="text-xs text-rose-700 bg-rose-50 border border-rose-200/70 rounded-lg px-3 py-2">{error}</div>}

      <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col transition-opacity ${memuat && data ? "opacity-60" : ""}`}>
        {baris.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={!data ? "Memuat permintaan..." : adaFilter ? "Tidak ada hasil" : "Belum ada permintaan"}
            desc={!data ? "Mengambil data dari server." : adaFilter ? "Coba ubah kata kunci atau reset filter." : "Permintaan yang diajukan karyawan akan muncul di sini."}
          />
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="py-3 px-4 font-semibold">Nomor Tiket</th>
                  <th className="py-3 px-4 font-semibold min-w-[220px]">Judul Permintaan</th>
                  <th className="py-3 px-4 font-semibold min-w-[170px]">Layanan</th>
                  <th className="py-3 px-4 font-semibold min-w-[180px]">Pengaju</th>
                  <th className="py-3 px-3 font-semibold text-center">Section</th>
                  <th className="py-3 px-4 font-semibold min-w-[150px]">PIC Petugas</th>
                  <th className="py-3 px-4 font-semibold min-w-[140px]">Tanggal</th>
                  <th className="py-3 px-3 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {baris.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-blue-700 whitespace-nowrap">#{r.kode_tiket}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">{r.judul}</div>
                      <div className="text-xs text-slate-500 truncate max-w-xs">{r.deskripsi}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">{r.layanan?.nama_layanan ?? "-"}</div>
                      <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-xs font-medium mt-0.5">{r.layanan?.kategori ?? "-"}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar nama={r.pengaju?.name ?? "-"} />
                        <div className="min-w-0">
                          <div className="font-medium text-slate-900 truncate">{r.pengaju?.name ?? "-"}</div>
                          <div className="text-xs text-slate-400">NIK: {r.pengaju?.nik ?? "-"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-center"><span className="inline-flex px-2 py-0.5 rounded bg-slate-100 text-xs font-bold text-slate-900">{r.bagian?.kode_bagian ?? "-"}</span></td>
                    <td className="py-3.5 px-4">
                      {r.pic ? <div className="font-medium text-slate-900">{r.pic.name}</div> : <span className="text-xs text-slate-400">Belum diambil</span>}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500">{tanggalJam(r.dibuat_pada)}</td>
                    <td className="py-3.5 px-3 text-center whitespace-nowrap"><StatusTiketBadge status={r.status} /></td>
                    <td className="py-3.5 px-4 text-right">
                      <Link href={`/admin/permintaan/${r.id}`} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-700 hover:text-white text-blue-700 text-xs font-semibold transition-all">
                        Detail <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {total > 0 && <Pagination page={halaman} perPage={PER_PAGE} total={total} onPage={setHalaman} />}
      </div>
    </>
  );
}
