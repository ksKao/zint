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
import AggregationSelector from "@/components/widget/forms/aggregation-selector";
import { WidgetConfig, xAxisOptions } from "@/lib/types/widget.type";
import { useFormContext } from "react-hook-form";

export default function PieChartConfigForm() {
  const form = useFormContext<WidgetConfig>();

  return (
    <>
      <AggregationSelector />
      <FormField
        control={form.control}
        name="groupByField"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Group By</FormLabel>
            <Select
              value={field.value}
              onValueChange={(val) => field.onChange(val)}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a field" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {xAxisOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
