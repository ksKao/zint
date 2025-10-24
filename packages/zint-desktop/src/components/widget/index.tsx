import { useUpsertWidgetDialog } from "@/components/dialog-forms/upsert-widget-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import BarWidget from "@/components/widget/bar-widget";
import { db } from "@/db";
import { widgets } from "@/db/schema";
import { queryKeys } from "@/lib/query-keys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { eq, InferSelectModel } from "drizzle-orm";
import { Edit2Icon, EllipsisIcon, Loader2Icon, TrashIcon } from "lucide-react";
import { Suspense, useMemo, useState } from "react";
import { useMeasure } from "react-use";
import { toast } from "sonner";
import CardWidget from "./card-widget";
import LineWidget from "./line-widget";
import PieWidget from "./pie-widget";
import TableWidget from "./table-widget";

export default function Widget({
  widget,
}: {
  widget: InferSelectModel<typeof widgets>;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { setOpen, setEditingWidget } = useUpsertWidgetDialog();
  const [ref, { height }] = useMeasure<HTMLDivElement>();
  const queryClient = useQueryClient();
  const { mutate: deleteWidget, isPending: deleteWidgetPending } = useMutation({
    mutationFn: async () => {
      await db.delete(widgets).where(eq(widgets.id, widget.id));
    },
    onSuccess: () => {
      toast.success("Widget has been deleted");
      setDropdownOpen(false);
      queryClient.invalidateQueries({
        queryKey: [queryKeys.widget],
      });
    },
    onError: () => {
      toast.error("Failed to delete widget");
    },
  });
  const component = useMemo(() => {
    const heightWithoutHeader = height - 41;

    switch (widget.config.type) {
      case "Bar Chart":
        return (
          <BarWidget config={widget.config} height={heightWithoutHeader} />
        );
      case "Line Chart":
        return (
          <LineWidget config={widget.config} height={heightWithoutHeader} />
        );
      case "Pie Chart":
        return (
          <PieWidget config={widget.config} height={heightWithoutHeader} />
        );
      case "Table":
        return (
          <TableWidget config={widget.config} height={heightWithoutHeader} />
        );
      case "Card":
        return (
          <CardWidget config={widget.config} height={heightWithoutHeader} />
        );
      default:
        return null;
    }
  }, [widget, height]);

  return (
    <div
      className="bg-card relative flex h-full w-full flex-col rounded-md border"
      ref={ref}
    >
      <DropdownMenu
        modal={false}
        open={dropdownOpen}
        onOpenChange={setDropdownOpen}
      >
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="absolute top-0.5 right-0.5"
            size="icon"
          >
            <EllipsisIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={() => {
              setEditingWidget(widget);
              setOpen(true);
            }}
          >
            <Edit2Icon /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              deleteWidget();
            }}
            variant="destructive"
            disabled={deleteWidgetPending}
          >
            {deleteWidgetPending ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              <TrashIcon />
            )}{" "}
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="border-b p-2 text-center">{widget.name}</div>
      <div className="grow">
        <Suspense>{component}</Suspense>
      </div>
    </div>
  );
}
