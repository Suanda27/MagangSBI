import { Check, Cog, PackageCheck, UserCheck, XCircle } from "lucide-react";
import type { StatusTiket } from "@/lib/api/types";
import { tahapTiket } from "@/lib/status-tiket";

// Empat tahap alur tiket (PRD 4.1): Diajukan -> Diproses -> Menunggu Konfirmasi -> Selesai.
const STEPS = ["Diajukan", "Diproses oleh PIC", "Menunggu Konfirmasi", "Selesai"];
const ICONS = [Check, Cog, UserCheck, PackageCheck];

/** Garis waktu status untuk data dari API. Ditolak berhenti di tahap pertama dan ditandai merah. */
export default function TiketTimeline({ status }: { status: StatusTiket }) {
  const ditolak = status === "rejected";
  const selesai = status === "completed";
  // Indeks 0-based tahap berjalan; tiket Selesai menandai semua tahap tuntas.
  const current = tahapTiket(status) - 1;
  const lebar = ditolak ? 0 : (current / (STEPS.length - 1)) * 100;

  return (
    <div className="relative px-2 pt-2 pb-1">
      <div className="absolute left-[12.5%] right-[12.5%] top-[26px] h-0.5 bg-slate-200 rounded-full" />
      <div
        className={`absolute left-[12.5%] top-[26px] h-0.5 rounded-full transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          ditolak ? "bg-rose-400" : "bg-gradient-to-r from-blue-700 to-blue-500"
        }`}
        style={{ width: `${(lebar / 100) * 75}%` }}
      />

      <div className="relative grid grid-cols-4">
        {STEPS.map((label, i) => {
          const gagal = ditolak && i === 0;
          const tuntas = !ditolak && (selesai || i < current);
          const aktif = !ditolak && !selesai && i === current;
          const Icon = gagal ? XCircle : ICONS[i];
          return (
            <div key={label} className="flex flex-col items-center gap-2 text-center">
              <div
                className={`relative w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                  gagal
                    ? "bg-rose-50 border-rose-400 text-rose-600"
                    : tuntas
                    ? "bg-blue-700 border-blue-700 text-white shadow-md shadow-blue-700/30"
                    : aktif
                    ? "bg-white border-blue-600 text-blue-700 shadow-[0_0_0_5px_rgba(37,99,235,0.12)]"
                    : "bg-white border-slate-200 text-slate-300"
                }`}
              >
                {aktif && <span className="absolute inset-0 rounded-full border-2 border-blue-500 animate-ping opacity-40" />}
                <Icon className="w-[18px] h-[18px]" />
              </div>
              <span className={`text-xs font-medium ${gagal ? "text-rose-600" : tuntas || aktif ? "text-slate-900" : "text-slate-400"}`}>
                {gagal ? "Ditolak" : label}
              </span>
            </div>
          );
        })}
      </div>

      {status === "pending" && (
        <p className="mt-3 text-center text-xs text-slate-500">Pengerjaan sedang ditunda sementara oleh PIC (Pending).</p>
      )}
    </div>
  );
}
