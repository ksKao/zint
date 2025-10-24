import { useUpsertAccountDialog } from "@/components/dialog-forms/upsert-account-dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Item, ItemActions, ItemContent } from "@/components/ui/item";
import { db } from "@/db";
import { queryKeys } from "@/lib/query-keys";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Edit2Icon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { accounts as accountsTable } from "@/db/schema";
import { toast } from "sonner";
import { eq } from "drizzle-orm";
import { useNavigate } from "@tanstack/react-router";

export default function ManageAccounts() {
  const {
    setOpen: setUpsertAccountDialogOpen,
    setAccount: setUpsertAccountDialogAccount,
  } = useUpsertAccountDialog();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [confirmDeleteAccountDialogOpen, setConfirmDeleteAccountDialogOpen] =
    useState(false);
  const [deleteAccount, setDeleteAccount] =
    useState<typeof accountsTable.$inferSelect>();
  const { data: accounts } = useSuspenseQuery({
    queryKey: [queryKeys.account],
    queryFn: async () => {
      return await db.query.accounts.findMany();
    },
  });
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (!deleteAccount) {
        toast.error("Something unexpected happened. Unable to delete account");
        return;
      }

      await db
        .delete(accountsTable)
        .where(eq(accountsTable.id, deleteAccount.id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries();

      if (deleteAccount && window.location.href.includes(deleteAccount.id)) {
        navigate({
          to: "/settings",
        });
      }

      setConfirmDeleteAccountDialogOpen(false);
      setDeleteAccount(undefined);

      toast.success("Account deleted successfully");
    },
    onError: () => {
      toast.error("Delete account failed.");
    },
  });

  return (
    <>
      <AlertDialog
        open={confirmDeleteAccountDialogOpen}
        onOpenChange={setConfirmDeleteAccountDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription className="sr-only">
              Confirm Delete Account
            </AlertDialogDescription>
          </AlertDialogHeader>
          <p>
            Are you sure you want to delete {deleteAccount?.name} (
            {deleteAccount?.currency})?
          </p>
          <p>
            This action is irreversible, and all transactions and category in
            that account will also be deleted.
          </p>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => mutate()}
              loading={isPending}
            >
              Confirm
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <h2 className="my-4 text-xl font-semibold">Accounts</h2>
      {accounts.length ? (
        <ul className="max-w-sm">
          {accounts.map((account) => (
            <li key={account.id}>
              <Item variant="outline">
                <ItemContent>
                  {account.name} ({account.currency})
                </ItemContent>
                <ItemActions>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setUpsertAccountDialogAccount(account);
                      setUpsertAccountDialogOpen(true);
                    }}
                  >
                    <Edit2Icon size={16} />
                  </Button>
                </ItemActions>
                <ItemActions>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setDeleteAccount(account);
                      setConfirmDeleteAccountDialogOpen(true);
                    }}
                  >
                    <Trash2Icon size={16} />
                  </Button>
                </ItemActions>
              </Item>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground">No Accounts Available</p>
      )}
      <Button
        className="mt-4 w-sm"
        onClick={() => {
          setUpsertAccountDialogAccount(undefined);
          setUpsertAccountDialogOpen(true);
        }}
      >
        <PlusIcon /> Add New
      </Button>
    </>
  );
}
