import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { WidgetConfig } from "@/lib/types/widget.type";
import { useFormContext } from "react-hook-form";

export default function LimitInput() {
  const form = useFormContext<WidgetConfig>();

  return (
    <FormField
      control={form.control}
      name="limit"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Limit (Enter 0 to remove limit)</FormLabel>
          <Input
            placeholder="Limit"
            type="number"
            value={field.value}
            onChange={(e) => field.onChange(e.target.valueAsNumber)}
          />
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
