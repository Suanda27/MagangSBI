"use client";

import { useRef, useState } from "react";
import { Ban, Check, CheckCircle2, FileText, Image as ImageIcon, Info, PauseCircle, PlayCircle, Trash2, UploadCloud, X } from "lucide-react";
import { Modal, ModalHeader } from "@/components/shared/overlay";
import { ukuranFile, validasiFile } from "@/lib/shared/format";
import { usePicStore } from "@/lib/pic/store";
import type { Lampiran, Permintaan } from "@/lib/pic/types";

const btnGhost = "px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors";

/* ---------- Terima ---------- */

export function TerimaDialog({ permintaan, onClose, onDone }: { permintaan: Permintaan | null; onClose: () => void; onDone?: () => void }) {
  const { terima, toast } = usePicStore();
  const [catatan, setCatatan] = useState("");
  if (!permintaan) return null;
  const submit = () => {
    terima(permintaan.id, catatan);
    toast({ tone: "success", title: "Permintaan diterima", desc: `#${permintaan.id} kini berstatus Sedang Diproses.` });
    setCatatan("");
    onClose();
    onDone?.();
  };
  return (
    <Modal open onClose={onClose}>
      <ModalHeader icon={Check} tone="emerald" title="Terima Permintaan?" onClose={onClose} />
      <div className="p-5 flex flex-col gap-3 overflow-y-auto">
        <p className="text-xs text-slate-600 leading-relaxed">
          Terima permintaan <span className="font-semibold text-slate-900">#{permintaan.id}</span> dari {permintaan.pengaju.nama}?
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
            placeholder="Instruksi penugasan atau arahan awal..."
            className="w-full text-xs p-2.5 rounded-lg border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 resize-none transition-all"
          />
        </label>
      </div>
      <div className="p-4 border-t border-slate-100 flex justify-end gap-2.5">
        <button className={btnGhost} onClick={onClose}>Batal</button>
        <button className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-sm" onClick={submit}>
          <Check className="w-4 h-4" /> Terima & Mulai
        </button>
      </div>
    </Modal>
  );
}

/* ---------- Tolak ---------- */

export function TolakDialog({ permintaan, onClose, onDone }: { permintaan: Permintaan | null; onClose: () => void; onDone?: () => void }) {
  const { tolak, toast } = usePicStore();
  const [alasan, setAlasan] = useState("");
  const [err, setErr] = useState(false);
  if (!permintaan) return null;
  const submit = () => {
    if (alasan.trim().length < 10) return setErr(true);
    tolak(permintaan.id, alasan);
    toast({ tone: "info", title: "Permintaan ditolak", desc: `Alasan penolakan #${permintaan.id} dikirim ke pengaju.` });
    setAlasan("");
    setErr(false);
    onClose();
    onDone?.();
  };
  return (
    <Modal open onClose={onClose}>
      <ModalHeader icon={Ban} tone="rose" title="Tolak Permintaan?" onClose={onClose} />
      <div className="p-5 flex flex-col gap-3 overflow-y-auto">
        <p className="text-xs text-slate-600 leading-relaxed">
          Anda akan menolak <span className="font-semibold text-slate-900">#{permintaan.id}</span>. Cantumkan alasan yang jelas untuk pengaju.
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
            placeholder="Contoh: Permintaan di luar cakupan layanan tim kami atau data belum lengkap..."
            className={`w-full text-xs p-2.5 rounded-lg border text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 resize-none transition-all ${err ? "border-rose-400 ring-4 ring-rose-100" : "border-slate-300 focus:border-rose-400 focus:ring-rose-100"}`}
          />
          {err && <span className="text-[11px] text-rose-600">Alasan penolakan wajib diisi (minimal 10 karakter).</span>}
        </label>
        <div className="bg-amber-50 rounded-lg p-2.5 border border-amber-200/70 text-[11px] text-amber-800 flex items-start gap-2">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          <span>Alasan ini terlihat oleh pengaju pada riwayat permintaannya.</span>
        </div>
      </div>
      <div className="p-4 border-t border-slate-100 flex justify-end gap-2.5">
        <button className={btnGhost} onClick={onClose}>Batal</button>
        <button className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-sm" onClick={submit}>
          <Ban className="w-4 h-4" /> Tolak Permintaan
        </button>
      </div>
    </Modal>
  );
}

/* ---------- Update status (Diproses / Pending) ---------- */

export function StatusDialog({ permintaan, onClose }: { permintaan: Permintaan | null; onClose: () => void }) {
  const { ubahStatus, toast } = usePicStore();
  const [target, setTarget] = useState<"diproses" | "pending">("pending");
  const [catatan, setCatatan] = useState("");
  const [err, setErr] = useState(false);
  if (!permintaan) return null;
  const submit = () => {
    if (target === "pending" && catatan.trim().length < 5) return setErr(true);
    ubahStatus(permintaan.id, target, catatan);
    toast({ tone: "success", title: "Status diperbarui", desc: `#${permintaan.id} → ${target === "pending" ? "Pending" : "Sedang Diproses"}.` });
    setCatatan("");
    setErr(false);
    onClose();
  };
  const opt = (v: "diproses" | "pending", title: string, desc: string, Icon: typeof PlayCircle) => (
    <button
      type="button"
      onClick={() => {
        setTarget(v);
        setErr(false);
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
          Status saat ini: <span className="font-semibold text-slate-800">{permintaan.status === "pending" ? "Pending" : "Sedang Diproses"}</span>
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
            placeholder={target === "pending" ? "Jelaskan alasan penundaan..." : "Tuliskan perkembangan pengerjaan..."}
            className={`w-full text-xs p-2.5 rounded-lg border text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 resize-none transition-all ${err ? "border-rose-400 ring-4 ring-rose-100" : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"}`}
          />
          {err && <span className="text-[11px] text-rose-600">Alasan pending wajib diisi.</span>}
        </label>
      </div>
      <div className="p-4 border-t border-slate-100 flex justify-end gap-2.5">
        <button className={btnGhost} onClick={onClose}>Batal</button>
        <button className="px-4 py-2 text-xs font-semibold bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-colors shadow-sm" onClick={submit}>Simpan Perubahan</button>
      </div>
    </Modal>
  );
}

/* ---------- Upload bukti & selesaikan ---------- */

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
  files: Lampiran[];
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
              <span className="truncate font-medium text-slate-800">{f.nama}</span>
              <span className="text-slate-400 shrink-0">{ukuranFile(f.ukuran)}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto shrink-0" />
              <button onClick={() => onRemove(f.id)} className="text-slate-300 hover:text-rose-600 transition-colors" aria-label={`Hapus ${f.nama}`}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ProofUploadForm({ permintaan, onDone }: { permintaan: Permintaan; onDone?: () => void }) {
  const { selesaikan, toast } = usePicStore();
  const [foto, setFoto] = useState<Lampiran[]>([]);
  const [dok, setDok] = useState<Lampiran[]>([]);
  const [catatan, setCatatan] = useState("");
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const tambah = (tipe: "gambar" | "dokumen") => (files: File[]) => {
    const galat: string[] = [];
    const ok: Lampiran[] = [];
    for (const f of files) {
      const e = validasiFile(f);
      const salahJenis = tipe === "gambar" ? f.type === "application/pdf" : f.type !== "application/pdf";
      if (e) galat.push(e);
      else if (salahJenis) galat.push(`${f.name}: ${tipe === "gambar" ? "gunakan kolom dokumen untuk PDF" : "gunakan kolom foto untuk gambar"}.`);
      else ok.push({ id: `up-${Math.random().toString(36).slice(2, 9)}`, nama: f.name, ukuran: f.size, tipe, oleh: "pic" });
    }
    setErr(galat.length ? galat.join(" ") : null);
    (tipe === "gambar" ? setFoto : setDok)((cur) => [...cur, ...ok]);
  };

  const total = foto.length + dok.length;
  const klikSelesai = () => {
    if (total === 0) return setErr("Unggah minimal satu bukti penyelesaian (foto atau dokumen) sebelum menutup tiket.");
    setErr(null);
    setKonfirmasi(true);
  };
  const kirim = () => {
    selesaikan(permintaan.id, { catatan, bukti: [...foto, ...dok] });
    toast({ tone: "success", title: "Tiket diselesaikan", desc: `#${permintaan.id} ditutup dengan ${total} bukti penyelesaian.` });
    setKonfirmasi(false);
    onDone?.();
  };

  return (
    <section className="bg-white border border-border-subtle rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2"><UploadCloud className="w-4 h-4 text-blue-600" /> Upload Bukti Penyelesaian</h2>
        <p className="text-xs text-slate-500 mt-1">Lampirkan dokumentasi pengerjaan sebelum menyelesaikan tiket. Format JPG, PNG, atau PDF — maksimal 5 MB per berkas.</p>
      </div>
      <div className="p-5 grid md:grid-cols-2 gap-5">
        <Dropzone icon={ImageIcon} title="Foto Pekerjaan" hint="JPG, PNG" accept="image/jpeg,image/png" files={foto} onAdd={tambah("gambar")} onRemove={(id) => setFoto((c) => c.filter((f) => f.id !== id))} />
        <Dropzone icon={FileText} title="Dokumen Pendukung" hint="PDF" accept="application/pdf" files={dok} onAdd={tambah("dokumen")} onRemove={(id) => setDok((c) => c.filter((f) => f.id !== id))} />
      </div>
      <div className="px-5 pb-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-700 flex justify-between">Catatan Penyelesaian <span className="font-normal text-slate-400">{catatan.length}/500</span></span>
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
        <p className="text-xs text-slate-500">Konfirmasi bahwa seluruh pengerjaan teknis telah selesai dilakukan. <span className="font-medium text-slate-700">{total} bukti</span> siap diunggah.</p>
        <button onClick={klikSelesai} className="px-5 py-2.5 text-xs font-semibold bg-blue-700 hover:bg-blue-800 text-white rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5">
          <CheckCircle2 className="w-4 h-4" /> Tandai Selesai
        </button>
      </div>

      <Modal open={konfirmasi} onClose={() => setKonfirmasi(false)}>
        <ModalHeader icon={CheckCircle2} tone="emerald" title="Selesaikan Tiket?" onClose={() => setKonfirmasi(false)} />
        <div className="p-5 text-xs text-slate-600 leading-relaxed">
          Tiket <span className="font-semibold text-slate-900">#{permintaan.id}</span> akan ditutup dengan status <span className="font-medium text-emerald-700">Selesai</span>. Setelah ditutup, status tidak dapat diubah lagi.
        </div>
        <div className="p-4 border-t border-slate-100 flex justify-end gap-2.5">
          <button className={btnGhost} onClick={() => setKonfirmasi(false)}>Periksa Lagi</button>
          <button className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm" onClick={kirim}>Ya, Selesaikan</button>
        </div>
      </Modal>
    </section>
  );
}
