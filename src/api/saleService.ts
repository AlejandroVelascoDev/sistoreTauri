import { invoke } from "@tauri-apps/api/core";

export type SaleItemModel = {
  product_id: number;
  quantity: number;
  unit_price: number;
};

export type CreateSaleRequest = {
  items: SaleItemModel[];
  subtotal: number;
  tax: number;
  total: number;
};

export const SaleService = {
  async create(payload: CreateSaleRequest): Promise<number> {
    return await invoke("sale_service_create", { req: payload });
  },

  async getAll(): Promise<any[]> {
    return await invoke("sale_service_get_all");
  },
};
