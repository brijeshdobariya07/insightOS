import { memo } from "react";

const COLUMNS = [
  { key: "user", label: "User", width: "w-[20%]" },
  { key: "email", label: "Email", width: "w-[25%]" },
  { key: "revenue", label: "Revenue", width: "w-[15%]" },
  { key: "status", label: "Status", width: "w-[15%]" },
  { key: "createdAt", label: "Created At", width: "w-[25%]" },
] as const;

const TableHeader = memo(function TableHeader() {
  return (
    <div
      className={
        "sticky top-0 z-10 flex items-center border-b border-gray-800 " +
        "bg-gray-900/95 px-4 py-3 text-xs font-semibold uppercase " +
        "tracking-wider text-gray-400 backdrop-blur-sm"
      }
      role="row"
    >
      {COLUMNS.map((column) => (
        <div
          key={column.key}
          className={`${column.width} shrink-0 px-2`}
          role="columnheader"
        >
          {column.label}
        </div>
      ))}
    </div>
  );
});

export { TableHeader, COLUMNS };
