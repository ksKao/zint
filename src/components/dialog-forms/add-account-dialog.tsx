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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { create } from "zustand";
import { codes } from "currency-codes";
import { AutoComplete } from "../custom/autocomplete";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { createId } from "@paralleldrive/cuid2";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { queryKeys } from "@/lib/query-keys";

type AddAccountDialogState = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

export const useAddAccountDialog = create<AddAccountDialogState>()((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));

const currencyList = codes();

const formSchema = z.object({
  name: z.string().min(1, "Account name is required"),
  currency: z.literal(currencyList, "Invalid currency code"),
});

export default function AddAccountDialog() {
  const { open, setOpen } = useAddAccountDialog();
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      currency: "",
    },
  });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { mutate: addAccount, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const cuid = createId();

      await db.insert(accounts).values({
        id: cuid,
        ...data,
      });

      return cuid;
    },
    onSuccess: (createdId) => {
      toast.success("Account has been created");
      form.reset();
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: [queryKeys.account] });
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => addAccount(data))}
            className="space-y-4"
          >
            <DialogHeader>
              <DialogTitle>Add Account</DialogTitle>
              <DialogDescription>Create a new account</DialogDescription>
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
                  <FormControl>
                    <AutoComplete
                      emptyMessage="No currency found."
                      value={{ label: field.value, value: field.value }}
                      onValueChange={(val) => field.onChange(val.value)}
                      options={currencyList.map((c) => ({
                        label: c,
                        value: c,
                      }))}
                    />
                  </FormControl>
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
