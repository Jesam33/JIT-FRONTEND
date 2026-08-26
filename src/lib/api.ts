const BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

export function api(path: string): string {
  return `${BASE.replace(/\/+$/, "")}${path.startsWith("/") ? path : "/" + path}`;
}

export const AUTH_API = {
  login: api("/api/frontend/lms/login"),
  signup: api("/api/frontend/lms/signup"),
  invite: (token: string) => api(`/api/frontend/lms/invite?token=${encodeURIComponent(token)}`),
  forgotPassword: api("/api/frontend/lms/forgot-password"),
  resetPassword: api("/api/frontend/lms/reset-password"),
  setupPassword: api("/api/frontend/lms/setup-password"),
  staffLogin: api("/api/frontend/lms/staff/login"),
  staffForgotPassword: api("/api/frontend/lms/staff/forgot-password"),
  staffResetPassword: api("/api/frontend/lms/staff/reset-password"),
  ownerLogin: api("/api/frontend/lms/owner-login"),
  ownerSetup: api("/api/frontend/lms/owner-setup"),
  ownerInvite: (token: string) => api(`/api/frontend/lms/owner-invite?token=${encodeURIComponent(token)}`),
};

// Owner (institute admin) endpoints. All authenticated calls send
// `Authorization: Bearer <lms_owner_token>`; the backend derives the tenant
// from the owner session (ResolveTenantFromSession), so no tenant header.
export const OWNER_API = {
  summary: api("/api/frontend/lms/owner-summary"),
  onboardingOrg: api("/api/frontend/lms/onboarding/org"),
  importStudents: api("/api/frontend/lms/onboarding/import-students"),
  createCourse: api("/api/frontend/lms/onboarding/create-course"),
  inviteStaff: api("/api/frontend/lms/onboarding/invite-staff"),
  billingStatus: api("/api/frontend/lms/billing/status"),
  billingCheckout: api("/api/frontend/lms/billing/checkout"),
  billingVerify: (ref: string) => api(`/api/frontend/lms/billing/verify?reference=${encodeURIComponent(ref)}`),
  overview: api("/api/frontend/lms/owner/overview"),
  analytics: api("/api/frontend/lms/owner/analytics"),
  students: api("/api/frontend/lms/owner/students"),
  deleteStudent: (id: string | number) => api(`/api/frontend/lms/owner/students/${id}`),
  resendStudentInvite: (id: string | number) => api(`/api/frontend/lms/owner/students/${id}/resend-invite`),
  staff: api("/api/frontend/lms/owner/staff"),
  // Owner staff management (mirrors the student trio): remove an instructor,
  // re-send their set-password invite, suspend/re-enable portal access.
  deleteStaff: (id: string | number) => api(`/api/frontend/lms/owner/staff/${id}`),
  resendStaffInvite: (id: string | number) => api(`/api/frontend/lms/owner/staff/${id}/resend-invite`),
  setStaffActive: (id: string | number) => api(`/api/frontend/lms/owner/staff/${id}/active`),
  courses: api("/api/frontend/lms/owner/courses"),
  tracks: api("/api/frontend/lms/owner/tracks"),
  // Owner course management (create/edit/delete — set description, price, capacity).
  storeCourse: api("/api/frontend/lms/owner/courses"),
  updateCourse: (id: string | number) => api(`/api/frontend/lms/owner/courses/${id}`),
  deleteCourse: (id: string | number) => api(`/api/frontend/lms/owner/courses/${id}`),
  // Owner cohort management (create + assign/reassign an instructor).
  createTrack: api("/api/frontend/lms/owner/tracks"),
  updateTrack: (id: string | number) => api(`/api/frontend/lms/owner/tracks/${id}`),
  // Owner certificates (institute-issued, admin-only — moved off the staff portal).
  certificates: api("/api/frontend/lms/owner/certificates"),
  issueCertificate: api("/api/frontend/lms/owner/certificates"),
  revokeCertificate: (id: string | number) => api(`/api/frontend/lms/owner/certificates/${id}`),
  notifications: api("/api/frontend/lms/owner/notifications"),
  branding: api("/api/frontend/lms/owner/branding"),
  brandingUpdate: api("/api/frontend/lms/owner/branding"),
  brandingLogo: api("/api/frontend/lms/owner/branding/logo"),
  // Public-page profile (hero/about/contact/socials + cover image) — the content
  // shown on the institute's own /i/{slug} storefront. GET + POST share a URL.
  profile: api("/api/frontend/lms/owner/profile"),
  profileUpdate: api("/api/frontend/lms/owner/profile"),
  profileCover: api("/api/frontend/lms/owner/profile/cover"),
  // Course-fee payout: link the institute's own Paystack subaccount so fees
  // settle to its bank (institute collects, not the platform). GET + POST share.
  paymentSettings: api("/api/frontend/lms/owner/payment-settings"),
  paymentSettingsUpdate: api("/api/frontend/lms/owner/payment-settings"),
  // Confirm the account holder's name (Paystack /bank/resolve) before linking —
  // confirmatory only, never blocks linking if the gateway is down.
  resolveAccount: api("/api/frontend/lms/owner/resolve-account"),
  signup: api("/api/signup"),
  signupVerify: (ref: string) => api(`/api/signup/verify?reference=${encodeURIComponent(ref)}`),
  plans: api("/api/plans"),
};

export const STUDENT_API = {
  me: api("/api/frontend/lms/me"),
  branding: api("/api/frontend/lms/branding"),
  dashboard: api("/api/frontend/lms/dashboard"),
  materials: api("/api/frontend/lms/materials"),
  tasks: api("/api/frontend/lms/tasks"),
  taskDetail: (id: string | number) => api(`/api/frontend/lms/tasks/${id}`),
  submitTask: (id: string | number) => api(`/api/frontend/lms/tasks/${id}/submit`),
  notifications: api("/api/frontend/lms/notifications"),
  markNotificationRead: (id: string | number) => api(`/api/frontend/lms/notifications/${id}/read`),
  attendance: api("/api/frontend/lms/attendance"),
  courses: api("/api/frontend/lms/courses"),
  classroomJoin: (id: string | number) => api(`/api/frontend/lms/classrooms/${id}/join`),
  classroomSdkSignature: (id: string | number) => api(`/api/frontend/lms/classrooms/${id}/sdk-signature`),
  // Client-side attendance close-out posted when the embedded live room tears down.
  classroomAttendanceLeave: (id: string | number) => api(`/api/frontend/lms/classrooms/${id}/attendance-leave`),
  profile: api("/api/frontend/lms/profile"),
  changePassword: api("/api/frontend/lms/profile/password"),
  profilePhoto: api("/api/frontend/lms/profile/photo"),
  certificates: api("/api/frontend/lms/certificates"),
  messages: api("/api/frontend/lms/messages"),
  chatBootstrap: api("/api/frontend/lms/chats/bootstrap"),
  chatGroupMessages: api("/api/frontend/lms/chats/group/messages"),
  chatGroupMentionable: api("/api/frontend/lms/chats/group/mentionable"),
  editGroupMessage: (id: string | number) => api(`/api/frontend/lms/chats/group/messages/${id}`),
  deleteGroupMessage: (id: string | number) => api(`/api/frontend/lms/chats/group/messages/${id}/delete`),
  chatDmMessages: api("/api/frontend/lms/chats/dm/messages"),
  editDmMessage: (id: string | number) => api(`/api/frontend/lms/chats/dm/messages/${id}`),
  deleteDmMessage: (id: string | number) => api(`/api/frontend/lms/chats/dm/messages/${id}/delete`),
  reactMessage: (id: string | number) => api(`/api/frontend/lms/chats/messages/${id}/react`),
  chatGroupMarkRead: api("/api/frontend/lms/chats/group/read"),
  chatDmMarkRead: api("/api/frontend/lms/chats/dm/read"),
  chatUnread: api("/api/frontend/lms/chats/unread"),
};

export const STAFF_API = {
  dashboard: api("/api/frontend/lms/staff/dashboard"),
  me: api("/api/frontend/lms/staff/me"),
  branding: api("/api/frontend/lms/branding"),
  classrooms: api("/api/frontend/lms/staff/classrooms"),
  classroom: (id: string | number) => api(`/api/frontend/lms/staff/classrooms/${id}`),
  // Moderator token so the instructor can host the live Jitsi room (both live-class
  // models via a class_type body param).
  classroomMeetingToken: (id: string | number) => api(`/api/frontend/lms/staff/classrooms/${id}/meeting-token`),
  chatGroupMessages: api("/api/frontend/lms/staff/chats/group/messages"),
  editGroupMessage: (id: string | number) => api(`/api/frontend/lms/staff/chats/group/messages/${id}`),
  deleteGroupMessage: (id: string | number) => api(`/api/frontend/lms/staff/chats/group/messages/${id}/delete`),
  chatGroupMentionable: api("/api/frontend/lms/staff/chats/group/mentionable"),
  chatDmMessages: api("/api/frontend/lms/staff/chats/dm/messages"),
  editDmMessage: (id: string | number) => api(`/api/frontend/lms/staff/chats/dm/messages/${id}`),
  deleteDmMessage: (id: string | number) => api(`/api/frontend/lms/staff/chats/dm/messages/${id}/delete`),
  reactMessage: (id: string | number) => api(`/api/frontend/lms/staff/chats/messages/${id}/react`),
  chatUnread: api("/api/frontend/lms/staff/chats/unread"),
  chatGroupMarkRead: api("/api/frontend/lms/staff/chats/group/read"),
  chatDmMarkRead: api("/api/frontend/lms/staff/chats/dm/read"),
  tasks: api("/api/frontend/lms/staff/tasks"),
  task: (id: string | number) => api(`/api/frontend/lms/staff/tasks/${id}`),
  profile: api("/api/frontend/lms/staff/profile"),
  changePassword: api("/api/frontend/lms/staff/profile/password"),
  profilePhoto: api("/api/frontend/lms/staff/profile/photo"),
  materials: api("/api/frontend/lms/staff/materials"),
  material: (id: string | number) => api(`/api/frontend/lms/staff/materials/${id}`),
  attendance: api("/api/frontend/lms/staff/attendance"),
  certificates: api("/api/frontend/lms/staff/certificates"),
  announcements: api("/api/frontend/lms/staff/announcements"),
  announcement: (id: string | number) => api(`/api/frontend/lms/staff/announcements/${id}`),
  reports: api("/api/frontend/lms/staff/reports"),
  students: api("/api/frontend/lms/staff/students"),
  assignedCourses: api("/api/frontend/lms/staff/courses"),
  assignedTracks: api("/api/frontend/lms/staff/tracks"),
  modules: api("/api/frontend/lms/staff/modules"),
  module: (id: string | number) => api(`/api/frontend/lms/staff/modules/${id}`),
  moduleContents: (moduleId: string | number) => api(`/api/frontend/lms/staff/modules/${moduleId}/contents`),
  moduleContent: (moduleId: string | number, contentId: string | number) => api(`/api/frontend/lms/staff/modules/${moduleId}/contents/${contentId}`),
  scheduleClass: (moduleId: string | number) => api(`/api/frontend/lms/staff/modules/${moduleId}/schedule`),
  scheduledClasses: api("/api/frontend/lms/staff/scheduled-classes"),
  scheduledClass: (classId: string | number) => api(`/api/frontend/lms/staff/scheduled-classes/${classId}`),
  notifications: api("/api/frontend/lms/staff/notifications"),
  notificationUnread: api("/api/frontend/lms/staff/notifications/unread"),
  markNotificationRead: (id: string | number) => api(`/api/frontend/lms/staff/notifications/${id}/read`),
  markAllNotificationsRead: api("/api/frontend/lms/staff/notifications/read-all"),
};

export const STUDENT_MODULE_API = {
  modules: api("/api/frontend/lms/modules"),
  module: (id: string | number) => api(`/api/frontend/lms/modules/${id}`),
  timetable: api("/api/frontend/lms/timetable"),
};

export const ADMIN_API = {
  courses: api("/api/frontend/lms/courses"),
  createCourse: api("/admin/lms/courses"),
  deleteCourse: (id: string | number) => api(`/admin/lms/courses/${id}/delete`),
  tracks: api("/api/frontend/lms/admin/tracks"),
  track: (id: string | number) => api(`/api/frontend/lms/admin/tracks/${id}`),
};

export const AGENT_API = {
  apply: api("/api/frontend/lms/agents/apply"),
  login: api("/api/frontend/lms/agents/login"),
  me: api("/api/frontend/lms/agents/me"),
  profile: api("/api/frontend/lms/agents/profile"),
  avatar: api("/api/frontend/lms/agents/avatar"),
  dashboard: api("/api/frontend/lms/agents/dashboard"),
  courses: api("/api/frontend/lms/agents/courses"),
  registerStudent: api("/api/frontend/lms/agents/register-student"),
  commissions: api("/api/frontend/lms/agents/commissions"),
  registrations: api("/api/frontend/lms/agents/registrations"),
  withdrawals: api("/api/frontend/lms/agents/withdrawals"),
  notifications: api("/api/frontend/lms/agents/notifications"),
  notificationUnread: api("/api/frontend/lms/agents/notifications/unread"),
  markNotificationRead: (id: string | number) => api(`/api/frontend/lms/agents/notifications/${id}/read`),
  markAllNotificationsRead: api("/api/frontend/lms/agents/notifications/read-all"),
  forgotPassword: api("/api/frontend/lms/agents/forgot-password"),
  resetPassword: api("/api/frontend/lms/agents/reset-password"),
};

export const PUBLIC_API = {
  instituteCourses: api("/api/frontend/institute/courses"),
  instituteCourse: (slug: string) => api(`/api/frontend/institute/courses/${slug}`),
  // Institute branding for UNAUTHENTICATED pages (login / password setup / reset).
  // Resolves the tenant from an invite/setup token (?token=) or the tenant
  // header, falling back to the primary palette (see BrandingController).
  branding: api("/api/frontend/lms/branding/public"),
  // Tenant-scoped storefront endpoints. `institutePrimary*` serve the apex
  // /institute page (bound to Tenant::primary()); `storefront*` serve each
  // institute's own /i/{slug} mini-site (bound to that slug's tenant).
  institutePrimary: api("/api/frontend/institute/primary"),
  institutePrimaryCourse: (courseSlug: string) => api(`/api/frontend/institute/primary/courses/${courseSlug}`),
  storefront: (slug: string) => api(`/api/frontend/i/${slug}`),
  storefrontCourse: (slug: string, courseSlug: string) => api(`/api/frontend/i/${slug}/courses/${courseSlug}`),
  trainingRegister: api("/api/frontend/training/register"),
  paystackInitialize: api("/api/frontend/paystack/initialize"),
  paystackVerify: (ref: string) => api(`/api/frontend/paystack/verify?reference=${encodeURIComponent(ref)}`),
};
