"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { setUnauthorizedHandler } from "@/lib/api/client";
import { login as apiLogin, logout as apiLogout, me } from "@/lib/api/auth";
import type { LoginPayload, User } from "@/lib/api/types";

export type AuthStatus = "loading" | "authenticated" | "guest";

interface AuthContextValue {
  /** Akun yang sedang masuk; null saat tamu atau masih memeriksa sesi. */
  user: User | null;
  /** loading = sesi sedang diperiksa ke GET /api/auth/me. */
  status: AuthStatus;
  login: (payload: LoginPayload) => Promise<User>;
  logout: () => Promise<void>;
  /** Muat ulang data akun (mis. setelah ubah profil). */
  refresh: () => Promise<User | null>;
  /** Ganti data akun di memori tanpa memanggil API (mis. dari respons ubah profil). */
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Halaman publik: tidak dialihkan ke /login saat tamu. */
const HALAMAN_PUBLIK = ["/login", "/register"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUserState] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const refresh = useCallback(async () => {
    // Backend mati atau jaringan putus diperlakukan sebagai tamu (halaman login tetap bisa dibuka).
    const akun = await me().catch(() => null);
    setUserState(akun);
    setStatus(akun ? "authenticated" : "guest");
    return akun;
  }, []);

  // Periksa sesi sekali saat aplikasi dimuat. setState dipanggil di dalam callback, dan
  // dibatalkan bila komponen dilepas (StrictMode menjalankan effect dua kali saat dev).
  useEffect(() => {
    let dibatalkan = false;

    me()
      .catch(() => null) // backend mati / jaringan putus = tamu
      .then((akun) => {
        if (dibatalkan) return;
        setUserState(akun);
        setStatus(akun ? "authenticated" : "guest");
      });

    return () => {
      dibatalkan = true;
    };
  }, []);

  // Sesi habis di tengah pemakaian (API menjawab 401): kosongkan akun lalu arahkan ke login.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUserState(null);
      setStatus("guest");
      if (!HALAMAN_PUBLIK.some((p) => pathname.startsWith(p))) router.replace("/login");
    });
    return () => setUnauthorizedHandler(null);
  }, [pathname, router]);

  const login = useCallback(async (payload: LoginPayload) => {
    const akun = await apiLogin(payload);
    setUserState(akun);
    setStatus("authenticated");
    return akun;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // Tetap keluar di sisi klien walau server tidak menjawab.
    }
    setUserState(null);
    setStatus("guest");
    router.replace("/login");
  }, [router]);

  const setUser = useCallback((akun: User) => setUserState(akun), []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, login, logout, refresh, setUser }),
    [user, status, login, logout, refresh, setUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam <AuthProvider>.");
  return ctx;
}
