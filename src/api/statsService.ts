import { invoke } from "@tauri-apps/api/core";

export type DayStat = {
  day: string;
  sales: number;
  profit: number;
  count: number;
};

export type ProductStat = {
  name: string;
  quantity: number;
  profit: number;
};

export const StatsService = {
  async daily(from: string, to: string): Promise<DayStat[]> {
    return await invoke("stats_daily", { from, to });
  },

  async topProducts(from: string, to: string, limit: number): Promise<ProductStat[]> {
    return await invoke("stats_top_products", { from, to, limit });
  },
};
