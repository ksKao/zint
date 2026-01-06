import UpsertCategoryDialog from "@/components/dialog-forms/upsert-category-dialog";
import UpsertTransactionDialog from "@/components/dialog-forms/upsert-transaction-dialog";
import ErrorPage from "@/components/error";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Suspense } from "react";

export const Route = createFileRoute("/$accountId/_layout")({
  component: RouteComponent,
  errorComponent: () => (
    <>
      <ErrorPage />
    </>
  ),
});

function RouteComponent() {
  const { accountId } = Route.useParams();

  return (
    <>
      <UpsertCategoryDialog accountId={accountId} />
      <UpsertTransactionDialog accountId={accountId} />
      <Suspense>
        <Outlet />
      </Suspense>
    </>
  );
}
