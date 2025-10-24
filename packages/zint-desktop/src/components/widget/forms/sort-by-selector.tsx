import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { WidgetConfig } from "@/lib/types/widget.type";
import { useFormContext } from "react-hook-form";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { cn } from "@/lib/utils";
import { ArrowDownAZIcon, ArrowUpAZIcon, Circle } from "lucide-react";

export default function SortBySelector() {
  const form = useFormContext<WidgetConfig>();

  return (
    <FormField
      control={form.control}
      name="sortBy"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Sort</FormLabel>
          <FormControl className="grid grid-cols-2 gap-2">
            <RadioGroup.Root value={field.value} onValueChange={field.onChange}>
              <FormItem>
                <FormControl>
                  <RadioGroup.Item
                    value="Ascending"
                    className={cn(
                      "group ring-border relative flex items-center gap-2 rounded p-2 px-4 text-start ring-[1px]",
                      "data-[state=checked]:ring-primary data-[state=checked]:ring-2",
                    )}
                  >
                    <Circle
                      className={`${field.value === "Ascending" ? "fill-primary" : ""} text-muted-foreground`}
                      size={16}
                    />
                    <ArrowDownAZIcon
                      className="text-muted-foreground"
                      size={20}
                    />
                    <FormLabel>Ascending</FormLabel>
                  </RadioGroup.Item>
                </FormControl>
              </FormItem>
              <FormItem>
                <FormControl>
                  <RadioGroup.Item
                    value="Descending"
                    className={cn(
                      "group ring-border relative flex items-center gap-2 rounded p-2 px-4 text-start ring-[1px]",
                      "data-[state=checked]:ring-primary data-[state=checked]:ring-2",
                    )}
                  >
                    <Circle
                      className={`${field.value === "Descending" ? "fill-primary" : ""} text-muted-foreground`}
                      size={16}
                    />
                    <ArrowUpAZIcon
                      className="text-muted-foreground"
                      size={20}
                    />
                    <FormLabel>Descending</FormLabel>
                  </RadioGroup.Item>
                </FormControl>
              </FormItem>
            </RadioGroup.Root>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
