export type DashboardPayload = {
  profile?: {
    first_name: string;
    last_name: string;
    email: string;
    learning_mode: "live" | "pre_recorded" | null;
    course_title: string | null;
  };
  summary?: {
    classes_total: number;
    classes_attended: number;
    attendance_rate: number;
    modules_total?: number;
    modules_completed?: number;
  };
  upcoming_class?: {
    id: number;
    class_type?: "classroom" | "scheduled";
    title: string;
    starts_at: string;
    ends_at: string | null;
    meeting_id?: string | null;
    meeting_url?: string | null;
    join_opens_at: string;
    join_enabled: boolean;
  } | null;
  next_lesson?: {
    id: number;
    title: string;
    file_url: string;
    course_title: string | null;
  } | null;
  timetable?: Array<{
    id: number;
    class_type?: "classroom" | "scheduled";
    title: string;
    starts_at: string;
    ends_at: string | null;
    meeting_id?: string | null;
    meeting_password?: string | null;
    meeting_url?: string | null;
    session_thumbnail_url?: string | null;
    recording_url?: string | null;
    module_id?: number | null;
  }>;
  materials?: Array<{
    id: number;
    course_id?: number;
    title: string;
    file_url: string;
    type?: "file" | "link" | "image" | "video";
    session_id?: number | null;
  }>;
  tasks?: TaskItem[];
  notifications?: NotificationItem[];
};

export type ChatMessage = {
  id: number;
  chat_id?: number;
  content?: string | null;
  body?: string | null;
  sender_role?: "student" | "teacher";
  from_role?: "student" | "teacher";
  sender_id?: number | null;
  sender_name?: string;
  attachment_url?: string | null;
  created_at: string;
  edited_at?: string | null;
};

export type ChatBootstrap = {
  track: { id: number; name: string };
  group_chat: { id: number; track_id: number };
  dm_thread: { id: number; instructor_id: number; instructor_name?: string | null };
};

export type AttendanceItem = {
  classroom_id: number;
  class_title: string | null;
  starts_at: string | null;
  status: "present" | "late" | "partial" | "absent" | "made_up";
  total_seconds: number;
  first_joined_at: string | null;
  calculated_at: string | null;
};

export type SdkSignaturePayload = {
  signature: string;
  sdk_key: string;
  meeting_number: string;
  user_name: string;
  user_email: string;
  passcode: string;
};

export type TaskItem = {
  id: number;
  module_id?: number | null;
  title: string;
  description: string;
  instructions: string | null;
  due_at: string;
  submission_type: "link" | "file_upload";
  status: "pending" | "submitted" | "graded";
  submitted_at: string | null;
  score: number | null;
};

export type NotificationItem = {
  id: number;
  type: string;
  title: string;
  body: string | null;
  is_read: boolean;
  reference_type: string | null;
  reference_id: number | null;
  created_at?: string | null;
};

export type StudentProfile = {
  first_name: string;
  last_name: string;
  email: string;
  date_of_birth?: string | null;
  phone?: string | null;
  gender?: string | null;
  profile_photo_url: string | null;
  referral_code?: string;
  course_title?: string | null;
  track_name?: string | null;
  total_modules?: number;
  notify_class_reminders: boolean;
  notify_chat: boolean;
  notify_announcements: boolean;
};

export type StudentCertificate = {
  id: number;
  title: string;
  file_url: string | null;
  issued_at: string | null;
};

export type TimetableItem = NonNullable<DashboardPayload["timetable"]>[number];
export type MaterialItem = NonNullable<DashboardPayload["materials"]>[number];
