// The academy owner's own copy of a staff-portal page, so the owner portal
// contains every teaching feature instead of bouncing the owner into the staff
// shell (BaseLmsController::staffActor accepts the owner token on every staff
// endpoint and scopes it to the WHOLE academy).
//
// Re-exported rather than copied: one implementation, so a fix to the staff page
// can never drift from the owner's. The pages are self-contained client
// components (they fetch through apiFetchStaff, which falls back to the owner
// token) and take their chrome from /lms/admin/layout.tsx.
export { default } from "@/app/lms/staff/chats/page";
