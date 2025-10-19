import { db } from "@/db";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { transactions as transactionTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function capitalizeWords(str: string) {
  return str
    .split(" ")
    .map((word) => {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
  });
}

export function base64ToFile(base64String: string, fileName: string): File {
  const [metadata, base64Data] = base64String.split(",");

  const mimeType = metadata.split(":")[1].split(";")[0];

  const byteCharacters = atob(base64Data); // atob decodes the base64 string
  const byteArrays = new Uint8Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteArrays[i] = byteCharacters.charCodeAt(i);
  }

  const blob = new Blob([byteArrays], { type: mimeType });

  const file = new File([blob], fileName, { type: mimeType });

  return file;
}

export function getDateAtMidnight(date: Date = new Date()) {
  const clone = new Date(date);
  clone.setHours(0, 0, 0, 0);

  return clone;
}

export async function recomputeBalanceAndOrder(accountId: string) {
  const transactions = await db.query.transactions.findMany({
    where: (t, { eq }) => eq(t.accountId, accountId),
    orderBy: (t, { asc }) => [asc(t.date), asc(t.order)],
  });

  if (!transactions.length) return;

  await db
    .update(transactionTable)
    .set({
      order: 0,
      balance: transactions[0].amount,
    })
    .where(eq(transactionTable.id, transactions[0].id));

  transactions[0].order = 0;
  transactions[0].balance = transactions[0].amount;

  for (let i = 1; i < transactions.length; i++) {
    const order =
      transactions[i - 1].date.getTime() === transactions[i].date.getTime()
        ? transactions[i - 1].order + 1
        : 0;

    transactions[i].balance =
      transactions[i - 1].balance + transactions[i].amount;
    transactions[i].order = order;

    await db
      .update(transactionTable)
      .set({
        order,
        balance: transactions[i - 1].balance + transactions[i].amount,
      })
      .where(eq(transactionTable.id, transactions[i].id));
  }
}
