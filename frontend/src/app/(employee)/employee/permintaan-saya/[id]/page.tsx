"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Image as ImageIcon,
  Loader2,
  MessageSquareWarning,
  Paperclip,
  ReceiptText,
  ThumbsUp,
} from "lucide-react";
import PageHeader from "@/components/employee/page-header";
import StatusTiketBadge from "@/components/employee/status-tiket-badge";
import TiketTimeline from "@/components/employee/tiket-timeline";
import { toApiError } from "@/lib/api/errors";
import {
  ambilLampiran,
  getDetailPermintaan,
  mintaRevisi,
  setujuiHasil,
  type BerkasLampiran,
  type PermintaanDetail,
} from "@/lib/api/permintaan";
import { formatTanggal, formatTanggalWaktu } from "@/lib/auth/user-display";

const dl = (ms: number) => ({ "--delay": `${ms}ms` } as React.CSSProperties);

const MIN_ALASAN = 10;

function fmtSize(b: number) {
  return b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`;
}

/** Satu berkas lampiran dengan tombol lihat (gambar atau PDF) dan unduh. */
function BarisBerkas({ berkas, onAmbil }: { berkas: BerkasLampiran; onAmbil: (b: BerkasLampiran, mode: "unduh" | "buka") => void }) {
  const gambar = berkas.tipe_file.startsWith("image/");
  const bisaDibuka = gambar || berkas.tipe_file === "application/pdf";
  const Ikon = gambar ? ImageIcon : FileText;

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 hover:border-blue-200 hover:bg-blue-50/30">
      <div className="flex items-center gap-3 min-w-0">
        <span className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${gambar ? "bg-sky-50 text-sky-600" : "bg-rose-50 text-rose-600"}`}>
          <Ikon className="w-4 h-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-slate-800 truncate">{berkas.nama_file}</p>
          <p className="text-[11px] text-slate-400">{fmtSize(berkas.ukuran_file)} • {gambar ? "Gambar" : "Dokumen"}</p>
        </div>
      </div>
      <div className="flex shrink-0">
        {bisaDibuka && (
          <button type="button" onClick={() => onAmbil(berkas, "buka")} className="p-1.5 rounded-md text-slate-400 hover:text-blue-700 hover:bg-blue-50" aria-label={`Lihat ${berkas.nama_file}`}>
            <Eye className="w-4 h-4" />
          </button>
        )}
        <button type="button" onClick={() => onAmbil(berkas, "unduh")} className="p-1.5 rounded-md text-slate-400 hover:text-blue-700 hover:bg-blue-50" aria-label={`Unduh ${berkas.nama_file}`}>
          <Download className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function DetailPermintaanPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [detail, setDetail] = useState<PermintaanDetail | null>(null);
  const [loadError, setLoadError] = useState<{ status: number; message: string } | null>(null);
  const [mode, setMode] = useState<"idle" | "setuju" | "revisi">("idle");
  const [alasan, setAlasan] = useState("");
  const [sedangKirim, setSedangKirim] = useState(false);
  const [errAksi, setErrAksi] = useState("");
  const [errAlasan, setErrAlasan] = useState("");
  const [sukses, setSukses] = useState("");

  useEffect(() => {
    let dibatalkan = false;
    getDetailPermintaan(id)
      .then((d) => {
        if (!dibatalkan) setDetail(d);
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
    const tidakAda = loadError.status === 404;
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <p className="text-sm font-medium text-slate-800">{tidakAda ? "Permintaan tidak ditemukan." : loadError.message}</p>
        <Link href="/employee/permintaan-saya" className="mt-3 inline-block text-[13px] font-medium text-blue-700 hover:text-blue-900">
          Kembali ke Permintaan Saya
        </Link>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        Memuat permintaan...
      </div>
    );
  }

  const ambil = async (berkas: BerkasLampiran, tujuan: "unduh" | "buka") => {
    setErrAksi("");
    try {
      await ambilLampiran(berkas, tujuan);
    } catch (err) {
      setErrAksi(toApiError(err).message);
    }
  };

  const batal = () => {
    setMode("idle");
    setAlasan("");
    setErrAlasan("");
    setErrAksi("");
  };

  const setuju = async () => {
    setSedangKirim(true);
    setErrAksi("");
    try {
      setDetail(await setujuiHasil(detail.id));
      setSukses("Hasil kerja disetujui. Tiket ditutup dan berstatus Selesai.");
      batal();
    } catch (err) {
      setErrAksi(toApiError(err).message);
    } finally {
      setSedangKirim(false);
    }
  };

  const revisi = async () => {
    setErrAlasan("");
    setErrAksi("");
    if (alasan.trim().length < MIN_ALASAN) {
      setErrAlasan(`Alasan revisi minimal ${MIN_ALASAN} karakter.`);
      return;
    }
    setSedangKirim(true);
    try {
      setDetail(await mintaRevisi(detail.id, alasan));
      setSukses("Permintaan revisi dikirim. Tiket kembali diproses oleh PIC.");
      batal();
    } catch (err) {
      const e = toApiError(err);
      if (e.isValidation && e.errors.alasan?.[0]) setErrAlasan(e.errors.alasan[0]);
      else setErrAksi(e.message);
    } finally {
      setSedangKirim(false);
    }
  };

  const info = [
    { label: "Kategori Layanan", value: detail.layanan?.kategori ?? "-" },
    { label: "Layanan", value: detail.layanan?.nama_layanan ?? "-" },
    { label: "Departemen", value: detail.bagian?.nama_bagian ?? "-" },
    { label: "PIC", value: detail.pic?.name ?? "Belum ada" },
    { label: "Plant", value: detail.lokasi.plant ?? "-" },
    { label: "Lantai", value: detail.lokasi.lantai ?? "-" },
    { label: "Detail Lokasi", value: detail.lokasi.detail || "-" },
    { label: "Urgensi", value: detail.prioritas_label },
  ];

  const putaranTerbaru = [...detail.hasil_kerja.putaran].reverse();
  const riwayatTerbaru = [...detail.riwayat].reverse();

  return (
    <>
      <PageHeader title={detail.judul} description={`Ref: ${detail.kode_tiket} • Diajukan pada ${formatTanggal(detail.dibuat_pada)}`}>
        <StatusTiketBadge status={detail.status} label={detail.status_label} />
        <Link
          href="/employee/permintaan-saya"
          className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-[13px] font-medium text-slate-700 hover:border-blue-200 hover:text-blue-900"
        >
          <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" />
          Kembali
        </Link>
      </PageHeader>

      {sukses && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-800 animate-in fade-in slide-in-from-top-2 duration-300" role="status">
          <CheckCircle2 className="w-4 h-4 shrink-0" />{sukses}
        </div>
      )}

      {errAksi && mode === "idle" && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700" role="alert">
          <AlertCircle className="w-4 h-4 shrink-0" />{errAksi}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid gap-6 content-start">
          <section className="fx-reveal rounded-xl border border-slate-200 bg-white shadow-sm p-5" style={dl(80)}>
            <h2 className="text-[15px] font-semibold text-slate-900 mb-4">Status Timeline</h2>
            <TiketTimeline status={detail.status} />
          </section>

          {/* Tinjau hasil kerja: hanya saat Menunggu Konfirmasi */}
          {detail.bisa_ditinjau && (
            <section className="fx-reveal rounded-xl border border-violet-200 bg-violet-50/40 shadow-sm p-5" style={dl(120)}>
              <h2 className="text-[15px] font-semibold text-slate-900">Tinjau Hasil Kerja</h2>
              <p className="text-xs text-slate-500 mt-0.5">PIC telah mengirim hasil kerja. Periksa hasilnya di bawah, lalu pilih tanggapan Anda.</p>

              {mode === "idle" && (
                <div className="mt-4 flex flex-col sm:flex-row gap-3">
                  <button type="button" onClick={() => setMode("setuju")} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-[13px] font-medium shadow-sm hover:bg-emerald-700 hover:-translate-y-0.5 transition-all duration-300">
                    <ThumbsUp className="w-4 h-4" />Sesuai, Tutup Tiket
                  </button>
                  <button type="button" onClick={() => setMode("revisi")} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-amber-300 text-amber-800 text-[13px] font-medium hover:bg-amber-50 transition-all duration-300">
                    <MessageSquareWarning className="w-4 h-4" />Perlu Revisi
                  </button>
                </div>
              )}

              {mode === "setuju" && (
                <div className="mt-4 rounded-lg border border-emerald-200 bg-white p-4 animate-in fade-in zoom-in-95 duration-300">
                  <p className="text-[13px] text-slate-700">Tiket akan ditutup dan berstatus <strong>Selesai</strong>. Tindakan ini tidak dapat dibatalkan.</p>
                  {errAksi && <p className="mt-2 text-xs text-red-600 font-medium">{errAksi}</p>}
                  <div className="mt-3 flex gap-2">
                    <button type="button" disabled={sedangKirim} onClick={setuju} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-[13px] font-medium hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed">
                      {sedangKirim ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}Ya, Tutup Tiket
                    </button>
                    <button type="button" disabled={sedangKirim} onClick={batal} className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-[13px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60">Batal</button>
                  </div>
                </div>
              )}

              {mode === "revisi" && (
                <div className="mt-4 rounded-lg border border-amber-200 bg-white p-4 animate-in fade-in zoom-in-95 duration-300">
                  <label htmlFor="alasan" className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                    Alasan Revisi <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="alasan"
                    rows={4}
                    maxLength={1000}
                    value={alasan}
                    onChange={(e) => {
                      setAlasan(e.target.value);
                      if (errAlasan) setErrAlasan("");
                    }}
                    placeholder="Jelaskan bagian yang belum sesuai agar PIC dapat memperbaikinya..."
                    className={`w-full px-3.5 py-3 bg-white border rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 resize-y ${errAlasan ? "border-red-500" : "border-slate-300"}`}
                  />
                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{errAlasan ? <span className="text-xs text-red-600 font-medium">{errAlasan}</span> : `Minimal ${MIN_ALASAN} karakter.`}</span>
                    <span>{alasan.trim().length}/1000</span>
                  </div>
                  {errAksi && <p className="mt-2 text-xs text-red-600 font-medium">{errAksi}</p>}
                  <div className="mt-3 flex gap-2">
                    <button type="button" disabled={sedangKirim} onClick={revisi} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white text-[13px] font-medium hover:bg-amber-700 disabled:opacity-60 disabled:cursor-not-allowed">
                      {sedangKirim ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquareWarning className="w-4 h-4" />}Kirim Permintaan Revisi
                    </button>
                    <button type="button" disabled={sedangKirim} onClick={batal} className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-[13px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60">Batal</button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Alasan penolakan, penundaan, dan revisi */}
          {(detail.alasan_tolak || (detail.status === "pending" && detail.alasan_pending) || (detail.alasan_revisi && detail.jumlah_revisi > 0)) && (
            <section className="fx-reveal grid gap-3" style={dl(140)}>
              {detail.alasan_tolak && (
                <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4">
                  <h3 className="text-[13px] font-semibold text-rose-800">Alasan Penolakan</h3>
                  <p className="mt-1 text-[13.5px] text-rose-900/90 whitespace-pre-line">{detail.alasan_tolak}</p>
                </div>
              )}
              {detail.status === "pending" && detail.alasan_pending && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-[13px] font-semibold text-slate-700">Alasan Pending</h3>
                  <p className="mt-1 text-[13.5px] text-slate-700 whitespace-pre-line">{detail.alasan_pending}</p>
                </div>
              )}
              {detail.alasan_revisi && detail.jumlah_revisi > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                  <h3 className="text-[13px] font-semibold text-amber-800">Revisi Terakhir (diminta {detail.jumlah_revisi} kali)</h3>
                  <p className="mt-1 text-[13.5px] text-amber-900/90 whitespace-pre-line">{detail.alasan_revisi}</p>
                </div>
              )}
            </section>
          )}

          <section className="fx-reveal rounded-xl border border-slate-200 bg-white shadow-sm" style={dl(160)}>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center"><ReceiptText className="w-5 h-5" /></span>
                <div>
                  <h2 className="text-[15px] font-semibold text-slate-900">Ringkasan Permintaan</h2>
                  <p className="text-xs text-slate-500">Informasi lengkap detail pengajuan layanan</p>
                </div>
              </div>
              <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-100 text-slate-600">{detail.kode_tiket}</span>
            </div>

            <div className="p-5 grid gap-5">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                {info.map((i) => (
                  <div key={i.label}>
                    <dt className="text-xs text-slate-400">{i.label}</dt>
                    <dd className="text-[13.5px] font-medium text-slate-800 mt-0.5">{i.value}</dd>
                  </div>
                ))}
              </dl>

              <div>
                <h3 className="text-xs text-slate-400 mb-1.5">Deskripsi</h3>
                <div className="rounded-lg bg-slate-50 border border-slate-100 p-4 text-[13.5px] text-slate-700 leading-relaxed whitespace-pre-line">
                  {detail.deskripsi}
                </div>
              </div>

              <div>
                <h3 className="text-xs text-slate-400 mb-1.5 inline-flex items-center gap-1.5"><Paperclip className="w-3.5 h-3.5" />Lampiran Pengajuan</h3>
                {detail.lampiran.length === 0 ? (
                  <p className="text-[13px] text-slate-400">Tidak ada lampiran.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {detail.lampiran.map((b) => <BarisBerkas key={b.id} berkas={b} onAmbil={ambil} />)}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Hasil kerja PIC, semua putaran */}
          {putaranTerbaru.length > 0 && (
            <section className="fx-reveal rounded-xl border border-slate-200 bg-white shadow-sm" style={dl(200)}>
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="text-[15px] font-semibold text-slate-900">Hasil Kerja PIC</h2>
                <p className="text-xs text-slate-500">
                  Dikirim terakhir {formatTanggalWaktu(detail.hasil_kerja.dikirim_pada)}. Bukti dari pengiriman sebelumnya tetap tersimpan.
                </p>
              </div>
              <div className="p-5 grid gap-5">
                {detail.hasil_kerja.catatan && (
                  <div>
                    <h3 className="text-xs text-slate-400 mb-1.5">Catatan PIC (pengiriman terakhir)</h3>
                    <div className="rounded-lg bg-slate-50 border border-slate-100 p-4 text-[13.5px] text-slate-700 whitespace-pre-line">{detail.hasil_kerja.catatan}</div>
                  </div>
                )}
                {putaranTerbaru.map((p, i) => (
                  <div key={p.putaran}>
                    <h3 className="text-xs font-medium text-slate-500 mb-2">
                      Pengiriman ke-{p.putaran}{i === 0 ? " (terbaru)" : ""}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {p.berkas.map((b) => <BarisBerkas key={b.id} berkas={b} onAmbil={ambil} />)}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Riwayat aktivitas */}
        <section className="fx-reveal rounded-xl border border-slate-200 bg-white shadow-sm p-5 h-fit" style={dl(240)}>
          <h2 className="text-[15px] font-semibold text-slate-900 mb-5">Riwayat Aktivitas</h2>
          {riwayatTerbaru.length === 0 ? (
            <p className="text-sm text-slate-400">Belum ada aktivitas.</p>
          ) : (
            <ol className="relative border-l-2 border-slate-100 ml-2 space-y-6">
              {riwayatTerbaru.map((a, i) => (
                <li key={a.id} className="fx-reveal-x pl-5 relative" style={dl(320 + i * 110)}>
                  <span className={`absolute -left-[7px] top-1 w-3 h-3 rounded-full ring-4 ring-white ${i === 0 ? "bg-blue-600" : "bg-slate-300"}`} />
                  <p className="text-[13px] font-medium text-slate-900">{a.judul}</p>
                  <p className="text-xs text-slate-500 mt-0.5">oleh {a.pelaku}</p>
                  {a.keterangan && <p className="text-xs text-slate-500 mt-1 italic whitespace-pre-line">&ldquo;{a.keterangan}&rdquo;</p>}
                  <p className="text-[11px] text-slate-400 mt-0.5">{formatTanggalWaktu(a.waktu)}</p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </>
  );
}
