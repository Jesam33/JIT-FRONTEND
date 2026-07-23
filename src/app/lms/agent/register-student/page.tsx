"use client";

import { useEffect, useState } from "react";
import { PUBLIC_API, AGENT_API } from "../../../../lib/api";
import { fetchWithTimeout } from "../../../../lib/fetch-with-timeout";
import { useAgent } from "../../../../components/AgentContext";

type Course = { id: number; title: string; price: number };

const qualifications = [
  "SSCE / WAEC / NECO", "GCE / O-Level", "ND / OND", "NCE", "HND",
  "Bachelor's Degree (B.Sc / B.A / B.Ed)", "Postgraduate Diploma (PGD)",
  "Master's Degree (M.Sc / M.A / M.Ed)", "Doctorate (PhD)", "Professional Certification", "Others",
];

type FormData = {
  first_name: string; last_name: string; date_of_birth: string;
  qualification_level: string; email: string; phone_number: string;
  whatsapp: string; learning_mode: "live" | "pre_recorded"; course_id: string;
};

const initial: FormData = {
  first_name: "", last_name: "", date_of_birth: "", qualification_level: "",
  email: "", phone_number: "", whatsapp: "", learning_mode: "live", course_id: "",
};

export default function AgentRegisterStudentPage() {
  const { agent } = useAgent();
  const [courses, setCourses] = useState<Course[]>([]);
  const [form, setForm] = useState<FormData>(initial);
  const [step, setStep] = useState<"form" | "paying" | "done">("form");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("lms_agent_token");
    fetchWithTimeout(AGENT_API.courses, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
      .then((r) => r.json())
      .then((d) => setCourses(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  function set<K extends keyof FormData>(k: K, v: FormData[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("lms_agent_token");
      const auth: Record<string, string> = {};
      if (token) auth.Authorization = `Bearer ${token}`;

      const regRes = await fetchWithTimeout(AGENT_API.registerStudent, {
        method: "POST",
        headers: { ...auth, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const regData = await regRes.json();

      if (!regRes.ok) {
        setMessage(regData?.message ?? "Registration failed.");
        return;
      }

      const coursePrice = regData.course?.price ?? 0;

      if (coursePrice <= 0) {
        setStep("done");
        setMessage(regData?.message ?? "Registration complete!");
        return;
      }

      const payRes = await fetchWithTimeout(PUBLIC_API.paystackInitialize, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registration_id: regData.registration_id }),
      });
      const payData = await payRes.json();

      if (!payRes.ok || !payData.authorization_url) {
        setMessage(payData?.message ?? "Could not initialize payment.");
        return;
      }

      setStep("paying");
      window.location.href = payData.authorization_url;
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (step === "done") {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-2xl">&#10003;</div>
        <h2 className="text-lg font-semibold text-white">Registration Complete</h2>
        <p className="mt-1 text-sm text-white/60">{message}</p>
      </div>
    );
  }

  if (step === "paying") {
    return (
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-6 text-center text-amber-200 text-sm">
        Redirecting to payment...
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <h2 className="text-xl font-semibold text-white">Register a Student</h2>
      <p className="mt-1 text-sm text-white/60">
        Fill in the student&apos;s details. They pay the full course price &mdash; you earn 10% commission.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <input required value={form.first_name} onChange={(e) => set("first_name", e.target.value)} placeholder="First Name" className="rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-white/30" />
          <input required value={form.last_name} onChange={(e) => set("last_name", e.target.value)} placeholder="Last Name" className="rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-white/30" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input required type="date" value={form.date_of_birth} onChange={(e) => set("date_of_birth", e.target.value)} className="rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-white/30 [color-scheme:dark]" />
          <select required value={form.qualification_level} onChange={(e) => set("qualification_level", e.target.value)} className="rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-white/30">
            <option value="">Qualification</option>
            {qualifications.map((q) => <option key={q} value={q}>{q}</option>)}
          </select>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="Email" className="rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-white/30" />
          <input required value={form.phone_number} onChange={(e) => set("phone_number", e.target.value)} placeholder="Phone Number" className="rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-white/30" />
        </div>
        <input required value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="WhatsApp Number" className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-white/30" />
        <div className="flex gap-3">
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white">
            <input type="radio" name="mode" value="live" checked={form.learning_mode === "live"} onChange={() => set("learning_mode", "live")} />
            Live
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white">
            <input type="radio" name="mode" value="pre_recorded" checked={form.learning_mode === "pre_recorded"} onChange={() => set("learning_mode", "pre_recorded")} />
            Pre-recorded
          </label>
        </div>
        <select required value={form.course_id} onChange={(e) => set("course_id", e.target.value)} className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-white/30">
          <option value="">Select course</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.title} &mdash; &#8358;{Number(c.price).toLocaleString("en-US")}</option>
          ))}
        </select>

        {message ? <p className="text-sm text-rose-300">{message}</p> : null}

        <button type="submit" disabled={loading} className="w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-50 transition">
          {loading ? "Processing..." : "Register & Proceed to Payment"}
        </button>
      </form>
    </div>
  );
}
