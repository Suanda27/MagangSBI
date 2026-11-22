"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({ page, perPage, total, onPage, noun = "permintaan" }: { page: number; perPage: number; total: number; onPage: (p: number) => void; noun?: string }) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);
  return (
    <div className="px-5 py-3 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
      <div>
        Menampilkan <span className="font-semibold text-slate-700">{from}–{to}</span> dari <span className="font-semibold text-slate-700">{total}</span> {noun}
      </div>
      <div className="flex items-center gap-1">
        <button className="p-1.5 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Sebelumnya">
          <ChevronLeft className="w-4 h-4" />
        </button>
        {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => onPage(n)}
            className={`w-7 h-7 rounded-md text-xs font-medium transition-colors ${n === page ? "bg-blue-700 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}
          >
            {n}
          </button>
        ))}
        <button className="p-1.5 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Selanjutnya">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
