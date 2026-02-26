import { create } from "zustand";
import type { CopilotResponse } from "@/lib/validators/copilot-schema";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single message in the copilot conversation. */
export interface CopilotMessage {
  readonly id: string;
  readonly role: "user" | "assistant";
  readonly content: string;
}

/** Shape of the copilot store state (data only). */
interface CopilotState {
  messages: readonly CopilotMessage[];
  isLoading: boolean;
  lastResponse: CopilotResponse | null;
}

/** Actions exposed by the copilot store. */
interface CopilotActions {
  /** Append a message to the conversation history. */
  addMessage: (message: CopilotMessage) => void;
  /** Toggle the loading flag (e.g. while an API call is in-flight). */
  setLoading: (loading: boolean) => void;
  /** Cache the most recent validated AI response. */
  setLastResponse: (response: CopilotResponse | null) => void;
  /** Reset the store to its initial state. */
  clearSession: () => void;
}

// ---------------------------------------------------------------------------
// Initial state (extracted so clearSession can reuse it)
// ---------------------------------------------------------------------------

const initialState: CopilotState = {
  messages: [],
  isLoading: false,
  lastResponse: null,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useCopilotStore = create<CopilotState & CopilotActions>()(
  (set) => ({
    ...initialState,

    addMessage: (message) =>
      set((state) => ({ messages: [...state.messages, message] })),

    setLoading: (loading) => set({ isLoading: loading }),

    setLastResponse: (response) => set({ lastResponse: response }),

    clearSession: () => set(initialState),
  }),
);
