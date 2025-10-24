import { categories, subCategories } from "@/db/schema";
import { cn } from "@/lib/utils";

export default function CategoryIcon({
  category,
  className = "",
}: {
  category: typeof categories.$inferSelect | typeof subCategories.$inferSelect;
  className?: string;
}) {
  const baseClassName =
    "rounded-md h-8 w-8 border flex items-center justify-center";

  if (category.icon)
    return <img className={cn(baseClassName, className)} src={category.icon} />;

  return (
    <div className={cn(baseClassName, className)}>
      {category.name.charAt(0).toUpperCase()}
    </div>
  );
}
