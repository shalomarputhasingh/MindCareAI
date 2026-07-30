import type { Metadata } from "next";
import { Flame, NotebookPen, SmilePlus, Sparkles } from "lucide-react";

import { InteractivePreview } from "@/components/design/interactive-preview";
import { Container } from "@/components/shared/container";
import { DisclaimerNote } from "@/components/shared/disclaimer-note";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatTile } from "@/components/shared/stat-tile";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Design system",
  description: "Living reference for MindCareAI's tokens and components.",
};

/* -------------------------------------------------------------------------- */

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="type-heading">{title}</h2>
        {note ? <p className="type-caption max-w-prose text-pretty">{note}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Swatch({
  name,
  value,
  className,
  border,
}: {
  name: string;
  value?: string;
  className: string;
  border?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <div
        className={cn(
          "h-16 w-full rounded-lg",
          border && "border-border border",
          className,
        )}
      />
      <p className="text-xs font-medium">{name}</p>
      {value ? <p className="type-caption font-mono text-[0.6875rem]">{value}</p> : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export default function DesignPage() {
  return (
    <main id="main">
      <div className="aurora border-border border-b">
        <Container width="wide" className="py-12 sm:py-16">
          <PageHeader
            eyebrow="Living reference"
            title="MindCareAI design system"
            description="Every token and shared component in one place. Toggle the theme to check both palettes — anything that breaks here breaks everywhere."
            actions={<ThemeToggle />}
          />
        </Container>
      </div>

      <Container width="wide" className="space-y-14 py-12 sm:py-16">
        {/* --------------------------------- Colour ------------------------- */}
        <Section
          title="Colour"
          note="Indigo marks what the user acts on. Teal marks what reflects the user back to themselves — streaks, progress, moods. Everything else is a cool slate ramp so those two stay loud by being alone."
        >
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            <Swatch name="background" value="#F8FAFC" className="bg-background" border />
            <Swatch name="card" value="#FFFFFF" className="bg-card" border />
            <Swatch name="primary" value="#4F46E5" className="bg-primary" />
            <Swatch name="brand" value="#14B8A6" className="bg-brand" />
            <Swatch name="muted" className="bg-muted" border />
            <Swatch name="border" className="bg-border" />
            <Swatch name="primary-strong" className="bg-primary-strong" />
            <Swatch name="brand-strong" className="bg-brand-strong" />
            <Swatch name="brand-muted" className="bg-brand-muted" border />
            <Swatch name="destructive" className="bg-destructive" />
            <Swatch name="foreground" className="bg-foreground" />
            <Swatch name="muted-foreground" className="bg-muted-foreground" />
          </div>
          <p className="type-caption text-xs">
            <span className="text-brand-strong font-medium">Contrast rule:</span> plain{" "}
            <code className="font-mono">brand</code> reaches only ~2.2:1 on white, so it is
            a fill colour. Teal <em>text</em> always uses{" "}
            <code className="font-mono">brand-strong</code>.
          </p>
        </Section>

        <Separator />

        {/* ------------------------------- Typography ----------------------- */}
        <Section
          title="Typography"
          note="Fraunces sets the headings with its SOFT and WONK axes raised, which reads as reflective rather than editorial. Inter does all interface work."
        >
          <div className="surface space-y-6 p-6 sm:p-8">
            <div>
              <p className="type-caption mb-1 text-xs">.type-display</p>
              <p className="type-display text-balance">You don&apos;t have to have the words yet.</p>
            </div>
            <div>
              <p className="type-caption mb-1 text-xs">.type-title</p>
              <p className="type-title">How was today?</p>
            </div>
            <div>
              <p className="type-caption mb-1 text-xs">.type-heading</p>
              <p className="type-heading">Habits for Thursday</p>
            </div>
            <div>
              <p className="type-caption mb-1 text-xs">.type-body</p>
              <p className="type-body max-w-prose">
                Body copy runs at a 1.7 line height and stays inside a comfortable measure,
                because most of this app is reading and writing rather than scanning.
              </p>
            </div>
            <div>
              <p className="type-caption mb-1 text-xs">.type-caption</p>
              <p className="type-caption">Saved a moment ago · 142 words</p>
            </div>
            <div>
              <p className="type-caption mb-1 text-xs">.type-eyebrow</p>
              <p className="type-eyebrow">Daily report</p>
            </div>
            <div>
              <p className="type-caption mb-1 text-xs">.tabular</p>
              <p className="tabular text-2xl font-semibold">12 · 08 · 5</p>
            </div>
          </div>
        </Section>

        <Separator />

        {/* ---------------------------- Shape & depth ----------------------- */}
        <Section
          title="Shape and depth"
          note="One radius scale derived from a 16px base, and three levels of elevation. Shadows suggest paper lifting, never depth for its own sake."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="bg-card border-border shadow-soft space-y-1 rounded-xl border p-5">
              <p className="type-heading text-sm">shadow-soft</p>
              <p className="type-caption text-xs">Cards, tiles, panels. The default.</p>
            </div>
            <div className="bg-card border-border shadow-lift space-y-1 rounded-xl border p-5">
              <p className="type-heading text-sm">shadow-lift</p>
              <p className="type-caption text-xs">Menus, dialogs, anything floating.</p>
            </div>
            <div className="bg-card border-border shadow-glow space-y-1 rounded-xl border p-5">
              <p className="type-heading text-sm">shadow-glow</p>
              <p className="type-caption text-xs">One hero moment per page, at most.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            {(["rounded-sm", "rounded-md", "rounded-lg", "rounded-xl", "rounded-2xl"] as const).map(
              (radius) => (
                <div key={radius} className="space-y-1.5">
                  <div className={cn("bg-primary/15 border-primary/30 size-16 border", radius)} />
                  <p className="type-caption font-mono text-[0.6875rem]">{radius}</p>
                </div>
              ),
            )}
          </div>
        </Section>

        <Separator />

        {/* ------------------------------- Buttons -------------------------- */}
        <Section
          title="Buttons"
          note="A label names exactly what happens: “Save settings”, not “Submit”. The brand variant is reserved for moments about the user's own progress."
        >
          <div className="surface space-y-5 p-6">
            <div className="flex flex-wrap items-center gap-3">
              <Button>Start check-in</Button>
              <Button variant="brand">Log today&apos;s mood</Button>
              <Button variant="secondary">Refresh models</Button>
              <Button variant="outline">Test connection</Button>
              <Button variant="ghost">Cancel</Button>
              <Button variant="link">Read the FAQ</Button>
              <Button variant="destructive">Clear conversation</Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small</Button>
              <Button>Default</Button>
              <Button size="lg">Large</Button>
              <Button size="xl">Extra large</Button>
              <Button size="icon" aria-label="New entry">
                <NotebookPen />
              </Button>
              <Button disabled>Disabled</Button>
            </div>
          </div>
        </Section>

        <Separator />

        {/* -------------------------- Shared primitives --------------------- */}
        <Section
          title="Shared primitives"
          note="Built once in components/shared and reused by every feature, so no screen reinvents a header, a tile or an empty state."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              label="Mood today"
              value="🙂 Good"
              hint="Logged at 9:14"
              icon={SmilePlus}
              tone="brand"
            />
            <StatTile
              label="Habits"
              value="3 / 5"
              hint="Two left before bed"
              icon={Flame}
              tone="brand"
            />
            <StatTile
              label="Journal"
              value="142"
              hint="words today"
              icon={NotebookPen}
              tone="primary"
            />
            <StatTile label="Messages" value="8" hint="in this conversation" icon={Sparkles} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard
              title="SectionCard"
              description="A titled panel with an optional action and footer."
              action={
                <Button variant="ghost" size="sm">
                  Edit
                </Button>
              }
              footer={<p className="type-caption text-xs">Footers hold quiet metadata.</p>}
            >
              <p className="type-body">
                Panels stack in a single column on mobile and share one spacing rhythm.
              </p>
            </SectionCard>

            <SectionCard title="LoadingState">
              <LoadingState rows={3} />
            </SectionCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard title="EmptyState" contentClassName="p-0">
              <EmptyState
                icon={NotebookPen}
                title="No entry for today"
                description="Write a few lines about how today went. Nothing leaves this device."
                action={<Button size="sm">Start writing</Button>}
              />
            </SectionCard>

            <SectionCard title="DisclaimerNote">
              <DisclaimerNote />
            </SectionCard>
          </div>
        </Section>

        <Separator />

        {/* ------------------------- Interactive controls -------------------- */}
        <Section
          title="Controls and motion"
          note="Everything below is interactive. Tab through it to check focus rings, and open the menus to check elevation against both backgrounds."
        >
          <InteractivePreview />
        </Section>
      </Container>
    </main>
  );
}
