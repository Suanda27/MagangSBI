import { api } from "./client";
import type { PicDetailApi, PicTiketApi, StatusApi } from "./pic";
import type { Role, User } from "./types";

// Fungsi bertipe untuk endpoint Admin (kontrak: docs/api-admin.md).
// Semua melempar ApiError saat gagal (lihat lib/api/errors.ts).

export type StatusMaster = "aktif" | "nonaktif";

/* ---------- Lokasi: plant dan lantai ---------- */

export interface LantaiApi {
  id: number;
  nama_lantai: string;
  id_plant: number;
  status: StatusMaster;
  status_label: string;
}

export interface PlantApi {
  id: number;
  nama_plant: string;
  status: StatusMaster;
  status_label: string;
  jumlah_lantai?: number;
  lantais: LantaiApi[];
  created_at: string;
}

/** GET /api/admin/plants: semua plant beserta semua lantainya (semua status). */
export async function getPlants(): Promise<PlantApi[]> {
  const { data } = await api.get<{ data: PlantApi[] }>("/api/admin/plants");
  return data.data;
}

/** POST /api/admin/plants */
export async function createPlant(namaPlant: string): Promise<PlantApi> {
  const { data } = await api.post<{ data: PlantApi }>("/api/admin/plants", { nama_plant: namaPlant });
  return data.data;
}

/** PATCH /api/admin/plants/{id}: ubah nama atau status. */
export async function updatePlant(id: number, payload: { nama_plant?: string; status?: StatusMaster }): Promise<PlantApi> {
  const { data } = await api.patch<{ data: PlantApi }>(`/api/admin/plants/${id}`, payload);
  return data.data;
}

/** POST /api/admin/lantais: hanya pada plant aktif. */
export async function createLantai(idPlant: number, namaLantai: string): Promise<LantaiApi> {
  const { data } = await api.post<{ data: LantaiApi }>("/api/admin/lantais", { id_plant: idPlant, nama_lantai: namaLantai });
  return data.data;
}

/** PATCH /api/admin/lantais/{id}: ubah nama atau status (plant tidak dapat dipindah). */
export async function updateLantai(id: number, payload: { nama_lantai?: string; status?: StatusMaster }): Promise<LantaiApi> {
  const { data } = await api.patch<{ data: LantaiApi }>(`/api/admin/lantais/${id}`, payload);
  return data.data;
}

/* ---------- Pengaturan sistem ---------- */

export type FormatLampiran = "jpg" | "png" | "pdf";

export interface PengaturanApi {
  /** Batas ukuran per berkas, 1–5 MB. */
  max_upload_mb: number;
  format_lampiran: FormatLampiran[];
  /** Hanya dibaca: format nomor tiket tetap. */
  digit_nomor_tiket: number;
  /** Hanya dibaca: batas jumlah berkas per kategori. */
  maks_berkas: number;
}

/** GET /api/admin/pengaturan */
export async function getPengaturan(): Promise<PengaturanApi> {
  const { data } = await api.get<{ data: PengaturanApi }>("/api/admin/pengaturan");
  return data.data;
}

/** PATCH /api/admin/pengaturan: kirim hanya kunci yang diubah. */
export async function updatePengaturan(payload: { max_upload_mb?: number; format_lampiran?: FormatLampiran[] }): Promise<PengaturanApi> {
  const { data } = await api.patch<{ data: PengaturanApi }>("/api/admin/pengaturan", payload);
  return data.data;
}

/* ---------- Section ---------- */

export interface SectionAdminApi {
  id: number;
  kode_bagian: string;
  nama_bagian: string;
  deskripsi: string | null;
  status: StatusMaster;
  status_label: string;
  /** PIC aktif di section ini. */
  jumlah_pic?: number;
  jumlah_pengguna?: number;
  jumlah_layanan?: number;
  created_at: string;
}

/** GET /api/admin/sections: semua section (tanpa paginasi) beserta hitungannya. */
export async function getSectionsAdmin(): Promise<SectionAdminApi[]> {
  const { data } = await api.get<{ data: SectionAdminApi[] }>("/api/admin/sections");
  return data.data;
}

/** POST /api/admin/sections: kode 2–10 huruf, tidak dapat diubah lagi sesudahnya. */
export async function createSection(payload: { kode_bagian: string; nama_bagian: string; deskripsi?: string | null; status?: StatusMaster }): Promise<SectionAdminApi> {
  const { data } = await api.post<{ data: SectionAdminApi }>("/api/admin/sections", payload);
  return data.data;
}

/** PATCH /api/admin/sections/{id}: 409 bila dinonaktifkan padahal masih ada tiket berjalan. */
export async function updateSection(id: number, payload: { nama_bagian?: string; deskripsi?: string | null; status?: StatusMaster }): Promise<SectionAdminApi> {
  const { data } = await api.patch<{ data: SectionAdminApi }>(`/api/admin/sections/${id}`, payload);
  return data.data;
}

/* ---------- Layanan ---------- */

export interface LayananAdminApi {
  id: number;
  kode_layanan: string;
  nama_layanan: string;
  kategori: string;
  deskripsi: string | null;
  status: StatusMaster;
  status_label: string;
  bagian?: { id: number; kode_bagian: string; nama_bagian: string };
  created_at: string;
}

/** Bentuk respons berpaginasi Laravel (hanya bagian yang dipakai). */
export interface Halaman<T> {
  data: T[];
  meta: { current_page: number; last_page: number; per_page: number; total: number; from: number | null; to: number | null };
}

export interface FilterLayanan {
  q?: string;
  id_bagian?: number;
  kategori?: string;
  status?: StatusMaster;
  per_page?: number;
  page?: number;
}

/** GET /api/admin/layanan: semua status, berpaginasi. */
export async function getLayananAdmin(params: FilterLayanan = {}): Promise<Halaman<LayananAdminApi>> {
  const { data } = await api.get<Halaman<LayananAdminApi>>("/api/admin/layanan", { params });
  return data;
}

export interface PayloadLayanan {
  kode_layanan?: string;
  nama_layanan?: string;
  kategori?: string;
  deskripsi?: string | null;
  id_bagian?: number;
  status?: StatusMaster;
}

/** POST /api/admin/layanan */
export async function createLayanan(payload: Required<Pick<PayloadLayanan, "kode_layanan" | "nama_layanan" | "kategori" | "id_bagian">> & PayloadLayanan): Promise<LayananAdminApi> {
  const { data } = await api.post<{ data: LayananAdminApi }>("/api/admin/layanan", payload);
  return data.data;
}

/** PATCH /api/admin/layanan/{id}: layanan boleh dipindah ke section aktif lain. */
export async function updateLayanan(id: number, payload: PayloadLayanan): Promise<LayananAdminApi> {
  const { data } = await api.patch<{ data: LayananAdminApi }>(`/api/admin/layanan/${id}`, payload);
  return data.data;
}

/** Kategori layanan yang sudah dipakai (untuk saran isian), diambil dari katalog yang ada. */
export async function getKategoriLayanan(): Promise<string[]> {
  const hasil = await getLayananAdmin({ per_page: 100 });
  return Array.from(new Set(hasil.data.map((l) => l.kategori))).sort((a, b) => a.localeCompare(b, "id"));
}

/* ---------- Pengguna ---------- */

export interface FilterPengguna {
  q?: string;
  role?: Role;
  status?: StatusMaster;
  id_bagian?: number;
  per_page?: number;
  page?: number;
}

/** GET /api/admin/users: berpaginasi, urut nama. */
export async function getUsers(params: FilterPengguna = {}): Promise<Halaman<User>> {
  const { data } = await api.get<Halaman<User>>("/api/admin/users", { params });
  return data;
}

/** GET /api/admin/users/{id} */
export async function getUser(id: number | string): Promise<User> {
  const { data } = await api.get<{ data: User }>(`/api/admin/users/${id}`);
  return data.data;
}

export interface PayloadPengguna {
  name?: string;
  nik?: string;
  email?: string;
  password?: string;
  password_confirmation?: string;
  role?: Role;
  /** Wajib untuk employee/supervisor/pic; jangan dikirim untuk admin. */
  id_bagian?: number;
  jabatan?: string | null;
  telepon?: string | null;
  status?: StatusMaster;
}

/** POST /api/admin/users */
export async function createUser(payload: PayloadPengguna & Required<Pick<PayloadPengguna, "name" | "nik" | "email" | "password" | "password_confirmation" | "role">>): Promise<User> {
  const { data } = await api.post<{ data: User }>("/api/admin/users", payload);
  return data.data;
}

/** PATCH /api/admin/users/{id}: 422 bila mengunci akun sendiri, 409 bila PIC masih memegang tiket. */
export async function updateUser(id: number | string, payload: PayloadPengguna): Promise<User> {
  const { data } = await api.patch<{ data: User }>(`/api/admin/users/${id}`, payload);
  return data.data;
}

/* ---------- Pemetaan PIC ---------- */

export interface PicMappingApi {
  id: number;
  name: string;
  nik: string | null;
  email: string;
  jabatan: string | null;
  telepon: string | null;
  role: Role;
  status: StatusMaster;
  status_label: string;
  bagian?: { id: number; kode_bagian: string; nama_bagian: string } | null;
  /** Tiket berjalan yang sedang dipegang PIC ini. */
  tiket_aktif?: number;
}

export interface FilterPic {
  q?: string;
  id_bagian?: number;
  status?: StatusMaster;
  per_page?: number;
  page?: number;
}

/** GET /api/admin/pic-mapping */
export async function getPicMapping(params: FilterPic = {}): Promise<Halaman<PicMappingApi>> {
  const { data } = await api.get<Halaman<PicMappingApi>>("/api/admin/pic-mapping", { params });
  return data;
}

/** POST /api/admin/pic-mapping: hanya karyawan aktif yang dapat dijadikan PIC. */
export async function createPicMapping(userId: number, idBagian: number): Promise<PicMappingApi> {
  const { data } = await api.post<{ data: PicMappingApi }>("/api/admin/pic-mapping", { user_id: userId, id_bagian: idBagian });
  return data.data;
}

/** PATCH /api/admin/pic-mapping/{id}: pindah section; 409 bila masih memegang tiket berjalan. */
export async function updatePicMapping(userId: number, idBagian: number): Promise<PicMappingApi> {
  const { data } = await api.patch<{ data: PicMappingApi }>(`/api/admin/pic-mapping/${userId}`, { id_bagian: idBagian });
  return data.data;
}

/** DELETE /api/admin/pic-mapping/{id}: kembalikan menjadi karyawan (akun tidak dihapus); 409 bila masih memegang tiket. */
export async function deletePicMapping(userId: number): Promise<PicMappingApi> {
  const { data } = await api.delete<{ data: PicMappingApi }>(`/api/admin/pic-mapping/${userId}`);
  return data.data;
}

/* ---------- Pantauan tiket (hanya baca) ---------- */

/** Tiket pada daftar Admin: bentuk daftar PIC ditambah PIC penanggung jawab. */
export type TiketAdminApi = PicTiketApi & { pic?: { id: number; name: string } | null };

export interface RingkasanTiketApi {
  total: number;
  per_status: Record<StatusApi, number>;
}

export interface FilterTiketAdmin {
  /** Satu atau beberapa status dipisah koma, mis. "pending,in_progress". */
  status?: string;
  id_bagian?: number;
  id_plant?: number;
  q?: string;
  per_page?: number;
  page?: number;
}

/** GET /api/admin/permintaan: semua tiket lintas section, terbaru dulu. `ringkasan` = jumlah per status seluruh sistem. */
export async function getTiketAdmin(params: FilterTiketAdmin = {}): Promise<Halaman<TiketAdminApi> & { ringkasan: RingkasanTiketApi }> {
  const { data } = await api.get<Halaman<TiketAdminApi> & { ringkasan: RingkasanTiketApi }>("/api/admin/permintaan", { params });
  return data;
}

/** GET /api/admin/permintaan/{id}: detail lengkap (pengaju, PIC, lampiran, hasil kerja, riwayat). */
export async function getDetailTiketAdmin(id: number | string): Promise<PicDetailApi> {
  const { data } = await api.get<{ data: PicDetailApi }>(`/api/admin/permintaan/${id}`);
  return data.data;
}

/* ---------- Dashboard ---------- */

export interface HitungMaster {
  total: number;
  aktif: number;
  nonaktif: number;
}

export interface DashboardAdminApi {
  pengguna: HitungMaster;
  section: HitungMaster;
  layanan: HitungMaster;
  pic: HitungMaster;
  tiket: RingkasanTiketApi;
  beban_section: { id: number; kode_bagian: string; nama_bagian: string; jumlah: number }[];
  tiket_terbaru: TiketAdminApi[];
}

/** GET /api/admin/dashboard */
export async function getDashboardAdmin(): Promise<DashboardAdminApi> {
  const { data } = await api.get<{ data: DashboardAdminApi }>("/api/admin/dashboard");
  return data.data;
}
