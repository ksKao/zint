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
import { WidgetConfig, xAxisOptions } from "@/lib/types/widget.type";
import { useFormContext } from "react-hook-form";

export default function XAxisSelector() {
  const form = useFormContext<WidgetConfig>();

  return (
    <FormField
      control={form.control}
      name="xAxis"
      render={({ field }) => (
        <FormItem>
          <FormLabel>X Axis</FormLabel>
          <Select value={field.value} onValueChange={field.onChange}>
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
  );
}
