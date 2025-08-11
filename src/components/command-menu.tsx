import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Command } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "@/components/providers/theme-provider";
import { capitalizeWords } from "@/lib/utils";

export default function CommandMenu() {
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (
        e.key.toLowerCase() === "p" &&
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey
      ) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);

    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="outline" onClick={() => setOpen(true)}>
            <Command size={16} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <kbd>Ctrl Shift P</kbd>
        </TooltipContent>
      </Tooltip>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search" />
        <CommandList>
          <CommandEmpty>No results found</CommandEmpty>
          <CommandGroup heading="Quick Actions">
            <CommandItem
              onSelect={() => {
                setOpen(false);
              }}
            >
              Add Transaction
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setOpen(false);
              }}
            >
              Add Category
            </CommandItem>
            <CommandItem
              onSelect={() => {
                toggleTheme();
                setOpen(false);
              }}
            >
              Switch Theme (Current Theme: {capitalizeWords(theme)})
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
