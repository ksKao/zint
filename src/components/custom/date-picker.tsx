import { Button } from "@/components/ui/button";
import { FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";

export default function DatePicker({
  value,
  onChange,
  label = "",
  placeholder = "",
}: {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  label?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <FormItem>
      {label ? <FormLabel>{label}</FormLabel> : null}
      <Popover modal open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id="date"
            className="items-center justify-between font-normal"
          >
            {value ? format(value, "dd MMM yyyy") : placeholder}
            <CalendarIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="flex w-fit justify-center p-0">
          <Calendar
            mode="single"
            selected={value}
            className="text-primary-foreground"
            onSelect={(date) => {
              onChange(date);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      <FormMessage />
    </FormItem>
  );
}
