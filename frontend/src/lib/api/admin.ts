import { api } from "./client";

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
