import CategoryIcon from "@/components/category/category-icon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { db } from "@/db";
import { queryKeys } from "@/lib/query-keys";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useMemo } from "react";
import useMeasure from "react-use/lib/useMeasure";

export default function CategoryDropdown({
  selectedCategoryId,
  selectedSubcategoryId,
  onSelect,
  errorMessage,
  label = "Category",
}: {
  label?: string;
  selectedCategoryId: string | null;
  selectedSubcategoryId: string | null;
  onSelect: (value: {
    categoryId: string;
    subCategoryId: string | null;
  }) => void;
  errorMessage?: string;
}) {
  const { accountId } = useParams({ strict: false });
  const { data: existingCategories } = useSuspenseQuery({
    queryKey: [queryKeys.category, "with-sub"],
    queryFn: async () => {
      const results = await db.query.categories.findMany({
        with: {
          subCategories: true,
        },
        where: (categories, { eq }) =>
          eq(categories.accountId, accountId ?? ""),
      });

      return results;
    },
  });
  const [categoryDropdownRef, { width: categoryDropdownWidth }] =
    useMeasure<HTMLButtonElement>();
  const selectedCategoryName = useMemo(() => {
    if (!selectedCategoryId && !selectedSubcategoryId) return null;

    for (const category of existingCategories) {
      for (const subCategory of category.subCategories) {
        if (subCategory.id === selectedSubcategoryId) return subCategory.name;
      }

      if (category.id === selectedCategoryId) return category.name;
    }

    return null;
  }, [selectedCategoryId, selectedSubcategoryId, existingCategories]);

  return (
    <FormItem className="w-full">
      {label && <FormLabel>Category</FormLabel>}
      <DropdownMenu modal>
        <FormControl>
          <DropdownMenuTrigger asChild disabled={!existingCategories.length}>
            <Button
              variant="outline"
              className="justify-between"
              ref={categoryDropdownRef}
            >
              {selectedCategoryName ?? "Select a category"}
              <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
        </FormControl>
        <DropdownMenuContent
          style={{
            width: categoryDropdownWidth + 24, // 24px padding
          }}
        >
          {existingCategories.map((cat) =>
            cat.subCategories.length ? (
              <DropdownMenuSub key={cat.id}>
                <DropdownMenuSubTrigger className="flex gap-4">
                  <CategoryIcon category={cat} />
                  {cat.name}
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    {cat.subCategories.map((subCat) => (
                      <DropdownMenuItem
                        key={subCat.id}
                        onSelect={() =>
                          onSelect({
                            categoryId: cat.id,
                            subCategoryId: subCat.id,
                          })
                        }
                        className="flex gap-4"
                      >
                        <CategoryIcon category={subCat} />
                        {subCat.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            ) : (
              <DropdownMenuItem
                key={cat.id}
                onSelect={() =>
                  onSelect({ categoryId: cat.id, subCategoryId: null })
                }
                className="flex gap-4"
              >
                <CategoryIcon category={cat} />
                {cat.name}
              </DropdownMenuItem>
            ),
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <FormMessage>{errorMessage}</FormMessage>
    </FormItem>
  );
}
