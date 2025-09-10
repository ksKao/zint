import { useDraggable } from "@dnd-kit/core";

type Props = {
  id: string;
} & React.ComponentProps<"button">;

export default function Draggable({ id, style, ...rest }: Props) {
  const { setNodeRef, transform, listeners, attributes } = useDraggable({ id });

  return (
    <button
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
