<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:project-context -->
# Project Context — Jorsas Tech LMS

## Architecture
- **Frontend**: `jorsas-tech-v2/` — Next.js 16, React 19, Tailwind v4, TypeScript
- **Backend**: Laravel (root of the monorepo) serves API + admin panel
- **Database**: MySQL via Laravel migrations
- **Auth**: Token-based (`lms_token` for students, `lms_staff_token` for staff) via `LmsSession`
- **Currency**: Naira (₦), prices stored as decimals
- **Timezone**: UTC in DB, converted to local on the JS frontend

## Core Domain Concepts

### Tracks & Courses
- **LmsCourse**: A subject/program (e.g. "Full Stack Web Development")
- **LmsTrack**: A cohort/batch assigned to one instructor. `instructor_id` gates staff access.
- **Enrollment**: Links a student to a track via `LmsEnrollment`

### Modules (curriculum units)
- `LmsModule`: belongsTo Course, hasMany ModuleContents + ScheduledClasses + Tasks
- `LmsModuleContent`: individual content items within a module (video, slides, PDF, link, text, code)
- Modules are unlocked **sequentially** — module N is visible only after the previous module's scheduled class has started
- One module = one task (the end-of-module assessment)

### Scheduled Classes (delivery events)
- `LmsScheduledClass`: belongsTo Module + Teacher. Has date/time + an auto-generated Jitsi (8x8 JaaS) room.
- Multiple classes can point to the same module (e.g. Module 1 gets 3 sessions)
- Timetable merges old `lms_classrooms` + new `LmsScheduledClass` with `class_type` field

### Tasks & Grading
- `LmsTask`: belongsTo Course + optionally Module. Has `submission_type` (link/file_upload)
- `LmsTaskSubmission`: belongsTo Task + Student. Stores `score`, `feedback`, `status`
- **Passing grade = 70%**. Module progress calculated from graded tasks — if score >= 70%, the module counts as completed
- Dashboard shows progress bar: "3/8 modules completed"

### Materials
- `LmsMaterial`: belongsTo Course. Types: pdf, doc, video, link, other
- Video materials render an inline HTML5 `<video>` player with controls + download button
- Auto-detects Zoom recording URLs and MP4/webm files

### Chat System
- **Group chat**: Per-track polymorphic chat via `LmsGroupChat` + `LmsMessage` (chat_type='group')
- **DM**: Staff-student direct messages via `LmsDmThread` + `LmsMessage` (chat_type='dm')
- Polling: Student chat polls every 5s with `document.hidden` check; staff dashboard polls every 15s
- **@ mentions**: Type `@` to see a dropdown of all track members. Arrow keys + Enter to select. Tagged students get a notification.

### Live Classes (Jitsi / 8x8 JaaS)
- Live classes run on **8x8 JaaS** (managed Jitsi), not Zoom. There is no external meeting to
  create: the room name is auto-generated and stored in the reused `meeting_id` column as
  `jit-{tenantId}-{s|c}{id}-{sha1 substr}` (via `BaseLmsController::ensureRoom`).
- Join tokens are **RS256** JWTs, hand-signed with `openssl_sign(..., OPENSSL_ALGO_SHA256)` in
  `BaseLmsController::jwtEncodeRs256` (no JWT library). Students get a participant token
  (`moderator:false`); staff get a moderator token (`moderator:true`) via
  `StaffClassroomController::meetingToken`.
- Students join **in-portal** via an iframe (`public/jitsi-meeting.html`) that loads
  `external_api.js` from `https://8x8.vc/{appId}/external_api.js` and talks to the parent through a
  one-way `postMessage` contract (`jitsi-joined` / `jitsi-left` / `jitsi-error`). Staff "Host" opens
  the room in a new tab (`https://8x8.vc/{appId}/{room}?jwt=…`).
- If JaaS env vars are missing, `jitsiConfig()` returns null and the token endpoints return a clean
  **503** ("Live classes are not configured yet.") — no crash, buttons degrade gracefully.

### Attendance
- `LmsAttendance`: Tracks student joins/leaves per classroom. Fields: student_id, classroom_id, joined_at, first_joined_at, last_left_at, total_seconds, status, calculated_at
- `LmsAttendanceRecord`: Detailed computed records
- Attendance is **client-side**: only classroom-type classes track it. On join, `sdkSignature()`
  first-creates the attendance row; when the embedded room tears down, the frontend POSTs
  `/api/frontend/lms/classrooms/{id}/attendance-leave`, which computes `total_seconds`/`status`
  (present/partial/absent from the 75%-of-duration threshold). `LmsScheduledClass` never tracked
  attendance and still does not. (This replaces the old Zoom `meeting.ended` webhook.)

### Notifications
- Three tables, one per audience: `LmsNotification` (student), `LmsTeacherNotification` (staff), `AgentNotification` (agent). Shape: `{recipient}_id, type, title, body, reference_type, reference_id, is_read, emailed_at, email_attempts`.
- Types: task_graded, mention, scheduled_class, new_module, new_course, platform_announcement, etc.
- Created when: task is graded, student is @mentioned in chat, a class is scheduled, a staff publishes a module (`new_module`) or a course is created (`new_course` → enrolled students), or the host broadcasts a platform announcement.

#### Email delivery (every notification is also emailed)
- A scheduled command **`lms:send-notification-emails`** (runs every minute via `routes/console.php`) sweeps all three tables for rows with `emailed_at IS NULL` and sends each as an email (`LmsNotificationMail`), then stamps `emailed_at`. Mail is `sync` (no queue worker on shared hosting), so the sweep — not the request — does the sending.
- **Per-institute sender identity (no spoofing):** the email's **from-address stays on the platform's one verified domain** (`MAIL_FROM_ADDRESS`) so SPF/DKIM/DMARC pass and it reaches inboxes — but the **from-NAME is the institute** (recipients see "Brightstone Academy", not "Jorsas"), and **Reply-To is the institute's own email** so replies reach them, not the platform. Reply-To prefers the institute's published public contact email (`settings.profile.contact.email`), falling back to the owner's login email (`tenant_admins.role = owner`); if neither is a valid address, no Reply-To is set. The map is built once per sweep run (two queries) in `SendNotificationEmails::replyToMap()`, and `LmsNotificationMail` re-validates before applying it.
- The email's button links **into the in-app LMS page** for that notification, built by `App\Support\NotificationLinks::forNotification(audience, reference_type, reference_id, tenantSlug)`. Its path map **must stay in sync** with the frontend `notificationHref` maps in `src/app/lms/app/notifications/page.tsx` and `src/app/lms/staff/notifications/page.tsx` (change one → change both). Links are absolute (`config('saas.frontend_url')` → set `LMS_BASE_URL` in prod) and carry `?tenant={slug}` so a cold tap pins the right institute.
- Config in `config/saas.php`: `NOTIFICATION_EMAILS_ENABLED` (master off-switch), `NOTIFICATION_EMAIL_EXCLUDE_TYPES` (**defaults to `mention`** — chat @mentions are in-app only, not emailed), `NOTIFICATION_EMAIL_BATCH` (per-table per-tick cap, default 120), `NOTIFICATION_EMAIL_MAX_ATTEMPTS` (give-up count, default 3). Retry counter is `email_attempts`; a bad address is stamped `emailed_at` after max attempts so it stops retrying.
- **Deep-link auth flow**: a logged-out tap on an emailed link hits the portal guard, which pins the tenant from `?tenant=` and forwards to login with `?next=<original path>`; login validates it via `isSafeNextPath()` (same-origin `/lms/` only, never an auth page) and pushes there after auth. Wired for student + staff logins.

#### Platform announcements (host → everybody, all institutes)
- The **host** (Botble super-admin, Blade panel at `/admin/lms/announcements` — there is no Next.js host UI) posts a `PlatformAnnouncement` targeting any of `student` / `staff` / `agent`.
- A scheduled command **`lms:dispatch-announcements`** (also every minute, ordered *before* the email sweep) fans each queued announcement into per-recipient notification rows across **every tenant** (bulk insert, `withoutGlobalScope(TenantScope)`, one transaction per announcement), `type='platform_announcement'`. Those rows are then emailed by the normal sweep on the same tick.

## Staff Portal
- URL: `/lms/staff/*` — uses `lms_staff_token`
- Sidebar groups: Teaching (Dashboard, Courses, Tracks, Students, Classroom, Timetable, Attendance), Content (Modules, Materials, Tasks, Certificates), Communication (Chats, Announcements), Admin (Reports, Profile)
- Staff sees only their assigned courses/tracks (via `instructor_id` on `LmsTrack`)
- Staff CAN create/edit/delete classrooms (own), modules, materials, tasks, announcements
- Staff CANNOT create/edit courses or tracks — admin-only
- `fetchWithTimeout` (30s AbortController + fast-transient retry) used on every API call
- `ConfirmDialog` for destructive actions
- `ErrorBoundary` + `ToastProvider` wrapping every page

## Student Portal
- URL: `/lms/app/*` — uses `lms_token`
- Sidebar: Dashboard, Attendance, Classroom, Timetable, Modules, Tasks, Materials, Chats, Profile
- Dashboard shows: profile, module progress bar, upcoming class, pending tasks, announcements, timetable preview
- Materials page fetches dedicated `/api/frontend/lms/materials` endpoint (NOT the heavy dashboard endpoint)
- Classroom page fetches lightweight timetable + profile endpoints (NOT the heavy dashboard endpoint)
- Modules are sequentially unlocked

## Recent Fixes (Session: July 14-15, 2026)

### Performance — Pages loading slow
**Problem**: Materials page and Classroom page were fetching the ENTIRE dashboard API (profile, timetable, summary, classes, materials, next_lesson — ~50KB+ of data) when each only needed a fraction of that.

**Fix**:
- Created `StudentMaterialController` with lightweight `GET /api/frontend/lms/materials` endpoint that returns ONLY materials for the student's enrolled course
- Updated `StudentModuleController::timetable` to merge old `lms_classrooms` + new `LmsScheduledClass` in one endpoint (moved the merge logic from dashboard into the timetable endpoint)
- Materials page now does a single lightweight fetch instead of the entire dashboard
- Classroom page now does 3 small parallel fetches (timetable + attendance + profile) instead of the heavy dashboard

### Chat Messages Not Sending

**Problem 1 — Staff group chat**: `StaffChatController::sendGroupMessage()` required `chat_id` in the request body, but the staff dashboard's `sendGroupMessage()` only sent `{ content, attachment_url }`. No chat_id was ever provided.

**Fix**: Backend now auto-discovers the teacher's track and its group chat (same pattern as the student controller), so chat_id is no longer needed from the frontend.

**Problem 2 — Staff DM**: The staff DM frontend sent `thread_id` in the request body, but `StaffChatController::sendDmMessage()` validated `dm_thread_id`. The field name mismatch caused validation to fail silently.

**Fix**: Changed frontend to send `dm_thread_id` instead of `thread_id`.

**Problem 3 — Missing sender names**: Chat message responses didn't include `sender_name`, so the ChatLayout component showed empty sender names.

**Fix**: Added `sender_name` to all group message responses on both Staff and Student controllers. Added `teacher()` and `student()` relationships to `LmsMessage` model for eager loading.

### @ Mentions in Group Chat

**New feature**: Users can tag other members in the track group chat.

**Backend**:
- `StaffChatController::mentionableUsers()` — returns all students in the teacher's track + the teacher
- `StudentChatController::mentionableUsers()` — returns all students in the track + the instructor
- `sendGroupMessage()` on both controllers now parses `@Full Name` mentions from message content and creates `LmsNotification` entries (type='mention') for each tagged student
- New routes: `GET /api/frontend/lms/chats/group/mentionable` and `GET /api/frontend/lms/staff/chats/group/mentionable`

**Frontend**:
- `InputBar` in ChatLayout now supports @mention detection: when typing `@`, a dropdown of all track members appears
- Navigate with Arrow Up/Down, select with Enter/mouse click, dismiss with Escape
- On selection, `@Name` is inserted into the message input at cursor position
- Staff dashboard group chat (on `/lms/staff/app`) also has the @mention dropdown built inline

### Video Player in Materials

**New feature**: Staff can post recorded Zoom meetings (or any video URL) as materials, and students see them with an inline video player.

**Backend**: Already supported `type: 'video'` in `storeMaterial()`.

**Frontend (student materials page)**:
- Added `video` to the material type filter
- Added `isVideoUrl()` helper that detects `.mp4`, `.webm`, `.ogg`, `.mov`, `zoom.us/rec/`, `cloudfront.net`, `s3.amazonaws.com`
- `<video>` HTML5 element renders with controls, preload metadata, max-height 64
- Download link + "Open in new tab" button below the player
- Image materials also get inline previews
- Updated `lms-types.ts` MaterialItem to include `'video'` in the type union

### Missing Student Tasks Page

**Problem**: There was no dedicated student tasks listing page. The only way to see tasks was the 3-item preview on the dashboard.

**Fix**: Created `/lms/app/tasks/page.tsx` that lists all tasks grouped by status (Pending, Submitted, Graded) with score badges and colored status indicators. Each task links to `/lms/tasks/[id]` for detail/submission.

### Missing Sidebar Navigation Links

**Staff sidebar**: Was missing Modules link under Content group. Added `{ href: "/lms/staff/modules", label: "Modules" }` before Materials.

**Student sidebar**: Was missing Tasks link. Added `{ href: "/lms/app/tasks", label: "Tasks" }` between Modules and Materials.

### Attendance System — Columns Missing, Webhook Failing Silently

**Problem**: The `lms_attendances` table only had `student_id`, `classroom_id`, `joined_at`, and `timestamps`. But the Zoom webhook controller (`StudentClassroomController`) tried to:
- Set `first_joined_at`, `last_left_at`, `total_seconds`, `status`, `calculated_at` on `LmsAttendance` records
- Query `->whereNull('last_left_at')` and `->whereNull('calculated_at')` on the table
- All of these columns did NOT exist in the DB
- The `$fillable` array in `LmsAttendance` model only listed the original 3 columns
- The `update()` calls silently ignored all non-fillable fields — the webhook appeared to work but never saved any computed data
- Student attendance endpoint always returned `total_seconds: 0` and `status: 'present'` regardless of actual attendance

**Fix**:
1. Created migration `2026_07_15_000001_fix_lms_attendances_columns.php` that adds: `first_joined_at`, `last_left_at`, `total_seconds`, `status`, `calculated_at`
2. Updated `LmsAttendance` model's `$fillable` and `$casts` to include all new columns
3. Added `student()` relationship to `LmsAttendance`
4. Fixed `participant_joined` handler: now checks for existing record first, sets `first_joined_at` on first create
5. Fixed `participant_left` handler: sets `first_joined_at` from existing `joined_at` if null, then sets `last_left_at`
6. Fixed `meeting.ended` handler: uses `first_joined_at ?? joined_at` for backward compatibility, also writes to `LmsAttendanceRecord`
7. Updated student attendance endpoint to use computed values: `total_seconds`, `status` from DB, `first_joined_at`, `calculated_at`

### Server-Spamming — Chat Polling Without Visibility Check

**Problem**: Student chat page polled group + DM messages every 5 seconds via `window.setInterval`, even when the browser tab was in the background (hidden). This generated unnecessary server load.

**Fix**: Added `document.hidden` check inside the poll function. Also added a `visibilitychange` event listener so messages refresh immediately when the user returns to the tab.

## .env Configuration for Production
- `APP_ENV=production`
- `APP_DEBUG=false`
- `NEXT_PUBLIC_API_BASE=http://localhost:8000` (change to production URL)
- `JITSI_APP_ID=` — 8x8 JaaS App ID (magic cookie)
- `JITSI_API_KEY_ID=` — the JaaS API key id (becomes the JWT `kid`)
- `JITSI_PRIVATE_KEY=` — the RS256 private key, base64-encoded on one line (dotenv-safe); read as-is if it already contains `BEGIN`
- `JITSI_DOMAIN=8x8.vc`
- CORS in `config/cors.php`: change `'allowed_origins' => ['*']` to specific domain before deploying

## Key Technical Decisions
- **Live-class isolation**: `public/jitsi-meeting.html` loads 8x8 JaaS `external_api.js` in an iframe and communicates with the parent via `postMessage` (`jitsi-joined`/`jitsi-left`/`jitsi-error`). Served same-origin so the parent's `event.origin === window.location.origin` check holds.
- **RS256 JWT, no library**: JaaS tokens are hand-signed via `openssl_sign(..., OPENSSL_ALGO_SHA256)` in `BaseLmsController`. Header `{alg:RS256, kid, typ}`; payload carries `context.user.moderator` + `features` as **strings**. `room:"*"` so one token works for the resolved room.
- **Room reuse**: the old nullable `meeting_id` column now stores the Jitsi room name; `ensureRoom()` is idempotent (returns the existing value if it already starts with `jit-`, else generates + persists one).
- **Polling intervals**: Student chat 5s, staff dashboard 15s (both with visibility checks)
- **Module progress**: Derived from task grades (>= 70%), not stored as a separate counter
- **Sequential unlock**: Module N is accessible only when module N-1's scheduled class has started

## Relevant File Paths

### Backend (Laravel root)
- `app/Http/Controllers/Lms/StaffChatController.php` — Group + DM chat, mentions, delete
- `app/Http/Controllers/Lms/StudentChatController.php` — Bootstrap, group + DM chat, mentions
- `app/Http/Controllers/Lms/StaffModuleController.php` — Module/content/class CRUD
- `app/Http/Controllers/Lms/StudentModuleController.php` — Module listing (sequential unlock), timetable (merged)
- `app/Http/Controllers/Lms/StudentMaterialController.php` — Lightweight materials endpoint
- `app/Http/Controllers/Lms/StudentDashboardController.php` — Dashboard, tasks, attendance, notifications
- `app/Http/Controllers/Lms/StudentClassroomController.php` — Join classroom, live-class token (Jitsi), client-side attendance close-out
- `app/Http/Controllers/Lms/StaffTaskController.php` — Task creation, grading
- `app/Http/Controllers/Lms/StaffAuthController.php` — Login, dashboard stats
- `app/Http/Controllers/Lms/StaffPortalController.php` — Materials CRUD, students, courses
- `app/Models/LmsMessage.php` — Polymorphic chat message model (teacher/student relationships)
- `app/Models/LmsAttendance.php` — Student attendance (fillable includes computed fields)
- `app/Models/LmsAttendanceRecord.php` — Detailed attendance computation records
- `app/Models/LmsModule.php` — Module model (tasks relationship added)
- `app/Models/LmsTask.php` — Task model (module_id fillable, module relationship)
- `routes/web.php` — All API routes
- `database/migrations/2026_07_13_000003_add_module_id_to_tasks.php` — Module-task linking
- `database/migrations/2026_07_15_000001_fix_lms_attendances_columns.php` — Attendance column fixes

### Frontend (jorsas-tech-v2/)
- `src/app/lms/app/page.tsx` — Student dashboard (module progress bar)
- `src/app/lms/app/materials/page.tsx` — Materials with video player
- `src/app/lms/app/classroom/page.tsx` — Classroom (lightweight, no dashboard fetch)
- `src/app/lms/app/tasks/page.tsx` — NEW: student task listing
- `src/app/lms/app/chats/page.tsx` — Student chat with mentions
- `src/app/lms/app/attendance/page.tsx` — Attendance records display
- `src/app/lms/staff/app/page.tsx` — Staff dashboard (group chat with mentions)
- `src/app/lms/staff/chats/page.tsx` — Staff DM chat (fixed dm_thread_id)
- `src/app/lms/staff/tasks/page.tsx` — Staff task CRUD (with module_id field)
- `src/app/lms/staff/materials/page.tsx` — Staff material upload
- `src/components/chat/ChatLayout.tsx` — Chat UI with @mention input, date separators, avatars
- `src/components/StudentSidebar.tsx` — Student navigation (with Tasks link)
- `src/components/StaffSidebar.tsx` — Staff navigation (with Modules link)
- `src/lib/api.ts` — All API endpoint constants
- `src/lib/lms-types.ts` — TypeScript type definitions
- `src/lib/fetch-with-timeout.ts` — 30s AbortController wrapper; auto-retries idempotent GET/HEAD on a fast transient failure (network reset / 5xx), never POST/timeout/401
<!-- END:project-context -->
