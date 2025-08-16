import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$accountId/_layout/transactions")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Transactions</div>;
}
