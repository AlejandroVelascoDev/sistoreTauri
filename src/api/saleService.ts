import { invoke } from "@tauri-apps/api/core";

export type SaleItemModel = {
  product_id: number;
  quantity: number;
  unit_price: number;
};

export type PaymentMethod = "efectivo" | "tarjeta" | "transferencia";

export type CreateSaleRequest = {
  items: SaleItemModel[];
  subtotal: number;
  tax: number;
  total: number;
  payment_method: PaymentMethod;
  received?: number | null;
};

export type SaleSummary = {
  id: number;
  occurred_at: string;
  subtotal: number;
  tax: number;
  total: number;
};

export const SaleService = {
  async create(payload: CreateSaleRequest): Promise<number> {
    return await invoke("sale_service_create", { req: payload });
  },

  async getAll(): Promise<SaleSummary[]> {
    return await invoke("sale_service_get_all");
  },
};
