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

const ENGLISH_PATTERNS: RegExp[] = [
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

/**
 * Tamil script.
 *
 * Note the absence of `\b`. JavaScript's word boundary is defined against
 * `[A-Za-z0-9_]`, so Tamil letters are "non-word" characters and a `\b` before
 * one never matches — every pattern here would silently fail. Tamil is written
 * without the kind of inflectional ambiguity that makes bare substring matching
 * risky in English, so plain containment is both safe and correct.
 */
const TAMIL_PATTERNS: RegExp[] = [
  // தற்கொலை — suicide. Unambiguous in any context.
  /தற்கொலை/,
  // சாகணும் / சாக வேண்டும் / சாகலாம் — wanting to die.
  /சாக\s*(ணும்|னும்|வேண்டும்|லாம்|போற)/,
  // செத்துடலாம் / செத்து போகணும். The intent forms only: the past tense
  // "செத்துட்டேன்" is everyday hyperbole ("சிரிச்சு செத்துட்டேன்").
  /செத்து\s*(டலாம்|விடலாம்|போ(கணும்|கனும்|யிடலாம்|றேன்))/,
  /இறந்து\s*(விட|போ)/,
  // உயிரை விட / மாய்த்துக்கொள்ள — to take one's own life.
  /உயிர(ை|ோட)?\s*(விட(ணும்|னும்|லாம்)|மாய்|எடு(த்து|க்க))/,
  // Not wanting to live, or to be here.
  /வாழ\s*(பிடிக்கல|விருப்பமில்ல|மனசில்ல|வேண்டாம்|தோணல|முடியல)/,
  /இருக்க\s*(பிடிக்கல|மனசில்ல|விருப்பமில்ல)/,
  /வாழ்க்கை\s*(வேண்டாம்|முடிஞ்ச|சலிச்ச|அலுத்த)/,
  /வாழ்ந்து\s*என்ன\s*(பயன்|பிரயோஜன)/,
  // Self-harm.
  /சுய\s*(தீங்கு|காயம்|துன்புறுத்த)/,
  /நானே\s*(வெட்டி|காயப்படுத்த|அடிச்ச|கீறி)/,
  /கை(யை|ய)?\s*(வெட்டி|கீறி)/,
];

/**
 * Tamil written in English letters — Tanglish, which is how a great many Tamil
 * speakers actually type.
 *
 * Romanised Tamil has no standard spelling, so these accept the common
 * variations rather than one canonical form. They are also kept narrow: a bare
 * "pidikala" only means "I don't like it", so every pattern here insists on the
 * verb that makes the meaning unmistakable.
 */
const ROMANISED_TAMIL_PATTERNS: RegExp[] = [
  /\bth?arkk?olai\b/i,
  /\bsaa?ga(num|nnum|venum|vendum|laam|lam)\b/i,
  /\bseth?u\s*(dalam|daalam|poidalam|poganum|poganam|poren)\b/i,
  /\buyir(ai|a|e)?\s*(vida|vidalam|vittu|maay)/i,
  /\bva+zh?a\s*p[iu]dik?k?ala/i,
  /\bir[iu]kk?a\s*p[iu]dik?k?ala/i,
  /\bva+zhk?ai?\s*(vendam|venaam|vena)\b/i,
  /\b(enna|ennai)\s*naane?\s*(kolla|vetti|kaayapaduth)/i,
  /\bkai(ya|yai)?\s*vett?i(kk?a|ren|nen)/i,
];

/**
 * Whether to add the safety instruction and offer the support resources.
 *
 * Missing a phrase here is not the same as missing the person. The model reads
 * the whole message in whatever language it was written and answers with care
 * either way; what this screen adds is the extra instruction and the panel of
 * real helplines. It is a widening of the net, not the net itself.
 */
export function detectsCrisis(text: string): boolean {
  return [...ENGLISH_PATTERNS, ...TAMIL_PATTERNS, ...ROMANISED_TAMIL_PATTERNS].some(
    (pattern) => pattern.test(text),
  );
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
- Stay in the language and register you have been replying in. This is not the moment to switch language, to become formal, or to start writing literary Tamil at someone.
`.trim();
