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
import { Input } from "@/components/ui/input";
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
import { db } from "@/db";
import { widgets } from "@/db/schema";
import { queryKeys } from "@/lib/query-keys";
import { widgetConfigSchema, widgetTypes } from "@/lib/types/widget.type";
import { cn } from "@/lib/utils";
import { MAX_COLS } from "@/routes/$accountId/_layout";
import { zodResolver } from "@hookform/resolvers/zod";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { eq } from "drizzle-orm";
import { ArrowDownAZIcon, ArrowUpAZIcon, Circle } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod/v4";
import { create } from "zustand";

type UpsertWidgetDialogState = {
  open: boolean;
  setOpen: (open: boolean) => void;
  editingWidget?: typeof widgets.$inferSelect;
  setEditingWidget: (widget: typeof widgets.$inferSelect | undefined) => void;
};

export const useUpsertWidgetDialog = create<UpsertWidgetDialogState>()(
  (set) => ({
    open: false,
    setOpen: (open) => set({ open }),
    setEditingWidget: (widget) => set({ editingWidget: widget }),
  }),
);

const widgetConfigSchemaFull = z.intersection(
  widgetConfigSchema,
  z.object({ name: z.string() }),
);

export default function UpsertWidgetDialog({
  accountId,
}: {
  accountId: string;
}) {
  const { open, setOpen, editingWidget } = useUpsertWidgetDialog();
  const form = useForm({
    resolver: zodResolver(widgetConfigSchemaFull),
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
    mutationFn: async (value: z.infer<typeof widgetConfigSchemaFull>) => {
      if (editingWidget) {
        await db
          .update(widgets)
          .set({
            ...editingWidget,
            name: value.name,
            config: value,
          })
          .where(eq(widgets.id, editingWidget.id));
      } else {
        await db.insert(widgets).values({
          name: value.name,
          accountId,
          width: 2,
          height: 2,
          x: emptySpace.x,
          y: emptySpace.y,
          config: value,
        });
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [queryKeys.widget],
      });
      toast.success("Widget has been added successfully");
      form.reset();
      setOpen(false);
    },
    onError: () => {
      toast.error("An error occurred while trying to create widget.");
    },
  });

  const { data: existingWidgets } = useQuery({
    queryKey: [queryKeys.widget],
    queryFn: async () => {
      return await db.query.widgets.findMany();
    },
  });

  useEffect(() => {
    if (editingWidget)
      form.reset(
        { name: editingWidget.name, ...editingWidget.config },
        { keepDefaultValues: true },
      );
    else {
      form.reset();
    }
  }, [editingWidget, form]);

  const selectedWidgetType = form.watch("type");

  const emptySpace = useMemo(() => {
    const minNewWidgetWidth = 2;
    const minNewWidgetHeight = 2;

    if (!existingWidgets) return { x: 0, y: 0 };

    // Start scanning from y = 0 and go down until a space is found
    let y = 0;

    while (true) {
      for (let x = 0; x <= MAX_COLS - minNewWidgetWidth; x++) {
        let can_fit = true;

        for (const widget of existingWidgets) {
          const overlaps =
            x < widget.x + widget.width &&
            x + minNewWidgetWidth > widget.x &&
            y < widget.y + widget.height &&
            y + minNewWidgetHeight > widget.y;

          if (overlaps) {
            can_fit = false;
            break;
          }
        }

        if (can_fit) {
          return { x, y };
        }
      }

      y += 1; // Keep scanning further down
    }
  }, [existingWidgets]);

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
