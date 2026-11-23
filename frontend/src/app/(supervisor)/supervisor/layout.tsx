import SupervisorLayoutWrapper from "@/components/layout/supervisor-layout-wrapper";
import RoleGuard from "@/components/shared/auth/role-guard";

export default function SupervisorLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard roles={["supervisor"]}>
      <SupervisorLayoutWrapper>{children}</SupervisorLayoutWrapper>
    </RoleGuard>
  );
}
