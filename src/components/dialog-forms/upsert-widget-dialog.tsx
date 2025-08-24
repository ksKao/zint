import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
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
import BarChartConfigForm from "@/components/widget/forms/bar-chart-config-form";
import FilterListForm from "@/components/widget/forms/filter-list-form";
import LineChartConfigForm from "@/components/widget/forms/line-chart-config-form";
import { Widget, widgetSchema, widgetTypes } from "@/lib/types/widget.type";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { create } from "zustand";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { cn } from "@/lib/utils";
import { ArrowDownAZIcon, ArrowUpAZIcon, Circle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/db";
import { widgets } from "@/db/schema";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";

type UpsertWidgetDialogState = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

export const useUpsertWidgetDialog = create<UpsertWidgetDialogState>()(
  (set) => ({
    open: false,
    setOpen: (open) => set({ open }),
  }),
);

export default function UpsertWidgetDialog({
  accountId,
}: {
  accountId: string;
}) {
  const { open, setOpen } = useUpsertWidgetDialog();
  const form = useForm({
    resolver: zodResolver(widgetSchema),
    defaultValues: {
      name: "",
      type: "Bar Chart",
      limit: 0,
      sortBy: "Ascending",
      filters: [],
    },
  });
  const queryClient = useQueryClient();
  const { mutate: addWidget, isPending } = useMutation({
    mutationFn: async (value: Widget) => {
      await db.insert(widgets).values({
        name: value.name,
        accountId,
        width: 2,
        height: 2,
        x: 0,
        y: 0,
        config: value,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [queryKeys.widget],
      });
      toast.success("Widget has been added successfully");
      setOpen(false);
    },
    onError: () => {
      toast.error("An error occurred while trying to create widget.");
    },
  });

  const selectedWidgetType = form.watch("type");

  const chartSpecificFields = useMemo(() => {
    switch (selectedWidgetType) {
      case "Bar Chart":
        return <BarChartConfigForm />;
      case "Line Chart":
        return <LineChartConfigForm />;
    }
  }, [selectedWidgetType]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-2xl">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => addWidget(data))}
            className="space-y-4"
          >
            <DialogHeader>
              <DialogTitle>Add Widget</DialogTitle>
              <DialogDescription>Create a new widget</DialogDescription>
            </DialogHeader>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <Input {...field} placeholder="Name" />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Widget Type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a widget type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {widgetTypes.map((widgetType) => (
                        <SelectItem value={widgetType} key={widgetType}>
                          {widgetType}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {chartSpecificFields}
            <FilterListForm />
            <FormField
              control={form.control}
              name="sortBy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sort</FormLabel>
                  <FormControl className="grid grid-cols-2 gap-2">
                    <RadioGroup.Root
                      value={field.value}
                      onValueChange={field.onChange}
                    >
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
            <FormField
              control={form.control}
              name="limit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Limit</FormLabel>
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
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button loading={isPending}>Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
