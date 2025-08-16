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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { db } from "@/db";
import { categories, subCategories } from "@/db/schema";
import { queryKeys } from "@/lib/query-keys";
import { fileToBase64 } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod/v4";
import { create } from "zustand";

type AddCategoryDialogState = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

export const useAddCategoryDialog = create<AddCategoryDialogState>()((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));

const supportedImageTypes: z.core.util.MimeTypes[] = [
  "image/jpeg",
  "image/svg+xml",
  "image/webp",
  "image/png",
];

const formSchema = z.object({
  name: z.string("Name is required").min(1, "Name is required"),
  file: z
    .file("Invalid file type")
    .mime(
      supportedImageTypes,
      "Image is not a valid type. Must be JPG/PNG/SVG/WEBP",
    )
    .nullable(),
  parentCategory: z.cuid2("Invalid category").nullable(),
});

export default function AddCategoryDialog({
  accountId,
}: {
  accountId: string;
}) {
  const { open, setOpen } = useAddCategoryDialog();
  const [enableSubcategory, setEnableSubcategory] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>();
  const { data: mainCategories } = useSuspenseQuery({
    queryKey: [queryKeys.category],
    queryFn: async () => {
      return await db.select().from(categories);
    },
  });
  const queryClient = useQueryClient();
  const { mutate: addCategory, isPending } = useMutation({
    mutationFn: async (formData: z.infer<typeof formSchema>) => {
      const base64 = formData.file ? await fileToBase64(formData.file) : null;

      if (!formData.parentCategory) {
        await db.insert(categories).values({
          name: formData.name,
          accountId,
          icon: base64,
        });
      } else {
        await db.insert(subCategories).values({
          name: formData.name,
          accountId,
          icon: base64,
          categoryId: formData.parentCategory,
        });
      }
    },
    onSuccess: (_data, variables) => {
      toast.success(`${variables.name} has been added successfully`);
      form.reset();
      queryClient.invalidateQueries({
        queryKey: [queryKeys.category],
      });
      setOpen(false);
    },
    onError: () => {
      toast.error("An error occurred while trying trying to add category.");
    },
  });
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      file: null,
      parentCategory: null,
    },
  });

  const image = form.watch("file");

  useEffect(() => {
    if (!image) {
      setImagePreview(undefined);
      return;
    }

    fileToBase64(image).then((base64) => setImagePreview(base64));
  }, [image]);

  useEffect(() => {
    form.setValue("parentCategory", null);
  }, [enableSubcategory, form]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((formData) => addCategory(formData))}
            className="space-y-4"
          >
            <DialogHeader>
              <DialogTitle>Add Category</DialogTitle>
              <DialogDescription>Create a new category</DialogDescription>
            </DialogHeader>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Category Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="file"
              render={({ field }) => (
                <FormItem className="grow">
                  <FormLabel>Icon</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      {imagePreview ? (
                        <img
                          className="border-border h-9 w-9 rounded-sm border"
                          src={imagePreview}
                          alt="Image Preview"
                        />
                      ) : null}
                      <Input
                        type="file"
                        accept={supportedImageTypes.join(",")}
                        onChange={(e) => {
                          const image = e.target.files?.[0];

                          if (!image) return;

                          field.onChange(image);
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-4 rounded-md border p-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="enable-subcategory" className="font-normal">
                  Add as sub-category
                </Label>
                <Switch
                  disabled={!mainCategories.length}
                  checked={enableSubcategory && !!mainCategories.length}
                  onCheckedChange={setEnableSubcategory}
                  id="enable-subcategory"
                />
              </div>
              {enableSubcategory ? (
                <FormField
                  control={form.control}
                  name="parentCategory"
                  render={({ field }) => (
                    <FormItem>
                      <Select
                        onValueChange={(val) => field.onChange(val || null)}
                        defaultValue={field.value ?? ""}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a main category" />
                        </SelectTrigger>
                        <SelectContent>
                          {mainCategories.map((cat) => (
                            <SelectItem value={cat.id} key={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button loading={isPending}>Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
