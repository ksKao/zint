import SortableItem from "@/components/dnd/sortable-item";
import { Button } from "@/components/ui/button";
import { FormField, FormItem, FormMessage } from "@/components/ui/form";
import {
  tableWidgetAggregationColumns,
  tableWidgetRegularColumns,
  WidgetConfig,
} from "@/lib/types/widget.type";
import { DndContext } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { arrayMove, SortableContext } from "@dnd-kit/sortable";
import {
  ArrowRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  XIcon,
} from "lucide-react";
import { useFieldArray, useFormContext, useFormState } from "react-hook-form";
import LimitInput from "./limit-input";
import TableOrderConfigForm from "./table-order-config-form";
import TableGroupByConfigForm from "./table-group-by-config-form";

export default function TableWidgetConfigForm() {
  const form = useFormContext<WidgetConfig>();
  const tableColumnsValue = useFieldArray({
    control: form.control,
    name: "tableColumns",
  });
  const formState = useFormState();
  const { invalid: tableColumnsInvalid } = form.getFieldState(
    "tableColumns",
    formState,
  );

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
          <FormItem>
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
              <div className="grid grid-cols-9 gap-2">
                <div className="col-span-4">Available Columns</div>
                <div className="col-span-1" />
                <div className="col-span-4">Selected Columns</div>
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
                    className={`bg-card w-full max-w-full grow rounded-md p-4 ${tableColumnsInvalid ? "border-destructive border" : ""}`}
                  >
                    <SortableContext
                      items={tableColumnsValue.fields.map((item) => ({
                        ...item,
                        id: item.column,
                      }))}
                    >
                      {tableColumnsValue.fields.map((col, i) => (
                        <SortableItem
                          id={col.column}
                          key={col.column}
                          className="hover:bg-primary/30 group rounded-md py-1"
                        >
                          {col.column}
                          <button
                            type="button"
                            className="mr-2 ml-auto hidden cursor-pointer group-hover:inline-block"
                            onMouseDown={() => tableColumnsValue.remove(i)} // use onMouseDown here because onClick is blocked by sortable
                          >
                            <XIcon size={16} />
                          </button>
                        </SortableItem>
                      ))}
                    </SortableContext>
                  </div>
                </div>
                <div className="col-span-5"></div>
                <FormMessage className="col-span-4" />
              </div>
            </DndContext>
          </FormItem>
        )}
      />
      <TableGroupByConfigForm />
      <TableOrderConfigForm />
      <LimitInput />
    </>
  );
}
