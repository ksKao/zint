import { db } from "@/db";
import { transactions } from "@/db/schema";
import { queryKeys } from "@/lib/query-keys";
import { barChartSchema } from "@/lib/types/widget.type";
import { useSuspenseQuery } from "@tanstack/react-query";
import z from "zod/v4";

export default function BarWidget({
  config,
}: {
  config: z.infer<typeof barChartSchema>;
}) {
  const { data } = useSuspenseQuery({
    queryKey: [queryKeys.transaction, queryKeys.widget],
    queryFn: async () => {
      const query = db.select().from(transactions);

      return await query;
    },
  });

  return <pre className="whitespace-normal">{JSON.stringify(data)}</pre>;
}
