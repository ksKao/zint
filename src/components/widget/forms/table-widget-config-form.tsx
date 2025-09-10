import SortableItem from "@/components/dnd/sortable-item";
import { Button } from "@/components/ui/button";
import { FormField, FormMessage } from "@/components/ui/form";
import {
  tableWidgetAggregationColumns,
  tableWidgetRegularColumns,
  WidgetConfig,
} from "@/lib/types/widget.type";
import { DndContext } from "@dnd-kit/core";
import { arrayMove, SortableContext } from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  ArrowRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react";
import { useFieldArray, useFormContext, useFormState } from "react-hook-form";

export default function TableWidgetConfigForm() {
  const form = useFormContext<WidgetConfig>();
  const tableColumnsValue = useFieldArray({
    control: form.control,
    name: "tableColumns",
  });
  const formState = useFormState();
  const { invalid } = form.getFieldState("tableColumns", formState);

  const remainingColumnOptions = [
    ...tableWidgetRegularColumns,
    ...tableWidgetAggregationColumns,
  ].filter((x) => !tableColumnsValue.fields.find((y) => y.column === x));

  return (
    <>
      <FormField
        control={form.control}
        name="tableColumns"
        render={() => (
          <div>
            <DndContext
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={(e) => {
                const { active, over } = e;

                if (over && active.id !== over.id) {
                  const oldIndex = tableColumnsValue.fields.findIndex(
                    (x) => x.column === active.id,
                  );
                  const newIndex = tableColumnsValue.fields.findIndex(
                    (x) => x.column === over.id,
                  );

                  form.setValue(
                    "tableColumns",
                    arrayMove(tableColumnsValue.fields, oldIndex, newIndex),
                  );
                }
              }}
            >
              <div className="grid grid-cols-9 gap-4">
                <div className="bg-card col-span-4 rounded-md p-4">
                  {remainingColumnOptions.map((col) => (
                    <button
                      key={col}
                      className="hover:bg-primary/30 block w-full cursor-pointer rounded-md px-2 py-1 text-left"
                      onClick={() => tableColumnsValue.append({ column: col })}
                    >
                      {col}
                    </button>
                  ))}
                </div>
                <div className="col-span-1 flex flex-col items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() =>
                      tableColumnsValue.append(
                        remainingColumnOptions.map((x) => ({ column: x })),
                      )
                    }
                  >
                    <ChevronsRightIcon />
                  </Button>
                  <ArrowRightIcon size={16} />
                  <Button
                    variant="outline"
                    onClick={() => tableColumnsValue.remove()}
                  >
                    <ChevronsLeftIcon />
                  </Button>
                </div>
                <div className="col-span-4 flex flex-col">
                  <div
                    className={`bg-card w-full max-w-full grow rounded-md p-4 ${invalid ? "border-destructive border" : ""}`}
                  >
                    <SortableContext
                      items={tableColumnsValue.fields.map((item) => ({
                        ...item,
                        id: item.column,
                      }))}
                    >
                      {tableColumnsValue.fields.map((col) => (
                        <SortableItem
                          id={col.column}
                          key={col.column}
                          className="hover:bg-primary/30 cursor-pointer rounded-md px-2 py-1"
                        >
                          {col.column}
                        </SortableItem>
                      ))}
                    </SortableContext>
                  </div>
                  <FormMessage className="mt-2" />
                </div>
              </div>
            </DndContext>
          </div>
        )}
      />
    </>
  );
}
