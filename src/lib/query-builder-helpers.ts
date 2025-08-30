import { db } from "@/db";
import {
  xAxisOptions,
  aggregationOptions,
  WidgetConfig,
} from "@/lib/types/widget.type";
import { categories, subCategories, transactions } from "@/db/schema";
import {
  avg,
  Column,
  count,
  eq,
  gt,
  inArray,
  like,
  lt,
  max,
  min,
  not,
  or,
  SQL,
  sql,
  sum,
} from "drizzle-orm";
import { SQLiteSelect } from "drizzle-orm/sqlite-core";

export function getTransactionXAxisSelect(
  xAxis: (typeof xAxisOptions)[number],
): Parameters<typeof db.select>[0] {
  switch (xAxis) {
    case "Category":
      return { x: categories.name };
    case "Subcategory":
      return { x: subCategories.name };
    case "Date":
      return { x: transactions.date };
    case "Month":
      return {
        x: sql`strftime('%Y-%m', ${transactions.date}, 'unixepoch', 'localtime')`,
      };
    case "Year":
      return {
        x: sql`strftime('%Y', ${transactions.date}, 'unixepoch', 'localtime')`,
      };
    case "Payee":
      return { x: transactions.payee };
  }
}

export function getTransactionAggregationOptionSelect(
  aggregationOption: (typeof aggregationOptions)[number],
): Parameters<typeof db.select>[0] {
  switch (aggregationOption) {
    case "Count":
      return { y: count() };
    case "Average":
      return { y: avg(transactions.amount) };
    case "Max":
      return { y: max(transactions.amount) };
    case "Min":
      return { y: min(transactions.amount) };
    case "Sum":
      return { y: sum(transactions.amount) };
  }
}

function getOperatorFunction(
  column: Column,
  operator: WidgetConfig["filters"][number]["operator"],
  value: WidgetConfig["filters"][number]["value"],
): SQL {
  switch (operator) {
    case "Equals":
      return eq(column, value);
    case "Greater Than":
    case "After":
      return gt(column, value);
    case "Less Than":
    case "Before":
      return lt(column, value);
    case "Includes":
      return like(column, value.toString());
    case "One Of": {
      if (!Array.isArray(value))
        throw new Error("Invalid category filter value");

      const sqlRes = or(
        inArray(column, value),
        inArray(transactions.subCategoryId, value),
      );

      if (!sqlRes) throw new Error("Could not filter by category");
      return sqlRes;
    }
  }
}

export function handleFilters<T extends SQLiteSelect>(
  qb: T,
  filters: WidgetConfig["filters"],
): T {
  for (const filter of filters) {
    let column: Column;
    switch (filter.field) {
      case "Amount":
        column = transactions.amount;
        break;
      case "Category":
        column = transactions.categoryId;
        break;
      case "Date":
        column = transactions.date;
        break;
      case "Description":
        column = transactions.description;
        break;
      case "Payee":
        column = transactions.payee;
        break;
      case "Title":
        column = transactions.title;
        break;
    }

    let operatorFunction = getOperatorFunction(
      column,
      filter.operator,
      filter.value,
    );

    if (filter.reverseFilter) operatorFunction = not(operatorFunction);

    qb = qb.where(operatorFunction);
  }

  return qb;
}
