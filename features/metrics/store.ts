import { create } from "zustand";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Shape of the metrics store state (data only). */
interface MetricsState {
  /** The key of the currently highlighted metric, or null if none. */
  highlightedMetric: string | null;
}

/** Actions exposed by the metrics store. */
interface MetricsActions {
  /** Set (or clear) the currently highlighted metric by key. */
  setHighlightedMetric: (key: string | null) => void;
}

// ---------------------------------------------------------------------------
// Initial state (extracted so reset logic can reuse it if needed)
// ---------------------------------------------------------------------------

const initialState: MetricsState = {
  highlightedMetric: null,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useMetricsStore = create<MetricsState & MetricsActions>()(
  (set) => ({
    ...initialState,

    setHighlightedMetric: (key) => set({ highlightedMetric: key }),
  }),
);
