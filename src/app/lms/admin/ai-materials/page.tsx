"use client";

// Owner AI training materials (Gamma, Pro+) — thin wrapper; the whole flow
// lives in the shared AiMaterialsWorkspace (also used by the staff portal
// page, the teachers who actually author the content).
import AiMaterialsWorkspace from "@/components/AiMaterialsWorkspace";

export default function OwnerAiMaterialsPage() {
  return <AiMaterialsWorkspace variant="owner" />;
}
