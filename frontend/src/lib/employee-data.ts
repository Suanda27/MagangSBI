// Data contoh (mock) untuk modul Karyawan.
// Strukturnya mengikuti endpoint PRD (/api/employee/permintaan) sehingga
// mudah diganti dengan data dari API Laravel nanti.

export type TicketStatus = "Diajukan" | "Diproses" | "Selesai" | "Ditolak";

export interface Ticket {
  id: string;
  title: string;
  section: string;
  category: string;
  service: string;
  plant: string;
  floor: string;
  status: TicketStatus;
  progress: number;
  pic: string;
  createdAt: string;
  updatedAt: string;
  description: string;
}

export const CURRENT_USER = {
  name: "Syifa Fitria Azizah",
  initials: "SF",
  role: "Karyawan",
  nik: "EMP-2023-0842",
  email: "syifa.fitria@sbi.co.id",
  phone: "+62 812 3456 7890",
  section: "Information Systems (IS)",
  position: "Staff Administrasi",
  manager: "Hendra Wijaya",
  joinDate: "15 Jan 2023",
  location: "Batam, Indonesia",
};

export const STATUS_STYLE: Record<TicketStatus, { badge: string; dot: string }> = {
  Diajukan: { badge: "bg-amber-50 text-amber-700 border-amber-100", dot: "bg-amber-500" },
  Diproses: { badge: "bg-blue-50 text-blue-700 border-blue-100", dot: "bg-blue-500" },
  Selesai: { badge: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500" },
  Ditolak: { badge: "bg-rose-50 text-rose-700 border-rose-100", dot: "bg-rose-500" },
};

export const TICKETS: Ticket[] = [
  {
    id: "REQ-2026-0042",
    title: "Permintaan Peralatan IT Baru",
    section: "Information Systems (IS)",
    category: "Peralatan & Perlengkapan",
    service: "Pengadaan Hardware IT",
    plant: "Plant 1",
    floor: "Lantai 2",
    status: "Diproses",
    progress: 60,
    pic: "Andi Pratama",
    createdAt: "12 Okt 2026, 10:00",
    updatedAt: "13 Okt 2026, 09:15",
    description:
      "Mohon pengadaan 1 unit laptop baru untuk karyawan baru di tim Marketing.\n\nSpesifikasi minimal: Intel Core i7 atau setara, RAM 16GB, SSD 512GB, layar 14 inch.\n\nMohon dapat diproses segera karena karyawan akan mulai bekerja minggu depan.",
  },
  {
    id: "REQ-2026-0041",
    title: "Perbaikan AC Ruang Meeting B",
    section: "General Affairs (GA)",
    category: "Fasilitas & Gedung",
    service: "Perbaikan AC",
    plant: "Plant 2",
    floor: "Lantai 3",
    status: "Diajukan",
    progress: 15,
    pic: "Belum ditugaskan",
    createdAt: "10 Okt 2026, 09:15",
    updatedAt: "10 Okt 2026, 09:15",
    description: "AC ruang meeting B bocor dan tidak dingin. Mohon dicek oleh teknisi GA.",
  },
  {
    id: "REQ-2026-0038",
    title: "Perbaikan Pneumatic Torque Wrench",
    section: "Assembly",
    category: "Maintenance & Perbaikan",
    service: "Perbaikan Peralatan",
    plant: "Plant 2",
    floor: "Lantai 3",
    status: "Selesai",
    progress: 100,
    pic: "Budi Santoso",
    createdAt: "05 Okt 2026, 16:45",
    updatedAt: "07 Okt 2026, 11:20",
    description: "Torque wrench pada stasiun kerja 4 Assembly Line 2 tidak stabil. Mohon kalibrasi dan perbaikan.",
  },
  {
    id: "REQ-2026-0035",
    title: "Pembaruan Data Personal",
    section: "Human Resource (HR)",
    category: "Administrasi Karyawan",
    service: "Pembaruan Data Personal",
    plant: "Plant 1",
    floor: "Lantai 1",
    status: "Ditolak",
    progress: 100,
    pic: "Rina Wulandari",
    createdAt: "01 Okt 2026, 11:00",
    updatedAt: "02 Okt 2026, 13:30",
    description: "Pembaruan alamat domisili karyawan. Ditolak karena dokumen pendukung belum dilampirkan.",
  },
  {
    id: "REQ-2026-0030",
    title: "Modifikasi Jig Produksi Line 3",
    section: "Production Engineering (PE)",
    category: "Modifikasi & Improvement",
    service: "Modifikasi Peralatan",
    plant: "Plant 1",
    floor: "Lantai 2",
    status: "Selesai",
    progress: 100,
    pic: "Doni Prasetyo",
    createdAt: "22 Sep 2026, 08:30",
    updatedAt: "28 Sep 2026, 15:00",
    description: "Penyesuaian jig agar sesuai dengan model produk baru di line 3.",
  },
];

export const getTicket = (id: string) => TICKETS.find((t) => t.id === id);

export const ACTIVITIES: Record<string, { title: string; by: string; at: string }[]> = {
  default: [
    { title: "Permintaan Sedang Diproses", by: "Oleh PIC", at: "13 Okt 2026, 09:15 WIB" },
    { title: "Permintaan Dialokasikan ke PIC", by: "Sistem Otomatis", at: "12 Okt 2026, 14:30 WIB" },
    { title: "Permintaan Dibuat", by: "Oleh Anda", at: "12 Okt 2026, 10:00 WIB" },
  ],
};

export interface HistoryItem {
  id: string;
  title: string;
  desc: string;
  status: "Selesai" | "Diproses" | "Ditolak" | "Dibuat";
  at: string;
}

export const HISTORY: HistoryItem[] = [
  { id: "REQ-2026-0038", title: "Perbaikan Pneumatic Torque Wrench Selesai", desc: "Teknisi telah menyelesaikan kalibrasi dan perbaikan unit torque wrench.", status: "Selesai", at: "07 Okt 2026, 11:20" },
  { id: "REQ-2026-0042", title: "Permintaan Peralatan IT Sedang Diproses", desc: "PIC IS sedang menyiapkan unit laptop sesuai spesifikasi yang diminta.", status: "Diproses", at: "13 Okt 2026, 09:15" },
  { id: "REQ-2026-0035", title: "Pembaruan Data Personal Ditolak", desc: "Ditolak oleh HR karena dokumen pendukung belum dilampirkan.", status: "Ditolak", at: "02 Okt 2026, 13:30" },
  { id: "REQ-2026-0041", title: "Perbaikan AC Ruang Meeting B Dibuat", desc: "Tiket baru telah dibuat dan menunggu penugasan PIC.", status: "Dibuat", at: "10 Okt 2026, 09:15" },
  { id: "REQ-2026-0030", title: "Modifikasi Jig Produksi Line 3 Selesai", desc: "Jig telah disesuaikan dan diserahterimakan ke tim produksi.", status: "Selesai", at: "28 Sep 2026, 15:00" },
];

export interface SectionConfig {
  slug: string;
  name: string;
  short: string;
  description: string;
  icon: "precision_manufacturing" | "groups" | "apartment" | "account_tree" | "computer";
  categories: { name: string; services: string[] }[];
}

export const SECTIONS: SectionConfig[] = [
  {
    slug: "pe",
    name: "Production Engineering (PE)",
    short: "PE",
    description: "Permintaan terkait dukungan teknis dan kebutuhan Production Engineering.",
    icon: "precision_manufacturing",
    categories: [
      { name: "Perbaikan & Pemeliharaan", services: ["Perbaikan Mesin", "Perbaikan Peralatan", "Pemeliharaan Berkala"] },
      { name: "Modifikasi & Improvement", services: ["Modifikasi Peralatan", "Usulan Improvement"] },
      { name: "Instalasi & Penyesuaian", services: ["Instalasi Mesin Baru", "Penyesuaian Line"] },
      { name: "Peralatan & Sparepart", services: ["Permintaan Sparepart", "Permintaan Peralatan"] },
      { name: "Dukungan Teknis", services: ["Konsultasi Teknis", "Analisis Masalah"] },
    ],
  },
  {
    slug: "hr",
    name: "Human Resource (HR)",
    short: "HR",
    description: "Permintaan terkait administrasi dan kebutuhan karyawan.",
    icon: "groups",
    categories: [
      { name: "Administrasi Karyawan", services: ["Perubahan Data Karyawan", "Permintaan Kartu Identitas Karyawan", "Pembaruan Data Personal"] },
      { name: "Dokumen & Surat", services: ["Surat Keterangan Kerja", "Surat Izin Dinas"] },
      { name: "Magang & Praktik Kerja", services: ["Pengajuan Magang", "Perpanjangan Magang"] },
      { name: "Konsultasi Kepegawaian", services: ["Konsultasi Kepegawaian"] },
    ],
  },
  {
    slug: "ga",
    name: "General Affairs (GA)",
    short: "GA",
    description: "Permintaan terkait fasilitas, lingkungan kerja, dan layanan umum.",
    icon: "apartment",
    categories: [
      { name: "Fasilitas & Gedung", services: ["Perbaikan AC", "Perbaikan Lampu", "Perbaikan Pintu/Jendela", "Perbaikan Toilet", "Perbaikan Fasilitas Ruangan", "Pelaporan Kerusakan Fasilitas"] },
      { name: "Perlengkapan & Inventaris", services: ["Permintaan Inventaris", "Penggantian Inventaris"] },
      { name: "Atribut Karyawan", services: ["Seragam", "Atribut Keselamatan"] },
      { name: "Kebersihan & Lingkungan", services: ["Permintaan Kebersihan", "Pengelolaan Limbah"] },
      { name: "Transportasi & Kendaraan", services: ["Permintaan Kendaraan", "Antar Jemput"] },
      { name: "Logistik & Kebutuhan Umum", services: ["Kebutuhan Umum Kantor"] },
    ],
  },
  {
    slug: "assembly",
    name: "Assembly",
    short: "Assembly",
    description: "Permintaan terkait kebutuhan dan dukungan area Assembly.",
    icon: "account_tree",
    categories: [
      { name: "Peralatan & Perlengkapan", services: ["Permintaan Peralatan Kerja", "Penggantian Peralatan", "Perbaikan Peralatan", "Permintaan Perlengkapan Pendukung"] },
      { name: "Fasilitas Area", services: ["Perbaikan Fasilitas Area", "Penataan Area Kerja"] },
      { name: "Maintenance & Perbaikan", services: ["Maintenance Peralatan", "Perbaikan Darurat"] },
      { name: "Material & Komponen Pendukung", services: ["Permintaan Material", "Permintaan Komponen"] },
      { name: "Improvement", services: ["Usulan Improvement"] },
      { name: "Pelaporan Masalah", services: ["Pelaporan Masalah Produksi"] },
    ],
  },
  {
    slug: "is",
    name: "Information Systems (IS)",
    short: "IS",
    description: "Permintaan terkait perangkat, jaringan, dan sistem informasi.",
    icon: "computer",
    categories: [
      { name: "Perangkat & Hardware", services: ["Pengadaan Hardware IT", "Perbaikan Perangkat"] },
      { name: "Akses & Akun", services: ["Akses VPN", "Reset Akun", "Akses Sistem ERP"] },
      { name: "Jaringan & Infrastruktur", services: ["Gangguan Jaringan", "Instalasi Jaringan"] },
      { name: "Aplikasi & Lisensi", services: ["Permintaan Lisensi Software", "Dukungan Aplikasi"] },
    ],
  },
];

export const getSection = (slug: string) => SECTIONS.find((s) => s.slug === slug);

export const PLANTS = ["Plant 1", "Plant 2", "Plant 3"];
export const FLOORS = ["Lantai 1", "Lantai 2", "Lantai 3"];
