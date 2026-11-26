"use client";

import { useEffect, useState } from "react";
import { CountUp } from "@/components/fx/motion";

/** Donut chart SVG; segmen "menggambar" dirinya saat pertama kali tampil. */
export function DonutChart({
  data,
  centerLabel,
  size = 176,
}: {
  data: { label: string; value: number; color: string }[];
  centerLabel: string;
  size?: number;
}) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOn(true), 150);
    return () => clearTimeout(t);
  }, []);

  const total = data.reduce((a, b) => a + b.value, 0);
  const bagi = total || 1; // tanpa data: lingkaran kosong, bukan NaN
  const r = 70;
  const c = 2 * Math.PI * r;
  // Offset awal tiap segmen dihitung di depan (tanpa mengubah variabel saat render)
  const offsets = data.map((_, i) => data.slice(0, i).reduce((a, b) => a + (b.value / bagi) * c, 0));

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 180 180" className="w-full h-full -rotate-90">
        <circle cx="90" cy="90" r={r} fill="none" stroke="#f1f5f9" strokeWidth="18" />
        {data.map((d, i) => {
          const len = (d.value / bagi) * c;
          return (
            <circle
              key={d.label}
              cx="90"
              cy="90"
              r={r}
              fill="none"
              stroke={d.color}
              strokeWidth="18"
              strokeDasharray={`${on ? Math.max(len - 2, 0) : 0} ${c}`}
              strokeDashoffset={-offsets[i]}
              strokeLinecap="butt"
              className="transition-[stroke-dasharray] duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <CountUp value={total} className="text-3xl font-semibold tracking-tight text-slate-900" />
        <span className="text-[11px] text-slate-400">{centerLabel}</span>
      </div>
    </div>
  );
}

/** Daftar batang horizontal yang tumbuh dari kiri. */
export function HBarList({ data, color = "bg-blue-600" }: { data: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="grid gap-3.5">
      {data.map((d, i) => (
        <div key={d.label}>
          <div className="flex items-center justify-between text-[13px] mb-1.5">
            <span className="font-medium text-slate-700">{d.label}</span>
            <span className="text-slate-500">{d.value} tiket</span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`fx-bar h-full rounded-full ${color}`}
              style={{ width: `${(d.value / max) * 100}%`, "--delay": `${200 + i * 100}ms` } as React.CSSProperties}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Grafik kolom ganda (masuk vs selesai) per periode. */
export function TrendBars({ data }: { data: { label: string; masuk: number; selesai: number }[] }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOn(true), 200);
    return () => clearTimeout(t);
  }, []);
  const max = Math.max(1, ...data.flatMap((d) => [d.masuk, d.selesai]));
  // Banyak periode (mis. 31 hari): batang dirapatkan dan label ditampilkan berselang agar tidak bertumpuk.
  const rapat = data.length > 12;
  const selang = rapat ? Math.ceil(data.length / 10) : 1;

  return (
    <div>
      <div className={`h-44 flex items-end px-2 border-b border-slate-100 ${rapat ? "gap-1" : "gap-4 sm:gap-8"}`}>
        {data.map((d) => (
          <div key={d.label} className="flex-1 h-full flex items-end justify-center gap-1.5">
            {[
              { v: d.masuk, c: "bg-blue-600", t: "Masuk" },
              { v: d.selesai, c: "bg-emerald-500", t: "Selesai" },
            ].map((b) => (
              <div
                key={b.t}
                title={`${b.t}: ${b.v}`}
                className={`group/bar relative w-full ${rapat ? "max-w-[10px]" : "max-w-[28px]"} rounded-t-md ${b.c} transition-[height] duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:brightness-110`}
                style={{ height: on ? `${(b.v / max) * 100}%` : "0%" }}
              >
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[11px] font-medium text-slate-500 opacity-0 group-hover/bar:opacity-100 transition-opacity">
                  {b.v}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className={`flex px-2 mt-2 ${rapat ? "gap-1" : "gap-4 sm:gap-8"}`}>
        {data.map((d, i) => (
          <span key={`${d.label}-${i}`} className="flex-1 text-center text-[11px] sm:text-[12px] text-slate-400 whitespace-nowrap overflow-visible">
            {i % selang === 0 ? d.label : ""}
          </span>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-center gap-5 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-blue-600" />Permintaan Masuk</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />Selesai</span>
      </div>
    </div>
  );
}
