import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  sortByFieldOptions,
  tableWidgetAggregationColumns,
  tableWidgetRegularColumns,
  WidgetConfig,
} from "@/lib/types/widget.type";
import { Plus, XIcon } from "lucide-react";
import { useFieldArray, useFormContext, useFormState } from "react-hook-form";

export default function TableOrderConfigForm() {
  const form = useFormContext<WidgetConfig>();
  const sortByColumnValue = useFieldArray({
    control: form.control,
    name: "sortByColumns",
  });
  const formState = useFormState();

  const { invalid: sortByColumnsInvalid, error: sortByColumnsError } =
    form.getFieldState("sortByColumns", formState);

  const availableSortByColumns = [
    ...tableWidgetRegularColumns,
    ...tableWidgetAggregationColumns,
  ].filter((x) => !sortByColumnValue.fields.find((y) => y.column === x));

  return (
    <div
      className={`w-full rounded-md border p-3 ${sortByColumnsInvalid ? "border-destructive" : ""}`}
    >
      <div className="flex items-center justify-between">
        <p className="font-normal">Sort By</p>
        {availableSortByColumns.length > 0 ? (
          <Button
            size="icon"
            variant="outline"
            type="button"
            onClick={() => {
              sortByColumnValue.append({
                column: availableSortByColumns[0],
                order: "Ascending",
              });
            }}
          >
            <Plus />
          </Button>
        ) : null}
      </div>
      <ul
        className={`space-y-4 ${sortByColumnValue.fields.length ? "mt-4" : ""}`}
      >
        {sortByColumnValue.fields.map((field, i) => (
          <li key={field.id} className="flex items-center gap-2">
            <FormField
              control={form.control}
              name={`sortByColumns.${i}.column` as const}
              render={({ field }) => (
                <FormItem className="grow">
                  <FormLabel>Column</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a column" />
                        </SelectTrigger>
                      </FormControl>
                    </div>
                    <SelectContent>
                      {[
                        ...tableWidgetRegularColumns,
                        ...tableWidgetAggregationColumns,
                      ].map((col) => (
                        <SelectItem
                          value={col}
                          key={col}
                          disabled={!availableSortByColumns.includes(col)}
                        >
                          {col}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`sortByColumns.${i}.order` as const}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <SelectTrigger className="w-36">
                          <SelectValue placeholder="Select an order" />
                        </SelectTrigger>
                      </FormControl>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => sortByColumnValue.remove(i)}
                      >
                        <XIcon />
                      </Button>
                    </div>
                    <SelectContent>
                      {sortByFieldOptions.map((col) => (
                        <SelectItem value={col} key={col}>
                          {col}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </li>
        ))}
      </ul>
      {sortByColumnsError?.root?.message ? (
        <FormMessage className="mt-2">
          {sortByColumnsError.root.message}
        </FormMessage>
      ) : null}
    </div>
  );
}
