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
      "It stays on your computer. Journal entries, moods, habits and chat history are written to a SQLite file on this machine, and your API key and settings live in this browser. There's no account and no MindCareAI server. The two exceptions are things you ask for: chat messages go to the AI provider you chose, and if you switch on cloud dictation, that recording is uploaded there too.",
  },
  {
    question: "What happens when I use the microphone?",
    answer:
      "Nothing until you ask. Press the mic once and it's push-to-talk: you read the transcript and edit it before it sends. Live voice chat is a separate mode you start deliberately — there the microphone stays open and each turn sends as soon as you pause, so nothing is reviewed first. Either way, your browser does the listening by default; turn on cloud transcription in Settings and the recording goes to your AI provider instead, which is more accurate but does leave this machine. The audio is never saved to disk. Replies read aloud use your device's own voices and are never uploaded.",
  },
  {
    question: "Can I talk to it in Tamil?",
    answer:
      "Yes. Write in Tamil and you'll be answered in Tamil — everyday spoken Tamil, not the formal written kind. Tamil typed in English letters works too, and the reply comes back the same way rather than in Tamil script you didn't ask for. You can also pin it to Tamil or English in Settings → Language. Voice works in Tamil as well, though the browser's own recogniser listens for one language at a time, so you'll want to choose Tamil there, or switch on cloud transcription, which works it out for itself. The app's own buttons and labels are English throughout — this is about the conversation, not a translated interface.",
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
