import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Inbox, 
  Hourglass, 
  CheckCircle2, 
  BarChart3, 
  HelpCircle, 
  User,
  Menu
} from "lucide-react";

interface PicSidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function PicSidebar({ isOpen, setIsOpen }: PicSidebarProps) {
  const pathname = usePathname();

  const getLinkClass = (path: string, hasBadge: boolean = false) => {
    const isActive = pathname === path;
    const baseClass = hasBadge ? "flex items-center justify-between" : "flex items-center gap-2.5";
    return `${baseClass} px-2.5 py-1.5 rounded-md transition-colors group ${
      isActive 
        ? "font-medium text-blue-700 bg-blue-50" 
        : "font-normal text-slate-600 hover:text-blue-700 hover:bg-blue-50/60"
    }`;
  };

  const getIconClass = (path: string) => {
    const isActive = pathname === path;
    return `w-[18px] h-[18px] transition-colors ${
      isActive ? "text-blue-700" : "text-slate-400 group-hover:text-blue-700"
    }`;
  };

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-60 bg-[#fafbfe] border-r border-border-subtle z-50 flex flex-col justify-between select-none transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex flex-col">
          {/* App Brand */}
          <div className="relative h-20 flex items-center justify-start pl-3 pr-4 border-b border-border-subtle/70 bg-white">
            <img alt="Logo SBI" className="h-12 w-auto object-contain drop-shadow-sm -ml-1" src="/LOGOSBI.PNG" />
            <button className="md:hidden absolute right-4 text-slate-400 hover:text-slate-600 bg-slate-50 p-1 rounded-md transition-colors" onClick={() => setIsOpen(false)}>
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Main Navigation */}
          <nav className="flex flex-col gap-0.5 px-3 py-4 text-[13px]">
            <Link href="/pic/dashboard" className={getLinkClass('/pic/dashboard')}>
              <LayoutDashboard className={getIconClass('/pic/dashboard')} />
              <span>Dashboard</span>
            </Link>
            <Link href="/pic/permintaan-masuk" className={getLinkClass('/pic/permintaan-masuk', true)}>
              <div className="flex items-center gap-2.5">
                <Inbox className={getIconClass('/pic/permintaan-masuk')} />
                <span>Permintaan Masuk</span>
              </div>
              <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded transition-colors ${pathname === '/pic/permintaan-masuk' ? 'bg-blue-600 text-white' : 'text-slate-500 bg-slate-200/60 group-hover:bg-blue-100 group-hover:text-blue-700'}`}>8</span>
            </Link>
            <Link href="#" className={getLinkClass('#')}>
              <Hourglass className={getIconClass('#')} />
              <span>Sedang Diproses</span>
            </Link>
            <Link href="#" className={getLinkClass('#')}>
              <CheckCircle2 className={getIconClass('#')} />
              <span>Selesai</span>
            </Link>
            <Link href="#" className={getLinkClass('#')}>
              <BarChart3 className={getIconClass('#')} />
              <span>Laporan</span>
            </Link>
          </nav>
        </div>

        {/* Bottom Sidebar Section */}
        <div className="p-3 border-t border-border-subtle/70 flex flex-col gap-1 text-[13px]">
          <Link href="#" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md font-normal text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 transition-colors">
            <HelpCircle className="w-[18px] h-[18px] text-slate-400" />
            <span>Bantuan & Panduan</span>
          </Link>
          <Link href="#" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md font-normal text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 transition-colors">
            <User className="w-[18px] h-[18px] text-slate-400" />
            <span>Profil & Pengaturan</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
