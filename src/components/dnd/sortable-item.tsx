import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";

type Props = { id: string } & React.ComponentProps<"div">;

export default function SortableItem({ id, ...rest }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

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
    />
  );
}
