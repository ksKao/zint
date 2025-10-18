import {
  accounts,
  categories,
  subCategories,
  transactions as transactionTable,
} from "@/db/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { CheckIcon, XIcon } from "lucide-react";
import CategoryIcon from "../category/category-icon";

export default function TransactionsTable({
  transactions,
  account,
}: {
  transactions: (typeof transactionTable.$inferSelect & {
    category: typeof categories.$inferSelect | null;
    subCategory: typeof subCategories.$inferSelect | null;
  })[];
  account: typeof accounts.$inferSelect;
}) {
  return (
    <div className="max-h-full w-full overflow-y-auto">
      <Table className="">
        <TableHeader>
          <TableRow>
            <TableHead className="w-32 text-center">Date</TableHead>
            <TableHead className="text-center">Title</TableHead>
            <TableHead className="text-center">Description</TableHead>
            <TableHead className="w-32 text-center">Category</TableHead>
            <TableHead className="w-32 text-center">Payee</TableHead>
            <TableHead className="w-24 text-center">Temporary</TableHead>
            <TableHead className="w-32 text-center">Amount</TableHead>
            <TableHead className="w-32 text-center">Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell className="w-32 text-center">
                {format(transaction.date, "dd MMM yyyy")}
              </TableCell>
              <TableCell className="text-center">{transaction.title}</TableCell>
              <TableCell className="text-center">
                <p>{transaction.description || "--"}</p>
              </TableCell>
              <TableCell className="flex w-64 items-center justify-center gap-2">
                {transaction.category && transaction.subCategory ? (
                  <>
                    <CategoryIcon category={transaction.subCategory} />
                    <p>
                      {transaction.subCategory.name} (
                      {transaction.category.name})
                    </p>
                  </>
                ) : transaction.category ? (
                  <>
                    <CategoryIcon category={transaction.category} />
                    <p>{transaction.category.name}</p>
                  </>
                ) : (
                  <p>--</p>
                )}
              </TableCell>
              <TableCell className="w-32 text-center">
                <p>{transaction.payee || "--"}</p>
              </TableCell>
              <TableCell className="w-24">
                <div className="flex items-center justify-center">
                  {transaction.isTemporary ? <CheckIcon /> : <XIcon />}
                </div>
              </TableCell>
              <TableCell
                className={`w-32 text-center ${transaction.amount > 0 ? "text-green-500" : transaction.amount < 0 ? "text-destructive" : ""}`}
              >
                <p>
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: account.currency,
                  }).format(transaction.amount)}
                </p>
              </TableCell>
              <TableCell className="w-48 text-center">
                <p>
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: account.currency,
                  }).format(transaction.balance)}
                </p>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
