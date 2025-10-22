import { useUpsertTransactionDialog } from "@/components/dialog-forms/upsert-transaction-dialog";
import FilterTransactionsDialog, {
  defaultTransactionFilters,
  type TransactionFilters,
} from "@/components/transactions/filter-transactions-dialog";
import TransactionsTable from "@/components/transactions/transactions-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { db } from "@/db";
import { accounts, transactions as transactionTable } from "@/db/schema";
import { queryKeys } from "@/lib/query-keys";
import { recomputeBalanceAndOrder } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { and, desc, eq, gte, inArray, like, lte, or } from "drizzle-orm";
import { AlertCircleIcon, Loader2, PlusIcon, RotateCwIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/$accountId/_layout/transactions")({
  component: RouteComponent,
});

function RouteComponent() {
  const { setOpen, setTransaction } = useUpsertTransactionDialog();
  const { accountId } = Route.useParams();
  const queryClient = useQueryClient();
  const [transactionFilters, setTransactionFilters] =
    useState<TransactionFilters>(defaultTransactionFilters);
  const {
    data: transactions,
    isPending: transactionsPending,
    isError: transactionsError,
  } = useQuery({
    queryKey: [queryKeys.transaction, accountId, transactionFilters],
    queryFn: async () => {
      const conditions: Parameters<typeof and> = [];

      if (transactionFilters.title)
        conditions.push(
          like(transactionTable.title, `%${transactionFilters.title}%`),
        );

      if (transactionFilters.description)
        conditions.push(
          like(
            transactionTable.description,
            `%${transactionFilters.description}%`,
          ),
        );

      if (transactionFilters.startDate)
        conditions.push(
          gte(transactionTable.date, transactionFilters.startDate),
        );

      if (transactionFilters.endDate)
        conditions.push(lte(transactionTable.date, transactionFilters.endDate));

      if (transactionFilters.payee)
        conditions.push(
          like(transactionTable.description, `%${transactionFilters.payee}%`),
        );

      if (transactionFilters.isTemporary !== null)
        conditions.push(
          eq(transactionTable.isTemporary, transactionFilters.isTemporary),
        );

      if (transactionFilters.minAmount !== null)
        conditions.push(
          gte(transactionTable.amount, transactionFilters.minAmount),
        );

      if (transactionFilters.maxAmount !== null)
        conditions.push(
          lte(transactionTable.amount, transactionFilters.maxAmount),
        );

      if (
        transactionFilters.categoryIds &&
        transactionFilters.categoryIds.length
      ) {
        conditions.push(
          or(
            inArray(
              transactionTable.categoryId,
              transactionFilters.categoryIds,
            ),
            inArray(
              transactionTable.subCategoryId,
              transactionFilters.categoryIds,
            ),
          ),
        );
      }

      return await db.query.transactions.findMany({
        with: {
          category: true,
          subCategory: true,
        },
        where: and(eq(transactionTable.accountId, accountId), ...conditions),
        orderBy: [desc(transactionTable.date), desc(transactionTable.order)],
      });
    },
  });
  const {
    data: account,
    isPending: accountPending,
    isError: accountError,
  } = useQuery({
    queryKey: [queryKeys.account, accountId],
    queryFn: async () => {
      return await db.query.accounts.findFirst({
        where: eq(accounts.id, accountId),
      });
    },
  });
  const { mutate: recomputeBalance, isPending: recomputeBalancePending } =
    useMutation({
      mutationFn: async () => {
        await recomputeBalanceAndOrder(accountId);
      },
      onSuccess: () => {
        toast.success("Balance has been recomputed.");
        queryClient.invalidateQueries();
      },
      onError: () => {
        toast.error("An error occurred while trying to recompute balance.");
      },
    });

  return (
    <div className="flex h-[calc(100%-48px)] w-full flex-col gap-4 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => recomputeBalance()}
                variant="outline"
                loading={recomputeBalancePending}
              >
                <RotateCwIcon /> Recompute Balance
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {transactions?.length ?? 0} record(s)
            </TooltipContent>
          </Tooltip>
          <FilterTransactionsDialog
            transactionFilters={transactionFilters}
            setTransactionFilters={setTransactionFilters}
          />
          <Button
            onClick={() => {
              setTransaction(undefined);
              setOpen(true);
            }}
          >
            <PlusIcon /> Add New
          </Button>
        </div>
      </div>
      <div className="flex h-full w-full grow items-center justify-center">
        {transactionsPending || accountPending ? (
          <Loader2 className="animate-spin" />
        ) : transactionsError || accountError || !account ? (
          <Alert className="w-fit" variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>An error occurred.</AlertTitle>
            <AlertDescription>
              <p>Unable to retrieve transactions.</p>
            </AlertDescription>
          </Alert>
        ) : (
          <TransactionsTable transactions={transactions} account={account} />
        )}
      </div>
    </div>
  );
}
