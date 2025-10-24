import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="text-muted-foreground flex h-full w-full items-center justify-center">
      Select an account to get started
    </div>
  );
}
