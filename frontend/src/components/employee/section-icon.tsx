import { Cpu, Network, Building2, Users, Factory } from "lucide-react";
import type { IconName } from "@/lib/section-meta";

const MAP: Record<IconName, typeof Factory> = {
  precision_manufacturing: Factory,
  groups: Users,
  apartment: Building2,
  account_tree: Network,
  computer: Cpu,
};

export default function SectionIcon({ name, className }: { name: IconName; className?: string }) {
  const Icon = MAP[name];
  return <Icon className={className} />;
}
