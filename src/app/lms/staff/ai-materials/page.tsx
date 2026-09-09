"use client";

// Staff AI training materials (Gamma, Pro+) — thin wrapper; the whole flow
// lives in the shared AiMaterialsWorkspace. The backend scopes every save /
// module-list target to the courses this teacher is assigned to, and a 402
// plan gate shows inline (staff can't upgrade the academy's plan themselves).
import AiMaterialsWorkspace from "@/components/AiMaterialsWorkspace";

export default function StaffAiMaterialsPage() {
  return <AiMaterialsWorkspace variant="staff" />;
}
