"use client";

import { useParams } from "next/navigation";
import QaRoom from "@/components/qa/QaRoom";

// The iungo team's side of the testing day.
//
// This is a moderator link, so it is never shared with testers: a Jitsi room
// with no moderator is a room nobody can manage (no kick, no end, and recording
// is moderator-gated in the JWT). One link covers every session of the day,
// because the host picks the room rather than holding one link per room.
export default function QaHostPage() {
  const { token } = useParams<{ event: string; token: string }>();

  return <QaRoom mode="host" token={typeof token === "string" ? token : ""} />;
}
