import {
  getSelectTransactionQuery,
  getTableWidgetSelectColumn,
} from "@/lib/query-builder-helpers";
import { queryKeys } from "@/lib/query-keys";
import { CardWidgetConfig } from "@/lib/types/widget.type";
import { useSuspenseQuery } from "@tanstack/react-query";

export default function CardWidget({
  config,
  height,
}: {
  config: CardWidgetConfig;
  height: number;
}) {
  const { data } = useSuspenseQuery({
    queryKey: [queryKeys.transaction, config],
    queryFn: async () => {
      let query = getSelectTransactionQuery({
        filters: config.filters,
        orderBy: config.sortByColumns.map((x) => ({
          column: getTableWidgetSelectColumn(
            x.column,
            config.convertToAbsolute,
          ),
          order: x.order,
        })),
        select: {
          value: getTableWidgetSelectColumn(
            config.displayValue,
            config.convertToAbsolute,
          ),
        },
      });

      query = query.limit(1);

      return (await query)[0] as { value: string | number | null } | undefined;
    },
  });

  return (
    <div
      className="flex h-full w-full items-center justify-center overflow-hidden"
      style={{ fontSize: Math.max(16, height - 42) }}
    >
      {data?.value ?? "--"}
    </div>
  );
}
