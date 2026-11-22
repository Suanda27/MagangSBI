// Data contoh (mock) untuk modul Supervisor (read-only).
// Strukturnya mengikuti endpoint PRD:
//   GET /api/supervisor/dashboard
//   GET /api/supervisor/permintaan?section=&status=&tanggal=
//   GET /api/supervisor/permintaan/{id}
//   GET /api/supervisor/laporan?periode=

export type SupStatus = "Baru" | "Diproses" | "Pending" | "Selesai" | "Ditolak";

export interface SupTicket {
  id: string;
  title: string;
  service: string;
  category: string;
  section: string;
  requester: string;
  requesterNik: string;
  pic: string | null;
  status: SupStatus;
  date: string;
  time: string;
  updated: string;
  location: string;
  description: string;
  slaTarget: string;
  slaOk: boolean;
}

export const SUPERVISOR = {
  name: "Hendra Gunawan",
  initials: "HG",
  role: "Supervisor",
  nik: "19880412 201201 1 003",
  email: "hendra.gunawan@company.com",
  phone: "+62 811 2233 4455",
  section: "Quality & Operations",
  unit: "Unit Pengawasan Terpadu",
  joined: "15 Januari 2021",
};

export const SUP_STATUS_STYLE: Record<SupStatus, { badge: string; dot: string; bar: string }> = {
  Baru: { badge: "bg-sky-50 text-sky-700 border-sky-100", dot: "bg-sky-500", bar: "#0ea5e9" },
  Diproses: { badge: "bg-blue-50 text-blue-700 border-blue-100", dot: "bg-blue-500", bar: "#2563eb" },
  Pending: { badge: "bg-amber-50 text-amber-700 border-amber-100", dot: "bg-amber-500", bar: "#f59e0b" },
  Selesai: { badge: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500", bar: "#10b981" },
  Ditolak: { badge: "bg-rose-50 text-rose-700 border-rose-100", dot: "bg-rose-500", bar: "#f43f5e" },
};

export const SUP_SECTIONS = ["Assembly", "GA", "HR", "PE", "IS"];
export const SUP_STATUSES: SupStatus[] = ["Baru", "Diproses", "Pending", "Selesai", "Ditolak"];
export const SUP_PICS = ["Andi Pratama", "Budi Santoso", "Fajar Nugraha", "Siti Rahma", "Doni Prasetyo", "Rina Wulandari"];

export const SUP_TICKETS: SupTicket[] = [
  {
    id: "REQ-2026-001", title: "Perbaikan AC Ruang Server", service: "Perbaikan AC", category: "Fasilitas & Gedung",
    section: "Assembly", requester: "Muhammad Faiz", requesterNik: "12345678", pic: "Andi Pratama", status: "Diproses",
    date: "24 Agu 2026", time: "08:30", updated: "15 menit lalu", location: "Plant 1 • Lantai 2 (Ruang Server Utama)",
    description: "Suhu pendingin AC di ruang kontrol server dan lini perakitan mengalami kenaikan mendadak dari 19°C menjadi 27°C sejak pagi ini. Indikasi kebocoran freon atau gangguan kompresor perlu penanganan segera untuk mencegah server overheat.",
    slaTarget: "25 Agu 2026 (24 Jam)", slaOk: true,
  },
  {
    id: "REQ-2026-002", title: "Kalibrasi Sensor PLC Line 2", service: "Pemeliharaan Mesin", category: "Perbaikan & Pemeliharaan",
    section: "PE", requester: "Rizky Pratama", requesterNik: "45112", pic: null, status: "Baru",
    date: "24 Agu 2026", time: "09:15", updated: "45 menit lalu", location: "Plant 2 • Lantai 1 (Line 2 Sub-assembly)",
    description: "Sensor PLC pada conveyor line 2 menunjukkan pembacaan tidak stabil dan memicu henti darurat berulang. Mohon kalibrasi ulang.",
    slaTarget: "26 Agu 2026 (48 Jam)", slaOk: true,
  },
  {
    id: "REQ-2026-003", title: "Penggantian Lampu Line 4", service: "Fasilitas Listrik", category: "Fasilitas & Gedung",
    section: "Assembly", requester: "Siti Rahma", requesterNik: "42908", pic: "Doni Prasetyo", status: "Selesai",
    date: "23 Agu 2026", time: "14:10", updated: "1 hari lalu", location: "Plant 2 • Lantai 3 (Line 4)",
    description: "Beberapa lampu LED di line 4 mati dan mengganggu pencahayaan area kerja.",
    slaTarget: "24 Agu 2026 (24 Jam)", slaOk: true,
  },
  {
    id: "REQ-2026-004", title: "Akses VPN & Akun ERP SAP", service: "Dukungan TI & Sistem", category: "Akses & Akun",
    section: "GA", requester: "Dina Oktaviani", requesterNik: "46021", pic: "Fajar Nugraha", status: "Pending",
    date: "23 Agu 2026", time: "11:20", updated: "3 jam lalu", location: "Plant 1 • Lantai 1 (Kantor GA)",
    description: "Permintaan akses VPN dan akun ERP SAP modul PP untuk karyawan baru. Menunggu persetujuan lisensi dari vendor.",
    slaTarget: "27 Agu 2026 (72 Jam)", slaOk: true,
  },
  {
    id: "REQ-2026-005", title: "Pembersihan Tumpahan Oli Mesin", service: "Keselamatan & K3", category: "Kebersihan & Lingkungan",
    section: "Assembly", requester: "Agus Hidayat", requesterNik: "43377", pic: "Budi Santoso", status: "Diproses",
    date: "24 Agu 2026", time: "10:05", updated: "30 menit lalu", location: "Plant 3 • Lantai 1 (Area Press)",
    description: "Tumpahan oli hidrolik di area mesin press berpotensi menyebabkan kecelakaan kerja. Mohon pembersihan dan pengecekan kebocoran.",
    slaTarget: "24 Agu 2026 (8 Jam)", slaOk: false,
  },
  {
    id: "REQ-2026-006", title: "Pengadaan Filter Udara HEPA", service: "Pengadaan Fasilitas", category: "Perlengkapan & Inventaris",
    section: "HR", requester: "Wahyu Ningrum", requesterNik: "41820", pic: "Rina Wulandari", status: "Ditolak",
    date: "22 Agu 2026", time: "16:45", updated: "Kemarin, 16:45", location: "Plant 1 • Lantai 2 (Klinik)",
    description: "Pengadaan filter udara HEPA untuk ruang klinik. Ditolak karena dokumen otorisasi belum valid.",
    slaTarget: "25 Agu 2026 (72 Jam)", slaOk: true,
  },
  {
    id: "REQ-2026-007", title: "Instalasi Jaringan Kantor Baru", service: "Pemasangan Jaringan", category: "Jaringan & Infrastruktur",
    section: "IS", requester: "Bayu Saputra", requesterNik: "44805", pic: "Fajar Nugraha", status: "Diproses",
    date: "22 Agu 2026", time: "09:00", updated: "2 jam lalu", location: "Plant 2 • Lantai 2 (Kantor Baru)",
    description: "Instalasi titik jaringan dan access point untuk ruang kantor baru di lantai 2.",
    slaTarget: "28 Agu 2026 (5 Hari)", slaOk: true,
  },
  {
    id: "REQ-2026-008", title: "Servis Forklift Unit 3", service: "Servis Forklift", category: "Perbaikan & Pemeliharaan",
    section: "PE", requester: "Hendro Wibowo", requesterNik: "40192", pic: "Andi Pratama", status: "Diproses",
    date: "21 Agu 2026", time: "13:40", updated: "5 jam lalu", location: "Plant 3 • Gudang",
    description: "Forklift unit 3 mengalami penurunan daya angkat. Melewati estimasi awal SLA karena menunggu suku cadang.",
    slaTarget: "23 Agu 2026 (48 Jam)", slaOk: false,
  },
  {
    id: "REQ-2026-009", title: "Surat Keterangan Kerja", service: "Dokumen & Surat", category: "Dokumen & Surat",
    section: "HR", requester: "Maya Anggraini", requesterNik: "47218", pic: "Rina Wulandari", status: "Selesai",
    date: "21 Agu 2026", time: "08:10", updated: "2 hari lalu", location: "Plant 1 • Lantai 1 (HR)",
    description: "Permintaan surat keterangan kerja untuk keperluan pengajuan visa.",
    slaTarget: "23 Agu 2026 (48 Jam)", slaOk: true,
  },
  {
    id: "REQ-2026-010", title: "Perbaikan Pintu Gudang Material", service: "Perbaikan Pintu/Jendela", category: "Fasilitas & Gedung",
    section: "GA", requester: "Joko Susilo", requesterNik: "43901", pic: "Siti Rahma", status: "Baru",
    date: "24 Agu 2026", time: "10:40", updated: "20 menit lalu", location: "Plant 3 • Lantai 1 (Gudang Material)",
    description: "Engsel pintu gudang material patah sehingga pintu tidak dapat menutup rapat.",
    slaTarget: "26 Agu 2026 (48 Jam)", slaOk: true,
  },
  {
    id: "REQ-2026-011", title: "Reset Akun Sistem Absensi", service: "Dukungan TI & Sistem", category: "Akses & Akun",
    section: "IS", requester: "Lina Marlina", requesterNik: "45530", pic: "Fajar Nugraha", status: "Selesai",
    date: "20 Agu 2026", time: "15:25", updated: "3 hari lalu", location: "Plant 2 • Lantai 1",
    description: "Akun sistem absensi terkunci setelah beberapa kali percobaan masuk gagal.",
    slaTarget: "21 Agu 2026 (24 Jam)", slaOk: true,
  },
  {
    id: "REQ-2026-012", title: "Pengadaan Tooling Torque Wrench", service: "Pengadaan Logistik Teknis", category: "Peralatan & Perlengkapan",
    section: "Assembly", requester: "Dedi Anwar", requesterNik: "44091", pic: "Budi Santoso", status: "Pending",
    date: "20 Agu 2026", time: "11:00", updated: "1 hari lalu", location: "Plant 2 • Lantai 3 (Assembly Line 2)",
    description: "Pengadaan 4 unit torque wrench baru. Menunggu konfirmasi ketersediaan dari vendor.",
    slaTarget: "27 Agu 2026 (5 Hari)", slaOk: true,
  },
];

export const getSupTicket = (id: string) => SUP_TICKETS.find((t) => t.id === id);

export const SUP_ACTIVITY = [
  { icon: "add", tone: "bg-sky-50 text-sky-600", text: "Permintaan baru masuk diajukan oleh Rizky Pratama (PE)", id: "REQ-2026-002", when: "15 menit lalu" },
  { icon: "play", tone: "bg-blue-50 text-blue-600", text: "Permintaan mulai diproses oleh teknisi Andi Pratama (PIC GA)", id: "REQ-2026-001", when: "45 menit lalu" },
  { icon: "check", tone: "bg-emerald-50 text-emerald-600", text: "Permintaan selesai ditangani oleh Budi Santoso (PIC Assembly)", id: "REQ-2026-003", when: "2 jam lalu" },
  { icon: "pause", tone: "bg-amber-50 text-amber-600", text: "Permintaan berstatus pending menunggu suku cadang dari vendor", id: "REQ-2026-004", when: "3 jam lalu" },
  { icon: "alert", tone: "bg-orange-50 text-orange-600", text: "Permintaan melewati batas waktu estimasi awal SLA", id: "REQ-2026-008", when: "5 jam lalu" },
  { icon: "close", tone: "bg-rose-50 text-rose-600", text: "Permintaan ditolak karena dokumen otorisasi belum valid", id: "REQ-2026-006", when: "Kemarin, 16:45" },
] as const;

export const DETAIL_TIMELINE = [
  { title: "Permintaan Dibuat", at: "24 Agu, 08:30 WIB", note: "Oleh pemohon (Karyawan). Tiket berhasil dikirim ke sistem." },
  { title: "Dialokasikan ke PIC", at: "24 Agu, 09:05 WIB", note: "Sistem menugaskan tiket ke PIC sesuai section layanan." },
  { title: "PIC Menerima Tiket", at: "24 Agu, 09:10 WIB", note: "PIC mengonfirmasi dan mulai menelaah permintaan." },
  { title: "Sedang Diproses", at: "24 Agu, 09:40 WIB", note: "Teknisi melakukan pengecekan di lokasi." },
];

// Statistik laporan periode "Agustus 2026"
export const REPORT = {
  period: "Agustus 2026",
  total: 186,
  slaCompliance: 92.4,
  slaOk: 172,
  slaLate: 14,
  avgResolution: "4.2 Jam",
  status: [
    { label: "Selesai", value: 128, color: "#10b981" },
    { label: "Diproses", value: 31, color: "#2563eb" },
    { label: "Pending", value: 14, color: "#f59e0b" },
    { label: "Baru", value: 8, color: "#0ea5e9" },
    { label: "Ditolak", value: 5, color: "#f43f5e" },
  ],
  perSection: [
    { label: "Assembly", value: 62 },
    { label: "PE", value: 44 },
    { label: "GA", value: 37 },
    { label: "IS", value: 24 },
    { label: "HR", value: 19 },
  ],
  trend: [
    { label: "Mgg 1", masuk: 38, selesai: 30 },
    { label: "Mgg 2", masuk: 46, selesai: 41 },
    { label: "Mgg 3", masuk: 52, selesai: 44 },
    { label: "Mgg 4", masuk: 50, selesai: 13 },
  ],
  perService: [
    { service: "Perbaikan AC", section: "GA", total: 34, selesai: 26, avg: "5.1 Jam" },
    { service: "Kalibrasi Sensor", section: "PE", total: 29, selesai: 21, avg: "6.3 Jam" },
    { service: "Permintaan Tooling", section: "Assembly", total: 41, selesai: 30, avg: "7.8 Jam" },
    { service: "Pemasangan Jaringan", section: "IS", total: 24, selesai: 19, avg: "3.4 Jam" },
    { service: "Servis Forklift", section: "PE", total: 18, selesai: 12, avg: "9.2 Jam" },
    { service: "Dokumen & Surat", section: "HR", total: 19, selesai: 17, avg: "2.0 Jam" },
  ],
};
