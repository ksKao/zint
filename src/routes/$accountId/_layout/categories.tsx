import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$accountId/_layout/categories")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Categories</div>;
}
