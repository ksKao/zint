import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/$accountId/_layout/")({
  component: Index,
});

function Index() {
  return (
    <div className="p-2">
      <h3>Welcome Home!</h3>
      <Outlet />
    </div>
  );
}
