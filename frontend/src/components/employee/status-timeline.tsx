import { Check, Cog, PackageCheck, XCircle } from "lucide-react";
import type { TicketStatus } from "@/lib/employee-data";

// Tahap: Diajukan -> Diproses oleh PIC -> Selesai
const STEPS = ["Diajukan", "Diproses oleh PIC", "Selesai"];

export default function StatusTimeline({ status }: { status: TicketStatus }) {
  const rejected = status === "Ditolak";
  // indeks tahap aktif
  const current = status === "Diajukan" ? 0 : status === "Diproses" ? 1 : 2;
  const pct = rejected ? 50 : current === 0 ? 0 : current === 1 ? 50 : 100;

  const icons = [Check, Cog, PackageCheck];

  return (
    <div className="relative px-2 pt-2 pb-1">
      {/* Garis dasar + progres */}
      <div className="absolute left-[16.6%] right-[16.6%] top-[26px] h-0.5 bg-slate-200 rounded-full" />
      <div
        className={`absolute left-[16.6%] top-[26px] h-0.5 rounded-full transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          rejected ? "bg-rose-400" : "bg-gradient-to-r from-blue-700 to-blue-500"
        }`}
        style={{ width: `${(pct / 100) * 66.8}%` }}
      />

      <div className="relative grid grid-cols-3">
        {STEPS.map((label, i) => {
          const done = !rejected && i < current;
          const active = i === current && !rejected;
          const failed = rejected && i === 2;
          const Icon = failed ? XCircle : icons[i];
          return (
            <div key={label} className="flex flex-col items-center gap-2 text-center">
              <div
                className={`relative w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                  failed
                    ? "bg-rose-50 border-rose-400 text-rose-600"
                    : done
                    ? "bg-blue-700 border-blue-700 text-white shadow-md shadow-blue-700/30"
                    : active
                    ? "bg-white border-blue-600 text-blue-700 shadow-[0_0_0_5px_rgba(37,99,235,0.12)]"
                    : "bg-white border-slate-200 text-slate-300"
                }`}
              >
                {active && <span className="absolute inset-0 rounded-full border-2 border-blue-500 animate-ping opacity-40" />}
                <Icon className="w-[18px] h-[18px]" />
              </div>
              <span
                className={`text-xs font-medium ${
                  failed ? "text-rose-600" : done || active ? "text-slate-900" : "text-slate-400"
                }`}
              >
                {failed ? "Ditolak" : label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
