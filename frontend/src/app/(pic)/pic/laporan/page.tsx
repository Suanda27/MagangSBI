"use client";

import { useEffect, useState } from "react";
import { BarChart3, CheckCircle2, Download, Gauge, Printer, Timer, Inbox } from "lucide-react";
import { CountUp } from "@/components/fx/motion";
import { PageHeader, StatCard, delay } from "@/components/shared/display";
import { SelectField } from "@/components/shared/form-controls";
import { getSections } from "@/lib/api/auth";
import { errorMessage } from "@/lib/api/errors";
import { getLaporanPic, unduhLaporanPicCsv, type FilterLaporanPic, type LaporanPicApi } from "@/lib/api/pic";
import { simpanBlob } from "@/lib/api/unduh";
import { usePicStore } from "@/lib/pic/store";
import type { Section } from "@/lib/api/types";

const WARNA = ["#1e40af", "#3b82f6", "#93c5fd", "#64748b", "#cbd5e1"];

function Donut({ data }: { data: { label: string; value: number }[] }) {
  const total = data.reduce((a, d) => a + d.value, 0) || 1;
  const R = 62;
  const C = 2 * Math.PI * R;
  const offsets = data.reduce<number[]>((o, d, i) => [...o, (o[i - 1] ?? 0) + (i > 0 ? (data[i - 1].value / total) * C : 0)], []);
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative w-44 h-44 fx-donut">
        <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
          <circle cx="80" cy="80" r={R} fill="none" stroke="#f1f5f9" strokeWidth="18" />
          {data.map((d, i) => {
            const len = (d.value / total) * C;
            return <circle key={d.label} cx="80" cy="80" r={R} fill="none" stroke={WARNA[i % WARNA.length]} strokeWidth="18" strokeDasharray={`${Math.max(len - 2, 0)} ${C}`} strokeDashoffset={-offsets[i]} className="transition-all duration-700" />;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold text-slate-900">{total === 1 && data.length === 0 ? 0 : data.reduce((a, d) => a + d.value, 0)}</span>
          <span className="text-[11px] text-slate-400 uppercase tracking-wider">Tiket</span>
        </div>
      </div>
      <ul className="w-full flex flex-col gap-2">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center gap-2.5 text-xs">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: WARNA[i % WARNA.length] }} />
            <span className="text-slate-700 truncate">{d.label}</span>
            <span className="ml-auto font-semibold text-slate-900">{d.value}</span>
            <span className="text-slate-400 w-10 text-right">{Math.round((d.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Bar({ label, value, max, color, right }: { label: string; value: number; max: number; color: string; right?: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-slate-700 font-medium">{label}</span>
        <span className="text-slate-500">{right ?? value}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className={`fx-bar h-full rounded-full ${color}`} style={{ width: `${max ? (value / max) * 100 : 0}%`, ...delay(150) }} />
      </div>
    </div>
  );
}

/** YYYY-MM-DD menurut jam lokal komputer pengguna (bukan UTC, supaya "hari ini" tidak bergeser). */
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function rentang(periode: string): Pick<FilterLaporanPic, "dari" | "sampai"> {
  const sekarang = new Date();
  if (periode === "bulan") return { dari: ymd(new Date(sekarang.getFullYear(), sekarang.getMonth(), 1)), sampai: ymd(sekarang) };
  if (periode === "minggu") {
    const awal = new Date(sekarang);
    awal.setDate(sekarang.getDate() - 6); // 7 hari terakhir termasuk hari ini
    return { dari: ymd(awal), sampai: ymd(sekarang) };
  }
  return {};
}

const label = (jam: number) => (jam < 24 ? `${jam.toFixed(1)} jam` : `${(jam / 24).toFixed(1)} hari`);

export default function LaporanPage() {
  const { toast } = usePicStore();
  const [periode, setPeriode] = useState("semua");
  const [bagian, setBagian] = useState("");
  const [sections, setSections] = useState<Section[]>([]);
  const [data, setData] = useState<LaporanPicApi | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [mengunduh, setMengunduh] = useState(false);

  useEffect(() => {
    getSections().then(setSections).catch(() => undefined);
  }, []);

  const filter: FilterLaporanPic = { ...rentang(periode), id_bagian_pengaju: bagian ? Number(bagian) : undefined };
  const kunci = JSON.stringify(filter);

  useEffect(() => {
    let batal = false;
    getLaporanPic(JSON.parse(kunci))
      .then((d) => {
        if (batal) return;
        setData(d);
        setGalat(null);
      })
      .catch((e) => {
        if (!batal) setGalat(errorMessage(e, "Gagal memuat laporan."));
      });
    return () => {
      batal = true;
    };
  }, [kunci]);

  const unduh = async () => {
    setMengunduh(true);
    try {
      simpanBlob(await unduhLaporanPicCsv(filter));
      toast({ tone: "success", title: "Laporan diekspor", desc: "Berkas CSV berisi tiket yang Anda tangani sesuai filter." });
    } catch (e) {
      toast({ tone: "error", title: "Ekspor gagal", desc: errorMessage(e, "Gagal mengunduh laporan.") });
    } finally {
      setMengunduh(false);
    }
  };

  const s = data?.per_status;
  const total = data?.total ?? 0;
  const aktif = s ? s.in_progress + s.pending : 0;
  const konfirmasi = s?.waiting_review ?? 0;
  const selesai = s?.completed ?? 0;
  const ditolak = s?.rejected ?? 0;
  const maxStatus = Math.max(selesai, aktif, konfirmasi, ditolak, 1);
  const tuntas = total > 0 ? Math.round((selesai / total) * 100) : 0;
  const tanpaRevisi = data?.selesai.tanpa_revisi_persen ?? 0;
  const tanpaRevisiJumlah = data && data.selesai.tanpa_revisi_persen != null ? Math.round((data.selesai.tanpa_revisi_persen / 100) * data.selesai.jumlah) : 0;
  const kategori = (data?.per_kategori ?? []).slice(0, 5).map((k) => ({ label: k.kategori, value: k.jumlah }));
  const bagianPengaju = data?.per_bagian_pengaju ?? [];

  return (
    <>
      <PageHeader
        title="Laporan Operasional"
        desc="Performa penanganan, tingkat penyelesaian, dan tingkat revisi untuk tiket yang Anda tangani."
        actions={
          <>
            <button onClick={() => window.print()} className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:border-blue-200 hover:text-blue-800 transition-all"><Printer className="w-4 h-4" /> Cetak</button>
            <button onClick={unduh} disabled={mengunduh} className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 rounded-lg shadow-sm transition-all"><Download className="w-4 h-4" /> {mengunduh ? "Menyiapkan..." : "Ekspor CSV"}</button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <SelectField label="Periode" value={periode} onChange={setPeriode} options={[{ value: "semua", label: "Semua Periode" }, { value: "bulan", label: "Bulan Ini" }, { value: "minggu", label: "7 Hari Terakhir" }]} />
        <SelectField label="Bagian pengaju" value={bagian} onChange={setBagian} options={[{ value: "", label: "Semua Bagian" }, ...sections.map((b) => ({ value: String(b.id), label: b.nama_bagian }))]} />
        <span className="text-xs text-slate-400 ml-auto">{data ? `${total} tiket dalam laporan` : "Memuat..."}</span>
      </div>

      {galat && <div role="alert" className="text-xs text-rose-700 bg-rose-50 border border-rose-200/70 rounded-lg px-3 py-2">{galat}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Ditangani" value={<CountUp value={total} />} hint={`${data?.antrean_saat_ini ?? 0} masih menunggu keputusan di antrean`} icon={Inbox} tone="blue" />
        <StatCard label="Rata-rata Penyelesaian" value={data?.selesai.rata_rata_jam != null ? label(data.selesai.rata_rata_jam) : "—"} hint="Sejak diajukan hingga disetujui" icon={Timer} tone="slate" />
        <StatCard label="Disetujui Tanpa Revisi" value={data?.selesai.tanpa_revisi_persen != null ? <><CountUp value={tanpaRevisi} />%</> : "—"} hint={`${tanpaRevisiJumlah} dari ${data?.selesai.jumlah ?? 0} tiket selesai`} icon={Gauge} tone="emerald" />
        <StatCard label="Tingkat Penyelesaian" value={<><CountUp value={tuntas} />%</>} hint={`${selesai} dari ${total} tiket`} icon={CheckCircle2} tone="violet" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="bg-white border border-border-subtle rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <h2 className="text-sm font-semibold text-slate-900">Volume per Kategori</h2>
          <p className="text-xs text-slate-400 mb-5">Distribusi tiket yang Anda tangani</p>
          {kategori.length ? <Donut data={kategori} /> : <p className="text-xs text-slate-400 py-10 text-center">{data ? "Belum ada data." : "Memuat..."}</p>}
        </section>

        <section className="bg-white border border-border-subtle rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-slate-400" /> Status Tiket</h2>
          <p className="text-xs text-slate-400 mb-5">Posisi alur penanganan</p>
          <div className="flex flex-col gap-5">
            <Bar label="Selesai" value={selesai} max={maxStatus} color="bg-emerald-500" />
            <Bar label="Sedang diproses / pending" value={aktif} max={maxStatus} color="bg-blue-600" />
            <Bar label="Menunggu konfirmasi pengaju" value={konfirmasi} max={maxStatus} color="bg-sky-500" />
            <Bar label="Ditolak" value={ditolak} max={maxStatus} color="bg-rose-500" />
          </div>
        </section>

        <section className="bg-white border border-border-subtle rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <h2 className="text-sm font-semibold text-slate-900">Permintaan per Bagian</h2>
          <p className="text-xs text-slate-400 mb-5">Asal pengaju</p>
          <div className="flex flex-col gap-5">
            {bagianPengaju.length === 0 && <p className="text-xs text-slate-400 py-10 text-center">{data ? "Belum ada data." : "Memuat..."}</p>}
            {bagianPengaju.map((b) => (
              <Bar key={b.id ?? b.nama_bagian} label={b.nama_bagian} value={b.jumlah} max={bagianPengaju[0].jumlah} color="bg-blue-700" right={`${b.jumlah} tiket`} />
            ))}
          </div>
        </section>
      </div>

      <section className="bg-white border border-border-subtle rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Layanan Paling Sering Ditangani</h2>
          <p className="text-xs text-slate-400">Diurutkan berdasarkan jumlah tiket (lima teratas)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[520px]">
            <thead>
              <tr className="bg-slate-50/60 text-[11px] uppercase tracking-wider text-slate-500 border-b border-border-subtle">
                <th className="py-3 px-5 font-semibold">Layanan</th>
                <th className="py-3 px-5 font-semibold">Jumlah Tiket</th>
                <th className="py-3 px-5 font-semibold">Rata-rata Penyelesaian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-slate-700">
              {(data?.top_layanan ?? []).map((l) => (
                <tr key={l.id}>
                  <td className="py-3 px-5 font-medium text-slate-900">{l.nama_layanan}</td>
                  <td className="py-3 px-5">{l.jumlah} tiket</td>
                  <td className="py-3 px-5">{l.rata_rata_jam != null ? label(l.rata_rata_jam) : "—"}</td>
                </tr>
              ))}
              {data && data.top_layanan.length === 0 && <tr><td colSpan={3} className="py-8 text-center text-slate-400">Belum ada data.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
