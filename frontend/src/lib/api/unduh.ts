import { api } from "./client";

/**
 * Mengunduh berkas dari endpoint yang butuh sesi login (cookie), jadi tidak bisa berupa tautan biasa.
 * Nama berkas dibaca dari header Content-Disposition (diekspos lewat config/cors.php di backend).
 */
export async function unduhBerkas(url: string, params: object = {}, namaCadangan = "berkas.csv"): Promise<{ blob: Blob; nama: string }> {
  const res = await api.get<Blob>(url, { params, responseType: "blob" });
  const nama = /filename="?([^";]+)"?/i.exec(String(res.headers["content-disposition"] ?? ""))?.[1] ?? namaCadangan;
  return { blob: res.data, nama };
}

/** Memicu unduhan di browser untuk blob yang sudah diterima. */
export function simpanBlob({ blob, nama }: { blob: Blob; nama: string }): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nama;
  a.click();
  URL.revokeObjectURL(url);
}
