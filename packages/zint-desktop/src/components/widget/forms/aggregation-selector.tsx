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
import { aggregationOptions, WidgetConfig } from "@/lib/types/widget.type";
import { useFormContext } from "react-hook-form";

export default function AggregationSelector() {
  const form = useFormContext<WidgetConfig>();

  return (
    <FormField
      control={form.control}
      name="aggregationOption"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Aggregation Function</FormLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an aggregation function" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {aggregationOptions.map((option) => (
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
  );
}
