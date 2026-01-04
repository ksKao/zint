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

export const aggregationOptions = [
  "Count",
  "Sum",
  "Average",
  "Max",
  "Min",
] as const;

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
export const categoryFilterOperators = ["One Of"] as const;

export const presetDateFilters = [
  "Today",
  "First Day of This Week",
  "First Day of This Month",
  "First Day of This Quarter",
  "First Day of This Year",
] as const;

export const sortByFieldOptions = ["Ascending", "Descending"] as const;

export const tableWidgetRegularColumns = [
  "Title",
  "Description",
  "Payee",
  "Date",
  "Day",
  "Month",
  "Year",
  "Amount",
  "Balance",
  "Category",
  "Subcategory",
] as const;

export const tableWidgetAggregationColumns = [
  "Sum",
  "Average",
  "Min",
  "Max",
  "Count",
] as const;

const widgetTypeSchema = z.enum(widgetTypes);
const xAxisSchema = z.enum(xAxisOptions, "X Axis is required");
const aggregationOptionSchema = z.enum(
  aggregationOptions,
  "Aggregation function is required",
);
const groupByFieldSchema = z.enum(
  groupByFieldOptions,
  "Group by field is required",
);
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
          ],
          "Invalid field",
        ),
        operator: z.enum(stringFilterOperators, "Invalid operator"),
        value: z
          .string("Filter value is required")
          .min(1, "Filter value is required"),
      }),
      z.object({
        field: z.literal(
          [filterFieldOptionSchema.enum["Category"]],
          "Invalid field",
        ),
        operator: z.enum(categoryFilterOperators, "Invalid operator"),
        value: z.array(
          z.string("Invalid category detected"),
          "Category is required",
        ),
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

const limitSchema = z
  .number("Limit is invalid")
  .min(0, "Limit cannot be negative")
  .default(0);

const baseWidgetSchema = z.object({
  type: widgetTypeSchema,
  filters: z.array(filterSchema),
  convertToAbsolute: z
    .boolean("Convert to absolute toggle is required")
    .default(false),
});

export const barChartSchema = z.object({
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
  sortBy: z.enum(sortByFieldOptions),
  limit: limitSchema,
});

export type BarChartConfig = z.infer<typeof barChartSchema>;

export const lineChartSchema = z.object({
  ...baseWidgetSchema.shape,
  type: z.literal(widgetTypeSchema.enum["Line Chart"]),
  xAxis: xAxisSchema,
  aggregationOption: aggregationOptionSchema,
  groupBy: z
    .object({
      field: groupByFieldSchema,
      isStacked: z.boolean("Stacked is required"),
      lineType: z.literal(["Line", "Area"], "Line chart type is required"),
    })
    .nullable()
    .default(null),
  sortBy: z.enum(sortByFieldOptions),
  limit: limitSchema,
});

export type LineChartConfig = z.infer<typeof lineChartSchema>;

export const pieChartSchema = z.object({
  ...baseWidgetSchema.shape,
  type: z.literal(widgetTypeSchema.enum["Pie Chart"]),
  aggregationOption: aggregationOptionSchema,
  groupByField: z.literal(xAxisOptions, "Group by field is required"),
  sortBy: z.enum(sortByFieldOptions),
  limit: limitSchema,
});

export type PieChartConfig = z.infer<typeof pieChartSchema>;

export const tableWidgetSchema = z.object({
  ...baseWidgetSchema.shape,
  type: z.literal(widgetTypeSchema.enum["Table"]),
  tableColumns: z
    .array(
      z.object(
        {
          column: z.literal(
            [
              ...tableWidgetRegularColumns,
              ...tableWidgetAggregationColumns,
            ] as const,
            "Invalid table column",
          ),
        },
        "Invalid table column",
      ),
      "Table must have at least one column",
    )
    .min(1, "Table must have at least one column")
    .refine(
      (val) =>
        val.map((x) => x.column).length ===
        new Set(val.map((x) => x.column)).size,
      "Duplicate table columns detected",
    ),
  groupByColumns: z
    .array(
      z.object(
        {
          column: z.literal(
            tableWidgetRegularColumns,
            "Invalid group by column",
          ),
        },
        "Invalid group by column",
      ),
    )
    .refine(
      (val) =>
        val.map((x) => x.column).length ===
        new Set(val.map((x) => x.column)).size,
      "Duplicate group by columns detected",
    ),
  sortByColumns: z
    .array(
      z.object({
        column: z.literal(
          [
            ...tableWidgetRegularColumns,
            ...tableWidgetAggregationColumns,
          ] as const,
          "Invalid column",
        ),
        order: z.enum(sortByFieldOptions, "Invalid order option"),
      }),
    )
    .default([]),
  limit: limitSchema,
});

export type TableWidgetConfig = z.infer<typeof tableWidgetSchema>;

export const cardWidgetSchema = z.object({
  ...baseWidgetSchema.shape,
  type: z.literal(widgetTypeSchema.enum["Card"]),
  icon: z.string("Invalid icon").optional(),
  text: z.string("Invalid text").optional().default(""),
  displayValue: z.literal(
    [...tableWidgetRegularColumns, ...tableWidgetAggregationColumns] as const,
    "Invalid display value",
  ),
  sortByColumns: tableWidgetSchema.shape.sortByColumns,
});

export type CardWidgetConfig = z.infer<typeof cardWidgetSchema>;

export const widgetConfigSchema = z.discriminatedUnion(
  "type",
  [
    barChartSchema,
    lineChartSchema,
    pieChartSchema,
    tableWidgetSchema,
    cardWidgetSchema,
  ],
  "Invalid widget type",
);

export type WidgetConfig = z.infer<typeof widgetConfigSchema>;
