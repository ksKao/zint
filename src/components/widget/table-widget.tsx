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
import { ROW_HEIGHT } from "@/routes/$accountId/_layout";
import { useSuspenseQuery } from "@tanstack/react-query";

export default function TableWidget({
  config,
  layout,
}: {
  config: TableWidgetConfig;
  layout: ReactGridLayout.Layout;
}) {
  const { data } = useSuspenseQuery({
    queryKey: [queryKeys.transaction, config],
    queryFn: async () => {
      let select: Parameters<typeof getSelectTransactionQuery>[0]["select"] =
        {};

      for (const { column } of config.tableColumns) {
        select = { ...select, [column]: getTableWidgetSelectColumn(column) };
      }

      let query = getSelectTransactionQuery({
        filters: config.filters,
        select,
        orderBy: config.sortByColumns.map((x) => ({
          column: getTableWidgetSelectColumn(x.column),
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

  return (
    <div className="h-full w-full">
      <div
        className="relative w-full overflow-x-auto"
        style={{ height: layout.h * ROW_HEIGHT - 41 }}
      >
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
                    {row[col] === null ? "-" : String(row[col])}
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
