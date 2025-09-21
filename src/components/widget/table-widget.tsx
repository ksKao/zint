import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getSelectTransactionQuery,
  getTableWidgetGroupByColumn,
  getTableWidgetSelectColumn,
} from "@/lib/query-builder-helpers";
import { queryKeys } from "@/lib/query-keys";
import { TableWidgetConfig } from "@/lib/types/widget.type";
import { useSuspenseQuery } from "@tanstack/react-query";
import { format } from "date-fns";

export default function TableWidget({
  config,
  height,
}: {
  config: TableWidgetConfig;
  height: number;
}) {
  const { data } = useSuspenseQuery({
    queryKey: [queryKeys.transaction, config],
    queryFn: async () => {
      let select: Parameters<typeof getSelectTransactionQuery>[0]["select"] =
        {};

      for (const { column } of config.tableColumns) {
        select = {
          ...select,
          [column]: getTableWidgetSelectColumn(
            column,
            config.convertToAbsolute,
          ),
        };
      }

      let query = getSelectTransactionQuery({
        filters: config.filters,
        select,
        orderBy: config.sortByColumns.map((x) => ({
          column: getTableWidgetSelectColumn(
            x.column,
            config.convertToAbsolute,
          ),
          order: x.order,
        })),
      });

      query = query.groupBy(
        ...config.groupByColumns.map(({ column }) =>
          getTableWidgetGroupByColumn(column),
        ),
      );

      if (config.limit) query = query.limit(config.limit);

      return await query;
    },
  });

  function formatValue(
    value: unknown,
    col: TableWidgetConfig["tableColumns"][number]["column"],
  ) {
    switch (col) {
      case "Sum":
      case "Average":
      case "Min":
      case "Max":
        return Number(value).toFixed(2);
      case "Day":
        return format(new Date(Number(value) * 1000), "dd MMM yyyy");
      case "Date":
        return format(new Date(String(value)), "dd MMM yyyy");
      default:
        return value ? String(value) : "--";
    }
  }

  return (
    <div className="h-full w-full">
      <div className="relative w-full overflow-x-auto" style={{ height }}>
        <Table>
          <TableHeader className="bg-card sticky top-0">
            <TableRow>
              {config.tableColumns.map(({ column }) => (
                <TableHead key={column} className="text-center">
                  {column}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, i) => (
              <TableRow key={i}>
                {Object.keys(row).map((col) => (
                  <TableCell key={col} className="text-center">
                    {formatValue(
                      row[col],
                      col as unknown as TableWidgetConfig["tableColumns"][number]["column"],
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
