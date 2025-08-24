import UpsertWidgetDialog, {
  useUpsertWidgetDialog,
} from "@/components/dialog-forms/upsert-widget-dialog";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { queryKeys } from "@/lib/query-keys";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$accountId/_layout/")({
  component: Index,
});

function Index() {
  const { setOpen } = useUpsertWidgetDialog();
  const { accountId } = Route.useParams();
  const { data: widgets } = useSuspenseQuery({
    queryKey: [queryKeys.widget],
    queryFn: async () => {
      return await db.query.widgets.findMany();
    },
  });

  return (
    <div className="w-full px-4 py-8">
      <UpsertWidgetDialog accountId={accountId} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button onClick={() => setOpen(true)}>Add Widget</Button>
      </div>
      {widgets.map((widget) => (
        <p key={widget.id}>{widget.name}</p>
      ))}
    </div>
  );
}
