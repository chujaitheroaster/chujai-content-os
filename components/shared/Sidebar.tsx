"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils/cn";
import type { Role } from "@prisma/client";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  ownerOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/calendar", label: "Content Calendar", icon: "📅" },
  { href: "/my-tasks", label: "My Tasks", icon: "✅" },
  { href: "/approvals", label: "Approval Queue", icon: "📋", ownerOnly: true },
  { href: "/workload", label: "Team Workload", icon: "👥", ownerOnly: true },
  { href: "/performance", label: "Performance", icon: "📊" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export function Sidebar({ role, userName }: { role: Role; userName: string }) {
  const pathname = usePathname();
  const isOwner = role === "OWNER";

  const visibleItems = NAV_ITEMS.filter((item) => !item.ownerOnly || isOwner);

  return (
    <aside className="w-60 bg-white border-r border-stone-200 flex flex-col">
      <div className="p-5 border-b border-stone-200">
        <div className="flex items-center gap-2">
          <span className="text-2xl">☕</span>
          <div>
            <p className="font-bold text-stone-900 text-sm leading-tight">ชูใจ</p>
            <p className="text-xs text-stone-500">Content OS</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-stone-900 text-white"
                  : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
              )}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-stone-200">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-7 h-7 rounded-full bg-stone-200 flex items-center justify-center text-xs font-bold text-stone-700">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-stone-900 truncate">{userName}</p>
            <p className="text-xs text-stone-500">{role.replace("_", " ")}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-stone-500 hover:bg-stone-100 hover:text-stone-700 transition-colors"
        >
          <span>🚪</span>
          ออกจากระบบ
        </button>
      </div>
    </aside>
  );
}
