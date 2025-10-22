import CategoryDropdownMulti from "@/components/category/category-dropdown-multi";
import DatePicker from "@/components/custom/date-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { FilterIcon } from "lucide-react";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod/v4";

const transactionFiltersSchema = z.object({
  title: z.string("Title is invalid").nullable(),
  description: z.string("Description is invalid").nullable(),
  startDate: z.date("Invalid start date").nullable(),
  endDate: z.date("Invalid end date").nullable(),
  payee: z.string("Payee is invalid").nullable(),
  isTemporary: z.boolean("Invalid temporary value").nullable(),
  minAmount: z.coerce.number("Invalid amount").nullable(),
  maxAmount: z.coerce.number("Invalid amount").nullable(),
  categoryIds: z
    .array(z.cuid2("Invalid category"), "Invalid category")
    .nullable(),
});

export type TransactionFilters = z.infer<typeof transactionFiltersSchema>;

export const defaultTransactionFilters: TransactionFilters = {
  title: "",
  description: "",
  payee: "",
  isTemporary: null,
  minAmount: null,
  maxAmount: null,
  startDate: null,
  endDate: null,
  categoryIds: null,
};

export default function FilterTransactionsDialog({
  transactionFilters,
  setTransactionFilters,
}: {
  transactionFilters: TransactionFilters;
  setTransactionFilters: React.Dispatch<
    React.SetStateAction<TransactionFilters>
  >;
}) {
  const [open, setOpen] = useState(false);
  const form = useForm({
    resolver: zodResolver(transactionFiltersSchema),
    defaultValues: {
      ...defaultTransactionFilters,
    },
  });

  useEffect(() => {
    form.reset(transactionFilters, {
      keepDefaultValues: true,
    });
  }, [form, transactionFilters]);

  const numberOfFilters = useMemo(() => {
    let count = 0;

    for (const key in transactionFilters) {
      const value = transactionFilters[key as keyof typeof transactionFilters];
      if (
        value !== null &&
        value !== "" &&
        (!Array.isArray(value) || value.length > 1)
      )
        count++;
    }

    return count;
  }, [transactionFilters]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="relative">
          <FilterIcon />
          Filter
          {numberOfFilters ? (
            <Badge className="border-secondary absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 rounded-full text-sm">
              {numberOfFilters}
            </Badge>
          ) : null}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Filter Transactions</DialogTitle>
          <DialogDescription className="sr-only">
            Filter Transactions
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => {
              setTransactionFilters(data);
              setOpen(false);
            })}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Title"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      onChange={(e) => field.onChange(e.target.value || null)}
                      value={field.value ?? ""}
                      className="resize-none"
                      rows={4}
                      placeholder="Description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-2">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <div className="grow">
                    <DatePicker
                      label="Start Date"
                      value={field.value ?? undefined}
                      onChange={field.onChange}
                      placeholder="Select a date"
                    />
                  </div>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <div className="grow">
                    <DatePicker
                      label="End Date"
                      value={field.value ?? undefined}
                      onChange={field.onChange}
                      placeholder="Select a date"
                    />
                  </div>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="payee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payee</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Payee"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isTemporary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Temporary Transaction</FormLabel>
                  <Select
                    value={
                      field.value === null ? "any" : field.value ? "yes" : "no"
                    }
                    onValueChange={(value) => {
                      switch (value) {
                        case "yes":
                          field.onChange(true);
                          break;
                        case "no":
                          field.onChange(false);
                          break;
                        default:
                          field.onChange(null);
                          break;
                      }
                    }}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {["Any", "Yes", "No"].map((option) => (
                        <SelectItem value={option.toLowerCase()} key={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-2">
              <FormField
                control={form.control}
                name="minAmount"
                render={({ field }) => (
                  <FormItem className="grow">
                    <FormLabel>Min Amount</FormLabel>
                    <Input
                      value={
                        typeof field.value === "number" ||
                        typeof field.value === "string"
                          ? field.value
                          : ""
                      }
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder="Min Amount"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxAmount"
                render={({ field }) => (
                  <FormItem className="grow">
                    <FormLabel>Max Amount</FormLabel>
                    <Input
                      value={
                        typeof field.value === "number" ||
                        typeof field.value === "string"
                          ? field.value
                          : ""
                      }
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder="Max Amount"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="categoryIds"
              render={({ field }) => (
                <Suspense>
                  <CategoryDropdownMulti
                    selectedIds={field.value ?? []}
                    onSelectChange={(id, selected) => {
                      let oldValue = field.value;

                      if (!Array.isArray(oldValue)) oldValue = [];

                      const filtered = oldValue.filter((v) => v !== id);

                      form.setValue(
                        `categoryIds`,
                        selected
                          ? [...oldValue, id]
                          : filtered.length
                            ? filtered
                            : null, // set back to undefined when there is nothing in the array to make sure that the number badge on filter button is accurate
                      );
                    }}
                    errorMessage={form.formState.errors.categoryIds?.message}
                  />
                </Suspense>
              )}
            />
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset(
                    { ...defaultTransactionFilters },
                    { keepDefaultValues: true },
                  );
                }}
              >
                Clear
              </Button>
              <Button>Submit</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
