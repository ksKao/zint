import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { getLineOrBarChartData } from "@/lib/query-functions";
import { queryKeys } from "@/lib/query-keys";
import type { BarChartConfig } from "@/lib/types/widget.type";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

export default function BarWidget({
  config,
  height,
}: {
  config: BarChartConfig;
  height: number;
}) {
  const { data } = useSuspenseQuery({
    queryKey: [queryKeys.transaction, config],
    queryFn: async () => {
      return await getLineOrBarChartData(config);
    },
  });

  return (
    <div className="h-full max-h-full w-full max-w-full p-4">
      <ChartContainer
        config={data.keys.reduce((prev, curr) => {
          prev[curr] = { label: curr };
          return prev;
        }, {} as ChartConfig)}
        className="w-full"
        style={{ height: height - 32 }} // -32 for the padding
      >
        <BarChart accessibilityLayer data={data.values}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="x"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="line" />}
          />
          {data.keys.map((key, i) => (
            <Bar
              key={key}
              dataKey={key}
              fill={`var(--chart-${(i + 1) % 5})`}
              stackId={config.groupBy?.isStacked ? 0 : i}
            />
          ))}
        </BarChart>
      </ChartContainer>
    </div>
  );
}
