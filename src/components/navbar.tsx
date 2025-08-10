import { Link, LinkComponentProps } from "@tanstack/react-router";
import { LayoutDashboard, Settings, Shapes, WalletCards } from "lucide-react";
import { ComponentType } from "react";

export default function Navbar() {
  const navItems: {
    to: LinkComponentProps["to"];
    text: string;
    icon: ComponentType;
  }[] = [
    {
      to: "/",
      text: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      to: "/transactions",
      text: "Transactions",
      icon: WalletCards,
    },
    {
      to: "/categories",
      text: "Categories",
      icon: Shapes,
    },
    {
      to: "/settings",
      text: "Settings",
      icon: Settings,
    },
  ];

  return (
    <nav className="border-border flex flex-col justify-between border-r px-4 py-8">
      <div className="flex w-full items-center gap-4">
        <img src="/tauri.svg" alt="logo" className="h-8 w-8" />
        <h1 className="text-2xl font-bold">Zint</h1>
      </div>
      <ul className="flex grow flex-col justify-center gap-2">
        {navItems.map((item) => (
          <li key={item.text}>
            <Link
              to={item.to}
              className="[&.active]:bg-primary [&.active]:text-primary-foreground flex items-center gap-4 rounded-md p-4 pr-16 [&.active]:font-bold"
            >
              <item.icon />
              <span>{item.text}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
