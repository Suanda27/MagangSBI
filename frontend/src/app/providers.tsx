"use client";

import { AuthProvider } from "@/lib/auth/auth-context";

/** Provider global aplikasi (Client Component agar root layout tetap Server Component). */
export default function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
