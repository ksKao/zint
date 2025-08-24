import CategoryDropdown from "@/components/category/category-dropdown";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { queryKeys } from "@/lib/query-keys";
import { getDateAtMidnight } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { gt, sql } from "drizzle-orm";
import { CalendarIcon, Info } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod/v4";
import { create } from "zustand";

type UpsertTransactionDialogState = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

export const useUpsertTransactionDialog =
  create<UpsertTransactionDialogState>()((set) => ({
    open: false,
    setOpen: (open) => set({ open }),
  }));

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string("Invalid description").nullable(),
  date: z.coerce.date("Invalid date"),
  payee: z.string("Invalid payee").nullable(),
  isTemporary: z.boolean("Invalid value"),
  amount: z.coerce.number("Amount is invalid"),
  categoryId: z.cuid2("Invalid category").nullable(),
  subCategoryId: z.cuid2("Invalid sub category").nullable(),
});

export default function UpsertTransactionDialog({
  accountId,
}: {
  accountId: string;
}) {
  const { open, setOpen } = useUpsertTransactionDialog();
  const queryClient = useQueryClient();
  const { mutate: addTransaction, isPending } = useMutation({
    mutationFn: async (formData: z.infer<typeof formSchema>) => {
      await db.transaction(
        async (tx) => {
          const latestTransaction = await tx.query.transactions.findFirst({
            where: (t, { lte }) => lte(t.date, formData.date),
            orderBy: (t, { desc }) => [desc(t.date), desc(t.order)],
          });

          const payload: typeof transactions.$inferInsert = {
            accountId,
            ...formData,
            balance:
              latestTransaction?.balance === undefined
                ? formData.amount
                : latestTransaction.balance + formData.amount,
            order:
              latestTransaction?.date?.getTime() === formData.date.getTime()
                ? latestTransaction.order + 1
                : 0,
          };

          await tx.insert(transactions).values(payload);
          await tx
            .update(transactions)
            .set({
              balance: sql`${transactions.balance} + ${formData.amount}`,
            })
            .where(gt(transactions.date, formData.date));
        },
        {
          behavior: "exclusive",
        },
      );
    },
    onSuccess: () => {
      toast.success("Transaction has been added.");
      setOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: [queryKeys.transaction] });
    },
    onError: () => {
      toast.error("An error occurred while trying to add transaction.");
    },
  });
  const [dateSelectorOpen, setDateSelectorOpen] = useState(false);
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: null,
      date: getDateAtMidnight(),
      payee: null,
      isTemporary: false,
      amount: "",
      categoryId: null,
      subCategoryId: null,
    },
  });

  const dateFormValue = form.watch("date");
  const selectedDate = new Date(
    typeof dateFormValue === "string" ||
    typeof dateFormValue === "number" ||
    dateFormValue instanceof Date
      ? dateFormValue
      : new Date(),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => addTransaction(data))}
            className="space-y-4"
          >
            <DialogHeader>
              <DialogTitle>Add Transaction</DialogTitle>
              <DialogDescription>Create a new transaction</DialogDescription>
            </DialogHeader>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <Input {...field} placeholder="Title" />
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center gap-2">
              <div className="w-1/2">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <Popover
                        modal
                        open={dateSelectorOpen}
                        onOpenChange={setDateSelectorOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            id="date"
                            className="items-center justify-between font-normal"
                          >
                            {format(selectedDate, "dd MMM yyyy")}
                            <CalendarIcon />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="flex w-fit justify-center p-0">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            className="text-primary-foreground"
                            onSelect={(date) => {
                              field.onChange(date);
                              setDateSelectorOpen(false);
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="w-1/2">
                <CategoryDropdown
                  onSelect={({ categoryId, subCategoryId }) => {
                    form.setValue("categoryId", categoryId);
                    form.setValue("subCategoryId", subCategoryId);
                  }}
                  selectedCategoryId={form.watch("categoryId")}
                  selectedSubcategoryId={form.watch("subCategoryId")}
                  errorMessage={
                    form.formState.errors.subCategoryId?.message ||
                    form.formState.errors.categoryId?.message
                  }
                />
              </div>
            </div>
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <Input
                    value={
                      typeof field.value === "number" ||
                      typeof field.value === "string"
                        ? field.value
                        : ""
                    }
                    onChange={(e) => field.onChange(e.target.value)}
                    placeholder="Amount (Enter negative numbers for expenses)"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="payee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payee (Optional)</FormLabel>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                    placeholder=""
                    type="text"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isTemporary"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>
                      Mark as temporary transaction
                      <Tooltip>
                        <TooltipTrigger>
                          <Info size={16} />
                        </TooltipTrigger>
                        <TooltipContent>
                          Temporary transactions are not counted when creating
                          widgets, but will still reflect in the balance.
                        </TooltipContent>
                      </Tooltip>
                    </FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <Textarea
                    onChange={(e) => field.onChange(e.target.value || null)}
                    value={field.value ?? ""}
                    className="resize-none"
                    rows={4}
                    placeholder="Description"
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
