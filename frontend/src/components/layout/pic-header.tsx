import { Search, Bell, Menu } from "lucide-react";

interface PicHeaderProps {
  onMenuClick: () => void;
}

export default function PicHeader({ onMenuClick }: PicHeaderProps) {
  return (
    <header className="h-14 border-b border-border-subtle/80 bg-white/80 backdrop-blur-md sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3 w-full">
        <button className="md:hidden text-slate-500" onClick={onMenuClick}>
          <Menu className="w-5 h-5" />
        </button>
        {/* Search Input */}
        <div className="relative w-full md:w-80 max-w-full">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            className="w-full bg-slate-50 border border-slate-200/80 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-300 focus:bg-white transition-colors" 
            placeholder="Cari permintaan, ID, atau pengaju..." 
            type="text" 
          />
        </div>
      </div>
      
      {/* Right Profile & Icons */}
      <div className="flex items-center gap-3 md:gap-4 ml-4">
        <button className="relative p-1.5 text-slate-400 hover:text-slate-600 rounded-md transition-colors" title="Notifikasi">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
        </button>
        <div className="h-4 w-px bg-slate-200 hidden md:block"></div>
        <div className="flex items-center gap-2.5 pl-1 cursor-pointer group">
          <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center text-xs font-semibold text-slate-700 flex-shrink-0">
            BS
          </div>
          <div className="flex-col text-left hidden md:flex">
            <span className="text-xs font-medium text-slate-800 leading-tight">Budi Santoso</span>
            <span className="text-[11px] text-slate-400">PIC</span>
          </div>
        </div>
      </div>
    </header>
  );
}
