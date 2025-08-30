import { widgets } from "@/db/schema";
import { InferSelectModel } from "drizzle-orm";

export default function Widget({
  widget,
}: {
  widget: InferSelectModel<typeof widgets>;
}) {
  return (
    <div className="bg-card h-full w-full rounded-md border p-4">
      {widget.name}
    </div>
  );
}
