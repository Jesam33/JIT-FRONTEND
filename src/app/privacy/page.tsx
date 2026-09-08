// Redirect: the short-form privacy page was superseded by the verbatim policy
// set on /policies. Any old link or bookmark lands on the real Privacy Policy.
import { redirect } from "next/navigation";

export default function PrivacyPage() {
  redirect("/policies?policy=privacy-policy");
}
