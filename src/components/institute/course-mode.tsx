"use client";

import { createContext, useContext } from "react";

// Which delivery mode a visitor has chosen on a course page.
//
// The price headline sits ABOVE the register form in the same panel and has to
// follow the form's Live / Pre-recorded / One-on-one choice, so the two share
// this state. It lives in a context rather than inside either component because
// they are siblings: the form owns the radios, the headline reads the result.
export type LearningMode = "live" | "pre_recorded" | "one_on_one";

export type CourseModeValue = {
  mode: LearningMode;
  setMode: (mode: LearningMode) => void;
};

// Null outside a provider, so a consumer can render standalone. The register
// form is one: it publishes its choice here when a price panel is present and
// simply no-ops when the form is used somewhere without one.
export const CourseModeContext = createContext<CourseModeValue | null>(null);

export function useCourseMode(): CourseModeValue | null {
  return useContext(CourseModeContext);
}
