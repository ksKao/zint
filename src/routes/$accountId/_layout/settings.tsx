import SettingsPage from "@/components/settings/settings-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$accountId/_layout/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  return <SettingsPage />;
}
