import CategoryIcon from "@/components/category/category-icon";
import { useUpsertTransactionDialog } from "@/components/dialog-forms/upsert-transaction-dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Item, ItemContent } from "@/components/ui/item";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/db";
import {
  accounts,
  categories,
  subCategories,
  transactions as transactionTable,
} from "@/db/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { and, eq, gt, or, sql } from "drizzle-orm";
import { CheckIcon, Edit2Icon, Trash2Icon, XIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function TransactionsTable({
  transactions,
  account,
}: {
  transactions: (typeof transactionTable.$inferSelect & {
    category: typeof categories.$inferSelect | null;
    subCategory: typeof subCategories.$inferSelect | null;
  })[];
  account: typeof accounts.$inferSelect;
}) {
  const {
    setOpen: setUpsertTransactionDialogOpen,
    setTransaction: setUpsertTransactionDialogTransaction,
  } = useUpsertTransactionDialog();
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);
  const [deletingTransaction, setDeletingTransaction] =
    useState<typeof transactionTable.$inferSelect>();

  const queryClient = useQueryClient();
  const { mutate: deleteTransaction, isPending: deleteTransactionPending } =
    useMutation({
      mutationFn: async () => {
        if (!deletingTransaction) {
          toast.error("Unable to delete transaction.");
          return;
        }

        await db
          .delete(transactionTable)
          .where(eq(transactionTable.id, deletingTransaction.id));

        await db
          .update(transactionTable)
          .set({
            balance: sql`${transactionTable.balance} - ${deletingTransaction.amount}`,
          })
          .where(
            or(
              gt(transactionTable.date, deletingTransaction.date),
              and(
                eq(transactionTable.date, deletingTransaction.date),
                gt(transactionTable.order, deletingTransaction.order),
              ),
            ),
          );

        await db
          .update(transactionTable)
          .set({
            order: sql`${transactionTable.order} - 1`,
          })
          .where(
            and(
              eq(transactionTable.date, deletingTransaction.date),
              gt(transactionTable.order, deletingTransaction.order),
            ),
          );
      },
      onSuccess: () => {
        queryClient.invalidateQueries();
        toast.success("Transaction has been deleted.");
        setConfirmDeleteDialogOpen(false);
        setDeletingTransaction(undefined);
      },
      onError: () => {
        toast.error("An error occurred while trying to delete transaction.");
        queryClient.invalidateQueries();
      },
    });

  return (
    <>
      <AlertDialog
        open={confirmDeleteDialogOpen}
        onOpenChange={setConfirmDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription className="sr-only">
              Confirm Delete Transaction
            </AlertDialogDescription>
          </AlertDialogHeader>
          <p>The following transaction will be deleted:</p>
          <Item variant="outline">
            <ItemContent>
              <p>{deletingTransaction?.title}</p>
            </ItemContent>
          </Item>
          <p>Are you sure you want to proceed? This action cannot be undone</p>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => deleteTransaction()}
              loading={deleteTransactionPending}
            >
              Confirm
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="mb-auto h-fit max-h-full w-full overflow-x-auto overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-32 text-center">Date</TableHead>
              <TableHead className="text-center">Title</TableHead>
              <TableHead className="text-center">Description</TableHead>
              <TableHead className="w-32 text-center">Category</TableHead>
              <TableHead className="w-32 text-center">Payee</TableHead>
              <TableHead className="w-24 text-center">Temporary</TableHead>
              <TableHead className="w-32 text-center">Amount</TableHead>
              <TableHead className="w-32 text-center">Balance</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length ? (
              transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="w-32 text-center">
                    {format(transaction.date, "dd MMM yyyy")}
                  </TableCell>
                  <TableCell className="text-center">
                    {transaction.title}
                  </TableCell>
                  <TableCell className="text-center">
                    <p>{transaction.description || "--"}</p>
                  </TableCell>
                  <TableCell className="w-64">
                    <div className="flex items-center justify-center gap-2">
                      {transaction.category && transaction.subCategory ? (
                        <>
                          <CategoryIcon category={transaction.subCategory} />
                          <p>
                            {transaction.subCategory.name} (
                            {transaction.category.name})
                          </p>
                        </>
                      ) : transaction.category ? (
                        <>
                          <CategoryIcon category={transaction.category} />
                          <p>{transaction.category.name}</p>
                        </>
                      ) : (
                        <p>--</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="w-32 text-center">
                    <p>{transaction.payee || "--"}</p>
                  </TableCell>
                  <TableCell className="w-24">
                    <div className="flex items-center justify-center">
                      {transaction.isTemporary ? <CheckIcon /> : <XIcon />}
                    </div>
                  </TableCell>
                  <TableCell
                    className={`w-32 text-center ${transaction.amount > 0 ? "text-green-500" : transaction.amount < 0 ? "text-destructive" : ""}`}
                  >
                    <p>
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: account.currency,
                      }).format(transaction.amount)}
                    </p>
                  </TableCell>
                  <TableCell className="w-48 text-center">
                    <p>
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: account.currency,
                      }).format(transaction.balance)}
                    </p>
                  </TableCell>
                  <TableCell className="flex items-center justify-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setUpsertTransactionDialogTransaction(transaction);
                        setUpsertTransactionDialogOpen(true);
                      }}
                    >
                      <Edit2Icon />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setDeletingTransaction(transaction);
                        setConfirmDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2Icon />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-muted-foreground text-center"
                >
                  No Transactions Available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
