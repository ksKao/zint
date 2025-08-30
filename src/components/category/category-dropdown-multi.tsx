import CategoryIcon from "@/components/category/category-icon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
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
import { useMeasure } from "react-use";

export default function CategoryDropdownMulti({
  selectedIds,
  onSelectChange,
  errorMessage,
  label = "Category",
}: {
  label?: string;
  selectedIds: string[];
  onSelectChange: (id: string, selected: boolean) => void;
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
              {selectedIds.length
                ? `${selectedIds.length} selected`
                : "Select a category"}
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
                      <DropdownMenuCheckboxItem
                        key={subCat.id}
                        checked={selectedIds.includes(subCat.id)}
                        onCheckedChange={(checked) =>
                          onSelectChange(subCat.id, checked)
                        }
                        className="flex gap-4"
                      >
                        <CategoryIcon category={subCat} />
                        {subCat.name}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            ) : (
              <DropdownMenuCheckboxItem
                key={cat.id}
                className="flex gap-4"
                checked={selectedIds.includes(cat.id)}
                onCheckedChange={(checked) => onSelectChange(cat.id, checked)}
              >
                <CategoryIcon category={cat} />
                {cat.name}
              </DropdownMenuCheckboxItem>
            ),
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <FormMessage>{errorMessage}</FormMessage>
    </FormItem>
  );
}
