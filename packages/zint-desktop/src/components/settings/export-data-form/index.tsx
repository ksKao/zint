import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { useMutation } from "@tanstack/react-query";
import { BaseDirectory, create } from "@tauri-apps/plugin-fs";
import { toast } from "sonner";
import ExcelJS from "exceljs";
import { asc, eq } from "drizzle-orm";
import { transactions as transactionTable } from "@/db/schema";
import { format } from "date-fns";

export default function ExportDataForm() {
  const { mutate: exportData, isPending: exportDataPending } = useMutation({
    mutationFn: async () => {
      const accounts = await db.query.accounts.findMany();

      if (!accounts.length) {
        toast.error("No accounts found. No data to export.");
        return;
      }

      const workbook = new ExcelJS.Workbook();

      for (const account of accounts) {
        const transactions = await db.query.transactions.findMany({
          with: {
            category: true,
            subCategory: true,
          },
          where: eq(transactionTable.accountId, account.id),
          orderBy: [asc(transactionTable.date), asc(transactionTable.order)],
        });

        const sheet = workbook.addWorksheet(
          `${account.name} (${account.currency})`,
        );

        sheet.columns = [
          { header: "No", key: "no" },
          {
            header: "Date",
            key: "date",
          },
          {
            header: "Title",
            key: "title",
          },
          {
            header: "Description",
            key: "description",
          },
          {
            header: "Payee",
            key: "payee",
          },
          {
            header: "Category",
            key: "category",
          },
          {
            header: "Subcategory",
            key: "subcategory",
          },
          {
            header: "Amount",
            key: "amount",
          },
          {
            header: "Balance",
            key: "balance",
          },
          {
            header: "Temporary",
            key: "isTemporary",
          },
        ];

        sheet.addRows(
          transactions.map((transaction, i) => ({
            no: i + 1,
            ...transaction,
            category: transaction.category?.name,
            subcategory: transaction.subCategory?.name,
            isTemporary: transaction.isTemporary ? "Yes" : "No",
          })),
        );
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const file = await create(
        `Zint export ${format(new Date(), "PPP HH:mm")}.xlsx`,
        {
          baseDir: BaseDirectory.Download,
        },
      );
      await file.write(new Uint8Array(buffer));
      await file.close();
    },
    onSuccess: () => {
      toast.success(
        "Data has been exported to the download folder successfully.",
      );
    },
    onError: (e) => {
      console.log(e);
      toast.error("An error occured while trying to export.");
    },
  });

  return (
    <>
      <h2 className="my-4 text-xl font-semibold">Export</h2>
      <Button
        className="w-sm"
        loading={exportDataPending}
        onClick={() => exportData()}
      >
        Export Data
      </Button>
    </>
  );
}
