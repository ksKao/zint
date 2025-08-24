import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Widget } from "@/lib/types/widget.type";
import { cn } from "@/lib/utils";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { Circle, LucideProps } from "lucide-react";
import { ComponentType } from "react";
import { useFormContext } from "react-hook-form";

export default function IsStackedToggle({
  groupIcon: GroupIcon,
  stackIcon: StackIcon,
}: {
  groupIcon: ComponentType<LucideProps>;
  stackIcon: ComponentType<LucideProps>;
}) {
  const form = useFormContext<Widget>();

  return (
    <FormField
      control={form.control}
      name="groupBy.isStacked"
      render={({ field }) => (
        <FormItem>
          <FormControl className="grid grid-cols-2 gap-2 overflow-visible p-1">
            <RadioGroup.Root
              value={field.value ? "stacked" : "grouped"}
              onValueChange={(val) => field.onChange(val === "stacked")}
            >
              <FormItem>
                <FormControl>
                  <RadioGroup.Item
                    value="grouped"
                    className={cn(
                      "group ring-border relative flex items-center gap-2 rounded p-2 px-4 text-start ring-[1px]",
                      "data-[state=checked]:ring-primary data-[state=checked]:ring-2",
                    )}
                  >
                    <Circle
                      className={`${field.value ? "" : "fill-primary"} text-muted-foreground`}
                      size={16}
                    />
                    <GroupIcon className="text-muted-foreground" size={20} />
                    <FormLabel>Grouped</FormLabel>
                  </RadioGroup.Item>
                </FormControl>
              </FormItem>
              <FormItem>
                <FormControl>
                  <RadioGroup.Item
                    value="stacked"
                    className={cn(
                      "group ring-border relative flex items-center gap-2 rounded p-2 px-4 text-start ring-[1px]",
                      "data-[state=checked]:ring-primary data-[state=checked]:ring-2",
                    )}
                  >
                    <Circle
                      className={`${field.value ? "fill-primary" : ""} text-muted-foreground`}
                      size={16}
                    />
                    <StackIcon className="text-muted-foreground" size={20} />
                    <FormLabel>Stacked</FormLabel>
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
  return;
}
