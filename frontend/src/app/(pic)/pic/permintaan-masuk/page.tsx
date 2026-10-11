"use client";

import { useState } from "react";
import { 
  Search, ChevronDown, RefreshCw, Check, X, Ban, 
  Image as ImageIcon, FileText, Info 
} from "lucide-react";

export default function PermintaanMasukPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  
  // Handlers
  const openReviewDrawer = (id: string) => setIsDrawerOpen(true);
  const closeReviewDrawer = () => setIsDrawerOpen(false);
  
  const openAcceptModal = (id: string, title: string, requester: string) => setIsAcceptModalOpen(true);
  const closeAcceptModal = () => setIsAcceptModalOpen(false);
  
  const openRejectModal = (id: string, title: string) => setIsRejectModalOpen(true);
  const closeRejectModal = () => setIsRejectModalOpen(false);

  return (
    <>
      {/* Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-border-subtle pb-5 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Permintaan Masuk</h1>
          <p className="text-sm text-slate-500 mt-1 font-normal">Tinjau dan ambil keputusan terhadap permintaan layanan yang ditugaskan ke bagian Anda.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 mt-3 sm:mt-0">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Antrean SLA Aktif (Real-time)</span>
        </div>
      </div>

      {/* Toolbar (Search & Filters) */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="relative min-w-[260px] max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300 transition" 
              placeholder="Cari ID permintaan, judul, pengaju..." 
              type="text" 
            />
          </div>
          <div className="relative">
            <select className="appearance-none bg-white border border-slate-200 text-xs text-slate-700 py-1.5 pl-3 pr-8 rounded-lg hover:border-slate-300 focus:outline-none focus:border-slate-400 cursor-pointer">
              <option value="">Semua Status</option>
              <option value="menunggu">Menunggu Pemeriksaan</option>
              <option value="diterima">Diterima</option>
              <option value="proses">Sedang Diproses</option>
              <option value="ditolak">Ditolak</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
          </div>
          <div className="relative">
            <select className="appearance-none bg-white border border-slate-200 text-xs text-slate-700 py-1.5 pl-3 pr-8 rounded-lg hover:border-slate-300 focus:outline-none focus:border-slate-400 cursor-pointer">
              <option value="">Semua Layanan</option>
              <option value="it">Dukungan IT</option>
              <option value="facility">Perbaikan Fasilitas</option>
              <option value="access">Akses Sistem & Akun</option>
              <option value="equipment">Permintaan Perlengkapan</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
          </div>
          <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 transition-colors" title="Reset Filter">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="text-xs font-medium text-slate-500 tracking-normal flex items-center gap-2">
          <span className="text-slate-700 font-semibold">8 permintaan</span> menunggu tindakan
          <span className="text-slate-300">•</span>
          <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60 font-medium text-[11px]">2 batas SLA kritis</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border-subtle shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1080px]">
            <thead>
              <tr className="border-b border-border-subtle bg-slate-50/50 text-slate-500 font-medium text-[11px] uppercase tracking-wider">
                <th className="py-3.5 px-4 font-semibold">ID Permintaan</th>
                <th className="py-3.5 px-4 font-semibold">Judul Permintaan</th>
                <th className="py-3.5 px-4 font-semibold">Layanan</th>
                <th className="py-3.5 px-4 font-semibold">Pengaju</th>
                <th className="py-3.5 px-4 font-semibold">Bagian</th>
                <th className="py-3.5 px-4 font-semibold">Lokasi</th>
                <th className="py-3.5 px-4 font-semibold">Tanggal</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 pr-4 pl-4 text-center font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-xs text-slate-700">
              
              {/* Row 1 */}
              <tr className="hover:bg-slate-50/70 transition-colors bg-blue-50/30 group">
                <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-primary hover:underline cursor-pointer" onClick={() => openReviewDrawer('SRV-2026-0012')}>#SRV-2026-0012</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="font-medium text-slate-900 max-w-[190px] truncate" title="Sensor PLC Conveyor Rusak">Sensor PLC Conveyor Rusak</div>
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <span className="text-slate-600">Perbaikan Aset</span>
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-semibold flex items-center justify-center text-[10px]">MF</div>
                    <span className="font-medium text-slate-800">Muhammad Faiz</span>
                  </div>
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px] font-medium">Assembly</span>
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <span className="text-slate-600 text-[11px]">Plant 2 - Lt. 1</span>
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <span className="text-slate-800 font-medium">Hari ini, 08:24</span>
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Menunggu Pemeriksaan
                  </span>
                </td>
                <td className="py-3 pr-4 pl-4 text-center whitespace-nowrap">
                  <div className="flex items-center justify-center gap-2">
                    <button className="inline-flex items-center justify-center px-3 py-1.5 text-[11px] font-semibold bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm" onClick={() => openReviewDrawer('SRV-2026-0012')}>Periksa</button>
                    <button className="inline-flex items-center justify-center px-3 py-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md gap-1.5 transition-colors" onClick={() => openAcceptModal('SRV-2026-0012', 'Sensor PLC Conveyor Rusak', 'Muhammad Faiz')}>
                      <Check className="w-3.5 h-3.5" /> Terima
                    </button>
                    <button className="inline-flex items-center justify-center px-3 py-1.5 text-[11px] font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md gap-1.5 transition-colors" onClick={() => openRejectModal('SRV-2026-0012', 'Sensor PLC Conveyor Rusak')}>
                      <X className="w-3.5 h-3.5" /> Tolak
                    </button>
                  </div>
                </td>
              </tr>
              
              {/* Row 2 */}
              <tr className="hover:bg-slate-50/70 transition-colors group">
                <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                  <span className="text-primary hover:underline cursor-pointer" onClick={() => openReviewDrawer('SRV-2026-0014')}>#SRV-2026-0014</span>
                </td>
                <td className="py-3 px-4">
                  <div className="font-medium text-slate-900 max-w-[190px] truncate" title="Kenaikan Otoritas SAP Produksi">Kenaikan Otoritas SAP Produksi</div>
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <span className="text-slate-600">Akses Sistem</span>
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-semibold flex items-center justify-center text-[10px]">SR</div>
                    <span className="font-medium text-slate-800">Siti Rahmawati</span>
                  </div>
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px] font-medium">PE</span>
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <span className="text-slate-600 text-[11px]">Plant 1 - Lt. 2</span>
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <span className="text-slate-800 font-medium">Hari ini, 08:45</span>
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Menunggu Pemeriksaan
                  </span>
                </td>
                <td className="py-3 pr-4 pl-4 text-center whitespace-nowrap">
                  <div className="flex items-center justify-center gap-2">
                    <button className="inline-flex items-center justify-center px-3 py-1.5 text-[11px] font-semibold bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm" onClick={() => openReviewDrawer('SRV-2026-0014')}>Periksa</button>
                    <button className="inline-flex items-center justify-center px-3 py-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md gap-1.5 transition-colors" onClick={() => openAcceptModal('SRV-2026-0014', 'Kenaikan Otoritas SAP Produksi', 'Siti Rahmawati')}>
                      <Check className="w-3.5 h-3.5" /> Terima
                    </button>
                    <button className="inline-flex items-center justify-center px-3 py-1.5 text-[11px] font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md gap-1.5 transition-colors" onClick={() => openRejectModal('SRV-2026-0014', 'Kenaikan Otoritas SAP Produksi')}>
                      <X className="w-3.5 h-3.5" /> Tolak
                    </button>
                  </div>
                </td>
              </tr>

              {/* Row 3 - Processing */}
              <tr className="hover:bg-slate-50/70 transition-colors group">
                <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                  <span className="text-primary hover:underline cursor-pointer">#SRV-2026-0019</span>
                </td>
                <td className="py-3 px-4">
                  <div className="font-medium text-slate-900 max-w-[190px] truncate" title="Penggantian Laptop CAD Engineering">Penggantian Laptop CAD Engineering</div>
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <span className="text-slate-600">Dukungan IT</span>
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-semibold flex items-center justify-center text-[10px]">DA</div>
                    <span className="font-medium text-slate-800">Dimas Anggara</span>
                  </div>
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px] font-medium">IS</span>
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <span className="text-slate-600 text-[11px]">Plant 1 - Lt. 3</span>
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <span className="text-slate-700 font-medium">Kemarin, 16:10</span>
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>Sedang Diproses
                  </span>
                </td>
                <td className="py-3 pr-4 pl-4 text-center whitespace-nowrap">
                  <div className="flex items-center justify-center">
                    <button className="inline-flex items-center justify-center px-4 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 text-[11px] font-medium rounded-md transition-colors border border-slate-200/60">Lihat Detail</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-5 py-3 border-t border-border-subtle flex items-center justify-between text-xs text-slate-500">
          <div>Menampilkan <span className="font-semibold text-slate-700">1 - 3</span> dari <span className="font-semibold text-slate-700">8</span> permintaan</div>
          <div className="flex items-center gap-1">
            <button className="px-2 py-1 rounded text-slate-400 hover:bg-slate-100 disabled:opacity-40" disabled>Sebelumnya</button>
            <button className="w-6 h-6 rounded bg-slate-100 font-semibold text-slate-800 flex items-center justify-center">1</button>
            <button className="px-2 py-1 rounded text-slate-400 hover:bg-slate-100 disabled:opacity-40" disabled>Selanjutnya</button>
          </div>
        </div>
      </div>

      {/* --- DRAWERS AND MODALS --- */}
      
      {/* Backdrop */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-40 transition-opacity"
          onClick={closeReviewDrawer}
        />
      )}

      {/* Slide-over Drawer */}
      <div className={`fixed inset-y-0 right-0 w-full sm:w-[480px] bg-white border-l border-slate-200 shadow-xl z-50 transform transition-transform duration-300 ease-out flex flex-col justify-between ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full overflow-y-auto">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10">
            <div className="flex items-center gap-2.5">
              <span className="text-base font-semibold text-slate-900">#SRV-2026-0012</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200/60">Mendesak</span>
            </div>
            <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors" onClick={closeReviewDrawer}>
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-6 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Informasi Pengaju</span>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50/80 border border-slate-100">
                <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-xs">MF</div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-800">Muhammad Faiz</span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-medium">NIK: 882194</span>
                  </div>
                  <span className="text-[11px] text-slate-500">Senior Assembly Specialist • Divisi Perakitan</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Detail Masalah</span>
              <div className="p-3.5 rounded-lg bg-slate-50/80 border border-slate-100 flex flex-col gap-2">
                <span className="text-xs font-semibold text-slate-900">Sensor PLC Conveyor Rusak</span>
                <p className="text-xs text-slate-600 leading-relaxed">Sensor pembaca barcode optik di Stasiun B mengalami timeout pembacaan berkala, menyebabkan konveyor lini perakitan berhenti setiap 4 menit. Kode kesalahan E-0419 tampil di konsol unit. Memerlukan inspeksi fisik dan penggantian lensa sensor.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                <span className="text-[11px] text-slate-400 block mb-0.5 font-medium">Kategori Layanan</span>
                <span className="font-medium text-slate-800">Perbaikan Aset</span>
              </div>
              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                <span className="text-[11px] text-slate-400 block mb-0.5 font-medium">Lokasi Pengerjaan</span>
                <span className="font-medium text-slate-800">Plant 2 - Lt. 1 (Station B)</span>
              </div>
              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                <span className="text-[11px] text-slate-400 block mb-0.5 font-medium">Target SLA Bagian</span>
                <span className="font-semibold text-amber-700">Respon &lt; 2 Jam</span>
              </div>
              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                <span className="text-[11px] text-slate-400 block mb-0.5 font-medium">Waktu Masuk</span>
                <span className="font-medium text-slate-700">Hari ini, 08:24</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Foto & Dokumen Pendukung</span>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-2 rounded-lg border border-slate-200/80 bg-white flex items-center gap-2">
                  <div className="w-9 h-9 rounded bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col truncate">
                    <span className="text-xs font-medium text-slate-800 truncate">foto_error_e0419.jpg</span>
                    <span className="text-[10px] text-slate-400">1.8 MB • Foto Sensor</span>
                  </div>
                </div>
                <div className="p-2 rounded-lg border border-slate-200/80 bg-white flex items-center gap-2">
                  <div className="w-9 h-9 rounded bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col truncate">
                    <span className="text-xs font-medium text-slate-800 truncate">log_conveyor_line.pdf</span>
                    <span className="text-[10px] text-slate-400">420 KB • Catatan Mesin</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 pt-1">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Catatan Triage PIC (Opsional)</label>
              <textarea 
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 resize-none" 
                placeholder="Instruksi penugasan internal atau arahan teknisi awal..." 
                rows={2}
              ></textarea>
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between gap-3 sticky bottom-0">
          <button 
            className="px-3.5 py-2 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5"
            onClick={() => { closeReviewDrawer(); openRejectModal('SRV-2026-0012', 'Sensor PLC Conveyor Rusak'); }}
          >
            <X className="w-4 h-4" /> Tolak Permintaan
          </button>
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors" onClick={closeReviewDrawer}>Tutup</button>
            <button 
              className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1.5"
              onClick={() => { closeReviewDrawer(); openAcceptModal('SRV-2026-0012', 'Sensor PLC Conveyor Rusak', 'Muhammad Faiz'); }}
            >
              <Check className="w-4 h-4" /> Terima Permintaan
            </button>
          </div>
        </div>
      </div>

      {/* Accept Modal */}
      {isAcceptModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Check className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900">Terima Permintaan?</h3>
              </div>
              <button className="text-slate-400 hover:text-slate-700" onClick={closeAcceptModal}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 flex flex-col gap-3">
              <p className="text-xs text-slate-600 leading-relaxed">Apakah Anda yakin ingin menerima permintaan <span className="font-semibold text-slate-900">#SRV-2026-0012</span>?</p>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 text-xs text-slate-600 flex flex-col gap-1.5">
                <div>• Status otomatis berpindah menjadi <span className="font-medium text-emerald-700">"Diterima / Sedang Diproses"</span>.</div>
                <div>• Anda akan tercatat sebagai PIC penanggung jawab.</div>
                <div>• Pengaju akan menerima notifikasi pengerjaan.</div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-end gap-2.5">
              <button className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors" onClick={closeAcceptModal}>Batal</button>
              <button className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1.5" onClick={closeAcceptModal}>
                <Check className="w-4 h-4" /> Terima Permintaan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <Ban className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900">Tolak Permintaan?</h3>
              </div>
              <button className="text-slate-400 hover:text-slate-700" onClick={closeRejectModal}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 flex flex-col gap-3">
              <p className="text-xs text-slate-600 leading-relaxed">Anda akan menolak permintaan <span className="font-semibold text-slate-900">#SRV-2026-0012</span>. Silakan cantumkan alasan penolakan yang jelas untuk pengaju.</p>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Alasan Penolakan <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] font-normal text-slate-400">Wajib diisi</span>
                </label>
                <textarea 
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-200 resize-none" 
                  placeholder="Contoh: Permintaan berada di luar cakupan wewenang tim kami atau data kelengkapan belum terpenuhi..." 
                  rows={3}
                ></textarea>
              </div>
              <div className="bg-amber-50 rounded-lg p-2.5 border border-amber-200/70 text-[11px] text-amber-800 flex items-start gap-2">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Alasan penolakan ini akan dikirimkan langsung melalui notifikasi kepada karyawan pengaju.</span>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-end gap-2.5">
              <button className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors" onClick={closeRejectModal}>Batal</button>
              <button className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors flex items-center gap-1.5" onClick={closeRejectModal}>
                <Ban className="w-4 h-4" /> Tolak Permintaan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
