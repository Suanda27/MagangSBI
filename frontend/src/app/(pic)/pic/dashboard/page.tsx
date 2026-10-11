import { Inbox, Hourglass, CheckCircle2, Calendar, Search } from "lucide-react";

export default function PicDashboard() {
  return (
    <>
      {/* Greeting and Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-900">Selamat pagi, Budi</h1>
          <p className="text-[13px] text-slate-500 mt-1">Berikut ringkasan permintaan layanan yang perlu Anda tangani.</p>
        </div>
      </div>

      {/* Compact Unified Summary Row */}
      <div className="bg-white border border-border-subtle rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.02)] mb-8 md:mb-10 overflow-hidden">
        <div className="grid grid-cols-1 divide-y md:divide-y-0 md:divide-x divide-border-subtle md:grid-cols-3">
          {/* Incoming Metric */}
          <div className="p-4 md:p-5 flex flex-col justify-between group hover:bg-slate-50/50 transition-colors">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Permintaan Masuk</span>
              <Inbox className="w-[18px] h-[18px] text-slate-400 group-hover:text-blue-600 transition-colors" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-slate-900 tracking-tight">8</span>
              <span className="text-[11px] text-blue-600 font-medium">+3 baru hari ini</span>
            </div>
            <span className="text-[12px] text-slate-400 mt-1">Menunggu pemeriksaan awal</span>
          </div>
          {/* In Progress Metric */}
          <div className="p-4 md:p-5 flex flex-col justify-between group hover:bg-slate-50/50 transition-colors">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Sedang Diproses</span>
              <Hourglass className="w-[18px] h-[18px] text-slate-400 group-hover:text-amber-600 transition-colors" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-slate-900 tracking-tight">14</span>
              <span className="text-[11px] text-slate-500 font-medium">tugas aktif</span>
            </div>
            <span className="text-[12px] text-slate-400 mt-1">Sedang ditangani</span>
          </div>
          {/* Completed Metric */}
          <div className="p-4 md:p-5 flex flex-col justify-between group hover:bg-slate-50/50 transition-colors">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Selesai</span>
              <CheckCircle2 className="w-[18px] h-[18px] text-slate-400 group-hover:text-emerald-600 transition-colors" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-slate-900 tracking-tight">42</span>
              <span className="text-[11px] text-emerald-600 font-medium">98,2% tepat waktu</span>
            </div>
            <span className="text-[12px] text-slate-400 mt-1">Selesai bulan ini</span>
          </div>
        </div>
      </div>

      {/* Requests Requiring Attention */}
      <section className="mb-10 md:mb-12">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-slate-900 tracking-tight">Permintaan yang Perlu Ditangani</h2>
          </div>
          <a className="text-xs font-medium text-slate-500 hover:text-primary transition-colors hidden sm:block" href="#">Lihat semua permintaan &rarr;</a>
        </div>
        
        <div className="bg-white border border-border-subtle rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-border-subtle bg-slate-50/60 text-slate-500">
                  <th className="py-3 px-4 font-medium text-slate-600">ID Permintaan</th>
                  <th className="py-3 px-4 font-medium text-slate-600">Layanan</th>
                  <th className="py-3 px-4 font-medium text-slate-600">Pengaju</th>
                  <th className="py-3 px-4 font-medium text-slate-600">Bagian</th>
                  <th className="py-3 px-4 font-medium text-slate-600">Status</th>
                  <th className="py-3 px-4 font-medium text-slate-600">Tanggal</th>
                  <th className="py-3 px-4 font-medium text-slate-600 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-4 px-4 font-mono font-medium text-slate-900">#SRV-2026-0012</td>
                  <td className="py-4 px-4 font-medium text-slate-800">Server Room AC Leakage</td>
                  <td className="py-4 px-4 text-slate-600">Muhammad Faiz</td>
                  <td className="py-4 px-4 text-slate-500">Facilities Ops</td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-red-50 text-red-600 border border-red-100">Terlambat</span>
                  </td>
                  <td className="py-4 px-4 text-slate-500">Hari ini, 08:15</td>
                  <td className="py-4 px-4 text-right">
                    <button className="text-xs font-medium text-primary hover:text-blue-800 hover:underline">Periksa</button>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-4 px-4 font-mono font-medium text-slate-900">#SRV-2026-0015</td>
                  <td className="py-4 px-4 font-medium text-slate-800">VPN & GitLab Onboarding</td>
                  <td className="py-4 px-4 text-slate-600">Siti Aminah</td>
                  <td className="py-4 px-4 text-slate-500">IT Security</td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-600 border border-blue-100">Menunggu</span>
                  </td>
                  <td className="py-4 px-4 text-slate-500">Hari ini, 08:40</td>
                  <td className="py-4 px-4 text-right">
                    <button className="text-xs font-medium text-primary hover:text-blue-800 hover:underline">Periksa</button>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-4 px-4 font-mono font-medium text-slate-900">#SRV-2026-0018</td>
                  <td className="py-4 px-4 font-medium text-slate-800">Dual 4K Monitor Request</td>
                  <td className="py-4 px-4 text-slate-600">Reza Pratama</td>
                  <td className="py-4 px-4 text-slate-500">Hardware IT</td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-100">Sedang Diproses</span>
                  </td>
                  <td className="py-4 px-4 text-slate-500">Kemarin, 16:20</td>
                  <td className="py-4 px-4 text-right">
                    <button className="text-xs font-medium text-slate-600 hover:text-slate-900">Detail</button>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-4 px-4 font-mono font-medium text-slate-900">#SRV-2026-0021</td>
                  <td className="py-4 px-4 font-medium text-slate-800">AutoCAD Civil 3D Seat</td>
                  <td className="py-4 px-4 text-slate-600">Kevin Tandio</td>
                  <td className="py-4 px-4 text-slate-500">Procurement / SW</td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-600 border border-blue-100">Menunggu</span>
                  </td>
                  <td className="py-4 px-4 text-slate-500">Hari ini, 09:02</td>
                  <td className="py-4 px-4 text-right">
                    <button className="text-xs font-medium text-primary hover:text-blue-800 hover:underline">Periksa</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <a className="text-xs font-medium text-slate-500 hover:text-primary transition-colors block sm:hidden mt-3 text-center" href="#">Lihat semua permintaan &rarr;</a>
      </section>

      {/* Permintaan Selesai */}
      <section className="mb-12">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-slate-900 tracking-tight">Permintaan Selesai</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Daftar permintaan layanan yang telah diselesaikan oleh PIC.</p>
          </div>
          <a className="text-xs font-medium text-slate-500 hover:text-primary transition-colors hidden sm:block" href="#">Lihat Semua &rarr;</a>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="bg-white border border-border-subtle rounded-lg p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Total Selesai</span>
              <span className="text-xl font-semibold text-slate-900 tracking-tight mt-0.5">42</span>
            </div>
            <div className="w-8 h-8 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="bg-white border border-border-subtle rounded-lg p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Selesai Hari Ini</span>
              <span className="text-xl font-semibold text-slate-900 tracking-tight mt-0.5">5</span>
            </div>
            <div className="w-8 h-8 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="bg-white border border-border-subtle rounded-lg p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Selesai Bulan Ini</span>
              <span className="text-xl font-semibold text-slate-900 tracking-tight mt-0.5">28</span>
            </div>
            <div className="w-8 h-8 rounded-md bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Completed Requests Table */}
        <div className="bg-white border border-border-subtle rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="p-3.5 border-b border-border-subtle bg-slate-50/50 flex flex-col xl:flex-row gap-3 items-stretch xl:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" className="w-full bg-white border border-slate-200/80 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-300 transition-colors" placeholder="Cari ID permintaan, judul, atau nama pengaju..." />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 xl:pb-0 scrollbar-hide">
              <select className="bg-white border border-slate-200/80 rounded-md px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-slate-300 min-w-max">
                <option value="">Semua Bagian</option>
                <option>Assembly</option>
                <option>GA</option>
                <option>HR</option>
                <option>IS</option>
                <option>PE</option>
              </select>
              <select className="bg-white border border-slate-200/80 rounded-md px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-slate-300 min-w-max">
                <option value="">Semua Layanan</option>
                <option>Perbaikan Fasilitas</option>
                <option>Peralatan & Perlengkapan</option>
                <option>Fasilitas & Gedung</option>
              </select>
              <button className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-200/80 bg-white text-xs text-slate-600 hover:bg-slate-50 transition-colors min-w-max">
                <Calendar className="w-3.5 h-3.5" />
                <span>Tanggal</span>
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-border-subtle bg-slate-50/60 text-slate-500">
                  <th className="py-3 px-4 font-medium text-slate-600">ID Permintaan</th>
                  <th className="py-3 px-4 font-medium text-slate-600">Judul Permintaan</th>
                  <th className="py-3 px-4 font-medium text-slate-600">Layanan</th>
                  <th className="py-3 px-4 font-medium text-slate-600">Nama Pengaju</th>
                  <th className="py-3 px-4 font-medium text-slate-600">Bagian</th>
                  <th className="py-3 px-4 font-medium text-slate-600">Tanggal Pengajuan</th>
                  <th className="py-3 px-4 font-medium text-slate-600">Tanggal Selesai</th>
                  <th className="py-3 px-4 font-medium text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-medium text-slate-900 whitespace-nowrap">REQ-2026-00124</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">Perbaikan AC Ruang Assembly</td>
                  <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">Perbaikan Fasilitas</td>
                  <td className="py-3.5 px-4 text-slate-800 font-medium whitespace-nowrap">Ahmad Fauzi</td>
                  <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">Assembly</td>
                  <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">23 Ags 2026, 08:24</td>
                  <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">24 Ags 2026, 14:35</td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-600 border border-emerald-100">Selesai</span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-medium text-slate-900 whitespace-nowrap">REQ-2026-00121</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">Permintaan Perlengkapan Kerja</td>
                  <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">Peralatan & Perlengkapan</td>
                  <td className="py-3.5 px-4 text-slate-800 font-medium whitespace-nowrap">Rizky Pratama</td>
                  <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">Assembly</td>
                  <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">22 Ags 2026, 09:15</td>
                  <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">23 Ags 2026, 15:20</td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-600 border border-emerald-100">Selesai</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <a className="text-xs font-medium text-slate-500 hover:text-primary transition-colors block sm:hidden mt-3 text-center" href="#">Lihat Semua &rarr;</a>
      </section>
    </>
  );
}
