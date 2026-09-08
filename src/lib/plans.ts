// The plan catalogue contract, shared by the billing portal (/lms/admin/billing)
// and the signup page (/signup) so both render identical plan cards from one
// source. The shapes mirror App\Support\PlanCatalogue (the PHP single source
// of truth) served by both /api/plans (public) and the billing status endpoint.

// A plan limit; null means unlimited.
export type Limits = { courses: number | null; students: number | null; staff: number | null };

// Plan feature flags, keys mirror config/saas.php `features` (all 13).
export type Features = {
  live_classes: boolean;
  chat: boolean;
  certificates: boolean;
  pre_recorded_video: boolean;
  admission_marketer: boolean;
  remove_branding: boolean;
  advanced_analytics: boolean;
  advanced_reporting: boolean;
  custom_domain: boolean;
  priority_support: boolean;
  ai_materials: boolean;
  api_access: boolean;
  white_label: boolean;
};

// One plan in the catalogue (from App\Support\PlanCatalogue). Enterprise is a
// contact-sales tier: price is null and contact_sales is true.
export type Plan = {
  slug: string;
  name: string;
  label?: string | null;
  price: number | null;
  contact_sales?: boolean;
  commission_percent?: number;
  limits?: Limits;
  features?: Features;
};

// Human labels for the plan feature flags (keys mirror config/saas.php features).
export const FEATURE_LABELS: Record<keyof Features, string> = {
  live_classes: "Live classes",
  chat: "Group chat",
  certificates: "Certificates",
  pre_recorded_video: "Pre-recorded video lessons",
  admission_marketer: "Admission-Marketer network",
  remove_branding: "Remove “Powered by Jorsastech” badge",
  advanced_analytics: "Advanced analytics",
  advanced_reporting: "Advanced reporting & exports",
  custom_domain: "Custom domain",
  priority_support: "Priority support",
  ai_materials: "AI material generation",
  api_access: "API access",
  white_label: "Full white-label",
};

// A short, warm one-liner per tier (display-only; the limits + features shown
// below each are the real, enforced values from the backend).
export const TAGLINES: Record<string, string> = {
  free: "Launch your academy online at no cost.",
  basic: "Live classes, chat & certificates for growing academies.",
  pro: "Scale with the lowest fees, AI materials & deepest insight.",
  enterprise: "Custom limits, full white-label & API for large organisations.",
};

// The price line: Enterprise is contact-sales (no self-serve price); ₦0 is Free.
export function priceText(plan: Plan): string {
  if (plan.contact_sales || plan.price == null) return "Contact sales";
  return plan.price <= 0 ? "Free" : `₦${plan.price.toLocaleString()}`;
}

// A plan limit rendered for humans: null (or missing) means unlimited.
export function limitText(n: number | null | undefined): string {
  return n == null ? "Unlimited" : n.toLocaleString();
}

// The three quota lines for a plan card ("3 courses · 50 students · 1 staff").
export function limitSummary(limits?: Limits): string {
  if (!limits) return "";
  return [
    `${limitText(limits.courses)} course${limits.courses === 1 ? "" : "s"}`,
    `${limitText(limits.students)} student${limits.students === 1 ? "" : "s"}`,
    `${limitText(limits.staff)} staff`,
  ].join(" · ");
}

// Contact-sales tiers (Enterprise) have no self-serve price and no period line.
export function isContactSalesPlan(plan: Plan): boolean {
  return !!plan.contact_sales || plan.price == null;
}
