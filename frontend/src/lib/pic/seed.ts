import type { Lampiran, Permintaan, Pengaju, Prioritas, RiwayatItem, StatusPermintaan } from "./types";

/** PIC contoh: section Information System, sehingga nomor tiket berawalan IS-. */
const PIC = "Budi Santoso";

const orang: Record<string, Pengaju> = {
  faiz: { nama: "Muhammad Faiz", nik: "22010456", email: "faiz.suanda@sbi.co.id", telepon: "+62 812-3456-7890", jabatan: "Senior Assembly Specialist", bagian: "ASM" },
  siti: { nama: "Siti Rahmawati", nik: "22010512", email: "siti.rahmawati@sbi.co.id", telepon: "+62 813-2211-0045", jabatan: "Process Engineer", bagian: "PE" },
  dimas: { nama: "Dimas Anggara", nik: "22010204", email: "dimas.anggara@sbi.co.id", telepon: "+62 821-9087-3312", jabatan: "Supervisor IS", bagian: "IS" },
  kevin: { nama: "Kevin Tandio", nik: "22010389", email: "kevin.tandio@sbi.co.id", telepon: "+62 811-7765-2290", jabatan: "Line Leader", bagian: "ASM" },
  hendra: { nama: "Hendra Gunawan", nik: "22010115", email: "hendra.gunawan@sbi.co.id", telepon: "+62 857-4410-8821", jabatan: "Maintenance Technician", bagian: "PE" },
  dewi: { nama: "Dewi Sartika", nik: "22010642", email: "dewi.sartika@sbi.co.id", telepon: "+62 812-0099-1745", jabatan: "GA Staff", bagian: "GA" },
  rian: { nama: "Rian Triadi", nik: "22010733", email: "rian.triadi@sbi.co.id", telepon: "+62 878-1234-6650", jabatan: "Quality Engineer", bagian: "PE" },
  bagus: { nama: "Bagus Santiko", nik: "22010298", email: "bagus.santiko@sbi.co.id", telepon: "+62 852-3321-7708", jabatan: "Operator Senior", bagian: "ASM" },
  maya: { nama: "Maya Lestari", nik: "22010871", email: "maya.lestari@sbi.co.id", telepon: "+62 813-5567-0912", jabatan: "HR Officer", bagian: "HR" },
  agus: { nama: "Agus Kurnia", nik: "22010427", email: "agus.kurnia@sbi.co.id", telepon: "+62 822-6650-4417", jabatan: "Tooling Staff", bagian: "ASM" },
};

let seq = 0;
const lamp = (nama: string, ukuranKb: number, oleh: "pengaju" | "pic" = "pengaju"): Lampiran => ({
  id: `lmp-${++seq}`,
  nama,
  ukuran: ukuranKb * 1024,
  tipe: /\.(jpe?g|png)$/i.test(nama) ? "gambar" : "dokumen",
  oleh,
});

const rw = (waktu: string, judul: string, keterangan: string, oleh: string, status: RiwayatItem["status"]): RiwayatItem => ({
  id: `rw-${++seq}`,
  waktu,
  judul,
  keterangan,
  oleh,
  status,
});

/** Susun riwayat standar sesuai status akhir permintaan. */
function riwayatDasar(p: { diajukan: string; pengaju: Pengaju; terima?: string; selesai?: string; kirim?: string; revisi?: { waktu: string; alasan: string }; tolak?: { waktu: string; alasan: string }; pending?: { waktu: string; alasan: string }; catatanSelesai?: string }): RiwayatItem[] {
  const out: RiwayatItem[] = [
    rw(p.diajukan, "Permintaan Dibuat", `Diajukan oleh ${p.pengaju.nama} (${p.pengaju.bagian}).`, p.pengaju.nama, "dibuat"),
    rw(p.diajukan, "Dialokasikan ke Antrean PIC", "Sistem meneruskan tiket ke antrean PIC IT & Automation.", "Sistem", "dialokasikan"),
  ];
  if (p.terima) out.push(rw(p.terima, "Permintaan Diterima", `Diterima oleh ${PIC}. Status berubah menjadi Sedang Diproses.`, PIC, "diproses"));
  if (p.pending) out.push(rw(p.pending.waktu, "Pengerjaan Ditunda (Pending)", p.pending.alasan, PIC, "pending"));
  const kirim = p.kirim ?? (p.selesai ? new Date(new Date(p.selesai).getTime() - 3600_000).toISOString() : undefined);
  if (kirim) out.push(rw(kirim, "Hasil Dikirim untuk Ditinjau", p.catatanSelesai ?? "Hasil pengerjaan telah diunggah, menunggu konfirmasi pengaju.", PIC, "menunggu_konfirmasi"));
  if (p.revisi) out.push(rw(p.revisi.waktu, "Revisi Diminta", p.revisi.alasan, p.pengaju.nama, "revisi"));
  if (p.selesai) out.push(rw(p.selesai, "Permintaan Selesai", `Hasil pengerjaan disetujui oleh ${p.pengaju.nama}.`, p.pengaju.nama, "selesai"));
  if (p.tolak) out.push(rw(p.tolak.waktu, "Permintaan Ditolak", p.tolak.alasan, PIC, "ditolak"));
  return out;
}

interface Dasar {
  id: string;
  judul: string;
  deskripsi: string;
  layanan: string;
  kategori: string;
  pengaju: Pengaju;
  plant: string;
  lantai: string;
  lokasiDetail: string;
  diajukan: string;
  prioritas: Prioritas;
  status: StatusPermintaan;
  lampiran?: Lampiran[];
  terima?: string;
  selesai?: string;
  kirim?: string;
  revisi?: { waktu: string; alasan: string };
  jumlahRevisi?: number;
  catatanSelesai?: string;
  bukti?: Lampiran[];
  tolak?: { waktu: string; alasan: string };
  pending?: { waktu: string; alasan: string };
}

const WIB = "+07:00";
const t = (d: string, jam: string) => `2026-${d}T${jam}:00${WIB}`;

function bangun(d: Dasar): Permintaan {
  return {
    id: d.id,
    judul: d.judul,
    deskripsi: d.deskripsi,
    layanan: d.layanan,
    kategori: d.kategori,
    pengaju: d.pengaju,
    plant: d.plant,
    lantai: d.lantai,
    lokasiDetail: d.lokasiDetail,
    diajukan: d.diajukan,
    prioritas: d.prioritas,
    status: d.status,
    lampiran: d.lampiran ?? [],
    riwayat: riwayatDasar({ diajukan: d.diajukan, pengaju: d.pengaju, terima: d.terima, selesai: d.selesai, kirim: d.kirim, revisi: d.revisi, tolak: d.tolak, pending: d.pending, catatanSelesai: d.catatanSelesai }),
    diterimaPada: d.terima,
    dikirimPada: d.kirim ?? (d.selesai ? new Date(new Date(d.selesai).getTime() - 3600_000).toISOString() : undefined),
    selesaiPada: d.selesai,
    jumlahRevisi: d.jumlahRevisi ?? (d.revisi ? 1 : 0),
    alasanRevisi: d.status === "diproses" ? d.revisi?.alasan : undefined,
    ditolakPada: d.tolak?.waktu,
    alasanTolak: d.tolak?.alasan,
    alasanPending: d.pending?.alasan,
    catatanSelesai: d.catatanSelesai,
    buktiSelesai: d.bukti,
  };
}


export const SEED_PERMINTAAN: Permintaan[] = [
  // ----- Menunggu pemeriksaan -----
  bangun({
    id: "IS-2026-0041", judul: "Sensor PLC Conveyor Rusak", layanan: "Perbaikan Aset", kategori: "Peralatan & Otomasi", pengaju: orang.faiz,
    deskripsi: "Sensor proximity PLC pada jalur konveyor utama stasiun 3 perakitan terdeteksi intermittent error dan sering berhenti mendadak sejak pagi ini pukul 08:00 WIB. Akibatnya jalur perakitan mengalami hambatan laju produksi.\n\nMohon bantuan PIC teknis untuk segera melakukan pemeriksaan modul sensor, wiring junction box, dan kalibrasi ulang controller agar jalur produksi dapat beroperasi normal kembali.",
    plant: "Plant 2", lantai: "Lantai 1", lokasiDetail: "Stasiun 3, Feeder Conveyor Arm #4", diajukan: t("11-17", "08:24"), prioritas: "Mendesak", status: "menunggu",
    lampiran: [lamp("Sensor_Error_Log.pdf", 1240), lamp("Foto_Stasiun_3.jpg", 3480)],
  }),
  bangun({
    id: "IS-2026-0042", judul: "Kenaikan Otoritas SAP Produksi", layanan: "Akses Sistem", kategori: "Dukungan IT", pengaju: orang.siti,
    deskripsi: "Mohon penambahan otorisasi modul MM dan PP pada akun SAP untuk keperluan monitoring order produksi shift pagi. Persetujuan atasan terlampir.",
    plant: "Plant 1", lantai: "Lantai 2", lokasiDetail: "Ruang Process Engineering", diajukan: t("11-17", "08:45"), prioritas: "Normal", status: "menunggu",
    lampiran: [lamp("Form_Persetujuan_Atasan.pdf", 410)],
  }),
  bangun({
    id: "IS-2026-0043", judul: "Penggantian Laptop CAD Engineering", layanan: "Dukungan IT", kategori: "Perangkat Keras", pengaju: orang.dimas,
    deskripsi: "Laptop CAD lama sering hang saat membuka assembly drawing berukuran besar dan baterai tidak bertahan lebih dari 20 menit. Mohon penggantian unit dengan spesifikasi workstation.",
    plant: "Plant 1", lantai: "Lantai 3", lokasiDetail: "Ruang IS, Meja 12", diajukan: t("11-16", "16:10"), prioritas: "Normal", status: "menunggu",
    lampiran: [lamp("Spesifikasi_Laptop_Lama.png", 220)],
  }),
  bangun({
    id: "IS-2026-0044", judul: "Kalibrasi Controller Mesin Press", layanan: "Otomasi Industri", kategori: "Peralatan & Otomasi", pengaju: orang.hendra,
    deskripsi: "Deviasi tekanan pada mesin press hidrolik lebih dari 8 bar pada siklus produksi pagi. Dibutuhkan kalibrasi ulang controller dan pengecekan transducer.",
    plant: "Plant 1", lantai: "Lantai 1", lokasiDetail: "Area Press Line 2", diajukan: t("11-17", "07:50"), prioritas: "Tinggi", status: "menunggu",
    lampiran: [lamp("Grafik_Tekanan.png", 640)],
  }),
  bangun({
    id: "IS-2026-0045", judul: "Instalasi Driver Printer Label Line B", layanan: "Dukungan Perangkat Lunak", kategori: "Dukungan IT", pengaju: orang.kevin,
    deskripsi: "Printer label barcode di Line B tidak terdeteksi setelah update Windows. Mohon bantuan instalasi ulang driver dan pengaturan port.",
    plant: "Plant 2", lantai: "Lantai 1", lokasiDetail: "Line B, Meja Packing", diajukan: t("11-16", "13:30"), prioritas: "Tinggi", status: "menunggu",
  }),

  // ----- Sedang diproses -----
  bangun({
    id: "IS-2026-0031", judul: "Penambahan Switch Jaringan Gudang", layanan: "Jaringan & Komunikasi", kategori: "Infrastruktur", pengaju: orang.dewi,
    deskripsi: "Titik jaringan di area gudang penerimaan barang tidak mencukupi. Dibutuhkan penambahan switch 24 port beserta pengkabelan ke rak utama.",
    plant: "Plant 2", lantai: "Lantai 2", lokasiDetail: "Gudang Penerimaan, Rak Jaringan B", diajukan: t("11-14", "09:10"), prioritas: "Normal", status: "diproses", terima: t("11-14", "10:00"),
    lampiran: [lamp("Denah_Gudang.pdf", 980)],
  }),
  bangun({
    id: "IS-2026-0035", judul: "Perbaikan AC Ruang Server Lantai 3", layanan: "Perbaikan Fasilitas", kategori: "Fasilitas & Gedung", pengaju: orang.rian,
    deskripsi: "Unit AC ruang server mengeluarkan tetesan air dan suhu ruangan naik di atas 28°C. Perlu pemeriksaan segera agar perangkat tidak overheat.",
    plant: "Plant 1", lantai: "Lantai 3", lokasiDetail: "Ruang Server", diajukan: t("11-15", "14:20"), prioritas: "Mendesak", status: "diproses", terima: t("11-15", "14:45"),
    lampiran: [lamp("Foto_AC_Bocor.jpg", 2750)],
  }),
  bangun({
    id: "IS-2026-0038", judul: "Perbaikan Sensor Barcode Gate Out", layanan: "Perbaikan Aset", kategori: "Peralatan & Otomasi", pengaju: orang.bagus,
    deskripsi: "Scanner barcode pada gate out sering gagal membaca label pallet. Mohon pemeriksaan scanner dan pengaturan decoding.",
    plant: "Plant 1", lantai: "Bay 4", lokasiDetail: "Gate Out Bay 4", diajukan: t("11-13", "11:05"), prioritas: "Normal", status: "diproses", terima: t("11-13", "13:00"),
  }),
  bangun({
    id: "IS-2026-0029", judul: "Pengadaan Kartu Akses Gedung Baru", layanan: "Keamanan Fisik", kategori: "Akses & Keamanan", pengaju: orang.maya,
    deskripsi: "Tiga karyawan baru membutuhkan kartu akses ke area produksi dan ruang IS. Data karyawan terlampir.",
    plant: "Plant 2", lantai: "Lantai 1", lokasiDetail: "Lobi Utama", diajukan: t("11-12", "10:15"), prioritas: "Normal", status: "pending", terima: t("11-12", "11:00"),
    pending: { waktu: t("11-14", "15:30"), alasan: "Menunggu pengiriman blanko kartu dari vendor (estimasi tiba 20 Nov 2026)." },
    lampiran: [lamp("Data_Karyawan_Baru.pdf", 150)],
  }),

  // ----- Menunggu konfirmasi karyawan (hasil sudah dikirim PIC) -----
  bangun({
    id: "IS-2026-0033", judul: "Reset Akun VPN Tim Maintenance", layanan: "Akses Sistem", kategori: "Dukungan IT", pengaju: orang.hendra,
    deskripsi: "Akun VPN tim maintenance terkunci setelah pergantian kata sandi berkala. Mohon reset akun dan pastikan akses ke server file kembali normal.",
    plant: "Plant 1", lantai: "Lantai 2", lokasiDetail: "Ruang Maintenance", diajukan: t("11-18", "08:10"), prioritas: "Tinggi", status: "menunggu_konfirmasi", terima: t("11-18", "08:40"),
    kirim: t("11-19", "09:30"), catatanSelesai: "Akun VPN direset dan diuji dari jaringan luar. Mohon konfirmasi apakah akses sudah normal.",
    bukti: [lamp("Uji_Koneksi_VPN.png", 540, "pic")],
  }),

  // ----- Dikerjakan ulang setelah revisi -----
  bangun({
    id: "IS-2026-0036", judul: "Pemasangan Access Point Ruang Meeting", layanan: "Jaringan & Komunikasi", kategori: "Infrastruktur", pengaju: orang.dewi,
    deskripsi: "Sinyal Wi-Fi di ruang meeting lantai 2 lemah. Mohon pemasangan access point tambahan.",
    plant: "Plant 2", lantai: "Lantai 2", lokasiDetail: "Ruang Meeting 2B", diajukan: t("11-17", "10:00"), prioritas: "Normal", status: "diproses", terima: t("11-17", "10:30"),
    kirim: t("11-18", "14:00"), revisi: { waktu: t("11-19", "08:45"), alasan: "Sinyal sudah muncul, tetapi masih putus-putus di sisi jendela. Mohon posisi access point disesuaikan." },
    catatanSelesai: "Access point dipasang di langit-langit dekat pintu.",
  }),

  // ----- Selesai -----
  bangun({
    id: "IS-2026-0024", judul: "Penggantian Kartu Akses Area Assembly", layanan: "Keamanan Fisik", kategori: "Akses & Keamanan", pengaju: orang.kevin,
    deskripsi: "Kartu akses area assembly milik line leader rusak dan tidak terbaca pada reader pintu utama.",
    plant: "Plant 2", lantai: "Lantai 1", lokasiDetail: "Pintu Utama Assembly", diajukan: t("11-10", "08:30"), prioritas: "Normal", status: "selesai", terima: t("11-10", "09:00"),
    selesai: t("11-10", "11:40"), catatanSelesai: "Kartu diganti baru dan sudah diaktivasi di semua reader area assembly.",
    bukti: [lamp("Kartu_Aktif.jpg", 1320, "pic")],
  }),
  bangun({
    id: "IS-2026-0027", judul: "Kalibrasi Controller Packing", layanan: "Otomasi Industri", kategori: "Peralatan & Otomasi", pengaju: orang.hendra,
    deskripsi: "Controller packing line 1 menunjukkan deviasi waktu siklus. Perlu kalibrasi ulang parameter timer.",
    plant: "Plant 1", lantai: "Lantai 1", lokasiDetail: "Packing Line 1", diajukan: t("11-08", "09:00"), prioritas: "Tinggi", status: "selesai", terima: t("11-08", "09:30"),
    selesai: t("11-08", "15:10"), catatanSelesai: "Parameter timer dikalibrasi ulang, pengujian 30 menit berjalan normal.",
    bukti: [lamp("Hasil_Kalibrasi.pdf", 860, "pic"), lamp("Foto_Panel.jpg", 1900, "pic")],
  }),
  bangun({
    id: "IS-2026-0019", judul: "Penggantian Lampu LED Workstation", layanan: "Perbaikan Fasilitas", kategori: "Listrik & Cahaya", pengaju: orang.agus,
    deskripsi: "Pencahayaan redup di area perakitan wiring harness line B, mohon penggantian lampu LED.",
    plant: "Plant 2", lantai: "Lantai 2", lokasiDetail: "Line B Workstation 5-8", diajukan: t("11-05", "09:05"), prioritas: "Normal", status: "selesai", terima: t("11-05", "10:00"),
    selesai: t("11-06", "08:20"), catatanSelesai: "4 unit lampu LED diganti dan diuji intensitas cahaya.",
    bukti: [lamp("Setelah_Perbaikan.jpg", 2100, "pic")],
  }),

  // ----- Ditolak -----
  bangun({
    id: "IS-2026-0022", judul: "Permohonan Surat Visa Dinas", layanan: "Dokumen & Surat", kategori: "Admin Karyawan", pengaju: orang.maya,
    deskripsi: "Mohon dibuatkan surat pengantar visa dinas untuk perjalanan ke kantor pusat.",
    plant: "Plant 2", lantai: "Lantai 1", lokasiDetail: "Ruang HR", diajukan: t("11-07", "14:10"), prioritas: "Normal", status: "ditolak",
    tolak: { waktu: t("11-07", "15:00"), alasan: "Permintaan di luar cakupan layanan IT & Automation. Silakan ajukan kembali ke seksi HR." },
  }),
  bangun({
    id: "IS-2026-0017", judul: "Instal Game pada PC Operator", layanan: "Dukungan Perangkat Lunak", kategori: "Dukungan IT", pengaju: orang.agus,
    deskripsi: "Mohon instalasi aplikasi hiburan pada PC operator line untuk waktu istirahat.",
    plant: "Plant 1", lantai: "Lantai 1", lokasiDetail: "Line A", diajukan: t("11-03", "10:20"), prioritas: "Normal", status: "ditolak",
    tolak: { waktu: t("11-03", "11:00"), alasan: "Tidak sesuai kebijakan penggunaan perangkat perusahaan." },
  }),
];

export const STORAGE_KEY = "ism.pic.permintaan.v3";
