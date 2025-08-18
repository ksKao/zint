import AddCategoryDialog from "@/components/dialog-forms/add-category-dialog";
import UpsertTransactionDialog from "@/components/dialog-forms/upsert-transaction-dialog";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/$accountId/_layout")({
  component: RouteComponent,
});

function RouteComponent() {
  const { accountId } = Route.useParams();

  return (
    <>
      <AddCategoryDialog accountId={accountId} />
      <UpsertTransactionDialog accountId={accountId} />
      <Outlet />
    </>
  );
}
