import { useEffect, useMemo, useRef, useState } from "react";
import CategoryIcon from "@/components/category/category-icon";
import { useUpsertTransactionDialog } from "@/components/dialog-forms/upsert-transaction-dialog";
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
import { Item, ItemContent } from "@/components/ui/item";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/db";
import {
  accounts,
  categories,
  subCategories,
  transactions as transactionTable,
} from "@/db/schema";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  Table as ReactTable,
  Row,
  useReactTable,
} from "@tanstack/react-table";
import {
  useVirtualizer,
  VirtualItem,
  Virtualizer,
} from "@tanstack/react-virtual";
import { format } from "date-fns";
import { and, eq, gt, or, sql } from "drizzle-orm";
import { CheckIcon, Edit2Icon, Trash2Icon, XIcon } from "lucide-react";
import { toast } from "sonner";

type Transaction = typeof transactionTable.$inferSelect & {
  category: typeof categories.$inferSelect | null;
  subCategory: typeof subCategories.$inferSelect | null;
};

export default function TransactionsTable({
  transactions,
  account,
}: {
  transactions: Transaction[];

  account: typeof accounts.$inferSelect;
}) {
  const {
    setOpen: setUpsertTransactionDialogOpen,
    setTransaction: setUpsertTransactionDialogTransaction,
  } = useUpsertTransactionDialog();
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);
  const [deletingTransaction, setDeletingTransaction] =
    useState<typeof transactionTable.$inferSelect>();

  const queryClient = useQueryClient();
  const { mutate: deleteTransaction, isPending: deleteTransactionPending } =
    useMutation({
      mutationFn: async () => {
        if (!deletingTransaction) {
          toast.error("Unable to delete transaction.");
          return;
        }

        await db
          .delete(transactionTable)
          .where(eq(transactionTable.id, deletingTransaction.id));

        await db
          .update(transactionTable)
          .set({
            balance: sql`${transactionTable.balance} - ${deletingTransaction.amount}`,
          })
          .where(
            or(
              gt(transactionTable.date, deletingTransaction.date),
              and(
                eq(transactionTable.date, deletingTransaction.date),
                gt(transactionTable.order, deletingTransaction.order),
              ),
            ),
          );

        await db
          .update(transactionTable)
          .set({
            order: sql`${transactionTable.order} - 1`,
          })
          .where(
            and(
              eq(transactionTable.date, deletingTransaction.date),
              gt(transactionTable.order, deletingTransaction.order),
            ),
          );
      },
      onSuccess: () => {
        queryClient.invalidateQueries();
        toast.success("Transaction has been deleted.");
        setConfirmDeleteDialogOpen(false);
        setDeletingTransaction(undefined);
      },
      onError: () => {
        toast.error("An error occurred while trying to delete transaction.");
        queryClient.invalidateQueries();
      },
    });
  const columns = useMemo<ColumnDef<Transaction>[]>(
    () => [
      {
        accessorKey: "date",
        header: "Date",
        cell: (info) => format(info.getValue<Date>(), "dd MMM yyyy"),
      },
      {
        accessorKey: "title",
        header: "Title",
        meta: { className: "grow" },
      },
      {
        accessorKey: "description",
        header: "Description",
        meta: { className: "grow" },
        cell: (info) => info.getValue() || "--",
      },
      {
        accessorFn: (row) => ({
          category: row.category,
          subCategory: row.subCategory,
        }),
        header: "Description",
        size: 240,
        cell: (info) => {
          const data = info.getValue<{
            category: Transaction["category"];
            subCategory: Transaction["subCategory"];
          }>();

          return (
            <div className="flex items-center justify-center gap-2">
              {data.category && data.subCategory ? (
                <>
                  <CategoryIcon category={data.subCategory} />
                  <p>
                    {data.subCategory.name} ({data.category.name})
                  </p>
                </>
              ) : data.category ? (
                <>
                  <CategoryIcon category={data.category} />
                  <p>{data.category.name}</p>
                </>
              ) : (
                <p>--</p>
              )}
            </div>
          );
        },
      },
      {
        id: "payee",
        header: "Payee",
        cell: (info) => info.getValue() || "--",
      },
      {
        accessorKey: "isTemporary",
        header: () => "Temporary",
        cell: (info) => (
          <div className="flex items-center justify-center">
            {info.getValue<boolean>() ? (
              <CheckIcon size={16} />
            ) : (
              <XIcon size={16} />
            )}
          </div>
        ),
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: (info) => (
          <p
            className={`${info.getValue<number>() > 0 ? "text-green-500" : info.getValue<number>() < 0 ? "text-destructive" : ""}`}
          >
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: account.currency,
            }).format(info.getValue<number>())}
          </p>
        ),
      },
      {
        accessorKey: "balance",
        header: "Balance",
        cell: (info) => (
          <p>
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: account.currency,
            }).format(info.getValue<number>())}
          </p>
        ),
      },
      {
        accessorFn: (row) => row,
        id: "row-action",
        header: "",
        cell: (info) => {
          const transaction = info.getValue<Transaction>();

          return (
            <>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setUpsertTransactionDialogTransaction(transaction);
                  setUpsertTransactionDialogOpen(true);
                }}
              >
                <Edit2Icon />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setDeletingTransaction(transaction);
                  setConfirmDeleteDialogOpen(true);
                }}
              >
                <Trash2Icon />
              </Button>
            </>
          );
        },
      },
    ],
    [
      account.currency,
      setUpsertTransactionDialogOpen,
      setUpsertTransactionDialogTransaction,
    ],
  );

  // The virtualizer will need a reference to the scrollable container element
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState(transactions);
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  useEffect(() => {
    setData([...transactions]);
  }, [transactions]);

  // All important CSS styles are included as inline styles for this example. This is not recommended for your code.
  return (
    <>
      <AlertDialog
        open={confirmDeleteDialogOpen}
        onOpenChange={setConfirmDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription className="sr-only">
              Confirm Delete Transaction
            </AlertDialogDescription>
          </AlertDialogHeader>
          <p>The following transaction will be deleted:</p>
          <Item variant="outline">
            <ItemContent>
              <p>{deletingTransaction?.title}</p>
            </ItemContent>
          </Item>
          <p>Are you sure you want to proceed? This action cannot be undone</p>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => deleteTransaction()}
              loading={deleteTransactionPending}
            >
              Confirm
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="h-full w-full">
        <div
          className="relative h-full w-full overflow-auto pr-4"
          ref={tableContainerRef}
        >
          {/* Even though we're still using sematic table tags, we must use CSS grid and flexbox for dynamic row heights */}
          <Table className="h-full w-full">
            <TableHeader className="sticky top-0 z-10 grid w-full">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="bg-background flex w-full"
                >
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        className={cn(
                          "flex items-center justify-center",
                          header.column.columnDef.meta?.className,
                        )}
                        style={{
                          width: header.getSize(),
                        }}
                      >
                        <div
                          {...{
                            className: header.column.getCanSort()
                              ? "cursor-pointer select-none"
                              : "",
                            onClick: header.column.getToggleSortingHandler(),
                          }}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {{
                            asc: " 🔼",
                            desc: " 🔽",
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBodyVirtualized
              table={table}
              tableContainerRef={tableContainerRef}
            />
          </Table>
        </div>
      </div>
    </>
  );
}

interface TableBodyProps {
  table: ReactTable<Transaction>;
  tableContainerRef: React.RefObject<HTMLDivElement | null>;
}

function TableBodyVirtualized({ table, tableContainerRef }: TableBodyProps) {
  const { rows } = table.getRowModel();

  // Important: Keep the row virtualizer in the lowest component possible to avoid unnecessary re-renders.
  const rowVirtualizer = useVirtualizer<HTMLDivElement, HTMLTableRowElement>({
    count: rows.length,
    estimateSize: () => 52, //estimate row height for accurate scrollbar dragging
    getScrollElement: () => tableContainerRef.current,
    // measure dynamic row height, except in firefox because it measures table border height incorrectly
    measureElement:
      typeof window !== "undefined" &&
      navigator.userAgent.indexOf("Firefox") === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
    overscan: 5,
  });

  return (
    <TableBody
      className="relative grid"
      style={{
        height: `${rowVirtualizer.getTotalSize()}px`, //tells scrollbar how big the table is
      }}
    >
      {rowVirtualizer.getVirtualItems().map((virtualRow) => {
        const row = rows[virtualRow.index] as Row<Transaction>;
        return (
          <TableBodyRow
            key={row.id}
            row={row}
            virtualRow={virtualRow}
            rowVirtualizer={rowVirtualizer}
          />
        );
      })}
    </TableBody>
  );
}

interface TableBodyRowProps {
  row: Row<Transaction>;
  virtualRow: VirtualItem;
  rowVirtualizer: Virtualizer<HTMLDivElement, HTMLTableRowElement>;
}

function TableBodyRow({ row, virtualRow, rowVirtualizer }: TableBodyRowProps) {
  return (
    <TableRow
      data-index={virtualRow.index} //needed for dynamic row height measurement
      ref={(node) => rowVirtualizer.measureElement(node)} //measure dynamic row height
      key={row.id}
      className="absolute flex w-full"
      style={{
        transform: `translateY(${virtualRow.start}px)`, //this should always be a `style` as it changes on scroll
      }}
    >
      {row.getVisibleCells().map((cell) => {
        return (
          <TableCell
            key={cell.id}
            className={cn(
              "flex items-center justify-center text-center whitespace-normal",
              cell.column.columnDef.meta?.className,
            )}
            style={{
              width: cell.column.getSize(),
            }}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        );
      })}
    </TableRow>
  );
}
