import { redirect } from "next/navigation";

// The public pricing lives at /pricing (config-driven SaaS tiers). This legacy
// route used a broken hardcoded API host; redirect to the canonical page.
export default function PlansPage() {
  redirect("/pricing");
}
