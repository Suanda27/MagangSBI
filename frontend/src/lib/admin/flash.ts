/**
 * Pesan singkat yang dibawa antar halaman (mis. "Section ditambahkan" setelah formulir tambah
 * mengalihkan ke daftar). Disimpan di sessionStorage dan dibaca sekali oleh halaman tujuan.
 */

const KEY = "ism.admin.flash";

export interface Flash {
  title: string;
  desc?: string;
}

export function setFlash(f: Flash): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(f));
  } catch {
    /* penyimpanan terblokir: pesan dilewati, tidak fatal */
  }
}

/** Ambil lalu hapus pesan; null bila tidak ada. */
export function takeFlash(): Flash | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    sessionStorage.removeItem(KEY);
    return JSON.parse(raw) as Flash;
  } catch {
    return null;
  }
}
