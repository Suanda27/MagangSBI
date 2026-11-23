import { SUP_STATUS_STYLE, type SupStatus } from "@/lib/supervisor-data";

export default function SupStatusBadge({ status }: { status: SupStatus }) {
  const s = SUP_STATUS_STYLE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11.5px] font-medium whitespace-nowrap ${s.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}
