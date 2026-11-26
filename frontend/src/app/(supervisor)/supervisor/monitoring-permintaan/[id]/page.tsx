"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ClipboardList,
  Clock,
  History,
  Info,
  Loader2,
  MapPin,
  Paperclip,
  PackageCheck,
  UsersRound,
} from "lucide-react";
import ReadOnlyBadge from "@/components/supervisor/read-only-badge";
import BarisBerkas from "@/components/supervisor/baris-berkas";
import StatusTiketBadge from "@/components/employee/status-tiket-badge";
import { toApiError } from "@/lib/api/errors";
import { getDetailMonitoring, type DetailMonitoring } from "@/lib/api/monitoring";
import { ambilLampiran, type BerkasLampiran } from "@/lib/api/permintaan";
import { formatTanggal, formatTanggalWaktu, initialsOf } from "@/lib/auth/user-display";

const dl = (ms: number) => ({ "--delay": `${ms}ms` } as React.CSSProperties);

export default function DetailMonitoringPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [t, setT] = useState<DetailMonitoring | null>(null);
  const [loadError, setLoadError] = useState<{ status: number; message: string } | null>(null);
  const [errAksi, setErrAksi] = useState("");

  useEffect(() => {
    let dibatalkan = false;
    getDetailMonitoring(id)
      .then((d) => {
        if (!dibatalkan) setT(d);
      })
      .catch((err) => {
        if (dibatalkan) return;
        const e = toApiError(err);
        setLoadError({ status: e.status, message: e.message });
      });
    return () => {
      dibatalkan = true;
    };
  }, [id]);

  if (loadError) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <p className="text-sm font-medium text-slate-800">{loadError.status === 404 ? "Permintaan tidak ditemukan di section Anda." : loadError.message}</p>
        <Link href="/supervisor/monitoring-permintaan" className="mt-3 inline-block text-[13px] font-medium text-blue-700 hover:text-blue-900">
          Kembali ke Monitoring
        </Link>
      </div>
    );
  }

  if (!t) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin" />Memuat permintaan...
      </div>
    );
  }

  const ambil = async (berkas: BerkasLampiran, mode: "unduh" | "buka") => {
    setErrAksi("");
    try {
      await ambilLampiran(berkas, mode);
    } catch (err) {
      setErrAksi(toApiError(err).message);
    }
  };

  const info = [
    { label: "Kategori", value: t.layanan?.kategori ?? "-" },
    { label: "Jenis Layanan", value: t.layanan?.nama_layanan ?? "-" },
    { label: "Section Tujuan", value: t.bagian?.nama_bagian ?? "-" },
    { label: "Waktu Diajukan", value: formatTanggalWaktu(t.dibuat_pada) },
    { label: "Urgensi", value: t.prioritas_label },
    { label: "Jumlah Revisi", value: String(t.jumlah_revisi) },
  ];
  const lokasi = [t.lokasi.plant, t.lokasi.lantai].filter(Boolean).join(" • ") || "-";
  const putaranTerbaru = [...t.hasil_kerja.putaran].reverse();
  const riwayatTerbaru = [...t.riwayat].reverse();

  return (
    <>
      <div className="fx-reveal flex flex-col lg:flex-row lg:items-start justify-between gap-4" style={dl(0)}>
        <div className="grid gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/supervisor/monitoring-permintaan" className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-[13px] font-medium text-slate-700 hover:border-blue-200 hover:text-blue-900">
              <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" />Kembali ke Monitoring
            </Link>
            <StatusTiketBadge status={t.status} label={t.status_label} />
            <ReadOnlyBadge />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-blue-700 bg-clip-text text-transparent">{t.judul}</h1>
            <p className="text-[13.5px] text-slate-500 mt-0.5">Detail Permintaan {t.kode_tiket} • Informasi lengkap, riwayat tahapan, dan status penanganan.</p>
          </div>
        </div>
      </div>

      {errAksi && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700" role="alert">
          <AlertCircle className="w-4 h-4 shrink-0" />{errAksi}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid gap-6 content-start">
          {/* Informasi */}
          <section className="fx-reveal rounded-xl border border-slate-200 bg-white shadow-sm" style={dl(100)}>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5"><span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center"><ClipboardList className="w-4 h-4" /></span><h2 className="text-[15px] font-semibold text-slate-900">Informasi Permintaan</h2></div>
              <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-100 text-slate-600">{t.kode_tiket}</span>
            </div>
            <div className="p-5 grid gap-5">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                {info.map((i) => (
                  <div key={i.label}><dt className="text-xs text-slate-400">{i.label}</dt><dd className="text-[13.5px] font-medium text-slate-800 mt-0.5">{i.value}</dd></div>
                ))}
                <div className="sm:col-span-2">
                  <dt className="text-xs text-slate-400">Lokasi Fasilitas</dt>
                  <dd className="text-[13.5px] font-medium text-slate-800 mt-0.5 inline-flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-400" />{lokasi}{t.lokasi.detail ? <span className="text-slate-500 font-normal"> — {t.lokasi.detail}</span> : null}
                  </dd>
                </div>
              </dl>
              <div>
                <h3 className="text-xs text-slate-400 mb-1.5">Deskripsi Masalah Lengkap</h3>
                <div className="rounded-lg bg-slate-50 border border-slate-100 p-4 text-[13.5px] text-slate-700 leading-relaxed whitespace-pre-line">{t.deskripsi}</div>
              </div>
            </div>
          </section>

          {/* Alasan */}
          {(t.alasan_tolak || (t.status === "pending" && t.alasan_pending) || (t.alasan_revisi && t.jumlah_revisi > 0)) && (
            <section className="fx-reveal grid gap-3" style={dl(140)}>
              {t.alasan_tolak && (
                <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4">
                  <h3 className="text-[13px] font-semibold text-rose-800">Alasan Penolakan</h3>
                  <p className="mt-1 text-[13.5px] text-rose-900/90 whitespace-pre-line">{t.alasan_tolak}</p>
                </div>
              )}
              {t.status === "pending" && t.alasan_pending && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-[13px] font-semibold text-slate-700">Alasan Pending</h3>
                  <p className="mt-1 text-[13.5px] text-slate-700 whitespace-pre-line">{t.alasan_pending}</p>
                </div>
              )}
              {t.alasan_revisi && t.jumlah_revisi > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                  <h3 className="text-[13px] font-semibold text-amber-800">Revisi Terakhir (diminta {t.jumlah_revisi} kali)</h3>
                  <p className="mt-1 text-[13.5px] text-amber-900/90 whitespace-pre-line">{t.alasan_revisi}</p>
                </div>
              )}
            </section>
          )}

          {/* Lampiran pengajuan */}
          <section className="fx-reveal rounded-xl border border-slate-200 bg-white shadow-sm" style={dl(180)}>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5"><span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center"><Paperclip className="w-4 h-4" /></span><h2 className="text-[15px] font-semibold text-slate-900">Lampiran Berkas Pendukung</h2></div>
              <span className="text-xs text-slate-400">{t.lampiran.length} Berkas</span>
            </div>
            <div className="p-5 grid gap-3">
              {t.lampiran.length === 0 ? (
                <p className="text-[13px] text-slate-400">Pengaju tidak melampirkan berkas.</p>
              ) : (
                t.lampiran.map((b) => <BarisBerkas key={b.id} berkas={b} onAmbil={ambil} />)
              )}
              <div className="flex items-start gap-2 text-xs text-slate-500 mt-1"><Info className="w-4 h-4 shrink-0 text-blue-600" />Supervisor hanya memiliki hak akses unduh dan pratinjau dokumen arsip.</div>
            </div>
          </section>

          {/* Hasil kerja PIC */}
          {putaranTerbaru.length > 0 && (
            <section className="fx-reveal rounded-xl border border-slate-200 bg-white shadow-sm" style={dl(220)}>
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5"><span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center"><PackageCheck className="w-4 h-4" /></span><h2 className="text-[15px] font-semibold text-slate-900">Hasil Kerja PIC</h2></div>
                <span className="text-xs text-slate-400">Dikirim terakhir {formatTanggalWaktu(t.hasil_kerja.dikirim_pada)}</span>
              </div>
              <div className="p-5 grid gap-5">
                {t.hasil_kerja.catatan && (
                  <div>
                    <h3 className="text-xs text-slate-400 mb-1.5">Catatan PIC (pengiriman terakhir)</h3>
                    <div className="rounded-lg bg-slate-50 border border-slate-100 p-4 text-[13.5px] text-slate-700 whitespace-pre-line">{t.hasil_kerja.catatan}</div>
                  </div>
                )}
                {putaranTerbaru.map((p, i) => (
                  <div key={p.putaran}>
                    <h3 className="text-xs font-medium text-slate-500 mb-2">Pengiriman ke-{p.putaran}{i === 0 ? " (terbaru)" : ""}</h3>
                    <div className="grid gap-3">
                      {p.berkas.map((b) => <BarisBerkas key={b.id} berkas={b} onAmbil={ambil} />)}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="grid gap-6 content-start">
          {/* Pihak terkait */}
          <section className="fx-reveal rounded-xl border border-slate-200 bg-white shadow-sm" style={dl(240)}>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5"><span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center"><UsersRound className="w-4 h-4" /></span><h2 className="text-[15px] font-semibold text-slate-900">Pihak Terkait</h2></div>
            <div className="p-5 grid gap-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-2">Pemohon (Karyawan)</p>
                {t.pengaju ? (
                  <div className="flex items-start gap-3">
                    <span className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-700 to-blue-950 text-white text-xs font-semibold flex items-center justify-center shrink-0">{initialsOf(t.pengaju.name)}</span>
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-semibold text-slate-900">{t.pengaju.name}</p>
                      <p className="text-xs text-slate-500">{t.pengaju.jabatan ?? "Karyawan"}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-[13px] italic text-slate-400">Data pengaju tidak tersedia.</p>
                )}
              </div>
              <div className="pt-5 border-t border-slate-100">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-2">Penanggung Jawab (PIC)</p>
                {t.pic ? (
                  <div className="flex items-start gap-3">
                    <span className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center justify-center shrink-0">{initialsOf(t.pic.name)}</span>
                    <div>
                      <p className="text-[13.5px] font-semibold text-slate-900">{t.pic.name}</p>
                      {t.diterima_pada && (
                        <p className="text-xs text-slate-400 mt-1 inline-flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />Diterima: {formatTanggal(t.diterima_pada)}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-[13px] italic text-slate-400">Belum ada PIC yang ditugaskan.</p>
                )}
              </div>
            </div>
          </section>

          {/* Timeline */}
          <section className="fx-reveal rounded-xl border border-slate-200 bg-white shadow-sm" style={dl(320)}>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5"><span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center"><History className="w-4 h-4" /></span><h2 className="text-[15px] font-semibold text-slate-900">Timeline Penanganan</h2></div>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Audit Trail</span>
            </div>
            {riwayatTerbaru.length === 0 ? (
              <p className="p-5 text-sm text-slate-400">Belum ada aktivitas.</p>
            ) : (
              <ol className="p-5 relative ml-4 border-l-2 border-slate-100 space-y-5">
                {riwayatTerbaru.map((r, i) => (
                  <li key={r.id} className="fx-reveal-x relative pl-5" style={dl(400 + i * 100)}>
                    <span className={`absolute -left-[7px] top-1 w-3 h-3 rounded-full ring-4 ring-white ${i === 0 ? "bg-blue-600" : "bg-slate-300"}`} />
                    <p className="text-[13px] font-semibold text-slate-900">{r.judul}</p>
                    <p className="text-[11px] text-slate-400">oleh {r.pelaku} • {formatTanggalWaktu(r.waktu)}</p>
                    {r.keterangan && <p className="text-xs text-slate-500 mt-1 leading-relaxed italic whitespace-pre-line">&ldquo;{r.keterangan}&rdquo;</p>}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
