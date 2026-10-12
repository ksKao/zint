DROP INDEX `transactions_date_order_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `transactions_account_id_date_order_unique` ON `transactions` (`account_id`,`date`,`order`);