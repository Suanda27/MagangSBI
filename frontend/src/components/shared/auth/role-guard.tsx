"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import type { Role } from "@/lib/api/types";

interface RoleGuardProps {
  /** Peran yang boleh melihat isi. */
  roles: Role[];
  children: React.ReactNode;
}

/**
 * Pengaman halaman per peran (hanya untuk pengalaman pengguna):
 *  - tamu            -> diarahkan ke /login
 *  - peran tidak cocok -> diarahkan ke dashboard perannya sendiri
 *
 * PENTING: ini BUKAN batas keamanan. Data tetap dilindungi backend (auth:sanctum,
 * akun.aktif, role:<peran>), jadi menyembunyikan halaman di sini tidak membuka data.
 *
 * Contoh pemakaian di layout peran:
 *   <RoleGuard roles={["employee"]}>{children}</RoleGuard>
 */
export default function RoleGuard({ roles, children }: RoleGuardProps) {
  const router = useRouter();
  const { user, status } = useAuth();

  const diizinkan = status === "authenticated" && user !== null && roles.includes(user.role);

  useEffect(() => {
    if (status === "guest") {
      router.replace("/login");
    } else if (status === "authenticated" && user && !roles.includes(user.role)) {
      router.replace(user.home);
    }
  }, [status, user, roles, router]);

  if (!diizinkan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" role="status" aria-live="polite">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          {status === "loading" ? "Memeriksa sesi..." : "Mengalihkan..."}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
