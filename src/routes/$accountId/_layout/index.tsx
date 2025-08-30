import UpsertWidgetDialog, {
  useUpsertWidgetDialog,
} from "@/components/dialog-forms/upsert-widget-dialog";
import { Button } from "@/components/ui/button";
import Widget from "@/components/widget";
import { db } from "@/db";
import { widgets as widgetTable } from "@/db/schema";
import { queryKeys } from "@/lib/query-keys";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { useEffect, useState } from "react";
import GridLayout from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { useMeasure } from "react-use";
import { toast } from "sonner";

export const Route = createFileRoute("/$accountId/_layout/")({
  component: Index,
});

export const MAX_COLS = 12;

function Index() {
  const [editMode, setEditMode] = useState(false);
  const [layout, setLayout] = useState<GridLayout.Layout[]>([]);

  const { setOpen } = useUpsertWidgetDialog();
  const { accountId } = Route.useParams();
  const [ref, { width }] = useMeasure<HTMLDivElement>();
  const { data: widgets } = useSuspenseQuery({
    queryKey: [queryKeys.widget],
    queryFn: async () => {
      return await db.query.widgets.findMany();
    },
  });

  const { mutate: saveLayout, isPending: saveLayoutPending } = useMutation({
    mutationFn: async () => {
      await db.transaction(async (tx) => {
        // use for loop here because there were some issues with Promise.all
        // shouldn't affect performance that much since users usually don't have hundreds of widgets
        for (const item of layout) {
          await tx
            .update(widgetTable)
            .set({ x: item.x, y: item.y, width: item.w, height: item.h })
            .where(eq(widgetTable.id, item.i));
        }
      });
    },
    onSuccess: () => {
      toast.success("Layout has been saved.");
      setEditMode(false);
    },
    onError: () => {
      toast.error("Failed to save layout");
    },
  });

  useEffect(() => {
    setLayout(
      widgets.map((widget) => ({
        i: widget.id,
        x: widget.x,
        y: widget.y,
        w: widget.width,
        h: widget.height,
      })),
    );
  }, [widgets]);

  return (
    <div className="w-full px-4 py-8">
      <UpsertWidgetDialog accountId={accountId} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button
            loading={saveLayoutPending}
            onClick={() => {
              if (editMode) {
                saveLayout();
              } else {
                setEditMode(true);
              }
            }}
          >
            {editMode ? "Save" : "Edit"} Layout
          </Button>
          <Button onClick={() => setOpen(true)}>Add Widget</Button>
        </div>
      </div>
      <GridLayout
        innerRef={ref}
        layout={layout}
        width={width}
        className="w-full"
        resizeHandles={["ne", "se", "sw", "nw"]}
        isDraggable={editMode}
        isResizable={editMode}
        preventCollision
        allowOverlap={false}
        cols={MAX_COLS}
        rowHeight={100}
        margin={[8, 8]}
        compactType={null}
        onLayoutChange={setLayout}
      >
        {widgets.map((widget) => (
          <div key={widget.id}>
            <Widget widget={widget} />
          </div>
        ))}
      </GridLayout>
    </div>
  );
}
