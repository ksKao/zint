import { db } from "@/db";
import { storageKeys } from "@/lib/storage-keys";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: RouteComponent,
  beforeLoad: async () => {
    const savedId = localStorage.getItem(storageKeys.accountId);

    if (!savedId) return;

    const found = await db.query.accounts.findFirst({
      where: (accounts, { eq }) => eq(accounts.id, savedId),
    });

    if (found) {
      throw redirect({
        to: "/$accountId",
        params: { accountId: found.id },
      });
    }
  },
});

function RouteComponent() {
  return (
    <div className="text-muted-foreground flex h-full w-full items-center justify-center">
      Select an account to get started
    </div>
  );
}
