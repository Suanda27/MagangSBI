import { api } from "./client";
import { ApiError } from "./errors";
import type {
  ChangePasswordPayload,
  LoginPayload,
  RegisterPayload,
  Section,
  UpdateProfilePayload,
  User,
} from "./types";

// Fungsi bertipe untuk endpoint akun (kontrak: docs/api-auth.md).
// Semua melempar ApiError saat gagal.

/** GET /api/referensi/sections: section aktif untuk dropdown register (publik). */
export async function getSections(): Promise<Section[]> {
  const { data } = await api.get<{ data: Section[] }>("/api/referensi/sections");
  return data.data;
}

/** POST /api/auth/register: akun baru selalu berperan karyawan. */
export async function register(payload: RegisterPayload): Promise<User> {
  const { data } = await api.post<{ data: User }>("/api/auth/register", payload);
  return data.data;
}

/** POST /api/auth/login: NIK atau email. Sesi disimpan di cookie oleh backend. */
export async function login(payload: LoginPayload): Promise<User> {
  const { data } = await api.post<{ data: User }>("/api/auth/login", payload, { skipAuthRedirect: true });
  return data.data;
}

/** POST /api/auth/logout */
export async function logout(): Promise<void> {
  await api.post("/api/auth/logout", undefined, { skipAuthRedirect: true });
}

/**
 * GET /api/auth/me: akun yang sedang masuk, atau null bila belum masuk (401).
 * Dipakai untuk memeriksa sesi saat aplikasi dimuat.
 */
export async function me(): Promise<User | null> {
  try {
    const { data } = await api.get<{ data: User }>("/api/auth/me", { skipAuthRedirect: true });
    return data.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

/** PATCH /api/auth/me: nama, email, telepon. */
export async function updateProfile(payload: UpdateProfilePayload): Promise<User> {
  const { data } = await api.patch<{ data: User }>("/api/auth/me", payload);
  return data.data;
}

/** PATCH /api/auth/password */
export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
  await api.patch("/api/auth/password", payload);
}
