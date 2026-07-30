/**
 * Crisis detection.
 *
 * This is a deliberately simple keyword screen, and it is *not* a clinical
 * assessment tool. Its only jobs are to (a) add a safety instruction to the
 * system prompt so the model responds carefully, and (b) surface the support
 * resources in the UI. It never blocks a message, never diagnoses, and never
 * claims to have detected anything about the person.
 *
 * False positives are acceptable here — showing someone a support panel they
 * didn't need is a much smaller harm than missing someone who did.
 */

const CRISIS_PATTERNS: RegExp[] = [
  /\bkill(ing)?\s+my\s?self\b/i,
  /\bkms\b/i,
  /\bsuicid(e|al)\b/i,
  /\bend(ing)?\s+(it|my\s+life)\b/i,
  /\btake\s+my\s+own\s+life\b/i,
  /\bdon'?t\s+want\s+to\s+(be\s+here|live|wake\s+up)\b/i,
  /\bwant\s+to\s+die\b/i,
  /\bbetter\s+off\s+(dead|without\s+me)\b/i,
  /\bno\s+(reason|point)\s+(to|in)\s+(living|going\s+on)\b/i,
  /\bhurt(ing)?\s+my\s?self\b/i,
  /\bharm(ing)?\s+my\s?self\b/i,
  /\bself[-\s]?harm\b/i,
  /\bcut(ting)?\s+my\s?self\b/i,
  /\boverdos(e|ing)\b/i,
];

export function detectsCrisis(text: string): boolean {
  return CRISIS_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Appended to the system prompt when the screen trips. It shapes tone; it does
 * not tell the model to recite a script.
 */
export const CRISIS_GUIDANCE = `
SAFETY NOTE FOR THIS REPLY

Something in the person's message may point to thoughts of self-harm or of not wanting to be here. Handle this with care:

- Stay calm and warm. Do not panic, lecture, or become clinical.
- Acknowledge what they said directly. Do not skip past it or change the subject.
- Do not be cheerful. Do not offer silver linings or gratitude exercises.
- Gently ask whether they are safe right now.
- Encourage them to reach out to someone they trust, and to their local emergency number or a qualified mental health professional if they are in immediate danger.
- Say plainly that you are not a substitute for professional help.
- Do not promise to intervene. You cannot contact anyone, alert anyone, or call emergency services, and you must never imply otherwise.
- Do not claim to be human, a therapist, or a crisis worker.
- Keep it short. Presence matters more than information right now.
`.trim();
