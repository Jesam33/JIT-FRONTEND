// The link a teacher opens to HOST a live class on 8x8 JaaS (its own tab, not
// an embed). Shared by every "Host" button so they all get the same setup.
//
// The URL fragment is the only way to configure the plain JaaS page:
// hideConferenceSubject removes the raw "jit-..." room name at the top.
//
// Recording is NOT done through Jitsi: on our 8x8 plan its Record button
// (cloud or local) opens an "upgrade to premium" box. Teachers record with our
// own free recorder instead (lib/class-recorder: the browser records the class
// tab and saves the file to their computer).

export type HostToken = { domain: string; app_id: string; room: string; jwt: string };

export function hostClassUrl(p: HostToken): string {
  return `https://${p.domain}/${p.app_id}/${p.room}?jwt=${encodeURIComponent(p.jwt)}#config.hideConferenceSubject=true`;
}
