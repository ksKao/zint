import { useUpsertTransactionDialog } from "@/components/dialog-forms/upsert-transaction-dialog";
import { Button } from "@/components/ui/button";
import { createFileRoute } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";

export const Route = createFileRoute("/$accountId/_layout/transactions")({
  component: RouteComponent,
});

function RouteComponent() {
  const { setOpen } = useUpsertTransactionDialog();

  return (
    <div className="w-full px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <Button onClick={() => setOpen(true)}>
          <PlusIcon /> Add New
        </Button>
      </div>
    </div>
  );
}
