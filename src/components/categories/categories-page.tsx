import CategoryIcon from "@/components/category/category-icon";
import Draggable from "@/components/dnd/draggable";
import Droppable from "@/components/dnd/droppable";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemMedia,
} from "@/components/ui/item";
import { db } from "@/db";
import {
  categories as categoryTable,
  subCategories,
  transactions,
} from "@/db/schema";
import { queryKeys } from "@/lib/query-keys";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { eq } from "drizzle-orm";
import { Edit2Icon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useUpsertCategoryDialog } from "../dialog-forms/upsert-category-dialog";

function CategoryItem({
  category,
  setDeletingCategory,
  setConfirmDeleteDialogOpen,
}: {
  category: typeof categoryTable.$inferSelect & {
    subCategories: (typeof subCategories.$inferSelect)[];
  };
  setDeletingCategory: React.Dispatch<
    React.SetStateAction<typeof categoryTable.$inferSelect | undefined>
  >;
  setConfirmDeleteDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const {
    setCategory: setUpsertCategoryDialogCategory,
    setOpen: setUpsertCategoryDialogOpen,
  } = useUpsertCategoryDialog();

  return (
    <Item
      variant="outline"
      className={`${category.subCategories.length ? "" : "cursor-grab"}`}
    >
      <ItemMedia>
        <CategoryIcon category={category} />
      </ItemMedia>
      <ItemContent>{category.name}</ItemContent>
      <ItemActions>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => {
            setUpsertCategoryDialogCategory(category);
            setUpsertCategoryDialogOpen(true);
          }}
        >
          <Edit2Icon size={16} />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => {
            setDeletingCategory(category);
            setConfirmDeleteDialogOpen(true);
          }}
        >
          <Trash2Icon size={16} />
        </Button>
      </ItemActions>
    </Item>
  );
}

export default function CategoriesPage({ accountId }: { accountId: string }) {
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      delay: 100,
      distance: 0,
    },
  });
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(pointerSensor, keyboardSensor);
  const queryClient = useQueryClient();
  const [deletingCategory, setDeletingCategory] = useState<
    typeof categoryTable.$inferSelect | typeof subCategories.$inferSelect
  >();
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);
  const {
    setCategory: setUpsertCategoryDialogCategory,
    setOpen: setUpsertCategoryDialogOpen,
  } = useUpsertCategoryDialog();
  const { data: categories } = useSuspenseQuery({
    queryKey: [queryKeys.category, accountId],
    queryFn: async () => {
      return await db.query.categories.findMany({
        with: {
          subCategories: true,
        },
        where: eq(categoryTable.accountId, accountId),
      });
    },
  });
  const {
    mutate: moveCategoryToCategory,
    isPending: moveCategoryToCategoryPending,
  } = useMutation({
    mutationFn: async ({
      oldCategory,
      newCategoryId,
    }: {
      oldCategory: typeof categoryTable.$inferSelect;
      newCategoryId: string;
    }) => {
      // add subcategory
      await db.insert(subCategories).values({
        id: oldCategory.id,
        accountId: oldCategory.accountId,
        categoryId: newCategoryId,
        name: oldCategory.name,
        icon: oldCategory.icon,
      });

      // update transactions
      await db
        .update(transactions)
        .set({
          categoryId: newCategoryId,
          subCategoryId: oldCategory.id,
        })
        .where(eq(transactions.categoryId, oldCategory.id));

      // remove category
      await db
        .delete(categoryTable)
        .where(eq(categoryTable.id, oldCategory.id));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries();
    },
    onError: () => {
      toast.error("An unexpected error occurred");
    },
  });
  const {
    mutate: moveSubcategoryToCategory,
    isPending: moveSubcategoryToCategoryPending,
  } = useMutation({
    mutationFn: async ({
      subCategoryId,
      categoryId,
    }: {
      subCategoryId: string;
      categoryId: string;
    }) => {
      await db
        .update(subCategories)
        .set({
          categoryId: categoryId,
        })
        .where(eq(subCategories.id, subCategoryId));

      await db
        .update(transactions)
        .set({
          categoryId,
        })
        .where(eq(transactions.subCategoryId, subCategoryId));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries();
    },
    onError: () => {
      toast.error("An unexpected error occurred");
    },
  });
  const { mutate: ungroupSubcategory, isPending: ungroupSubcategoryPending } =
    useMutation({
      mutationFn: async ({
        subCategory,
      }: {
        subCategory: typeof subCategories.$inferSelect;
      }) => {
        await db.insert(categoryTable).values({
          id: subCategory.id,
          accountId: subCategory.accountId,
          name: subCategory.name,
          icon: subCategory.icon,
        });

        await db
          .update(transactions)
          .set({
            categoryId: subCategory.id,
            subCategoryId: null,
          })
          .where(eq(transactions.subCategoryId, subCategory.id));

        await db
          .delete(subCategories)
          .where(eq(subCategories.id, subCategory.id));
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries();
      },
      onError: () => {
        toast.error("An unexpected error occurred");
      },
    });
  const { mutate: deleteCategory, isPending: deleteCategoryPending } =
    useMutation({
      mutationFn: async ({
        categoryId,
        subCategoryId,
      }: {
        categoryId: string;
        subCategoryId?: string;
      }) => {
        if (subCategoryId) {
          await db
            .delete(subCategories)
            .where(eq(subCategories.id, subCategoryId));
        } else {
          await db
            .delete(categoryTable)
            .where(eq(categoryTable.id, categoryId));
        }
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries();
        setDeletingCategory(undefined);
        setConfirmDeleteDialogOpen(false);
        toast.success("Category has been deleted");
      },
      onError: () => {
        toast.error("Unable to delete category");
      },
    });

  return (
    <>
      <AlertDialog
        open={confirmDeleteDialogOpen}
        onOpenChange={setConfirmDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription className="sr-only">
              Confirm Delete
            </AlertDialogDescription>
          </AlertDialogHeader>
          Are you sure you want to delete {deletingCategory?.name}?
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              loading={deleteCategoryPending}
              onClick={() => {
                if (!deletingCategory) {
                  toast.error("An unexpected error occurred.");
                  return;
                }

                if ("categoryId" in deletingCategory) {
                  deleteCategory({
                    categoryId: deletingCategory.categoryId,
                    subCategoryId: deletingCategory.id,
                  });
                } else {
                  deleteCategory({
                    categoryId: deletingCategory.id,
                  });
                }
              }}
            >
              Confirm
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="w-full px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Categories</h1>
          <Button
            onClick={() => {
              setUpsertCategoryDialogCategory(undefined);
              setUpsertCategoryDialogOpen(true);
            }}
          >
            <PlusIcon /> Add New
          </Button>
        </div>
        <div className="my-4 space-y-2">
          <DndContext
            sensors={sensors}
            onDragEnd={(e) => {
              const { active, over } = e;

              if (active.id === over?.id) return;

              const activeIdSplit = active.id.toString().split("-");
              const draggedCategoryId = activeIdSplit[0];
              const draggedSubCategoryId = activeIdSplit[1];

              if (!over) {
                if (!draggedCategoryId || !draggedSubCategoryId) return;

                const category = categories.find(
                  (c) => c.id === draggedCategoryId,
                );

                if (!category) return;

                const subCategory = category.subCategories.find(
                  (s) => s.id === draggedSubCategoryId,
                );

                if (!subCategory) return;

                ungroupSubcategory({ subCategory });
              } else {
                if (draggedSubCategoryId) {
                  moveSubcategoryToCategory({
                    categoryId: over.id.toString(),
                    subCategoryId: draggedSubCategoryId,
                  });
                } else if (draggedCategoryId) {
                  const oldCategory = categories.find(
                    (c) => c.id === draggedCategoryId,
                  );

                  if (!oldCategory) {
                    toast.error("An unexpected error occurred.");
                    return;
                  }

                  moveCategoryToCategory({
                    oldCategory,
                    newCategoryId: over.id.toString(),
                  });
                } else {
                  toast.error("An unexpected error occurred.");
                  return;
                }
              }
            }}
          >
            {categories
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((category) => (
                <Droppable
                  id={category.id}
                  key={category.id}
                  disabled={
                    moveCategoryToCategoryPending ||
                    moveSubcategoryToCategoryPending ||
                    ungroupSubcategoryPending
                  }
                  render={({ isOver }) => (
                    <div className={`${isOver ? "border-primary border" : ""}`}>
                      {category.subCategories.length ? (
                        <CategoryItem
                          category={category}
                          setDeletingCategory={setDeletingCategory}
                          setConfirmDeleteDialogOpen={
                            setConfirmDeleteDialogOpen
                          }
                        />
                      ) : (
                        <Draggable id={category.id} className="w-full">
                          <CategoryItem
                            category={category}
                            setDeletingCategory={setDeletingCategory}
                            setConfirmDeleteDialogOpen={
                              setConfirmDeleteDialogOpen
                            }
                          />
                        </Draggable>
                      )}
                      {category.subCategories.length ? (
                        <div className="ml-8">
                          {category.subCategories
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((subcategory) => (
                              <Draggable
                                key={subcategory.id}
                                id={`${category.id}-${subcategory.id}`}
                                className="cursor-grab"
                              >
                                <Item
                                  variant="outline"
                                  className="rounded-none"
                                >
                                  <ItemMedia>
                                    <CategoryIcon category={subcategory} />
                                  </ItemMedia>
                                  <ItemContent>{subcategory.name}</ItemContent>
                                  <ItemActions>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => {
                                        setUpsertCategoryDialogCategory(
                                          subcategory,
                                        );
                                        setUpsertCategoryDialogOpen(true);
                                      }}
                                    >
                                      <Edit2Icon size={16} />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => {
                                        setDeletingCategory(subcategory);
                                        setConfirmDeleteDialogOpen(true);
                                      }}
                                    >
                                      <Trash2Icon size={16} />
                                    </Button>
                                  </ItemActions>
                                </Item>
                              </Draggable>
                            ))}
                        </div>
                      ) : null}
                    </div>
                  )}
                />
              ))}
          </DndContext>
        </div>
      </div>
    </>
  );
}
