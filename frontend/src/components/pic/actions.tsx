"use client";

import { useRef, useState } from "react";
import { Ban, Check, CheckCircle2, FileText, Image as ImageIcon, Info, PauseCircle, PlayCircle, Send, Trash2, UploadCloud, X } from "lucide-react";
import { Modal, ModalHeader } from "@/components/shared/overlay";
import { errorMessage } from "@/lib/api/errors";
import { ukuranFile, validasiFile } from "@/lib/shared/format";
import { TUTUP_OTOMATIS_HARI_KERJA } from "@/lib/pic/format";
import { usePicStore } from "@/lib/pic/store";
import type { Permintaan } from "@/lib/pic/types";

/** Batas server: 1 sampai 5 bukti per pengiriman hasil. */
const MAKS_BERKAS = 5;

const btnGhost = "px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50";

/** Pesan galat dari server (403/409/422) ditampilkan apa adanya di dalam dialog. */
function GalatAksi({ pesan }: { pesan: string | null }) {
  if (!pesan) return null;
  return (
    <div role="alert" className="flex items-start gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200/70 rounded-lg px-3 py-2">
      <X className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {pesan}
    </div>
  );
}

type Selesai = (terbaru: Permintaan) => void;

/* ---------- Terima ---------- */

export function TerimaDialog({ permintaan, onClose, onDone }: { permintaan: Permintaan | null; onClose: () => void; onDone?: Selesai }) {
  const { terima, toast } = usePicStore();
  const [catatan, setCatatan] = useState("");
  const [proses, setProses] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  if (!permintaan) return null;
  const submit = async () => {
    setProses(true);
    setGalat(null);
    try {
      const terbaru = await terima(permintaan.id, catatan);
      toast({ tone: "success", title: "Permintaan diterima", desc: `#${permintaan.kode} kini berstatus Sedang Diproses.` });
      setCatatan("");
      onClose();
      onDone?.(terbaru);
    } catch (e) {
      setGalat(errorMessage(e, "Gagal menerima permintaan."));
    } finally {
      setProses(false);
    }
  };
  return (
    <Modal open onClose={onClose}>
      <ModalHeader icon={Check} tone="emerald" title="Terima Permintaan?" onClose={onClose} />
      <div className="p-5 flex flex-col gap-3 overflow-y-auto">
        <p className="text-xs text-slate-600 leading-relaxed">
          Terima permintaan <span className="font-semibold text-slate-900">#{permintaan.kode}</span> dari {permintaan.pengaju.nama}?
        </p>
        <ul className="bg-slate-50 rounded-lg p-3 border border-slate-100 text-xs text-slate-600 flex flex-col gap-1.5">
          <li>• Status berpindah menjadi <span className="font-medium text-blue-700">Sedang Diproses</span>.</li>
          <li>• Anda tercatat sebagai PIC penanggung jawab.</li>
          <li>• Pengaju menerima pembaruan status pada self-tracking.</li>
        </ul>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Catatan Triage (opsional)</span>
          <textarea
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            rows={2}
            maxLength={1000}
            placeholder="Instruksi penugasan atau arahan awal..."
            className="w-full text-xs p-2.5 rounded-lg border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 resize-none transition-all"
          />
        </label>
        <GalatAksi pesan={galat} />
      </div>
      <div className="p-4 border-t border-slate-100 flex justify-end gap-2.5">
        <button className={btnGhost} onClick={onClose} disabled={proses}>Batal</button>
        <button disabled={proses} className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-sm" onClick={submit}>
          <Check className="w-4 h-4" /> {proses ? "Memproses..." : "Terima & Mulai"}
        </button>
      </div>
    </Modal>
  );
}

/* ---------- Tolak ---------- */

export function TolakDialog({ permintaan, onClose, onDone }: { permintaan: Permintaan | null; onClose: () => void; onDone?: Selesai }) {
  const { tolak, toast } = usePicStore();
  const [alasan, setAlasan] = useState("");
  const [err, setErr] = useState(false);
  const [proses, setProses] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  if (!permintaan) return null;
  const submit = async () => {
    if (alasan.trim().length < 10) return setErr(true);
    setProses(true);
    setGalat(null);
    try {
      const terbaru = await tolak(permintaan.id, alasan);
      toast({ tone: "info", title: "Permintaan ditolak", desc: `Alasan penolakan #${permintaan.kode} dikirim ke pengaju.` });
      setAlasan("");
      setErr(false);
      onClose();
      onDone?.(terbaru);
    } catch (e) {
      setGalat(errorMessage(e, "Gagal menolak permintaan."));
    } finally {
      setProses(false);
    }
  };
  return (
    <Modal open onClose={onClose}>
      <ModalHeader icon={Ban} tone="rose" title="Tolak Permintaan?" onClose={onClose} />
      <div className="p-5 flex flex-col gap-3 overflow-y-auto">
        <p className="text-xs text-slate-600 leading-relaxed">
          Anda akan menolak <span className="font-semibold text-slate-900">#{permintaan.kode}</span>. Cantumkan alasan yang jelas untuk pengaju.
        </p>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider flex justify-between">
            <span>Alasan Penolakan <span className="text-rose-500">*</span></span>
            <span className="font-normal text-slate-400 normal-case tracking-normal">{alasan.trim().length}/10 min.</span>
          </span>
          <textarea
            value={alasan}
            onChange={(e) => {
              setAlasan(e.target.value);
              setErr(false);
            }}
            rows={3}
            maxLength={1000}
            placeholder="Contoh: Permintaan di luar cakupan layanan tim kami atau data belum lengkap..."
            className={`w-full text-xs p-2.5 rounded-lg border text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 resize-none transition-all ${err ? "border-rose-400 ring-4 ring-rose-100" : "border-slate-300 focus:border-rose-400 focus:ring-rose-100"}`}
          />
          {err && <span className="text-[11px] text-rose-600">Alasan penolakan wajib diisi (minimal 10 karakter).</span>}
        </label>
        <div className="bg-amber-50 rounded-lg p-2.5 border border-amber-200/70 text-[11px] text-amber-800 flex items-start gap-2">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          <span>Alasan ini terlihat oleh pengaju pada riwayat permintaannya.</span>
        </div>
        <GalatAksi pesan={galat} />
      </div>
      <div className="p-4 border-t border-slate-100 flex justify-end gap-2.5">
        <button className={btnGhost} onClick={onClose} disabled={proses}>Batal</button>
        <button disabled={proses} className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-sm" onClick={submit}>
          <Ban className="w-4 h-4" /> {proses ? "Memproses..." : "Tolak Permintaan"}
        </button>
      </div>
    </Modal>
  );
}

/* ---------- Update status (Diproses / Pending) ---------- */

export function StatusDialog({ permintaan, onClose, onDone }: { permintaan: Permintaan | null; onClose: () => void; onDone?: Selesai }) {
  const { ubahStatus, toast } = usePicStore();
  // Tujuan bawaan = kebalikan status sekarang: tiket Pending biasanya dilanjutkan, tiket Diproses ditunda.
  const [target, setTarget] = useState<"diproses" | "pending">(permintaan?.status === "pending" ? "diproses" : "pending");
  const [catatan, setCatatan] = useState("");
  const [err, setErr] = useState(false);
  const [proses, setProses] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  if (!permintaan) return null;
  const sekarang = permintaan.status === "pending" ? "pending" : "diproses";
  const submit = async () => {
    if (target === sekarang) return setGalat(`Tiket sudah berstatus ${target === "pending" ? "Pending" : "Sedang Diproses"}. Pilih status lain.`);
    if (target === "pending" && catatan.trim().length < 5) return setErr(true);
    setProses(true);
    setGalat(null);
    try {
      const terbaru = await ubahStatus(permintaan.id, target, catatan);
      toast({ tone: "success", title: "Status diperbarui", desc: `#${permintaan.kode} → ${target === "pending" ? "Pending" : "Sedang Diproses"}.` });
      setCatatan("");
      setErr(false);
      onClose();
      onDone?.(terbaru);
    } catch (e) {
      setGalat(errorMessage(e, "Gagal memperbarui status."));
    } finally {
      setProses(false);
    }
  };
  const opt = (v: "diproses" | "pending", title: string, desc: string, Icon: typeof PlayCircle) => (
    <button
      type="button"
      onClick={() => {
        setTarget(v);
        setErr(false);
        setGalat(null);
      }}
      className={`text-left p-3 rounded-lg border transition-all duration-300 flex gap-3 ${target === v ? "border-blue-500 bg-blue-50/60 ring-4 ring-blue-100" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}
    >
      <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${target === v ? "text-blue-700" : "text-slate-400"}`} />
      <span>
        <span className="block text-[13px] font-semibold text-slate-900">{title}</span>
        <span className="block text-xs text-slate-500 mt-0.5">{desc}</span>
      </span>
    </button>
  );
  return (
    <Modal open onClose={onClose}>
      <ModalHeader icon={PauseCircle} tone="blue" title="Update Progres Pengerjaan" onClose={onClose} />
      <div className="p-5 flex flex-col gap-3 overflow-y-auto">
        <p className="text-xs text-slate-500">
          Status saat ini: <span className="font-semibold text-slate-800">{sekarang === "pending" ? "Pending" : "Sedang Diproses"}</span>
        </p>
        <div className="grid gap-2.5">
          {opt("diproses", "Sedang Diproses", "Pengerjaan aktif berjalan.", PlayCircle)}
          {opt("pending", "Pending", "Tertunda — menunggu sparepart, vendor, atau pihak lain.", PauseCircle)}
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
            Catatan Progres {target === "pending" && <span className="text-rose-500">*</span>}
          </span>
          <textarea
            value={catatan}
            onChange={(e) => {
              setCatatan(e.target.value);
              setErr(false);
            }}
            rows={3}
            maxLength={1000}
            placeholder={target === "pending" ? "Jelaskan alasan penundaan..." : "Tuliskan perkembangan pengerjaan..."}
            className={`w-full text-xs p-2.5 rounded-lg border text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 resize-none transition-all ${err ? "border-rose-400 ring-4 ring-rose-100" : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"}`}
          />
          {err && <span className="text-[11px] text-rose-600">Alasan pending wajib diisi (minimal 5 karakter).</span>}
        </label>
        <GalatAksi pesan={galat} />
      </div>
      <div className="p-4 border-t border-slate-100 flex justify-end gap-2.5">
        <button className={btnGhost} onClick={onClose} disabled={proses}>Batal</button>
        <button disabled={proses} className="px-4 py-2 text-xs font-semibold bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white rounded-lg transition-colors shadow-sm" onClick={submit}>
          {proses ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>
    </Modal>
  );
}

/* ---------- Upload hasil kerja & kirim untuk ditinjau ---------- */

interface BerkasPilihan {
  id: string;
  file: File;
  gambar: boolean;
}

function Dropzone({
  icon: Icon,
  title,
  hint,
  accept,
  files,
  onAdd,
  onRemove,
}: {
  icon: typeof ImageIcon;
  title: string;
  hint: string;
  accept: string;
  files: BerkasPilihan[];
  onAdd: (f: File[]) => void;
  onRemove: (id: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
        <Icon className="w-4 h-4 text-slate-400" /> {title}
        <span className="ml-auto font-normal text-[11px] text-slate-400">{hint}</span>
      </div>
      <div
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          onAdd(Array.from(e.dataTransfer.files));
        }}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-5 flex flex-col items-center gap-1.5 text-center transition-all duration-300 ${over ? "border-blue-500 bg-blue-50 scale-[1.01]" : "border-slate-200 bg-slate-50/40 hover:border-blue-300 hover:bg-blue-50/40"}`}
      >
        <span className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
          <UploadCloud className="w-4 h-4" />
        </span>
        <p className="text-xs text-slate-600">Tarik berkas ke sini atau <span className="text-blue-700 font-medium">klik untuk memilih</span></p>
        <input ref={input} type="file" multiple accept={accept} className="hidden" onChange={(e) => { onAdd(Array.from(e.target.files ?? [])); e.target.value = ""; }} />
      </div>
      {files.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {files.map((f) => (
            <li key={f.id} className="fx-reveal-x flex items-center gap-2.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs">
              <Icon className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate font-medium text-slate-800">{f.file.name}</span>
              <span className="text-slate-400 shrink-0">{ukuranFile(f.file.size)}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto shrink-0" />
              <button onClick={() => onRemove(f.id)} className="text-slate-300 hover:text-rose-600 transition-colors" aria-label={`Hapus ${f.file.name}`}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ProofUploadForm({ permintaan, onDone }: { permintaan: Permintaan; onDone?: Selesai }) {
  const { kirimHasil, toast } = usePicStore();
  const [berkas, setBerkas] = useState<BerkasPilihan[]>([]);
  const [catatan, setCatatan] = useState("");
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [proses, setProses] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [galat, setGalat] = useState<string | null>(null);

  const foto = berkas.filter((b) => b.gambar);
  const dok = berkas.filter((b) => !b.gambar);

  const tambah = (gambar: boolean) => (files: File[]) => {
    const pesan: string[] = [];
    const ok: BerkasPilihan[] = [];
    for (const f of files) {
      if (berkas.length + ok.length >= MAKS_BERKAS) {
        pesan.push(`Maksimal ${MAKS_BERKAS} berkas untuk satu pengiriman hasil.`);
        break;
      }
      const e = validasiFile(f);
      const salahJenis = gambar ? f.type === "application/pdf" : f.type !== "application/pdf";
      if (e) pesan.push(e);
      else if (salahJenis) pesan.push(`${f.name}: ${gambar ? "gunakan kolom dokumen untuk PDF" : "gunakan kolom foto untuk gambar"}.`);
      else ok.push({ id: `up-${Math.random().toString(36).slice(2, 9)}`, file: f, gambar });
    }
    setErr(pesan.length ? pesan.join(" ") : null);
    setBerkas((cur) => [...cur, ...ok]);
  };

  const klikSelesai = () => {
    if (berkas.length === 0) return setErr("Unggah minimal satu berkas hasil pekerjaan (foto atau dokumen) sebelum mengirim untuk ditinjau.");
    setErr(null);
    setGalat(null);
    setKonfirmasi(true);
  };
  const kirim = async () => {
    setProses(true);
    setGalat(null);
    try {
      const terbaru = await kirimHasil(permintaan.id, { catatan, bukti: berkas.map((b) => b.file) });
      toast({ tone: "success", title: "Hasil dikirim untuk ditinjau", desc: `#${permintaan.kode} menunggu konfirmasi ${permintaan.pengaju.nama}.` });
      setKonfirmasi(false);
      setBerkas([]);
      setCatatan("");
      onDone?.(terbaru);
    } catch (e) {
      setGalat(errorMessage(e, "Gagal mengirim hasil."));
    } finally {
      setProses(false);
    }
  };

  return (
    <section className="bg-white border border-border-subtle rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2"><UploadCloud className="w-4 h-4 text-blue-600" /> Kirim Hasil Pengerjaan</h2>
        <p className="text-xs text-slate-500 mt-1">Lampirkan hasil atau dokumentasi pengerjaan agar pengaju dapat meninjaunya. Format JPG, PNG, atau PDF — maksimal 5 MB per berkas dan {MAKS_BERKAS} berkas.</p>
      </div>
      <div className="p-5 grid md:grid-cols-2 gap-5">
        <Dropzone icon={ImageIcon} title="Foto Pekerjaan" hint="JPG, PNG" accept="image/jpeg,image/png" files={foto} onAdd={tambah(true)} onRemove={(id) => setBerkas((c) => c.filter((f) => f.id !== id))} />
        <Dropzone icon={FileText} title="Dokumen Pendukung" hint="PDF" accept="application/pdf" files={dok} onAdd={tambah(false)} onRemove={(id) => setBerkas((c) => c.filter((f) => f.id !== id))} />
      </div>
      <div className="px-5 pb-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-700 flex justify-between">Catatan Hasil Pekerjaan <span className="font-normal text-slate-400">{catatan.length}/500</span></span>
          <textarea
            value={catatan}
            maxLength={500}
            onChange={(e) => setCatatan(e.target.value)}
            rows={3}
            placeholder="Ringkas tindakan yang dilakukan dan hasil pengujian..."
            className="w-full text-xs p-3 rounded-lg border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 resize-none transition-all"
          />
        </label>
        {err && (
          <div className="mt-3 flex items-start gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200/70 rounded-lg px-3 py-2 fx-reveal">
            <X className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {err}
          </div>
        )}
      </div>
      <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-xs text-slate-500">Pengaju akan meninjau hasil ini: menyetujui (tiket selesai) atau meminta revisi. <span className="font-medium text-slate-700">{berkas.length} berkas</span> siap dikirim.</p>
        <button onClick={klikSelesai} className="px-5 py-2.5 text-xs font-semibold bg-blue-700 hover:bg-blue-800 text-white rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5">
          <Send className="w-4 h-4" /> Kirim untuk Ditinjau
        </button>
      </div>

      <Modal open={konfirmasi} onClose={() => !proses && setKonfirmasi(false)}>
        <ModalHeader icon={Send} tone="blue" title="Kirim Hasil untuk Ditinjau?" onClose={() => !proses && setKonfirmasi(false)} />
        <div className="p-5 flex flex-col gap-3 text-xs text-slate-600 leading-relaxed">
          <p>
            Hasil untuk tiket <span className="font-semibold text-slate-900">#{permintaan.kode}</span> akan dikirim ke {permintaan.pengaju.nama} dengan status <span className="font-medium text-sky-700">Menunggu Konfirmasi</span>. Tiket selesai bila disetujui, atau kembali ke Anda bila ada revisi. Tanpa tanggapan, tiket ditutup otomatis setelah {TUTUP_OTOMATIS_HARI_KERJA} hari kerja.
          </p>
          <GalatAksi pesan={galat} />
        </div>
        <div className="p-4 border-t border-slate-100 flex justify-end gap-2.5">
          <button className={btnGhost} onClick={() => setKonfirmasi(false)} disabled={proses}>Periksa Lagi</button>
          <button disabled={proses} className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-lg shadow-sm" onClick={kirim}>
            {proses ? "Mengirim..." : "Ya, Kirim"}
          </button>
        </div>
      </Modal>
    </section>
  );
}
