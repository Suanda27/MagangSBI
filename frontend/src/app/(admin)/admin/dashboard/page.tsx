import Link from "next/link";
import {
  UserPlus,
  PlusCircle,
  Share2,
  User,
  Building2,
  Wrench,
  ShieldCheck,
  CheckCircle2,
  PieChart,
  ArrowRight,
} from "lucide-react";
import { CountUp, FxCard } from "@/components/fx/motion";

// Helper delay animasi bertahap
const dl = (ms: number) => ({ "--delay": `${ms}ms` } as React.CSSProperties);

const quickLinks = [
  { href: "/admin/dashboard", label: "Dashboard", active: true },
  { href: "/admin/pengguna", label: "Pengguna" },
  { href: "/admin/section", label: "Section" },
  { href: "/admin/layanan", label: "Layanan" },
  { href: "/admin/pic", label: "PIC" },
  { href: "/admin/laporan", label: "Laporan" },
  { href: "/admin/settings", label: "Settings" },
];

const metrics = [
  { label: "Total Pengguna", value: 128, sub: "121 Aktif • 7 Nonaktif", icon: User },
  { label: "Total Section", value: 5, sub: "5 Section operasional", icon: Building2 },
  { label: "Total Layanan", value: 32, sub: "29 Aktif • 3 Nonaktif", icon: Wrench },
  { label: "Total PIC", value: 14, sub: "13 Bertugas • 1 Nonaktif", icon: ShieldCheck },
];

const beban = [
  { label: "Assembly", count: 48, pct: 37.5, color: "bg-blue-800" },
  { label: "Production Engineering (PE)", count: 30, pct: 23.4, color: "bg-blue-600" },
  { label: "Information System (IS)", count: 24, pct: 18.8, color: "bg-sky-500" },
  { label: "Human Resources (HR)", count: 14, pct: 10.9, color: "bg-slate-400" },
  { label: "General Affairs (GA)", count: 12, pct: 9.4, color: "bg-slate-300" },
];

const recentTickets = [
  { id: "PE-2026-0012", title: "Sensor PLC Conveyor Rusak", requester: "Muhammad Faiz", initials: "MF", section: "Assembly", pic: "Budi Santoso", status: "Selesai", date: "23 Agt 2026, 08:24" },
  { id: "IS-2026-0015", title: "VPN & GitLab Onboarding", requester: "Siti Aminah", initials: "SA", section: "HR", pic: "Hendra Wijaya", status: "Sedang Diproses", date: "23 Agt 2026, 09:15" },
  { id: "PE-2026-0018", title: "Kalibrasi Mesin Press Hidrolik", requester: "Rudi Hartono", initials: "RH", section: "PE", pic: "Budi Santoso", status: "Menunggu Pemeriksaan", date: "23 Agt 2026, 10:00" },
  { id: "GA-2026-0021", title: "Penggantian Lampu LED Line 4", requester: "Agus Kurnia", initials: "AK", section: "GA", pic: "Doni Prasetyo", status: "Selesai", date: "22 Agt 2026, 16:40" },
  { id: "HR-2026-0022", title: "Permohonan Surat Visa Dinas", requester: "Dewi Sartika", initials: "DS", section: "HR", pic: "Rina Wulandari", status: "Ditolak", date: "22 Agt 2026, 14:10" },
];

const statusBadge: Record<string, string> = {
  Selesai: "bg-emerald-50 text-emerald-700 border-emerald-100",
  "Sedang Diproses": "bg-blue-50 text-blue-700 border-blue-100",
  "Menunggu Pemeriksaan": "bg-amber-50 text-amber-700 border-amber-100",
  Ditolak: "bg-rose-50 text-rose-700 border-rose-100",
};

const statusDot: Record<string, string> = {
  Selesai: "bg-emerald-500",
  "Sedang Diproses": "bg-blue-500",
  "Menunggu Pemeriksaan": "bg-amber-500",
  Ditolak: "bg-rose-500",
};

export default function AdminDashboard() {
  return (
    <>
      <div className="fx-reveal flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={dl(0)}>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-blue-700 bg-clip-text text-transparent">Dashboard</h1>
          <p className="text-[13.5px] text-slate-500 mt-0.5">Kelola data dan pantau aktivitas layanan internal.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link href="/admin/pengguna/tambah" className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-slate-200 hover:border-blue-200 hover:bg-blue-50/50 text-[13px] font-medium text-slate-700 hover:text-blue-900 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0">
            <UserPlus className="w-[17px] h-[17px] text-slate-500 transition-all duration-300 group-hover:text-blue-700 group-hover:scale-110" />
            <span>Tambah Pengguna</span>
          </Link>
          <Link href="/admin/layanan/tambah" className="group fx-shine inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-gradient-to-r from-blue-800 to-blue-600 text-white text-[13px] font-medium transition-all duration-300 shadow-sm shadow-blue-800/30 hover:shadow-lg hover:shadow-blue-800/30 hover:-translate-y-0.5 active:translate-y-0">
            <PlusCircle className="w-[17px] h-[17px] transition-transform duration-500 group-hover:rotate-90" />
            <span>Tambah Layanan</span>
          </Link>
        </div>
      </div>

      <div className="fx-reveal bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-blue-50/90 border border-blue-100 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3" style={dl(80)}>
        <div className="flex items-center gap-2.5">
          <Share2 className="w-5 h-5 text-blue-700" />
          <div className="text-[12.5px]">
            <span className="font-semibold text-blue-900">Navigasi Cepat Master &amp; Sistem:</span>
            <span className="text-blue-800 ml-1">Pilih modul untuk langsung menuju halaman terkait</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-[12px]">
          {quickLinks.map((q, i) => (
            <Link
              key={q.href}
              href={q.href}
              style={dl(200 + i * 40)}
              className={`fx-reveal px-2.5 py-1 rounded font-medium transition-all duration-300 hover:-translate-y-0.5 ${
                q.active ? "bg-blue-800 text-white hover:bg-blue-900 shadow-sm shadow-blue-800/30" : "bg-white text-slate-700 border border-blue-200 hover:bg-blue-50 hover:border-blue-300 hover:shadow-sm"
              }`}
            >
              {q.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {metrics.map(({ label, value, sub, icon: Icon }, i) => (
          <div key={label} className="fx-reveal" style={dl(150 + i * 80)}>
            <FxCard className="group h-full p-4 rounded-xl bg-white border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider transition-colors duration-300 group-hover:text-blue-700">{label}</span>
                <span className="w-8 h-8 -m-1 rounded-lg flex items-center justify-center bg-slate-50 transition-all duration-500 group-hover:bg-blue-600 group-hover:rotate-[10deg] group-hover:scale-110 group-hover:shadow-md group-hover:shadow-blue-600/30">
                  <Icon className="w-[18px] h-[18px] text-slate-400 transition-colors duration-300 group-hover:text-white" />
                </span>
              </div>
              <div>
                <CountUp value={value} delay={300 + i * 80} className="block text-[25px] font-semibold text-slate-900 leading-none tracking-tight tabular-nums" />
                <p className="text-[11.5px] text-slate-500 mt-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 transition-colors duration-300 group-hover:bg-blue-500"></span>
                  <span>{sub}</span>
                </p>
              </div>
              {/* garis aksen bawah */}
              <span className="absolute left-0 bottom-0 h-0.5 w-full origin-left scale-x-0 bg-gradient-to-r from-blue-600 to-indigo-500 transition-transform duration-500 group-hover:scale-x-100" />
            </FxCard>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="fx-reveal lg:col-span-7" style={dl(450)}>
        <FxCard className="h-full bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <h2 className="text-[14.5px] font-semibold text-slate-900">Ringkasan Permintaan &amp; Beban Unit</h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                  <span className="relative flex w-1.5 h-1.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 animate-ping"></span>
                    <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  </span>
                  Real-time
                </span>
              </div>
              <PieChart className="w-[18px] h-[18px] text-slate-400" />
            </div>
            <p className="text-[12px] text-slate-400 mb-5">Komparasi distribusi status tiket operasional dan beban kerja per departemen.</p>

            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-5 border-b border-slate-100">
              <div
                className="fx-donut relative w-32 h-32 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-transform duration-500 hover:scale-105"
                style={{ background: "conic-gradient(#1e40af 0% 53.1%, #93c5fd 53.1% 79.7%, #f59e0b 79.7% 89.1%, #f43f5e 89.1% 100%)" }}
              >
                <div className="w-[86px] h-[86px] rounded-full bg-white flex flex-col items-center justify-center shadow-inner">
                  <CountUp value={128} delay={700} className="text-[20px] font-bold text-slate-900 leading-tight tabular-nums" />
                  <span className="text-[10.5px] text-slate-400 font-medium">Total Tiket</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-[12.5px] flex-1 w-full">
                {[
                  { label: "Menunggu Pemeriksaan", value: 12, pct: "9.4%", color: "bg-amber-500" },
                  { label: "Sedang Diproses", value: 34, pct: "26.6%", color: "bg-blue-500" },
                  { label: "Selesai", value: 68, pct: "53.1%", color: "bg-blue-800" },
                  { label: "Ditolak", value: 14, pct: "10.9%", color: "bg-rose-500" },
                ].map((s, i) => (
                  <div key={s.label} className="fx-reveal group/stat flex items-center gap-2 p-2 rounded-lg bg-slate-50/60 border border-slate-100 transition-all duration-300 hover:bg-white hover:border-slate-200 hover:shadow-sm hover:-translate-y-0.5" style={dl(600 + i * 70)}>
                    <span className={`w-2.5 h-2.5 rounded-full ${s.color} shrink-0 transition-transform duration-300 group-hover/stat:scale-150`}></span>
                    <div className="flex flex-col">
                      <span className="text-slate-500 text-[11px]">{s.label}</span>
                      <span className="text-slate-900 font-semibold"><CountUp value={s.value} delay={700 + i * 70} className="tabular-nums" /> <span className="text-slate-400 font-normal text-[10.5px]">({s.pct})</span></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] font-semibold text-slate-700 uppercase tracking-wider">Beban Kerja per Section</span>
                <span className="text-[11.5px] text-slate-400">Kapasitas SLA Bulanan</span>
              </div>
              <div className="space-y-3">
                {beban.map((b, i) => (
                  <div key={b.label} className="group/bar">
                    <div className="flex justify-between text-[12.5px] mb-1">
                      <span className="text-slate-700 font-medium transition-colors duration-300 group-hover/bar:text-blue-900">{b.label}</span>
                      <span className="text-slate-900 font-semibold">{b.count} <span className="text-slate-400 font-normal text-[11px]">({b.pct}%)</span></span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden transition-[height] duration-300 group-hover/bar:h-2.5">
                      <div className="h-full" style={{ width: `${b.pct}%` }}>
                        <div className={`fx-bar h-full w-full ${b.color} rounded-full`} style={dl(800 + i * 110)}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="pt-3.5 mt-4 border-t border-slate-100 flex items-center justify-between text-[11.5px] text-slate-500">
            <span>Beban aktif tertinggi: <strong className="text-slate-800 font-semibold">Assembly</strong></span>
            <span className="text-emerald-700 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-[15px] h-[15px]" /> Alokasi PIC Berimbang
            </span>
          </div>
        </FxCard>
        </div>

        <div className="fx-reveal lg:col-span-5" style={dl(550)}>
        <FxCard className="h-full bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <h2 className="text-[14.5px] font-semibold text-slate-900">Aktivitas Terbaru</h2>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <span className="group/log inline-flex items-center gap-1 text-[12px] text-blue-700 font-medium cursor-pointer">
                Lihat Log
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover/log:translate-x-1" />
              </span>
            </div>
            <p className="text-[12px] text-slate-400 mb-4">Rekam jejak tindakan admin, assignment PIC, dan update operasional.</p>
            <div className="space-y-3.5 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-gradient-to-b before:from-blue-200 before:via-slate-100 before:to-transparent">
              {[
                { icon: ShieldCheck, badgeClass: "bg-blue-50 border-blue-200 text-blue-700", title: "Penugasan PIC Tiket", time: "5 mnt lalu", desc: <>Budi Santoso ditugaskan pada tiket <span className="text-blue-800 font-medium">#PE-2026-0018</span> (Kalibrasi Hidrolik).</> },
                { icon: CheckCircle2, badgeClass: "bg-emerald-50 border-emerald-200 text-emerald-700", title: "Status Layanan Diperbarui", time: "24 mnt lalu", desc: <>Tiket <span className="text-blue-800 font-medium">#PE-2026-0012</span> diubah ke status <span className="text-emerald-700 font-medium">Selesai</span> oleh Admin ISM.</> },
                { icon: UserPlus, badgeClass: "bg-sky-50 border-sky-200 text-sky-700", title: "Permintaan Baru Masuk", time: "1 jam lalu", desc: <>Siti Aminah (HR) mengajukan tiket VPN &amp; GitLab Onboarding.</> },
              ].map((e, i) => (
                <div key={i} className="fx-reveal-x group/evt relative flex items-start gap-3 pl-1 -mx-1 px-1 py-1 rounded-lg transition-colors duration-300 hover:bg-slate-50" style={dl(750 + i * 120)}>
                  <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 z-10 transition-transform duration-300 group-hover/evt:scale-125 ${e.badgeClass}`}>
                    <e.icon className="w-[13px] h-[13px]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[12.5px] font-medium text-slate-800">{e.title}</span>
                      <span className="text-[11px] text-slate-400">{e.time}</span>
                    </div>
                    <p className="text-[12px] text-slate-500 mt-0.5">{e.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-3.5 mt-4 border-t border-slate-100 flex items-center justify-between text-[11.5px] text-slate-500">
            <span>Total Event Hari Ini: <strong className="text-slate-700">42 tercatat</strong></span>
            <span className="text-slate-400">Audit trail tersimpan aman</span>
          </div>
        </FxCard>
        </div>
      </div>

      <div className="fx-reveal rounded-xl bg-white border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden transition-shadow duration-500 hover:shadow-[0_14px_30px_-18px_rgba(30,64,175,0.25)]" style={dl(650)}>
        <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-900">Permintaan Terbaru</h2>
            <p className="text-[12.5px] text-slate-400 mt-0.5">Daftar transaksi layanan internal yang masuk dalam antrean.</p>
          </div>
          <Link href="/admin/permintaan" className="group inline-flex items-center gap-1 text-[12.5px] font-medium text-blue-700 hover:text-blue-800 transition-colors">
            Lihat Semua
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-400 text-[11px] font-medium uppercase tracking-wider">
                <th className="py-3 px-6">ID Permintaan</th>
                <th className="py-3 px-4">Judul</th>
                <th className="py-3 px-4">Pengaju</th>
                <th className="py-3 px-4">Section</th>
                <th className="py-3 px-4">PIC</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentTickets.map((t, i) => (
                <tr key={t.id} className="fx-reveal group/row relative hover:bg-blue-50/40 transition-colors duration-300" style={dl(800 + i * 70)}>
                  <td className="py-3.5 px-6 font-medium text-blue-800 relative">
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-0 rounded-r bg-blue-600 transition-all duration-300 group-hover/row:h-3/5" />
                    <span className="inline-block transition-transform duration-300 group-hover/row:translate-x-1">#{t.id}</span>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-800">{t.title}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-semibold border border-slate-200 transition-all duration-300 group-hover/row:bg-blue-600 group-hover/row:text-white group-hover/row:border-blue-600 group-hover/row:scale-110">{t.initials}</div>
                      <span className="text-slate-800">{t.requester}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex px-2 py-0.5 rounded text-[11.5px] font-medium bg-slate-100 text-slate-600">{t.section}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 text-[12.5px]">{t.pic}</td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11.5px] font-medium border ${statusBadge[t.status]}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusDot[t.status]}`}></span>
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 text-[12px] whitespace-nowrap">{t.date}</td>
                  <td className="py-3.5 px-6 text-right">
                    <Link href={`/admin/permintaan/${t.id}`} className="inline-flex items-center gap-1 text-[12px] font-medium text-blue-700 hover:text-blue-800 transition-all duration-300 group-hover/row:gap-1.5">
                      Lihat Detail
                      <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 transition-all duration-300 group-hover/row:opacity-100 group-hover/row:translate-x-0" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3.5 bg-white border-t border-slate-100 flex items-center justify-between text-[12px] text-slate-500">
          <span>Menampilkan 5 dari 186 tiket permintaan internal</span>
          <div className="flex items-center gap-2">
            <button className="p-1 rounded border border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50" disabled>‹</button>
            <span className="font-medium text-slate-700 px-1">Halaman 1 dari 38</span>
            <button className="p-1 rounded border border-slate-200 text-slate-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-800 transition-all duration-300 hover:translate-x-0.5">›</button>
          </div>
        </div>
      </div>
    </>
  );
}
