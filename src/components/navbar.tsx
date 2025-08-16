import { Link, useParams } from "@tanstack/react-router";
import { LayoutDashboard, Settings, Shapes, WalletCards } from "lucide-react";
import CommandMenu from "./command-menu";
import { AccountSelector } from "./account-selector";

export default function Navbar() {
  const { accountId } = useParams({ strict: false });
  const linkClassName =
    "[&.active]:bg-primary [&.active]:text-primary-foreground flex items-center gap-4 rounded-md p-4 pr-16 [&.active]:font-bold";

  return (
    <nav className="border-border flex w-72 flex-col justify-between border-r px-4 py-8">
      <div className="flex items-center justify-between">
        <div className="flex w-full items-center gap-4">
          <img src="/tauri.svg" alt="logo" className="h-8 w-8" />
          <h1 className="text-2xl font-bold">Zint</h1>
        </div>
        <CommandMenu />
      </div>
      <ul className="flex grow flex-col justify-center gap-2">
        {accountId ? (
          <>
            <li>
              <Link
                to="/$accountId"
                params={{ accountId }}
                className={linkClassName}
                activeOptions={{ exact: true }}
              >
                <LayoutDashboard /> <span>Dashboard</span>
              </Link>
            </li>
            <li>
              <Link
                to="/$accountId/transactions"
                params={{ accountId }}
                className={linkClassName}
              >
                <WalletCards /> <span>Transactions</span>
              </Link>
            </li>
            <li>
              <Link
                to="/$accountId/categories"
                params={{ accountId }}
                className={linkClassName}
              >
                <Shapes /> <span>Categories</span>
              </Link>
            </li>
            <li>
              <Link
                to="/$accountId/settings"
                params={{ accountId }}
                className={linkClassName}
              >
                <Settings /> <span>Settings</span>
              </Link>
            </li>
          </>
        ) : (
          <li>
            <Link to="/settings" className={linkClassName}>
              <Settings /> <span>Settings</span>
            </Link>
          </li>
        )}
      </ul>
      <AccountSelector />
    </nav>
  );
}
