export default function PicFooter() {
  return (
    <footer className="w-full border-t border-border-subtle bg-white py-4 px-4 md:px-8 mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-slate-400">
        <p>© 2026 Sistem Manajemen Layanan Internal. Ruang Kerja PIC Minimalis.</p>
        <div className="flex items-center gap-5">
          <a className="hover:text-slate-600 transition-colors" href="#">Privasi</a>
          <a className="hover:text-slate-600 transition-colors" href="#">Ketentuan</a>
          <a className="hover:text-slate-600 transition-colors" href="#">Status Sistem</a>
        </div>
      </div>
    </footer>
  );
}
