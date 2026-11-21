"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, MousePointerClick } from "lucide-react";
import PageHeader from "@/components/employee/page-header";
import SectionIcon from "@/components/employee/section-icon";
import { SECTIONS } from "@/lib/employee-data";

const dl = (ms: number) => ({ "--delay": `${ms}ms` } as React.CSSProperties);

export default function PilihSectionPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const current = SECTIONS.find((s) => s.slug === selected);

  return (
    <>
      <PageHeader
        title="Buat Permintaan Baru"
        description="Langkah 1 dari 2: pilih bagian layanan yang sesuai dengan kebutuhan Anda."
      />

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {SECTIONS.map((s, i) => {
          const active = selected === s.slug;
          return (
            <button
              key={s.slug}
              type="button"
              onClick={() => setSelected(s.slug)}
              className={`fx-reveal group text-left rounded-xl border p-5 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-blue-200 ${
                active ? "border-blue-600 ring-4 ring-blue-100 bg-blue-50/40" : "border-slate-200"
              }`}
              style={dl(80 + i * 70)}
            >
              <div className="flex items-start justify-between">
                <span
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${
                    active ? "bg-blue-700 text-white shadow-md shadow-blue-700/30" : "bg-blue-50 text-blue-700"
                  }`}
                >
                  <SectionIcon name={s.icon} className="w-6 h-6" />
                </span>
                {active && <CheckCircle2 className="w-5 h-5 text-blue-600 animate-in zoom-in-50 duration-300" />}
              </div>
              <h3 className="mt-4 text-[15px] font-semibold text-slate-900">{s.name}</h3>
              <p className="mt-1 text-[13px] text-slate-500 leading-relaxed">{s.description}</p>
              <div className="mt-4 flex items-center gap-1.5 text-[13px] font-medium text-blue-700">
                Pilih Departemen
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </button>
          );
        })}
      </section>

      {/* Bar konfirmasi pilihan */}
      <section
        className="fx-reveal rounded-xl border border-slate-200 bg-white shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={dl(500)}
      >
        <div className="flex items-center gap-3">
          <span
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${
              current ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
            }`}
          >
            {current ? <CheckCircle2 className="w-5 h-5" /> : <MousePointerClick className="w-5 h-5" />}
          </span>
          <div>
            <p className="text-sm font-medium text-slate-900">
              {current ? current.name : "Belum ada departemen yang dipilih"}
            </p>
            <p className="text-xs text-slate-500">
              {current ? "Lanjutkan untuk mengisi formulir permintaan." : "Klik salah satu departemen di atas untuk melanjutkan pengajuan."}
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={!current}
          onClick={() => current && router.push(`/employee/pengajuan-layanan/${current.slug}`)}
          className="group inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-800 to-blue-600 text-white text-[13px] font-medium shadow-sm shadow-blue-800/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-sm"
        >
          Lanjutkan ke Formulir Permintaan
          <ArrowRight className="w-4 h-4 transition-transform duration-300 group-enabled:group-hover:translate-x-1" />
        </button>
      </section>
    </>
  );
}
