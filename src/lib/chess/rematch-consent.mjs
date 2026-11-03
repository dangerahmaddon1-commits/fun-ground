/**
 * Record a participant's consent to replay a completed two-player Chess match.
 * @param {unknown} playerIds
 * @param {unknown} requestedBy
 * @param {string} uid
 */
export function getRematchRequestDecision(playerIds, requestedBy, uid) {
  if (!Array.isArray(playerIds) || playerIds.length !== 2
    || !playerIds.every((id) => typeof id === "string")
    || new Set(playerIds).size !== 2
    || !playerIds.includes(uid)) {
    return { status: "forbidden" };
  }
  const requests = Array.isArray(requestedBy)
    ? [...new Set(requestedBy.filter((id) => typeof id === "string" && playerIds.includes(id)))]
    : [];
  if (requests.includes(uid)) return { status: "waiting", requestedBy: requests };
  const nextRequests = [...requests, uid];
  return {
    status: nextRequests.length === 2 ? "ready" : "waiting",
    requestedBy: nextRequests,
  };
}

/**
 * Prevent a rematch from creating a second active match for either player.
 * @param {unknown} playerIds
 * @param {unknown} activeLockOwners
 */
export function getRematchLockDecision(playerIds, activeLockOwners) {
  if (!Array.isArray(playerIds) || playerIds.length !== 2
    || !playerIds.every((id) => typeof id === "string")
    || new Set(playerIds).size !== 2) {
    return { status: "invalid" };
  }
  const active = Array.isArray(activeLockOwners)
    ? playerIds.find((id) => activeLockOwners.includes(id))
    : undefined;
  return active
    ? { status: "conflict", uid: active }
    : { status: "ready" };
}


/**
 * Validate an explicit draw-offer action for a two-player Chess match.
 * @param {unknown} playerIds
 * @param {{byUid?: unknown} | null | undefined} currentOffer
 * @param {string} uid
 * @param {unknown} action
 */
export function getDrawOfferDecision(playerIds, currentOffer, uid, action) {
  if (!Array.isArray(playerIds) || playerIds.length !== 2
    || !playerIds.every((id) => typeof id === "string" && id.length > 0)
    || new Set(playerIds).size !== 2
    || !playerIds.includes(uid)) return { status: "forbidden" };
  if (!["offer", "accept", "decline", "cancel"].includes(action)) return { status: "invalid" };
  const offerBy = typeof currentOffer?.byUid === "string" && playerIds.includes(currentOffer.byUid)
    ? currentOffer.byUid
    : null;
  if (action === "offer") {
    return offerBy && offerBy !== uid ? { status: "conflict" } : { status: "offered", offer: { byUid: uid } };
  }
  if (!offerBy) return { status: "conflict" };
  if (action === "accept") return offerBy === uid ? { status: "conflict" } : { status: "accepted" };
  if (action === "decline") return offerBy === uid ? { status: "conflict" } : { status: "declined" };
  return offerBy === uid ? { status: "cancelled" } : { status: "conflict" };
}
