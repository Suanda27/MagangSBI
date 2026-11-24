import { api } from "./client";
import type {
  AturanLampiran,
  BuatPermintaanPayload,
  KategoriLayanan,
  PermintaanBaru,
  Plant,
} from "./types";

// Endpoint form pengajuan layanan karyawan. Semua melempar ApiError saat gagal.

/** GET /api/referensi/layanan?bagian={id}: layanan aktif satu section, per kategori. */
export async function getLayanan(idBagian: number): Promise<KategoriLayanan[]> {
  const { data } = await api.get<{ data: KategoriLayanan[] }>("/api/referensi/layanan", {
    params: { bagian: idBagian },
  });
  return data.data;
}

/** GET /api/referensi/lokasi: plant aktif beserta lantai aktifnya. */
export async function getLokasi(): Promise<Plant[]> {
  const { data } = await api.get<{ data: Plant[] }>("/api/referensi/lokasi");
  return data.data;
}

/** GET /api/referensi/aturan-lampiran: batas jumlah, ukuran, dan format berkas. */
export async function getAturanLampiran(): Promise<AturanLampiran> {
  const { data } = await api.get<{ data: AturanLampiran }>("/api/referensi/aturan-lampiran");
  return data.data;
}

/** POST /api/employee/permintaan (multipart): ajukan tiket baru. */
export async function buatPermintaan(payload: BuatPermintaanPayload): Promise<PermintaanBaru> {
  const form = new FormData();
  form.append("id_layanan", String(payload.id_layanan));
  form.append("id_plant", String(payload.id_plant));
  form.append("id_lantai", String(payload.id_lantai));
  if (payload.lokasi_detail?.trim()) form.append("lokasi_detail", payload.lokasi_detail.trim());
  form.append("judul", payload.judul.trim());
  form.append("deskripsi", payload.deskripsi.trim());
  form.append("prioritas", payload.prioritas);
  for (const berkas of payload.lampiran) form.append("lampiran[]", berkas);

  const { data } = await api.post<{ data: PermintaanBaru }>("/api/employee/permintaan", form);
  return data.data;
}
