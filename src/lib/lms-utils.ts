export function formatLocalDateTime(value: string) {
  return new Date(value).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatRelativeCountdown(value: string, currentTime: number) {
  const diffMs = new Date(value).getTime() - currentTime;

  if (diffMs <= 0) {
    return "Live now";
  }

  const totalMinutes = Math.ceil(diffMs / 60000);

  if (totalMinutes < 60) {
    return `Starts in ${totalMinutes} min${totalMinutes === 1 ? "" : "s"}`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `Starts in ${hours}h ${minutes}m`;
}

export function canJoinClassroom(startsAt: string, currentTime: number) {
  return currentTime >= new Date(startsAt).getTime() - 5 * 60 * 1000;
}

export function isClassEnded(startsAt: string, endsAt: string | null, currentTime: number) {
  const endMs = endsAt ? new Date(endsAt).getTime() : new Date(startsAt).getTime() + 2 * 60 * 60 * 1000;
  return currentTime > endMs;
}

export function isClassActiveWindow(startsAt: string, endsAt: string | null, currentTime: number) {
  const startsAtMs = new Date(startsAt).getTime();
  const endsAtMs = endsAt ? new Date(endsAt).getTime() : startsAtMs + 60 * 60 * 1000;
  return currentTime >= startsAtMs - 5 * 60 * 1000 && currentTime <= endsAtMs;
}

export function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("lms_student_token") ?? "";
}
