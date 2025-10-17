import { useDraggable } from "@dnd-kit/core";

type Props = {
  id: string;
  disabled?: boolean;
} & React.ComponentProps<"div">;

export default function Draggable({ id, style, disabled, ...rest }: Props) {
  const { setNodeRef, transform, listeners, attributes } = useDraggable({
    id,
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        transform: `translate3d(${transform?.x ?? 0}px, ${transform?.y ?? 0}px, 0)`,
      }}
      {...listeners}
      {...attributes}
      {...rest}
    />
  );
}
