import { Cpu, Network, Building2, Users, Factory } from "lucide-react";
import type { SectionConfig } from "@/lib/employee-data";

const MAP: Record<SectionConfig["icon"], typeof Factory> = {
  precision_manufacturing: Factory,
  groups: Users,
  apartment: Building2,
  account_tree: Network,
  computer: Cpu,
};

export default function SectionIcon({ name, className }: { name: SectionConfig["icon"]; className?: string }) {
  const Icon = MAP[name];
  return <Icon className={className} />;
}
