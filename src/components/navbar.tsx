import {
  Link,
  LinkComponentProps,
  useLocation,
  useParams,
} from "@tanstack/react-router";
import { LayoutDashboard, Settings, Shapes, WalletCards } from "lucide-react";
import CommandMenu from "./command-menu";
import { AccountSelector } from "./account-selector";
import { AnimatedBackground } from "./ui/animated-background";

export default function Navbar() {
  const { accountId } = useParams({ strict: false });
  const { pathname } = useLocation();

  const links: {
    to: LinkComponentProps["to"];
    text: string;
    icon: React.ComponentType;
  }[] = [
    {
      to: "/$accountId",
      icon: LayoutDashboard,
      text: "Dashboard",
    },
    {
      to: "/$accountId/transactions",
      icon: WalletCards,
      text: "Transactions",
    },
    {
      to: "/$accountId/categories",
      icon: Shapes,
      text: "Categories",
    },
    {
      to: "/$accountId/settings",
      icon: Settings,
      text: "Settings",
    },
  ];

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
          <AnimatedBackground
            value={
              links.find(
                (link) => pathname.replace(accountId, "$accountId") === link.to,
              )?.text
            }
            className="bg-primary rounded-md"
          >
            {links.map((link) => (
              <li key={link.text} data-id={link.text}>
                <Link
                  to={link.to as "/$accountId"}
                  params={{ accountId }}
                  className="[&.active]:text-primary-foreground flex items-center gap-4 p-4 pr-16 [&.active]:font-bold"
                  activeOptions={{ exact: true }}
                >
                  <link.icon /> <span>{link.text}</span>
                </Link>
              </li>
            ))}
          </AnimatedBackground>
        ) : (
          <li>
            <Link
              to="/settings"
              className="[&.active]:bg-primary [&.active]:text-primary-foreground flex items-center gap-4 rounded-md p-4 pr-16 [&.active]:font-bold"
            >
              <Settings /> <span>Settings</span>
            </Link>
          </li>
        )}
      </ul>
      <AccountSelector />
    </nav>
  );
}
