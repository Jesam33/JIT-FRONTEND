// Redirect: the short-form terms page was superseded by the verbatim policy
// set on /policies. Any old link or bookmark lands on the real Terms & Conditions.
import { redirect } from "next/navigation";

export default function TermsPage() {
  redirect("/policies?policy=terms-and-conditions");
}
