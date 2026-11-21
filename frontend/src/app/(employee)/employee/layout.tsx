import EmployeeLayoutWrapper from "@/components/layout/employee-layout-wrapper";

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return <EmployeeLayoutWrapper>{children}</EmployeeLayoutWrapper>;
}
