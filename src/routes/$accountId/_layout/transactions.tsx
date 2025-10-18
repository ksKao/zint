import { useUpsertTransactionDialog } from "@/components/dialog-forms/upsert-transaction-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { queryKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { desc, eq } from "drizzle-orm";
import { AlertCircleIcon, Loader2, PlusIcon } from "lucide-react";
import { accounts, transactions as transactionTable } from "@/db/schema";
import TransactionsTable from "@/components/transactions/transactions-table";

export const Route = createFileRoute("/$accountId/_layout/transactions")({
  component: RouteComponent,
});

function RouteComponent() {
  const { setOpen } = useUpsertTransactionDialog();
  const { accountId } = Route.useParams();
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

  return (
    <div className="flex h-full w-full flex-col gap-4 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <Button onClick={() => setOpen(true)}>
          <PlusIcon /> Add New
        </Button>
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
          // <></>
        )}
      </div>
    </div>
  );
}
