import PicLayoutWrapper from "@/components/layout/pic-layout-wrapper";
import RoleGuard from "@/components/shared/auth/role-guard";

export default function PicLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard roles={["pic"]}>
      <PicLayoutWrapper>{children}</PicLayoutWrapper>
    </RoleGuard>
  );
}
