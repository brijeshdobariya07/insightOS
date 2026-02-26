import type { TableResponse, TableRowItem, TableStatus } from "./types";

const FIRST_NAMES = [
  "Emma", "Liam", "Olivia", "Noah", "Ava",
  "Ethan", "Sophia", "Mason", "Isabella", "Logan",
  "Mia", "Lucas", "Charlotte", "Alexander", "Amelia",
  "James", "Harper", "Benjamin", "Evelyn", "Daniel",
  "Abigail", "Henry", "Emily", "Sebastian", "Ella",
  "Jack", "Scarlett", "Aiden", "Grace", "Owen",
  "Victoria", "Samuel", "Riley", "Nathan", "Aria",
  "Leo", "Lily", "Caleb", "Chloe", "Ryan",
] as const;

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones",
  "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
  "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
  "Thomas", "Taylor", "Moore", "Jackson", "Martin",
  "Lee", "Perez", "Thompson", "White", "Harris",
  "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
  "Walker", "Young", "Allen", "King", "Wright",
  "Scott", "Torres", "Nguyen", "Hill", "Flores",
] as const;

const EMAIL_DOMAINS = [
  "gmail.com", "outlook.com", "yahoo.com", "protonmail.com",
  "company.io", "enterprise.co", "work.dev", "mail.org",
] as const;

const STATUS_WEIGHTS: readonly { status: TableStatus; weight: number }[] = [
  { status: "active", weight: 0.6 },
  { status: "pending", weight: 0.25 },
  { status: "error", weight: 0.15 },
] as const;

const REVENUE_CONFIG = {
  baseMin: 120,
  baseMax: 48000,
  precision: 2,
} as const;

const ROW_COUNT = 1000;
const SIMULATED_DELAY_MS = 800;

/**
 * Generates a seeded-style random number within a range.
 * Uses Math.random() but constrains output for realistic distribution.
 */
function randomIntInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, precision: number): number {
  const raw = Math.random() * (max - min) + min;
  const factor = Math.pow(10, precision);
  return Math.round(raw * factor) / factor;
}

function pickRandom<T>(items: readonly T[]): T {
  const index = randomIntInRange(0, items.length - 1);
  // Safety: index is always within bounds due to randomIntInRange constraints
  return items[index] as T;
}

function generateFullName(): { first: string; last: string } {
  return {
    first: pickRandom(FIRST_NAMES),
    last: pickRandom(LAST_NAMES),
  };
}

function generateEmail(first: string, last: string, index: number): string {
  const domain = pickRandom(EMAIL_DOMAINS);
  const separator = Math.random() > 0.5 ? "." : "";
  const suffix = index % 3 === 0 ? String(randomIntInRange(1, 99)) : "";
  return `${first.toLowerCase()}${separator}${last.toLowerCase()}${suffix}@${domain}`;
}

function generateStatus(): TableStatus {
  const roll = Math.random();
  let cumulative = 0;

  for (const entry of STATUS_WEIGHTS) {
    cumulative += entry.weight;
    if (roll <= cumulative) {
      return entry.status;
    }
  }

  // Fallback — should not be reached given weights sum to 1.0
  return "active";
}

/**
 * Generates an ISO 8601 date string within the past 365 days.
 */
function generateCreatedAt(): string {
  const now = Date.now();
  const oneYearMs = 365 * 24 * 60 * 60 * 1000;
  const randomOffset = Math.floor(Math.random() * oneYearMs);
  return new Date(now - randomOffset).toISOString();
}

function generateRevenue(): number {
  return randomFloat(
    REVENUE_CONFIG.baseMin,
    REVENUE_CONFIG.baseMax,
    REVENUE_CONFIG.precision,
  );
}

function generateRow(index: number): TableRowItem {
  const { first, last } = generateFullName();

  return {
    id: `row-${String(index + 1).padStart(4, "0")}`,
    user: `${first} ${last}`,
    email: generateEmail(first, last, index),
    revenue: generateRevenue(),
    status: generateStatus(),
    createdAt: generateCreatedAt(),
  };
}

function generateRows(count: number): TableRowItem[] {
  return Array.from({ length: count }, (_, index) => generateRow(index));
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function fetchTableData(): Promise<TableResponse> {
  await delay(SIMULATED_DELAY_MS);

  const rows = generateRows(ROW_COUNT);

  return {
    rows,
    total: rows.length,
  };
}
