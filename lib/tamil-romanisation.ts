/**
 * Tamil script written out in Latin letters, so a device with no Tamil voice
 * can still read a Tamil reply aloud.
 *
 * This is not scholarly transliteration. ISO 15919 is built to be reversible,
 * and its output ("eṉakku", "vāḻkkai") is read by an English speech engine as
 * something no Tamil speaker would recognise. Every choice here is instead made
 * for how an English text-to-speech voice will pronounce the result out loud —
 * "enakku", "vaalkkai" — which is why long ē and short e both come out as "e",
 * and why ழ becomes "l" rather than the conventional "zh" that English voices
 * turn into the sound in "measure".
 *
 * It is a fallback, and an audibly imperfect one. A real Tamil voice is better
 * in every way, and the app says so at the point it falls back to this.
 */

const PULLI = "்"; // ் — strips a consonant's inherent vowel

/** Independent vowels. */
const VOWELS: Record<string, string> = {
  அ: "a",
  ஆ: "aa",
  இ: "i",
  ஈ: "ee",
  உ: "u",
  ஊ: "oo",
  // Length is deliberately flattened: an English voice reads "ay" as a
  // diphthong, which is further from Tamil ஏ than a plain "e" is.
  எ: "e",
  ஏ: "e",
  ஐ: "ai",
  ஒ: "o",
  ஓ: "o",
  ஔ: "au",
};

/** Dependent vowel signs, which replace a consonant's inherent "a". */
const SIGNS: Record<string, string> = {
  "ா": "aa",
  "ி": "i",
  "ீ": "ee",
  "ு": "u",
  "ூ": "oo",
  "ெ": "e",
  "ே": "e",
  "ை": "ai",
  "ொ": "o",
  "ோ": "o",
  "ௌ": "au",
};

/**
 * Consonants, in two forms.
 *
 * Tamil writes one letter where it speaks two sounds: க is "k" starting a word
 * and "g" between vowels — கடை is "kadai", but பகல் is "pagal". Ignoring that
 * is the single biggest thing that makes romanised Tamil unintelligible when
 * spoken, so each stop carries both readings and the caller picks by position.
 */
const CONSONANTS: Record<string, { hard: string; soft: string }> = {
  க: { hard: "k", soft: "g" },
  ங: { hard: "ng", soft: "ng" },
  // "s" in both positions: சொல் is "sol", not "chol". The doubled ச்ச really is
  // "ch", and the cluster table below handles that case on its own.
  ச: { hard: "s", soft: "s" },
  ஞ: { hard: "nj", soft: "nj" },
  ட: { hard: "t", soft: "d" },
  ண: { hard: "n", soft: "n" },
  த: { hard: "th", soft: "dh" },
  ந: { hard: "n", soft: "n" },
  ப: { hard: "p", soft: "b" },
  ம: { hard: "m", soft: "m" },
  ய: { hard: "y", soft: "y" },
  ர: { hard: "r", soft: "r" },
  ல: { hard: "l", soft: "l" },
  வ: { hard: "v", soft: "v" },
  // ழ has no English equivalent. "zh" is the conventional romanisation, but an
  // English voice reads it as the sound in "vision"; "l" lands much closer, and
  // is how the language's own name reaches English as "Tamil".
  ழ: { hard: "l", soft: "l" },
  ள: { hard: "l", soft: "l" },
  ற: { hard: "tr", soft: "r" },
  ன: { hard: "n", soft: "n" },
  // Grantha letters, used for Sanskrit and English loanwords.
  ஜ: { hard: "j", soft: "j" },
  ஷ: { hard: "sh", soft: "sh" },
  ஸ: { hard: "s", soft: "s" },
  ஹ: { hard: "h", soft: "h" },
  ஶ: { hard: "sh", soft: "sh" },
};

/**
 * Consonant pairs whose spoken form isn't the sum of their parts.
 *
 * Doubled consonants (க்க → "kk") and ந்த → "nth" already come out right from
 * the general rule, so only the ones it gets wrong are listed.
 */
const CLUSTERS: Record<string, string> = {
  [`ங${PULLI}க`]: "ng", // எங்கே → "enge", not "engkay"
  [`ஞ${PULLI}ச`]: "nj",
  [`ண${PULLI}ட`]: "nd", // கண்டு → "kandu"
  [`ம${PULLI}ப`]: "mb", // தம்பி → "thambi"
  [`ன${PULLI}ற`]: "ndr", // என்று → "endru"
  [`ச${PULLI}ச`]: "ch", // பச்சை → "pachai", not "pachchai"
};

const LATIN_VOWEL = /[aeiou]/i;

/**
 * Rewrites Tamil script as Latin letters an English voice can pronounce.
 * Anything that isn't Tamil — English words, punctuation, digits — is left
 * exactly as it is, so mixed sentences survive intact.
 */
export function romaniseTamil(text: string): string {
  let out = "";
  let index = 0;
  // Whether the previous sound was a vowel, which is what decides between the
  // hard and soft reading of the next consonant. False at a word start, so the
  // first consonant of every word is hard.
  let afterVowel = false;

  while (index < text.length) {
    const character = text[index];

    if (VOWELS[character]) {
      out += VOWELS[character];
      afterVowel = true;
      index += 1;
      continue;
    }

    // ஃ, the aytham. Rare, and a breathy "h" is close enough.
    if (character === "ஃ") {
      out += "h";
      afterVowel = false;
      index += 1;
      continue;
    }

    const consonant = CONSONANTS[character];
    if (!consonant) {
      out += character;
      // A space or full stop ends the word, so the next consonant is hard again.
      afterVowel = LATIN_VOWEL.test(character);
      index += 1;
      continue;
    }

    if (text[index + 1] === PULLI) {
      const cluster = CLUSTERS[character + PULLI + text[index + 2]];
      if (cluster) {
        out += cluster;
        index += 3; // both consonants and the pulli between them
        // The vowel belongs to the second consonant of the pair.
        const sign = text[index];
        if (sign === PULLI) {
          afterVowel = false;
          index += 1;
        } else if (SIGNS[sign]) {
          out += SIGNS[sign];
          afterVowel = true;
          index += 1;
        } else {
          out += "a";
          afterVowel = true;
        }
        continue;
      }

      // A dead consonant: no vowel of its own.
      out += consonant.hard;
      afterVowel = false;
      index += 2;
      continue;
    }

    out += afterVowel ? consonant.soft : consonant.hard;

    const sign = text[index + 1];
    if (SIGNS[sign]) {
      out += SIGNS[sign];
      index += 2;
    } else {
      out += "a"; // the inherent vowel every live consonant carries
      index += 1;
    }
    afterVowel = true;
  }

  return out;
}
