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
import { Switch } from "@/components/ui/switch";
import { groupByFieldOptions, WidgetConfig } from "@/lib/types/widget.type";
import { ChartColumnBig, ChartColumnStacked } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useFormContext } from "react-hook-form";
import AggregationSelector from "./aggregation-selector";
import IsStackedToggle from "./is-stacked-toggle";
import XAxisSelector from "./x-axis-selector";

export default function BarChartConfigForm() {
  const form = useFormContext<WidgetConfig>();

  const groupBy = form.watch("groupBy");

  return (
    <>
      <XAxisSelector />
      <AggregationSelector />
      <div className="space-y-4 rounded-md border p-3">
        <div className="flex items-center justify-between">
          <FormLabel className="font-normal">Enable grouping</FormLabel>
          <FormControl>
            <Switch
              checked={!!groupBy}
              onCheckedChange={(checked) => {
                if (checked)
                  form.setValue("groupBy", {
                    field: "Category",
                    isStacked: false,
                  });
                else form.setValue("groupBy", null);
              }}
            />
          </FormControl>
        </div>
        <AnimatePresence>
          {groupBy && (
            <motion.div
              initial="collapsed"
              animate="open"
              exit="collapsed"
              variants={{
                open: { height: "auto" },
                collapsed: { height: 0 },
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="space-y-4 overflow-y-hidden"
            >
              <FormField
                control={form.control}
                name="groupBy.field"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a field" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {groupByFieldOptions.map((option) => (
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
              <IsStackedToggle
                groupIcon={ChartColumnBig}
                stackIcon={ChartColumnStacked}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
