import { z } from "zod";

const widgetType = z.enum([
  "Bar Chart",
  "Line Chart",
  "Pie Chart",
  "Table",
  "Card",
]);

const xSelectorSchema = z.object({
  column: z.literal(["date", "month", "year", "category", "sub_category"]),
});

const barChartSchema = z.object({
  type: widgetType.enum["Bar Chart"],
  xSelector: xSelectorSchema,
});

const lineChartSchema = z.object({
  type: widgetType.enum["Line Chart"],
  xSelector: xSelectorSchema,
});

export const widgetSchema = z.discriminatedUnion("type", [
  barChartSchema,
  lineChartSchema,
]);
