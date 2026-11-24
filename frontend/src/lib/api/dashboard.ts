import { api } from "./client";
import type { DashboardKaryawan } from "./types";

/** GET /api/employee/dashboard: jumlah tiket sendiri per status dan 5 tiket terbaru. */
export async function getDashboardKaryawan(): Promise<DashboardKaryawan> {
  const { data } = await api.get<{ data: DashboardKaryawan }>("/api/employee/dashboard");
  return data.data;
}
