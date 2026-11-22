"use client";

import PageHeader from "./page-header";
import { useAuth } from "@/lib/auth/auth-context";
import { firstNameOf } from "@/lib/auth/user-display";

/** Judul dashboard karyawan dengan nama dari akun yang sedang masuk. */
export default function WelcomeHeader({ children }: { children?: React.ReactNode }) {
  const { user } = useAuth();
  const nama = firstNameOf(user?.name);

  return (
    <PageHeader
      title={nama ? `Selamat datang kembali, ${nama}.` : "Selamat datang kembali."}
      description="Berikut adalah ringkasan aktivitas permintaan layanan Anda."
    >
      {children}
    </PageHeader>
  );
}
