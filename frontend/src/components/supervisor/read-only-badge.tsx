import { Eye } from "lucide-react";

export default function ReadOnlyBadge({ label = "Mode Pengawasan (Read-Only)" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-100 bg-blue-50 text-[12px] font-medium text-blue-800">
      <Eye className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}
