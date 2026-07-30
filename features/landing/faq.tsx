import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Container } from "@/components/shared/container";
import { PROVIDER_META } from "@/lib/constants";

const FAQS = [
  {
    question: "Is this therapy?",
    answer:
      "No. MindCareAI is a self-reflection tool, not a therapist. It can't diagnose or treat anything, and it isn't a substitute for professional care. If you want to talk to someone qualified, please do — that's a better fit than this app for that.",
  },
  {
    question: "Where does my data go?",
    answer:
      "It stays on your computer. Journal entries, moods, habits and chat history are written to a SQLite file on this machine, and your API key and settings live in this browser. There's no account and no MindCareAI server, so nothing is uploaded and nobody else can read any of it.",
  },
  {
    question: "Do I need an API key?",
    answer: `Only for AI Chat. MindCareAI doesn't run its own models, so bring a key from ${PROVIDER_META.openrouter.label}, ${PROVIDER_META.groq.label} or ${PROVIDER_META.gemini.label} and your messages go straight from your device to that provider. Mood, journal, habits and the daily report all work without one.`,
  },
  {
    question: "Is it free?",
    answer:
      "MindCareAI itself is free and open. The only possible cost is your AI provider's usage — Groq and Gemini both offer a generous free tier, and OpenRouter has free models too.",
  },
  {
    question: "What if I'm in crisis?",
    answer:
      "Please contact a real person — your local emergency services, a crisis line, or someone you trust. MindCareAI is not an emergency service, cannot contact anyone on your behalf, and never attempts to intervene. The Emergency Support page links to helpline directories that will find the right number for your country.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="py-20 sm:py-28">
      <Container width="prose" className="space-y-8">
        <div className="space-y-3">
          <p className="type-eyebrow">Questions</p>
          <h2 className="type-title text-balance">Before you start</h2>
        </div>

        <Accordion type="single" collapsible className="surface px-6">
          {FAQS.map((item) => (
            <AccordionItem key={item.question} value={item.question}>
              <AccordionTrigger className="type-heading text-sm">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="type-body text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Container>
    </section>
  );
}
