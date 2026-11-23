"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Ban, CheckCircle2, Eye, Loader2, Pencil, RotateCcw, Search, ShieldCheck, TriangleAlert, UserPlus, Users } from "lucide-react";
import { CountUp } from "@/components/fx/motion";
import { Toasts, useToasts } from "@/components/admin/settings-ui";
import { KonfirmasiStatusMaster, type TargetStatusMaster } from "@/components/admin/master-dialogs";
import { EmptyState, StatCard } from "@/components/shared/display";
import { SelectField } from "@/components/shared/form-controls";
import { Pagination } from "@/components/shared/pagination";
import { getSectionsAdmin, getUsers, updateUser, type SectionAdminApi, type StatusMaster } from "@/lib/api/admin";
import type { Role, User } from "@/lib/api/types";
import { initialsOf } from "@/lib/auth/user-display";
import { useAuth } from "@/lib/auth/auth-context";
import { takeFlash } from "@/lib/admin/flash";
import { keHasil, ROLE_AVATAR, ROLE_BADGE, ROLE_LABEL, ROLE_OPSI } from "@/lib/admin/pengguna";
import { useDaftar, useDebounced } from "@/lib/admin/use-daftar";

const PER_HALAMAN = 10;

export default function PenggunaPage() {
  const toast = useToasts();
  const { user: saya } = useAuth();

  const [qInput, setQInput] = useState("");
  const q = useDebounced(qInput.trim());
  const [idBagian, setIdBagian] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [halaman, setHalaman] = useState(1);
  const [segar, setSegar] = useState(0); // naik setiap perubahan agar daftar dan angka dimuat ulang

  const [sections, setSections] = useState<SectionAdminApi[]>([]);
  const [angka, setAngka] = useState<{ total: number; aktif: number; nonaktif: number; pic: number } | null>(null);
  const [konfirmasi, setKonfirmasi] = useState<TargetStatusMaster | null>(null);

  const kunci = JSON.stringify({ q, idBagian, role, status, halaman, segar });
  const { data, error, memuat } = useDaftar(
    () =>
      getUsers({
        q: q || undefined,
        id_bagian: idBagian ? Number(idBagian) : undefined,
        role: (role || undefined) as Role | undefined,
        status: (status || undefined) as StatusMaster | undefined,
        per_page: PER_HALAMAN,
        page: halaman,
      }),
    kunci,
    "Gagal memuat data pengguna.",
  );

  useEffect(() => {
    getSectionsAdmin().then(setSections).catch(() => undefined);
    const flash = takeFlash();
    if (flash) toast.push({ tone: "success", title: flash.title, desc: flash.desc });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Angka ringkasan tidak ikut filter; dimuat ulang setelah perubahan.
  useEffect(() => {
    let batal = false;
    Promise.all([getUsers({ per_page: 1 }), getUsers({ per_page: 1, status: "aktif" }), getUsers({ per_page: 1, status: "nonaktif" }), getUsers({ per_page: 1, role: "pic" })])
      .then(([a, b, c, d]) => {
        if (!batal) setAngka({ total: a.meta.total, aktif: b.meta.total, nonaktif: c.meta.total, pic: d.meta.total });
      })
      .catch(() => undefined);
    return () => {
      batal = true;
    };
  }, [segar]);

  // Mengubah filter selalu kembali ke halaman 1.
  const ubahFilter = (fn: () => void) => {
    fn();
    setHalaman(1);
  };

  const filterAktif = qInput !== "" || idBagian !== "" || role !== "" || status !== "";
  const barisKosong = useMemo(() => data !== null && data.data.length === 0, [data]);

  const mintaStatus = (u: User, ke: StatusMaster) =>
    setKonfirmasi({
      jenis: "Akun",
      nama: u.name,
      ke,
      dampakNonaktif: "Pengguna ini tidak dapat masuk ke sistem sampai akunnya diaktifkan kembali, dan sesi yang sedang berjalan berakhir pada permintaan berikutnya. Data dan riwayatnya tidak dihapus. PIC yang masih memegang tiket berjalan tidak dapat dinonaktifkan.",
      dampakAktif: "Pengguna ini dapat kembali masuk dan menggunakan sistem sesuai perannya.",
      jalankan: async () => {
        try {
          await updateUser(u.id, { status: ke });
          setSegar((n) => n + 1);
          toast.push({ tone: "success", title: ke === "nonaktif" ? "Akun dinonaktifkan" : "Akun diaktifkan", desc: `${u.name} (${u.nik ?? u.email})` });
          return { ok: true };
        } catch (e) {
          return keHasil(e);
        }
      },
    });

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pengguna</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">Master Data</span>
          </div>
          <p className="text-sm text-slate-500 mt-1">Kelola data pengguna yang menggunakan sistem layanan internal.</p>
        </div>
        <Link href="/admin/pengguna/tambah" className="px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg flex items-center gap-2 shadow-sm transition-all hover:-translate-y-0.5">
          <UserPlus className="w-4 h-4" />
          Tambah Pengguna
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Pengguna" value={<CountUp value={angka?.total ?? 0} />} hint="Tersimpan di database" icon={Users} tone="blue" />
        <StatCard label="Pengguna Aktif" value={<CountUp value={angka?.aktif ?? 0} delay={80} />} hint="Akun memiliki akses aktif" icon={CheckCircle2} tone="emerald" />
        <StatCard label="Pengguna Nonaktif" value={<CountUp value={angka?.nonaktif ?? 0} delay={160} />} hint="Akses dinonaktifkan" icon={Ban} tone="slate" />
        <StatCard label="Total PIC" value={<CountUp value={angka?.pic ?? 0} delay={240} />} hint="Bertugas menangani tiket" icon={ShieldCheck} tone="violet" />
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative min-w-[260px] flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={qInput}
            onChange={(e) => ubahFilter(() => setQInput(e.target.value))}
            placeholder="Cari nama, NIK, atau email..."
            aria-label="Cari pengguna"
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
          />
        </div>
        <SelectField label="Section" value={idBagian} onChange={(v) => ubahFilter(() => setIdBagian(v))} options={[{ value: "", label: "Semua Section" }, ...sections.map((s) => ({ value: String(s.id), label: `${s.kode_bagian} · ${s.nama_bagian}` }))]} />
        <SelectField label="Role" value={role} onChange={(v) => ubahFilter(() => setRole(v))} options={[{ value: "", label: "Semua Role" }, ...ROLE_OPSI.map((r) => ({ value: r.value, label: r.label }))]} />
        <SelectField label="Status" value={status} onChange={(v) => ubahFilter(() => setStatus(v))} options={[{ value: "", label: "Semua Status" }, { value: "aktif", label: "Aktif" }, { value: "nonaktif", label: "Nonaktif" }]} />
        <button
          onClick={() => {
            setQInput("");
            setIdBagian("");
            setRole("");
            setStatus("");
            setHalaman(1);
          }}
          disabled={!filterAktif}
          className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium text-slate-500 hover:text-blue-700 disabled:opacity-40 disabled:hover:text-slate-500 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {error ? (
          <div className="py-14 px-6 flex flex-col items-center text-center gap-3" role="alert">
            <span className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center"><TriangleAlert className="w-6 h-6" /></span>
            <h3 className="text-sm font-semibold text-slate-900">Data pengguna tidak dapat dimuat</h3>
            <p className="text-xs text-slate-500 max-w-sm">{error}</p>
            <button onClick={() => setSegar((n) => n + 1)} className="px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-colors">Coba Lagi</button>
          </div>
        ) : data === null ? (
          <div className="py-20 flex items-center justify-center gap-3 text-sm text-slate-500" role="status" aria-live="polite">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> Memuat data pengguna...
          </div>
        ) : barisKosong ? (
          <EmptyState icon={Users} title={filterAktif ? "Tidak ada hasil" : "Belum ada pengguna"} desc={filterAktif ? "Coba ubah kata kunci atau reset filter." : "Tambahkan pengguna pertama untuk mulai."} />
        ) : (
          <div className={`overflow-x-auto transition-opacity duration-300 ${memuat ? "opacity-50" : ""}`} aria-busy={memuat}>
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-6">Nama</th>
                  <th className="py-3 px-4">NIK</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Section</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.data.map((u) => {
                  const dirisendiri = saya?.id === u.id;
                  return (
                    <tr key={u.id} className={`hover:bg-slate-50/70 transition-colors ${u.status === "nonaktif" ? "bg-slate-50/30 opacity-80" : ""}`}>
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${ROLE_AVATAR[u.role]}`}>{initialsOf(u.name)}</div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-slate-900 truncate">{u.name}{dirisendiri && <span className="ml-1.5 text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">Anda</span>}</span>
                            <span className="text-[11px] text-slate-400 truncate">{u.jabatan || "—"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">{u.nik ?? "—"}</td>
                      <td className="py-3.5 px-4 text-slate-500">{u.email}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-700" title={u.bagian?.nama_bagian}>{u.bagian?.kode_bagian ?? "—"}</td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${ROLE_BADGE[u.role]}`}>{ROLE_LABEL[u.role]}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        {u.status === "aktif" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Aktif</span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-[11px] font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>Nonaktif</span>
                        )}
                      </td>
                      <td className="py-3.5 px-6">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/admin/pengguna/${u.id}`} className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors" title="Lihat detail" aria-label={`Lihat detail ${u.name}`}><Eye className="w-4 h-4" /></Link>
                          <Link href={`/admin/pengguna/${u.id}/edit`} className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors" title="Ubah pengguna" aria-label={`Ubah ${u.name}`}><Pencil className="w-4 h-4" /></Link>
                          {dirisendiri ? (
                            <span className="p-1.5 text-slate-200" title="Anda tidak dapat menonaktifkan akun sendiri"><Ban className="w-4 h-4" /></span>
                          ) : u.status === "aktif" ? (
                            <button onClick={() => mintaStatus(u, "nonaktif")} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors" title="Nonaktifkan" aria-label={`Nonaktifkan ${u.name}`}><Ban className="w-4 h-4" /></button>
                          ) : (
                            <button onClick={() => mintaStatus(u, "aktif")} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors" title="Aktifkan" aria-label={`Aktifkan ${u.name}`}><CheckCircle2 className="w-4 h-4" /></button>
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
        {data && data.data.length > 0 && <Pagination page={data.meta.current_page} perPage={data.meta.per_page} total={data.meta.total} onPage={setHalaman} noun="pengguna" />}
      </div>

      <KonfirmasiStatusMaster target={konfirmasi} onClose={() => setKonfirmasi(null)} />
      <Toasts items={toast.items} dismiss={toast.dismiss} />
    </>
  );
}
