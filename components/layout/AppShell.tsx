"use client";

import { getFirebaseAuth } from "@/lib/firebase/client";
import { signOut } from "firebase/auth";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/tasks", label: "Tasks" },
  { href: "/calendar", label: "Calendar" },
  { href: "/reminders", label: "Reminders" },
  { href: "/ask", label: "Ask Holiwork" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await signOut(getFirebaseAuth());
    router.replace("/login");
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <h1>Holiwork</h1>
        <nav>
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={pathname === link.href ? "active-nav" : "nav-link"}>
              {link.label}
            </Link>
          ))}
        </nav>
        <button className="danger-btn" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main className="content">{children}</main>

      <nav className="mobile-nav">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className={pathname === link.href ? "active-nav" : "nav-link"}>
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
