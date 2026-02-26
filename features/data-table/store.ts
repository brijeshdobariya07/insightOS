import { create } from "zustand";
import type { TableRowItem, TableStatus } from "./types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SortDirection = "asc" | "desc";

/** Shape of the data-table store state (data only). */
interface DataTableState {
  statusFilter: TableStatus | "all";
  searchTerm: string;
  sortKey: keyof TableRowItem | null;
  sortDirection: SortDirection;
}

/** Actions exposed by the data-table store. */
interface DataTableActions {
  /** Update the status filter. */
  setStatusFilter: (filter: TableStatus | "all") => void;
  /** Update the search term. */
  setSearchTerm: (term: string) => void;
  /**
   * Toggle sort on a column.
   * Same key → flips direction. New key → resets to "asc".
   */
  toggleSort: (key: keyof TableRowItem) => void;
}

// ---------------------------------------------------------------------------
// Initial state (extracted so a future reset action can reuse it)
// ---------------------------------------------------------------------------

const initialState: DataTableState = {
  statusFilter: "all",
  searchTerm: "",
  sortKey: null,
  sortDirection: "asc",
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useDataTableStore = create<DataTableState & DataTableActions>()(
  (set) => ({
    ...initialState,

    setStatusFilter: (filter) => set({ statusFilter: filter }),

    setSearchTerm: (term) => set({ searchTerm: term }),

    toggleSort: (key) =>
      set((state) => {
        if (state.sortKey === key) {
          return {
            sortDirection: state.sortDirection === "asc" ? "desc" : "asc",
          };
        }
        return { sortKey: key, sortDirection: "asc" };
      }),
  }),
);
