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
import { XIcon } from "lucide-react";
import { ControllerProps, FieldPath, FieldValues } from "react-hook-form";

export type ColumnOption = {
  address: string;
  value: string;
  column: number;
};

export default function ColumnMapSelector<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  options,
  label,
  optional = false,
}: {
  control: ControllerProps<TFieldValues, TName>["control"];
  name: ControllerProps<TFieldValues, TName>["name"];
  options: ColumnOption[];
  label: string;
  optional?: boolean;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label}
            {optional ? null : <span className="text-destructive">*</span>}
          </FormLabel>
          <div className="flex gap-2">
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="w-full min-w-0">
                  <SelectValue placeholder="Select a column" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem
                    key={option.column}
                    value={option.column.toString()}
                  >
                    {option.value} ({option.address})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {optional ? (
              <Button
                size="icon"
                variant="ghost"
                type="button"
                disabled={!field.value}
                onClick={() => field.onChange("")}
              >
                <XIcon />
              </Button>
            ) : null}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
