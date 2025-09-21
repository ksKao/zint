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
  tableWidgetRegularColumns,
  WidgetConfig,
} from "@/lib/types/widget.type";
import { Plus, XIcon } from "lucide-react";
import { useFieldArray, useFormContext, useFormState } from "react-hook-form";

export default function TableGroupByConfigForm() {
  const form = useFormContext<WidgetConfig>();

  const groupByColumnValue = useFieldArray({
    control: form.control,
    name: "groupByColumns",
  });

  const formState = useFormState();
  const { invalid: groupByColumnsInvalid, error: groupByColumnsError } =
    form.getFieldState("groupByColumns", formState);

  const availableGroupByColumns = tableWidgetRegularColumns.filter(
    (c) => !(groupByColumnValue.fields ?? []).find((x) => x.column === c),
  );

  return (
    <div
      className={`w-full rounded-md border p-3 ${groupByColumnsInvalid ? "border-destructive" : ""}`}
    >
      <div className="flex items-center justify-between">
        <p className="font-normal">Group By</p>
        {availableGroupByColumns.length > 0 ? (
          <Button
            size="icon"
            variant="outline"
            type="button"
            onClick={() => {
              groupByColumnValue.append({
                column: availableGroupByColumns[0],
              });
            }}
          >
            <Plus />
          </Button>
        ) : null}
      </div>
      <ul
        className={`space-y-4 ${groupByColumnValue.fields.length ? "mt-4" : ""}`}
      >
        {groupByColumnValue.fields.map((field, i) => (
          <li key={field.id} className="flex items-center gap-2">
            <FormField
              control={form.control}
              name={`groupByColumns.${i}.column` as const}
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
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => groupByColumnValue.remove(i)}
                      >
                        <XIcon />
                      </Button>
                    </div>
                    <SelectContent>
                      {tableWidgetRegularColumns.map((col) => (
                        <SelectItem
                          value={col}
                          key={col}
                          disabled={!availableGroupByColumns.includes(col)}
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
          </li>
        ))}
      </ul>
      {groupByColumnsError?.root?.message ? (
        <FormMessage className="mt-2">
          {groupByColumnsError.root.message}
        </FormMessage>
      ) : null}
    </div>
  );
}
