import SupervisorLayoutWrapper from "@/components/layout/supervisor-layout-wrapper";

export default function SupervisorLayout({ children }: { children: React.ReactNode }) {
  return <SupervisorLayoutWrapper>{children}</SupervisorLayoutWrapper>;
}
