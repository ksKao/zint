import { Button } from "@/components/ui/button";
import { WidgetConfig } from "@/lib/types/widget.type";
import { Plus } from "lucide-react";
import { useFieldArray, useFormContext } from "react-hook-form";
import FilterRow from "./filter-row";

export default function FilterListForm() {
  const form = useFormContext<WidgetConfig>();
  const fieldArray = useFieldArray({
    control: form.control,
    name: "filters",
  });

  return (
    <div className="w-full rounded-md border p-3">
      <div className="flex items-center justify-between">
        <p className="font-normal">Filters</p>
        <Button
          size="icon"
          variant="outline"
          type="button"
          onClick={() =>
            fieldArray.append({
              field: "Title",
              operator: "Equals",
              value: "",
              reverseFilter: false,
            })
          }
        >
          <Plus />
        </Button>
      </div>
      <ul className={`space-y-4 ${fieldArray.fields.length ? "mt-4" : ""}`}>
        {fieldArray.fields.map((field, i) => (
          <FilterRow
            index={i}
            key={field.id}
            remove={() => fieldArray.remove(i)}
          />
        ))}
      </ul>
    </div>
  );
}
