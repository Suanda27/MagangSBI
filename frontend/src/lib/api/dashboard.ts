import { api } from "./client";
import type { DashboardKaryawan, DashboardSupervisor } from "./types";

/** GET /api/employee/dashboard: jumlah tiket sendiri per status dan 5 tiket terbaru. */
export async function getDashboardKaryawan(): Promise<DashboardKaryawan> {
  const { data } = await api.get<{ data: DashboardKaryawan }>("/api/employee/dashboard");
  return data.data;
}

/** GET /api/supervisor/dashboard: ringkasan tiket yang ditujukan ke section supervisor. */
export async function getDashboardSupervisor(): Promise<DashboardSupervisor> {
  const { data } = await api.get<{ data: DashboardSupervisor }>("/api/supervisor/dashboard");
  return data.data;
}
