"use client";

import { useEffect, useState } from "react";
import { Download, FileSpreadsheet, Filter, Inbox, Printer, RotateCcw } from "lucide-react";
import { EmptyState } from "@/components/shared/display";
import { Pagination } from "@/components/shared/pagination";
import { StatusTiketBadge } from "@/components/shared/status-badge";
import {
  getLaporanAdmin,
  getLayananAdmin,
  getPicMapping,
  getPlants,
  getSectionsAdmin,
  unduhLaporanCsv,
  type FilterLaporan,
  type LayananAdminApi,
  type PicMappingApi,
  type PlantApi,
  type SectionAdminApi,
} from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/errors";
import { useDaftar } from "@/lib/admin/use-daftar";
import { tanggalJam } from "@/lib/shared/format";
import { STATUS_API, type StatusApi } from "@/lib/shared/status";

const PER_PAGE = 15;
const PERIODE = ["Hari ini", "Minggu ini", "Bulan ini", "Tahun ini", "Semua", "Custom"] as const;
type Periode = (typeof PERIODE)[number];

/** YYYY-MM-DD menurut jam lokal komputer pengguna (bukan UTC, supaya "hari ini" tidak bergeser). */
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function rentang(p: Periode): { dari?: string; sampai?: string } {
  const sekarang = new Date();
  const hariIni = ymd(sekarang);
  switch (p) {
    case "Hari ini":
      return { dari: hariIni, sampai: hariIni };
    case "Minggu ini": {
      const senin = new Date(sekarang);
      senin.setDate(sekarang.getDate() - ((sekarang.getDay() + 6) % 7)); // minggu dimulai Senin
      return { dari: ymd(senin), sampai: hariIni };
    }
    case "Bulan ini":
      return { dari: ymd(new Date(sekarang.getFullYear(), sekarang.getMonth(), 1)), sampai: hariIni };
    case "Tahun ini":
      return { dari: `${sekarang.getFullYear()}-01-01`, sampai: hariIni };
    default:
      return {};
  }
}

const persen = (n: number, total: number) => (total > 0 ? (n / total) * 100 : 0);
const sel = "w-full bg-slate-50 text-slate-900 text-sm rounded-lg px-3 py-1.5 focus:bg-white focus:ring-2 focus:ring-blue-700/20 transition-all outline-none cursor-pointer";

export default function LaporanPage() {
  const [periode, setPeriode] = useState<Periode>("Bulan ini");
  const [dariKustom, setDariKustom] = useState("");
  const [sampaiKustom, setSampaiKustom] = useState("");
  const [bagian, setBagian] = useState("");
  const [layanan, setLayanan] = useState("");
  const [pic, setPic] = useState("");
  const [plant, setPlant] = useState("");
  const [status, setStatus] = useState("");
  const [halaman, setHalaman] = useState(1);
  const [mengunduh, setMengunduh] = useState(false);
  const [galatUnduh, setGalatUnduh] = useState<string | null>(null);

  // Pilihan filter diambil dari master data.
  const [sections, setSections] = useState<SectionAdminApi[]>([]);
  const [layanans, setLayanans] = useState<LayananAdminApi[]>([]);
  const [pics, setPics] = useState<PicMappingApi[]>([]);
  const [plants, setPlants] = useState<PlantApi[]>([]);
  useEffect(() => {
    getSectionsAdmin().then(setSections).catch(() => undefined);
    getLayananAdmin({ per_page: 100 }).then((h) => setLayanans(h.data)).catch(() => undefined);
    getPicMapping({ per_page: 100 }).then((h) => setPics(h.data)).catch(() => undefined);
    getPlants().then(setPlants).catch(() => undefined);
  }, []);

  const tanggal = periode === "Custom" ? { dari: dariKustom || undefined, sampai: sampaiKustom || undefined } : rentang(periode);
  const kustomTidakValid = periode === "Custom" && !!dariKustom && !!sampaiKustom && sampaiKustom < dariKustom;

  const filter: FilterLaporan = {
    ...tanggal,
    id_bagian: bagian ? Number(bagian) : undefined,
    id_layanan: layanan ? Number(layanan) : undefined,
    id_pic: pic ? Number(pic) : undefined,
    id_plant: plant ? Number(plant) : undefined,
    status: status || undefined,
  };

  const kunci = JSON.stringify([filter, halaman, kustomTidakValid]);
  const { data, error, memuat } = useDaftar(
    () => (kustomTidakValid ? Promise.reject(new Error("Tanggal akhir tidak boleh sebelum tanggal awal.")) : getLaporanAdmin({ ...filter, page: halaman, per_page: PER_PAGE })),
    kunci,
    "Gagal memuat laporan.",
  );

  const baris = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const r = data?.ringkasan;
  const s = r?.per_status;
  const jumlah = r?.total ?? 0;
  const diproses = s ? s.in_progress + s.pending + s.waiting_review : 0;

  const ubah = (aksi: () => void) => {
    aksi();
    setHalaman(1);
  };
  const adaFilter = periode !== "Bulan ini" || !!(bagian || layanan || pic || plant || status);
  const reset = () => {
    setPeriode("Bulan ini");
    setDariKustom("");
    setSampaiKustom("");
    setBagian("");
    setLayanan("");
    setPic("");
    setPlant("");
    setStatus("");
    setHalaman(1);
  };

  const unduh = async () => {
    setMengunduh(true);
    setGalatUnduh(null);
    try {
      const { blob, nama } = await unduhLaporanCsv(filter);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nama;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setGalatUnduh(errorMessage(e, "Gagal mengunduh laporan."));
    } finally {
      setMengunduh(false);
    }
  };

  const kartu = [
    { label: "Total Permintaan", value: jumlah, sub: "Tiket dalam filter terpilih" },
    { label: "Menunggu", value: s?.submitted ?? 0, sub: `${persen(s?.submitted ?? 0, jumlah).toFixed(1)}% belum diambil PIC` },
    { label: "Sedang Diproses", value: diproses, sub: `${persen(diproses, jumlah).toFixed(1)}% dalam penanganan` },
    { label: "Selesai", value: s?.completed ?? 0, sub: `${persen(s?.completed ?? 0, jumlah).toFixed(1)}% telah tuntas` },
  ];

  const segmen = [
    { label: "Diproses", value: diproses, color: "bg-blue-700" },
    { label: "Selesai", value: s?.completed ?? 0, color: "bg-blue-400" },
    { label: "Menunggu", value: s?.submitted ?? 0, color: "bg-amber-300" },
    { label: "Ditolak", value: s?.rejected ?? 0, color: "bg-rose-500" },
  ];

  const sections5 = r?.per_section.slice(0, 5) ?? [];

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Laporan</h1>
          <p className="text-sm text-slate-500 mt-1">Lihat rekapitulasi permintaan layanan internal.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={() => window.print()} className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:bg-slate-50 transition-colors">
            <Printer className="w-[18px] h-[18px]" /> Cetak
          </button>
          <button onClick={unduh} disabled={mengunduh || kustomTidakValid} className="inline-flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:bg-blue-800 disabled:opacity-60 transition-colors">
            {mengunduh ? <Download className="w-[18px] h-[18px] animate-bounce" /> : <FileSpreadsheet className="w-[18px] h-[18px]" />} {mengunduh ? "Menyiapkan..." : "Ekspor CSV (Excel)"}
          </button>
        </div>
      </div>

      {galatUnduh && <div role="alert" className="text-xs text-rose-700 bg-rose-50 border border-rose-200/70 rounded-lg px-3 py-2">{galatUnduh}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kartu.map((c) => (
          <div key={c.label} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between gap-2">
            <span className="text-[11px] uppercase text-slate-500 tracking-wider font-semibold">{c.label}</span>
            <span className="text-3xl font-bold text-slate-900 tracking-tight tabular-nums">{r ? c.value : "–"}</span>
            <p className="text-xs text-slate-500">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-700" />
            <h2 className="text-base font-semibold text-slate-900">Filter Laporan</h2>
          </div>
          <div className="inline-flex flex-wrap p-1 bg-slate-100 rounded-lg gap-1">
            {PERIODE.map((p) => (
              <button key={p} onClick={() => ubah(() => setPeriode(p))} className={`px-3 py-1 text-xs rounded transition-colors ${periode === p ? "bg-white text-blue-700 shadow-xs font-semibold" : "text-slate-500 hover:text-slate-900"}`}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {periode === "Custom" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
            <label className="flex flex-col gap-1 text-xs text-slate-500">
              Dari tanggal
              <input type="date" value={dariKustom} max={sampaiKustom || undefined} onChange={(e) => ubah(() => setDariKustom(e.target.value))} className={sel} />
            </label>
            <label className="flex flex-col gap-1 text-xs text-slate-500">
              Sampai tanggal
              <input type="date" value={sampaiKustom} min={dariKustom || undefined} onChange={(e) => ubah(() => setSampaiKustom(e.target.value))} className={sel} />
            </label>
          </div>
        )}
        {tanggal.dari || tanggal.sampai ? (
          <p className="text-xs text-slate-400 -mt-2">Berdasarkan tanggal pengajuan: {tanggal.dari ?? "awal"} s.d. {tanggal.sampai ?? "sekarang"}</p>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <label className="flex flex-col gap-1 text-xs text-slate-500">
            Section
            <select value={bagian} onChange={(e) => ubah(() => setBagian(e.target.value))} className={sel}>
              <option value="">Semua Section</option>
              {sections.map((b) => <option key={b.id} value={b.id}>{b.nama_bagian}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-500">
            Layanan
            <select value={layanan} onChange={(e) => ubah(() => setLayanan(e.target.value))} className={sel}>
              <option value="">Semua Layanan</option>
              {layanans.map((l) => <option key={l.id} value={l.id}>{l.nama_layanan}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-500">
            PIC
            <select value={pic} onChange={(e) => ubah(() => setPic(e.target.value))} className={sel}>
              <option value="">Semua PIC</option>
              {pics.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-500">
            Plant
            <select value={plant} onChange={(e) => ubah(() => setPlant(e.target.value))} className={sel}>
              <option value="">Semua Plant</option>
              {plants.map((p) => <option key={p.id} value={p.id}>{p.nama_plant}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-500">
            Status
            <select value={status} onChange={(e) => ubah(() => setStatus(e.target.value))} className={sel}>
              <option value="">Semua Status</option>
              {(Object.keys(STATUS_API) as StatusApi[]).map((k) => <option key={k} value={k}>{STATUS_API[k].label}</option>)}
            </select>
          </label>
        </div>
        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button onClick={reset} disabled={!adaFilter} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 transition-colors text-xs font-medium">
            <RotateCcw className="w-4 h-4" /> Reset Filter
          </button>
        </div>
      </div>

      {(error || kustomTidakValid) && <div role="alert" className="text-xs text-rose-700 bg-rose-50 border border-rose-200/70 rounded-lg px-3 py-2">{kustomTidakValid ? "Tanggal akhir tidak boleh sebelum tanggal awal." : error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Status Permintaan</h3>
            <p className="text-xs text-slate-500">Distribusi tiket per tahap penanganan</p>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-100 flex overflow-hidden">
            {segmen.map((x) => <div key={x.label} className={x.color} style={{ width: `${persen(x.value, jumlah)}%` }} />)}
          </div>
          <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 text-sm">
            {segmen.map((x) => (
              <div key={x.label} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5"><span className={`w-2.5 h-2.5 rounded-full ${x.color}`} /><span className="text-slate-900">{x.label}</span></div>
                <span className="text-xs font-semibold text-slate-900">{x.value} <span className="text-slate-400 font-normal">({persen(x.value, jumlah).toFixed(1)}%)</span></span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
            <div>
              <p className="text-slate-400">Rata-rata penyelesaian</p>
              <p className="text-sm font-semibold text-slate-900">{r?.selesai.rata_rata_jam != null ? `${r.selesai.rata_rata_jam} jam` : "—"}</p>
            </div>
            <div>
              <p className="text-slate-400">Selesai tanpa revisi</p>
              <p className="text-sm font-semibold text-slate-900">{r?.selesai.tanpa_revisi_persen != null ? `${r.selesai.tanpa_revisi_persen}%` : "—"}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Permintaan per Section</h3>
            <p className="text-xs text-slate-500">Menurut section tujuan</p>
          </div>
          {sections5.length === 0 ? (
            <p className="text-sm text-slate-400">{r ? "Tidak ada data." : "Memuat..."}</p>
          ) : (
            <div className="flex flex-col gap-3">
              {sections5.map((b, i) => (
                <div key={b.id} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-900 font-medium">{b.nama_bagian}</span>
                    <span className="text-xs text-slate-900">{b.jumlah} tiket</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`${i === 0 ? "bg-blue-700" : "bg-slate-400"} h-full rounded-full`} style={{ width: `${persen(b.jumlah, sections5[0].jumlah)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Layanan Teratas</h3>
            <p className="text-xs text-slate-500">Jenis layanan paling banyak diminta</p>
          </div>
          {!r || r.top_layanan.length === 0 ? (
            <p className="text-sm text-slate-400">{r ? "Tidak ada data." : "Memuat..."}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {r.top_layanan.map((l, i) => (
                <div key={l.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-6 h-6 rounded bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-900 shrink-0">{i + 1}</span>
                    <span className="text-sm font-medium text-slate-900 truncate">{l.nama_layanan}</span>
                  </div>
                  <span className="text-xs font-semibold text-blue-700 shrink-0 ml-2">{l.jumlah} tiket</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={`bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden transition-opacity ${memuat && data ? "opacity-60" : ""}`}>
        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Rekapitulasi Permintaan</h2>
            <p className="text-xs text-slate-500">Rincian tiket yang tercatat sesuai filter. Berkas ekspor memuat seluruh hasil filter, bukan hanya halaman ini.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-50 text-slate-500 text-xs">Read-only report</span>
        </div>
        {baris.length === 0 ? (
          <EmptyState icon={Inbox} title={!data ? "Memuat laporan..." : "Tidak ada data"} desc={!data ? "Mengambil data dari server." : "Tidak ada tiket yang cocok dengan filter ini."} />
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-slate-900">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-2 font-semibold">Nomor Tiket</th>
                  <th className="px-4 py-2 font-semibold min-w-[200px]">Judul Permintaan</th>
                  <th className="px-4 py-2 font-semibold">Layanan</th>
                  <th className="px-4 py-2 font-semibold">Pengaju</th>
                  <th className="px-4 py-2 font-semibold">Section</th>
                  <th className="px-4 py-2 font-semibold">PIC</th>
                  <th className="px-4 py-2 font-semibold">Status</th>
                  <th className="px-4 py-2 font-semibold">Tanggal Ajuan</th>
                  <th className="px-4 py-2 font-semibold">Tanggal Selesai</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {baris.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-blue-700 whitespace-nowrap">#{t.kode_tiket}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-900">{t.judul}</td>
                    <td className="px-4 py-2.5 text-slate-500">{t.layanan?.nama_layanan ?? "-"}</td>
                    <td className="px-4 py-2.5 text-slate-700">{t.pengaju?.name ?? "-"}</td>
                    <td className="px-4 py-2.5 text-slate-500">{t.bagian?.kode_bagian ?? "-"}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-900">{t.pic?.name ?? <span className="text-slate-400 font-normal">Belum diambil</span>}</td>
                    <td className="px-4 py-2.5"><StatusTiketBadge status={t.status} /></td>
                    <td className="px-4 py-2.5 text-slate-500 text-xs whitespace-nowrap">{tanggalJam(t.dibuat_pada)}</td>
                    <td className="px-4 py-2.5 text-slate-700 text-xs font-medium whitespace-nowrap">{t.selesai_pada ? tanggalJam(t.selesai_pada) : "—"}</td>
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
