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
  tableWidgetAggregationColumns,
  tableWidgetRegularColumns,
  WidgetConfig,
} from "@/lib/types/widget.type";
import { useFormContext } from "react-hook-form";
import TableOrderConfigForm from "./table-order-config-form";

export default function CardWidgetConfigForm() {
  const form = useFormContext<WidgetConfig>();

  return (
    <>
      <FormField
        control={form.control}
        name="displayValue"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Display Value</FormLabel>
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
      <TableOrderConfigForm />
    </>
  );
}
