import AdminLayoutWrapper from "@/components/layout/admin-layout-wrapper";
import RoleGuard from "@/components/shared/auth/role-guard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard roles={["admin"]}>
      <AdminLayoutWrapper>{children}</AdminLayoutWrapper>
    </RoleGuard>
  );
}
