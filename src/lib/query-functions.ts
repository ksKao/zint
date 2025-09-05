import { db } from "@/db";
import {
  getTransactionAggregationOptionSelect,
  getTransactionGroupBySelect,
  getTransactionXAxisSelectColumn,
  handleFilters,
  selectMonthSql,
  selectYearSql,
} from "@/lib/query-builder-helpers";
import { eq, SQL, sql } from "drizzle-orm";
import { BarChartConfig, LineChartConfig } from "@/lib/types/widget.type";
import { categories, subCategories, transactions } from "@/db/schema";
import { SQLiteColumn } from "drizzle-orm/sqlite-core";

export async function getLineOrBarChartData(
  config: BarChartConfig | LineChartConfig,
) {
  const xAxisSelectColumn = getTransactionXAxisSelectColumn(config.xAxis);
  const groupBySelect = getTransactionGroupBySelect(config.groupBy?.field);

  let query = db
    .select({
      x: sql`ifnull(${xAxisSelectColumn}, 'N/A')`,
      y: getTransactionAggregationOptionSelect(
        config.aggregationOption,
        config.convertToAbsolute,
      ),
      groupBy: groupBySelect ? sql`ifnull(${groupBySelect}, 'N/A')` : sql`''`,
    })
    .from(transactions)
    .leftJoin(categories, eq(categories.id, transactions.categoryId))
    .leftJoin(subCategories, eq(subCategories.id, transactions.subCategoryId))
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
      groupByColumns.push(transactions.subCategoryId);
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

  query = query.orderBy(
    config.sortBy === "Ascending"
      ? sql`${xAxisSelectColumn} asc nulls last`
      : sql`${xAxisSelectColumn} desc nulls last`,
  );

  const result = await query;

  if (config.groupBy) {
    const allGroupBys = [
      ...new Set(
        result
          .map((item) => (item.groupBy ?? "Unknown") as string)
          .sort((a, b) => a.localeCompare(b)),
      ),
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
    return {
      values: Object.values(grouped).slice(
        0,
        config.limit === 0 ? result.length : config.limit,
      ),
      keys: allGroupBys,
    };
  } else {
    return {
      values: result
        .map((d) => ({ x: d.x, Amount: Number(d.y) }))
        .slice(0, config.limit === 0 ? result.length : config.limit),
      keys: ["Amount"],
    };
  }
}
