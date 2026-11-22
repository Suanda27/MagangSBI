import Link from "next/link";
import { Eye, UserRound } from "lucide-react";
import SupStatusBadge from "./status-badge";
import type { SupTicket } from "@/lib/supervisor-data";

export default function TicketTable({ rows, compact = false }: { rows: SupTicket[]; compact?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-[13px] min-w-[900px]">
        <thead className="bg-slate-50/70 text-slate-500 text-xs uppercase tracking-wide">
          <tr>
            <th className="px-5 py-3 font-medium">ID</th>
            <th className="px-5 py-3 font-medium">Judul & Layanan</th>
            <th className="px-5 py-3 font-medium">Pengaju</th>
            <th className="px-5 py-3 font-medium">Section</th>
            {!compact && <th className="px-5 py-3 font-medium">PIC</th>}
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium">Tanggal</th>
            <th className="px-5 py-3 font-medium text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((t) => (
            <tr key={t.id}>
              <td className="px-5 py-3.5">
                <Link href={`/supervisor/monitoring-permintaan/${t.id}`} className="font-medium text-blue-700 hover:text-blue-900 hover:underline underline-offset-4">
                  #{t.id}
                </Link>
              </td>
              <td className="px-5 py-3.5 max-w-[260px]">
                <p className="font-medium text-slate-800 truncate">{t.title}</p>
                <p className="text-xs text-slate-400 truncate">{t.service}</p>
              </td>
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold flex items-center justify-center shrink-0">
                    {t.requester.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                  </span>
                  <span className="text-slate-700">{t.requester}</span>
                </div>
              </td>
              <td className="px-5 py-3.5">
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">{t.section}</span>
              </td>
              {!compact && (
                <td className="px-5 py-3.5">
                  {t.pic ? (
                    <span className="inline-flex items-center gap-1.5 text-slate-700"><UserRound className="w-3.5 h-3.5 text-slate-400" />{t.pic}</span>
                  ) : (
                    <span className="text-xs italic text-slate-400">Menunggu alokasi</span>
                  )}
                </td>
              )}
              <td className="px-5 py-3.5"><SupStatusBadge status={t.status} /></td>
              <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                {t.date}
                <span className="block text-xs text-slate-400">{t.time} WIB</span>
              </td>
              <td className="px-5 py-3.5 text-right">
                <Link href={`/supervisor/monitoring-permintaan/${t.id}`} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-medium text-slate-600 hover:text-blue-700 hover:bg-blue-50">
                  <Eye className="w-4 h-4" />Detail
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
