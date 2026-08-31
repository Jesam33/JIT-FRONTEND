"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AUTH_API } from "@/lib/api";
import AuthLayout, { AuthPasswordField, AuthSubmitButton, AuthMessage } from "@/components/auth/AuthLayout";

function PageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const token = useMemo(() => params.get("token") ?? "", [params]);
  const email = useMemo(() => params.get("email") ?? "", [params]);

  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!password || password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }
    setSubmitting(true);
    const response = await fetch(AUTH_API.setupPassword, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password, password_confirmation: password }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(data?.message ?? "Setup failed. The link may be expired.");
      setSubmitting(false);
      return;
    }
    if (data.token) {
      localStorage.setItem("lms_student_token", data.token);
    }
    router.push("/lms/app");
  }

  return (
    <AuthLayout
      title="Set up your account"
      subtitle={email ? `Welcome, ${email}! Create your password to access the student portal.` : "Create your password to access the student portal."}
    >
      {message ? <AuthMessage tone="error">{message}</AuthMessage> : null}
      <form className="space-y-4" onSubmit={handleSubmit}>
        <AuthPasswordField label="Create password" hint="At least 8 characters." value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a password" autoComplete="new-password" required minLength={8} />
        <AuthSubmitButton loading={submitting}>{submitting ? "Setting up…" : "Enter student portal"}</AuthSubmitButton>
      </form>
    </AuthLayout>
  );
}

export default function SetupPasswordPage() {
  return (
    <Suspense fallback={null}>
      <PageContent />
    </Suspense>
  );
}
