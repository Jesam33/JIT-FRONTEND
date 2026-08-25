import React from "react";
import StudentLayoutClient from "../../../components/StudentLayoutClient";

export const metadata = {
  title: "Student Portal",
};

// The task detail page lives at /lms/tasks/[id] (outside /lms/app), so it needs
// its OWN copy of the branded student shell — same sidebar, navbar (institute
// logo), branding CSS vars, auth guard and idle-logout that /lms/app/layout.tsx
// applies. Keeping the URL here (rather than moving the page under /lms/app)
// leaves every existing link to /lms/tasks/[id] intact.
export default function LmsTasksLayout({ children }: { children: React.ReactNode }) {
  return <StudentLayoutClient>{children}</StudentLayoutClient>;
}
