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
import { PencilIcon, PlusIcon, SaveIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import GridLayout from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { useMeasure } from "react-use";
import { toast } from "sonner";
import { create } from "zustand";

export const Route = createFileRoute("/$accountId/_layout/")({
  component: Index,
});

export const MAX_COLS = 12;
export const ROW_HEIGHT = 100;

type LocalDashboardLayoutState = {
  layout: GridLayout.Layout[];
  tempLayout: GridLayout.Layout[]; // represents the layout that is currently being dragged
  setLayout: (layout: GridLayout.Layout[]) => void;
  setTempLayout: (layout: GridLayout.Layout[]) => void;
};

export const useLocalDashboardLayout = create<LocalDashboardLayoutState>()(
  (set) => ({
    layout: [],
    tempLayout: [],
    setLayout: (layout) => {
      set({ layout, tempLayout: layout });
    },
    setTempLayout: (layout) => set({ tempLayout: layout }),
  }),
);

function Index() {
  const [editMode, setEditMode] = useState(false);
  const { layout, setLayout, tempLayout, setTempLayout } =
    useLocalDashboardLayout();

  const { setOpen, setEditingWidget } = useUpsertWidgetDialog();
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
      // use for loop here because there were some issues with Promise.all
      // shouldn't affect performance that much since users usually don't have hundreds of widgets
      // transaction is also not available
      for (const item of layout) {
        await db
          .update(widgetTable)
          .set({ x: item.x, y: item.y, width: item.w, height: item.h })
          .where(eq(widgetTable.id, item.i));
      }
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
  }, [widgets, setLayout]);

  return (
    <div className="w-full px-4 py-8">
      <UpsertWidgetDialog accountId={accountId} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2">
          {editMode ? (
            <Button
              variant="outline"
              onClick={() => {
                setLayout(
                  widgets.map((widget) => ({
                    i: widget.id,
                    x: widget.x,
                    y: widget.y,
                    w: widget.width,
                    h: widget.height,
                  })),
                );
                setEditMode(false);
              }}
            >
              <XIcon />
              Cancel
            </Button>
          ) : null}
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
            {editMode ? <SaveIcon /> : <PencilIcon />}
            {editMode ? "Save" : "Edit"} Layout
          </Button>
          <Button
            onClick={() => {
              setEditingWidget(undefined);
              setOpen(true);
            }}
          >
            <PlusIcon />
            Add Widget
          </Button>
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
        rowHeight={ROW_HEIGHT}
        margin={[8, 8]}
        compactType={null}
        onResize={(e) => {
          // find reference
          const resizeTarget = e[0];

          if (!resizeTarget) return;

          const found = tempLayout.find((w) => w.i === e[0]?.i);

          if (found) {
            found.h = resizeTarget.h;
            found.w = resizeTarget.w;

            setTempLayout([...tempLayout]);
          }
        }}
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
