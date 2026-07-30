import {
  ChartNoAxesColumn,
  House,
  LifeBuoy,
  ListChecks,
  MessageCircleHeart,
  NotebookPen,
  Settings,
  SmilePlus,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Shown under the label in the mobile sheet. */
  hint: string;
}

/** The single source of truth for sidebar order, labels and icons. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/app", label: "Home", icon: House, hint: "Today at a glance" },
  {
    href: "/app/chat",
    label: "AI Chat",
    icon: MessageCircleHeart,
    hint: "Talk something through",
  },
  { href: "/app/mood", label: "Mood Tracker", icon: SmilePlus, hint: "One check-in a day" },
  {
    href: "/app/journal",
    label: "Daily Journal",
    icon: NotebookPen,
    hint: "Write it down",
  },
  {
    href: "/app/habits",
    label: "Healthy Habits",
    icon: ListChecks,
    hint: "Small things, daily",
  },
  {
    href: "/app/report",
    label: "Daily Report",
    icon: ChartNoAxesColumn,
    hint: "How today went",
  },
];

/** Pinned to the bottom of the sidebar, away from the daily routine. */
export const FOOTER_NAV_ITEMS: NavItem[] = [
  {
    href: "/app/support",
    label: "Emergency Support",
    icon: LifeBuoy,
    hint: "Real help, right now",
  },
  { href: "/app/settings", label: "Settings", icon: Settings, hint: "Provider and model" },
];

/** `/app` must match exactly, or it would light up on every child route. */
export function isActive(pathname: string, href: string): boolean {
  return href === "/app" ? pathname === "/app" : pathname.startsWith(href);
}
