import { widgets } from "@/db/schema";
import { InferSelectModel } from "drizzle-orm";
import { useMemo } from "react";
import BarWidget from "@/components/widget/bar-widget";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Edit2Icon, EllipsisIcon } from "lucide-react";
import { useUpsertWidgetDialog } from "@/components/dialog-forms/upsert-widget-dialog";
import { useLocalDashboardLayout } from "@/routes/$accountId/_layout";

export default function Widget({
  widget,
}: {
  widget: InferSelectModel<typeof widgets>;
}) {
  const { setOpen, setEditingWidget } = useUpsertWidgetDialog();
  const { tempLayout } = useLocalDashboardLayout();
  const component = useMemo(() => {
    const widgetLayout = tempLayout.find((w) => w.i === widget.id);

    if (!widgetLayout) return null;

    switch (widget.config.type) {
      case "Bar Chart":
        return <BarWidget config={widget.config} layout={widgetLayout} />;
      default:
        return null;
    }
  }, [widget, tempLayout]);

  return (
    <div className="bg-card relative flex h-full w-full flex-col rounded-md border">
      <DropdownMenu modal={false}>
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
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="border-b p-2 text-center">{widget.name}</div>
      <div className="grow">{component}</div>
    </div>
  );
}
