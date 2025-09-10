import { useDroppable } from "@dnd-kit/core";

type Props = {
  id: string;
} & React.ComponentProps<"div">;

export default function Droppable({ id, ...rest }: Props) {
  const { setNodeRef } = useDroppable({ id });

  return <div ref={setNodeRef} {...rest} />;
}
