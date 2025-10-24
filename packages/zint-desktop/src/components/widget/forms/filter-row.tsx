import CategoryDropdownMulti from "@/components/category/category-dropdown-multi";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toggle } from "@/components/ui/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  categoryFilterOperators,
  dateFilterOperators,
  filterFieldOptions,
  numberFilterOperators,
  presetDateFilters,
  stringFilterOperators,
  WidgetConfig,
} from "@/lib/types/widget.type";
import { format } from "date-fns";
import { ArrowLeftRightIcon, CalendarIcon, XIcon } from "lucide-react";
import { Suspense, useEffect, useMemo } from "react";
import { useFormContext } from "react-hook-form";

export default function FilterRow({
  index,
  remove,
}: {
  index: number;
  remove: () => void;
}) {
  const form = useFormContext<WidgetConfig>();

  const selectedField = form.watch(`filters.${index}.field` as const);
  const filterValue = form.watch(`filters.${index}.value` as const);

  const filterDateValueDisplay = useMemo(() => {
    if (selectedField !== "Date" || !filterValue) return "";

    if (
      typeof filterValue === "string" &&
      ([...presetDateFilters] as string[]).includes(filterValue)
    )
      return filterValue;
    else if (typeof filterValue === "number")
      return `${filterValue} day(s) ago`;
    else return format(new Date(filterValue as string), "PPP");
  }, [filterValue, selectedField]);

  const { operators, valueFieldComponent } = useMemo(() => {
    switch (selectedField) {
      case "Amount": {
        return {
          operators: numberFilterOperators,
          valueFieldComponent: (
            <FormControl>
              <Input
                value={String(filterValue)}
                onChange={(e) =>
                  form.setValue(`filters.${index}.value`, e.target.value)
                }
              />
            </FormControl>
          ),
        };
      }
      case "Date":
        return {
          operators: dateFilterOperators,
          valueFieldComponent: (
            <Popover modal>
              <FormControl>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`grow justify-between ${filterDateValueDisplay ? "" : "text-muted-foreground"}`}
                  >
                    {filterDateValueDisplay || "Select a date"}
                    <CalendarIcon />
                  </Button>
                </PopoverTrigger>
              </FormControl>
              <PopoverContent className="bg-card w-80">
                <Tabs defaultValue="account" className="w-full">
                  <TabsList className="w-full">
                    <TabsTrigger className="w-full" value="Relative">
                      Relative
                    </TabsTrigger>
                    <TabsTrigger className="w-full" value="Days Ago">
                      Days Ago
                    </TabsTrigger>
                    <TabsTrigger className="w-full" value="Fixed Date">
                      Fixed Date
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="Relative">
                    <RadioGroup
                      defaultValue={
                        typeof filterValue === "string"
                          ? filterValue
                          : undefined
                      }
                      onValueChange={(val) =>
                        form.setValue(`filters.${index}.value` as const, val)
                      }
                    >
                      {presetDateFilters.map((option) => (
                        <FormItem
                          key={option}
                          className="flex items-center gap-3"
                        >
                          <FormControl>
                            <RadioGroupItem
                              value={option}
                              className="border-muted-foreground"
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {option}
                          </FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </TabsContent>
                  <TabsContent value="Days Ago">
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Input
                          className="border-border w-16"
                          type="number"
                          value={
                            typeof filterValue === "number" ? filterValue : ""
                          }
                          onChange={(e) => {
                            form.setValue(
                              `filters.${index}.value`,
                              e.target.value ? e.target.valueAsNumber : "",
                            );
                          }}
                        />
                      </FormControl>
                      days ago
                    </div>
                  </TabsContent>
                  <TabsContent value="Fixed Date">
                    <Calendar
                      className="mx-auto pb-0"
                      mode="single"
                      selected={
                        filterValue instanceof Date ? filterValue : undefined
                      }
                      onSelect={(val) =>
                        form.setValue(
                          `filters.${index}.value`,
                          val?.toISOString() ?? "",
                        )
                      }
                    />
                  </TabsContent>
                </Tabs>
              </PopoverContent>
            </Popover>
          ),
        };
      case "Category":
        return {
          operators: categoryFilterOperators,
          valueFieldComponent: (
            <Suspense>
              <CategoryDropdownMulti
                label=""
                selectedIds={Array.isArray(filterValue) ? filterValue : []}
                onSelectChange={(id, selected) => {
                  let oldValue = filterValue;

                  if (!Array.isArray(oldValue)) oldValue = [];

                  form.setValue(
                    `filters.${index}.value`,
                    selected
                      ? [...oldValue, id]
                      : oldValue.filter((v) => v !== id),
                  );
                }}
              />
            </Suspense>
          ),
        };
      default:
        return {
          operators: stringFilterOperators,
          valueFieldComponent: (
            <FormControl>
              <Input
                value={String(filterValue)}
                onChange={(e) =>
                  form.setValue(`filters.${index}.value`, e.target.value)
                }
              />
            </FormControl>
          ),
        };
    }
  }, [selectedField, filterValue, form, index, filterDateValueDisplay]);

  useEffect(() => {
    const operator = form.getValues(`filters.${index}.operator`);

    // only reset value if the select operator does not exist in the array
    if (
      !(operators as unknown as (typeof operators)[number][]).includes(operator)
    )
      form.setValue(`filters.${index}.operator` as const, operators[0]);
  }, [operators, form, index]);

  return (
    <li className="grid grid-cols-4 gap-2">
      <FormField
        control={form.control}
        name={`filters.${index}.field` as const}
        render={({ field }) => (
          <FormItem className="self-start">
            <FormLabel>Field</FormLabel>
            <Select
              value={field.value}
              onValueChange={(val) => {
                field.onChange(val);
                form.setValue(`filters.${index}.value`, "");
              }}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a field" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {filterFieldOptions.map((option) => (
                  <SelectItem value={option} key={option}>
                    {option}
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
        name={`filters.${index}.operator` as const}
        render={({ field }) => (
          <FormItem className="self-start">
            <FormLabel>Operator</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an operator" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {operators.map((option) => (
                  <SelectItem value={option} key={option}>
                    {option}
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
        name={`filters.${index}.value` as const}
        render={() => (
          <FormItem className="col-span-2 self-start">
            <FormLabel>Value</FormLabel>
            <div className="flex gap-2">
              {valueFieldComponent}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Toggle
                      pressed={form.watch(
                        `filters.${index}.reverseFilter` as const,
                      )}
                      onPressedChange={(pressed) =>
                        form.setValue(
                          `filters.${index}.reverseFilter` as const,
                          pressed,
                        )
                      }
                    >
                      <ArrowLeftRightIcon />
                    </Toggle>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Reverse Condition</TooltipContent>
              </Tooltip>
              <Button
                size="icon"
                variant="ghost"
                type="button"
                onClick={remove}
              >
                <XIcon />
              </Button>
            </div>
            {selectedField === "Category" ? null : <FormMessage />}
          </FormItem>
        )}
      />
    </li>
  );
}
