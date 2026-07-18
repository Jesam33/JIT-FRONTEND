"use client";

import { useEffect, useState } from "react";
import { PUBLIC_API } from "../../lib/api";

type Course = {
  id: number;
  name: string;
};

type FormState = {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  qualification_level: string;
  phone_number: string;
  email: string;
  whatsapp: string;
  course_id: string;
  course_name: string;
  learning_mode: "live" | "pre_recorded";
  referral_code: string;
};

const initialState: FormState = {
  first_name: "",
  last_name: "",
  date_of_birth: "",
  qualification_level: "",
  phone_number: "",
  email: "",
  whatsapp: "",
  course_id: "",
  course_name: "",
  learning_mode: "live",
  referral_code: "",
};

export default function StudentRegisterForm() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [form, setForm] = useState<FormState>(initialState);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    fetch(PUBLIC_API.instituteCourses)
      .then((res) => res.json())
      .then((data: Course[]) => {
        if (Array.isArray(data)) {
          setCourses(data);
        }
      })
      .catch(() => {
        setCourses([]);
      });
  }, []);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const selectedCourse = courses.find((item) => String(item.id) === form.course_id);

    const payload = {
      ...form,
      course_id: form.course_id ? Number(form.course_id) : null,
      course_name: selectedCourse?.name ?? form.course_name,
    };

    try {
      const response = await fetch(PUBLIC_API.trainingRegister, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data?.message ?? "Could not submit registration. Please check your details.");
      } else {
        setMessage(data?.message ?? "Registration submitted successfully.");
        setForm(initialState);
      }
    } catch {
      setMessage("Could not submit registration right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <input required value={form.first_name} onChange={(e) => updateField("first_name", e.target.value)} placeholder="First Name" className="rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-black" />
        <input required value={form.last_name} onChange={(e) => updateField("last_name", e.target.value)} placeholder="Last Name" className="rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-black" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <input required type="date" value={form.date_of_birth} onChange={(e) => updateField("date_of_birth", e.target.value)} className="rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-black" />
        <input required value={form.qualification_level} onChange={(e) => updateField("qualification_level", e.target.value)} placeholder="Level of Qualification" className="rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-black" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <input required value={form.phone_number} onChange={(e) => updateField("phone_number", e.target.value)} placeholder="Phone Number" className="rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-black" />
        <input required type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} placeholder="Email" className="rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-black" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <input required value={form.whatsapp} onChange={(e) => updateField("whatsapp", e.target.value)} placeholder="WhatsApp Number" className="rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-black" />
        <select value={form.course_id} onChange={(e) => updateField("course_id", e.target.value)} className="rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-black">
          <option value="">Select Course</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>{course.name}</option>
          ))}
        </select>
      </div>

      {!form.course_id ? (
        <input required value={form.course_name} onChange={(e) => updateField("course_name", e.target.value)} placeholder="Preferred Course (if not listed)" className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-black" />
      ) : null}

      <div>
        <p className="mb-2 text-sm font-semibold text-black">Learning Mode</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-black">
            <input type="radio" name="learning_mode" value="live" checked={form.learning_mode === "live"} onChange={() => updateField("learning_mode", "live")} />
            Live Classes
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-black">
            <input type="radio" name="learning_mode" value="pre_recorded" checked={form.learning_mode === "pre_recorded"} onChange={() => updateField("learning_mode", "pre_recorded")} />
            Pre-recorded
          </label>
        </div>
      </div>

      <div>
        <input value={form.referral_code} onChange={(e) => updateField("referral_code", e.target.value)} placeholder="Referral Code (optional - get 5% discount)" className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-black" />
        <p className="mt-1 text-[11px] text-black/50">Enter an agent referral code to receive a 5% discount on your course.</p>
      </div>

      <button disabled={loading} type="submit" className="inline-flex items-center rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60">
        {loading ? "Submitting..." : "Submit Registration"}
      </button>

      {message ? <p className="text-sm text-black/75">{message}</p> : null}
    </form>
  );
}
