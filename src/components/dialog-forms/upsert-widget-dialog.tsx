import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { create } from "zustand";

type UpsertWidgetDialogState = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

export const useUpsertWidgetDialog = create<UpsertWidgetDialogState>()(
  (set) => ({
    open: false,
    setOpen: (open) => set({ open }),
  }),
);

export default function UpsertWidgetDialog() {
  const { open, setOpen } = useUpsertWidgetDialog();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Widget</DialogTitle>
          <DialogDescription>Create a new widget</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
