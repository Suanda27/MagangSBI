import EmployeeLayoutWrapper from "@/components/layout/employee-layout-wrapper";
import RoleGuard from "@/components/shared/auth/role-guard";

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard roles={["employee"]}>
      <EmployeeLayoutWrapper>{children}</EmployeeLayoutWrapper>
    </RoleGuard>
  );
}
