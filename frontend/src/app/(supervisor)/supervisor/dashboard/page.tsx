import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  MailPlus,
  RefreshCw,
  CheckCircle2,
  PauseCircle,
  Info,
  Plus,
  Play,
  Check,
  Pause,
  AlertTriangle,
  X,
  BadgeCheck,
  Clock,
  CalendarDays,
} from "lucide-react";
import { CountUp, FxCard } from "@/components/fx/motion";
import PageHeader from "@/components/supervisor/page-header";
import ReadOnlyBadge from "@/components/supervisor/read-only-badge";
import TicketTable from "@/components/supervisor/ticket-table";
import { SUP_ACTIVITY, SUP_TICKETS, REPORT } from "@/lib/supervisor-data";

const dl = (ms: number) => ({ "--delay": `${ms}ms` } as React.CSSProperties);

const metrics = [
  { label: "Total Permintaan", value: 186, sub: "Seluruh tiket periode berjalan", chip: "+12% bln lalu", icon: Boxes, tone: "text-blue-700 bg-blue-50", chipTone: "text-emerald-700 bg-emerald-50" },
  { label: "Permintaan Baru", value: 13, sub: "Menunggu telaah PIC", chip: "+4 hari ini", icon: MailPlus, tone: "text-sky-600 bg-sky-50", chipTone: "text-sky-700 bg-sky-50" },
  { label: "Sedang Diproses", value: 31, sub: "Dalam penanganan teknisi", chip: "Aktif", icon: RefreshCw, tone: "text-indigo-600 bg-indigo-50", chipTone: "text-indigo-700 bg-indigo-50" },
  { label: "Selesai", value: 128, sub: "Target SLA tercapai", chip: "68.8% ratio", icon: CheckCircle2, tone: "text-emerald-600 bg-emerald-50", chipTone: "text-emerald-700 bg-emerald-50" },
  { label: "Pending", value: 14, sub: "Menunggu suku cadang/vendor", chip: "Perlu atensi", icon: PauseCircle, tone: "text-amber-600 bg-amber-50", chipTone: "text-amber-700 bg-amber-50" },
];

const activityIcon = { add: Plus, play: Play, check: Check, pause: Pause, alert: AlertTriangle, close: X } as const;

export default function SupervisorDashboard() {
  const recent = SUP_TICKETS.slice(0, 6);

  return (
    <>
      <PageHeader
        title="Dashboard Supervisor"
        description="Pantau dan tinjau aktivitas permintaan layanan internal pada bagian yang Anda supervisi."
      >
        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[12px] font-medium text-slate-600">
          <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
          24 Agustus 2026
        </span>
        <ReadOnlyBadge />
      </PageHeader>

      {/* Banner arahan */}
      <section className="fx-reveal flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-white p-4" style={dl(60)}>
        <div className="flex items-start gap-3">
          <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0"><Info className="w-4 h-4" /></span>
          <p className="text-[13px] text-slate-600 leading-relaxed pt-1">
            Gunakan halaman <strong className="text-slate-900">Monitoring Permintaan</strong> untuk melihat rincian alur kerja, log audit, dan dokumen pendukung setiap tiket.
          </p>
        </div>
        <Link href="/supervisor/monitoring-permintaan" className="group inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-blue-200 text-[13px] font-medium text-blue-800 hover:bg-blue-50 shrink-0">
          Buka Monitoring
          <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </section>

      {/* Ringkasan */}
      <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {metrics.map(({ label, value, sub, chip, icon: Icon, tone, chipTone }, i) => (
          <FxCard key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className={`w-9 h-9 rounded-lg flex items-center justify-center ${tone}`}><Icon className="w-[18px] h-[18px]" /></span>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${chipTone}`}>{chip}</span>
            </div>
            <div className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
              <CountUp value={value} delay={200 + i * 90} />
            </div>
            <p className="mt-1 text-[13px] font-medium text-slate-700">{label}</p>
            <p className="text-xs text-slate-400">{sub}</p>
          </FxCard>
        ))}
      </section>

      {/* Tabel monitoring */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-[15px] font-semibold text-slate-900">Monitoring Permintaan</h2>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">6 Terkini</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Status terkini tiket operasional lintas divisi.</p>
          </div>
          <Link href="/supervisor/monitoring-permintaan" className="group inline-flex items-center gap-1.5 text-[13px] font-medium text-blue-700 hover:text-blue-900">
            Lihat Semua Permintaan
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
        <TicketTable rows={recent} compact />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* SLA */}
        <section className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm p-5 fx-reveal" style={dl(300)}>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900">Kepatuhan SLA</h2>
              <p className="text-xs text-slate-400 mt-0.5">Standar penyelesaian layanan periode ini</p>
            </div>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Target 90%</span>
          </div>

          <div className="mt-5 flex items-baseline gap-2">
            <span className="text-4xl font-semibold tracking-tight text-emerald-600">{REPORT.slaCompliance}%</span>
            <span className="text-[13px] text-slate-500">Tepat Waktu</span>
          </div>
          <div className="mt-3 h-2.5 rounded-full bg-slate-100 overflow-hidden flex">
            <div className="fx-bar h-full bg-emerald-500" style={{ width: `${REPORT.slaCompliance}%`, ...dl(400) }} />
            <div className="h-full bg-rose-400" style={{ width: `${100 - REPORT.slaCompliance}%` }} />
          </div>

          <div className="mt-5 grid gap-3 text-[13px]">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-slate-600"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />Sesuai SLA</span>
              <span className="font-medium text-slate-800">{REPORT.slaOk} Tiket <span className="text-slate-400 font-normal">(92.4%)</span></span>
            </div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-slate-600"><span className="w-2.5 h-2.5 rounded-full bg-rose-400" />Melebihi SLA</span>
              <span className="font-medium text-slate-800">{REPORT.slaLate} Tiket <span className="text-slate-400 font-normal">(7.6%)</span></span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="inline-flex items-center gap-2 text-slate-600"><Clock className="w-4 h-4 text-slate-400" />Rata-rata Resolusi</span>
              <span className="font-semibold text-slate-900">{REPORT.avgResolution}</span>
            </div>
          </div>

          <div className="mt-5 flex items-start gap-2.5 rounded-lg bg-emerald-50 border border-emerald-100 p-3 text-xs text-emerald-800">
            <BadgeCheck className="w-4 h-4 shrink-0 mt-0.5" />
            Tingkat kepatuhan layanan berada di atas target operasional standar.
          </div>
        </section>

        {/* Aktivitas */}
        <section className="lg:col-span-3 rounded-xl border border-slate-200 bg-white shadow-sm p-5 fx-reveal" style={dl(380)}>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900">Aktivitas Terbaru</h2>
              <p className="text-xs text-slate-400 mt-0.5">Log pergerakan status tiket secara real-time</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
              <span className="relative flex w-1.5 h-1.5"><span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" /><span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-emerald-500" /></span>
              Live Updates
            </span>
          </div>

          <ol className="mt-5 grid gap-4">
            {SUP_ACTIVITY.map((a, i) => {
              const Icon = activityIcon[a.icon];
              return (
                <li key={a.id + a.when} className="fx-reveal-x flex items-start gap-3" style={dl(450 + i * 80)}>
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${a.tone}`}><Icon className="w-4 h-4" /></span>
                  <div className="min-w-0">
                    <p className="text-[13px] text-slate-700 leading-snug">{a.text}</p>
                    <p className="mt-0.5 text-[11.5px] text-slate-400">
                      <Link href={`/supervisor/monitoring-permintaan/${a.id}`} className="font-medium text-blue-700 hover:underline">#{a.id}</Link> • {a.when}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    </>
  );
}
