/**
 * Record a participant's consent to replay a completed two-player Chess match.
 * @param {unknown} playerIds
 * @param {unknown} requestedBy
 * @param {string} uid
 */
export function getRematchRequestDecision(playerIds, requestedBy, uid) {
  if (!Array.isArray(playerIds) || playerIds.length !== 2
    || !playerIds.every((id) => typeof id === "string")
    || !playerIds.includes(uid)) {
    return { status: "forbidden" };
  }
  const requests = Array.isArray(requestedBy)
    ? requestedBy.filter((id) => typeof id === "string" && playerIds.includes(id))
    : [];
  if (requests.includes(uid)) return { status: "waiting", requestedBy: requests };
  const nextRequests = [...requests, uid];
  return {
    status: nextRequests.length === 2 ? "ready" : "waiting",
    requestedBy: nextRequests,
  };
}
