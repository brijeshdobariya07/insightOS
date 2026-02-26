export type TableStatus = "active" | "pending" | "error";

export interface TableRowItem {
  id: string;
  user: string;
  email: string;
  revenue: number;
  status: TableStatus;
  createdAt: string;
}

export interface TableResponse {
  rows: TableRowItem[];
  total: number;
}
