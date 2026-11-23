"use client";

import { useMemo, useState } from "react";
import { Ban, CheckCircle2, History } from "lucide-react";
import { CountUp } from "@/components/fx/motion";
import { PageHeader, StatCard } from "@/components/shared/display";
import { FilterBar, RequestTable, useFilter } from "@/components/pic/request-list";
import { usePicStore, useRingkasan } from "@/lib/pic/store";

type Tab = "semua" | "selesai" | "ditolak";

export default function SelesaiPage() {
  const { permintaan } = usePicStore();
  const r = useRingkasan();
  const [tab, setTab] = useState<Tab>("semua");

  const final = useMemo(
    () =>
      permintaan
        .filter((p) => p.status === "selesai" || p.status === "ditolak")
        .sort((a, b) => new Date(b.selesaiPada ?? b.ditolakPada ?? 0).getTime() - new Date(a.selesaiPada ?? a.ditolakPada ?? 0).getTime()),
    [permintaan],
  );
  const filter = useFilter(final);
  const data = tab === "semua" ? filter.hasil : filter.hasil.filter((p) => p.status === tab);

  const tabs: { k: Tab; l: string; n: number }[] = [
    { k: "semua", l: "Semua", n: final.length },
    { k: "selesai", l: "Selesai", n: r.selesai },
    { k: "ditolak", l: "Ditolak", n: r.ditolak },
  ];

  return (
    <>
      <PageHeader title="Selesai & Riwayat" desc="Arsip permintaan yang telah Anda selesaikan atau tolak, lengkap dengan hasil pengerjaan dan riwayatnya." />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Riwayat" value={<CountUp value={final.length} />} hint="Tiket tertutup" icon={History} tone="slate" />
        <StatCard label="Selesai" value={<CountUp value={r.selesai} delay={80} />} hint="Disetujui pengaju" icon={CheckCircle2} tone="emerald" />
        <StatCard label="Ditolak" value={<CountUp value={r.ditolak} delay={160} />} hint="Dengan alasan penolakan" icon={Ban} tone="rose" />
      </div>

      <div className="flex gap-1 border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={`relative px-4 py-2.5 text-[13px] font-medium transition-colors ${tab === t.k ? "text-blue-800" : "text-slate-500 hover:text-slate-800"}`}
          >
            {t.l} <span className={`ml-1 text-[11px] px-1.5 py-0.5 rounded ${tab === t.k ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>{t.n}</span>
            <span className={`absolute left-0 right-0 -bottom-px h-0.5 bg-blue-700 origin-left transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${tab === t.k ? "scale-x-100" : "scale-x-0"}`} />
          </button>
        ))}
      </div>

      <FilterBar data={final} filter={filter} />

      <RequestTable
        key={tab}
        data={data}
        mode="riwayat"
        emptyTitle="Belum ada riwayat"
        emptyDesc="Tiket yang selesai atau ditolak akan muncul di sini."
      />
    </>
  );
}
