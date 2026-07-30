"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { BrandMark } from "@/components/layout/brand-mark";
import { FOOTER_NAV_ITEMS, NAV_ITEMS } from "@/components/layout/nav-config";
import { NavLinks } from "@/components/layout/nav-links";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useSettings } from "@/hooks/use-settings";

/**
 * The frame every in-app screen sits in: a fixed sidebar on desktop, a sheet on
 * mobile. Pages render only their own content.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isConfigured, hydrated } = useSettings();
  const pathname = usePathname();
  const router = useRouter();

  // Send anyone without a provider, key and model to the wizard. Settings and
  // support stay reachable so nobody can be locked out of either.
  const needsSetup =
    hydrated &&
    !isConfigured &&
    !pathname.startsWith("/app/settings") &&
    !pathname.startsWith("/app/support");

  useEffect(() => {
    if (needsSetup) router.replace("/setup");
  }, [needsSetup, router]);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[17rem_1fr]">
      {/* ------------------------------ Desktop --------------------------- */}
      <aside className="bg-sidebar border-sidebar-border hidden border-r lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col">
        <div className="px-5 py-6">
          <Link href="/app" className="inline-flex rounded-lg">
            <BrandMark />
          </Link>
        </div>

        <nav aria-label="Main" className="flex-1 overflow-y-auto px-3">
          <NavLinks items={NAV_ITEMS} />
        </nav>

        <div className="border-sidebar-border space-y-1 border-t px-3 py-4">
          <NavLinks items={FOOTER_NAV_ITEMS} />
        </div>
      </aside>

      {/* ------------------------------- Mobile --------------------------- */}
      <div className="flex min-w-0 flex-col">
        <header className="bg-background/85 border-border sticky top-0 z-30 flex items-center justify-between gap-3 border-b px-4 py-3 backdrop-blur-md lg:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open navigation">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[19rem] p-0">
              <SheetHeader className="border-border border-b">
                <SheetTitle className="text-left">
                  <BrandMark />
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Move between the sections of MindCareAI.
                </SheetDescription>
              </SheetHeader>
              <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 pb-4">
                <NavLinks
                  items={NAV_ITEMS}
                  withHints
                  onNavigate={() => setMobileOpen(false)}
                />
                <div className="border-border mt-3 border-t pt-3">
                  <NavLinks
                    items={FOOTER_NAV_ITEMS}
                    withHints
                    onNavigate={() => setMobileOpen(false)}
                  />
                </div>
              </nav>
            </SheetContent>
          </Sheet>

          <Link href="/app" className="rounded-lg">
            <BrandMark />
          </Link>
          <ThemeToggle />
        </header>

        <main id="main" className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
