import { cn } from "@/lib/constants";
import { editorial } from "@/lib/editorial";

export type DataTableColumn<T> = {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => React.ReactNode;
};

type DataTableProps<T extends Record<string, unknown>> = {
  columns: DataTableColumn<T>[];
  data: T[];
  keyExtractor?: (row: T) => string;
  keyField?: keyof T & string;
  className?: string;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
};

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyExtractor,
  keyField = "id" as keyof T & string,
  className,
  emptyMessage = "No data available",
  onRowClick,
}: DataTableProps<T>) {
  const getKey = (row: T) =>
    keyExtractor ? keyExtractor(row) : String(row[keyField] ?? Math.random());
  return (
    <div className={cn("overflow-x-auto rounded-lg border border-white/[0.08]", className)}>
      <table className="data-table">
        <thead>
          <tr className="bg-[#141414]/80">
            {columns.map((col) => (
              <th key={col.key} className={col.className}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className={`py-12 text-center text-xs text-[#555] ${editorial.meta}`}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={getKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(onRowClick && "cursor-pointer")}
              >
                {columns.map((col) => (
                  <td key={col.key} className={col.className}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
