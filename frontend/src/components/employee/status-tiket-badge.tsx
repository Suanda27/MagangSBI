import { STATUS_TIKET_STYLE } from "@/lib/status-tiket";
import type { StatusTiket } from "@/lib/api/types";

/** Lencana status untuk data dari API (label dari server, sudut pandang karyawan). */
export default function StatusTiketBadge({ status, label }: { status: StatusTiket; label: string }) {
  const s = STATUS_TIKET_STYLE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11.5px] font-medium ${s.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {label}
    </span>
  );
}
