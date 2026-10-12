// The link a teacher opens to HOST a live class on 8x8 JaaS (its own tab, not
// an embed). Shared by every "Host" button so they all get the same setup.
//
// The URL fragment is the only way to configure the plain JaaS page:
//   - hideConferenceSubject: no raw "jit-..." room name at the top of the call;
//   - localRecording: the teacher can Record the class straight to their own
//     computer, free, with nothing stored by us or 8x8 (Chrome/Edge on a
//     computer). Everyone in the call is told when recording starts. Jitsi only
//     allows this on its own page, which this is (students' embedded view
//     can't record). 8x8's paid cloud recording stays off (backend JWT).

export type HostToken = { domain: string; app_id: string; room: string; jwt: string };

export function hostClassUrl(p: HostToken): string {
  return (
    `https://${p.domain}/${p.app_id}/${p.room}?jwt=${encodeURIComponent(p.jwt)}` +
    `#config.hideConferenceSubject=true` +
    `&config.localRecording.disable=false` +
    `&config.localRecording.notifyAllParticipants=true`
  );
}
