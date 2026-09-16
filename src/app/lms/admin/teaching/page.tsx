import { redirect } from "next/navigation";

// The owner portal's teaching area is entered at its dashboard.
export default function TeachingIndexPage() {
  redirect("/lms/admin/teaching/app");
}
