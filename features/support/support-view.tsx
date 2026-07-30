import Link from "next/link";
import {
  Ear,
  ExternalLink,
  HeartHandshake,
  ShieldAlert,
  Stethoscope,
  Wind,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AppPage } from "@/components/shared/app-page";
import { DisclaimerNote } from "@/components/shared/disclaimer-note";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";

const HELPLINE_DIRECTORIES = [
  {
    href: "https://findahelpline.com",
    label: "findahelpline.com",
    description: "A directory of crisis lines and helplines, searchable by country.",
  },
  {
    href: "https://befrienders.org",
    label: "befrienders.org",
    description: "Befrienders Worldwide — emotional support helplines in many countries.",
  },
];

/**
 * Emergency support. Calm and static by design — no motion beyond the one
 * subtle breathing cue, no AI call, nothing that could read as a promise this
 * page can't keep.
 */
export function SupportView() {
  return (
    <AppPage width="prose">
      <PageHeader
        eyebrow="Emergency support"
        title="If things feel urgent right now"
        description="This page is here for the moments that need more than an app. Read whichever part is useful, and leave the rest."
      />

      <Alert variant="destructive" className="border-destructive/30">
        <ShieldAlert aria-hidden />
        <AlertTitle className="type-heading line-clamp-none">
          If you are in immediate danger
        </AlertTitle>
        <AlertDescription>
          <p className="text-pretty">
            Contact your local emergency services now, or go to your nearest emergency
            department. Do this before anything else on this page.
          </p>
        </AlertDescription>
      </Alert>

      <SectionCard title="Reach out to someone you trust">
        <div className="flex items-start gap-3">
          <span className="bg-brand-muted text-brand-strong flex size-9 shrink-0 items-center justify-center rounded-full">
            <HeartHandshake aria-hidden className="size-4.5" />
          </span>
          <p className="type-body text-pretty">
            A friend, a family member, a colleague, a neighbour. Telling one person how
            you&apos;re doing can change the shape of the next hour. You don&apos;t need the
            right words — you can just say you&apos;re struggling.
          </p>
        </div>
      </SectionCard>

      <SectionCard title="Contact a mental health professional">
        <div className="flex items-start gap-3">
          <span className="bg-brand-muted text-brand-strong flex size-9 shrink-0 items-center justify-center rounded-full">
            <Stethoscope aria-hidden className="size-4.5" />
          </span>
          <p className="type-body text-pretty">
            A doctor, therapist, counsellor, or your local crisis service can offer help
            this page cannot. If you already have one, reach out to them directly. If you
            don&apos;t, the directories below can point you to options near you.
          </p>
        </div>
      </SectionCard>

      <SectionCard
        title="Find a helpline"
        description="We haven't listed a single phone number here, because the right one depends on where you are. These directories cover many countries."
      >
        <ul className="space-y-3">
          {HELPLINE_DIRECTORIES.map((resource) => (
            <li key={resource.href}>
              <Link
                href={resource.href}
                target="_blank"
                rel="noopener noreferrer"
                className="border-border hover:bg-muted/60 flex items-start justify-between gap-3 rounded-lg border px-4 py-3 transition-colors"
              >
                <span className="space-y-0.5">
                  <span className="type-heading text-primary-strong block">
                    {resource.label}
                  </span>
                  <span className="type-caption block text-pretty">{resource.description}</span>
                </span>
                <ExternalLink aria-hidden className="text-muted-foreground mt-1 size-4 shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="What MindCareAI is, and isn't">
        <p className="type-body text-pretty">
          MindCareAI is a wellbeing companion, not an emergency or crisis service. It
          cannot tell when you&apos;re in danger, and it does not contact anyone on your
          behalf — not a friend, not a doctor, not emergency services. No one is
          monitoring this app in real time. If you need someone to act, please use the
          contacts above.
        </p>
      </SectionCard>

      <SectionCard
        title="Something to do with the next few minutes"
        description="These won't fix anything, but they can make the moment easier to sit with. Try one if it seems useful — there's no right way to do this."
      >
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="senses">
            <AccordionTrigger>
              <span className="flex items-center gap-2.5">
                <Ear aria-hidden className="text-muted-foreground size-4 shrink-0" />
                Notice your surroundings (5-4-3-2-1)
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <p className="type-body text-pretty">
                Slowly notice: 5 things you can see. 4 things you can touch. 3 things you
                can hear. 2 things you can smell. 1 thing you can taste. There&apos;s no
                need to rush any of it.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="box-breathing">
            <AccordionTrigger>
              <span className="flex items-center gap-2.5">
                <Wind aria-hidden className="text-muted-foreground size-4 shrink-0" />
                Box breathing
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex items-center gap-4">
                <span
                  aria-hidden
                  className="bg-brand-muted animate-breathe hidden size-12 shrink-0 rounded-full sm:block"
                />
                <p className="type-body text-pretty">
                  Breathe in for 4 counts. Hold for 4. Breathe out for 4. Hold for 4.
                  Repeat for as long as it helps.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="478-breathing">
            <AccordionTrigger>
              <span className="flex items-center gap-2.5">
                <Wind aria-hidden className="text-muted-foreground size-4 shrink-0" />
                The 4-7-8 breath
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex items-center gap-4">
                <span
                  aria-hidden
                  className="bg-brand-muted animate-breathe hidden size-12 shrink-0 rounded-full sm:block"
                />
                <p className="type-body text-pretty">
                  Breathe in through your nose for 4 counts. Hold for 7. Breathe out
                  slowly through your mouth for 8. The long exhale is the part that
                  helps.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </SectionCard>

      <DisclaimerNote />
    </AppPage>
  );
}
