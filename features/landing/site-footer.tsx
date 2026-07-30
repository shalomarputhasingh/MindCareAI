import Link from "next/link";

import { BrandMark } from "@/components/layout/brand-mark";
import { Container } from "@/components/shared/container";
import { DisclaimerNote } from "@/components/shared/disclaimer-note";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

const LINK_GROUPS = [
  {
    title: "Product",
    links: [
      { href: "/app", label: "Open the app" },
      { href: "/design", label: "Design system" },
    ],
  },
  {
    title: "Support",
    links: [{ href: "/app/support", label: "Emergency support" }],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-border border-t">
      <Container width="wide" className="grid gap-10 py-14 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
        <div className="space-y-4">
          <Link href="/" className="inline-flex rounded-lg">
            <BrandMark />
          </Link>
          <p className="type-body text-muted-foreground max-w-sm text-pretty">{APP_TAGLINE}</p>
          <DisclaimerNote className="max-w-md" />
        </div>

        <div className="grid grid-cols-2 gap-8 sm:justify-items-end">
          {LINK_GROUPS.map((group) => (
            <div key={group.title} className="space-y-3">
              <p className="type-caption text-xs font-semibold tracking-wide uppercase">
                {group.title}
              </p>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>

      <Container width="wide" className="border-border border-t py-6">
        <p className="type-caption text-xs">
          © {new Date().getFullYear()} {APP_NAME}. Not a medical service.
        </p>
      </Container>
    </footer>
  );
}
