import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  getSelectTransactionQuery,
  getTransactionAggregationOptionSelect,
  getTransactionXAxisSelectColumn,
  getXAxisGroupByColumn,
} from "@/lib/query-builder-helpers";
import { queryKeys } from "@/lib/query-keys";
import { PieChartConfig } from "@/lib/types/widget.type";
import { useSuspenseQuery } from "@tanstack/react-query";
import { sql } from "drizzle-orm";
import { Pie, PieChart } from "recharts";

export default function PieWidget({
  config,
  height,
}: {
  config: PieChartConfig;
  height: number;
}) {
  const { data } = useSuspenseQuery({
    queryKey: [queryKeys.transaction, config],
    queryFn: async () => {
      const groupSelectColumn = getTransactionXAxisSelectColumn(
        config.groupByField,
      );

      let query = getSelectTransactionQuery({
        select: {
          group: sql`ifnull(${groupSelectColumn}, 'N/A')`,
          value: getTransactionAggregationOptionSelect(
            config.aggregationOption,
            config.convertToAbsolute,
          ),
        },
        filters: config.filters,
        orderBy: [
          {
            column: groupSelectColumn,
            order: config.sortBy,
          },
        ],
      }).groupBy(getXAxisGroupByColumn(config.groupByField));

      if (config.limit) query = query.limit(config.limit);

      return (await query).map((x, i) => {
        const group = x.group as string;
        return {
          group,
          value: Number(x.value),
          fill: `var(--color-key${i})`,
          key: `key${i}`,
        };
      });
    },
  });
  
  return (
    <div className="h-full max-h-full w-full max-w-full">
      {data.length ? <ChartContainer
        config={
          data.reduce(
            (prev, curr) => {
              prev.obj[curr.key] = {
                label: curr.group,
                color: `var(--chart-${(prev.index % 5) + 1})`,
              };
              return {
                obj: prev.obj,
                index: prev.index + 1,
              };
            },
            { obj: {}, index: 1 } as { obj: ChartConfig; index: number },
          ).obj
        }
        className="w-full"
        style={{ height }}
      >
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Pie data={data} dataKey="value" nameKey="key" />
          <ChartLegend
            content={<ChartLegendContent payload={null} nameKey="key" />}
            className="-translate-y-2 flex-wrap gap-2 *:basis-1/4 *:justify-center"
          />
        </PieChart>
      </ChartContainer> : <div className="w-full h-full flex items-center justify-center text-muted-foreground">
          <span className="text-center">No data available</span>
      </div>}
    </div>
  );
}
