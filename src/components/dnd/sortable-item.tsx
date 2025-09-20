import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVerticalIcon } from "lucide-react";

type Props = { id: string } & React.ComponentProps<"div">;

export default function SortableItem({ id, children, ...rest }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    setActivatorNodeRef,
  } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      {...rest}
      {...attributes}
      {...listeners}
      className={cn("flex items-center", rest.className)}
    >
      <button
        className="cursor-pointer pr-4"
        ref={setActivatorNodeRef}
        type="button"
      >
        <GripVerticalIcon size={16} />
      </button>
      {children}
    </div>
  );
}
