import Link from "next/link";
import {
  FolderOpen,
  Send,
  RefreshCw,
  CheckCircle2,
  PlusCircle,
  ListChecks,
  History,
  Eye,
  MapPin,
  ArrowRight,
  Inbox,
} from "lucide-react";
import { CountUp, FxCard } from "@/components/fx/motion";
import PageHeader from "@/components/employee/page-header";
import StatusBadge from "@/components/employee/status-badge";
import { CURRENT_USER, TICKETS } from "@/lib/employee-data";

const dl = (ms: number) => ({ "--delay": `${ms}ms` } as React.CSSProperties);

export default function EmployeeDashboard() {
  const count = (s: string) => TICKETS.filter((t) => t.status === s).length;

  const metrics = [
    { label: "Total", value: TICKETS.length, icon: FolderOpen, tone: "text-blue-700 bg-blue-50" },
    { label: "Diajukan", value: count("Diajukan"), icon: Send, tone: "text-amber-600 bg-amber-50" },
    { label: "Diproses", value: count("Diproses"), icon: RefreshCw, tone: "text-sky-600 bg-sky-50" },
    { label: "Selesai", value: count("Selesai"), icon: CheckCircle2, tone: "text-emerald-600 bg-emerald-50" },
  ];

  const running = TICKETS.filter((t) => t.status === "Diproses" || t.status === "Diajukan");
  const recent = TICKETS.slice(0, 5);

  return (
    <>
      <PageHeader
        title={`Selamat datang kembali, ${CURRENT_USER.name.split(" ")[0]}.`}
        description="Berikut adalah ringkasan aktivitas permintaan layanan Anda."
      >
        <Link
          href="/employee/pengajuan-layanan"
          className="group fx-shine inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-gradient-to-r from-blue-800 to-blue-600 text-white text-[13px] font-medium shadow-sm shadow-blue-800/30 hover:shadow-lg hover:shadow-blue-800/30 hover:-translate-y-0.5 active:translate-y-0"
        >
          <PlusCircle className="w-[17px] h-[17px] transition-transform duration-500 group-hover:rotate-90" />
          <span>Buat Permintaan</span>
        </Link>
      </PageHeader>

      {/* Ringkasan */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(({ label, value, icon: Icon, tone }, i) => (
          <FxCard key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-slate-500">{label}</span>
              <span className={`w-9 h-9 rounded-lg flex items-center justify-center ${tone}`}>
                <Icon className="w-[18px] h-[18px]" />
              </span>
            </div>
            <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
              <CountUp value={value} delay={200 + i * 100} />
            </div>
          </FxCard>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Permintaan berjalan */}
        <section className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-slate-900">Permintaan yang Sedang Berjalan</h2>
            <span className="text-xs text-slate-400">{running.length} aktif</span>
          </div>

          {running.length === 0 ? (
            <div className="px-5 py-14 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-300 mb-3">
                <Inbox className="w-7 h-7" />
              </div>
              <p className="text-sm font-medium text-slate-700">Belum ada permintaan aktif</p>
              <p className="text-xs text-slate-400 mt-1">Buat permintaan baru untuk memulai.</p>
            </div>
          ) : (
            <div className="p-5 grid gap-4">
              {running.map((t, i) => (
                <Link
                  key={t.id}
                  href={`/employee/permintaan-saya/${t.id}`}
                  className="fx-reveal group block rounded-lg border border-slate-200 p-4 hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-md"
                  style={dl(150 + i * 90)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-[11.5px] font-medium text-slate-400">{t.id}</span>
                      <h3 className="text-sm font-semibold text-slate-900 mt-0.5 truncate group-hover:text-blue-900">{t.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{t.section} • PIC: {t.pic}</p>
                    </div>
                    <StatusBadge status={t.status} />
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-500">Progress</span>
                      <span className="font-medium text-slate-700">{t.progress}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="fx-bar h-full rounded-full bg-gradient-to-r from-blue-700 to-blue-500" style={{ width: `${t.progress}%`, ...dl(300 + i * 90) }} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Aksi cepat */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-[15px] font-semibold text-slate-900">Aksi Cepat</h2>
          </div>
          <div className="p-4 grid gap-2.5">
            {[
              { href: "/employee/pengajuan-layanan", label: "Buat Permintaan Baru", icon: PlusCircle },
              { href: "/employee/permintaan-saya", label: "Lihat Permintaan Saya", icon: ListChecks },
              { href: "/employee/riwayat", label: "Buka Riwayat", icon: History },
            ].map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center gap-3 px-3.5 py-3 rounded-lg border border-slate-200 text-[13px] font-medium text-slate-700 hover:border-blue-200 hover:bg-blue-50/50 hover:text-blue-900"
              >
                <span className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors">
                  <Icon className="w-4 h-4" />
                </span>
                <span className="flex-1">{label}</span>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* Permintaan terbaru */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-slate-900">Permintaan Terbaru</h2>
          <Link href="/employee/permintaan-saya" className="text-[13px] font-medium text-blue-700 hover:text-blue-900">
            Lihat Semua
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] min-w-[720px]">
            <thead className="bg-slate-50/70 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 font-medium">ID</th>
                <th className="px-5 py-3 font-medium">Layanan</th>
                <th className="px-5 py-3 font-medium">Judul</th>
                <th className="px-5 py-3 font-medium">Lokasi</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Tanggal</th>
                <th className="px-5 py-3 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recent.map((t) => (
                <tr key={t.id}>
                  <td className="px-5 py-3.5 font-medium text-slate-900">{t.id}</td>
                  <td className="px-5 py-3.5 text-slate-600">{t.service}</td>
                  <td className="px-5 py-3.5 text-slate-800 max-w-[220px] truncate">{t.title}</td>
                  <td className="px-5 py-3.5 text-slate-500">
                    <span className="inline-flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" />{t.plant} • {t.floor}</span>
                  </td>
                  <td className="px-5 py-3.5"><StatusBadge status={t.status} /></td>
                  <td className="px-5 py-3.5 text-slate-500">{t.createdAt.split(",")[0]}</td>
                  <td className="px-5 py-3.5 text-right">
                    <Link href={`/employee/permintaan-saya/${t.id}`} className="inline-flex p-1.5 rounded-md text-slate-400 hover:text-blue-700 hover:bg-blue-50" aria-label={`Lihat ${t.id}`}>
                      <Eye className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
