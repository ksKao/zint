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
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { createId } from "@paralleldrive/cuid2";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { codes } from "currency-codes";
import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useMeasure } from "react-use";
import { toast } from "sonner";
import { z } from "zod/v4";
import { create } from "zustand";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { accounts as accountsTable } from "@/db/schema";
import { eq } from "drizzle-orm";

type UpsertAccountDialogState = {
  open: boolean;
  setOpen: (open: boolean) => void;
  account?: typeof accountsTable.$inferSelect;
  setAccount: (account: typeof accountsTable.$inferSelect | undefined) => void;
};

export const useUpsertAccountDialog = create<UpsertAccountDialogState>()(
  (set) => ({
    open: false,
    setOpen: (open) => set({ open }),
    account: undefined,
    setAccount: (account) => set({ account }),
  }),
);

const currencyList = codes();

const formSchema = z.object({
  name: z.string().min(1, "Account name is required"),
  currency: z.literal(currencyList, "Invalid currency code"),
});

export default function UpsertAccountDialog() {
  const { open, setOpen, account, setAccount } = useUpsertAccountDialog();
  const [currencySelectorOpen, setCurrencySelectorOpen] = useState(false);
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      currency: "",
    },
  });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currencySelectorRef, { width: currencySelectorWidth }] =
    useMeasure<HTMLButtonElement>();
  const { mutate: addAccount, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      if (account) {
        await db
          .update(accountsTable)
          .set({
            name: data.name,
            currency: data.currency,
          })
          .where(eq(accountsTable.id, account.id));

        return account.id;
      } else {
        const cuid = createId();

        await db.insert(accounts).values({
          id: cuid,
          ...data,
        });

        return cuid;
      }
    },
    onSuccess: (createdId) => {
      toast.success(
        account ? "Account info has been saved" : "Account has been created",
      );

      setOpen(false);
      setAccount(undefined);

      form.reset();

      queryClient.invalidateQueries({ queryKey: [queryKeys.account] });

      if (!account)
        navigate({
          to: "/$accountId",
          params: {
            accountId: createdId,
          },
        });
    },
    onError: () => {
      toast.error("Unable to create account.");
    },
  });

  useEffect(() => {
    if (account) {
      form.setValue("name", account.name);
      form.setValue("currency", account.currency);
    } else {
      form.reset();
    }
  }, [account, form]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => addAccount(data))}
            className="space-y-4"
          >
            <DialogHeader>
              <DialogTitle>{account ? "Edit" : "Add"} Account</DialogTitle>
              <DialogDescription>
                {account ? `Edit ${account.name}` : "Create a new account"}
              </DialogDescription>
            </DialogHeader>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Account Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <Popover
                    modal
                    open={currencySelectorOpen}
                    onOpenChange={setCurrencySelectorOpen}
                  >
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground",
                          )}
                          ref={currencySelectorRef}
                        >
                          {field.value
                            ? currencyList.find((c) => c === field.value)
                            : "Select currency"}
                          <ChevronsUpDown className="opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent
                      className="p-0"
                      style={{ width: currencySelectorWidth + 24 }} // 24 for padding
                    >
                      <Command>
                        <CommandInput
                          placeholder="Search currency..."
                          className="h-9"
                          showSearchIcon
                        />
                        <CommandList>
                          <CommandEmpty>No currency found.</CommandEmpty>
                          <CommandGroup>
                            {currencyList.map((currency) => (
                              <CommandItem
                                value={currency}
                                key={currency}
                                onSelect={() => {
                                  form.setValue("currency", currency);
                                  setCurrencySelectorOpen(false);
                                }}
                              >
                                {currency}
                                <Check
                                  className={cn(
                                    "ml-auto",
                                    currency === field.value
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
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
