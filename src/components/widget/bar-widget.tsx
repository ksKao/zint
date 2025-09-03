import { db } from "@/db";
import { categories, subCategories, transactions } from "@/db/schema";
import {
  getTransactionAggregationOptionSelect,
  getTransactionGroupBySelect,
  getTransactionXAxisSelect,
  handleFilters,
  selectMonthSql,
  selectYearSql,
} from "@/lib/query-builder-helpers";
import { queryKeys } from "@/lib/query-keys";
import { barChartSchema } from "@/lib/types/widget.type";
import { useSuspenseQuery } from "@tanstack/react-query";
import { eq, SQL } from "drizzle-orm";
import { SQLiteColumn } from "drizzle-orm/sqlite-core";
import z from "zod/v4";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import ReactGridLayout from "react-grid-layout";
import { ROW_HEIGHT } from "@/routes/$accountId/_layout";

export default function BarWidget({
  config,
  layout,
}: {
  config: z.infer<typeof barChartSchema>;
  layout: ReactGridLayout.Layout;
}) {
  const { data } = useSuspenseQuery({
    queryKey: [queryKeys.transaction, config],
    queryFn: async () => {
      let query = db
        .select({
          ...getTransactionXAxisSelect(config.xAxis),
          ...getTransactionAggregationOptionSelect(config.aggregationOption),
          ...getTransactionGroupBySelect(config?.groupBy?.field),
        })
        .from(transactions)
        .leftJoin(categories, eq(categories.id, transactions.categoryId))
        .leftJoin(
          subCategories,
          eq(subCategories.id, transactions.subCategoryId),
        )
        .$dynamic();

      const groupByColumns: (SQLiteColumn | SQL)[] = [];
      switch (config.xAxis) {
        case "Date":
          groupByColumns.push(transactions.date);
          break;
        case "Category":
          groupByColumns.push(transactions.categoryId);
          break;
        case "Subcategory":
          groupByColumns.push(transactions.categoryId);
          break;
        case "Month":
          groupByColumns.push(selectMonthSql);
          break;
        case "Year":
          groupByColumns.push(selectYearSql);
          break;
        case "Payee":
          groupByColumns.push(transactions.payee);
          break;
      }

      if (config.groupBy) {
        switch (config.groupBy.field) {
          case "Category":
            groupByColumns.push(transactions.categoryId);
            break;
          case "Subcategory":
            groupByColumns.push(transactions.subCategoryId);
            break;
          case "Month":
            groupByColumns.push(selectMonthSql);
            break;
          case "Year":
            groupByColumns.push(selectYearSql);
            break;
        }
      }

      query = query.groupBy(...groupByColumns);

      query = handleFilters(query, config.filters);

      const result = await query;

      if (config.groupBy) {
        const allGroupBys = [
          ...new Set(result.map((item) => item.groupBy as string)),
        ];

        // Step 2: Group by `x`
        const grouped: Record<
          string,
          {
            x: string | null;
            [key: string]: string | number | null;
          }
        > = {};

        result.forEach(({ x, y, groupBy }) => {
          const key = String(x === null ? "Unknown" : x);
          const groupByStr = String(groupBy);

          if (!grouped[key]) {
            grouped[key] = { x: key };
            allGroupBys.forEach((groupByKey) => {
              if (typeof groupByKey === "string") grouped[key][groupByKey] = 0; // default value
            });
          }

          grouped[key][groupByStr] = Number(y);
        });

        // Step 3: Convert object back to array
        return { values: Object.values(grouped), keys: allGroupBys };
      } else {
        return { values: result, keys: ["y"] };
      }
    },
  });

  return (
    <div className="h-full max-h-full w-full max-w-full">
      <ChartContainer
        config={data.keys.reduce((prev, curr) => {
          prev[curr] = { label: curr };
          return prev;
        }, {} as ChartConfig)}
        className="w-full"
        style={{ height: ROW_HEIGHT * layout.h - 41 }} // 41 is the height of the header
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
            content={<ChartTooltipContent indicator="dashed" />}
          />
          {data.keys.map((key, i) => (
            <Bar key={key} dataKey={key} fill={`var(--chart-${(i + 1) % 5})`} />
          ))}
        </BarChart>
      </ChartContainer>
    </div>
  );
}
