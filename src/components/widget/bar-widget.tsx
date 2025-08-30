import { db } from "@/db";
import { categories, subCategories, transactions } from "@/db/schema";
import {
  getTransactionAggregationOptionSelect,
  getTransactionXAxisSelect,
  handleFilters,
} from "@/lib/query-builder-helpers";
import { queryKeys } from "@/lib/query-keys";
import { barChartSchema } from "@/lib/types/widget.type";
import { useSuspenseQuery } from "@tanstack/react-query";
import { eq, sql } from "drizzle-orm";
import z from "zod/v4";

export default function BarWidget({
  config,
}: {
  config: z.infer<typeof barChartSchema>;
}) {
  const { data } = useSuspenseQuery({
    queryKey: [queryKeys.transaction, config],
    queryFn: async () => {
      let query = db
        .select({
          ...getTransactionXAxisSelect(config.xAxis),
          ...getTransactionAggregationOptionSelect(config.aggregationOption),
        })
        .from(transactions)
        .leftJoin(categories, eq(categories.id, transactions.categoryId))
        .leftJoin(
          subCategories,
          eq(subCategories.id, transactions.subCategoryId),
        )
        .$dynamic();

      switch (config.xAxis) {
        case "Date":
          query = query.groupBy(transactions.date);
          break;
        case "Category":
          query = query.groupBy(transactions.categoryId);
          break;
        case "Subcategory":
          query = query.groupBy(transactions.subCategoryId);
          break;
        case "Month":
          query = query.groupBy(
            sql`strftime('%Y-%m', ${transactions.date}, 'unixepoch', 'localtime')`,
          );
          break;
        case "Year":
          query = query.groupBy(
            sql`strftime('%Y', ${transactions.date}, 'unixepoch', 'localtime')`,
          );
          break;
        case "Payee":
          query = query.groupBy(transactions.payee);
          break;
      }

      query = handleFilters(query, config.filters);

      return await query;
    },
  });

  return (
    <pre className="break-all whitespace-normal">{JSON.stringify(data)}</pre>
  );
}
