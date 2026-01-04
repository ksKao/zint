import {
  getSelectTransactionQuery,
  getTableWidgetSelectColumn,
} from "@/lib/query-builder-helpers";
import { queryKeys } from "@/lib/query-keys";
import { CardWidgetConfig } from "@/lib/types/widget.type";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Icon, IconName } from "../ui/icon-picker";

export default function CardWidget({ config }: { config: CardWidgetConfig }) {
  const { data } = useSuspenseQuery({
    queryKey: [queryKeys.transaction, config],
    queryFn: async () => {
      let select: Parameters<typeof getSelectTransactionQuery>[0]["select"] = {
        value: getTableWidgetSelectColumn(
          config.displayValue,
          config.convertToAbsolute,
        ),
      };

      for (const col of config.sortByColumns) {
        select = {
          ...select,
          [col.column]: getTableWidgetSelectColumn(
            col.column,
            config.convertToAbsolute,
          ),
        };
      }

      let query = getSelectTransactionQuery({
        select,
        filters: config.filters,
        orderBy: config.sortByColumns.map((x) => ({
          column: getTableWidgetSelectColumn(
            x.column,
            config.convertToAbsolute,
          ),
          order: x.order,
        })),
      });

      query = query.limit(1);

      return (await query)[0] as { value: string | number | null } | undefined;
    },
  });

  return (
    <div className="flex h-full w-full items-center justify-center overflow-hidden">
      <div className="flex max-h-full max-w-full flex-col gap-2 overflow-hidden p-4">
        <div className="flex w-fit items-center gap-4">
          <div className="rounded-md border p-2">
            {config.icon ? (
              <Icon
                name={
                  config.icon
                    ? (config.icon as IconName)
                    : "circle-question-mark"
                }
                className="min-h-4 min-w-4"
              />
            ) : null}
          </div>
          <p>{config.text || "--"}</p>
        </div>
        <p className="w-fit text-2xl">
          {typeof data?.value === "number"
            ? data.value.toFixed(2)
            : (data?.value ?? "--")}
        </p>
      </div>
    </div>
  );
}
