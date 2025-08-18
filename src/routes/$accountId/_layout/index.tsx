import UpsertWidgetDialog, {
  useUpsertWidgetDialog,
} from "@/components/dialog-forms/upsert-widget-dialog";
import { Button } from "@/components/ui/button";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$accountId/_layout/")({
  component: Index,
});

function Index() {
  const { setOpen } = useUpsertWidgetDialog();

  return (
    <div className="w-full px-4 py-8">
      <UpsertWidgetDialog />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button onClick={() => setOpen(true)}>Add Widget</Button>
      </div>
    </div>
  );
}
