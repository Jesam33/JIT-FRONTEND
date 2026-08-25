import { backendFetch, tenantHeaderFromCookie } from "@/lib/backend";
import { cookies } from "next/headers";

type Props = { params: { slug: string } };

export default async function CourseDetail({ params }: Props) {
  const { slug } = params;
  const cookieStore = await cookies();
  const tenant = cookieStore.get?.("tenant")?.value ?? null;

  const headers: any = {};
  if (tenant) Object.assign(headers, tenantHeaderFromCookie(tenant));

  let course = null;
  try {
    const res = await backendFetch(`/api/frontend/lms/courses/${slug}`, { headers });
    if (res.ok) course = await res.json();
  } catch (e) {
    course = null;
  }

  if (!course) return <div>Course not found</div>;

  return (
    <section>
      <h1 className="text-2xl font-bold">{course.title}</h1>
      <p className="mt-3">{course.description}</p>
      <pre className="mt-4 bg-gray-50 p-3 rounded">{JSON.stringify(course, null, 2)}</pre>
    </section>
  );
}
