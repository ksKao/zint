import AddCategoryDialog from "@/components/add-category-dialog";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/$accountId/_layout")({
  component: RouteComponent,
});

function RouteComponent() {
  const { accountId } = Route.useParams();

  return (
    <>
      <AddCategoryDialog accountId={accountId} />
      <Outlet />
    </>
  );
}
