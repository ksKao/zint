import CategoriesPage from "@/components/categories/categories-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$accountId/_layout/categories")({
  component: RouteComponent,
});

function RouteComponent() {
  const { accountId } = Route.useParams();

  return <CategoriesPage accountId={accountId} />;
}
