import UpsertWidgetDialog, {
  useUpsertWidgetDialog,
} from "@/components/dialog-forms/upsert-widget-dialog";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import Widget from "@/components/widget";
import { db } from "@/db";
import { widgets as widgetTable } from "@/db/schema";
import { queryKeys } from "@/lib/query-keys";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import {
  LayoutDashboardIcon,
  PencilIcon,
  PlusIcon,
  SaveIcon,
  XIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Layout, ReactGridLayout, getCompactor } from "react-grid-layout";
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
  layout: Layout;
  setLayout: (layout: Layout) => void;
};

export const useLocalDashboardLayout = create<LocalDashboardLayoutState>()(
  (set) => ({
    layout: [],
    setLayout: (layout) => {
      set({ layout });
    },
  }),
);

function Index() {
  const [editMode, setEditMode] = useState(false);
  const { layout, setLayout } = useLocalDashboardLayout();

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
    <div className="flex h-full w-full flex-col px-4 py-8">
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
      {widgets.length ? (
        <ReactGridLayout
          innerRef={ref}
          layout={layout}
          width={width}
          className="w-full"
          resizeConfig={{
            enabled: editMode,
            handles: ["ne", "se", "sw", "nw"],
          }}
          dragConfig={{ enabled: editMode }}
          gridConfig={{
            cols: MAX_COLS,
            rowHeight: ROW_HEIGHT,
            margin: [8, 8],
          }}
          compactor={getCompactor(null, false, true)}
          onResize={(e) => {
            // find reference
            const resizeTarget = e[0];

            if (!resizeTarget) return;

            const found = layout.find((w) => w.i === e[0]?.i);

            if (found) {
              found.h = resizeTarget.h;
              found.w = resizeTarget.w;

              setLayout([...layout]);
            }
          }}
          onLayoutChange={setLayout}
        >
          {widgets.map((widget) => (
            <div key={widget.id}>
              <Widget widget={widget} />
            </div>
          ))}
        </ReactGridLayout>
      ) : (
        <Empty className="h-full w-full">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <LayoutDashboardIcon />
            </EmptyMedia>
            <EmptyTitle>No Widgets Yet</EmptyTitle>
            <EmptyDescription>
              You haven&apos;t created any widgets yet. Get started by creating
              your first widget.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setEditingWidget(undefined);
                  setOpen(true);
                }}
              >
                Create Widget
              </Button>
            </div>
          </EmptyContent>
        </Empty>
      )}
    </div>
  );
}
