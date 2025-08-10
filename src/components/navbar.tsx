import { Link } from "@tanstack/react-router";

export default function Navbar() {
  return (
    <nav className="flex gap-2 p-2">
      <Link to="/" className="[&.active]:font-bold">
        Home
      </Link>
      <Link to="/about" className="[&.active]:font-bold">
        About
      </Link>
    </nav>
  );
}
