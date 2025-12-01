import { invoke } from "@tauri-apps/api/core";

export type ProductModel = {
  id: number;
  name: string;
  price: number;
  stock: number;
  category?: string | null;
  created_at: string;
};

export type CreateProductRequest = {
  name: string;
  price: number;
  stock: number;
  category?: string | null;
};

export type UpdateProductRequest = {
  id: number;
  name: string;
  price: number;
  stock: number;
  category?: string | null;
};

export const ProductService = {
  async getAll(): Promise<ProductModel[]> {
    return await invoke("product_service_get_all");
  },

  async getOne(id: number): Promise<ProductModel | null> {
    return await invoke("product_service_get_one", { id });
  },

  async create(payload: CreateProductRequest): Promise<number> {
    return await invoke("product_service_create", { req: payload });
  },

  async update(payload: UpdateProductRequest): Promise<void> {
    await invoke("product_service_update", { req: payload });
  },

  async delete(id: number): Promise<void> {
    await invoke("product_service_delete", { id });
  },
};
