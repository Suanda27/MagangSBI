import { isAxiosError } from "axios";

/**
 * Semua kegagalan pemanggilan API dibungkus menjadi ApiError, sehingga halaman cukup
 * menangani satu jenis error (bukan AxiosError, error jaringan, dan sebagainya).
 */
export class ApiError extends Error {
  /** Kode HTTP; 0 bila server tidak terjangkau. */
  readonly status: number;
  /** Error validasi per field (422), mis. { email: ["Email ini sudah digunakan."] }. */
  readonly errors: Record<string, string[]>;
  /** Detik tunggu dari header Retry-After (429), bila ada. */
  readonly retryAfter: number | null;

  constructor(
    message: string,
    status: number,
    errors: Record<string, string[]> = {},
    retryAfter: number | null = null,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
    this.retryAfter = retryAfter;
  }

  get isNetworkError(): boolean {
    return this.status === 0;
  }

  get isValidation(): boolean {
    return this.status === 422;
  }
}

const PESAN_BAWAAN: Record<number, string> = {
  401: "Sesi Anda berakhir. Silakan masuk kembali.",
  403: "Anda tidak memiliki akses untuk tindakan ini.",
  404: "Data yang diminta tidak ditemukan.",
  419: "Sesi keamanan kedaluwarsa. Muat ulang halaman lalu coba lagi.",
  429: "Terlalu banyak percobaan. Coba lagi beberapa saat lagi.",
};

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (isAxiosError(error)) {
    const res = error.response;
    if (!res) {
      return new ApiError("Tidak dapat terhubung ke server. Periksa koneksi Anda.", 0);
    }

    const data = res.data as { message?: string; errors?: Record<string, string[]> } | undefined;
    const retry = Number(res.headers?.["retry-after"]);
    const pesan =
      data?.message ||
      PESAN_BAWAAN[res.status] ||
      (res.status >= 500 ? "Terjadi kesalahan pada server. Coba lagi nanti." : "Permintaan gagal.");

    return new ApiError(pesan, res.status, data?.errors ?? {}, Number.isFinite(retry) && retry > 0 ? retry : null);
  }

  return new ApiError(error instanceof Error ? error.message : "Terjadi kesalahan tak terduga.", 0);
}

/** Pesan pertama untuk tiap field, siap ditaruh di bawah input: { email: "Email ini ..." }. */
export function fieldErrors(error: unknown): Record<string, string> {
  const hasil: Record<string, string> = {};
  for (const [field, pesan] of Object.entries(toApiError(error).errors)) {
    if (pesan[0]) hasil[field] = pesan[0];
  }
  return hasil;
}

/** Pesan umum untuk ditampilkan ke pengguna. */
export function errorMessage(error: unknown, bawaan = "Terjadi kesalahan. Coba lagi."): string {
  return toApiError(error).message || bawaan;
}
