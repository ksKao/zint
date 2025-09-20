import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { getLineOrBarChartData } from "@/lib/query-functions";
import { queryKeys } from "@/lib/query-keys";
import type { LineChartConfig } from "@/lib/types/widget.type";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
} from "recharts";

export default function LineWidget({
  config,
  height,
}: {
  config: LineChartConfig;
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
        {config.groupBy?.lineType !== "Area" ? (
          <LineChart accessibilityLayer data={data.values}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="x"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            {data.keys.map((key, i) => (
              <Line
                key={key}
                dataKey={key}
                type="monotone"
                stroke={`var(--chart-${(i + 1) % 5})`}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        ) : (
          <AreaChart accessibilityLayer data={data.values}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="x"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            {data.keys.map((key, i) => (
              <Area
                key={key}
                dataKey={key}
                type="monotone"
                fill={`var(--chart-${(i + 1) % 5})`}
                fillOpacity={0.4}
                stroke={`var(--chart-${(i + 1) % 5})`}
                strokeWidth={2}
                dot={false}
                stackId={config.groupBy?.isStacked ? 0 : i}
              />
            ))}
          </AreaChart>
        )}
      </ChartContainer>
    </div>
  );
}
