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
import { IconName, IconPicker } from "@/components/ui/icon-picker";
import { Input } from "@/components/ui/input";

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
      <FormField
        control={form.control}
        name="icon"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Icon</FormLabel>
            <IconPicker
              modal
              value={field.value as IconName}
              onValueChange={(val) => {
                field.onChange(val);
              }}
            />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="text"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Text</FormLabel>
            <Input
              {...field}
              value={field.value ?? ""}
              placeholder="Card Text"
            />
          </FormItem>
        )}
      />
      <TableOrderConfigForm />
    </>
  );
}
