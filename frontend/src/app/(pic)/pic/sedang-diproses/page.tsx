"use client";

import { useMemo } from "react";
import { Hourglass, PauseCircle, PlayCircle, Send } from "lucide-react";
import { CountUp } from "@/components/fx/motion";
import { PageHeader, StatCard } from "@/components/shared/display";
import { FilterBar, RequestTable, useFilter } from "@/components/pic/request-list";
import { usePicStore, useRingkasan } from "@/lib/pic/store";

export default function SedangDiprosesPage() {
  const { permintaan } = usePicStore();
  const r = useRingkasan();
  const aktif = useMemo(
    () => permintaan.filter((p) => p.status === "diproses" || p.status === "pending" || p.status === "menunggu_konfirmasi"),
    [permintaan],
  );
  const filter = useFilter(aktif);

  return (
    <>
      <PageHeader title="Sedang Diproses" desc="Daftar permintaan yang sedang Anda tangani. Buka tiket untuk memperbarui progres atau mengirim hasil agar ditinjau pengaju." />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Aktif" value={<CountUp value={r.aktif} />} hint="Permintaan dalam penanganan" icon={Hourglass} tone="blue" />
        <StatCard label="Sedang Diproses" value={<CountUp value={r.diproses} delay={80} />} hint="Pengerjaan berjalan" icon={PlayCircle} tone="emerald" />
        <StatCard label="Pending" value={<CountUp value={r.pending} delay={160} />} hint="Menunggu pihak lain" icon={PauseCircle} tone="violet" />
        <StatCard label="Menunggu Konfirmasi" value={<CountUp value={r.konfirmasi} delay={240} />} hint="Hasil menunggu peninjauan pengaju" icon={Send} tone="blue" />
      </div>

      <FilterBar data={aktif} filter={filter} statusOptions={["diproses", "pending", "menunggu_konfirmasi"]} />

      <div className="text-xs text-slate-500 -mb-3">
        Menampilkan <span className="font-semibold text-slate-800">{filter.hasil.length}</span> permintaan sedang diproses
      </div>

      <RequestTable
        data={filter.hasil}
        mode="proses"
        emptyTitle={aktif.length === 0 ? "Belum ada tiket aktif" : "Tidak ada hasil"}
        emptyDesc={aktif.length === 0 ? "Terima permintaan dari menu Permintaan Masuk untuk mulai mengerjakan." : "Coba ubah kata kunci atau reset filter."}
      />
    </>
  );
}
