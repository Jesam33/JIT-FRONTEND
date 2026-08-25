import type { ChatMessage, ChatReaction } from "./lms-types";

// Kept in lock-step with allowedReactionEmojis() on the backend
// (BaseLmsController) and the REACTIONS palette in ChatLayout.
export const REACTION_EMOJIS = ["👍", "❤️", "😂", "🎉", "👏", "😮"];

// Optimistically toggle the viewer's reaction on one message's reaction list.
// Mirrors the server's add/remove toggle so the chip updates instantly; the
// POST response later reconciles to the authoritative counts.
export function toggleReactionLocal(reactions: ChatReaction[] | undefined, emoji: string): ChatReaction[] {
  const list = Array.isArray(reactions) ? reactions.map((r) => ({ ...r })) : [];
  const idx = list.findIndex((r) => r.emoji === emoji);
  if (idx === -1) {
    list.push({ emoji, count: 1, mine: true });
    return list;
  }
  const r = list[idx];
  if (r.mine) {
    const count = Math.max(0, r.count - 1);
    if (count === 0) list.splice(idx, 1);
    else list[idx] = { ...r, count, mine: false };
  } else {
    list[idx] = { ...r, count: r.count + 1, mine: true };
  }
  return list;
}

// Merge authoritative counts from a `reaction.updated` broadcast (counts only)
// into the viewer's local list, preserving the viewer's own `mine` flags.
// Emojis absent from the broadcast have dropped to zero and are removed.
export function mergeReactionCounts(existing: ChatReaction[] | undefined, incoming: ChatReaction[] | undefined): ChatReaction[] {
  const mine = new Set<string>();
  (existing ?? []).forEach((r) => { if (r.mine) mine.add(r.emoji); });
  return (incoming ?? []).map((r) => ({ emoji: r.emoji, count: r.count, mine: mine.has(r.emoji) }));
}

// Replace one message's reactions inside a message list (matched by id).
export function applyReactionsToList<T extends ChatMessage>(list: T[], messageId: number | string, reactions: ChatReaction[]): T[] {
  return list.map((m) => (String(m.id) === String(messageId) ? { ...m, reactions } : m));
}

// Merge a broadcast reaction update into a message list (matched by id).
export function applyReactionBroadcast<T extends ChatMessage>(list: T[], messageId: number | string, incoming: ChatReaction[] | undefined): T[] {
  return list.map((m) => (String(m.id) === String(messageId) ? { ...m, reactions: mergeReactionCounts(m.reactions, incoming) } : m));
}
