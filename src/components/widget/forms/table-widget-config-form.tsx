import SortableItem from "@/components/dnd/sortable-item";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  sortByFieldOptions,
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
  Plus,
  XIcon,
} from "lucide-react";
import { useFieldArray, useFormContext, useFormState } from "react-hook-form";

export default function TableWidgetConfigForm() {
  const form = useFormContext<WidgetConfig>();
  const tableColumnsValue = useFieldArray({
    control: form.control,
    name: "tableColumns",
  });
  const groupByColumnValue = useFieldArray({
    control: form.control,
    name: "groupByColumns",
  });
  const sortByColumnValue = useFieldArray({
    control: form.control,
    name: "sortByColumns",
  });
  const formState = useFormState();
  const { invalid: tableColumnsInvalid } = form.getFieldState(
    "tableColumns",
    formState,
  );
  const { invalid: groupByColumnsInvalid, error: groupByColumnsError } =
    form.getFieldState("groupByColumns", formState);
  const { invalid: sortByColumnsInvalid, error: sortByColumnsError } =
    form.getFieldState("sortByColumns", formState);

  const remainingColumnOptions = [
    ...tableWidgetRegularColumns,
    ...tableWidgetAggregationColumns,
  ].filter((x) => !tableColumnsValue.fields.find((y) => y.column === x));

  const availableGroupByColumns = tableWidgetRegularColumns.filter(
    (c) => !(groupByColumnValue.fields ?? []).find((x) => x.column === c),
  );

  const availableSortByColumns = [
    ...tableWidgetRegularColumns,
    ...tableWidgetAggregationColumns,
  ].filter((x) => !sortByColumnValue.fields.find((y) => y.column === x));

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
                </div>
                <div className="col-span-5"></div>
                <FormMessage className="col-span-4" />
              </div>
            </DndContext>
          </FormItem>
        )}
      />
      <div
        className={`w-full rounded-md border p-3 ${groupByColumnsInvalid ? "border-destructive" : ""}`}
      >
        <div className="flex items-center justify-between">
          <p className="font-normal">Group By Columns</p>
          {availableGroupByColumns.length > 0 ? (
            <Button
              size="icon"
              variant="outline"
              type="button"
              onClick={() => {
                groupByColumnValue.append({
                  column: availableGroupByColumns[0],
                });
              }}
            >
              <Plus />
            </Button>
          ) : null}
        </div>
        <ul
          className={`space-y-4 ${groupByColumnValue.fields.length ? "mt-4" : ""}`}
        >
          {groupByColumnValue.fields.map((field, i) => (
            <li key={field.id} className="flex items-center gap-2">
              <FormField
                control={form.control}
                name={`groupByColumns.${i}.column` as const}
                render={({ field }) => (
                  <FormItem className="grow">
                    <FormLabel>Column</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a column" />
                          </SelectTrigger>
                        </FormControl>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => groupByColumnValue.remove(i)}
                        >
                          <XIcon />
                        </Button>
                      </div>
                      <SelectContent>
                        {tableWidgetRegularColumns.map((col) => (
                          <SelectItem
                            value={col}
                            key={col}
                            disabled={!availableGroupByColumns.includes(col)}
                          >
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </li>
          ))}
        </ul>
        {groupByColumnsError?.root?.message ? (
          <FormMessage className="mt-2">
            {groupByColumnsError.root.message}
          </FormMessage>
        ) : null}
      </div>
      <div
        className={`w-full rounded-md border p-3 ${sortByColumnsInvalid ? "border-destructive" : ""}`}
      >
        <div className="flex items-center justify-between">
          <p className="font-normal">Sort By</p>
          {availableSortByColumns.length > 0 ? (
            <Button
              size="icon"
              variant="outline"
              type="button"
              onClick={() => {
                sortByColumnValue.append({
                  column: availableSortByColumns[0],
                  order: "Ascending",
                });
              }}
            >
              <Plus />
            </Button>
          ) : null}
        </div>
        <ul
          className={`space-y-4 ${sortByColumnValue.fields.length ? "mt-4" : ""}`}
        >
          {sortByColumnValue.fields.map((field, i) => (
            <li key={field.id} className="flex items-center gap-2">
              <FormField
                control={form.control}
                name={`sortByColumns.${i}.column` as const}
                render={({ field }) => (
                  <FormItem className="grow">
                    <FormLabel>Column</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a column" />
                          </SelectTrigger>
                        </FormControl>
                      </div>
                      <SelectContent>
                        {[
                          ...tableWidgetRegularColumns,
                          ...tableWidgetAggregationColumns,
                        ].map((col) => (
                          <SelectItem
                            value={col}
                            key={col}
                            disabled={!availableSortByColumns.includes(col)}
                          >
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`sortByColumns.${i}.order` as const}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <SelectTrigger className="w-36">
                            <SelectValue placeholder="Select an order" />
                          </SelectTrigger>
                        </FormControl>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => sortByColumnValue.remove(i)}
                        >
                          <XIcon />
                        </Button>
                      </div>
                      <SelectContent>
                        {sortByFieldOptions.map((col) => (
                          <SelectItem value={col} key={col}>
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </li>
          ))}
        </ul>
        {sortByColumnsError?.root?.message ? (
          <FormMessage className="mt-2">
            {sortByColumnsError.root.message}
          </FormMessage>
        ) : null}
      </div>
    </>
  );
}
