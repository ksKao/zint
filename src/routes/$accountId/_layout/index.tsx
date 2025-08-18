import { db } from "@/db";
import { queryKeys } from "@/lib/query-keys";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/$accountId/_layout/")({
  component: Index,
});

function Index() {
  const { accountId } = Route.useParams();
  const { data } = useSuspenseQuery({
    queryKey: [queryKeys.transaction],
    queryFn: async () => {
      return await db.query.transactions.findMany({
        orderBy: (t, { asc, desc }) => [desc(t.date), asc(t.order)],
      });
    },
  });

  return (
    <div className="p-2">
      <h3>Welcome Home!</h3>
      <Link to="/$accountId/categories" params={{ accountId }}>
        Click me
      </Link>
      <ul>
        {data.map((d) => (
          <li key={d.id}>
            {d.title} ({d.date?.toDateString()})
          </li>
        ))}
      </ul>
    </div>
  );
}
