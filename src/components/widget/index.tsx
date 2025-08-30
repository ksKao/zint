import { widgets } from "@/db/schema";
import { InferSelectModel } from "drizzle-orm";
import { useMemo } from "react";
import BarWidget from "./bar-widget";

export default function Widget({
  widget,
}: {
  widget: InferSelectModel<typeof widgets>;
}) {
  const component = useMemo(() => {
    switch (widget.config.type) {
      case "Bar Chart":
        return <BarWidget config={widget.config} />;
      default:
        return null;
    }
  }, [widget]);

  return (
    <div className="bg-card flex h-full w-full flex-col rounded-md border">
      <div className="border-b p-2 text-center">{widget.name}</div>
      <div className="grow">{component}</div>
    </div>
  );
}
