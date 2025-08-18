import {
  integer,
  real,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core";
import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";

const cuidField = text("id").$defaultFn(createId).primaryKey();

export const accounts = sqliteTable("accounts", {
  id: cuidField,
  name: text("name").notNull(),
  currency: text("currency").notNull(),
});

export const categories = sqliteTable("categories", {
  id: cuidField,
  name: text("name").notNull(),
  icon: text("icon"),
  accountId: text("account_id")
    .references(() => accounts.id, { onDelete: "cascade" })
    .notNull(),
});

export const subCategories = sqliteTable("sub_categories", {
  id: cuidField,
  name: text("name").notNull(),
  icon: text("icon"),
  categoryId: text("category_id")
    .references(() => categories.id, { onDelete: "cascade" })
    .notNull(),
  accountId: text("account_id")
    .references(() => accounts.id, { onDelete: "cascade" })
    .notNull(),
});

export const transactions = sqliteTable(
  "transactions",
  {
    id: cuidField,
    title: text("title").notNull(),
    description: text("description"),
    date: integer("date", { mode: "timestamp" }),
    payee: text("payee"),
    isTemporary: integer("is_temporary", { mode: "boolean" })
      .notNull()
      .default(false),
    amount: real("amount").notNull(),
    balance: real("balance").notNull(),
    order: integer("order").notNull(),
    categoryId: text("category_id").references(() => categories.id, {
      onDelete: "cascade",
    }),
    subCategoryId: text("sub_category_id").references(() => subCategories.id, {
      onDelete: "cascade",
    }),
    accountId: text("account_id")
      .references(() => accounts.id, { onDelete: "cascade" })
      .notNull(),
  },
  (t) => [unique().on(t.date, t.order)],
);

export const widgets = sqliteTable("widgets", {
  id: cuidField,
  name: text("name").notNull(),
  x: integer("x").notNull(),
  y: integer("y").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  config: text("name", { mode: "json" }).notNull(),
  accountId: text("account_id")
    .references(() => accounts.id, { onDelete: "cascade" })
    .notNull(),
});

export const accountsRelations = relations(accounts, ({ many }) => ({
  categories: many(categories),
  subCategories: many(subCategories),
  transactions: many(transactions),
  widgets: many(widgets),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  account: one(accounts, {
    fields: [categories.accountId],
    references: [accounts.id],
  }),
  subCategories: many(subCategories),
  transactions: many(transactions),
}));

export const subCategoriesRelations = relations(
  subCategories,
  ({ one, many }) => ({
    account: one(accounts, {
      fields: [subCategories.accountId],
      references: [accounts.id],
    }),
    category: one(categories, {
      fields: [subCategories.categoryId],
      references: [categories.id],
    }),
    transactions: many(transactions),
  }),
);

export const transactionsRelations = relations(transactions, ({ one }) => ({
  account: one(accounts, {
    fields: [transactions.accountId],
    references: [accounts.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
  subCategories: one(subCategories, {
    fields: [transactions.subCategoryId],
    references: [subCategories.id],
  }),
}));
