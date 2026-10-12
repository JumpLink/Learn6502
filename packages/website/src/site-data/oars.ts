/**
 * OARS content rating → minimum age.
 *
 * Ported from libappstream's `as_content_rating_attribute_to_csm_age()` (the Common Sense Media
 * table) and `as_content_rating_get_minimum_age()`, which is what GNOME Software and Flathub show:
 * https://github.com/ximion/appstream/blob/master/src/as-content-rating.c
 * Unknown attributes count as 0, like upstream.
 */

export type OarsValue = "none" | "mild" | "moderate" | "intense";

const VALUE_INDEX: Record<OarsValue, number> = { none: 0, mild: 1, moderate: 2, intense: 3 };

/** Minimum age per attribute for `[none, mild, moderate, intense]`. */
const CSM_AGE: Record<string, readonly [number, number, number, number]> = {
  "violence-cartoon": [0, 3, 4, 6],
  "violence-fantasy": [0, 3, 7, 8],
  "violence-realistic": [0, 4, 9, 14],
  "violence-bloodshed": [0, 9, 11, 18],
  "violence-sexual": [0, 18, 18, 18],
  "drugs-alcohol": [0, 11, 13, 16],
  "drugs-narcotics": [0, 12, 14, 17],
  "drugs-tobacco": [0, 10, 13, 13],
  "sex-nudity": [0, 12, 14, 14],
  "sex-themes": [0, 13, 14, 15],
  "language-profanity": [0, 8, 11, 14],
  "language-humor": [0, 3, 8, 14],
  "language-discrimination": [0, 9, 10, 11],
  "money-advertising": [0, 7, 8, 10],
  "money-gambling": [0, 7, 10, 18],
  "money-purchasing": [0, 12, 14, 15],
  "social-chat": [0, 4, 10, 13],
  "social-audio": [0, 15, 15, 15],
  "social-contacts": [0, 12, 12, 12],
  "social-info": [0, 0, 13, 13],
  "social-location": [0, 13, 13, 13],
  "sex-homosexuality": [0, 13, 14, 15],
  "sex-prostitution": [0, 12, 14, 18],
  "sex-adultery": [0, 8, 10, 18],
  "sex-appearance": [0, 10, 10, 15],
  "violence-worship": [0, 13, 15, 18],
  "violence-desecration": [0, 13, 15, 18],
  "violence-slavery": [0, 13, 15, 18],
};

function isOarsValue(value: string): value is OarsValue {
  return value in VALUE_INDEX;
}

export function attributeToCsmAge(attribute: string, value: string): number {
  const row = CSM_AGE[attribute];
  if (!row || !isOarsValue(value)) return 0;
  return row[VALUE_INDEX[value]];
}

/**
 * The highest per-attribute age (`as_content_rating_get_minimum_age()`); 0 means "all ages".
 * Returns `undefined` for rating systems other than OARS 1.0/1.1, where upstream gives no answer.
 */
export function minimumAge(kind: string, attributes: Readonly<Record<string, string>>): number | undefined {
  if (kind !== "oars-1.0" && kind !== "oars-1.1") return undefined;
  let age = 0;
  for (const [attribute, value] of Object.entries(attributes)) {
    age = Math.max(age, attributeToCsmAge(attribute, value));
  }
  return age;
}
