import { backendFetch, tenantHeaderFromCookie } from "@/lib/backend";
import { cookies } from "next/headers";
import Link from "next/link";

export default async function CoursesPage() {
  const cookieStore = await cookies();
  const tenant = cookieStore.get?.("tenant")?.value ?? null;

  const headers: any = {};
  if (tenant) Object.assign(headers, tenantHeaderFromCookie(tenant));

  let courses = [];
  try {
    const res = await backendFetch(`/api/frontend/lms/courses`, { headers });
    if (res.ok) courses = await res.json();
  } catch (e) {
    courses = [];
  }

  return (
    <section>
      <h1 className="text-2xl font-semibold">Courses</h1>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {courses.length === 0 ? (
          <div>No courses</div>
        ) : (
          courses.map((c: any) => (
            <Link key={c.id} href={`/lms/courses/${c.slug}`} className="p-4 border rounded">
              <h3 className="font-semibold">{c.title}</h3>
              <div className="text-sm text-muted">{c.description}</div>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}
