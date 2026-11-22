import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import api from "@/lib/axios";
import { toApiError } from "./errors";

declare module "axios" {
  interface AxiosRequestConfig {
    /** true = jangan jalankan penanganan 401 global (cek sesi awal, login). */
    skipAuthRedirect?: boolean;
    /** Internal: permintaan ini sudah diulang sekali setelah 419. */
    _csrfRetried?: boolean;
  }
}

type Config = InternalAxiosRequestConfig;

let unauthorizedHandler: (() => void) | null = null;

/** Didaftarkan oleh AuthProvider: dipanggil saat API menjawab 401 (sesi habis). */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

const hasXsrfCookie = (): boolean =>
  typeof document !== "undefined" && /(?:^|;\s*)XSRF-TOKEN=/.test(document.cookie);

let csrfInFlight: Promise<void> | null = null;

/**
 * Sanctum SPA: sebelum permintaan yang mengubah data, cookie XSRF-TOKEN harus ada.
 * Diambil dari GET /sanctum/csrf-cookie. Panggilan serentak berbagi satu permintaan.
 */
export function ensureCsrfCookie(force = false): Promise<void> {
  if (!force && hasXsrfCookie()) return Promise.resolve();

  csrfInFlight ??= api
    .get("/sanctum/csrf-cookie", { skipAuthRedirect: true })
    .then(() => undefined)
    .finally(() => {
      csrfInFlight = null;
    });

  return csrfInFlight;
}

// Pasang sekali saja (modul bisa dievaluasi ulang saat hot reload).
const terpasang = new WeakSet<object>();

if (!terpasang.has(api)) {
  terpasang.add(api);

  // 1) POST/PATCH/DELETE: pastikan cookie CSRF ada sebelum dikirim.
  api.interceptors.request.use(async (config: Config) => {
    const method = (config.method ?? "get").toLowerCase();
    if (method !== "get" && method !== "head") await ensureCsrfCookie();
    return config;
  });

  // 2) Respons gagal: ulang sekali bila 419, tangani 401, lalu seragamkan jadi ApiError.
  api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const config = error.config as Config | undefined;
      const status = error.response?.status;

      // Token CSRF kedaluwarsa: ambil yang baru lalu ulangi permintaan satu kali.
      if (status === 419 && config && !config._csrfRetried) {
        config._csrfRetried = true;
        await ensureCsrfCookie(true);
        return api.request(config);
      }

      if (status === 401 && !config?.skipAuthRedirect) {
        unauthorizedHandler?.();
      }

      return Promise.reject(toApiError(error));
    },
  );
}

export { api };
export default api;
