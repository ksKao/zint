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

type AddCategoryDialogState = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

export const useAddCategoryDialog = create<AddCategoryDialogState>()((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));

export default function AddCategoryDialog({
  accountId,
}: {
  accountId: string;
}) {
  const { open, setOpen } = useAddCategoryDialog();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Category</DialogTitle>
          <DialogDescription>Create a new category</DialogDescription>
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
