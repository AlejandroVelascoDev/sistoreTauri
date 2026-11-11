import { invoke } from "@tauri-apps/api/core";

export type CashSession = {
  id: number;
  opened_at: string;
  opening_fund: number;
  closed_at: string | null;
  counted_cash: number | null;
  expected_cash: number | null;
  difference: number | null;
  notes: string | null;
};

export type CashMovementKind = "ingreso" | "retiro" | "devolucion";

export type CashMovement = {
  id: number;
  session_id: number;
  kind: CashMovementKind;
  amount: number;
  concept: string;
  reference: string | null;
  created_at: string;
};

export type DenominationCount = {
  value: number;
  count: number;
};

export type CutSummary = {
  session: CashSession;
  sales_count: number;
  cash_sales: number;
  card_sales: number;
  transfer_sales: number;
  total_sales: number;
  cash_in: number;
  withdrawals: number;
  refunds: number;
  expected_cash: number;
  movements: CashMovement[];
  denominations: DenominationCount[];
};

export type CreateMovementRequest = {
  kind: CashMovementKind;
  amount: number;
  concept: string;
  reference?: string | null;
};

export type CloseCashRequest = {
  session_id: number;
  denominations: DenominationCount[];
  notes?: string | null;
};

export const CashService = {
  async getCurrent(): Promise<CutSummary | null> {
    return await invoke("cash_get_current");
  },

  async open(openingFund: number): Promise<number> {
    return await invoke("cash_open", { req: { opening_fund: openingFund } });
  },

  async createMovement(payload: CreateMovementRequest): Promise<number> {
    return await invoke("cash_movement_create", { req: payload });
  },

  async close(payload: CloseCashRequest): Promise<CutSummary> {
    return await invoke("cash_close", { req: payload });
  },

  async history(): Promise<CutSummary[]> {
    return await invoke("cash_history");
  },
};
