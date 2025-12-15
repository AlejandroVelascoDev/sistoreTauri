import { invoke } from "@tauri-apps/api/core";

export type ReportModel = {
  id: number;
  title: string;
  generated_at: string;
  description: string;
};

export interface Report {
  id: number;
  name: string;
  category: string;
  created_at: string;
  description: string | null;
}

export interface CreateReportRequest {
  name: string;
  category: string;
  description?: string | null;
}

export interface UpdateReportRequest {
  id: number;
  name: string;
  category: string;
  description?: string | null;
}

export const reportService = {
  getAll(): Promise<Report[]> {
    return invoke<Report[]>("report_service_get_all");
  },

  getOne(id: number): Promise<Report | null> {
    return invoke<Report | null>("report_service_get_one", { id });
  },

  create(req: CreateReportRequest): Promise<number> {
    return invoke<number>("report_service_create", { req });
  },

  update(req: UpdateReportRequest): Promise<void> {
    return invoke<void>("report_service_update", { req });
  },

  delete(id: number): Promise<void> {
    return invoke<void>("report_service_delete", { id });
  },
};
