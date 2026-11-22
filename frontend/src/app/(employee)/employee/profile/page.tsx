"use client";

import Link from "next/link";
import { BadgeCheck, Briefcase, Pencil, Settings } from "lucide-react";
import PageHeader from "@/components/employee/page-header";
import { useAuth } from "@/lib/auth/auth-context";
import { formatTanggal, initialsOf, sectionOf } from "@/lib/auth/user-display";

const dl = (ms: number) => ({ "--delay": `${ms}ms` } as React.CSSProperties);

function Card({ title, icon: Icon, rows, delay }: { title: string; icon: typeof BadgeCheck; rows: { label: string; value: string }[]; delay: number }) {
  return (
    <section className="fx-reveal rounded-xl border border-slate-200 bg-white shadow-sm" style={dl(delay)}>
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center"><Icon className="w-4 h-4" /></span>
        <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
      </div>
      <dl className="p-5 grid gap-4">
        {rows.map((r) => (
          <div key={r.label} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
            <dt className="text-[13px] text-slate-400">{r.label}</dt>
            <dd className="text-[13.5px] font-medium text-slate-800">{r.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  if (!user) return null; // RoleGuard memastikan akun sudah dimuat sebelum halaman ini tampil

  const personal = [
    { label: "Nama Lengkap", value: user.name },
    { label: "Email", value: user.email },
    { label: "Nomor Telepon", value: user.telepon ?? "-" },
  ];

  const work = [
    { label: "NIK Karyawan", value: user.nik ?? "-" },
    { label: "Section / Unit", value: sectionOf(user) },
    { label: "Jabatan", value: user.jabatan ?? "-" },
    { label: "Terdaftar Sejak", value: formatTanggal(user.created_at) },
  ];

  return (
    <>
      <PageHeader title="Profile" description="Informasi akun dan data kepegawaian Anda." />

      <section className="fx-reveal relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" style={dl(60)}>
        <div className="h-24 bg-gradient-to-r from-blue-900 via-blue-700 to-indigo-600 relative">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:18px_18px]" />
        </div>
        <div className="px-5 pb-5 -mt-10 flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-700 to-blue-950 text-white flex items-center justify-center text-2xl font-semibold ring-4 ring-white shadow-lg">
            {initialsOf(user.name)}
          </div>
          <div className="flex-1 pb-1">
            <h2 className="text-xl font-semibold text-slate-900">{user.name}</h2>
            <p className="text-[13px] text-slate-500 flex items-center gap-1.5">{user.jabatan ?? "-"} • {user.role_label}<BadgeCheck className="w-4 h-4 text-blue-600" /></p>
          </div>
          <div className="flex gap-2.5">
            <Link href="/employee/pengaturan" className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-[13px] font-medium text-slate-700 hover:border-blue-200 hover:text-blue-900">
              <Pencil className="w-4 h-4" />Edit Profile
            </Link>
            <Link href="/employee/pengaturan" className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-gradient-to-r from-blue-800 to-blue-600 text-white text-[13px] font-medium shadow-sm shadow-blue-800/30 hover:shadow-lg hover:-translate-y-0.5">
              <Settings className="w-4 h-4 transition-transform duration-500 group-hover:rotate-90" />Pengaturan
            </Link>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Informasi Pribadi" icon={BadgeCheck} rows={personal} delay={140} />
        <Card title="Informasi Pekerjaan" icon={Briefcase} rows={work} delay={220} />
      </div>
    </>
  );
}
