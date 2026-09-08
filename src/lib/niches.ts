// Canonical list of general academy niches for the registration form and the
// owner Public page editor dropdowns, and the vocabulary the public Campuses
// directory filter categorises against. The value stored server-side is free
// text (an owner can pick "Other" and type their own), so this list is a
// convenience for the picker, never a hard constraint. Keep the labels human and
// specific. Ampersands and slashes are fine here; avoid dashes as punctuation.

export const OTHER_NICHE = "Other";

export const ACADEMY_NICHES: string[] = [
  "Software Engineering",
  "Data Science & AI",
  "Web & Mobile Development",
  "Design & Creative Arts",
  "Digital Marketing",
  "Business & Entrepreneurship",
  "Finance & Accounting",
  "Cooking & Culinary Arts",
  "Fashion & Tailoring",
  "Beauty & Cosmetology",
  "Photography & Videography",
  "Music & Audio",
  "Language Learning",
  "Health & Wellness",
  "Fitness & Sports",
  "Agriculture",
  "Vocational & Technical Skills",
  "Academic & Exam Prep",
  "Real Estate",
  "Personal Development",
];

// True when a stored niche is one of the predefined options, so the editor can
// decide whether to preselect it in the dropdown or fall back to the free-text
// "Other" input for a custom value the owner typed.
export function isKnownNiche(value: string | null | undefined): boolean {
  return !!value && ACADEMY_NICHES.includes(value);
}
