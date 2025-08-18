import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { queryKeys } from "@/lib/query-keys";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useAddAccountDialog } from "./dialog-forms/add-account-dialog";
import { db } from "@/db";
import { accounts } from "@/db/schema";

export function AccountSelector() {
  const { setOpen } = useAddAccountDialog();
  const { navigate } = useRouter();
  const { accountId } = useParams({ strict: false });
  const { data } = useSuspenseQuery({
    queryKey: [queryKeys.account],
    queryFn: async () => {
      return await db.select().from(accounts);
    },
  });

  const activeAccount = data.find((acc) => acc.id === accountId);

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          {activeAccount
            ? `${activeAccount.name} (${activeAccount.currency})`
            : "Select Account"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        {data.map((acc) => (
          <DropdownMenuItem
            onSelect={() =>
              navigate({
                to: "/$accountId",
                params: {
                  accountId: acc.id,
                },
              })
            }
            key={acc.id}
          >
            {acc.name} ({acc.currency})
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem onSelect={() => setOpen(true)}>
          <Plus />
          <span>Create New</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
