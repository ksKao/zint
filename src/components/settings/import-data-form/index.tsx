import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { db } from "@/db";
import {
  categories as categoriesTable,
  subCategories as subcategoriesTable,
  transactions as transactionsTable,
} from "@/db/schema";
import { queryKeys } from "@/lib/query-keys";
import { zodResolver } from "@hookform/resolvers/zod";
import { createId } from "@paralleldrive/cuid2";
import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { eq } from "drizzle-orm";
import ExcelJS from "exceljs";
import { AlertCircleIcon, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod/v4";
import ColumnMapSelector, { ColumnOption } from "./column-map-selector";

const columnMapFormSchema = z.object({
  title: z.coerce.number("Title column is required"),
  description: z.coerce.number("Invalid column type").nullish(),
  date: z.coerce.number("Date column is required"),
  payee: z.coerce.number("Invalid column type").nullish(),
  isTemporary: z.coerce.number("Invalid column type").nullish(),
  amount: z.coerce.number("Amount column is required"),
  category: z.coerce.number("Invalid column type").nullish(),
  subCategory: z.coerce.number("Invalid column type").nullish(),
});

const transactionSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullish(),
  date: z.coerce.date(),
  payee: z.string().nullish(),
  isTemporary: z.coerce.boolean(),
  amount: z.number(),
  categoryId: z.cuid2().min(1).nullish(),
  subCategoryId: z.cuid2().min(1).nullish(),
});

export default function ImportDataForm() {
  const [file, setFile] = useState<ArrayBuffer>();
  const [accountId, setAccountId] = useState<string>();
  const [selectedSheet, setSelectedSheet] = useState<string>();
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [parsedData, setParsedData] = useState<{
    transactions: z.infer<typeof transactionSchema>[];
    totalRows: number;
    newCategories: Map<string, { name: string }>;
    newSubcategories: Map<string, { name: string; categoryId: string }>;
  }>();
  const form = useForm({
    resolver: zodResolver(columnMapFormSchema),
  });
  const queryClient = useQueryClient();
  const { data: accounts } = useSuspenseQuery({
    queryKey: [queryKeys.account],
    queryFn: async () => {
      return await db.query.accounts.findMany();
    },
  });
  const { data: categories } = useSuspenseQuery({
    queryKey: [queryKeys.category],
    queryFn: async () => {
      return await db.query.categories.findMany({
        with: {
          subCategories: true,
        },
      });
    },
  });
  const { data: workbook, isPending: workbookPending } = useQuery({
    queryKey: [file],
    queryFn: async () => {
      if (!file) return null;

      const workbook = new ExcelJS.Workbook();

      return await workbook.xlsx.load(file);
    },
  });
  const { mutate: importData, isPending: importDataPending } = useMutation({
    mutationFn: async () => {
      if (!parsedData) {
        toast.error("Unable to import. Aborted.");
        return;
      }

      if (!accountId) {
        toast.error("Please select an account before proceeding.");
        return;
      }

      if (parsedData.newCategories.size)
        await db.insert(categoriesTable).values(
          Array.from(parsedData.newCategories.entries()).map(
            (c) =>
              ({
                id: c[0],
                name: c[1].name,
                accountId,
              }) as typeof categoriesTable.$inferInsert,
          ),
        );

      if (parsedData.newSubcategories.size)
        await db.insert(subcategoriesTable).values(
          Array.from(parsedData.newSubcategories.entries()).map(
            (c) =>
              ({
                id: c[0],
                name: c[1].name,
                categoryId: c[1].categoryId,
                accountId,
              }) as typeof subcategoriesTable.$inferInsert,
          ),
        );

      const transactionsToBeInserted: (typeof transactionsTable.$inferInsert)[] =
        [];

      parsedData.transactions.sort(
        (a, b) => a.date.getTime() - b.date.getTime(),
      );

      for (let i = 0; i < parsedData.transactions.length; i++) {
        const transaction = parsedData.transactions[i];
        const prevTransaction =
          i === 0 ? undefined : transactionsToBeInserted[i - 1];
        transaction.date.setHours(0, 0, 0, 0);

        transactionsToBeInserted.push({
          ...transaction,
          accountId,
          balance: prevTransaction
            ? prevTransaction.balance + transaction.amount
            : transaction.amount,
          order:
            !prevTransaction ||
            prevTransaction.date?.getTime() !== transaction.date.getTime()
              ? 0
              : prevTransaction.order + 1,
        });
      }

      await db
        .delete(transactionsTable)
        .where(eq(transactionsTable.accountId, accountId));

      await db.insert(transactionsTable).values(transactionsToBeInserted);
    },
    onSuccess: () => {
      toast.success("Data has been imported successfully.");
      setAlertDialogOpen(false);
      setParsedData(undefined);
      setAccountId(undefined);
      setFile(undefined);
      setSelectedSheet(undefined);
      form.reset();
      queryClient.invalidateQueries();
    },
    onError: (e) => {
      console.log(e.message);
      toast.error("Something went wrong while trying to import.");
      setAlertDialogOpen(false);
      setParsedData(undefined);
      queryClient.invalidateQueries();
    },
  });

  const firstRowCells = useMemo(() => {
    if (!workbook || !selectedSheet) return;

    const sheet = workbook.getWorksheet(selectedSheet);

    if (!sheet) return;

    const cells: ColumnOption[] = [];

    const firstRow = sheet.getRow(1);

    firstRow.eachCell((cell, col) => {
      if (cell.value !== undefined && cell.value !== null)
        cells.push({
          address: cell.address,
          value: cell.value.toString(),
          column: col,
        });
    });

    return cells;
  }, [selectedSheet, workbook]);

  useEffect(() => {
    form.reset();
  }, [firstRowCells, form]);

  return (
    <>
      <AlertDialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Review Import</AlertDialogTitle>
            <AlertDialogDescription>
              Review your data before importing it
            </AlertDialogDescription>
          </AlertDialogHeader>
          {parsedData ? (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircleIcon />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  <p>
                    Please backup your existing transaction(s) before performing
                    this action as they will be deleted.
                  </p>
                </AlertDescription>
              </Alert>

              <ul className="list-inside list-disc">
                <li>Rows Detected: {parsedData.totalRows}</li>
                <li>Valid Records: {parsedData.transactions.length}</li>
                {parsedData.newCategories.size ? (
                  <li>
                    {parsedData.newCategories.size} new categories will be
                    created.
                  </li>
                ) : null}
                {parsedData.newSubcategories.size ? (
                  <li>
                    {parsedData.newSubcategories.size} new sub-categories will
                    be created.
                  </li>
                ) : null}
              </ul>
            </div>
          ) : (
            <p className="text-muted-foreground">
              An unknown error has occured. Please try to import again.
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setParsedData(undefined)}>
              Cancel
            </AlertDialogCancel>
            <Button onClick={() => importData()} loading={importDataPending}>
              Confirm
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <h2 className="my-4 text-xl font-semibold">Import</h2>
      <div className="space-y-4">
        <div className="grid w-full max-w-sm items-center gap-3">
          <Label htmlFor="account">Account</Label>
          <Select value={accountId ?? ""} onValueChange={setAccountId}>
            <SelectTrigger id="account" className="w-full">
              <SelectValue placeholder="Select an account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name} ({account.currency})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {accountId ? (
          <div className="grid w-full max-w-sm items-center gap-3">
            <Label htmlFor="file">Select an xlsx file</Label>
            <Input
              id="file"
              type="file"
              accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={async (e) => {
                setFile(await e.target.files?.[0]?.arrayBuffer());
              }}
            />
          </div>
        ) : null}
        {workbook || workbookPending ? (
          <div className="grid w-full max-w-sm items-center gap-3">
            <Label htmlFor="sheet">Sheet</Label>
            <div className="flex items-center gap-2">
              <Select
                value={selectedSheet ?? ""}
                onValueChange={setSelectedSheet}
                disabled={workbookPending}
              >
                <SelectTrigger id="sheet" className="w-full">
                  <SelectValue placeholder="Select a sheet" />
                </SelectTrigger>
                {workbook ? (
                  <SelectContent>
                    {workbook.worksheets.map((sheet) => (
                      <SelectItem key={sheet.name} value={sheet.name}>
                        {sheet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                ) : null}
              </Select>
              {workbookPending ? (
                <Loader2 className="text-muted-foreground animate-spin" />
              ) : null}
            </div>
          </div>
        ) : null}
        {firstRowCells && firstRowCells.length ? (
          <>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((formData) => {
                  const sheet = workbook?.getWorksheet(selectedSheet);

                  if (!sheet) {
                    toast.error("Could not find the sheet specified.");
                    return;
                  }

                  if (sheet.rowCount <= 2) {
                    toast.error("Could not find data in sheet.");
                    return;
                  }

                  const parsedTransactions: z.infer<
                    typeof transactionSchema
                  >[] = [];
                  const newCategories: NonNullable<
                    typeof parsedData
                  >["newCategories"] = new Map();
                  const newSubcategories: NonNullable<
                    typeof parsedData
                  >["newSubcategories"] = new Map();

                  sheet.eachRow((row, rowNumber) => {
                    if (rowNumber <= 1) return;

                    let categoryId: string | null = null;
                    let subCategoryId: string | null = null;

                    const categoryName =
                      formData.category && row.getCell(formData.category).value
                        ? String(row.getCell(formData.category).value)
                        : null;
                    const subCategoryName =
                      formData.subCategory &&
                      row.getCell(formData.subCategory).value
                        ? String(row.getCell(formData.subCategory).value)
                        : null;

                    // in the case where there is a specific subcategory column
                    if (subCategoryName) {
                      let found = false;
                      for (const category of categories) {
                        for (const subCategory of category.subCategories ??
                          []) {
                          // both subcategory and category name must match, or category name must be empty
                          if (
                            subCategory.name === subCategoryName &&
                            (category.name === categoryName ||
                              categoryName !== null)
                          ) {
                            categoryId = category.id;
                            subCategoryId = subCategory.id;
                            found = true;
                            break;
                          }

                          if (found) break;
                        }

                        if (!found) {
                          // if category name is filled not still not found, means that either:
                          // - category doesnt exist, or
                          // - category exists, but no such sub-category under it
                          // In this case, we need to create it (but need to check if the same category is already in newCategories)
                          // if category name is not filled but sub category is, create a new category called "New Category" and add the new subcategory in

                          if (categoryName) {
                            const existingCategory = categories.find(
                              (c) => c.name === categoryName,
                            );

                            if (existingCategory) {
                              categoryId = existingCategory.id;

                              const foundNewSubCat = Array.from(
                                newSubcategories.entries(),
                              ).find(
                                (sc) =>
                                  sc[1].name === subCategoryName &&
                                  sc[1].categoryId === categoryId,
                              );

                              if (foundNewSubCat) {
                                subCategoryId = foundNewSubCat[0];
                              } else {
                                subCategoryId = createId();
                                newSubcategories.set(subCategoryId, {
                                  name: subCategoryName,
                                  categoryId,
                                });
                              }
                            } else {
                              const foundNewCat = Array.from(
                                newCategories.entries(),
                              ).find((c) => c[1].name === categoryName);

                              if (foundNewCat) {
                                categoryId = foundNewCat[0];
                              } else {
                                categoryId = createId();
                                newCategories.set(categoryId, {
                                  name: "New Category",
                                });
                              }

                              newSubcategories.set(createId(), {
                                name: subCategoryName,
                                categoryId,
                              });
                            }
                          } else {
                            categoryId = createId();
                            newCategories.set(categoryId, {
                              name: "New Category",
                            });
                            subCategoryId = createId();
                            newSubcategories.set(subCategoryId, {
                              name: subCategoryName,
                              categoryId,
                            });
                          }
                        }
                      }
                    } else if (categoryName) {
                      // if only category column exists, do best effort matching
                      let found = false;
                      for (const category of categories) {
                        for (const subCategory of category.subCategories ??
                          []) {
                          if (categoryName === category.name) {
                            found = true;
                            categoryId = category.id;
                            break;
                          } else if (categoryName === subCategory.name) {
                            found = true;
                            categoryId = category.id;
                            subCategoryId = subCategory.id;
                          }
                        }

                        if (categoryName === category.name && !found) {
                          found = true;
                          categoryId = category.id;
                          break;
                        }
                      }

                      if (!found) {
                        const foundNewCategory = Array.from(
                          newCategories.entries(),
                        ).find((c) => c[1].name === categoryName);

                        if (foundNewCategory) categoryId = foundNewCategory[0];
                        else {
                          categoryId = createId();
                          newCategories.set(categoryId, {
                            name: categoryName,
                          });
                        }
                      }
                    }

                    const rowData: unknown = {
                      title: row.getCell(formData.title).value,
                      description: formData.description
                        ? row.getCell(formData.description).value
                        : null,
                      date: row.getCell(formData.date).value,
                      payee: formData.payee
                        ? row.getCell(formData.payee).value
                        : null,
                      isTemporary: formData.isTemporary
                        ? row.getCell(formData.isTemporary).value
                        : false,
                      amount: row.getCell(formData.amount).value,
                      categoryId,
                      subCategoryId,
                    };

                    const parsed = transactionSchema.safeParse(rowData);

                    if (!parsed.success) {
                      return;
                    }

                    parsedTransactions.push(parsed.data);
                  });

                  if (!parsedTransactions.length) {
                    toast.error("No valid rows found in sheet.");
                    return;
                  }

                  console.log(newCategories.size, newSubcategories.size);
                  setParsedData({
                    transactions: parsedTransactions,
                    newCategories,
                    newSubcategories,
                    totalRows: sheet.rowCount,
                  });

                  setAlertDialogOpen(true);
                })}
              >
                <Card className="w-full max-w-sm">
                  <CardHeader>
                    <CardTitle>Column Mapping</CardTitle>
                    <CardDescription>
                      Map columns in the Excel sheet
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ColumnMapSelector
                      control={form.control}
                      name="title"
                      label="Title"
                      options={firstRowCells}
                    />
                    <ColumnMapSelector
                      control={form.control}
                      name="date"
                      label="Date"
                      options={firstRowCells}
                    />
                    <ColumnMapSelector
                      control={form.control}
                      name="amount"
                      label="Amount"
                      options={firstRowCells}
                    />
                    <ColumnMapSelector
                      control={form.control}
                      name="description"
                      label="Description"
                      options={firstRowCells}
                      optional
                    />
                    <ColumnMapSelector
                      control={form.control}
                      name="payee"
                      label="Payee"
                      options={firstRowCells}
                      optional
                    />
                    <ColumnMapSelector
                      control={form.control}
                      name="category"
                      label="Category"
                      options={firstRowCells}
                      optional
                    />
                    <ColumnMapSelector
                      control={form.control}
                      name="subCategory"
                      label="Subcategory"
                      options={firstRowCells}
                      optional
                    />
                    <ColumnMapSelector
                      control={form.control}
                      name="isTemporary"
                      label="Temporary Transaction"
                      options={firstRowCells}
                      optional
                    />
                  </CardContent>
                </Card>
                <Button className="mt-4 w-sm">Confirm</Button>
              </form>
            </Form>
          </>
        ) : null}
      </div>
    </>
  );
}
