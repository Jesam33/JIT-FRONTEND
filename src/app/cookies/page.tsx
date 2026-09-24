// Redirect: the Cookie Policy lives in the policy set on /policies, which is
// where the reader gets the nav, the other policies and the cross-references.
// This short path exists so /cookies works as a link target on its own, the same
// way /privacy and /terms do.
import { redirect } from "next/navigation";

export default function CookiesPage() {
  redirect("/policies?policy=cookie-policy");
}
