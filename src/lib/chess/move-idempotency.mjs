/**
 * Compare a retried move request with the move already persisted for its ID.
 * Promotion is normalized so an omitted promotion and an explicit null match.
 * @param {{ uid?: unknown, from?: unknown, to?: unknown, promotion?: unknown } | undefined} previous
 * @param {string} uid
 * @param {{ from: string, to: string, promotion?: string | null }} request
 */
export function isSameChessMoveRequest(previous, uid, request) {
  return previous?.uid === uid
    && previous?.from === request.from
    && previous?.to === request.to
    && (previous?.promotion ?? null) === (request.promotion ?? null);
}
