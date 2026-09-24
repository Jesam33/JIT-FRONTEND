"use client";

import { useParams } from "next/navigation";
import QaRoom from "@/components/qa/QaRoom";

// The tester's room. The token in the URL is the entire credential: it arrives
// by email, it works on any device, and nothing about the session is stored in
// the browser. That is what makes "name, email and phone only" possible without
// leaving the door open.
export default function QaJoinPage() {
  const { token } = useParams<{ event: string; token: string }>();

  return <QaRoom mode="tester" token={typeof token === "string" ? token : ""} />;
}
