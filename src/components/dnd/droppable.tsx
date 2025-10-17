import { useDroppable } from "@dnd-kit/core";

type Props = {
  id: string;
  disabled?: boolean;
  render?: ((args: { isOver: boolean }) => React.ReactNode) | React.ReactNode;
} & React.ComponentProps<"div">;

export default function Droppable({
  id,
  render,
  disabled,
  children,
  ...rest
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled });

  return (
    <div ref={setNodeRef} {...rest}>
      {typeof render === "function" ? render({ isOver }) : render}
      {children}
    </div>
  );
}
