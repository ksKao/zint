import { db } from "@/db";
import { categories, subCategories, transactions } from "@/db/schema";
import {
  aggregationOptions,
  groupByFieldOptions,
  presetDateFilters,
  sortByFieldOptions,
  tableWidgetAggregationColumns,
  tableWidgetRegularColumns,
  WidgetConfig,
  xAxisOptions,
} from "@/lib/types/widget.type";
import {
  and,
  avg,
  Column,
  count,
  eq,
  gt,
  gte,
  inArray,
  like,
  lt,
  lte,
  max,
  min,
  not,
  or,
  SQL,
  sql,
  SQLWrapper,
  sum,
} from "drizzle-orm";
import { SQLiteColumn, SQLiteSelect } from "drizzle-orm/sqlite-core";

export const selectMonthSql = sql`strftime('%Y-%m', ${transactions.date}, 'unixepoch', 'localtime')`;
export const selectYearSql = sql`strftime('%Y', ${transactions.date}, 'unixepoch', 'localtime')`;

export function getSelectTransactionQuery({
  select,
  filters,
  orderBy,
}: {
  select: Parameters<typeof db.select>[0];
  filters: WidgetConfig["filters"];
  orderBy: {
    order: (typeof sortByFieldOptions)[number];
    column: SQLiteColumn | SQL | SQL.Aliased;
  }[];
}) {
  let query = db
    .select(select)
    .from(transactions)
    .leftJoin(categories, eq(categories.id, transactions.categoryId))
    .leftJoin(subCategories, eq(subCategories.id, transactions.subCategoryId))
    .$dynamic();

  query = handleFilters(query, filters);

  for (const element of orderBy) {
    query = query.orderBy(
      element.order === "Ascending"
        ? sql`${element.column} asc nulls last`
        : sql`${element.column} desc nulls last`,
    );
  }

  return query;
}

export function getXAxisGroupByColumn(xAxis: (typeof xAxisOptions)[number]) {
  switch (xAxis) {
    case "Date":
      return transactions.date;
    case "Category":
      return transactions.categoryId;
    case "Subcategory":
      return transactions.subCategoryId;
    case "Month":
      return selectMonthSql;
    case "Year":
      return selectYearSql;
    case "Payee":
      return transactions.payee;
  }
}

export function getTransactionXAxisSelectColumn(
  xAxis: (typeof xAxisOptions)[number],
): SQLiteColumn | SQL {
  switch (xAxis) {
    case "Category":
      return categories.name;
    case "Subcategory":
      return subCategories.name;
    case "Date":
      return transactions.date;
    case "Month":
      return selectMonthSql;
    case "Year":
      return selectYearSql;
    case "Payee":
      return transactions.payee;
  }
}

export function getTransactionAggregationOptionSelect(
  aggregationOption: (typeof aggregationOptions)[number],
  absolute: boolean,
): SQL {
  const col: SQLWrapper = absolute
    ? sql`abs(${transactions.amount})`
    : transactions.amount;

  switch (aggregationOption) {
    case "Count":
      return count();
    case "Average":
      return avg(col);
    case "Max":
      return max(col);
    case "Min":
      return min(col);
    case "Sum":
      return sum(col);
  }
}

export function getTransactionGroupBySelect(
  groupByField: (typeof groupByFieldOptions)[number] | undefined,
): SQLiteColumn | SQL | undefined {
  if (!groupByField) return undefined;

  switch (groupByField) {
    case "Category":
      return categories.name;
    case "Month":
      return selectMonthSql;
    case "Year":
      return selectYearSql;
    case "Subcategory":
      return subCategories.name;
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
      return gt(column, value);
    case "After":
      return gte(column, value);
    case "Less Than":
      return lt(column, value);
    case "Before":
      return lte(column, value);
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
  const conditions: SQL<unknown>[] = [];
  for (const filter of filters) {
    let column: Column;
    let filterValue = filter.value;

    switch (filter.field) {
      case "Amount":
        column = transactions.amount;
        break;
      case "Category":
        column = transactions.categoryId;
        break;
      case "Date":
        column = transactions.date;
        if (
          typeof filter.value === "string" &&
          presetDateFilters.includes(
            filter.value as (typeof presetDateFilters)[number],
          )
        ) {
          const targetDate = new Date();
          targetDate.setHours(0, 0, 0, 0); // default target date is today at 00:00
          switch (filter.value) {
            case "Today":
              break;
            case "First Day of This Week":
              targetDate.setDate(
                targetDate.getDate() - ((targetDate.getDay() + 6) % 7),
              );
              break;
            case "First Day of This Month":
              targetDate.setDate(1);
              break;
            case "First Day of This Quarter":
              targetDate.setMonth(
                targetDate.getMonth() - ((targetDate.getMonth() + 1) % 3),
              );
              targetDate.setDate(1);
              break;
            case "First Day of This Year":
              targetDate.setMonth(0);
              targetDate.setDate(1);
          }
          filterValue = targetDate;
        } else if (typeof filter.value === "number") {
          const targetDate = new Date();
          targetDate.setDate(targetDate.getDate() - filter.value);
          targetDate.setHours(0, 0, 0, 0);
          filterValue = targetDate;
        } else {
          filterValue = new Date(filter.value);
        }
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
      filterValue,
    );

    if (filter.reverseFilter) operatorFunction = not(operatorFunction);

    conditions.push(operatorFunction);
  }

  qb = qb.where(and(...conditions, eq(transactions.isTemporary, false)));

  return qb;
}

export function getTableWidgetSelectColumn(
  tableColumn:
    | (typeof tableWidgetRegularColumns)[number]
    | (typeof tableWidgetAggregationColumns)[number],
  convertToAbsolute: boolean,
): SQLiteColumn | SQL | SQL.Aliased {
  switch (tableColumn) {
    case "Count":
    case "Average":
    case "Min":
    case "Max":
    case "Sum":
      return getTransactionAggregationOptionSelect(
        tableColumn,
        convertToAbsolute,
      );
    case "Description":
      return transactions.description;
    case "Balance":
      return transactions.balance;
    case "Title":
      return transactions.title;
    case "Amount":
      return transactions.amount;
    case "Day":
      return sql`${transactions.date}`.as("Day");
    case "Category":
      return sql`${categories.name}`.as("Category");
    case "Subcategory":
      return sql`${subCategories.name}`.as("Subcategory");
    default:
      return getTransactionXAxisSelectColumn(tableColumn);
  }
}

export function getTableWidgetGroupByColumn(
  column: (typeof tableWidgetRegularColumns)[number],
): SQLiteColumn | SQL {
  switch (column) {
    case "Category":
      return transactions.categoryId;
    case "Subcategory":
      return transactions.subCategoryId;
    case "Description":
      return transactions.description;
    case "Balance":
      return transactions.balance;
    case "Title":
      return transactions.title;
    case "Amount":
      return transactions.amount;
    case "Day":
      return transactions.date;
    case "Date":
      return transactions.date;
    case "Month":
      return selectMonthSql;
    case "Year":
      return selectYearSql;
    case "Payee":
      return transactions.payee;
  }
}
