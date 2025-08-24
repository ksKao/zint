import { z } from "zod";

export const widgetTypes = [
  "Bar Chart",
  "Line Chart",
  "Pie Chart",
  "Table",
  "Card",
] as const;

export const xAxisOptions = [
  "Date",
  "Month",
  "Year",
  "Category",
  "Subcategory",
  "Payee",
] as const;

export const groupByFieldOptions = [
  "Month",
  "Year",
  "Category",
  "Subcategory",
] as const;

export const aggregationOptions = ["Count", "Sum", "Average", "Max", "Min"];

export const filterFieldOptions = [
  "Title",
  "Description",
  "Date",
  "Payee",
  "Amount",
  "Category",
] as const;

export const stringFilterOperators = ["Includes", "Equals"] as const;
export const numberFilterOperators = [
  "Less Than",
  "Equals",
  "Greater Than",
] as const;
export const dateFilterOperators = ["Before", "Equals", "After"] as const;

export const presetDateFilters = [
  "Today",
  "This Week",
  "This Month",
  "This Quarter",
  "This Year",
];

export const sortByFieldOptions = ["Ascending", "Descending"] as const;

const widgetTypeSchema = z.enum(widgetTypes);
const xAxisSchema = z.enum(xAxisOptions, "X Axis is required");
const aggregationOptionSchema = z.enum(
  aggregationOptions,
  "Aggregation function is required",
);
const groupByFieldSchema = z.enum(groupByFieldOptions);
const filterFieldOptionSchema = z.enum(filterFieldOptions);

const baseFilterSchema = z.object({
  reverseFilter: z.boolean(),
});

const filterSchema = z
  .discriminatedUnion(
    "field",
    [
      z.object({
        field: z.literal(
          [
            filterFieldOptionSchema.enum["Title"],
            filterFieldOptionSchema.enum["Description"],
            filterFieldOptionSchema.enum["Payee"],
            filterFieldOptionSchema.enum["Category"],
          ],
          "Invalid field",
        ),
        operator: z.enum(stringFilterOperators, "Invalid operator"),
        value: z
          .string("Filter value is required")
          .min(1, "Filter value is required"),
      }),
      z.object(
        {
          field: z.literal(
            [filterFieldOptionSchema.enum["Date"]],
            "Invalid field",
          ),
          operator: z.enum(dateFilterOperators, "Invalid operator"),
          value: z.union(
            [
              z.literal(presetDateFilters, "Invalid date filter value"),
              z.preprocess((arg) => {
                if (typeof arg === "string" && arg === "") return undefined;
                return arg;
              }, z.coerce.number("Invalid date filter value")),
              z.coerce.date("Invalid date filter value"),
            ],
            "Invalid filter value",
          ),
        },
        "Invalid filter",
      ),
      z.object(
        {
          field: z.literal(
            [filterFieldOptionSchema.enum["Amount"]],
            "Invalid field",
          ),
          operator: z.enum(numberFilterOperators, "Invalid operator"),
          value: z.preprocess((arg) => {
            if (typeof arg === "string" && arg === "") return undefined;
            return arg;
          }, z.coerce.number("Invalid filter value")),
        },
        "Invalid filter",
      ),
    ],
    "Invalid field",
  )
  .and(baseFilterSchema);

const baseWidgetSchema = z.object({
  type: widgetTypeSchema,
  name: z.string("Widget name is required").min(1, "Widget name is required"),
  filters: z.array(filterSchema),
  sortBy: z.enum(sortByFieldOptions),
  limit: z
    .number("Limit is invalid")
    .min(0, "Limit cannot be negative")
    .default(0),
});

const barChartSchema = z.object({
  ...baseWidgetSchema.shape,
  type: z.literal(widgetTypeSchema.enum["Bar Chart"]),
  xAxis: xAxisSchema,
  aggregationOption: aggregationOptionSchema,
  groupBy: z
    .object({
      field: groupByFieldSchema,
      isStacked: z.boolean("Stacked is required"),
    })
    .nullable()
    .default(null),
});

const lineChartSchema = z.object({
  ...baseWidgetSchema.shape,
  type: z.literal(widgetTypeSchema.enum["Line Chart"]),
  xAxis: xAxisSchema,
  aggregationOption: aggregationOptionSchema,
  groupBy: z
    .object({
      field: groupByFieldSchema,
      lineType: z.discriminatedUnion("type", [
        z.object({ type: z.literal("Line") }),
        z.object({
          type: z.literal("Area"),
          isStacked: z.boolean("Stacked is required"),
        }),
      ]),
    })
    .nullable()
    .default(null),
});

export const widgetSchema = z.discriminatedUnion(
  "type",
  [barChartSchema, lineChartSchema],
  "Invalid widget type",
);

export type Widget = z.infer<typeof widgetSchema>;
