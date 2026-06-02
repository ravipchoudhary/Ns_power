"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Calendar,
  LogOut,
  Plus,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/BrandLogo";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inspections", label: "Inspections", icon: ClipboardList },
  { href: "/inspections/new", label: "New Inspection", icon: Plus },
  { href: "/amc", label: "AMC & Reminders", icon: Calendar },
];

const adminLinks = [{ href: "/admin", label: "Admin Panel", icon: Users }];

const accountLink = {
  href: "/settings",
  label: "Change Password",
  icon: Settings,
};

export function Sidebar({
  role,
  userName,
}: {
  role: string;
  userName: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const allLinks =
    role === "ADMIN"
      ? [...links, ...adminLinks, accountLink]
      : [...links, accountLink];

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex w-64 flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-100 p-4">
        <BrandLogo className="max-w-[200px]" priority />
        <p className="mt-2 text-xs text-gray-500">Inspection Management</p>
        <p className="mt-3 text-sm text-gray-700">{userName}</p>
        <p className="text-xs capitalize text-gray-400">{role.toLowerCase()}</p>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {allLinks.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
              pathname === href || pathname.startsWith(href + "/")
                ? "bg-[#76B900]/10 text-[#5f9400]"
                : "text-gray-600 hover:bg-gray-50"
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>
      <button
        onClick={logout}
        className="m-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-red-50 hover:text-red-600"
      >
        <LogOut size={18} />
        Logout
      </button>
    </aside>
  );
}
