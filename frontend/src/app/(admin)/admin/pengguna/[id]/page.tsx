"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Pencil, UserX, CheckCircle2, Mail, Building2, Phone, Briefcase, Calendar, ShieldCheck, Wrench, Loader2, TriangleAlert, UserSearch } from "lucide-react";
import { KonfirmasiStatusMaster, type TargetStatusMaster } from "@/components/admin/master-dialogs";
import { Toasts, useToasts } from "@/components/admin/settings-ui";
import { getLayananAdmin, getUser, updateUser, type LayananAdminApi, type StatusMaster } from "@/lib/api/admin";
import { errorMessage, toApiError } from "@/lib/api/errors";
import type { User } from "@/lib/api/types";
import { takeFlash } from "@/lib/admin/flash";
import { keHasil, ROLE_BADGE, ROLE_LABEL } from "@/lib/admin/pengguna";
import { useAuth } from "@/lib/auth/auth-context";
import { formatTanggal, initialsOf } from "@/lib/auth/user-display";

type Muat = { status: "loading" } | { status: "error"; pesan: string; tidakAda: boolean } | { status: "ready"; user: User };

export default function DetailPenggunaPage() {
  const params = useParams<{ id: string }>();
  const toast = useToasts();
  const { user: saya } = useAuth();

  const [muat, setMuat] = useState<Muat>({ status: "loading" });
  const [layanan, setLayanan] = useState<LayananAdminApi[]>([]);
  const [percobaan, setPercobaan] = useState(0);
  const [konfirmasi, setKonfirmasi] = useState<TargetStatusMaster | null>(null);

  useEffect(() => {
    let batal = false;
    getUser(params.id)
      .then(async (u) => {
        if (batal) return;
        setMuat({ status: "ready", user: u });
        // PIC dan Supervisor bekerja pada satu section: tampilkan layanan section tersebut.
        if (u.bagian && (u.role === "pic" || u.role === "supervisor")) {
          const hasil = await getLayananAdmin({ id_bagian: u.bagian.id, per_page: 100 }).catch(() => null);
          if (!batal && hasil) setLayanan(hasil.data);
        } else if (!batal) {
          setLayanan([]);
        }
      })
      .catch((e) => {
        if (!batal) setMuat({ status: "error", pesan: errorMessage(e, "Gagal memuat data pengguna."), tidakAda: toApiError(e).status === 404 });
      });
    return () => {
      batal = true;
    };
  }, [params.id, percobaan]);

  useEffect(() => {
    const flash = takeFlash();
    if (flash) toast.push({ tone: "success", title: flash.title, desc: flash.desc });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (muat.status === "loading") {
    return (
      <div className="py-24 flex items-center justify-center gap-3 text-sm text-slate-500" role="status" aria-live="polite">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> Memuat data pengguna...
      </div>
    );
  }

  if (muat.status === "error") {
    return (
      <>
        <Link href="/admin/pengguna" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Pengguna
        </Link>
        <div className="bg-white rounded-xl border border-slate-200 py-14 px-6 flex flex-col items-center text-center gap-3" role="alert">
          <span className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">{muat.tidakAda ? <UserSearch className="w-6 h-6" /> : <TriangleAlert className="w-6 h-6" />}</span>
          <h1 className="text-sm font-semibold text-slate-900">{muat.tidakAda ? "Pengguna tidak ditemukan" : "Data pengguna tidak dapat dimuat"}</h1>
          <p className="text-xs text-slate-500 max-w-sm">{muat.pesan}</p>
          {!muat.tidakAda && <button onClick={() => { setMuat({ status: "loading" }); setPercobaan((n) => n + 1); }} className="px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-colors">Coba Lagi</button>}
        </div>
      </>
    );
  }

  const u = muat.user;
  const aktif = u.status === "aktif";
  const dirisendiri = saya?.id === u.id;

  const mintaStatus = (ke: StatusMaster) =>
    setKonfirmasi({
      jenis: "Akun",
      nama: u.name,
      ke,
      dampakNonaktif: "Pengguna ini tidak dapat masuk ke sistem sampai akunnya diaktifkan kembali, dan sesi yang sedang berjalan berakhir pada permintaan berikutnya. Data dan riwayatnya tidak dihapus. PIC yang masih memegang tiket berjalan tidak dapat dinonaktifkan.",
      dampakAktif: "Pengguna ini dapat kembali masuk dan menggunakan sistem sesuai perannya.",
      jalankan: async () => {
        try {
          const baru = await updateUser(u.id, { status: ke });
          setMuat({ status: "ready", user: baru });
          toast.push({ tone: "success", title: ke === "nonaktif" ? "Akun dinonaktifkan" : "Akun diaktifkan", desc: u.name });
          return { ok: true };
        } catch (e) {
          return keHasil(e);
        }
      },
    });

  const info = (label: string, nilai: React.ReactNode, mono = false) => (
    <div className="bg-slate-50 rounded-lg p-3 flex flex-col gap-1 min-w-0">
      <span className="text-[11px] uppercase text-slate-400">{label}</span>
      <span className={`text-sm font-semibold text-slate-900 break-words ${mono ? "font-mono" : ""}`}>{nilai}</span>
    </div>
  );

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <Link href="/admin/pengguna" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Pengguna
        </Link>
        <span className="text-xs text-slate-400">ID Pengguna: <span className="font-mono text-slate-700 font-medium">{u.id}</span></span>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Detail Pengguna</h1>
            {aktif ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Aktif</span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-xs font-medium"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Nonaktif</span>
            )}
          </div>
          <p className="text-sm text-slate-500">Informasi lengkap akun dan otorisasi pengguna dalam sistem ISM.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/admin/pengguna/${u.id}/edit`} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-blue-700 font-semibold text-sm shadow-sm hover:bg-blue-50 transition-colors">
            <Pencil className="w-4 h-4" /> Edit Pengguna
          </Link>
          {!dirisendiri && (
            <button onClick={() => mintaStatus(aktif ? "nonaktif" : "aktif")} className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${aktif ? "bg-rose-50 text-rose-600 hover:bg-rose-100" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}>
              {aktif ? <UserX className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              {aktif ? "Nonaktifkan" : "Aktifkan"}
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 min-w-0">
          <div className="w-20 h-20 rounded-xl bg-blue-700 text-white flex items-center justify-center font-bold text-3xl shadow-sm shrink-0">{initialsOf(u.name)}</div>
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{u.name}</h2>
              {u.nik && <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-600">NIK: {u.nik}</span>}
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${ROLE_BADGE[u.role]}`}><ShieldCheck className="w-3 h-3" /> {ROLE_LABEL[u.role]}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
              <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> Section: <strong className="font-semibold text-slate-800">{u.bagian?.nama_bagian ?? "Tidak terikat"}</strong></span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {u.email}</span>
              {u.telepon && <><span className="text-slate-300">•</span><span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {u.telepon}</span></>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-lg self-start md:self-auto shrink-0">
          <Calendar className="w-5 h-5 text-slate-400" />
          <div className="flex flex-col text-left">
            <span className="text-[10px] uppercase text-slate-400">Terdaftar Sejak</span>
            <span className="text-xs font-semibold text-slate-800">{formatTanggal(u.created_at)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className={`${u.bagian && (u.role === "pic" || u.role === "supervisor") ? "lg:col-span-5" : "lg:col-span-12"} bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col gap-4`}>
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <ShieldCheck className="w-5 h-5 text-blue-700" />
            <h3 className="text-base font-semibold text-slate-900">Identitas Karyawan</h3>
          </div>
          {info("Nama Lengkap", u.name)}
          <div className="grid grid-cols-2 gap-3">
            {info("NIK", u.nik ?? "—", true)}
            {info("Role Sistem", <span className="text-blue-700">{ROLE_LABEL[u.role]}</span>)}
          </div>
          {info("Email Perusahaan", u.email, true)}
          <div className="grid grid-cols-2 gap-3">
            {info("Jabatan", <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-slate-400" />{u.jabatan || "—"}</span>)}
            {info("Telepon", u.telepon || "—")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {info("Unit Section", u.bagian ? `${u.bagian.kode_bagian} · ${u.bagian.nama_bagian}` : "Tidak terikat")}
            {info("Status Akun", <span className={aktif ? "text-emerald-700" : "text-rose-600"}>{aktif ? "Aktif" : "Nonaktif"}</span>)}
          </div>
        </div>

        {u.bagian && (u.role === "pic" || u.role === "supervisor") && (
          <div className="lg:col-span-7 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 pb-4 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-blue-700" />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-slate-900">Layanan di Section {u.bagian.kode_bagian}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[11px] text-slate-500 font-semibold">{layanan.length} Layanan</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Katalog layanan yang ditujukan ke section {u.bagian.nama_bagian}</p>
              </div>
            </div>
            <div className="mx-6 mb-4 px-3 py-2 rounded-lg bg-blue-50 text-xs text-blue-900 leading-relaxed">
              {u.role === "pic"
                ? <>Pengguna ini terdaftar sebagai <strong>PIC</strong>. Tiket untuk layanan di bawah masuk ke <strong>antrean bersama</strong> section ini, dan PIC pertama yang menerima menjadi penanggung jawab.</>
                : <>Pengguna ini <strong>Supervisor</strong> section {u.bagian.kode_bagian}: ia memantau seluruh tiket untuk layanan di bawah.</>}
            </div>
            {layanan.length === 0 ? (
              <p className="px-6 pb-6 text-xs text-slate-400">Belum ada layanan pada section ini.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs">
                      <th className="py-2 px-6 font-semibold uppercase">Nama Layanan</th>
                      <th className="py-2 px-4 font-semibold uppercase">Kategori</th>
                      <th className="py-2 px-6 font-semibold uppercase text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {layanan.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-6">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900">{l.nama_layanan}</span>
                            <span className="text-xs text-slate-400 font-mono">{l.kode_layanan}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-500">{l.kategori}</td>
                        <td className="py-3 px-6 text-right">
                          {l.status === "aktif" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Aktif</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[11px] font-medium"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Nonaktif</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <KonfirmasiStatusMaster target={konfirmasi} onClose={() => setKonfirmasi(null)} />
      <Toasts items={toast.items} dismiss={toast.dismiss} />
    </>
  );
}
