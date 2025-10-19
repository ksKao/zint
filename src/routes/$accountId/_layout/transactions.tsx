import { useUpsertTransactionDialog } from "@/components/dialog-forms/upsert-transaction-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { queryKeys } from "@/lib/query-keys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { desc, eq } from "drizzle-orm";
import { AlertCircleIcon, Loader2, PlusIcon, RotateCwIcon } from "lucide-react";
import { accounts, transactions as transactionTable } from "@/db/schema";
import TransactionsTable from "@/components/transactions/transactions-table";
import { toast } from "sonner";
import { recomputeBalanceAndOrder } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const Route = createFileRoute("/$accountId/_layout/transactions")({
  component: RouteComponent,
});

function RouteComponent() {
  const { setOpen, setTransaction } = useUpsertTransactionDialog();
  const { accountId } = Route.useParams();
  const queryClient = useQueryClient();
  const {
    data: transactions,
    isPending: transactionsPending,
    isError: transactionsError,
  } = useQuery({
    queryKey: [queryKeys.transaction, accountId],
    queryFn: async () => {
      return await db.query.transactions.findMany({
        with: {
          category: true,
          subCategory: true,
        },
        where: eq(transactionTable.accountId, accountId),
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
            <TooltipTrigger>
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
