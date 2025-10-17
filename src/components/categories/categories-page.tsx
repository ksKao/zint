import CategoryIcon from "@/components/category/category-icon";
import Draggable from "@/components/dnd/draggable";
import Droppable from "@/components/dnd/droppable";
import { Item, ItemContent, ItemMedia } from "@/components/ui/item";
import { db } from "@/db";
import {
  categories as categoryTable,
  subCategories,
  transactions,
} from "@/db/schema";
import { queryKeys } from "@/lib/query-keys";
import { DndContext } from "@dnd-kit/core";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { eq } from "drizzle-orm";
import { toast } from "sonner";

function CategoryItem({
  category,
}: {
  category: typeof categoryTable.$inferSelect;
}) {
  return (
    <Item variant="outline" className="cursor-grab">
      <ItemMedia>
        <CategoryIcon category={category} />
      </ItemMedia>
      <ItemContent>{category.name}</ItemContent>
    </Item>
  );
}

export default function CategoriesPage({ accountId }: { accountId: string }) {
  const queryClient = useQueryClient();
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
      toast.error("An unexpected error occured");
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
      toast.error("An unexpected error occured");
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
        toast.error("An unexpected error occured");
      },
    });

  return (
    <div className="w-full px-4 py-8">
      <h1 className="text-2xl font-bold">Categories</h1>
      <div className="my-4 space-y-2">
        <DndContext
          onDragEnd={(e) => {
            const { active, over } = e;

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
                      <CategoryItem category={category} />
                    ) : (
                      <Draggable id={category.id} className="w-full">
                        <CategoryItem category={category} />
                      </Draggable>
                    )}
                    {category.subCategories.length ? (
                      <div className="ml-8">
                        {category.subCategories.map((subcategory) => (
                          <Draggable
                            key={subcategory.id}
                            id={`${category.id}-${subcategory.id}`}
                          >
                            <Item variant="outline" className="rounded-none">
                              <ItemMedia>
                                <CategoryIcon category={subcategory} />
                              </ItemMedia>
                              <ItemContent>{subcategory.name}</ItemContent>
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
  );
}
