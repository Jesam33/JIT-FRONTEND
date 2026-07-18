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
};

export const STUDENT_API = {
  me: api("/api/frontend/lms/me"),
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
  chatUnread: api("/api/frontend/lms/chats/unread"),
};

export const STAFF_API = {
  dashboard: api("/api/frontend/lms/staff/dashboard"),
  me: api("/api/frontend/lms/staff/me"),
  classrooms: api("/api/frontend/lms/staff/classrooms"),
  classroom: (id: string | number) => api(`/api/frontend/lms/staff/classrooms/${id}`),
  chatGroupMessages: api("/api/frontend/lms/staff/chats/group/messages"),
  editGroupMessage: (id: string | number) => api(`/api/frontend/lms/staff/chats/group/messages/${id}`),
  deleteGroupMessage: (id: string | number) => api(`/api/frontend/lms/staff/chats/group/messages/${id}/delete`),
  chatGroupMentionable: api("/api/frontend/lms/staff/chats/group/mentionable"),
  chatDmMessages: api("/api/frontend/lms/staff/chats/dm/messages"),
  editDmMessage: (id: string | number) => api(`/api/frontend/lms/staff/chats/dm/messages/${id}`),
  deleteDmMessage: (id: string | number) => api(`/api/frontend/lms/staff/chats/dm/messages/${id}/delete`),
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
  dashboard: api("/api/frontend/lms/agents/dashboard"),
  courses: api("/api/frontend/lms/agents/courses"),
  registerStudent: api("/api/frontend/lms/agents/register-student"),
  commissions: api("/api/frontend/lms/agents/commissions"),
  withdrawals: api("/api/frontend/lms/agents/withdrawals"),
  notifications: api("/api/frontend/lms/agents/notifications"),
  notificationUnread: api("/api/frontend/lms/agents/notifications/unread"),
  markNotificationRead: (id: string | number) => api(`/api/frontend/lms/agents/notifications/${id}/read`),
  markAllNotificationsRead: api("/api/frontend/lms/agents/notifications/read-all"),
};

export const PUBLIC_API = {
  instituteCourses: api("/api/frontend/institute/courses"),
  instituteCourse: (slug: string) => api(`/api/frontend/institute/courses/${slug}`),
  trainingRegister: api("/api/frontend/training/register"),
  paystackInitialize: api("/api/frontend/paystack/initialize"),
  paystackVerify: (ref: string) => api(`/api/frontend/paystack/verify?reference=${encodeURIComponent(ref)}`),
};
