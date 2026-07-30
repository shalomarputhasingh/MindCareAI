"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isActive, type NavItem } from "@/components/layout/nav-config";
import { cn } from "@/lib/utils";

interface NavLinksProps {
  items: NavItem[];
  /** Shows the hint line under each label — used in the mobile sheet. */
  withHints?: boolean;
  onNavigate?: () => void;
}

/** Shared by the desktop sidebar and the mobile sheet so they can't drift. */
export function NavLinks({ items, withHints = false, onNavigate }: NavLinksProps) {
  const pathname = usePathname();

  return (
    <ul className="space-y-1">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
              )}
            >
              <Icon
                aria-hidden
                className={cn(
                  "mt-0.5 size-4 shrink-0 transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              />
              <span className="min-w-0">
                <span className="block truncate">{item.label}</span>
                {withHints ? (
                  <span className="text-muted-foreground block truncate text-xs">
                    {item.hint}
                  </span>
                ) : null}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
